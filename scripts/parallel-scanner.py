#!/usr/bin/env python3
"""
🚀 PARALLEL SCANNER - Multi-Threaded Fast Scanner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 30 threads párhuzamosan
✅ Real-time progress látható
✅ Queue management (30 SCANNING + 20 PENDING)
✅ Crash recovery
✅ Router-friendly rate limit

USAGE:
    python3 parallel-scanner.py domains.txt
"""

import requests
import psycopg2
import time
import sys
import json
import signal
import threading
from datetime import datetime
from typing import Dict, List
from queue import Queue
from concurrent.futures import ThreadPoolExecutor, as_completed

# ════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ════════════════════════════════════════════════════════════════════

API_URL = "http://localhost:3000/api/scan"
DB_URL = "postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"

# Threading - CONSERVATIVE (WARP still has limits)
MAX_THREADS = 40             # Kevés párhuzamos kapcsolat
THREAD_RATE_LIMIT = 0.7      # 1.2 sec várakozás thread-ek között

# Queue targets - Conservative
TARGET_SCANNING = 40         # Max 15 aktív scan
TARGET_PENDING = 5           # Kis pending queue

# Other
POLL_INTERVAL = 3             # DB status check interval
PROGRESS_FILE = "parallel-scanner-progress.json"
STUCK_TIMEOUT = 120           # Kill scans stuck longer than 120 seconds

# Browser-like headers (to avoid bot detection)
BROWSER_HEADERS = {
    "sec-ch-ua": "\"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\", \"Google Chrome\";v=\"131\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Accept-Encoding": "gzip, deflate, br, zstd", 
    "Accept-Language": "en-US,en;q=0.9",
    "Priority": "u=0, i",
    "Connection": "keep-alive",
}

# ════════════════════════════════════════════════════════════════════
# GLOBAL STATE
# ════════════════════════════════════════════════════════════════════

running = True
stats = {
    'total_created': 0,
    'total_failed': 0,
    'start_time': datetime.now().isoformat(),
    'last_index': -1
}
stats_lock = threading.Lock()

def signal_handler(sig, frame):
    """Ctrl+C handler"""
    global running
    print("\n\n⏸️  Stopping scanner...")
    running = False
    save_progress()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# ════════════════════════════════════════════════════════════════════
# DATABASE
# ════════════════════════════════════════════════════════════════════

def get_queue_status() -> Dict:
    """Get current queue status"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
                COUNT(*) FILTER (WHERE status = 'SCANNING') as scanning,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
                COUNT(*) FILTER (WHERE status = 'FAILED') as failed
            FROM "Scan"
            WHERE "createdAt" > NOW() - INTERVAL '1 hour'
        """)
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        return {
            'pending': row[0] or 0,
            'scanning': row[1] or 0,
            'completed': row[2] or 0,
            'failed': row[3] or 0
        }
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return {'pending': 0, 'scanning': 0, 'completed': 0, 'failed': 0}

def cleanup_stuck_scans(timeout_seconds: int = 720) -> int:
    """Clean up scans stuck in SCANNING status for more than timeout_seconds"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Find stuck scans
        cur.execute("""
            SELECT COUNT(*)
            FROM "Scan"
            WHERE status = 'SCANNING'
            AND "createdAt" < NOW() - make_interval(secs => %s)
        """, (timeout_seconds,))

        stuck_count = cur.fetchone()[0]

        if stuck_count > 0:
            # Update stuck scans to FAILED
            cur.execute("""
                UPDATE "Scan"
                SET
                    status = 'FAILED',
                    "completedAt" = NOW(),
                    error = jsonb_build_object(
                        'error', 'Scan timeout',
                        'message', 'Scan exceeded maximum allowed time (' || %s || 's) and was automatically cleaned up',
                        'cleanedUpAt', NOW()::text
                    )
                WHERE status = 'SCANNING'
                AND "createdAt" < NOW() - make_interval(secs => %s)
            """, (timeout_seconds, timeout_seconds))

            conn.commit()
            print(f"  🧹 Cleaned up {stuck_count} stuck SCANNING scans (older than {timeout_seconds}s)")

        cur.close()
        conn.close()

        return stuck_count

    except Exception as e:
        print(f"❌ Cleanup Error: {e}")
        return 0

# ════════════════════════════════════════════════════════════════════
# API
# ════════════════════════════════════════════════════════════════════

def create_scan(domain: str, index: int, total: int) -> bool:
    """Create scan via API (thread-safe)"""
    try:
        url = domain if domain.startswith('http') else f'https://{domain}'

        response = requests.post(
            API_URL,
            json={'url': url},
            headers=BROWSER_HEADERS,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            
            # Skip duplicates
            if data.get('isDuplicate'):
                return False
            
            # Success!
            with stats_lock:
                stats['total_created'] += 1
                stats['last_index'] = index
            
            print(f"  ✓ [{index}/{total}] {domain}")
            return True
        else:
            with stats_lock:
                stats['total_failed'] += 1
            print(f"  ❌ [{index}/{total}] {domain} - API {response.status_code}")
            return False
            
    except Exception as e:
        with stats_lock:
            stats['total_failed'] += 1
        print(f"  ❌ [{index}/{total}] {domain} - {str(e)[:50]}")
        return False

# ════════════════════════════════════════════════════════════════════
# PROGRESS
# ════════════════════════════════════════════════════════════════════

def save_progress():
    """Save progress to file"""
    try:
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(stats, f, indent=2)
        print(f"\n💾 Progress saved: {stats['last_index']} domains processed")
    except Exception as e:
        print(f"❌ Error saving progress: {e}")

def load_progress() -> int:
    """Load progress - returns last index"""
    try:
        with open(PROGRESS_FILE, 'r') as f:
            saved = json.load(f)
            stats.update(saved)
            print(f"📂 Resumed from index {stats['last_index']}")
            return stats['last_index']
    except FileNotFoundError:
        print("📂 Starting from beginning")
        return -1
    except Exception as e:
        print(f"❌ Error loading progress: {e}")
        return -1

# ════════════════════════════════════════════════════════════════════
# MAIN SCANNER
# ════════════════════════════════════════════════════════════════════

def run_parallel_scanner(domain_file: str):
    """Main parallel scanner loop"""
    
    print("\n" + "═" * 80)
    print("  🚀 PARALLEL SCANNER - Multi-Threaded Edition")
    print("═" * 80)
    print(f"  Threads: {MAX_THREADS} parallel")
    print(f"  Thread Rate Limit: {THREAD_RATE_LIMIT}s (20 scans/sec)")
    print(f"  Target Queue: {TARGET_SCANNING} SCANNING + {TARGET_PENDING} PENDING")
    print("═" * 80 + "\n")
    
    # Load domains
    try:
        with open(domain_file, 'r') as f:
            domains = [line.strip() for line in f if line.strip()]
        print(f"📂 Loaded {len(domains)} domains\n")
    except Exception as e:
        print(f"❌ Error loading domains: {e}")
        sys.exit(1)
    
    # Load progress
    start_index = load_progress() + 1
    current_index = start_index
    
    print(f"🚀 Starting from domain #{current_index}\n")
    
    start_time = time.time()
    last_save = time.time()
    
    # Main loop
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        while running and current_index < len(domains):

            # Cleanup stuck scans (every iteration) - kills scans stuck > 120s
            stuck_cleaned = cleanup_stuck_scans(timeout_seconds=STUCK_TIMEOUT)

            # Get queue status
            queue_status = get_queue_status()
            pending = queue_status['pending']
            scanning = queue_status['scanning']
            completed = queue_status['completed']
            failed = queue_status['failed']

            total_active = pending + scanning
            target_total = TARGET_SCANNING + TARGET_PENDING
            scans_to_create = max(0, target_total - total_active)
            
            # Limit to available domains
            scans_to_create = min(scans_to_create, len(domains) - current_index)
            
            # Runtime
            runtime = time.time() - start_time
            runtime_str = f"{int(runtime // 3600):02d}:{int((runtime % 3600) // 60):02d}:{int(runtime % 60):02d}"
            
            # Progress
            progress_pct = (current_index / len(domains)) * 100
            
            # Display status
            print("\033[H\033[J", end='')  # Clear screen
            print("\n" + "═" * 80)
            print(f"  🚀 PARALLEL SCANNER - {runtime_str}")
            print("═" * 80)
            print(f"  Progress: {current_index}/{len(domains)} ({progress_pct:.1f}%)")
            print(f"  Created: {stats['total_created']} | Failed: {stats['total_failed']}")
            print("─" * 80)
            print(f"  📊 Queue Status:")
            print(f"    PENDING:  {pending:3d} / {TARGET_PENDING} target")
            print(f"    SCANNING: {scanning:3d} / {TARGET_SCANNING} target")
            print(f"    Total Active: {total_active}")
            print(f"    Completed: {completed} | Failed: {failed}")
            if stuck_cleaned > 0:
                print(f"    🧹 Just cleaned: {stuck_cleaned} stuck scans")
            print("─" * 80)
            
            if scans_to_create == 0:
                print(f"  ⏸️  Queue full, waiting {POLL_INTERVAL}s...")
                print("═" * 80)
                time.sleep(POLL_INTERVAL)
                continue
            
            print(f"  🎬 Creating {scans_to_create} scans with {MAX_THREADS} threads...")
            print("═" * 80)
            
            # Prepare batch
            batch_domains = []
            batch_indices = []
            for i in range(scans_to_create):
                if current_index + i >= len(domains):
                    break
                batch_domains.append(domains[current_index + i])
                batch_indices.append(current_index + i)
            
            # Submit all tasks to thread pool
            futures = []
            for domain, index in zip(batch_domains, batch_indices):
                future = executor.submit(create_scan, domain, index, len(domains))
                futures.append(future)
                time.sleep(THREAD_RATE_LIMIT)  # Small delay between submits
            
            # Wait for all to complete
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    print(f"  ❌ Thread error: {e}")
            
            current_index += len(batch_domains)
            
            # Save progress periodically
            if time.time() - last_save > 60:
                save_progress()
                last_save = time.time()
            
            print(f"\n  ✅ Batch complete, waiting {POLL_INTERVAL}s before next round...")
            time.sleep(POLL_INTERVAL)
    
    # Final
    print("\n" + "═" * 80)
    print("  ✅ SCANNER COMPLETE!")
    print("═" * 80)
    print(f"  Total Domains: {len(domains)}")
    print(f"  Scans Created: {stats['total_created']}")
    print(f"  Failed: {stats['total_failed']}")
    final_runtime = time.time() - start_time
    print(f"  Runtime: {int(final_runtime // 3600):02d}:{int((final_runtime % 3600) // 60):02d}:{int(final_runtime % 60):02d}")
    print("═" * 80 + "\n")
    
    save_progress()

# ════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 parallel-scanner.py domains.txt")
        sys.exit(1)
    
    run_parallel_scanner(sys.argv[1])

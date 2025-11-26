#!/usr/bin/env python3
"""
🎯 SIMPLE CONTINUOUS SCANNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Egyszerű, stabil, folyamatos scanner:
✅ Mindig 30 SCANNING fut párhuzamosan
✅ Max 20 PENDING (tartalék)
✅ 1 scan/mp API call (router friendly)
✅ Progress save (crash recovery)
✅ Nem batch-es - szépen végigmegy

HASZNÁLAT:
    python3 simple-continuous-scanner.py domains.txt
"""

import requests
import psycopg2
import time
import sys
import json
import signal
from datetime import datetime
from typing import Dict, Set

# ════════════════════════════════════════════════════════════════════
# KONFIGURÁCIÓ
# ════════════════════════════════════════════════════════════════════

API_URL = "http://localhost:3000/api/scan"
DB_URL = "postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"

TARGET_SCANNING = 30      # Mindig 30 scanning legyen
TARGET_PENDING = 20       # Max 20 pending
API_RATE_LIMIT = 1.0      # 1 scan/másodperc (router friendly)
POLL_INTERVAL = 5         # 5 másodpercenként ellenőriz
PROGRESS_FILE = "simple-scanner-progress.json"

# ════════════════════════════════════════════════════════════════════
# GLOBAL STATE
# ════════════════════════════════════════════════════════════════════

running = True
stats = {
    'total_created': 0,
    'total_completed': 0,
    'total_failed': 0,
    'start_time': datetime.now().isoformat(),
    'last_domain': None,
    'last_index': -1
}

def signal_handler(sig, frame):
    """Ctrl+C handler - graceful shutdown"""
    global running
    print("\n\n⏸️  Stopping scanner... (saving progress)")
    running = False
    save_progress()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# ════════════════════════════════════════════════════════════════════
# DATABASE HELPERS
# ════════════════════════════════════════════════════════════════════

def get_db_status() -> Dict:
    """Get current database status"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Count by status
        cur.execute("""
            SELECT status, COUNT(*) 
            FROM "Scan" 
            WHERE "createdAt" > NOW() - INTERVAL '24 hours'
            GROUP BY status
        """)
        
        status_counts = dict(cur.fetchall())
        
        cur.close()
        conn.close()
        
        return {
            'pending': status_counts.get('PENDING', 0),
            'scanning': status_counts.get('SCANNING', 0),
            'completed': status_counts.get('COMPLETED', 0),
            'failed': status_counts.get('FAILED', 0)
        }
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return {'pending': 0, 'scanning': 0, 'completed': 0, 'failed': 0}

# ════════════════════════════════════════════════════════════════════
# API HELPERS
# ════════════════════════════════════════════════════════════════════

def create_scan(domain: str) -> bool:
    """Create a scan via API (with 1s rate limit)"""
    try:
        url = domain if domain.startswith('http') else f'https://{domain}'
        
        response = requests.post(
            API_URL,
            json={'url': url},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()

            # Check if it's a duplicate
            if data.get('isDuplicate'):
                return False  # Skip duplicates

            # Success!
            stats['total_created'] += 1
            stats['last_domain'] = domain
            return True
        else:
            print(f"  ❌ API error {response.status_code}: {domain}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error creating scan for {domain}: {e}")
        return False

# ════════════════════════════════════════════════════════════════════
# PROGRESS SAVE/LOAD
# ════════════════════════════════════════════════════════════════════

def save_progress():
    """Save progress to JSON file"""
    try:
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(stats, f, indent=2)
        print(f"💾 Progress saved: {stats['last_index']} domains processed")
    except Exception as e:
        print(f"❌ Error saving progress: {e}")

def load_progress() -> int:
    """Load progress from JSON file - returns last index"""
    try:
        with open(PROGRESS_FILE, 'r') as f:
            saved = json.load(f)
            stats.update(saved)
            print(f"📂 Resumed from index {stats['last_index']}")
            return stats['last_index']
    except FileNotFoundError:
        print("📂 No previous progress found - starting from beginning")
        return -1
    except Exception as e:
        print(f"❌ Error loading progress: {e}")
        return -1

# ════════════════════════════════════════════════════════════════════
# MAIN SCANNER LOOP
# ════════════════════════════════════════════════════════════════════

def run_scanner(domain_file: str):
    """Main continuous scanner loop"""
    
    print("\n" + "═" * 80)
    print("  🎯 SIMPLE CONTINUOUS SCANNER")
    print("═" * 80)
    print(f"  Target: {TARGET_SCANNING} SCANNING + {TARGET_PENDING} PENDING")
    print(f"  Rate Limit: {API_RATE_LIMIT} scan/second")
    print(f"  Domain File: {domain_file}")
    print("═" * 80 + "\n")
    
    # Load domains
    try:
        with open(domain_file, 'r') as f:
            domains = [line.strip() for line in f if line.strip()]
        print(f"📂 Loaded {len(domains)} domains\n")
    except Exception as e:
        print(f"❌ Error loading domain file: {e}")
        sys.exit(1)
    
    # Load progress
    start_index = load_progress() + 1
    current_index = start_index
    
    print(f"🚀 Starting from domain #{current_index}\n")
    
    # Main loop
    iteration = 0
    last_save = time.time()
    
    while running and current_index < len(domains):
        iteration += 1
        
        # Get current DB status
        db_status = get_db_status()
        pending = db_status['pending']
        scanning = db_status['scanning']
        completed = db_status['completed']
        failed = db_status['failed']
        
        # Calculate how many scans to create
        total_active = pending + scanning
        target_total = TARGET_SCANNING + TARGET_PENDING
        scans_to_create = max(0, target_total - total_active)
        
        # Display status
        runtime = (datetime.now() - datetime.fromisoformat(stats['start_time'])).total_seconds()
        runtime_str = f"{int(runtime // 3600):02d}:{int((runtime % 3600) // 60):02d}:{int(runtime % 60):02d}"
        
        progress_pct = (current_index / len(domains)) * 100
        
        print("\033[H\033[J", end='')  # Clear screen
        print("\n" + "═" * 80)
        print(f"  🎯 SIMPLE CONTINUOUS SCANNER - {runtime_str}")
        print("═" * 80)
        print(f"  Progress: {current_index}/{len(domains)} ({progress_pct:.1f}%)")
        print(f"  Created: {stats['total_created']} | Completed: {completed} | Failed: {failed}")
        print(f"  Last Domain: {stats['last_domain'] or 'N/A'}")
        print("─" * 80)
        print(f"  📊 Queue Status:")
        print(f"    PENDING:  {pending:3d} / {TARGET_PENDING} target")
        print(f"    SCANNING: {scanning:3d} / {TARGET_SCANNING} target")
        print(f"    Total Active: {total_active}")
        print("─" * 80)
        print(f"  🎬 Action: Creating {scans_to_create} new scans...")
        print("═" * 80)
        
        # Create new scans (with rate limit)
        created_this_round = 0
        for i in range(scans_to_create):
            if current_index >= len(domains):
                break
                
            domain = domains[current_index]
            
            # Create scan
            if create_scan(domain):
                created_this_round += 1
                print(f"  ✓ [{current_index}/{len(domains)}] {domain}")
            
            # Update index
            stats['last_index'] = current_index
            current_index += 1
            
            # Rate limit (1 scan per second)
            time.sleep(API_RATE_LIMIT)
        
        # Save progress every 60 seconds
        if time.time() - last_save > 60:
            save_progress()
            last_save = time.time()
        
        # Wait before next poll
        if scans_to_create == 0:
            print(f"\n  ⏸️  Queue full, waiting {POLL_INTERVAL}s...")
            time.sleep(POLL_INTERVAL)
    
    # Final status
    print("\n" + "═" * 80)
    print("  ✅ SCANNER COMPLETE!")
    print("═" * 80)
    print(f"  Total Domains: {len(domains)}")
    print(f"  Scans Created: {stats['total_created']}")
    print("═" * 80 + "\n")
    
    save_progress()

# ════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 simple-continuous-scanner.py domains.txt")
        sys.exit(1)
    
    run_scanner(sys.argv[1])

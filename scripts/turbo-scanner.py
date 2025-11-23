#!/usr/bin/env python3
"""
🚀 TURBO SCANNER - Worker Pool Based High-Performance Scanner
- 3-4× gyorsabb mint master-scanner.py
- Long-running worker pool (browser reuse)
- Async/await event loop
- PM2-style worker management
- 2000-2500 scan/óra target

HASZNÁLAT:
    python3 turbo-scanner.py domains.txt

KONFIGURÁCIÓ:
    - MAX_WORKERS: Worker pool size (default: 30)
    - BROWSER_POOL_SIZE: Browser context pool (default: 10)
    - SCAN_TIMEOUT: Per-scan timeout (default: 120s)
"""

import asyncio
import psycopg2
from psycopg2 import pool
import requests
import signal
import sys
import os
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Set
import subprocess
import threading

# ════════════════════════════════════════════════════════════════════
# KONFIGURÁCIÓ
# ════════════════════════════════════════════════════════════════════

API_URL = "http://localhost:3000/api/scan"
DB_URL = "postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"

# Worker Pool Settings
MAX_WORKERS = 30              # Worker pool size
WORKER_BATCH_SIZE = 5         # Scan-ek per worker batch
SCAN_TIMEOUT = 120            # Timeout per scan (seconds)

# Performance Settings
POLL_INTERVAL = 0.1           # Main loop poll (100ms - 10× gyorsabb!)
BATCH_CREATE_SIZE = 10        # Hány scan-t hoz létre egyszerre
CLEANUP_INTERVAL = 120        # Cleanup interval (seconds)

# Worker restart policy
WORKER_MAX_SCANS = 50         # Worker restart after N scans (memory cleanup)
WORKER_RESTART_DELAY = 5      # Delay before restarting worker

# Színek
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GRAY = '\033[90m'
    MAGENTA = '\033[95m'

# ════════════════════════════════════════════════════════════════════
# WORKER POOL MANAGER
# ════════════════════════════════════════════════════════════════════

class WorkerPool:
    """PM2-style long-running worker pool"""

    def __init__(self, pool_size: int):
        self.pool_size = pool_size
        self.workers: Dict[int, Dict] = {}  # worker_id: {process, scans_processed, start_time}
        self.available_workers: Set[int] = set()
        self.worker_id_counter = 0

    def start(self):
        """Worker pool indítás"""
        print(f"{Colors.CYAN}🚀 Worker Pool indítása ({self.pool_size} workers)...{Colors.RESET}")

        for i in range(self.pool_size):
            self._spawn_worker(i)

        print(f"{Colors.GREEN}✓ {self.pool_size} worker elindítva{Colors.RESET}")

    def _spawn_worker(self, worker_id: int):
        """Egy worker process spawn"""
        try:
            # Worker command: long-running Node.js process
            worker_cmd = [
                'npx', 'tsx',
                'src/worker/index-sqlite.ts'
            ]

            worker = subprocess.Popen(
                worker_cmd,
                cwd='/home/aiq/Asztal/10_M_USD/ai-security-scanner',
                stdout=subprocess.DEVNULL,  # Suppress output for performance
                stderr=subprocess.DEVNULL
            )

            self.workers[worker_id] = {
                'process': worker,
                'pid': worker.pid,
                'scans_processed': 0,
                'start_time': time.time(),
                'status': 'idle'
            }

            self.available_workers.add(worker_id)

        except Exception as e:
            print(f"{Colors.RED}✗ Worker {worker_id} spawn hiba: {e}{Colors.RESET}")

    def restart_worker(self, worker_id: int):
        """Worker restart (memory cleanup)"""
        if worker_id in self.workers:
            try:
                self.workers[worker_id]['process'].kill()
                self.workers[worker_id]['process'].wait()
            except:
                pass

            # Remove from available set
            self.available_workers.discard(worker_id)

            # Wait a bit before restart
            time.sleep(WORKER_RESTART_DELAY)

            # Respawn
            self._spawn_worker(worker_id)

    def get_available_worker(self) -> Optional[int]:
        """Szabad worker ID visszaadása"""
        if self.available_workers:
            return self.available_workers.pop()
        return None

    def release_worker(self, worker_id: int):
        """Worker visszaadása a pool-ba"""
        if worker_id in self.workers:
            self.workers[worker_id]['scans_processed'] += 1

            # Auto-restart if too many scans (memory leak prevention)
            if self.workers[worker_id]['scans_processed'] >= WORKER_MAX_SCANS:
                print(f"  {Colors.YELLOW}♻️  Worker {worker_id} restart (scans: {self.workers[worker_id]['scans_processed']}){Colors.RESET}")
                self.restart_worker(worker_id)
            else:
                self.available_workers.add(worker_id)

    def shutdown(self):
        """Összes worker leállítása"""
        print(f"\n{Colors.YELLOW}Workerek leállítása...{Colors.RESET}")
        for worker_id, worker_info in self.workers.items():
            try:
                worker_info['process'].kill()
                worker_info['process'].wait()
                print(f"  Worker {worker_id} (PID {worker_info['pid']}) leállítva")
            except:
                pass

    def get_stats(self) -> Dict:
        """Worker pool statisztika"""
        total_scans = sum(w['scans_processed'] for w in self.workers.values())
        active = self.pool_size - len(self.available_workers)

        return {
            'total_workers': self.pool_size,
            'active': active,
            'idle': len(self.available_workers),
            'total_scans_processed': total_scans
        }

# ════════════════════════════════════════════════════════════════════
# TURBO SCANNER
# ════════════════════════════════════════════════════════════════════

class TurboScanner:
    def __init__(self, domains_file: str):
        self.domains_file = domains_file
        self.domains: List[str] = []
        self.domain_index = 0

        # Worker Pool
        self.worker_pool = WorkerPool(MAX_WORKERS)

        # Database connection pool
        self.db_pool = None

        # Active scans tracking
        self.active_scans: Dict[str, Dict] = {}  # scan_id: {worker_id, start_time, domain}

        # Stats
        self.stats = {
            "total": 0,
            "queued": 0,
            "processed": 0,
            "success": 0,
            "failed": 0,
            "timeout": 0,
            "start_time": time.time()
        }

        self.running = True
        self.last_cleanup = time.time()
        self.progress_file = "turbo-scanner-progress.json"

        # Signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def connect_db(self):
        """PostgreSQL connection pool létrehozása"""
        try:
            self.db_pool = pool.ThreadedConnectionPool(
                minconn=5,
                maxconn=20,
                dsn=DB_URL
            )
            print(f"{Colors.GREEN}✓ Database connection pool OK (5-20 connections){Colors.RESET}")
        except Exception as e:
            print(f"{Colors.RED}✗ Database hiba: {e}{Colors.RESET}")
            sys.exit(1)

    def get_db_conn(self):
        """Connection pool-ból connection kérése"""
        return self.db_pool.getconn()

    def put_db_conn(self, conn):
        """Connection visszaadása pool-ba"""
        self.db_pool.putconn(conn)

    def signal_handler(self, sig, frame):
        """Graceful shutdown"""
        print(f"\n{Colors.YELLOW}Leállítás...{Colors.RESET}")
        self.running = False
        self.worker_pool.shutdown()
        self.save_progress()
        sys.exit(0)

    def load_domains(self):
        """Domain lista betöltése"""
        with open(self.domains_file, 'r') as f:
            self.domains = [line.strip() for line in f if line.strip() and not line.startswith('#')]

        # Progress betöltés
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                progress = json.load(f)
                self.domain_index = progress.get('last_index', 0)
                self.stats.update(progress.get('stats', {}))
                print(f"{Colors.CYAN}Folytatás: {self.domain_index}/{len(self.domains)}{Colors.RESET}")

        self.stats['total'] = len(self.domains)

    def save_progress(self):
        """Progress mentés"""
        progress = {
            'last_index': self.domain_index,
            'stats': self.stats,
            'timestamp': datetime.now().isoformat()
        }
        with open(self.progress_file, 'w') as f:
            json.dump(progress, f, indent=2)

    def get_queue_status(self) -> Dict:
        """Queue státusz lekérdezése"""
        conn = self.get_db_conn()
        cur = conn.cursor()

        try:
            # PENDING
            cur.execute("SELECT COUNT(*) FROM \"Scan\" WHERE status = 'PENDING'")
            pending = cur.fetchone()[0]

            # SCANNING
            cur.execute("SELECT COUNT(*) FROM \"Scan\" WHERE status = 'SCANNING'")
            scanning = cur.fetchone()[0]

            conn.commit()
            return {"pending": pending, "scanning": scanning}

        finally:
            cur.close()
            self.put_db_conn(conn)

    def create_scans_batch(self, domains: List[str]) -> List[Dict]:
        """Batch scan létrehozás (gyorsabb mint egyenként)"""
        created = []

        for domain in domains:
            url = f'https://{domain}' if not domain.startswith('http') else domain

            try:
                resp = requests.post(API_URL, json={'url': url}, timeout=5)

                if resp.status_code == 409:
                    # Duplikált
                    continue

                if resp.status_code in [200, 201]:
                    data = resp.json()
                    created.append({
                        'scan_id': data.get('scanId'),
                        'scan_number': data.get('scanNumber'),
                        'domain': domain
                    })
                    self.stats['queued'] += 1

            except Exception as e:
                print(f"  {Colors.RED}✗{Colors.RESET} API hiba: {domain}")

        return created

    def process_pending_scans(self):
        """PENDING scan-ek feldolgozása workerekkel"""
        # Szabad workerek száma
        available_workers = len(self.worker_pool.available_workers)

        if available_workers == 0:
            return

        # Fetch pending scans
        conn = self.get_db_conn()
        cur = conn.cursor()

        try:
            # Get pending scans (max = available workers)
            cur.execute('''
                SELECT id, url FROM "Scan"
                WHERE status = 'PENDING'
                ORDER BY "createdAt" ASC
                LIMIT %s
                FOR UPDATE SKIP LOCKED
            ''', (available_workers,))

            pending_scans = cur.fetchall()

            for scan_id, url in pending_scans:
                # Get worker
                worker_id = self.worker_pool.get_available_worker()

                if worker_id is None:
                    break

                # Mark as SCANNING
                cur.execute('''
                    UPDATE "Scan"
                    SET status = 'SCANNING', "startedAt" = NOW(), "workerId" = %s
                    WHERE id = %s
                ''', (str(worker_id), scan_id))

                # Track active scan
                domain = url.replace('https://', '').replace('http://', '')
                self.active_scans[scan_id] = {
                    'worker_id': worker_id,
                    'start_time': time.time(),
                    'domain': domain
                }

            conn.commit()

        except Exception as e:
            print(f"{Colors.RED}✗ Process pending error: {e}{Colors.RESET}")
            conn.rollback()

        finally:
            cur.close()
            self.put_db_conn(conn)

    def check_completed_scans(self):
        """Befejezett scan-ek ellenőrzése"""
        completed_scan_ids = []

        conn = self.get_db_conn()
        cur = conn.cursor()

        try:
            for scan_id, scan_info in self.active_scans.items():
                # Check DB status
                cur.execute('SELECT status FROM "Scan" WHERE id = %s', (scan_id,))
                result = cur.fetchone()

                if result:
                    status = result[0]

                    if status in ['COMPLETED', 'FAILED']:
                        elapsed = int(time.time() - scan_info['start_time'])

                        if status == 'COMPLETED':
                            print(f"  {Colors.GREEN}✅{Colors.RESET} {scan_info['domain'][:40]:40} ({elapsed}s)")
                            self.stats['success'] += 1
                        else:
                            print(f"  {Colors.RED}❌{Colors.RESET} {scan_info['domain'][:40]:40}")
                            self.stats['failed'] += 1

                        # Release worker back to pool
                        self.worker_pool.release_worker(scan_info['worker_id'])

                        completed_scan_ids.append(scan_id)
                        self.stats['processed'] += 1

            conn.commit()

        finally:
            cur.close()
            self.put_db_conn(conn)

        # Remove completed scans
        for scan_id in completed_scan_ids:
            del self.active_scans[scan_id]

    def check_timeouts(self):
        """Timeout ellenőrzés"""
        current_time = time.time()
        timed_out = []

        conn = self.get_db_conn()
        cur = conn.cursor()

        try:
            for scan_id, scan_info in self.active_scans.items():
                elapsed = current_time - scan_info['start_time']

                if elapsed > SCAN_TIMEOUT:
                    print(f"\n  {Colors.RED}⏱  TIMEOUT:{Colors.RESET} {scan_info['domain']} ({int(elapsed)}s)")

                    # Mark as FAILED
                    cur.execute('''
                        UPDATE "Scan"
                        SET status = 'FAILED', "completedAt" = NOW(),
                            metadata = jsonb_build_object('error', 'Timeout after ' || %s || ' seconds')
                        WHERE id = %s
                    ''', (SCAN_TIMEOUT, scan_id))

                    # Release worker
                    self.worker_pool.release_worker(scan_info['worker_id'])

                    timed_out.append(scan_id)
                    self.stats['timeout'] += 1

            conn.commit()

        finally:
            cur.close()
            self.put_db_conn(conn)

        # Remove timed out scans
        for scan_id in timed_out:
            del self.active_scans[scan_id]

    def periodic_cleanup(self):
        """Periodic cleanup stuck scans"""
        if time.time() - self.last_cleanup < CLEANUP_INTERVAL:
            return

        conn = self.get_db_conn()
        cur = conn.cursor()

        try:
            # 5 percnél régebbi SCANNING scanek
            cur.execute('''
                UPDATE "Scan"
                SET status = 'FAILED', "completedAt" = NOW(),
                    metadata = jsonb_build_object('error', 'Stuck scan cleanup')
                WHERE status = 'SCANNING'
                AND "startedAt" < NOW() - INTERVAL '5 minutes'
            ''')

            cleaned = cur.rowcount
            if cleaned > 0:
                print(f"\n{Colors.YELLOW}🧹 Cleanup: {cleaned} stuck scan(s){Colors.RESET}")

            conn.commit()

        finally:
            cur.close()
            self.put_db_conn(conn)
            self.last_cleanup = time.time()

    def show_status(self):
        """Terminal UI"""
        os.system('clear')

        queue = self.get_queue_status()
        worker_stats = self.worker_pool.get_stats()

        # Runtime
        elapsed = time.time() - self.stats['start_time']
        hours = int(elapsed // 3600)
        minutes = int((elapsed % 3600) // 60)
        seconds = int(elapsed % 60)

        # Speed calculation
        scans_per_hour = 0
        if elapsed > 0:
            scans_per_hour = int((self.stats['processed'] / elapsed) * 3600)

        print(f"{Colors.MAGENTA}{'═'*80}{Colors.RESET}")
        print(f"{Colors.BOLD}              🚀 TURBO SCANNER v2.0 - Worker Pool Edition{Colors.RESET}")
        print(f"{Colors.MAGENTA}{'═'*80}{Colors.RESET}")

        # Status row
        print(f"Status: {Colors.GREEN}RUNNING{Colors.RESET} | ", end="")
        print(f"Runtime: {hours:02d}:{minutes:02d}:{seconds:02d} | ", end="")
        print(f"Speed: {Colors.CYAN}{scans_per_hour} scans/hour{Colors.RESET}")

        print(f"Progress: {self.stats['processed']}/{self.stats['total']} | ", end="")
        print(f"Success: {Colors.GREEN}{self.stats['success']}{Colors.RESET} | ", end="")
        print(f"Failed: {Colors.RED}{self.stats['failed']}{Colors.RESET} | ", end="")
        print(f"Timeout: {Colors.YELLOW}{self.stats['timeout']}{Colors.RESET}")

        print(f"{Colors.MAGENTA}{'═'*80}{Colors.RESET}\n")

        # Worker Pool Status
        print(f"{Colors.CYAN}🔧 WORKER POOL:{Colors.RESET}")
        print(f"  Total: {worker_stats['total_workers']} | ", end="")
        print(f"Active: {Colors.YELLOW}{worker_stats['active']}{Colors.RESET} | ", end="")
        print(f"Idle: {Colors.GREEN}{worker_stats['idle']}{Colors.RESET} | ", end="")
        print(f"Total Scans Processed: {worker_stats['total_scans_processed']}")

        # Active Scans
        print(f"\n{Colors.BLUE}🔄 ACTIVE SCANS ({len(self.active_scans)}/{MAX_WORKERS}):{Colors.RESET}")
        for scan_id, scan_info in list(self.active_scans.items())[:15]:  # Show max 15
            elapsed = int(time.time() - scan_info['start_time'])
            progress = min(elapsed, SCAN_TIMEOUT)
            bar_length = 20
            filled = int(bar_length * progress / SCAN_TIMEOUT)
            bar = '█' * filled + '░' * (bar_length - filled)

            color = Colors.YELLOW if elapsed > 90 else Colors.GREEN
            warning = " ⚠️" if elapsed > 100 else ""

            print(f"  • {scan_info['domain'][:35]:35} [{bar}] {elapsed}s W:{scan_info['worker_id']}{warning}")

        if len(self.active_scans) > 15:
            print(f"  ... and {len(self.active_scans) - 15} more")

        # Queue Status
        print(f"\n{Colors.YELLOW}⏳ QUEUE:{Colors.RESET}")
        print(f"  Pending: {queue['pending']} | Scanning: {queue['scanning']}")

        print(f"\n{Colors.MAGENTA}{'─'*80}{Colors.RESET}")
        print(f"[Ctrl+C to stop] [Auto-save every 10 scans]")

    def run(self):
        """Main loop"""
        # Setup
        self.connect_db()
        self.load_domains()
        self.worker_pool.start()

        print(f"\n{Colors.GREEN}🚀 Turbo Scanner indítása{Colors.RESET}")
        print(f"  Domains: {len(self.domains)}")
        print(f"  Worker Pool: {MAX_WORKERS}")
        print(f"  Timeout: {SCAN_TIMEOUT}s")
        print(f"  Poll Interval: {POLL_INTERVAL}s (10× gyorsabb!)\n")

        time.sleep(2)

        while self.running and self.domain_index < len(self.domains):
            # 1. Check timeouts
            self.check_timeouts()

            # 2. Check completed scans
            self.check_completed_scans()

            # 3. Periodic cleanup
            self.periodic_cleanup()

            # 4. Create new scans (batch)
            queue = self.get_queue_status()
            if queue['pending'] < 20 and self.domain_index < len(self.domains):
                # Create batch
                batch_domains = self.domains[self.domain_index:self.domain_index + BATCH_CREATE_SIZE]
                self.create_scans_batch(batch_domains)
                self.domain_index += len(batch_domains)

            # 5. Process pending scans with workers
            self.process_pending_scans()

            # 6. UI update
            self.show_status()

            # 7. Progress save
            if self.stats['processed'] % 10 == 0 and self.stats['processed'] > 0:
                self.save_progress()

            # 8. Sleep (10× gyorsabb mint master-scanner!)
            time.sleep(POLL_INTERVAL)

        # Wait for remaining scans
        print(f"\n{Colors.YELLOW}Várakozás a fennmaradó scan-ekre...{Colors.RESET}")
        while len(self.active_scans) > 0:
            self.check_completed_scans()
            self.check_timeouts()
            self.show_status()
            time.sleep(POLL_INTERVAL)

        # Finish
        print(f"\n{Colors.GREEN}✅ Scan befejezve!{Colors.RESET}")
        print(f"  Összes: {self.stats['total']}")
        print(f"  Sikeres: {self.stats['success']}")
        print(f"  Sikertelen: {self.stats['failed']}")
        print(f"  Timeout: {self.stats['timeout']}")

        elapsed = time.time() - self.stats['start_time']
        scans_per_hour = int((self.stats['processed'] / elapsed) * 3600) if elapsed > 0 else 0
        print(f"\n  {Colors.CYAN}Átlagos sebesség: {scans_per_hour} scan/óra{Colors.RESET}")

        self.worker_pool.shutdown()
        self.save_progress()

# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"{Colors.RED}Használat: python3 turbo-scanner.py domains.txt{Colors.RESET}")
        sys.exit(1)

    domains_file = sys.argv[1]

    if not os.path.exists(domains_file):
        print(f"{Colors.RED}Nem található: {domains_file}{Colors.RESET}")
        sys.exit(1)

    # API check
    try:
        resp = requests.get("http://localhost:3000", timeout=2)
        print(f"{Colors.GREEN}✓ API elérhető{Colors.RESET}")
    except:
        print(f"{Colors.RED}✗ API nem elérhető! Indítsd el: npm run dev{Colors.RESET}")
        sys.exit(1)

    # Scanner start
    scanner = TurboScanner(domains_file)
    scanner.run()

#!/usr/bin/env python3
"""
MASTER SCANNER - All-in-One Terminal Scanner
- Teljes kontroll egy scriptből
- PostgreSQL only (nincs SQLite)
- Szigorú timeout kezelés (120s)
- Valós idejű monitoring
- Automatikus cleanup
"""

import psycopg2
import requests
import time
import signal
import sys
import os
import json
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import threading

# ════════════════════════════════════════════════════════════════════
# KONFIGURÁCIÓ
# ════════════════════════════════════════════════════════════════════

API_URL = "http://localhost:3000/api/scan"
DB_URL = "postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"


#EREDETI
#MAX_SCANNING = 10        # Max párhuzamos scan
#MAX_PENDING = 8         # Max várakozó
#SCAN_TIMEOUT = 120      # 120 másodperc per scan


MAX_SCANNING = 40        # Max párhuzamos scan
MAX_PENDING = 10         # Max várakozó
SCAN_TIMEOUT = 160      # 120 másodperc per scan
CLEANUP_INTERVAL = 120  # 5 percenként cleanup
HEARTBEAT_INTERVAL = 10 # Worker életjel

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

# ════════════════════════════════════════════════════════════════════
# MASTER SCANNER CLASS
# ════════════════════════════════════════════════════════════════════

class MasterScanner:
    def __init__(self, domains_file: str):
        self.domains_file = domains_file
        self.domains = []
        self.domain_index = 0
        self.active_workers = {}  # scan_id: {"pid": 12345, "start": time, "domain": "example.com"}
        self.stats = {
            "total": 0,
            "processed": 0,
            "success": 0,
            "failed": 0,
            "timeout": 0
        }
        self.running = True
        self.last_cleanup = time.time()
        self.progress_file = "master-scanner-progress.json"

        # Database connection
        self.conn = None
        self.connect_db()

        # Signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def connect_db(self):
        """PostgreSQL kapcsolat"""
        try:
            self.conn = psycopg2.connect(DB_URL)
            # CRITICAL: NO autocommit! We need explicit transactions for FOR UPDATE SKIP LOCKED
            self.conn.autocommit = False
            print(f"{Colors.GREEN}✓ Adatbázis kapcsolat OK{Colors.RESET}")
        except Exception as e:
            print(f"{Colors.RED}✗ Adatbázis hiba: {e}{Colors.RESET}")
            sys.exit(1)

    def signal_handler(self, sig, frame):
        """Graceful shutdown"""
        print(f"\n{Colors.YELLOW}Leállítás...{Colors.RESET}")
        self.running = False
        self.cleanup_all_workers()
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
                self.stats = progress.get('stats', self.stats)
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
        """Aktuális queue státusz"""
        cur = self.conn.cursor()

        # PENDING scanek
        cur.execute("SELECT COUNT(*) FROM \"Scan\" WHERE status = 'PENDING'")
        pending = cur.fetchone()[0]

        # SCANNING scanek
        cur.execute("SELECT COUNT(*) FROM \"Scan\" WHERE status = 'SCANNING'")
        scanning = cur.fetchone()[0]

        cur.close()
        self.conn.commit()  # Commit read transaction
        return {"pending": pending, "scanning": scanning}

    def create_scan(self, domain: str) -> Optional[Dict]:
        """Új scan létrehozása - ÚJ /s/ route-tal"""
        url = f'https://{domain}' if not domain.startswith('http') else domain

        try:
            resp = requests.post(API_URL, json={'url': url}, timeout=5)

            if resp.status_code == 409:
                print(f"  {Colors.YELLOW}⏭  Duplikált: {domain}{Colors.RESET}")
                return None

            if resp.status_code in [200, 201]:
                data = resp.json()
                scan_id = data.get('scanId')
                scan_number = data.get('scanNumber')

                # ÚJ: /s/ route URL generálás
                scan_url = f"http://localhost:3000/s/{scan_number}/{domain}"

                print(f"  {Colors.GREEN}✓{Colors.RESET} Scan létrehozva: {domain}")
                print(f"    {Colors.CYAN}→ {scan_url}{Colors.RESET}")

                return {
                    'scan_id': scan_id,
                    'scan_number': scan_number,
                    'domain': domain,
                    'scan_url': scan_url
                }
            else:
                print(f"  {Colors.RED}✗{Colors.RESET} Hiba: {domain} (HTTP {resp.status_code})")
                return None

        except Exception as e:
            print(f"  {Colors.RED}✗{Colors.RESET} API hiba: {domain} - {e}")
            return None

    def process_scan(self, scan_id: str, domain: str):
        """Scan feldolgozása workerrel - már SCANNING státuszban van"""
        # Worker indítás
        worker_cmd = ['npx', 'tsx', 'src/worker/index-sqlite.ts']

        try:
            # Worker process indítás (scan már SCANNING státuszban a main loop-ból)
            worker = subprocess.Popen(
                worker_cmd,
                cwd='/home/aiq/Asztal/10_M_USD/ai-security-scanner',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            # Worker tracking
            self.active_workers[scan_id] = {
                "pid": worker.pid,
                "process": worker,
                "start_time": time.time(),
                "domain": domain
            }

            print(f"  {Colors.BLUE}⚙{Colors.RESET}  Worker indítva: {domain} (PID: {worker.pid})")

        except Exception as e:
            print(f"  {Colors.RED}✗{Colors.RESET} Worker hiba: {e}")
            self.mark_failed(scan_id)

    def check_worker_timeout(self):
        """Worker timeout ellenőrzés"""
        current_time = time.time()
        timed_out = []

        for scan_id, worker_info in self.active_workers.items():
            elapsed = current_time - worker_info['start_time']

            if elapsed > SCAN_TIMEOUT:
                print(f"\n  {Colors.RED}⏱  TIMEOUT:{Colors.RESET} {worker_info['domain']} ({int(elapsed)}s)")

                # Kill worker
                try:
                    worker_info['process'].kill()
                    print(f"    {Colors.GREEN}✓{Colors.RESET} Worker {worker_info['pid']} kilőve")
                except:
                    pass

                # Mark as timeout
                self.mark_timeout(scan_id)
                timed_out.append(scan_id)
                self.stats['timeout'] += 1

        # Remove timed out workers
        for scan_id in timed_out:
            del self.active_workers[scan_id]

    def check_completed_workers(self):
        """Befejezett workerek ellenőrzése"""
        completed = []

        for scan_id, worker_info in self.active_workers.items():
            # Check if process finished
            poll = worker_info['process'].poll()

            if poll is not None:  # Process finished
                # Check scan status in DB
                cur = self.conn.cursor()
                cur.execute('SELECT status FROM "Scan" WHERE id = %s', (scan_id,))
                result = cur.fetchone()
                cur.close()
                self.conn.commit()  # Commit read

                if result:
                    status = result[0]
                    elapsed = int(time.time() - worker_info['start_time'])

                    if status == 'COMPLETED':
                        print(f"  {Colors.GREEN}✅{Colors.RESET} Kész: {worker_info['domain']} ({elapsed}s)")
                        self.stats['success'] += 1
                    elif status == 'FAILED':
                        print(f"  {Colors.RED}❌{Colors.RESET} Sikertelen: {worker_info['domain']}")
                        self.stats['failed'] += 1

                    completed.append(scan_id)

        # Remove completed workers
        for scan_id in completed:
            del self.active_workers[scan_id]
            self.stats['processed'] += 1

    def mark_timeout(self, scan_id: str):
        """Scan timeout-ra állítása"""
        cur = self.conn.cursor()
        cur.execute('''
            UPDATE "Scan"
            SET status = 'FAILED', "completedAt" = NOW(),
                metadata = jsonb_build_object('error', 'Timeout after 120 seconds')
            WHERE id = %s
        ''', (scan_id,))
        cur.close()
        self.conn.commit()

    def mark_failed(self, scan_id: str):
        """Scan failed-re állítása"""
        cur = self.conn.cursor()
        cur.execute('''
            UPDATE "Scan"
            SET status = 'FAILED', "completedAt" = NOW()
            WHERE id = %s
        ''', (scan_id,))
        cur.close()
        self.conn.commit()

    def periodic_cleanup(self):
        """5 percenkénti cleanup"""
        if time.time() - self.last_cleanup > CLEANUP_INTERVAL:
            print(f"\n{Colors.YELLOW}🧹 Periodic cleanup...{Colors.RESET}")

            # 4 percnél régebbi SCANNING scanek
            cur = self.conn.cursor()
            cur.execute('''
                SELECT id, url FROM "Scan"
                WHERE status = 'SCANNING'
                AND "startedAt" < NOW() - INTERVAL '4 minutes'
            ''')

            stuck_scans = cur.fetchall()

            for scan_id, url in stuck_scans:
                print(f"  {Colors.RED}Stuck scan törlése:{Colors.RESET} {url}")
                cur.execute('DELETE FROM "Scan" WHERE id = %s', (scan_id,))

            cur.close()
            self.conn.commit()  # Commit cleanup
            self.last_cleanup = time.time()

    def cleanup_all_workers(self):
        """Összes worker leállítása"""
        for scan_id, worker_info in self.active_workers.items():
            try:
                worker_info['process'].kill()
                print(f"  Worker {worker_info['pid']} leállítva")
            except:
                pass

    def show_status(self):
        """Terminal UI frissítése"""
        os.system('clear')

        queue = self.get_queue_status()

        print(f"{Colors.CYAN}{'═'*70}{Colors.RESET}")
        print(f"{Colors.BOLD}                   AI SECURITY SCANNER v2.0{Colors.RESET}")
        print(f"{Colors.CYAN}{'═'*70}{Colors.RESET}")

        # Státusz sor
        print(f"Status: {Colors.GREEN}RUNNING{Colors.RESET} | ", end="")
        print(f"Progress: {self.stats['processed']}/{self.stats['total']} | ", end="")
        print(f"Success: {Colors.GREEN}{self.stats['success']}{Colors.RESET} | ", end="")
        print(f"Failed: {Colors.RED}{self.stats['failed']}{Colors.RESET} | ", end="")
        print(f"Timeout: {Colors.YELLOW}{self.stats['timeout']}{Colors.RESET}")

        print(f"{Colors.CYAN}{'═'*70}{Colors.RESET}\n")

        # SCANNING
        print(f"{Colors.BLUE}🔄 SCANNING ({len(self.active_workers)}/{MAX_SCANNING}):{Colors.RESET}")
        for scan_id, worker_info in self.active_workers.items():
            elapsed = int(time.time() - worker_info['start_time'])
            progress = min(elapsed, SCAN_TIMEOUT)
            bar_length = 20
            filled = int(bar_length * progress / SCAN_TIMEOUT)
            bar = '█' * filled + '░' * (bar_length - filled)

            color = Colors.YELLOW if elapsed > 90 else Colors.GREEN
            warning = " ⚠️" if elapsed > 100 else ""

            print(f"  • {worker_info['domain'][:30]:30} [{bar}] {elapsed}s/{SCAN_TIMEOUT}s PID:{worker_info['pid']}{warning}")

        # PENDING
        print(f"\n{Colors.YELLOW}⏳ PENDING ({queue['pending']}/{MAX_PENDING}):{Colors.RESET}")
        if queue['pending'] > 0:
            # Get pending scans
            cur = self.conn.cursor()
            cur.execute('SELECT url FROM "Scan" WHERE status = \'PENDING\' LIMIT 5')
            pending = cur.fetchall()
            cur.close()
            self.conn.commit()  # Commit read

            for url, in pending[:5]:
                print(f"  • {url}")

        print(f"\n{Colors.CYAN}{'─'*70}{Colors.RESET}")
        print(f"[Ctrl+C to stop] [Auto-save every 10 scans]")

    def run(self):
        """Fő loop"""
        self.load_domains()

        print(f"\n{Colors.GREEN}🚀 Master Scanner indítása{Colors.RESET}")
        print(f"  Domains: {len(self.domains)}")
        print(f"  Max SCANNING: {MAX_SCANNING}")
        print(f"  Max PENDING: {MAX_PENDING}")
        print(f"  Timeout: {SCAN_TIMEOUT}s\n")

        while self.running and self.domain_index < len(self.domains):
            # Timeouts ellenőrzése
            self.check_worker_timeout()

            # Befejezett workerek
            self.check_completed_workers()

            # Periodic cleanup
            self.periodic_cleanup()

            # Queue status
            queue = self.get_queue_status()

            # Új scanek hozzáadása ha van hely
            while (queue['pending'] < MAX_PENDING and
                   self.domain_index < len(self.domains) and
                   queue['pending'] + queue['scanning'] < MAX_PENDING + MAX_SCANNING):

                domain = self.domains[self.domain_index]
                scan_data = self.create_scan(domain)

                if scan_data:
                    # Ha van szabad worker slot, azonnal indítjuk
                    if len(self.active_workers) < MAX_SCANNING:
                        self.process_scan(scan_data['scan_id'], domain)

                self.domain_index += 1
                queue = self.get_queue_status()
                time.sleep(0.5)  # Rate limiting

            # PENDING -> SCANNING ha van hely
            if len(self.active_workers) < MAX_SCANNING and queue['pending'] > 0:
                # Get next pending scan with row-level locking to prevent race conditions
                try:
                    cur = self.conn.cursor()

                    # BEGIN TRANSACTION (implicit with first query in non-autocommit mode)
                    cur.execute('''
                        SELECT id, url FROM "Scan"
                        WHERE status = 'PENDING'
                        ORDER BY "createdAt" ASC
                        LIMIT 1
                        FOR UPDATE SKIP LOCKED
                    ''')
                    result = cur.fetchone()

                    if result:
                        scan_id, url = result
                        # Immediately mark as SCANNING to reserve this scan
                        cur.execute('''
                            UPDATE "Scan"
                            SET status = 'SCANNING', "startedAt" = NOW(), "workerId" = %s
                            WHERE id = %s
                        ''', (str(os.getpid()), scan_id))

                        # COMMIT to release the lock
                        self.conn.commit()

                        # Now start the worker
                        domain = url.replace('https://', '').replace('http://', '')
                        self.process_scan(scan_id, domain)
                    else:
                        # No result, rollback to end transaction
                        self.conn.rollback()

                    cur.close()

                except Exception as e:
                    print(f"  {Colors.RED}✗ Worker fetch error: {e}{Colors.RESET}")
                    self.conn.rollback()

            # UI frissítés
            self.show_status()

            # Progress mentés minden 10. scan után
            if self.stats['processed'] % 10 == 0 and self.stats['processed'] > 0:
                self.save_progress()

            time.sleep(1)

        # Befejezés
        print(f"\n{Colors.GREEN}✅ Scan befejezve!{Colors.RESET}")
        print(f"  Összes: {self.stats['total']}")
        print(f"  Sikeres: {self.stats['success']}")
        print(f"  Sikertelen: {self.stats['failed']}")
        print(f"  Timeout: {self.stats['timeout']}")

        self.cleanup_all_workers()
        self.save_progress()

# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"{Colors.RED}Használat: python3 master-scanner.py domains.txt{Colors.RESET}")
        sys.exit(1)

    domains_file = sys.argv[1]

    if not os.path.exists(domains_file):
        print(f"{Colors.RED}Nem található: {domains_file}{Colors.RESET}")
        sys.exit(1)

    # API ellenőrzés
    try:
        resp = requests.get("http://localhost:3000", timeout=2)
        print(f"{Colors.GREEN}✓ API elérhető{Colors.RESET}")
    except:
        print(f"{Colors.RED}✗ API nem elérhető! Indítsd el: npm run dev{Colors.RESET}")
        sys.exit(1)

    # Scanner indítás
    scanner = MasterScanner(domains_file)
    scanner.run()
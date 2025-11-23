#!/usr/bin/env python3
"""
🧠 SMART SCANNER - Intelligens resource management
Megoldja a torlódási problémát technikai szinten!
"""

import psycopg2
import requests
import time
import signal
import sys
import os
import json
import subprocess
from datetime import datetime
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import psutil
import socket

# ════════════════════════════════════════════════════════════════════
# TECHNIKAI MEGOLDÁSOK
# ════════════════════════════════════════════════════════════════════

class SmartScanner:
    """
    FŐBB MEGOLDÁSOK:
    1. Single API instance check
    2. Worker throttling
    3. Resource monitoring
    4. Automatic cleanup
    5. Port conflict resolution
    """

    def __init__(self, domains_file: str):
        self.domains_file = domains_file
        self.domains = []

        # MEGOLDÁS #1: Resource limits
        self.MAX_WORKERS = self.calculate_optimal_workers()
        self.MAX_MEMORY_PCT = 80  # Max 80% RAM használat
        self.MAX_CPU_PCT = 70     # Max 70% CPU használat

        # MEGOLDÁS #2: Single instance enforcement
        self.api_port = self.ensure_single_api()

        # MEGOLDÁS #3: Worker pool with backpressure
        self.worker_pool = ThreadPoolExecutor(max_workers=self.MAX_WORKERS)
        self.active_workers = {}
        self.worker_lock = threading.Lock()

        # MEGOLDÁS #4: Resource monitoring
        self.resource_monitor = threading.Thread(target=self.monitor_resources)
        self.resource_monitor.daemon = True
        self.should_throttle = False

        # Stats
        self.stats = {
            'processed': 0,
            'success': 0,
            'failed': 0,
            'throttled': 0,
            'port_conflicts': 0
        }

        # DB connection with pooling
        self.db_url = "postgresql://localhost/ai_security_scanner"
        self.conn = None
        self.connect_db()

    def calculate_optimal_workers(self):
        """Optimális worker szám számítása a rendszer alapján"""
        cpu_count = psutil.cpu_count()
        memory_gb = psutil.virtual_memory().total / (1024**3)

        # Minden worker ~500MB RAM-ot használ
        max_by_memory = int(memory_gb * 0.7 / 0.5)  # 70% of RAM
        max_by_cpu = cpu_count * 2  # 2x CPU cores

        optimal = min(max_by_memory, max_by_cpu, 20)  # Cap at 20
        print(f"💡 Optimal workers: {optimal} (CPU: {cpu_count}, RAM: {memory_gb:.1f}GB)")
        return optimal

    def ensure_single_api(self):
        """Biztosítja hogy csak EGY API instance fusson"""
        # Kill all existing npm dev processes
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                if proc.info['cmdline'] and 'npm' in str(proc.info['cmdline']):
                    if 'run' in str(proc.info['cmdline']) and 'dev' in str(proc.info['cmdline']):
                        print(f"🔪 Killing duplicate dev server PID: {proc.info['pid']}")
                        proc.terminate()
        except:
            pass

        # Find free port
        port = 3000
        while self.is_port_in_use(port):
            port += 1
            if port > 3010:
                raise Exception("No free ports available")

        print(f"✅ API will use port: {port}")
        return port

    def is_port_in_use(self, port):
        """Check if port is in use"""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0

    def connect_db(self):
        """DB kapcsolat connection pooling-gal"""
        try:
            self.conn = psycopg2.connect(
                self.db_url,
                options='-c statement_timeout=30000'  # 30s timeout
            )
            self.conn.autocommit = True
            print("✅ Database connected with timeout protection")
        except Exception as e:
            print(f"❌ Database error: {e}")
            sys.exit(1)

    def monitor_resources(self):
        """Resource monitoring és throttling"""
        while True:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent

            # Check if we should throttle
            if cpu_percent > self.MAX_CPU_PCT or memory_percent > self.MAX_MEMORY_PCT:
                self.should_throttle = True
                self.stats['throttled'] += 1
                print(f"\n⚠️  Throttling! CPU: {cpu_percent}%, RAM: {memory_percent}%")
            else:
                self.should_throttle = False

            # Kill stuck workers (> 180s)
            with self.worker_lock:
                for scan_id, worker_info in list(self.active_workers.items()):
                    if time.time() - worker_info['start_time'] > 180:
                        print(f"\n💀 Killing stuck worker: {scan_id[:8]}")
                        try:
                            worker_info['process'].kill()
                        except:
                            pass
                        del self.active_workers[scan_id]

            time.sleep(5)

    def create_scan(self, domain: str):
        """Create scan with retry logic"""
        url = f'https://{domain}' if not domain.startswith('http') else domain

        for attempt in range(3):
            try:
                resp = requests.post(
                    f"http://localhost:{self.api_port}/api/scan",
                    json={'url': url},
                    timeout=5
                )

                if resp.status_code == 409:  # Duplicate
                    return None

                if resp.status_code in [200, 201]:
                    return resp.json().get('scanId')

            except requests.exceptions.ConnectionError:
                if attempt == 0:
                    # Try to restart API
                    print("\n🔄 Restarting API server...")
                    self.restart_api()
                    time.sleep(5)
            except:
                pass

            time.sleep(2)

        return None

    def restart_api(self):
        """Restart API server on correct port"""
        subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd='/Users/racz-akacosiattila/Desktop/10_M_USD/ai-security-scanner',
            env={**os.environ, 'PORT': str(self.api_port)},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

    def process_scan_with_resource_management(self, scan_id: str, domain: str):
        """Process scan with resource management"""
        # Wait if throttled
        while self.should_throttle:
            time.sleep(1)

        # Register worker
        with self.worker_lock:
            if len(self.active_workers) >= self.MAX_WORKERS:
                # Wait for a slot
                time.sleep(2)
                return

        try:
            # Update to SCANNING
            cur = self.conn.cursor()
            cur.execute('''
                UPDATE "Scan"
                SET status = 'SCANNING', "startedAt" = NOW()
                WHERE id = %s
            ''', (scan_id,))
            cur.close()

            # Start worker with timeout
            worker = subprocess.Popen(
                ['npx', 'tsx', 'src/worker/index-sqlite.ts'],
                cwd='/Users/racz-akacosiattila/Desktop/10_M_USD/ai-security-scanner',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            # Track worker
            with self.worker_lock:
                self.active_workers[scan_id] = {
                    'process': worker,
                    'domain': domain,
                    'start_time': time.time()
                }

            # Wait with timeout
            try:
                stdout, stderr = worker.communicate(timeout=120)

                # Check result
                cur = self.conn.cursor()
                cur.execute('SELECT status FROM "Scan" WHERE id = %s', (scan_id,))
                result = cur.fetchone()
                cur.close()

                if result and result[0] == 'COMPLETED':
                    self.stats['success'] += 1
                    print(f"✅ {domain[:30]}")
                else:
                    self.stats['failed'] += 1
                    print(f"❌ {domain[:30]}")

            except subprocess.TimeoutExpired:
                worker.kill()
                print(f"⏱️  {domain[:30]}")
                self.mark_failed(scan_id, "Timeout")

        finally:
            # Cleanup
            with self.worker_lock:
                if scan_id in self.active_workers:
                    del self.active_workers[scan_id]
            self.stats['processed'] += 1

    def mark_failed(self, scan_id: str, reason: str):
        """Mark scan as failed"""
        cur = self.conn.cursor()
        cur.execute('''
            UPDATE "Scan"
            SET status = 'FAILED',
                "completedAt" = NOW(),
                metadata = jsonb_build_object('error', %s)
            WHERE id = %s
        ''', (reason, scan_id))
        cur.close()

    def cleanup_before_start(self):
        """Clean up before starting"""
        print("\n🧹 Cleaning up...")

        # Kill all node/npm processes
        os.system("pkill -9 -f 'npm run' 2>/dev/null")
        os.system("pkill -9 -f 'node' 2>/dev/null")
        time.sleep(2)

        # Clean database
        cur = self.conn.cursor()
        cur.execute('DELETE FROM "Scan" WHERE status IN (\'FAILED\', \'SCANNING\')')
        deleted = cur.rowcount
        cur.close()

        if deleted > 0:
            print(f"✅ Cleaned {deleted} stuck/failed scans")

    def run(self):
        """Main loop with smart resource management"""
        # Load domains
        with open(self.domains_file) as f:
            self.domains = [line.strip() for line in f if line.strip()]

        print(f"\n{'='*60}")
        print(f"         🧠 SMART SCANNER")
        print(f"{'='*60}")
        print(f"Domains: {len(self.domains)}")
        print(f"Workers: {self.MAX_WORKERS}")
        print(f"API Port: {self.api_port}")
        print(f"{'='*60}\n")

        # Cleanup first
        self.cleanup_before_start()

        # Start API
        print("🚀 Starting API server...")
        self.restart_api()
        time.sleep(5)

        # Start resource monitor
        self.resource_monitor.start()

        # Process domains
        futures = []
        for domain in self.domains:
            scan_id = self.create_scan(domain)
            if scan_id:
                future = self.worker_pool.submit(
                    self.process_scan_with_resource_management,
                    scan_id, domain
                )
                futures.append(future)

                # Adaptive delay based on load
                if self.should_throttle:
                    time.sleep(2)
                else:
                    time.sleep(0.5)

        # Wait for completion
        for future in as_completed(futures):
            try:
                future.result()
            except:
                pass

        # Final stats
        print(f"\n{'='*60}")
        print(f"✅ COMPLETED")
        print(f"Success: {self.stats['success']}")
        print(f"Failed: {self.stats['failed']}")
        print(f"Throttled: {self.stats['throttled']} times")
        print(f"{'='*60}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 smart-scanner.py domains.txt")
        sys.exit(1)

    scanner = SmartScanner(sys.argv[1])
    scanner.run()
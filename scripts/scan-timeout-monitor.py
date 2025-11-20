#!/usr/bin/env python3
"""
SCAN TIMEOUT MONITOR
Figyeli a SCANNING scaneket és 120 másodperc után törli őket
"""

import psycopg2
import time
import os
import signal
import sys
from datetime import datetime

# Config
DB_URL = "postgresql://localhost/ai_security_scanner"
MAX_SCAN_TIME = 120  # 120 másodperc max
CHECK_INTERVAL = 10  # 10 másodpercenként ellenőriz

# Színek
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
END = '\033[0m'

shutdown = False

def signal_handler(sig, frame):
    global shutdown
    print(f"\n{YELLOW}Leállítás...{END}")
    shutdown = True
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def check_and_kill_old_scans():
    """Ellenőrzi és törli a régi SCANNING scaneket"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Keressük a SCANNING scaneket
        cur.execute('''
            SELECT id, url, "createdAt", "workerId"
            FROM "Scan"
            WHERE status = 'SCANNING'
        ''')

        scanning_scans = cur.fetchall()

        if not scanning_scans:
            print(f"{GREEN}✓{END} Nincs aktív SCANNING scan")
            conn.close()
            return

        print(f"\n{BLUE}📊 {len(scanning_scans)} SCANNING scan található{END}")

        now = datetime.now()
        killed_count = 0

        for scan_id, url, created_at, worker_id in scanning_scans:
            age_seconds = (now - created_at).total_seconds()

            if age_seconds > MAX_SCAN_TIME:
                print(f"\n{RED}⏱  TIMEOUT:{END} {url}")
                print(f"   Kor: {int(age_seconds)}s (max: {MAX_SCAN_TIME}s)")
                print(f"   ID: {scan_id}")

                # Kill worker if exists
                if worker_id:
                    try:
                        os.kill(int(worker_id), 9)
                        print(f"   {GREEN}✓{END} Worker {worker_id} kilőve")
                    except:
                        print(f"   {YELLOW}⚠{END} Worker {worker_id} már halott")

                # Töröljük a scan-t
                cur.execute('DELETE FROM "Scan" WHERE id = %s', (scan_id,))
                conn.commit()
                print(f"   {GREEN}✓{END} Scan törölve")
                killed_count += 1

            else:
                print(f"{BLUE}⚙{END}  Aktív: {url} ({int(age_seconds)}s / {MAX_SCAN_TIME}s)")

        if killed_count > 0:
            print(f"\n{GREEN}✅ {killed_count} timeout scan törölve{END}")

        conn.close()

    except Exception as e:
        print(f"{RED}❌ Hiba: {e}{END}")

def main():
    print(f"{BLUE}{'='*60}{END}")
    print(f"{GREEN}🚀 SCAN TIMEOUT MONITOR{END}")
    print(f"  ⏱  Max scan idő: {MAX_SCAN_TIME} másodperc")
    print(f"  🔄 Ellenőrzés: {CHECK_INTERVAL} másodpercenként")
    print(f"  📊 Adatbázis: PostgreSQL")
    print(f"{BLUE}{'='*60}{END}\n")

    while not shutdown:
        check_and_kill_old_scans()

        # Várakozás
        for i in range(CHECK_INTERVAL):
            if shutdown:
                break
            time.sleep(1)

    print(f"\n{GREEN}Monitor leállítva{END}")

if __name__ == '__main__':
    main()
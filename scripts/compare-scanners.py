#!/usr/bin/env python3
"""
Scanner Performance Comparison
Összehasonlítja a normál és turbo scanner teljesítményét
"""

import time
import subprocess
import sys
import os
import psycopg2
import signal

# Colors
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
CYAN = '\033[96m'
MAGENTA = '\033[95m'
END = '\033[0m'
BOLD = '\033[1m'

DB_URL = "postgresql://localhost/ai_security_scanner"

def clear_database():
    """Clear all scans from database"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Delete all scans
        cur.execute('DELETE FROM "Scan"')
        deleted = cur.rowcount
        conn.commit()

        print(f"{GREEN}✓ {deleted} scan törölve az adatbázisból{END}")

        conn.close()
    except Exception as e:
        print(f"{RED}Adatbázis hiba: {e}{END}")

def count_scans():
    """Count completed scans"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM \"Scan\" WHERE status = 'COMPLETED'")
        completed = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM \"Scan\" WHERE status = 'FAILED'")
        failed = cur.fetchone()[0]

        conn.close()
        return completed, failed
    except:
        return 0, 0

def run_scanner(scanner_type, domains_file, duration=60):
    """Run scanner for specified duration"""

    if scanner_type == "normal":
        script = "master-scanner.py"
        name = "Normal Scanner"
        color = YELLOW
    else:
        script = "master-scanner-turbo.py"
        name = "TURBO Scanner 🚀"
        color = CYAN

    print(f"\n{color}{'='*60}{END}")
    print(f"{BOLD}{color}Testing {name}{END}")
    print(f"{color}{'='*60}{END}")

    # Clear database
    clear_database()

    # Start scanner
    cmd = ['python3', f'scripts/{script}', domains_file]

    print(f"\nIndítás: {' '.join(cmd)}")
    print(f"Futási idő: {duration} másodperc\n")

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    start_time = time.time()

    # Run for specified duration
    try:
        process.wait(timeout=duration)
    except subprocess.TimeoutExpired:
        # Stop the scanner
        process.send_signal(signal.SIGINT)
        time.sleep(2)
        if process.poll() is None:
            process.kill()

    elapsed = time.time() - start_time

    # Get results
    completed, failed = count_scans()
    total = completed + failed

    # Calculate performance
    scans_per_minute = (total / elapsed) * 60 if elapsed > 0 else 0

    print(f"\n{color}Eredmények:{END}")
    print(f"  Futási idő: {elapsed:.1f}s")
    print(f"  Összes scan: {total}")
    print(f"  Sikeres: {GREEN}{completed}{END}")
    print(f"  Sikertelen: {RED}{failed}{END}")
    print(f"  {BOLD}Teljesítmény: {scans_per_minute:.1f} scan/perc{END}")

    return {
        'type': scanner_type,
        'elapsed': elapsed,
        'total': total,
        'completed': completed,
        'failed': failed,
        'scans_per_minute': scans_per_minute
    }

def main():
    if len(sys.argv) < 2:
        print(f"{RED}Használat: python3 compare-scanners.py domains.txt [duration]{END}")
        print(f"  duration: futási idő másodpercben (default: 60)")
        sys.exit(1)

    domains_file = sys.argv[1]
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60

    if not os.path.exists(domains_file):
        print(f"{RED}Nem található: {domains_file}{END}")
        sys.exit(1)

    print(f"{BLUE}{'='*60}{END}")
    print(f"{BOLD}     SCANNER PERFORMANCE COMPARISON{END}")
    print(f"{BLUE}{'='*60}{END}")
    print(f"\nDomains file: {domains_file}")
    print(f"Test duration: {duration} seconds per scanner")

    # Check API
    try:
        import requests
        resp = requests.get("http://localhost:3000", timeout=2)
        print(f"{GREEN}✓ API elérhető{END}")
    except:
        print(f"{RED}✗ API nem elérhető! Indítsd el: npm run dev{END}")
        sys.exit(1)

    # Run normal scanner
    normal_results = run_scanner("normal", domains_file, duration)

    # Wait a bit between tests
    print(f"\n{BLUE}Várakozás 5 másodperc...{END}")
    time.sleep(5)

    # Run turbo scanner
    turbo_results = run_scanner("turbo", domains_file, duration)

    # Show comparison
    print(f"\n{MAGENTA}{'='*60}{END}")
    print(f"{BOLD}{MAGENTA}     ÖSSZEHASONLÍTÁS{END}")
    print(f"{MAGENTA}{'='*60}{END}")

    print(f"\n{BOLD}Teljesítmény:{END}")
    print(f"  Normal Scanner: {YELLOW}{normal_results['scans_per_minute']:.1f} scan/perc{END}")
    print(f"  TURBO Scanner:  {CYAN}{turbo_results['scans_per_minute']:.1f} scan/perc{END}")

    if turbo_results['scans_per_minute'] > 0 and normal_results['scans_per_minute'] > 0:
        speedup = turbo_results['scans_per_minute'] / normal_results['scans_per_minute']
        print(f"\n{BOLD}{GREEN}🚀 TURBO {speedup:.1f}x gyorsabb!{END}")

    print(f"\n{BOLD}Részletek:{END}")
    print(f"  Normal: {normal_results['total']} scan ({normal_results['completed']} sikeres, {normal_results['failed']} sikertelen)")
    print(f"  TURBO:  {turbo_results['total']} scan ({turbo_results['completed']} sikeres, {turbo_results['failed']} sikertelen)")

    # Show improvement areas
    print(f"\n{BOLD}Optimalizációk:{END}")
    print(f"  ✓ Smart URL kategoryzáció (API/Static/Simple/SPA/Complex)")
    print(f"  ✓ Lightweight scannerek (100ms - 1s)")
    print(f"  ✓ Resource blocking (képek, videók, fontok)")
    print(f"  ✓ Parallel processing (30 lightweight + 10 browser)")
    print(f"  ✓ Progressive loading (csak ami kell)")

if __name__ == '__main__':
    main()
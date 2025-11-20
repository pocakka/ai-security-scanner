#!/usr/bin/env python3
"""
DIRECT SCAN - Egyszerű, átlátható bulk scanner
- Direkt API hívások a Next.js /api/scan endpoint-ra
- Minden kiírva a terminálba
- Folytatás támogatás
- Tiszta, követhető működés
"""

import requests
import time
import sys
import json
import os
from datetime import datetime
import signal

# ========================================
# KONFIGURÁCIÓ
# ========================================
API_URL = "http://localhost:3000/api/scan"
PROGRESS_FILE = "direct-scan-progress.json"
BATCH_SIZE = 5  # Egyszerre ennyi scan fut
POLL_INTERVAL = 3  # 3 másodpercenként ellenőrzi a státuszt
SCAN_TIMEOUT = 90  # Max 90 másodperc per scan

# Színes output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

# Globális változók
shutdown = False
stats = {
    'total': 0,
    'processed': 0,
    'success': 0,
    'failed': 0,
    'active': []
}

def signal_handler(sig, frame):
    global shutdown
    print(f"\n{Colors.YELLOW}⚠️  Leállítás... (progress mentve){Colors.END}")
    shutdown = True

signal.signal(signal.SIGINT, signal_handler)

# ========================================
# PROGRESS KEZELÉS
# ========================================
def load_progress():
    """Betölti a korábbi haladást"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {
        'processed': [],
        'failed': [],
        'last_index': 0
    }

def save_progress(progress):
    """Menti a haladást"""
    progress['timestamp'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

# ========================================
# SCAN FUNKCIÓK
# ========================================
def create_scan(domain):
    """Létrehoz egy új scan-t"""
    url = f'https://{domain}' if not domain.startswith('http') else domain

    try:
        resp = requests.post(API_URL, json={'url': url}, timeout=10)

        if resp.status_code == 409:
            print(f"  {Colors.YELLOW}⏭  Duplikált: {domain}{Colors.END}")
            return None

        if resp.status_code in [200, 201]:
            data = resp.json()
            scan_id = data.get('scanId')
            print(f"  {Colors.GREEN}✓{Colors.END} Scan létrehozva: {domain} → {scan_id[:8]}...")
            return {
                'domain': domain,
                'scan_id': scan_id,
                'start_time': time.time(),
                'status': 'PENDING'
            }
        else:
            print(f"  {Colors.RED}✗{Colors.END} Hiba: {domain} (HTTP {resp.status_code})")
            return None

    except Exception as e:
        print(f"  {Colors.RED}✗{Colors.END} Hiba: {domain} - {str(e)[:50]}")
        return None

def check_scan_status(scan):
    """Ellenőrzi egy scan státuszát"""
    try:
        resp = requests.get(f"{API_URL}/{scan['scan_id']}", timeout=5)

        if resp.status_code == 200:
            data = resp.json()
            status = data.get('status')

            if status != scan['status']:
                # Státusz változott
                scan['status'] = status

                if status == 'SCANNING':
                    print(f"  {Colors.BLUE}⚙{Colors.END}  Scanning: {scan['domain']}")
                elif status == 'COMPLETED':
                    risk = data.get('riskScore', 0)
                    elapsed = int(time.time() - scan['start_time'])
                    print(f"  {Colors.GREEN}✅{Colors.END} Kész: {scan['domain']} (Risk: {risk}, Idő: {elapsed}s)")
                    return 'COMPLETED'
                elif status == 'FAILED':
                    print(f"  {Colors.RED}❌{Colors.END} Sikertelen: {scan['domain']}")
                    return 'FAILED'

            # Timeout ellenőrzés
            if time.time() - scan['start_time'] > SCAN_TIMEOUT:
                print(f"  {Colors.YELLOW}⏱{Colors.END}  Timeout: {scan['domain']}")
                return 'TIMEOUT'

            return status

    except Exception as e:
        print(f"  {Colors.RED}!{Colors.END} Ellenőrzés hiba: {scan['domain'][:30]}")
        return 'ERROR'

# ========================================
# FŐ FELDOLGOZÓ
# ========================================
def process_domains(domains_file):
    """Fő feldolgozó loop"""
    global shutdown, stats

    # Betöltés
    print(f"\n{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}📋 DIRECT SCAN - Egyszerű bulk scanner{Colors.END}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}\n")

    # Domain lista olvasás
    with open(domains_file, 'r') as f:
        all_domains = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Progress betöltés
    progress = load_progress()
    processed = set(progress['processed'])

    # Mi maradt hátra?
    remaining = [d for d in all_domains if d not in processed]
    start_index = progress.get('last_index', 0)

    print(f"📊 Statisztika:")
    print(f"  Összes domain: {len(all_domains)}")
    print(f"  Már feldolgozva: {Colors.GREEN}{len(processed)}{Colors.END}")
    print(f"  Hátra van: {Colors.YELLOW}{len(remaining)}{Colors.END}")
    print(f"  Batch méret: {BATCH_SIZE}")
    print(f"  Kezdés: index {start_index}")
    print(f"\n{Colors.CYAN}{'='*60}{Colors.END}\n")

    # Aktív scan-ek
    active_scans = []
    domain_index = start_index

    # Fő loop
    while domain_index < len(remaining) or active_scans:

        if shutdown:
            print(f"\n{Colors.YELLOW}Mentés és kilépés...{Colors.END}")
            progress['last_index'] = domain_index
            save_progress(progress)
            break

        # Új scan-ek indítása ha van hely
        while len(active_scans) < BATCH_SIZE and domain_index < len(remaining):
            domain = remaining[domain_index]

            print(f"\n[{domain_index+1}/{len(remaining)}] {Colors.BOLD}{domain}{Colors.END}")

            scan = create_scan(domain)
            if scan:
                active_scans.append(scan)
            else:
                # Hibás vagy duplikált
                progress['processed'].append(domain)

            domain_index += 1
            time.sleep(0.5)  # Kis delay az API terhelés miatt

        # Aktív scan-ek ellenőrzése
        if active_scans:
            print(f"\n{Colors.CYAN}[Aktív: {len(active_scans)}]{Colors.END}")

            completed_scans = []
            for scan in active_scans:
                status = check_scan_status(scan)

                if status in ['COMPLETED', 'FAILED', 'TIMEOUT', 'ERROR']:
                    completed_scans.append(scan)
                    progress['processed'].append(scan['domain'])

                    if status == 'COMPLETED':
                        stats['success'] += 1
                    else:
                        stats['failed'] += 1
                        progress.setdefault('failed', []).append(scan['domain'])

            # Eltávolítjuk a kész scan-eket
            for scan in completed_scans:
                active_scans.remove(scan)

            # Progress mentés minden 10 scan után
            if len(progress['processed']) % 10 == 0:
                save_progress(progress)
                print(f"\n  {Colors.GREEN}💾 Progress mentve{Colors.END}")

            # Várakozás következő ellenőrzésig
            time.sleep(POLL_INTERVAL)

        # Statisztika kiírás
        if domain_index % 20 == 0 or not active_scans:
            print(f"\n{Colors.CYAN}📊 Eddig: {len(progress['processed'])}/{len(all_domains)} | Siker: {stats['success']} | Hiba: {stats['failed']}{Colors.END}")

    # Végső mentés
    save_progress(progress)

    # Összegzés
    print(f"\n{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}✅ BEFEJEZVE{Colors.END}")
    print(f"  Feldolgozva: {len(progress['processed'])}")
    print(f"  Sikeres: {Colors.GREEN}{stats['success']}{Colors.END}")
    print(f"  Sikertelen: {Colors.RED}{stats['failed']}{Colors.END}")
    print(f"  Progress mentve: {PROGRESS_FILE}")
    print(f"{Colors.CYAN}{'='*60}{Colors.END}\n")

# ========================================
# MAIN
# ========================================
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"{Colors.RED}Használat: python3 direct-scan.py domains.txt{Colors.END}")
        sys.exit(1)

    domains_file = sys.argv[1]

    if not os.path.exists(domains_file):
        print(f"{Colors.RED}Nem található: {domains_file}{Colors.END}")
        sys.exit(1)

    # API ellenőrzés
    try:
        resp = requests.get("http://localhost:3000", timeout=2)
        print(f"{Colors.GREEN}✓ API elérhető{Colors.END}")
    except:
        print(f"{Colors.RED}✗ API nem elérhető! Indítsd el: npm run dev{Colors.END}")
        sys.exit(1)

    # Feldolgozás
    process_domains(domains_file)
#!/usr/bin/env python3
"""
BATCH SCAN CREATOR - PM2 Compatible
- Creates PENDING scans from domain file
- Does NOT spawn workers (PM2 handles that)
- Fast batch creation (parallel API calls)
"""

import requests
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

API_URL = "http://localhost:3000/api/scan"
MAX_CONCURRENT = 20  # Parallel API calls

class Colors:
    RESET = '\033[0m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'

def create_scan(domain: str) -> dict:
    """Create single scan via API"""
    url = f'https://{domain}' if not domain.startswith('http') else domain

    try:
        resp = requests.post(API_URL, json={'url': url}, timeout=5)

        if resp.status_code == 409:
            return {'status': 'duplicate', 'domain': domain}

        if resp.status_code in [200, 201]:
            data = resp.json()
            return {
                'status': 'created',
                'domain': domain,
                'scan_id': data.get('scanId'),
                'scan_number': data.get('scanNumber')
            }
        else:
            return {'status': 'error', 'domain': domain, 'code': resp.status_code}

    except Exception as e:
        return {'status': 'error', 'domain': domain, 'error': str(e)}

def batch_create_scans(domains_file: str):
    """Batch create scans with parallel API calls"""

    # Load domains
    with open(domains_file, 'r') as f:
        domains = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    print(f"{Colors.CYAN}📦 Batch Scan Creator{Colors.RESET}")
    print(f"  Domains: {len(domains)}")
    print(f"  Concurrent API calls: {MAX_CONCURRENT}")
    print()

    # Statistics
    stats = {
        'created': 0,
        'duplicate': 0,
        'error': 0
    }

    start_time = time.time()

    # Parallel API calls
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT) as executor:
        futures = {executor.submit(create_scan, domain): domain for domain in domains}

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()

            if result['status'] == 'created':
                print(f"  {Colors.GREEN}✓{Colors.RESET} {result['domain'][:50]:50} (#{result['scan_number']})")
                stats['created'] += 1
            elif result['status'] == 'duplicate':
                print(f"  {Colors.YELLOW}⏭{Colors.RESET}  {result['domain'][:50]:50} (duplicate)")
                stats['duplicate'] += 1
            else:
                print(f"  {Colors.RED}✗{Colors.RESET} {result['domain'][:50]:50} (error)")
                stats['error'] += 1

            # Progress
            if i % 50 == 0:
                elapsed = time.time() - start_time
                rate = i / elapsed if elapsed > 0 else 0
                print(f"\n  Progress: {i}/{len(domains)} ({rate:.1f} scans/sec)\n")

    # Summary
    elapsed = time.time() - start_time
    print()
    print(f"{Colors.CYAN}{'═'*70}{Colors.RESET}")
    print(f"{Colors.GREEN}✅ Batch creation complete!{Colors.RESET}")
    print(f"  Created: {stats['created']}")
    print(f"  Duplicates: {stats['duplicate']}")
    print(f"  Errors: {stats['error']}")
    print(f"  Time: {elapsed:.1f}s ({len(domains)/elapsed:.1f} scans/sec)")
    print()
    print(f"{Colors.CYAN}🚀 PM2 workers will now process the queue!{Colors.RESET}")
    print(f"  Monitor: pm2 logs analyzer-worker")
    print(f"{Colors.CYAN}{'═'*70}{Colors.RESET}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"{Colors.RED}Usage: python3 batch-create-scans.py domains.txt{Colors.RESET}")
        sys.exit(1)

    domains_file = sys.argv[1]

    # Check API
    try:
        resp = requests.get("http://localhost:3000", timeout=2)
        print(f"{Colors.GREEN}✓ API available{Colors.RESET}")
    except:
        print(f"{Colors.RED}✗ API not available! Start: npm run dev{Colors.RESET}")
        sys.exit(1)

    batch_create_scans(domains_file)

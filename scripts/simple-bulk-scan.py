#!/usr/bin/env python3
"""
SIMPLE BULK SCANNER - Direct scan without workers
No queue, no workers, just direct API calls with controlled parallelism
"""

import requests
import time
import sys
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import signal

# ========================================
# CONFIGURATION
# ========================================
API_URL = "http://localhost:3000/api/scan"
MAX_PARALLEL = 3  # Only 3 parallel scans at once (very conservative!)
SCAN_TIMEOUT = 60  # 60 seconds per scan max
DELAY_BETWEEN_SCANS = 2  # 2 second delay between starting new scans

# Stats
stats = {
    'total': 0,
    'completed': 0,
    'failed': 0,
    'in_progress': 0
}

# Graceful shutdown
shutdown = False

def signal_handler(sig, frame):
    global shutdown
    print("\n\n⚠️  Shutting down gracefully...")
    shutdown = True

signal.signal(signal.SIGINT, signal_handler)

# ========================================
# SCAN FUNCTION
# ========================================
def scan_domain(domain):
    """Scan a single domain and wait for completion"""
    global shutdown

    if shutdown:
        return None

    url = f'https://{domain}' if not domain.startswith('http') else domain

    try:
        # Create scan
        print(f"  🔍 Starting: {domain}")
        resp = requests.post(API_URL, json={'url': url}, timeout=10)

        if resp.status_code == 409:
            print(f"  ⏭️  Skipped (duplicate): {domain}")
            return {'domain': domain, 'status': 'duplicate'}

        if resp.status_code not in [200, 201]:
            print(f"  ❌ Failed to create: {domain}")
            return {'domain': domain, 'status': 'failed'}

        data = resp.json()
        scan_id = data.get('scanId')

        if not scan_id:
            print(f"  ❌ No scan ID: {domain}")
            return {'domain': domain, 'status': 'failed'}

        # Wait for scan to complete (polling)
        start_time = time.time()
        while not shutdown:
            # Check if timeout exceeded
            if time.time() - start_time > SCAN_TIMEOUT:
                print(f"  ⏱️  Timeout: {domain}")
                return {'domain': domain, 'status': 'timeout'}

            # Check scan status
            check_resp = requests.get(f"{API_URL}/{scan_id}", timeout=10)
            if check_resp.status_code == 200:
                scan_data = check_resp.json()
                status = scan_data.get('status')

                if status == 'COMPLETED':
                    risk_score = scan_data.get('riskScore', 0)
                    print(f"  ✅ Completed: {domain} (Risk: {risk_score})")
                    return {
                        'domain': domain,
                        'status': 'completed',
                        'risk_score': risk_score,
                        'scan_id': scan_id
                    }
                elif status == 'FAILED':
                    print(f"  ❌ Scan failed: {domain}")
                    return {'domain': domain, 'status': 'failed'}

            # Wait before next check
            time.sleep(5)

    except Exception as e:
        print(f"  ❌ Error: {domain} - {str(e)[:50]}")
        return {'domain': domain, 'status': 'error', 'error': str(e)}

    return None

# ========================================
# MAIN FUNCTION
# ========================================
def main():
    if len(sys.argv) < 2:
        print("Usage: python3 simple-bulk-scan.py domains.txt")
        sys.exit(1)

    domains_file = sys.argv[1]

    # Read domains
    print(f"\n📂 Reading domains from: {domains_file}")
    with open(domains_file) as f:
        all_domains = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Take only first 100 for testing (remove this limit for production)
    domains = all_domains[:100]  # LIMIT FOR TESTING

    stats['total'] = len(domains)

    print(f"\n📊 SIMPLE BULK SCAN")
    print(f"   Total domains: {len(domains)}")
    print(f"   Parallel scans: {MAX_PARALLEL}")
    print(f"   Timeout per scan: {SCAN_TIMEOUT}s")
    print(f"   Delay between scans: {DELAY_BETWEEN_SCANS}s")
    print(f"\n{'='*50}\n")

    results = []

    # Process domains with controlled parallelism
    with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as executor:
        # Submit domains with delay
        futures = []
        for i, domain in enumerate(domains):
            if shutdown:
                break

            # Submit the scan
            future = executor.submit(scan_domain, domain)
            futures.append(future)

            # Show progress
            stats['in_progress'] = len([f for f in futures if not f.done()])
            print(f"\n[{i+1}/{len(domains)}] Submitted: {domain}")
            print(f"   In progress: {stats['in_progress']} | Completed: {stats['completed']} | Failed: {stats['failed']}")

            # Delay before next submission (except for first batch)
            if i >= MAX_PARALLEL - 1:
                time.sleep(DELAY_BETWEEN_SCANS)

            # If we have MAX_PARALLEL running, wait for one to complete
            if len([f for f in futures if not f.done()]) >= MAX_PARALLEL:
                # Wait for at least one to complete
                for future in as_completed(futures):
                    result = future.result()
                    if result:
                        results.append(result)
                        if result['status'] == 'completed':
                            stats['completed'] += 1
                        else:
                            stats['failed'] += 1
                    break  # Process just one completion

    # Wait for remaining futures
    print("\n⏳ Waiting for remaining scans to complete...")
    for future in as_completed(futures):
        if not future.done():
            result = future.result()
            if result:
                results.append(result)
                if result['status'] == 'completed':
                    stats['completed'] += 1
                else:
                    stats['failed'] += 1

    # Final report
    print(f"\n{'='*50}")
    print(f"\n✅ SCAN COMPLETE")
    print(f"   Total: {stats['total']}")
    print(f"   Completed: {stats['completed']}")
    print(f"   Failed: {stats['failed']}")

    # Save results
    output_file = f"scan_results_{int(time.time())}.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n📁 Results saved to: {output_file}\n")

if __name__ == '__main__':
    main()
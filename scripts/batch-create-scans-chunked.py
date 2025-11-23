#!/usr/bin/env python3
"""
Batch Create Scans - Chunked Version
Creates PENDING scans in batches to avoid rate limiting

Usage:
    python3 scripts/batch-create-scans-chunked.py domains.txt [--batch-size 100] [--delay 5]
"""

import sys
import requests
import time
from pathlib import Path

def create_scan(url: str, api_base: str = "http://localhost:3000") -> dict:
    """Create a single PENDING scan via API"""
    try:
        response = requests.post(
            f"{api_base}/api/scan",
            json={"url": url},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            return {"success": True, "scanId": data.get("scanId"), "url": url}
        else:
            return {"success": False, "error": response.text, "url": url}
    except Exception as e:
        return {"success": False, "error": str(e), "url": url}

def process_batch(domains: list, batch_num: int, total_batches: int) -> tuple:
    """Process a single batch of domains"""
    print(f"\n{'='*60}")
    print(f"📦 Batch {batch_num}/{total_batches} - Processing {len(domains)} domains")
    print(f"{'='*60}\n")

    success_count = 0
    error_count = 0
    errors = []

    for i, domain in enumerate(domains, 1):
        url = domain if domain.startswith(('http://', 'https://')) else f'https://{domain}'
        result = create_scan(url)

        if result["success"]:
            success_count += 1
            print(f"  ✓ {domain:50s} (scan #{result['scanId']})")
        else:
            error_count += 1
            error_msg = result['error'][:50] if len(result['error']) > 50 else result['error']
            print(f"  ✗ {domain:50s} ({error_msg})")
            errors.append({"domain": domain, "error": result['error']})

        # Small delay between requests within batch
        if i < len(domains):
            time.sleep(0.1)

    print(f"\n{'='*60}")
    print(f"Batch {batch_num} Results:")
    print(f"  ✓ Success: {success_count}")
    print(f"  ✗ Errors:  {error_count}")
    print(f"{'='*60}")

    return success_count, error_count, errors

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 batch-create-scans-chunked.py domains.txt [--batch-size 100] [--delay 5]")
        sys.exit(1)

    domain_file = sys.argv[1]
    batch_size = 100
    delay_between_batches = 5

    # Parse optional arguments
    for i, arg in enumerate(sys.argv):
        if arg == "--batch-size" and i + 1 < len(sys.argv):
            batch_size = int(sys.argv[i + 1])
        elif arg == "--delay" and i + 1 < len(sys.argv):
            delay_between_batches = int(sys.argv[i + 1])

    # Read domains
    with open(domain_file, 'r') as f:
        all_domains = [
            line.strip()
            for line in f
            if line.strip() and not line.strip().startswith('#')
        ]

    total_domains = len(all_domains)
    total_batches = (total_domains + batch_size - 1) // batch_size

    print(f"\n{'='*60}")
    print(f"🚀 BATCH SCAN CREATION")
    print(f"{'='*60}")
    print(f"Total domains:        {total_domains}")
    print(f"Batch size:           {batch_size}")
    print(f"Total batches:        {total_batches}")
    print(f"Delay between:        {delay_between_batches}s")
    print(f"{'='*60}\n")

    # Statistics
    total_success = 0
    total_errors = 0
    all_errors = []

    start_time = time.time()

    # Process in batches
    for batch_num in range(1, total_batches + 1):
        start_idx = (batch_num - 1) * batch_size
        end_idx = min(start_idx + batch_size, total_domains)
        batch_domains = all_domains[start_idx:end_idx]

        # Process batch
        success, errors, error_details = process_batch(batch_domains, batch_num, total_batches)
        total_success += success
        total_errors += errors
        all_errors.extend(error_details)

        # Delay between batches (except after last batch)
        if batch_num < total_batches:
            print(f"\n⏳ Waiting {delay_between_batches}s before next batch...\n")
            time.sleep(delay_between_batches)

    # Final summary
    elapsed_time = time.time() - start_time

    print(f"\n{'='*60}")
    print(f"✅ FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Total processed:      {total_domains}")
    print(f"✓ Successful:         {total_success} ({total_success/total_domains*100:.1f}%)")
    print(f"✗ Errors:             {total_errors} ({total_errors/total_domains*100:.1f}%)")
    print(f"Time elapsed:         {elapsed_time:.1f}s")
    print(f"Average speed:        {total_domains/elapsed_time:.2f} scans/sec")
    print(f"{'='*60}\n")

    # Write errors to file if any
    if all_errors:
        error_file = domain_file.replace('.txt', '_errors.txt')
        with open(error_file, 'w') as f:
            f.write("# Domains that failed to create scans\n")
            f.write(f"# Total errors: {len(all_errors)}\n\n")
            for err in all_errors:
                f.write(f"{err['domain']}\n")

        print(f"⚠️  Failed domains saved to: {error_file}")
        print(f"    You can retry these later.\n")

if __name__ == "__main__":
    main()

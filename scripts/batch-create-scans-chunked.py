#!/usr/bin/env python3
"""
Batch Create Scans - Chunked Version with Network Resilience
Creates PENDING scans in batches to avoid rate limiting

Features:
- Network health checks before each batch
- Automatic retry on network failures
- Exponential backoff on errors
- No domains lost due to temporary network issues

Usage:
    python3 scripts/batch-create-scans-chunked.py domains.txt [--batch-size 100] [--delay 5] [--max-retries 3]
"""

import sys
import requests
import time
import socket
from pathlib import Path

def check_network_health() -> bool:
    """
    Check if network is working by pinging multiple reliable hosts
    Returns True if network is healthy, False otherwise
    """
    test_hosts = [
        ("8.8.8.8", 53),      # Google DNS
        ("1.1.1.1", 53),      # Cloudflare DNS
        ("208.67.222.222", 53) # OpenDNS
    ]

    for host, port in test_hosts:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex((host, port))
            sock.close()
            if result == 0:
                return True
        except:
            continue

    return False

def wait_for_network(max_attempts: int = 6, delay: int = 10) -> bool:
    """
    Wait for network to come back online
    Returns True if network recovered, False if max attempts reached
    """
    for attempt in range(1, max_attempts + 1):
        print(f"  ⚠️  Network issue detected. Attempt {attempt}/{max_attempts} - waiting {delay}s...")
        time.sleep(delay)

        if check_network_health():
            print(f"  ✓ Network recovered!")
            return True

    return False

def create_scan(url: str, api_base: str = "http://localhost:3000", max_retries: int = 3) -> dict:
    """
    Create a single PENDING scan via API with retry logic
    """
    last_error = None

    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{api_base}/api/scan",
                json={"url": url},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                is_duplicate = data.get("isDuplicate", False)
                return {
                    "success": True,
                    "scanId": data.get("scanId"),
                    "url": url,
                    "attempts": attempt + 1,
                    "isDuplicate": is_duplicate
                }
            else:
                last_error = response.text

        except (requests.exceptions.ConnectionError,
                requests.exceptions.Timeout,
                requests.exceptions.RequestException) as e:
            last_error = str(e)

            # Network error - wait a bit before retry
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                time.sleep(wait_time)
                continue

    return {"success": False, "error": last_error, "url": url, "attempts": max_retries}

def process_batch(domains: list, batch_num: int, total_batches: int, max_retries: int = 3) -> tuple:
    """Process a single batch of domains with network health check"""

    # Network health check before starting batch
    print(f"\n{'='*60}")
    print(f"📦 Batch {batch_num}/{total_batches} - {len(domains)} domains")
    print(f"{'='*60}")

    # Check network health
    print(f"🌐 Checking network health...")
    if not check_network_health():
        print(f"⚠️  Network appears down. Waiting for recovery...")
        if not wait_for_network():
            print(f"❌ Network recovery failed. Skipping batch.")
            return 0, len(domains), [{"domain": d, "error": "Network down"} for d in domains]
    else:
        print(f"✓ Network is healthy\n")

    success_count = 0
    error_count = 0
    errors = []
    retry_count = 0
    duplicate_count = 0

    for i, domain in enumerate(domains, 1):
        url = domain if domain.startswith(('http://', 'https://')) else f'https://{domain}'
        result = create_scan(url, max_retries=max_retries)

        if result["success"]:
            success_count += 1
            is_duplicate = result.get('isDuplicate', False)
            retry_indicator = f" (retry {result['attempts']})" if result['attempts'] > 1 else ""
            duplicate_indicator = " [DUPLICATE]" if is_duplicate else ""
            print(f"  ✓ {domain:50s} (scan #{result['scanId']}){retry_indicator}{duplicate_indicator}")
            if result['attempts'] > 1:
                retry_count += 1
            if is_duplicate:
                duplicate_count += 1
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
    if duplicate_count > 0:
        print(f"  ⚠️  Duplicates: {duplicate_count} (already existed)")
    if retry_count > 0:
        print(f"  🔄 Retried: {retry_count}")
    print(f"  ✗ Errors:  {error_count}")
    print(f"{'='*60}")

    return success_count, error_count, errors

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 batch-create-scans-chunked.py domains.txt [--batch-size 100] [--delay 5] [--max-retries 3]")
        sys.exit(1)

    domain_file = sys.argv[1]
    batch_size = 100
    delay_between_batches = 5
    max_retries = 3

    # Parse optional arguments
    for i, arg in enumerate(sys.argv):
        if arg == "--batch-size" and i + 1 < len(sys.argv):
            batch_size = int(sys.argv[i + 1])
        elif arg == "--delay" and i + 1 < len(sys.argv):
            delay_between_batches = int(sys.argv[i + 1])
        elif arg == "--max-retries" and i + 1 < len(sys.argv):
            max_retries = int(sys.argv[i + 1])

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
    print(f"🚀 BATCH SCAN CREATION (Network Resilient)")
    print(f"{'='*60}")
    print(f"Total domains:        {total_domains}")
    print(f"Batch size:           {batch_size}")
    print(f"Total batches:        {total_batches}")
    print(f"Delay between:        {delay_between_batches}s")
    print(f"Max retries:          {max_retries}")
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

        # Process batch with retries
        success, errors, error_details = process_batch(
            batch_domains,
            batch_num,
            total_batches,
            max_retries=max_retries
        )
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

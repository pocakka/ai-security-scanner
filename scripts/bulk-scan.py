#!/usr/bin/env python3
"""
Bulk Scan Script for AI Security Scanner
=========================================

Features:
- Scans 100k+ domains from a file
- Language detection (skip non-English sites)
- Retry logic for network failures
- Progress tracking and resume capability
- Worker pool (max 5 parallel scans)
- Graceful shutdown

Usage:
    python3 scripts/bulk-scan.py domains.txt

Input file format (one domain per line):
    reddit.com
    github.com
    openai.com
"""

import requests
import time
import sys
import json
import os
import signal
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
import re

# Configuration
API_URL = "http://localhost:3000/api/scan"
MAX_WORKERS = 5
RETRY_ATTEMPTS = 3
RETRY_DELAY = 10  # seconds
PROGRESS_FILE = "bulk-scan-progress.json"
RATE_LIMIT_DELAY = 2  # seconds between requests

# Language detection patterns (simple heuristic)
NON_ENGLISH_PATTERNS = {
    'korean': re.compile(r'[\u3131-\u318E\uAC00-\uD7A3]'),  # Hangul
    'japanese': re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]'),  # Hiragana, Katakana, Kanji
    'thai': re.compile(r'[\u0E00-\u0E7F]'),  # Thai
    'cyrillic': re.compile(r'[\u0400-\u04FF]'),  # Russian, Ukrainian, etc.
    'arabic': re.compile(r'[\u0600-\u06FF]'),  # Arabic
    'hebrew': re.compile(r'[\u0590-\u05FF]'),  # Hebrew
    'chinese': re.compile(r'[\u4E00-\u9FFF]'),  # Chinese
    'accented': re.compile(r'[áéíóúàèìòùäëïöüâêîôûãõñçřščž]', re.IGNORECASE),  # Hungarian, Slovak, etc.
}

# Global state
shutdown_requested = False
stats = {
    'total': 0,
    'processed': 0,
    'success': 0,
    'failed': 0,
    'skipped_language': 0,
    'skipped_already_scanned': 0
}

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global shutdown_requested
    print("\n\n🛑 Shutdown requested. Finishing current scans...")
    shutdown_requested = True

def load_progress():
    """Load progress from previous run"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'processed_domains': [], 'failed_domains': []}

def save_progress(progress):
    """Save progress to file"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def check_language(url):
    """
    Quick language check by fetching HTML and analyzing content
    Returns: True if English, False if non-English
    """
    try:
        # Quick HEAD request first to check if site is accessible
        response = requests.head(url, timeout=5, allow_redirects=True)
        if response.status_code >= 400:
            print(f"  ⚠️  Site not accessible: {response.status_code}")
            return False

        # Fetch content (first 50KB is enough for language detection)
        response = requests.get(url, timeout=10, stream=True)
        content = b''
        for chunk in response.iter_content(chunk_size=1024):
            content += chunk
            if len(content) > 50000:  # 50KB
                break

        text = content.decode('utf-8', errors='ignore')

        # Count non-English characters
        total_chars = len(text)
        if total_chars < 100:
            return True  # Too short to determine, allow it

        non_english_chars = 0
        detected_languages = []

        for lang_name, pattern in NON_ENGLISH_PATTERNS.items():
            matches = pattern.findall(text)
            if matches:
                non_english_chars += len(matches)
                detected_languages.append(lang_name)

        non_english_ratio = (non_english_chars / total_chars) * 100

        # If more than 10% non-English characters, skip it
        if non_english_ratio > 10:
            print(f"  🌐 Non-English content detected: {non_english_ratio:.1f}% ({', '.join(detected_languages)})")
            return False

        return True

    except Exception as e:
        print(f"  ⚠️  Language check failed: {str(e)}")
        return True  # Allow if check fails

def create_scan(domain, retry_count=0):
    """
    Create a scan for the given domain
    Returns: (success: bool, scan_id: str or None)
    """
    global shutdown_requested

    if shutdown_requested:
        return (False, None)

    # Normalize domain to full URL
    if not domain.startswith('http'):
        url = f'https://{domain}'
    else:
        url = domain

    print(f"\n{'='*60}")
    print(f"🔍 Scanning: {domain}")
    print(f"{'='*60}")

    # Step 1: Language detection
    print("  📝 Checking language...")
    if not check_language(url):
        print(f"  ❌ SKIPPED: Non-English site")
        stats['skipped_language'] += 1
        return (False, None)

    print("  ✅ English site detected")

    # Step 2: Create scan via API
    try:
        print("  🚀 Creating scan...")
        response = requests.post(
            API_URL,
            json={'url': url},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        data = response.json()

        if response.status_code == 200:
            scan_id = data.get('scanId')
            print(f"  ✅ Scan created: {scan_id}")
            print(f"  📊 View at: http://localhost:3000/scan/{scan_id}")
            stats['success'] += 1
            return (True, scan_id)

        elif response.status_code == 409:
            # Already exists
            print(f"  ⏭️  Already scanned recently")
            stats['skipped_already_scanned'] += 1
            return (False, None)

        else:
            error = data.get('error') or data.get('message') or 'Unknown error'
            print(f"  ❌ Error: {error}")

            # Retry on server errors
            if response.status_code >= 500 and retry_count < RETRY_ATTEMPTS:
                print(f"  🔄 Retrying in {RETRY_DELAY}s... (attempt {retry_count + 1}/{RETRY_ATTEMPTS})")
                time.sleep(RETRY_DELAY)
                return create_scan(domain, retry_count + 1)

            stats['failed'] += 1
            return (False, None)

    except requests.exceptions.RequestException as e:
        print(f"  ❌ Network error: {str(e)}")

        # Retry on network errors
        if retry_count < RETRY_ATTEMPTS:
            print(f"  🔄 Retrying in {RETRY_DELAY}s... (attempt {retry_count + 1}/{RETRY_ATTEMPTS})")
            time.sleep(RETRY_DELAY)
            return create_scan(domain, retry_count + 1)

        stats['failed'] += 1
        return (False, None)

def process_domain(domain, progress):
    """Process a single domain"""
    global shutdown_requested

    if shutdown_requested:
        return None

    stats['processed'] += 1

    # Print progress
    progress_pct = (stats['processed'] / stats['total']) * 100
    print(f"\n{'#'*60}")
    print(f"Progress: {stats['processed']}/{stats['total']} ({progress_pct:.1f}%)")
    print(f"Success: {stats['success']} | Failed: {stats['failed']} | Skipped: {stats['skipped_language'] + stats['skipped_already_scanned']}")
    print(f"{'#'*60}")

    success, scan_id = create_scan(domain)

    if success:
        progress['processed_domains'].append(domain)
    else:
        progress['failed_domains'].append(domain)

    save_progress(progress)

    # Rate limiting
    time.sleep(RATE_LIMIT_DELAY)

    return scan_id

def main():
    global shutdown_requested

    # Setup signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)

    if len(sys.argv) < 2:
        print("Usage: python3 bulk-scan.py domains.txt")
        sys.exit(1)

    domains_file = sys.argv[1]

    if not os.path.exists(domains_file):
        print(f"Error: File '{domains_file}' not found")
        sys.exit(1)

    # Load domains
    print(f"📖 Loading domains from {domains_file}...")
    with open(domains_file, 'r') as f:
        domains = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Load progress
    progress = load_progress()
    already_processed = set(progress['processed_domains'])

    # Filter out already processed domains
    domains_to_scan = [d for d in domains if d not in already_processed]

    stats['total'] = len(domains_to_scan)

    print(f"✅ Loaded {len(domains)} domains")
    print(f"⏭️  Already processed: {len(already_processed)}")
    print(f"🎯 To scan: {stats['total']}")
    print(f"⚙️  Max parallel workers: {MAX_WORKERS}")
    print(f"⏱️  Rate limit: {RATE_LIMIT_DELAY}s between requests")
    print(f"\n{'='*60}")
    print("Starting bulk scan... (Press Ctrl+C to stop gracefully)")
    print(f"{'='*60}\n")

    # Process domains with thread pool
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []

        for domain in domains_to_scan:
            if shutdown_requested:
                break

            future = executor.submit(process_domain, domain, progress)
            futures.append(future)

        # Wait for all to complete
        for future in as_completed(futures):
            if shutdown_requested:
                print("\n🛑 Cancelling remaining scans...")
                executor.shutdown(wait=False, cancel_futures=True)
                break

    # Print final stats
    print(f"\n{'='*60}")
    print("📊 FINAL STATISTICS")
    print(f"{'='*60}")
    print(f"Total domains: {stats['total']}")
    print(f"Processed: {stats['processed']}")
    print(f"✅ Success: {stats['success']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"🌐 Skipped (non-English): {stats['skipped_language']}")
    print(f"⏭️  Skipped (already scanned): {stats['skipped_already_scanned']}")
    print(f"{'='*60}\n")

    if progress['failed_domains']:
        print(f"⚠️  {len(progress['failed_domains'])} domains failed. Check {PROGRESS_FILE}")

    print("✅ Bulk scan complete!")

if __name__ == '__main__':
    main()

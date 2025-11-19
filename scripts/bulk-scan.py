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
- Detailed logging (all actions, errors, skipped domains)

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
from datetime import datetime
import re
import logging

# Configuration
API_URL = "http://localhost:3000/api/scan"
MAX_WORKERS = 5
RETRY_ATTEMPTS = 3
RETRY_DELAY = 10  # seconds
PROGRESS_FILE = "bulk-scan-progress.json"
RATE_LIMIT_DELAY = 2  # seconds between requests

# Logging configuration
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
MAIN_LOG_FILE = f"{LOG_DIR}/bulk-scan_{timestamp}.log"
SKIPPED_LOG_FILE = f"{LOG_DIR}/bulk-scan-skipped_{timestamp}.log"
ERROR_LOG_FILE = f"{LOG_DIR}/bulk-scan-errors_{timestamp}.log"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(MAIN_LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Separate loggers for skipped and errors
skipped_logger = logging.getLogger('skipped')
skipped_handler = logging.FileHandler(SKIPPED_LOG_FILE)
skipped_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
skipped_logger.addHandler(skipped_handler)
skipped_logger.setLevel(logging.INFO)

error_logger = logging.getLogger('errors')
error_handler = logging.FileHandler(ERROR_LOG_FILE)
error_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
error_logger.addHandler(error_handler)
error_logger.setLevel(logging.ERROR)

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
    logger.warning("🛑 Shutdown requested (Ctrl+C). Finishing current scans...")
    print("\n\n🛑 Shutdown requested. Finishing current scans...")
    shutdown_requested = True

def load_progress():
    """Load progress from previous run"""
    if os.path.exists(PROGRESS_FILE):
        logger.info(f"📂 Loading progress from {PROGRESS_FILE}")
        with open(PROGRESS_FILE, 'r') as f:
            progress = json.load(f)
            logger.info(f"   Already processed: {len(progress.get('processed_domains', []))} domains")
            logger.info(f"   Previously failed: {len(progress.get('failed_domains', []))} domains")
            return progress
    logger.info("🆕 No previous progress found, starting fresh")
    return {
        'processed_domains': [],
        'failed_domains': [],
        'skipped_domains': {},  # {domain: reason}
        'session_start': datetime.now().isoformat(),
        'last_saved': None
    }

def save_progress(progress):
    """Save progress to file"""
    progress['last_saved'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)
    logger.debug(f"💾 Progress saved ({len(progress['processed_domains'])} processed)")

def check_language(url, domain):
    """
    Quick language check by fetching HTML and analyzing content
    Returns: (is_english: bool, reason: str, status_code: int)
    """
    start_time = time.time()

    try:
        logger.info(f"  🌐 [{domain}] Checking language...")

        # Quick HEAD request first to check if site is accessible
        logger.debug(f"  📡 [{domain}] Sending HEAD request...")
        response = requests.head(url, timeout=5, allow_redirects=True)
        status_code = response.status_code

        logger.info(f"  📊 [{domain}] HEAD response: {status_code}")

        if status_code >= 400:
            reason = f"Site not accessible (HTTP {status_code})"
            logger.warning(f"  ⚠️  [{domain}] {reason}")
            skipped_logger.info(f"{domain} | HTTP_ERROR | {status_code} | {url}")
            return False, reason, status_code

        # Fetch content (first 50KB is enough for language detection)
        logger.debug(f"  📥 [{domain}] Fetching content (max 50KB)...")
        response = requests.get(url, timeout=10, stream=True)
        content = b''
        for chunk in response.iter_content(chunk_size=1024):
            content += chunk
            if len(content) > 50000:  # 50KB
                break

        content_size = len(content)
        logger.info(f"  📦 [{domain}] Downloaded {content_size} bytes")

        text = content.decode('utf-8', errors='ignore')

        # Count non-English characters
        total_chars = len(text)
        if total_chars < 100:
            logger.info(f"  ✅ [{domain}] Content too short ({total_chars} chars), allowing")
            return True, "Content too short to analyze", status_code

        non_english_chars = 0
        detected_languages = []

        for lang_name, pattern in NON_ENGLISH_PATTERNS.items():
            matches = pattern.findall(text)
            if matches:
                non_english_chars += len(matches)
                detected_languages.append(f"{lang_name}({len(matches)})")

        non_english_ratio = (non_english_chars / total_chars) * 100
        elapsed = time.time() - start_time

        logger.info(f"  📊 [{domain}] Language analysis: {non_english_ratio:.1f}% non-English ({total_chars} chars, {elapsed:.2f}s)")

        # If more than 10% non-English characters, skip it
        if non_english_ratio > 10:
            reason = f"Non-English: {non_english_ratio:.1f}% ({', '.join(detected_languages)})"
            logger.warning(f"  ❌ [{domain}] SKIPPED - {reason}")
            skipped_logger.info(f"{domain} | NON_ENGLISH | {non_english_ratio:.1f}% | {','.join(detected_languages)} | {url}")
            return False, reason, status_code

        logger.info(f"  ✅ [{domain}] English content detected ({100-non_english_ratio:.1f}% English)")
        return True, "English", status_code

    except requests.exceptions.Timeout as e:
        reason = f"Timeout: {str(e)}"
        elapsed = time.time() - start_time
        logger.error(f"  ⏱️  [{domain}] {reason} (after {elapsed:.2f}s)")
        error_logger.error(f"{domain} | TIMEOUT | {url} | {str(e)}")
        skipped_logger.info(f"{domain} | TIMEOUT | {elapsed:.2f}s | {url}")
        return False, reason, 0

    except requests.exceptions.ConnectionError as e:
        reason = f"Connection error: {str(e)}"
        logger.error(f"  🔌 [{domain}] {reason}")
        error_logger.error(f"{domain} | CONNECTION_ERROR | {url} | {str(e)}")
        skipped_logger.info(f"{domain} | CONNECTION_ERROR | - | {url}")
        return False, reason, 0

    except Exception as e:
        reason = f"Language check failed: {str(e)}"
        logger.error(f"  ⚠️  [{domain}] {reason}")
        error_logger.error(f"{domain} | CHECK_FAILED | {url} | {str(e)}")
        # Allow if check fails (don't skip good sites due to check errors)
        return True, reason, 0

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

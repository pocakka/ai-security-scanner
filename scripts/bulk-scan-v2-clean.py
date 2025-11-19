#!/usr/bin/env python3
"""
CLEAN VERSION - No duplicate console output
Logs only to file, clean progress display
"""

import requests, time, sys, json, os, signal, re, logging, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Config
API_URL = "http://localhost:3000/api/scan"
MAX_WORKERS = 5
RETRY_ATTEMPTS = 3
RETRY_DELAY = 10
PROGRESS_FILE = "bulk-scan-progress.json"
RATE_LIMIT_DELAY = 2
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
MAIN_LOG = f"{LOG_DIR}/scan_{timestamp}.log"
SKIP_LOG = f"{LOG_DIR}/skip_{timestamp}.log"
ERROR_LOG = f"{LOG_DIR}/error_{timestamp}.log"

# Logging setup - FILE ONLY (no console spam)
file_handler = logging.FileHandler(MAIN_LOG)
file_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s'))
logger = logging.getLogger(__name__)
logger.addHandler(file_handler)
logger.setLevel(logging.INFO)

skip_logger = logging.getLogger('skip')
skip_logger.addHandler(logging.FileHandler(SKIP_LOG))
skip_logger.setLevel(logging.INFO)

error_logger = logging.getLogger('error')
error_logger.addHandler(logging.FileHandler(ERROR_LOG))
error_logger.setLevel(logging.ERROR)

# Thread-safe progress tracking
progress_lock = threading.Lock()
shutdown_requested = False
stats = {'total': 0, 'processed': 0, 'success': 0, 'failed': 0, 'skipped_lang': 0, 'skipped_dup': 0}

NON_ENGLISH_PATTERNS = {
    'korean': re.compile(r'[\u3131-\u318E\uAC00-\uD7A3]'),
    'japanese': re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]'),
    'thai': re.compile(r'[\u0E00-\u0E7F]'),
    'cyrillic': re.compile(r'[\u0400-\u04FF]'),
    'arabic': re.compile(r'[\u0600-\u06FF]'),
    'hebrew': re.compile(r'[\u0590-\u05FF]'),
    'chinese': re.compile(r'[\u4E00-\u9FFF]'),
    'accented': re.compile(r'[áéíóúàèìòùäëïöüâêîôûãõñçřščž]', re.IGNORECASE),
}

def signal_handler(sig, frame):
    global shutdown_requested
    print("\n🛑 Shutdown requested. Finishing current scans...")
    logger.warning("Shutdown requested")
    shutdown_requested = True

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            progress = json.load(f)
            # Support both old and new format
            if 'processed_domains' in progress:
                progress['processed'] = progress.get('processed_domains', [])
                progress['failed'] = progress.get('failed_domains', [])
            return progress
    return {'processed': [], 'failed': [], 'skipped': {}, 'start': datetime.now().isoformat()}

def save_progress(progress):
    progress['last_saved'] = datetime.now().isoformat()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def check_language(url, domain):
    try:
        logger.info(f"[{domain}] Language check START")
        resp = requests.head(url, timeout=5, allow_redirects=True)
        if resp.status_code >= 400:
            skip_logger.info(f"{domain}|HTTP_{resp.status_code}|{url}")
            return False, f"HTTP {resp.status_code}"
        
        resp = requests.get(url, timeout=10, stream=True)
        content = b''.join([chunk for chunk in resp.iter_content(1024) if len(content := content + chunk if 'content' in locals() else chunk) <= 50000] or [b''])
        text = content.decode('utf-8', errors='ignore')
        
        if len(text) < 100:
            return True, "Too short"
        
        non_eng = sum(len(p.findall(text)) for p in NON_ENGLISH_PATTERNS.values())
        ratio = (non_eng / len(text)) * 100
        
        if ratio > 10:
            skip_logger.info(f"{domain}|NON_ENGLISH|{ratio:.1f}%|{url}")
            return False, f"Non-English {ratio:.1f}%"
        
        logger.info(f"[{domain}] English OK ({100-ratio:.1f}%)")
        return True, "English"
    except requests.Timeout:
        skip_logger.info(f"{domain}|TIMEOUT|{url}")
        return False, "Timeout"
    except Exception as e:
        error_logger.error(f"{domain}|{url}|{e}")
        return True, "Check failed (allow)"

def create_scan(domain):
    url = f'https://{domain}' if not domain.startswith('http') else domain
    
    logger.info(f"[{domain}] SCAN START")
    
    # Language check
    is_eng, reason = check_language(url, domain)
    if not is_eng:
        logger.warning(f"[{domain}] SKIP: {reason}")
        stats['skipped_lang'] += 1
        return False, None
    
    # Create scan
    try:
        resp = requests.post(API_URL, json={'url': url}, timeout=45)
        data = resp.json()

        if resp.status_code in [200, 201]:  # Accept both 200 OK and 201 Created
            scan_id = data.get('scanId')
            logger.info(f"[{domain}] SUCCESS: {scan_id}")
            stats['success'] += 1
            return True, scan_id
        elif resp.status_code == 409:
            logger.info(f"[{domain}] DUPLICATE")
            stats['skipped_dup'] += 1
            return False, None
        else:
            logger.error(f"[{domain}] API ERROR: {resp.status_code} - {data}")
            stats['failed'] += 1
            return False, None
    except Exception as e:
        error_logger.error(f"{domain}|API_CALL|{e}")
        stats['failed'] += 1
        return False, None

def process_domain(domain, progress):
    if shutdown_requested:
        return
    
    with progress_lock:
        stats['processed'] += 1
        pct = (stats['processed'] / stats['total']) * 100
        # Clean single-line progress
        print(f"\rProgress: {stats['processed']}/{stats['total']} ({pct:.1f}%) | ✅ {stats['success']} | ❌ {stats['failed']} | ⏭ {stats['skipped_lang']+stats['skipped_dup']}", end='', flush=True)
    
    success, scan_id = create_scan(domain)
    
    if success:
        progress['processed'].append(domain)
    else:
        progress['failed'].append(domain)
    
    save_progress(progress)
    time.sleep(RATE_LIMIT_DELAY)

def main():
    signal.signal(signal.SIGINT, signal_handler)
    
    if len(sys.argv) < 2:
        print("Usage: python3 bulk-scan-v2-clean.py domains.txt")
        sys.exit(1)
    
    domains_file = sys.argv[1]
    with open(domains_file) as f:
        domains = [l.strip() for l in f if l.strip() and not l.startswith('#')]
    
    progress = load_progress()
    done = set(progress['processed'])
    to_scan = [d for d in domains if d not in done]
    
    stats['total'] = len(to_scan)
    
    print(f"\n📊 BULK SCAN")
    print(f"   Total: {len(domains)} domains")
    print(f"   Done: {len(done)}")
    print(f"   To scan: {stats['total']}")
    print(f"   Workers: {MAX_WORKERS}\n")
    print(f"📝 Logs: {MAIN_LOG}\n")
    print("Starting...\n")
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(process_domain, d, progress) for d in to_scan]
        for f in as_completed(futures):
            if shutdown_requested:
                executor.shutdown(wait=False, cancel_futures=True)
                break
    
    print(f"\n\n✅ DONE!")
    print(f"   Success: {stats['success']}")
    print(f"   Failed: {stats['failed']}")
    print(f"   Skipped: {stats['skipped_lang']+stats['skipped_dup']}\n")

if __name__ == '__main__':
    main()

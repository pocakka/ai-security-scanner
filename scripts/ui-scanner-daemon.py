#!/usr/bin/env python3
"""
UI Scanner Daemon - Background worker for web UI scans

Figyeli a Job táblát és feldolgozza a PENDING jobokat.
Max 3 worker párhuzamosan - lightweight, UI-hoz optimalizált.

NEM BÁNTJA a parallel-scanner.py-t, teljesen külön működik!

USAGE:
    python3 ui-scanner-daemon.py          # Daemon indítása
    python3 ui-scanner-daemon.py --stop   # Daemon leállítása
"""

import psycopg2
import subprocess
import time
import sys
import os
import signal
import threading
from datetime import datetime
from typing import Dict, List, Optional

# ════════════════════════════════════════════════════════════════════
# CONFIGURATION - UI optimized (lightweight)
# ════════════════════════════════════════════════════════════════════

DB_URL = "postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"
WORKER_SCRIPT = "src/worker/index-sqlite.ts"
SCANNER_DIR = "/home/aiq/Asztal/10_M_USD/ai-security-scanner"

# UI settings - conservative
MAX_WORKERS = 3              # Max 3 parallel workers (UI-hoz elég)
WORKER_TIMEOUT = 120         # 2 perc timeout per scan
POLL_INTERVAL = 2            # 2 másodpercenként ellenőriz
CLEANUP_INTERVAL = 30        # 30 másodpercenként cleanup

# PID file for daemon management
PID_FILE = "/tmp/ui-scanner-daemon.pid"
LOCK_DIR = "/tmp/ui-scanner-workers"

# ════════════════════════════════════════════════════════════════════
# GLOBAL STATE
# ════════════════════════════════════════════════════════════════════

running = True
active_workers: Dict[int, Dict] = {}  # pid -> {start_time, job_id}
workers_lock = threading.Lock()

def signal_handler(sig, frame):
    """Ctrl+C handler"""
    global running
    print("\n[UI-Daemon] Stopping...")
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ════════════════════════════════════════════════════════════════════
# DATABASE FUNCTIONS
# ════════════════════════════════════════════════════════════════════

def get_pending_jobs_count() -> int:
    """Get count of PENDING jobs in queue"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM "Job" WHERE status = \'PENDING\'')
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        return count
    except Exception as e:
        print(f"[UI-Daemon] DB Error: {e}")
        return 0

def get_pending_job() -> Optional[Dict]:
    """Get and claim one pending job atomically - NEWEST FIRST for UI priority!"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Atomic claim with FOR UPDATE SKIP LOCKED
        # IMPORTANT: ORDER BY createdAt DESC = newest first = UI scans get priority!
        cur.execute("""
            UPDATE "Job"
            SET status = 'PROCESSING', "startedAt" = NOW(), attempts = attempts + 1
            WHERE id = (
                SELECT id FROM "Job"
                WHERE status = 'PENDING' AND attempts < "maxAttempts"
                ORDER BY "createdAt" DESC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            )
            RETURNING id, type, data
        """)

        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if row:
            import json
            return {
                'id': row[0],
                'type': row[1],
                'data': json.loads(row[2]) if isinstance(row[2], str) else row[2]
            }
        return None
    except Exception as e:
        print(f"[UI-Daemon] Error claiming job: {e}")
        return None

def cleanup_stuck_scans(timeout_seconds: int = 120) -> int:
    """Clean up scans stuck in SCANNING for too long"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            UPDATE "Scan"
            SET status = 'FAILED', "completedAt" = NOW()
            WHERE status = 'SCANNING'
            AND "createdAt" < NOW() - make_interval(secs => %s)
        """, (timeout_seconds,))

        cleaned = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()

        if cleaned > 0:
            print(f"[UI-Daemon] Cleaned {cleaned} stuck SCANNING scans")
        return cleaned
    except Exception as e:
        print(f"[UI-Daemon] Cleanup error: {e}")
        return 0

def cleanup_stuck_jobs(timeout_seconds: int = 300) -> int:
    """Reset jobs stuck in PROCESSING back to PENDING"""
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            UPDATE "Job"
            SET status = 'PENDING', "startedAt" = NULL
            WHERE status = 'PROCESSING'
            AND "startedAt" < NOW() - make_interval(secs => %s)
        """, (timeout_seconds,))

        reset = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()

        if reset > 0:
            print(f"[UI-Daemon] Reset {reset} stuck PROCESSING jobs")
        return reset
    except Exception as e:
        print(f"[UI-Daemon] Job cleanup error: {e}")
        return 0

# ════════════════════════════════════════════════════════════════════
# WORKER MANAGEMENT
# ════════════════════════════════════════════════════════════════════

def start_worker() -> Optional[int]:
    """Start a new TypeScript worker process"""
    try:
        # Environment with JOB_ORDER=DESC for newest-first (UI priority!)
        env = os.environ.copy()
        env['JOB_ORDER'] = 'DESC'  # UI scans get priority - newest first

        # Start worker in background
        proc = subprocess.Popen(
            ['npx', 'tsx', WORKER_SCRIPT],
            cwd=SCANNER_DIR,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )

        return proc.pid
    except Exception as e:
        print(f"[UI-Daemon] Failed to start worker: {e}")
        return None

def is_process_alive(pid: int) -> bool:
    """Check if a process is still running"""
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False

def kill_worker(pid: int) -> bool:
    """Kill a worker process"""
    try:
        os.kill(pid, signal.SIGKILL)
        return True
    except OSError:
        return False

def cleanup_dead_workers():
    """Remove dead workers from tracking"""
    global active_workers
    with workers_lock:
        dead_pids = [pid for pid in active_workers if not is_process_alive(pid)]
        for pid in dead_pids:
            del active_workers[pid]

def kill_stuck_workers():
    """Kill workers running too long"""
    global active_workers
    now = time.time()
    with workers_lock:
        stuck_pids = []
        for pid, info in active_workers.items():
            elapsed = now - info['start_time']
            if elapsed > WORKER_TIMEOUT:
                stuck_pids.append(pid)

        for pid in stuck_pids:
            elapsed = now - active_workers[pid]['start_time']
            print(f"[UI-Daemon] Killing stuck worker PID {pid} (running {elapsed:.0f}s)")
            kill_worker(pid)
            del active_workers[pid]

def get_active_worker_count() -> int:
    """Get count of active workers"""
    cleanup_dead_workers()
    return len(active_workers)

def clear_lock_files():
    """Clear stale lock files from /tmp"""
    try:
        if os.path.exists(LOCK_DIR):
            for f in os.listdir(LOCK_DIR):
                filepath = os.path.join(LOCK_DIR, f)
                try:
                    os.remove(filepath)
                except:
                    pass
    except:
        pass

# ════════════════════════════════════════════════════════════════════
# MAIN DAEMON LOOP
# ════════════════════════════════════════════════════════════════════

def write_pid_file():
    """Write PID file for daemon management"""
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))

def remove_pid_file():
    """Remove PID file"""
    try:
        os.remove(PID_FILE)
    except:
        pass

def stop_daemon():
    """Stop running daemon"""
    try:
        with open(PID_FILE, 'r') as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGTERM)
        print(f"[UI-Daemon] Sent stop signal to PID {pid}")
        time.sleep(1)
        if is_process_alive(pid):
            os.kill(pid, signal.SIGKILL)
            print(f"[UI-Daemon] Force killed PID {pid}")
        remove_pid_file()
    except FileNotFoundError:
        print("[UI-Daemon] No daemon running (PID file not found)")
    except ProcessLookupError:
        print("[UI-Daemon] Daemon already stopped")
        remove_pid_file()
    except Exception as e:
        print(f"[UI-Daemon] Error stopping daemon: {e}")

def main():
    global running, active_workers

    # Handle --stop flag
    if len(sys.argv) > 1 and sys.argv[1] == '--stop':
        stop_daemon()
        return

    # Check if already running
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, 'r') as f:
                old_pid = int(f.read().strip())
            if is_process_alive(old_pid):
                print(f"[UI-Daemon] Already running with PID {old_pid}")
                print("[UI-Daemon] Use --stop to stop it first")
                return
        except:
            pass

    # Clear old state
    clear_lock_files()
    write_pid_file()

    print("=" * 60)
    print(" UI Scanner Daemon")
    print("=" * 60)
    print(f" Max Workers: {MAX_WORKERS}")
    print(f" Worker Timeout: {WORKER_TIMEOUT}s")
    print(f" Poll Interval: {POLL_INTERVAL}s")
    print(f" PID: {os.getpid()}")
    print("=" * 60)
    print(" Waiting for jobs from UI...")
    print(" Press Ctrl+C to stop")
    print("=" * 60)

    last_cleanup = time.time()
    last_status = ""

    try:
        while running:
            # Periodic cleanup
            now = time.time()
            if now - last_cleanup > CLEANUP_INTERVAL:
                cleanup_stuck_scans(WORKER_TIMEOUT)
                cleanup_stuck_jobs(300)
                kill_stuck_workers()
                last_cleanup = now

            # Clean up dead workers
            cleanup_dead_workers()

            # Check how many workers we can start
            active = get_active_worker_count()
            pending = get_pending_jobs_count()

            # Status display (only if changed)
            status = f"Active: {active}/{MAX_WORKERS}, Pending: {pending}"
            if status != last_status:
                print(f"[UI-Daemon] {status}")
                last_status = status

            # Start workers if needed
            workers_to_start = min(
                MAX_WORKERS - active,  # Available slots
                pending                 # Jobs waiting
            )

            for _ in range(workers_to_start):
                pid = start_worker()
                if pid:
                    with workers_lock:
                        active_workers[pid] = {
                            'start_time': time.time(),
                            'job_id': None
                        }
                    print(f"[UI-Daemon] Started worker PID {pid}")
                time.sleep(0.5)  # Small delay between worker starts

            # Wait before next poll
            time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup on exit
        print("\n[UI-Daemon] Shutting down...")

        # Kill all active workers
        with workers_lock:
            for pid in list(active_workers.keys()):
                print(f"[UI-Daemon] Killing worker PID {pid}")
                kill_worker(pid)

        clear_lock_files()
        remove_pid_file()
        print("[UI-Daemon] Stopped")

if __name__ == "__main__":
    main()

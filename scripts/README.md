# Scripts - AI Security Scanner

Helper scripts for managing the worker and logs.

## 📝 Log Management

All worker logs are saved to `logs/` directory in the project root.

### Start Worker with Logging

```bash
./scripts/start-worker.sh
```

Starts the worker with real Playwright crawler and saves logs to `logs/worker-YYYYMMDD-HHMMSS.log`

### View Latest Log

```bash
# Tail (follow) latest log
./scripts/tail-worker-log.sh

# View latest log in less
./scripts/view-latest-log.sh
```

### Cleanup Old Logs

```bash
./scripts/cleanup-logs.sh
```

Keeps only the last 10 log files, deletes older ones.

## 📊 Monitoring

### Check Log Files

```bash
# List all logs
ls -lht logs/

# View specific log
tail -f logs/worker-20251117-112304.log

# Search for errors
grep -i "error" logs/worker-*.log

# Search for specific scan
grep "0bfd143c-85a0-4565-ac4f-2c4037557d81" logs/worker-*.log
```

### Database Monitoring

```bash
# Check recent scans
cd ai-security-scanner
sqlite3 prisma/dev.db "SELECT id, url, status, datetime(createdAt/1000, 'unixepoch') as created FROM Scan ORDER BY createdAt DESC LIMIT 10;"

# Check stuck scans (SCANNING for >5 minutes)
sqlite3 prisma/dev.db "SELECT id, url, status, datetime(startedAt/1000, 'unixepoch') as started, (strftime('%s', 'now') - startedAt/1000)/60 as minutes_running FROM Scan WHERE status = 'SCANNING' AND startedAt IS NOT NULL;"

# Count scans by status
sqlite3 prisma/dev.db "SELECT status, COUNT(*) as count FROM Scan GROUP BY status;"
```

## 🔧 Worker Management

### Start Worker (Manual)

```bash
cd ai-security-scanner
USE_REAL_CRAWLER=true npm run worker
```

### Kill Worker

```bash
pkill -9 -f "tsx src/worker/index-sqlite.ts"
```

### Check if Worker is Running

```bash
ps aux | grep "tsx src/worker/index-sqlite.ts" | grep -v grep
```

## 🐛 Debugging Stuck Scans

If a scan is stuck in SCANNING status:

```bash
# 1. Find the scan ID
sqlite3 prisma/dev.db "SELECT id, url, status FROM Scan WHERE status = 'SCANNING';"

# 2. Reset to PENDING
sqlite3 prisma/dev.db "UPDATE Scan SET status = 'PENDING', startedAt = NULL WHERE id = 'SCAN_ID_HERE';"

# 3. Find and reset the Job
sqlite3 prisma/dev.db "SELECT id, status FROM Job WHERE data LIKE '%SCAN_ID_HERE%';"
sqlite3 prisma/dev.db "UPDATE Job SET status = 'PENDING' WHERE id = 'JOB_ID_HERE';"

# 4. Restart worker
./scripts/start-worker.sh
```

## 📦 Log File Format

Worker logs are saved with timestamp filenames:
- Format: `worker-YYYYMMDD-HHMMSS.log`
- Example: `worker-20251117-112304.log`
- Location: `ai-security-scanner/logs/`

Logs include:
- Worker startup messages
- Crawl progress
- Analyzer execution times
- Errors and warnings
- Completion status

## 🔒 Git Ignore

The `logs/` directory is excluded from git (see `.gitignore`).
Only `.log` and `.txt` files in `logs/` are ignored, not the directory itself.

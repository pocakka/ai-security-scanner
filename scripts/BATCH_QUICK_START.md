# ⚡ Batch Scanning - Quick Start

**Last Updated:** 2025-11-24

---

## 🚀 Start Scanning (One Command)

```bash
cd /home/aiq/Asztal/10_M_USD/ai-security-scanner/scripts
./batch-scan-50-timeout.sh
```

**That's it!** 🎉

---

## 📊 What Happens?

1. **Creates 1000 scans** (50 domains per batch)
2. **Max 5 min per batch** (timeout protection)
3. **Progress tracking** in real-time
4. **Auto-recovery** from stuck scans
5. **Results saved** to `/tmp/batch-50-timeout-1000-scan-ids.txt`

---

## 🎯 Expected Results

- **Time:** ~40-60 minutes for 1000 domains
- **Success rate:** ~95-98%
- **Speed:** ~15-20 scans/minute
- **Batches:** 20 batches (50 each)

---

## 📈 Monitor Progress

**In another terminal:**

```bash
# Watch workers
pm2 logs hybrid-worker --lines 50

# Watch database
watch -n 3 'export PGPASSWORD=ai_scanner_2025 && psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "SELECT status, COUNT(*) FROM \"Scan\" WHERE \"createdAt\" > NOW() - INTERVAL '\''2 hours'\'' GROUP BY status;"'
```

---

## 🛑 Stop Scanning

```bash
# In the terminal running the script
Ctrl+C

# Or kill from another terminal
pkill -f "batch-scan-50-timeout.sh"
```

---

## ✅ After Scan Completes

**Check results:**

```bash
# Count scans
wc -l /tmp/batch-50-timeout-1000-scan-ids.txt

# Check database
export PGPASSWORD=ai_scanner_2025
psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "
  SELECT 
    status, 
    COUNT(*), 
    ROUND(AVG(EXTRACT(EPOCH FROM (\"completedAt\" - \"startedAt\")))) as avg_seconds
  FROM \"Scan\" 
  WHERE \"createdAt\" > NOW() - INTERVAL '2 hours'
  GROUP BY status;
"
```

---

## �� Next Steps

### Scale to Full 229K Domains

**Option 1: Update MAX_DOMAINS**
```bash
# Edit script
nano batch-scan-50-timeout.sh

# Change:
MAX_DOMAINS=1000  →  MAX_DOMAINS=229880

# Run
./batch-scan-50-timeout.sh
```

**Option 2: Run in Blocks**
```bash
# Day 1: First 10K
head -10000 domains.txt > /tmp/block-1.txt
# ... modify script to use /tmp/block-1.txt

# Day 2: Next 10K
tail -n +10001 domains.txt | head -10000 > /tmp/block-2.txt
# ... etc
```

---

## 🐛 Troubleshooting

### Script stuck?
```bash
# Check workers
pm2 list

# Restart if needed
pm2 restart hybrid-worker
```

### Database full?
```bash
# Check disk space
df -h

# Clean old scans
export PGPASSWORD=ai_scanner_2025
psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "
  DELETE FROM \"Scan\" WHERE \"createdAt\" < NOW() - INTERVAL '7 days';
"
```

---

## 📚 More Info

- **Full Guide:** `BATCH_SCRIPTS_README.md`
- **Timeout Details:** `TIMEOUT_IMPLEMENTATION_SUMMARY.md`
- **All Options:** `BATCH_SCANNING_GUIDE.md`

---

**Need help?** Check logs: `pm2 logs hybrid-worker`

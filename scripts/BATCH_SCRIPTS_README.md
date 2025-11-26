# 📦 Batch Scanning Scripts

**Location:** `/home/aiq/Asztal/10_M_USD/ai-security-scanner/scripts/`

---

## 🚀 Available Scripts

| Script | Batch Size | Timeout | Speed | Best For |
|--------|------------|---------|-------|----------|
| `batch-scan-turbo.sh` | 40 | ❌ No | Fastest | Server, datacenter |
| `batch-scan-balanced.sh` | 20 | ❌ No | Fast | Home internet |
| `batch-scan-conservative.sh` | 10 | ❌ No | Safest | Slow internet |
| `batch-scan-50-basic.sh` | 50 | ❌ No | Medium | Custom request |
| **`batch-scan-50-timeout.sh`** | **50** | **✅ 5min** | **Medium** | **🔥 RECOMMENDED** |

---

## ⏱️ Why Timeout Protection?

### Problem: Stragglers
- 50 domain batch-ben 48 domain kész 2 perc alatt
- 2 domain még mindig fut (lassú szerverek)
- **Script vár 10+ percet** → Pipeline stuck!

### Solution: Batch Timeout
- **Worker timeout:** 180s (3 min) per scan
- **Batch timeout:** 300s (5 min) per batch
- Ha batch 5 perc után nem kész → **továbblép**
- Stragglers (lassú domainek) eldobása

### Industry Standard
- ✅ Google: Soft timeout + hard timeout
- ✅ AWS: Max batch execution time
- ✅ Hadoop/Spark: Speculative execution

**Our approach:** Simple max wait time (5 min/batch)

---

## 🎯 Recommended: `batch-scan-50-timeout.sh`

**Best choice for production:**

```bash
cd /home/aiq/Asztal/10_M_USD/ai-security-scanner/scripts
./batch-scan-50-timeout.sh
```

**Features:**
- ✅ 50 domains per batch (good parallelism)
- ✅ 5 minute max wait per batch
- ✅ No stuck batches
- ✅ Stragglers handled gracefully
- ✅ Progress tracking with elapsed time
- ✅ Detailed statistics

**Output:**
```
⏱️  120s | Progress: 90% | ✅ 45 | ❌ 2 | ⏳ 3
⏱️  BATCH TIMEOUT reached (300s)
⏭️  Moving to next batch (3 stragglers left behind)
```

---

## 📊 Timeout Behavior

### Without Timeout (`batch-scan-50-basic.sh`)
```
Batch 1: 50 domains → 2 min ✅
Batch 2: 50 domains → 2 min ✅
Batch 3: 50 domains → 48 done, 2 STUCK
  ❌ Waiting 10+ minutes for stragglers
  ❌ Pipeline blocked
```

### With Timeout (`batch-scan-50-timeout.sh`)
```
Batch 1: 50 domains → 2 min ✅
Batch 2: 50 domains → 2 min ✅
Batch 3: 50 domains → 5 min timeout
  ✅ 48 completed, 2 stragglers left behind
  ✅ Moving to Batch 4 immediately
Batch 4: 50 domains → 2 min ✅
```

---

## 🔧 Configuration

Edit the script to customize:

```bash
BATCH_SIZE=50              # Domains per batch
MAX_BATCH_WAIT=300         # 5 minutes per batch
MAX_DOMAINS=1000           # Total domains to scan
API_DELAY=0.05             # 50ms between API calls
```

---

## 📈 Performance Estimates

### 1,000 Domains (with timeout protection)
- **Batches:** 20 batches (50 domains each)
- **Time per batch:** ~2-3 min average
- **Max time per batch:** 5 min (timeout)
- **Total time:** ~40-60 min (worst case: 100 min if all batches timeout)
- **Success rate:** ~95-98%

### 229,880 Domains (full scan)
- **Batches:** 4,598 batches
- **Total time:** ~150-230 hours (6-10 days)
- **Recommended:** Run in 8-hour blocks daily

---

## 🛠️ Monitoring

Watch progress in another terminal:

```bash
# Watch PM2 workers
pm2 logs hybrid-worker --lines 50

# Watch database
watch -n 5 'export PGPASSWORD=ai_scanner_2025 && psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "SELECT status, COUNT(*) FROM \"Scan\" GROUP BY status;"'
```

---

## 🚨 Troubleshooting

### Script stuck at batch?
- Check if timeout is working: Look for `⏱️ BATCH TIMEOUT reached` message
- If not, batch might be waiting for stragglers
- Kill script and use `batch-scan-50-timeout.sh` instead

### Too many timeouts?
- Increase `MAX_BATCH_WAIT` (e.g., from 300s to 600s)
- Or decrease `BATCH_SIZE` (e.g., from 50 to 30)

### Workers not processing?
```bash
pm2 restart hybrid-worker
pm2 logs hybrid-worker
```

---

## 📚 Documentation

- **Batch Scanning Guide:** `BATCH_SCANNING_GUIDE.md`
- **Timeout Implementation:** `TIMEOUT_IMPLEMENTATION_SUMMARY.md`
- **Worker Details:** `../HYBRID_SCANNER_SUCCESS.md`

---

**Status:** ✅ PRODUCTION READY  
**Recommended Script:** `batch-scan-50-timeout.sh`  
**Updated:** 2025-11-24

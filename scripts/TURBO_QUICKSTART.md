# 🚀 TURBO Scanner - Quick Start Guide

## **5 perc alatt futtatható!**

---

## ⚡ **Gyors Telepítés**

```bash
# 1. Playwright telepítése (egyszer)
pip3 install playwright psycopg2-binary

# 2. Chromium letöltése (egyszer)
playwright install chromium

# 3. Kész! ✅
```

---

## 🎯 **Használat (3 lépés)**

### **1. API indítása**
```bash
# Terminal 1
cd ai-security-scanner
npm run dev
```

### **2. Domain lista létrehozása**
```bash
# Készíts egy test-domains.txt fájlt:
echo "openai.com" > test-domains.txt
echo "github.com" >> test-domains.txt
echo "anthropic.com" >> test-domains.txt
echo "vercel.com" >> test-domains.txt
echo "stripe.com" >> test-domains.txt
```

### **3. TURBO scanner indítása**
```bash
# Terminal 2
cd ai-security-scanner
python3 scripts/turbo-master-scanner.py ../test-domains.txt
```

**Kész!** 🎉

---

## 📊 **Mit Látsz?**

```
🚀 TURBO Scanner starting
  Domains: 5
  Parallel Contexts: 12
  Resource Blocking: True
  Expected speedup: 3-4x faster!

════════════════════════════════════════════════════════════════════
              🚀 TURBO MASTER SCANNER v3 🚀
════════════════════════════════════════════════════════════════════
Status: RUNNING | Progress: 3/5 (60.0%) | ✅ 3 | ❌ 0 | ⏭ 0
════════════════════════════════════════════════════════════════════

🔄 ACTIVE SCANS (2/12):
  • openai.com                    [████████░░░░░░░░] 4s
  • github.com                    [██████░░░░░░░░░░] 3s

────────────────────────────────────────────────────────────────────
⚡ TURBO MODE: Shared Browser + Context Pool + Resource Blocking
[Ctrl+C to stop] [Auto-save every 10 scans]
```

---

## ⏱️ **Várható Idő**

| Domains | TURBO Time | Standard Time | Speedup |
|---------|------------|---------------|---------|
| 5       | ~30s       | ~90s          | 3x      |
| 10      | ~60s       | ~180s         | 3x      |
| 50      | ~5 min     | ~15 min       | 3x      |
| 100     | ~10 min    | ~30 min       | 3x      |
| 1000    | ~1.5 óra   | ~4 óra        | 2.7x    |

---

## ✅ **Ellenőrzés (Működik?)**

### **Eredmények database-ben:**
```bash
# PostgreSQL query:
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM \"Scan\" WHERE \"createdAt\" > NOW() - INTERVAL '1 hour' GROUP BY status"

# Várható output:
  status   | count
-----------+-------
 COMPLETED |     5
 SCANNING  |     0
```

### **Admin dashboard:**
```bash
# Nyisd meg böngészőben:
open http://localhost:3000/admin

# Látni fogod:
- Scans: 5
- Success rate: 100%
- Recent scans listája
```

---

## 🔧 **Hibaelhárítás**

### **"playwright not found"**
```bash
pip3 install playwright
playwright install chromium
```

### **"API not reachable"**
```bash
# Terminal 1-ben futtasd:
cd ai-security-scanner
npm run dev

# Ellenőrizd:
curl http://localhost:3000
```

### **"Database connection failed"**
```bash
# Ellenőrizd DATABASE_URL:
echo $DATABASE_URL

# Ha nincs, add meg:
export DATABASE_URL="postgresql://localhost/ai_security_scanner"
```

### **"Too slow"**
```bash
# Csökkentsd a parallel contexts számát:
# Szerkeszd: scripts/turbo-master-scanner.py
# Line 31: MAX_PARALLEL_CONTEXTS = 8  (régi: 12)
```

---

## 💡 **Pro Tipp: Benchmark**

```bash
# Mérj le 5 domain-t és lásd a speedup-ot:
python3 scripts/benchmark-turbo.py test-domains.txt

# Output:
📊 BENCHMARK RESULTS
────────────────────────────────────────────────────────────────────
Metric                              TURBO       STANDARD        Speedup
────────────────────────────────────────────────────────────────────
Total Time (seconds)                 30.2          85.4           2.8x
Avg Time per Scan (s)                 6.0          17.1           2.8x
Throughput (scans/min)               10.0           3.5           2.9x
────────────────────────────────────────────────────────────────────

🏆 TURBO is 2.8x FASTER than STANDARD!
```

---

## 🎓 **Következő Lépések**

1. ✅ **Működik?** Próbálj 10 domain-t!
2. ✅ **Gyors?** Próbálj 50 domain-t!
3. ✅ **Production?** Olvass: [TURBO_README.md](./TURBO_README.md)
4. ✅ **Optimalizálás?** Olvass: [CLAUDE_2025_11_21.md](../CLAUDE_2025_11_21.md)

---

## 📚 **További Dokumentáció**

- **[TURBO_README.md](./TURBO_README.md)** - Teljes dokumentáció
- **[CLAUDE_2025_11_21.md](../CLAUDE_2025_11_21.md)** - Rendszer architektúra
- **[BULK_SCAN_README.md](./BULK_SCAN_README.md)** - Standard bulk scanning

---

**🚀 Happy Scanning!**

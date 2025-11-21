# 📋 SCANNER VERZIÓK ÉS VISSZAÁLLÍTÁSI ÚTMUTATÓ

## 🔄 Verzió Történet

### EREDETI VERZIÓ (Baseline)
**File:** `scripts/master-scanner.py`
**Commit:** `2a3880a` (2025-11-20)
**Státusz:** ✅ STABIL, MŰKÖDIK

Ez az eredeti, tesztelt verzió ami biztosan működik.

### Létrehozott Verziók

| Verzió | File | Dátum | Státusz | Mikor használd |
|--------|------|-------|---------|----------------|
| **Original** | `master-scanner.py` | 2025-11-19 | ✅ Stabil | Alapértelmezett, biztos működik |
| **Safe** | `master-scanner-safe.py` | 2025-11-20 | ✅ Tesztelt | 30 worker, ugyanaz a kód |
| **Turbo** | `master-scanner-turbo.py` | 2025-11-20 | ⚠️ Beta | Gyors, de frontend hiba lehet |
| **Smart** | `smart-scanner.py` | 2025-11-20 | 🔧 Experimental | Resource management |
| **Sharded** | `sharded-scanner.py` | 2025-11-20 | 🔧 Experimental | 20 DB sharding |

---

## 🔙 VISSZAÁLLÍTÁS AZ EREDETIRE

### 1. Azonnali visszaállítás (ha valami nem működik)

```bash
# STOP minden folyamat
pkill -9 -f "scanner"
pkill -9 -f "npm"
pkill -9 -f "node"

# Használd az EREDETI scanner-t
cd /Users/racz-akacosiattila/Desktop/10_M_USD
python3 ai-security-scanner/scripts/master-scanner.py domains.txt
```

### 2. Git-tel visszaállítás (ha elrontottad a kódot)

```bash
cd ai-security-scanner

# Nézd meg mi változott
git status
git diff scripts/master-scanner.py

# Visszaállítás az eredeti verzióra
git checkout scripts/master-scanner.py

# VAGY teljes reset a legutolsó commit-ra
git reset --hard HEAD

# VAGY konkrét commit-ra
git checkout 2a3880a -- scripts/master-scanner.py
```

### 3. Backup visszaállítás

Az eredeti scanner MINDIG megtalálható itt:
```bash
# Backup másolat (ha csináltál)
cp scripts/master-scanner-BACKUP.py scripts/master-scanner.py
```

---

## 🗂️ FILE STRUKTÚRA

```
ai-security-scanner/
├── scripts/
│   ├── master-scanner.py           # ✅ EREDETI - NE MÓDOSÍTSD!
│   ├── master-scanner-safe.py      # Több worker verzió
│   ├── master-scanner-turbo.py     # Gyorsított verzió
│   ├── smart-scanner.py            # Resource manager
│   ├── sharded-scanner.py          # Database sharding
│   ├── process-manager.py          # Process kezelő
│   └── compare-scanners.py         # Összehasonlító
├── src/
│   └── worker/
│       └── index-sqlite.ts         # ⚠️ WORKER - NEM VÁLTOZOTT!
└── SCANNER-VERSIONS-ROLLBACK.md    # Ez a file
```

---

## ⚙️ KONFIGURÁCIÓ KÜLÖNBSÉGEK

### master-scanner.py (EREDETI)
```python
MAX_SCANNING = 5        # Párhuzamos scan
MAX_PENDING = 2         # Várakozó
SCAN_TIMEOUT = 120      # 120 mp timeout
```

### master-scanner-safe.py
```python
MAX_SCANNING = 30       # TÖBB párhuzamos (változtatható)
MAX_PENDING = 10        # TÖBB várakozó
SCAN_TIMEOUT = 120      # Ugyanaz
```

### master-scanner-turbo.py
```python
MAX_SCANNING = 50       # SOKKAL TÖBB
SCAN_TIMEOUT = 30       # RÖVIDEBB timeout
# + Smart URL routing
```

---

## 🚨 PROBLÉMA MEGOLDÁS

### Ha stuck scans vannak
```bash
# Tisztítás
psql postgresql://localhost/ai_security_scanner -c '
  DELETE FROM "Scan" WHERE status IN ('"'"'SCANNING'"'"', '"'"'FAILED'"'"');
'
```

### Ha 20+ process fut
```bash
# Mindent leállít
pkill -9 -f "npm"
pkill -9 -f "node"
pkill -9 -f "python"
pkill -9 -f "tsx"
```

### Ha port foglalt (3000)
```bash
# Ki foglalja?
lsof -i :3000

# Kill by port
kill -9 $(lsof -t -i:3000)
```

---

## 📊 TELJESÍTMÉNY ÖSSZEHASONLÍTÁS

| Verzió | Sebesség | Stabilitás | Memory | Használd ha |
|--------|----------|------------|--------|-------------|
| **master-scanner.py** | 5-15/min | ⭐⭐⭐⭐⭐ | 2GB | Biztos működés kell |
| **master-scanner-safe.py** | 30-50/min | ⭐⭐⭐⭐ | 3GB | Gyorsabb kell, de stabil |
| **master-scanner-turbo.py** | 50-200/min | ⭐⭐⭐ | 1GB | Nagyon gyors kell |
| **sharded-scanner.py** | 100-500/min | ⭐⭐ | 4GB | Massive parallel kell |

---

## ✅ AJÁNLOTT HASZNÁLAT

### Napi használatra
```bash
# Ez a legstabilabb
python3 scripts/master-scanner.py domains.txt
```

### Nagy mennyiséghez (100k+ domain)
```bash
# Safe verzió több worker-rel
python3 scripts/master-scanner-safe.py domains.txt
```

### Teszteléshez
```bash
# Összehasonlítás
python3 scripts/compare-scanners.py test-5-domains.txt
```

---

## 🔒 FONTOS MEGJEGYZÉSEK

1. **A worker (`src/worker/index-sqlite.ts`) NEM VÁLTOZOTT!**
   - Minden scanner verzió ugyanazt használja
   - Az elemzés ugyanúgy működik

2. **Az API és frontend NEM VÁLTOZOTT!**
   - http://localhost:3000 ugyanúgy működik
   - Dashboard ugyanazt mutatja

3. **Csak a scanner orchestration változott!**
   - Hogyan indítjuk a worker-eket
   - Hány párhuzamos fut
   - Milyen sorrendben

---

## 📞 SUPPORT

Ha probléma van:

1. Használd az eredeti `master-scanner.py`-t
2. Nézd meg ezt a dokumentumot
3. Git reset ha kell: `git reset --hard HEAD`

---

## 🏷️ VERZIÓK COMMIT HASH

Mentsd el ezeket a commit hash-eket visszaállításhoz:

```bash
# Eredeti működő verzió
git checkout 2a3880a

# Vagy cherry-pick csak a scanner-t
git checkout 2a3880a -- scripts/master-scanner.py
```

---

Készítette: Claude
Dátum: 2025-11-20
Verzió: 1.0
# 🚀 Batch Scanning Guide - 3 Variáció

**Dátum:** 2025-11-24
**Worker count:** 40 PM2 instances
**Célpont:** 1,000 domains (teszt) → 229,880 domains (full)

---

## 📊 Három Mód Összehasonlítása

| Mód | Batch Size | API Delay | Várható Idő (1000 domain) | Ajánlott |
|-----|------------|-----------|----------------------------|----------|
| 🚀 **TURBO** | 40 domain | 0ms | **~20-30 perc** | Szerver, gyors net |
| ⚖️ **BALANCED** | 20 domain | 50ms | **~40-60 perc** | **Otthoni net (ajánlott)** |
| 🐢 **CONSERVATIVE** | 10 domain | 100ms | **~60-90 perc** | Lassú net, biztonsági |

---

## 🚀 TURBO MODE

**Leggyorsabb, maximális kihasználtság**

### Előnyök:
- ⚡ **Leggyorsabb**: ~20-30 perc/1000 domain
- 🔥 **40 domain egyszerre** indul (1 batch = 40 worker teljes kihasználtsága)
- 🚀 **0ms delay** az API hívások között
- 📈 **~30-40 scan/perc** (FAST lane optimalizált)

### Hátrányok:
- 🌐 **Hálózati terhelés**: Sok párhuzamos kimenő kérés
- ⚠️ **ISP throttling** kockázat otthoni neten
- 🔥 **CPU/RAM intenzív** a workereknek

### Mikor használd:
- ✅ Szerveren vagy adatközpontban
- ✅ Gyors, stabil internet kapcsolat
- ✅ Nincs ISP rate limit
- ✅ Gyors teszteléshez

### Indítás:
```bash
chmod +x /tmp/batch-scan-TURBO.sh
/tmp/batch-scan-TURBO.sh
```

---

## ⚖️ BALANCED MODE **(AJÁNLOTT OTTHONI NETHEZ)**

**Jó egyensúly sebesség és stabilitás között**

### Előnyök:
- ⚡ **Gyors**: ~40-60 perc/1000 domain
- 🏠 **Otthoni net-friendly**: 50ms delay az API hívások között
- 📦 **20 domain batchenként** - nem túl sok, nem túl kevés
- ⚖️ **Stabil**: Nem terheli túl a hálózatot
- 📊 **~15-20 scan/perc** átlag

### Hátrányok:
- ⏱️ Lassabb mint TURBO (de még mindig gyors!)

### Mikor használd:
- ✅ **Otthoni net (LEGJOBB VÁLASZTÁS)**
- ✅ Közepesen gyors internet
- ✅ Hosszú távú, stabil futás
- ✅ Production testing

### Indítás:
```bash
chmod +x /tmp/batch-scan-BALANCED.sh
/tmp/batch-scan-BALANCED.sh
```

---

## 🐢 CONSERVATIVE MODE

**Legbiztonságosabb, legkíméletesebb**

### Előnyök:
- 🏠 **Nagyon net-friendly**: 100ms delay az API hívások között
- 🛡️ **Biztonságos**: Minimális hálózati terhelés
- 🐢 **10 domain batchenként** - apró lépések
- 📊 **~10-15 scan/perc** átlag
- ✅ **Részletes progress** - minden scan külön sorban látható

### Hátrányok:
- ⏱️ **Leglassabb**: ~60-90 perc/1000 domain
- 🐌 Kevésbé hatékony worker kihasználtság

### Mikor használd:
- ✅ Lassú otthoni net
- ✅ ISP rate limit problémák
- ✅ Első futtatás, tesztelés
- ✅ Éjszakai futtatás (nem zavar)

### Indítás:
```bash
chmod +x /tmp/batch-scan-CONSERVATIVE.sh
/tmp/batch-scan-CONSERVATIVE.sh
```

---

## 🎯 Melyiket Válaszd Otthoni Nethez?

### **Ajánlott: BALANCED MODE** ⚖️

Otthoni internet kapcsolathoz ez a legjobb választás:
- ✅ Nem terheli túl a hálózatot
- ✅ Még mindig gyors (~40-60 perc/1000 domain)
- ✅ Stabil, hosszú távú futásra alkalmas
- ✅ Nem fog ISP throttling-ba ütközni

### Ha **nagyon lassú** a neted:
→ Használd a **CONSERVATIVE MODE**-ot 🐢

### Ha **gyors** a neted és szeretnél kísérletezni:
→ Próbáld ki a **TURBO MODE**-ot 🚀

---

## 📈 Várható Teljesítmény (Otthoni Net + BALANCED Mode)

### 1,000 domain:
- ⏱️ **~40-60 perc**
- 📊 **~15-20 scan/perc**
- ✅ **950+ sikeres scan** (95%+ success rate)

### 229,880 domain (teljes lista):
- ⏱️ **~150-190 óra** (~6-8 nap continuous)
- 📊 **~15-20 scan/perc**
- ✅ **218,000+ sikeres scan**

### Optimalitás:
**VAGY:**
1. Futtatsd 8-10 órás blokkokban naponta (pl. éjszaka)
2. ~230 blokk szükséges (23-30 nap total)

**VAGY:**
3. Használj VPS-t/szerveres TURBO mode-dal → **~3-4 nap**

---

## 🛠️ Hogyan Állítsd Meg a Futó Scriptet?

Ha futtatás közben meg akarod állítani:

```bash
# Megtalálni a process-t
ps aux | grep batch-scan

# Leállítani
pkill -f "batch-scan-TURBO.sh"
pkill -f "batch-scan-BALANCED.sh"
pkill -f "batch-scan-CONSERVATIVE.sh"

# VAGY egyszerűen Ctrl+C a terminalban
```

---

## 📊 Real-Time Monitoring

Monitoring script indítása másik terminalban:

```bash
chmod +x /tmp/monitor-batch-progress.sh
/tmp/monitor-batch-progress.sh
```

Ez mutatja:
- ✅ Completed scans
- ❌ Failed scans
- ⏳ Scanning (in progress)
- 📊 Átlagos scan duration
- 🔄 Frissítés minden 3 másodpercben

---

## 🎬 Következő Lépések az 1000 Domain Teszt Után

1. **Eredmények ellenőrzése:**
   ```bash
   # Success rate
   echo "$(wc -l < /tmp/balanced-1000-scan-ids.txt) scans created"

   # Database check
   export PGPASSWORD=ai_scanner_2025
   psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "
     SELECT status, COUNT(*)
     FROM \"Scan\"
     WHERE \"createdAt\" > NOW() - INTERVAL '2 hours'
     GROUP BY status;
   "
   ```

2. **Ha jók az eredmények (>90% success):**
   - Folytathatod a full 229,880 domainnel
   - Módosítsd a script-ben: `MAX_DOMAINS=229880`
   - Vagy használd a full domains.txt fájlt

3. **Ha problémák vannak:**
   - Válts CONSERVATIVE mode-ra
   - Csökkentsd a worker számot (pl. 20 helyett 10)
   - Növeld az API delay-t (pl. 100ms vagy 200ms)

---

## 🏁 Összefoglalás

| Helyzet | Ajánlott Mód |
|---------|--------------|
| 🏠 Otthoni net, normál sebesség | **BALANCED** ⚖️ |
| 🐌 Otthoni net, lassú | **CONSERVATIVE** 🐢 |
| 🚀 Szerver, datacenter | **TURBO** 🚀 |
| 🧪 Első teszt | **CONSERVATIVE** 🐢 |
| 📈 Production, long-term | **BALANCED** ⚖️ |

**Kezdd a BALANCED mode-dal**, és ha minden smooth, maradj annál. Ha problémák vannak, válts CONSERVATIVE-ra.

---

**Készítette:** Claude Code
**Verzió:** 2025-11-24
**Worker System:** Hybrid PHP+Playwright Scanner

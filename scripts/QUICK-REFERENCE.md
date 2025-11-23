# 🚀 SCANNER GYORS REFERENCIA

## MELYIKET HASZNÁLJAM?

### ✅ **HASZNÁLD EZT:** `master-scanner.py`
```bash
python3 scripts/master-scanner.py domains.txt
```
**Ez az eredeti, stabil, tesztelt verzió!**

---

## 🔄 VISSZAÁLLÍTÁS 10 MÁSODPERC ALATT

```bash
# 1. ÁLLÍTS LE MINDENT
pkill -9 -f scanner ; pkill -9 -f npm ; pkill -9 -f node

# 2. INDÍTSD AZ EREDETIT
cd /Users/racz-akacosiattila/Desktop/10_M_USD
python3 ai-security-scanner/scripts/master-scanner.py domains.txt
```

---

## 📊 VERZIÓ ÖSSZEHASONLÍTÁS

| Mi a baj? | Melyik scanner oldja meg? | Parancs |
|-----------|---------------------------|---------|
| **Túl lassú** | master-scanner-safe.py | `python3 scripts/master-scanner-safe.py domains.txt` |
| **20+ process fut** | smart-scanner.py | `python3 scripts/smart-scanner.py domains.txt` |
| **Port ütközés** | process-manager.py | `python3 scripts/process-manager.py` |
| **100k+ domain** | sharded-scanner.py | `python3 scripts/sharded-scanner.py domains.txt` |
| **Nem tudom mi a baj** | **master-scanner.py** | `python3 scripts/master-scanner.py domains.txt` |

---

## ⚠️ FONTOS

**A WORKER NEM VÁLTOZOTT!** Minden scanner ugyanazt az elemzőt használja:
- `src/worker/index-sqlite.ts` - Ez maradt
- Minden security check ugyanúgy fut
- Minden eredmény ugyanaz

**Csak az orchestration változott** (hogyan indítjuk a workereket).

---

## 🆘 VÉSZHELYZET

Ha semmi nem működik:

```bash
# TELJES RESET
cd ai-security-scanner
git reset --hard HEAD
pkill -9 -f node
npm run dev  # Egy terminálban
python3 scripts/master-scanner.py test-5-domains.txt  # Másikban
```

---

Utoljára frissítve: 2025-11-20
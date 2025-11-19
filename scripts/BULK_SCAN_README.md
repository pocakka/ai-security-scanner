# Bulk Scan Script

## 🎯 Célja

100,000+ domain szkennelése tömegesen, nyelv detektálással és hibatűréssel.

## ✨ Funkciók

- ✅ **Nyelv detektálás** - Csak angol nyelvű oldalakat szkennelünk
- ✅ **Párhuzamos feldolgozás** - Max 5 worker egyszerre
- ✅ **Retry logika** - Automatikus újrapróbálkozás hálózati hibánál
- ✅ **Progress tracking** - Folyamat mentése és folytatása
- ✅ **Graceful shutdown** - Ctrl+C-vel biztonságosan leállítható
- ✅ **Rate limiting** - 2 mp késleltetés kérések között

## 📋 Előfeltételek

```bash
# Python 3 szükséges
python3 --version

# requests library telepítése
pip3 install requests
```

## 🚀 Használat

### 1. Domain lista elkészítése

Készíts egy `domains.txt` fájlt (egy domain per sor):

```
reddit.com
github.com
openai.com
anthropic.com
vercel.com
```

### 2. Script futtatása

```bash
# Indítsd el a worker-t egy külön terminálban
npm run worker

# Indítsd el a bulk scan-t
python3 scripts/bulk-scan.py domains.txt
```

### 3. Megállítás (Ctrl+C)

A script **gracefully** leáll - befejezi az aktuális scan-eket, majd elmenti a progresst.

### 4. Folytatás

Ha a script leállt vagy te leállítottad, egyszerűen indítsd újra:

```bash
python3 scripts/bulk-scan.py domains.txt
```

A script automatikusan folytatja ahol abbahagyta (a `bulk-scan-progress.json` fájlból olvassa be).

## 🌐 Nyelv Detektálás

A script automatikusan **kiszűri** a nem angol nyelvű oldalakat:

### Kiszűrt nyelvek:
- 🇰🇷 Koreai (Hangul)
- 🇯🇵 Japán (Hiragana, Katakana, Kanji)
- 🇹🇭 Thai
- 🇷🇺 Orosz (Cirill)
- 🇸🇦 Arab
- 🇮🇱 Héber
- 🇨🇳 Kínai
- 🇭🇺 Magyar (ékezetes karakterek >10%)
- 🇸🇰 Szlovák (ékezetes karakterek >10%)

### Működés:
1. Letölti az oldal első 50KB-ját
2. Megszámolja a nem-angol karaktereket
3. Ha >10% nem-angol → **SKIP**

## 📊 Progress Tracking

A script létrehoz egy `bulk-scan-progress.json` fájlt:

```json
{
  "processed_domains": [
    "reddit.com",
    "github.com"
  ],
  "failed_domains": [
    "broken-site.com"
  ]
}
```

## 🔧 Konfiguráció

Szerkeszd a `scripts/bulk-scan.py` fájlt:

```python
# Párhuzamos worker-ek száma
MAX_WORKERS = 5

# Retry kísérletek száma
RETRY_ATTEMPTS = 3

# Várakozás retry előtt (másodperc)
RETRY_DELAY = 10

# Késleltetés kérések között (másodperc)
RATE_LIMIT_DELAY = 2
```

## 📈 Teljesítmény

| Domain szám | Becsült idő (5 worker) |
|-------------|------------------------|
| 100         | ~3 perc                |
| 1,000       | ~33 perc               |
| 10,000      | ~5.5 óra               |
| 100,000     | ~2.3 nap               |

**Megjegyzés:** Ez függ a:
- Hálózati sebességtől
- Scan időtartamától (~10-30 sec/domain)
- Language check időtől (~2-5 sec/domain)
- Skipped domain-ektől

## 🐛 Hibaelhárítás

### "Connection refused"
```bash
# Ellenőrizd hogy a dev server fut-e
curl http://localhost:3000/api/scan

# Ha nem, indítsd el:
npm run dev
```

### "Worker not processing scans"
```bash
# Ellenőrizd hogy a worker fut-e
npm run worker
```

### "Too many failed domains"
```bash
# Nézd meg a failed_domains listát
cat bulk-scan-progress.json | jq '.failed_domains'

# Vagy indítsd újra csak a failed domain-ekkel
jq -r '.failed_domains[]' bulk-scan-progress.json > failed-domains.txt
python3 scripts/bulk-scan.py failed-domains.txt
```

## 💡 Tippek

### 1. Több worker párhuzamosan
```bash
# Terminal 1
npm run worker

# Terminal 2
npm run worker

# Terminal 3
npm run worker

# Most MAX_WORKERS = 10-re állítható
```

### 2. Csak AI-s oldalak
A scan után:
```sql
SELECT url, "scanNumber" FROM "Scan" WHERE "hasAI" = true ORDER BY "scanNumber" DESC;
```

### 3. Progress monitoring
```bash
# Folyamatosan frissülő statisztika
watch -n 5 'cat bulk-scan-progress.json | jq "{processed: .processed_domains | length, failed: .failed_domains | length}"'
```

## ⚠️ Fontos Megjegyzések

1. **Rate Limiting:** A script 2mp-et vár kérések között hogy ne terhelje túl a szervert
2. **Duplicate Check:** A backend automatikusan ellenőrzi hogy egy domain már volt-e szkennelve az elmúlt 24 órában
3. **Nyelv Detektálás:** Heurisztikus (nem 100% pontos) - lehet false positive/negative
4. **Memory Usage:** 5 worker ~500MB RAM-ot használ
5. **Disk Space:** Minden scan ~500KB adatbázisban

## 🎓 Példa Output

```
============================================================
Progress: 42/100 (42.0%)
Success: 35 | Failed: 2 | Skipped: 5
############################################################

============================================================
🔍 Scanning: example.com
============================================================
  📝 Checking language...
  ✅ English site detected
  🚀 Creating scan...
  ✅ Scan created: abc123-def456
  📊 View at: http://localhost:3000/scan/abc123-def456
```

## 📚 További Dokumentáció

- [DATABASE_SCALING.md](../docs/DATABASE_SCALING.md) - Adatbázis scaling
- [DEVELOPMENT_WORKFLOW.md](../docs/DEVELOPMENT_WORKFLOW.md) - Dev workflow
- [SEO_GUIDE.md](../docs/SEO_GUIDE.md) - SEO URL struktúra

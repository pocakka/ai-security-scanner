# Hibrid Crawler Terv - curl_cffi + Playwright

**Dátum**: 2025-11-28
**Cél**: CPU használat csökkentése ~70%-kal

---

## 1. PROBLÉMA

Jelenlegi helyzet:
- 20 párhuzamos Playwright + Chromium = 24 core 100%-on
- 1 Chromium instance = ~300MB RAM, ~1-2 core CPU
- Minden scan-hez teljes böngésző indul

## 2. MEGOLDÁS

Hibrid megközelítés:
1. **Először**: curl_cffi (Chrome TLS fingerprint, de NINCS böngésző)
2. **Ha fail**: Playwright fallback (csak szükség esetén)

### Várható eredmény:
- ~70% scan működik curl_cffi-vel → ~1% CPU
- ~30% scan kell Playwright → ~100% CPU
- **Összesen: ~30% CPU használat a jelenlegi helyett!**

---

## 3. ÚJ FÁJLOK (ezek készülnek)

| Fájl | Leírás |
|------|--------|
| `scripts/curl_cffi_fetch.py` | Python script - curl_cffi hívás |
| `src/lib/curl-cffi-wrapper.ts` | Node.js wrapper a Python scripthez |
| `src/lib/crawler-hybrid.ts` | Hibrid crawler osztály |

---

## 4. MÓDOSULÓ FÁJLOK (visszaállítható!)

### 4.1 `src/worker/index-sqlite.ts` (51. sor körül)

**ELŐTTE:**
```typescript
const USE_REAL_CRAWLER = process.env.USE_REAL_CRAWLER === 'true'
const crawler = USE_REAL_CRAWLER ? new CrawlerAdapter() : new MockCrawler()
```

**UTÁNA:**
```typescript
const USE_REAL_CRAWLER = process.env.USE_REAL_CRAWLER === 'true'
const USE_HYBRID = process.env.USE_HYBRID_CRAWLER === 'true'

let crawler
if (USE_HYBRID) {
  const { HybridCrawler } = require('../lib/crawler-hybrid')
  crawler = new HybridCrawler()
} else if (USE_REAL_CRAWLER) {
  crawler = new CrawlerAdapter()
} else {
  crawler = new MockCrawler()
}
```

### 4.2 `.env` (új sor hozzáadása)

```bash
# Hibrid crawler (curl_cffi + Playwright fallback)
USE_HYBRID_CRAWLER=true
```

---

## 5. VISSZAÁLLÍTÁS (ha nem működik)

### 5.1 Gyors visszaállítás (.env):
```bash
# .env fájlban:
USE_HYBRID_CRAWLER=false
```
→ Azonnal visszaáll a régi Playwright-only módra

### 5.2 Teljes visszaállítás (kód törlés):
```bash
# Új fájlok törlése (opcionális):
rm scripts/curl_cffi_fetch.py
rm src/lib/curl-cffi-wrapper.ts
rm src/lib/crawler-hybrid.ts

# index-sqlite.ts visszaállítása az eredeti 2 sorra
```

---

## 6. FÜGGŐSÉGEK TELEPÍTÉSE

```bash
# Python curl_cffi telepítése
pip install curl_cffi

# Ellenőrzés
python3 -c "from curl_cffi import requests; print('OK')"
```

---

## 7. HIBRID CRAWLER LOGIKA

```
crawl(url)
    │
    ▼
┌─────────────────────────────┐
│ 1. curl_cffi próba          │
│    - Chrome 110 TLS spoof   │
│    - timeout: 10s           │
│    - CPU: ~1%               │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ 2. Válasz ellenőrzés        │
│    - Van HTML tartalom?     │
│    - Cloudflare challenge?  │
│    - "Enable JavaScript"?   │
└─────────────┬───────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
   ✅ OK         ❌ FAIL
       │             │
       ▼             ▼
  Return         Playwright
  curl_cffi      fallback
  result         (képek blokkolva)
```

---

## 8. TESZTELÉS

### 8.1 Manuális teszt (curl_cffi):
```bash
cd ai-security-scanner
python3 scripts/curl_cffi_fetch.py https://example.com
```

### 8.2 Manuális teszt (hibrid crawler):
```bash
# .env beállítás
USE_HYBRID_CRAWLER=true
USE_REAL_CRAWLER=true

# Worker indítása egy teszthez
npm run worker
```

### 8.3 Teljes teszt (parallel-scanner):
```bash
# Kis domain listával tesztelés
echo "google.com
github.com
example.com" > test-domains.txt

python3 scripts/parallel-scanner.py test-domains.txt
```

---

## 9. MONITORING

A worker logban látható lesz:
```
[Crawler] 🚀 curl_cffi próba: https://example.com
[Crawler] ✅ curl_cffi sikeres (234ms, 45KB HTML)

[Crawler] 🚀 curl_cffi próba: https://cloudflare-protected.com
[Crawler] ⚠️ curl_cffi fail: Cloudflare challenge detected
[Crawler] 🔄 Playwright fallback indítása...
[Crawler] ✅ Playwright sikeres (2340ms, 120KB HTML)
```

---

## 10. ÖSSZEFOGLALÓ

| Állapot | Leírás |
|---------|--------|
| **Jelenlegi** | 100% Playwright → 100% CPU |
| **Új (hibrid)** | 70% curl_cffi + 30% Playwright → ~30% CPU |
| **Visszaállítás** | `.env` → `USE_HYBRID_CRAWLER=false` |

---

**Készen állsz? Ha jóváhagyod, elkezdem implementálni.**

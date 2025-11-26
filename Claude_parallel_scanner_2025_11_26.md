# Fejlesztői Dokumentáció: Parallel Scanner (parallel-scanner.py)

**Fájl**: `scripts/parallel-scanner.py`
**Típus**: Python 3 CLI Script - Multi-Threaded Batch Scanner
**Sorok száma**: 375
**Készült**: 2025-11-26
**Verzió**: 1.0.0

---

## TARTALOMJEGYZÉK

1. [Áttekintés](#1-áttekintés)
2. [Rendszerkövetelmények](#2-rendszerkövetelmények)
3. [Konfiguráció](#3-konfiguráció)
4. [Architektúra](#4-architektúra)
5. [Importok és Függőségek](#5-importok-és-függőségek)
6. [Globális Állapot](#6-globális-állapot)
7. [Funkciók Részletezése](#7-funkciók-részletezése)
8. [Fő Loop Logika](#8-fő-loop-logika)
9. [API Integráció](#9-api-integráció)
10. [Adatbázis Kapcsolat](#10-adatbázis-kapcsolat)
11. [Progress Management](#11-progress-management)
12. [Hibakezelés](#12-hibakezelés)
13. [Teljesítmény Megfontolások](#13-teljesítmény-megfontolások)
14. [Használati Útmutató](#14-használati-útmutató)

---

## 1. ÁTTEKINTÉS

### Mi ez a script?
A `parallel-scanner.py` egy **multi-threaded batch scanner**, amely nagy mennyiségű domain-t képes párhuzamosan szkennelni az AI Security Scanner API-ján keresztül.

### Fő Jellemzők
- ✅ **50 párhuzamos thread** (konfigurálható)
- ✅ **Real-time progress** kijelzés
- ✅ **Queue management** - automatikus terhelésszabályozás
- ✅ **Crash recovery** - progress mentés és folytatás
- ✅ **Rate limiting** - router-friendly sebesség
- ✅ **Stuck scan cleanup** - 180 másodperc után FAILED-re állít
- ✅ **Browser-like headers** - bot detection elkerülése

### Működési Elv
```
┌─────────────────────────────────────────────────────────────────┐
│                    PARALLEL SCANNER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  domains.txt ─────► ThreadPoolExecutor (50 thread)              │
│       │                    │                                     │
│       │                    ├──► Thread 1 ──► POST /api/scan     │
│       │                    ├──► Thread 2 ──► POST /api/scan     │
│       │                    ├──► Thread 3 ──► POST /api/scan     │
│       │                    │    ...                              │
│       │                    └──► Thread 50 ──► POST /api/scan    │
│       │                                                          │
│       ▼                                                          │
│  PostgreSQL ◄── Queue Status Check (PENDING/SCANNING counts)    │
│       │                                                          │
│       ▼                                                          │
│  Dynamic Throttling: if queue full → wait 3s                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. RENDSZERKÖVETELMÉNYEK

### Python Verzió
```
Python 3.8+
```

### Python Csomagok
```bash
pip install requests psycopg2-binary
```

| Csomag | Verzió | Cél |
|--------|--------|-----|
| requests | 2.28+ | HTTP API hívások |
| psycopg2-binary | 2.9+ | PostgreSQL kapcsolat |

### Külső Szolgáltatások
1. **Next.js API Server** - `http://localhost:3000`
2. **PostgreSQL** (pgBouncer-en keresztül) - `localhost:6432`
3. **Worker-ek** - PM2-vel futtatott analyzer worker-ek

### Fájl Függőségek
| Fájl | Típus | Cél |
|------|-------|-----|
| `domains.txt` | Input | Domain lista (egy domain/sor) |
| `parallel-scanner-progress.json` | Output | Progress mentés (auto-generated) |

---

## 3. KONFIGURÁCIÓ

### Konfigurációs Konstansok (Lines 28-60)

```python
# API Endpoint
API_URL = "http://localhost:3000/api/scan"

# Database Connection String
DB_URL = "postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"

# Threading
MAX_THREADS = 50              # Párhuzamos API call-ok száma
THREAD_RATE_LIMIT = 1.0       # Másodperc késleltetés thread indítások között

# Queue Targets (terhelésszabályozás)
TARGET_SCANNING = 70          # Ennyi SCANNING státuszú scan legyen egyszerre
TARGET_PENDING = 20           # Ennyi PENDING státuszú scan legyen a queue-ban

# Timing
POLL_INTERVAL = 3             # Másodperc a queue status ellenőrzések között

# Progress File
PROGRESS_FILE = "parallel-scanner-progress.json"
```

### Konfigurációs Értékek Magyarázata

#### MAX_THREADS = 50
- **Cél**: Párhuzamos HTTP kérések száma
- **Optimalizálva**: i9 processzor + 128GB RAM rendszerre
- **Korlátok**:
  - Túl magas érték → API túlterhelés
  - Túl alacsony érték → Lassú feldolgozás
- **Ajánlás**: 4-8 core CPU-hoz 20-30, 16+ core-hoz 50-100

#### THREAD_RATE_LIMIT = 1.0
- **Cél**: Késleltetés új thread indítása között
- **Érték**: 1.0 másodperc = ~1 új kérés/másodperc indítás
- **Megjegyzés**: A kommentben "100ms" és "20 scans/sec" szerepel, de a kód 1.0s-t használ!
- **Hatás**: 50 thread × 1s = 50 másodperc egy teljes batch elindítására

#### TARGET_SCANNING = 70, TARGET_PENDING = 20
- **Összesen**: 90 aktív scan egyszerre
- **Logika**: Ha `PENDING + SCANNING < 90`, akkor új scaneket hoz létre
- **Queue feltöltés**: `scans_to_create = 90 - (pending + scanning)`

### Browser-Like Headers (Lines 48-61)
```python
BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Accept': 'text/html,application/xhtml+xml,...',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
}
```

**Cél**: Bot detection elkerülése - Chrome böngészőt szimulál
**Megjegyzés**: Ezek a headerek a `/api/scan` endpoint felé mennek, nem a scannelt domain-ek felé!

---

## 4. ARCHITEKTÚRA

### Adatfolyam Diagram

```
┌──────────────┐
│ domains.txt  │
│ (input file) │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              PARALLEL SCANNER MAIN LOOP                   │
│                                                           │
│  1. load_progress() ─► Hol tartottunk?                   │
│                                                           │
│  2. while running:                                        │
│     │                                                     │
│     ├─► cleanup_stuck_scans() ─► DB UPDATE (180s stuck)  │
│     │                                                     │
│     ├─► get_queue_status() ─► DB SELECT                  │
│     │       │                                             │
│     │       ▼                                             │
│     │   pending=X, scanning=Y                             │
│     │       │                                             │
│     │       ▼                                             │
│     │   scans_to_create = 90 - (X + Y)                   │
│     │       │                                             │
│     │       ▼                                             │
│     │   if scans_to_create == 0:                         │
│     │       sleep(3s) ─► continue                         │
│     │       │                                             │
│     │       ▼                                             │
│     ├─► ThreadPoolExecutor.submit(create_scan, ...)      │
│     │       │                                             │
│     │       ├──► POST /api/scan {"url": "domain1"}       │
│     │       ├──► POST /api/scan {"url": "domain2"}       │
│     │       └──► ...                                      │
│     │                                                     │
│     ├─► Wait for all futures                              │
│     │                                                     │
│     ├─► save_progress() (minden 60s)                     │
│     │                                                     │
│     └─► sleep(3s) ─► next iteration                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│ parallel-scanner-    │
│ progress.json        │
│ (checkpoint)         │
└──────────────────────┘
```

### Thread Lifecycle

```
Main Thread                    Worker Threads (50x)
    │                               │
    │ executor.submit() ───────────►│
    │                               │
    │ time.sleep(1.0) ◄─────────────│ (rate limit)
    │                               │
    │ executor.submit() ───────────►│
    │                               │
    │ ...                           │
    │                               │
    │◄─── as_completed(futures) ────│
    │                               │
    ▼                               ▼
```

---

## 5. IMPORTOK ÉS FÜGGŐSÉGEK

### Standard Library (Lines 16-26)
```python
import requests          # HTTP kliens
import psycopg2          # PostgreSQL driver
import time              # sleep, timing
import sys               # CLI arguments, exit
import json              # Progress file I/O
import signal            # SIGINT (Ctrl+C) kezelés
import threading         # Lock a stats-hoz
from datetime import datetime         # Timestamp
from typing import Dict, List         # Type hints
from queue import Queue               # (Nem használt ebben a verzióban)
from concurrent.futures import ThreadPoolExecutor, as_completed
```

### Külső Csomagok
| Csomag | Import | Verzió | Telepítés |
|--------|--------|--------|-----------|
| requests | `import requests` | 2.28+ | `pip install requests` |
| psycopg2 | `import psycopg2` | 2.9+ | `pip install psycopg2-binary` |

### Nem Használt Import
```python
from queue import Queue  # Importálva, de nincs használva a kódban
```

---

## 6. GLOBÁLIS ÁLLAPOT

### Global Variables (Lines 67-74)

```python
running = True  # Scanner fut-e még

stats = {
    'total_created': 0,      # Sikeresen létrehozott scanek
    'total_failed': 0,       # Hibás API hívások
    'start_time': datetime.now().isoformat(),  # Indulás időpontja
    'last_index': -1         # Utolsó feldolgozott domain index
}

stats_lock = threading.Lock()  # Thread-safe stats frissítés
```

### Thread Safety
A `stats` dictionary-t több thread is módosíthatja, ezért `threading.Lock()` védi:
```python
with stats_lock:
    stats['total_created'] += 1
    stats['last_index'] = index
```

### Signal Handler (Lines 76-84)
```python
def signal_handler(sig, frame):
    """Ctrl+C handler"""
    global running
    print("\n\n⏸️  Stopping scanner...")
    running = False
    save_progress()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
```

**Működés**:
1. Ctrl+C lenyomása → SIGINT signal
2. `running = False` → Main loop megáll
3. `save_progress()` → Checkpoint mentés
4. `sys.exit(0)` → Tiszta kilépés

---

## 7. FUNKCIÓK RÉSZLETEZÉSE

### get_queue_status() (Lines 90-118)

**Cél**: Aktuális queue állapot lekérdezése a PostgreSQL-ből

**SQL Query**:
```sql
SELECT
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
    COUNT(*) FILTER (WHERE status = 'SCANNING') as scanning,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM "Scan"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
```

**Visszatérési Érték**:
```python
{
    'pending': int,    # PENDING státuszú scanek száma (utolsó 1 óra)
    'scanning': int,   # SCANNING státuszú scanek száma
    'completed': int,  # COMPLETED státuszú scanek száma
    'failed': int      # FAILED státuszú scanek száma
}
```

**Hiba esetén**: `{'pending': 0, 'scanning': 0, 'completed': 0, 'failed': 0}`

**Fontos**: Csak az **utolsó 1 órában** létrehozott scaneket számolja!

---

### cleanup_stuck_scans() (Lines 120-162)

**Cél**: Elakadt SCANNING státuszú scanek FAILED-re állítása

**Paraméter**: `timeout_seconds: int = 180` (3 perc)

**SQL Query (Find)**:
```sql
SELECT COUNT(*)
FROM "Scan"
WHERE status = 'SCANNING'
AND "createdAt" < NOW() - make_interval(secs => 180)
```

**SQL Query (Update)**:
```sql
UPDATE "Scan"
SET
    status = 'FAILED',
    "completedAt" = NOW(),
    error = jsonb_build_object(
        'error', 'Scan timeout',
        'message', 'Scan exceeded maximum allowed time (180s)...',
        'cleanedUpAt', NOW()::text
    )
WHERE status = 'SCANNING'
AND "createdAt" < NOW() - make_interval(secs => 180)
```

**Visszatérési Érték**: `int` - Megtisztított scanek száma

**Mikor fut**: Minden main loop iteráció elején!

---

### create_scan() (Lines 168-204)

**Cél**: Egyetlen scan létrehozása az API-n keresztül (thread-safe)

**Paraméterek**:
- `domain: str` - Domain név (pl. "example.com")
- `index: int` - Aktuális domain index a listában
- `total: int` - Összes domain száma

**URL Normalizálás**:
```python
url = domain if domain.startswith('http') else f'https://{domain}'
```
- Input: `example.com` → Output: `https://example.com`
- Input: `http://example.com` → Output: `http://example.com` (változatlan)

**API Hívás**:
```python
response = requests.post(
    API_URL,  # http://localhost:3000/api/scan
    json={'url': url},
    headers=BROWSER_HEADERS,
    timeout=10
)
```

**Response Kezelés**:
| Status Code | Viselkedés |
|-------------|------------|
| 200, 201 | Siker - stats frissítés |
| 200 + isDuplicate | Skip - már létezik |
| Egyéb | Hiba - stats['total_failed']++ |

**Thread Safety**: `stats_lock` használat minden stats módosításnál

**Visszatérési Érték**: `bool` - Sikeres volt-e

---

### save_progress() (Lines 210-217)

**Cél**: Aktuális állapot mentése JSON fájlba

**Output File**: `parallel-scanner-progress.json`

**Tartalom**:
```json
{
  "total_created": 1234,
  "total_failed": 56,
  "start_time": "2025-11-26T12:00:00.000000",
  "last_index": 1289
}
```

**Mikor hívódik**:
1. Ctrl+C signal handler-ben
2. Main loop-ban minden 60 másodpercben
3. Scanner befejezésekor

---

### load_progress() (Lines 219-232)

**Cél**: Korábbi állapot betöltése (crash recovery)

**Input File**: `parallel-scanner-progress.json`

**Visszatérési Érték**: `int` - Utolsó feldolgozott index

**Működés**:
1. Fájl olvasás
2. `stats` dictionary frissítése
3. `last_index` visszaadása

**Hiba kezelés**:
- `FileNotFoundError` → `return -1` (kezdés az elejéről)
- Egyéb hiba → `return -1`

---

### run_parallel_scanner() (Lines 238-363)

**Cél**: Fő scanner loop

**Paraméter**: `domain_file: str` - Domain lista fájl elérési út

**Lépések**:

1. **Inicializálás** (Lines 241-247):
   - Banner kiírás
   - Konfiguráció megjelenítése

2. **Domain betöltés** (Lines 249-256):
   ```python
   with open(domain_file, 'r') as f:
       domains = [line.strip() for line in f if line.strip()]
   ```

3. **Progress betöltés** (Lines 258-262):
   ```python
   start_index = load_progress() + 1
   current_index = start_index
   ```

4. **Main Loop** (Lines 268-350):
   ```python
   with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
       while running and current_index < len(domains):
           # ...
   ```

5. **Befejezés** (Lines 352-363):
   - Összesítés kiírása
   - Final progress mentés

---

## 8. FŐ LOOP LOGIKA

### Pszeudokód
```
WHILE running AND current_index < total_domains:

    1. cleanup_stuck_scans(180s)

    2. queue_status = get_queue_status()
       pending = queue_status.pending
       scanning = queue_status.scanning

    3. total_active = pending + scanning
       target_total = 70 + 20 = 90
       scans_to_create = MAX(0, 90 - total_active)

    4. scans_to_create = MIN(scans_to_create, remaining_domains)

    5. DISPLAY status (clear screen + print)

    6. IF scans_to_create == 0:
           sleep(3s)
           CONTINUE

    7. batch_domains = domains[current_index : current_index + scans_to_create]

    8. FOR domain IN batch_domains:
           executor.submit(create_scan, domain, ...)
           sleep(1.0s)  # Rate limit

    9. WAIT for all futures

    10. current_index += len(batch_domains)

    11. IF 60s elapsed since last save:
            save_progress()

    12. sleep(3s)
```

### Terhelésszabályozás Részletesen

```
Cél állapot:
┌────────────────────────────────────────────┐
│ TARGET_SCANNING = 70  │ TARGET_PENDING = 20 │
│ (max worker capacity) │ (buffer queue)      │
└────────────────────────────────────────────┘
            │                    │
            └────────┬───────────┘
                     │
                     ▼
              Total Target = 90

Ha aktuális állapot:
- SCANNING = 50
- PENDING = 10
- Total = 60

Akkor:
  scans_to_create = 90 - 60 = 30 új scan
```

---

## 9. API INTEGRÁCIÓ

### Hívott Endpoint

```
POST http://localhost:3000/api/scan
```

**FONTOS**: Ez a `/api/scan` endpoint, **NEM** a `/api/scan/regenerate`!

### Request
```http
POST /api/scan HTTP/1.1
Host: localhost:3000
Content-Type: application/json
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,...
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
DNT: 1
Connection: keep-alive
...

{"url": "https://example.com"}
```

### Response (Success)
```json
{
  "scanId": "uuid",
  "scanNumber": 12345,
  "domain": "example.com",
  "message": "Scan queued successfully"
}
```

### Response (Duplicate)
```json
{
  "scanId": "existing-uuid",
  "scanNumber": 12340,
  "domain": "example.com",
  "isDuplicate": true,
  "message": "Existing scan found"
}
```

### API vs Regenerate Összehasonlítás

| Tulajdonság | `/api/scan` | `/api/scan/regenerate` |
|-------------|-------------|------------------------|
| Duplicate check | ✅ Van (24 óra) | ❌ Nincs |
| Új scan mindig | ❌ Nem | ✅ Igen |
| Batch használat | ✅ Ideális | ⚠️ Nem ajánlott |
| UI használat | ⚠️ Régi | ✅ Mostani |

**Megjegyzés**: A batch scanner **helyes** az `/api/scan` használatával, mert:
1. Elkerüli a duplikátumokat (költséghatékony)
2. Nem terheli feleslegesen a worker-eket
3. A `isDuplicate` check megfelelő batch műveletekhez

---

## 10. ADATBÁZIS KAPCSOLAT

### Connection String
```
postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner
```

| Komponens | Érték |
|-----------|-------|
| Protocol | postgresql |
| User | scanner |
| Password | ai_scanner_2025 |
| Host | localhost |
| Port | 6432 (pgBouncer) |
| Database | ai_security_scanner |

### Használt Táblák

#### "Scan" tábla
```sql
CREATE TABLE "Scan" (
    id UUID PRIMARY KEY,
    "scanNumber" SERIAL,
    url TEXT,
    domain TEXT,
    status TEXT,  -- 'PENDING', 'SCANNING', 'COMPLETED', 'FAILED'
    "riskScore" INTEGER,
    "createdAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    error JSONB,
    ...
);
```

### SQL Műveletek

| Funkció | Művelet | Tábla |
|---------|---------|-------|
| get_queue_status() | SELECT COUNT | Scan |
| cleanup_stuck_scans() | SELECT COUNT, UPDATE | Scan |

### Connection Pooling
- pgBouncer porton keresztül (6432)
- Minden query új connection → close
- Nincs persistent connection pool a Python oldalon

---

## 11. PROGRESS MANAGEMENT

### Progress File Struktúra

**Fájl**: `parallel-scanner-progress.json` (working directory-ban)

```json
{
  "total_created": 5432,
  "total_failed": 123,
  "start_time": "2025-11-26T10:30:00.123456",
  "last_index": 5554
}
```

### Mezők Jelentése

| Mező | Típus | Leírás |
|------|-------|--------|
| total_created | int | Sikeresen létrehozott scanek (nem duplicate) |
| total_failed | int | API hiba miatt sikertelen próbálkozások |
| start_time | ISO string | Eredeti indulás időpontja |
| last_index | int | Utolsó feldolgozott domain indexe |

### Recovery Logika

```python
# Induláskor
start_index = load_progress() + 1  # +1 mert az utolsót már feldolgoztuk

# Példa:
# last_index = 5554 → start_index = 5555
# domains[5555] lesz az első feldolgozandó
```

### Save Triggers

1. **Periodikus**: Minden 60 másodpercben
   ```python
   if time.time() - last_save > 60:
       save_progress()
       last_save = time.time()
   ```

2. **Signal Handler**: Ctrl+C esetén
   ```python
   def signal_handler(sig, frame):
       save_progress()
       sys.exit(0)
   ```

3. **Befejezéskor**: Scanner végén
   ```python
   save_progress()
   ```

---

## 12. HIBAKEZELÉS

### API Hibák (create_scan)
```python
try:
    response = requests.post(...)
    if response.status_code in [200, 201]:
        # Success
    else:
        stats['total_failed'] += 1
except Exception as e:
    stats['total_failed'] += 1
```

**Kezelés**: Hiba logolás, `total_failed` növelése, folytatás

### Database Hibák (get_queue_status)
```python
try:
    conn = psycopg2.connect(DB_URL)
    # ...
except Exception as e:
    print(f"❌ DB Error: {e}")
    return {'pending': 0, 'scanning': 0, 'completed': 0, 'failed': 0}
```

**Kezelés**: Default értékek visszaadása → scanner folytatódik

### File I/O Hibák
```python
try:
    with open(PROGRESS_FILE, 'r') as f:
        # ...
except FileNotFoundError:
    return -1  # Start from beginning
except Exception as e:
    return -1
```

**Kezelés**: Kezdés az elejéről

### Graceful Shutdown
```python
signal.signal(signal.SIGINT, signal_handler)

def signal_handler(sig, frame):
    global running
    running = False  # Stop main loop
    save_progress()  # Save checkpoint
    sys.exit(0)      # Clean exit
```

---

## 13. TELJESÍTMÉNY MEGFONTOLÁSOK

### Bottleneck-ek

1. **THREAD_RATE_LIMIT = 1.0s**
   - 50 thread × 1s = 50 másodperc egy batch elindítása
   - **Megoldás**: Csökkentés 0.1s-re = 5 másodperc/batch

2. **POLL_INTERVAL = 3s**
   - Batch között 3s várakozás
   - OK ha a queue feldolgozás lassabb

3. **Database Query minden iterációban**
   - 2× DB lekérdezés / iteráció (status + cleanup)
   - pgBouncer connection pooling segít

### Sebesség Becslés

**Jelenlegi konfiguráció**:
```
- Batch size: ~30 domain (ha queue üres)
- Batch indítás: ~30s (30 × 1.0s rate limit)
- Wait: 3s
- Total: ~33s / 30 domain = ~1.1s/domain = ~55 domain/perc
```

**Optimalizált** (THREAD_RATE_LIMIT = 0.1):
```
- Batch indítás: ~3s (30 × 0.1s)
- Wait: 3s
- Total: ~6s / 30 domain = ~0.2s/domain = ~300 domain/perc
```

### Memory Usage
- ~50 thread × ~10MB = ~500MB thread overhead
- Domain lista memóriában: ~100 byte/domain × 1M = ~100MB
- **Összesen**: ~600-800MB várható 1M domainre

### CPU Usage
- I/O bound (HTTP + DB)
- 50 thread-nél ~10-20% CPU várható
- Rate limit miatt nem terhelő

---

## 14. HASZNÁLATI ÚTMUTATÓ

### Előkészítés

1. **Domain lista létrehozása**
   ```bash
   # domains.txt - egy domain soronként
   example.com
   google.com
   github.com
   ...
   ```

2. **Szolgáltatások indítása**
   ```bash
   # Next.js API
   cd ai-security-scanner
   npm run dev

   # PM2 Workers (másik terminál)
   pm2 start ecosystem.config.js
   ```

3. **Python függőségek**
   ```bash
   pip install requests psycopg2-binary
   ```

### Futtatás

```bash
python3 scripts/parallel-scanner.py domains.txt
```

### Kimeneti Példa

```
════════════════════════════════════════════════════════════════════════════════
  🚀 PARALLEL SCANNER - 00:05:23
════════════════════════════════════════════════════════════════════════════════
  Progress: 1523/10000 (15.2%)
  Created: 1498 | Failed: 25
────────────────────────────────────────────────────────────────────────────────
  📊 Queue Status:
    PENDING:   18 / 20 target
    SCANNING:  65 / 70 target
    Total Active: 83
    Completed: 1420 | Failed: 78
────────────────────────────────────────────────────────────────────────────────
  🎬 Creating 7 scans with 50 threads...
════════════════════════════════════════════════════════════════════════════════
```

### Leállítás és Folytatás

```bash
# Leállítás
Ctrl+C

# Kimenet:
# ⏸️  Stopping scanner...
# 💾 Progress saved: 1523 domains processed

# Folytatás (ugyanaz a parancs)
python3 scripts/parallel-scanner.py domains.txt

# Kimenet:
# 📂 Resumed from index 1523
# 🚀 Starting from domain #1524
```

### Monitoring

```bash
# Külön terminálban - DB status
watch -n 5 'PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "SELECT status, COUNT(*) FROM \"Scan\" WHERE \"createdAt\" > NOW() - INTERVAL '\''1 hour'\'' GROUP BY status;"'
```

---

## FÜGGELÉK: Konfiguráció Ajánlások

### Kis szerver (4 core, 16GB RAM)
```python
MAX_THREADS = 20
THREAD_RATE_LIMIT = 0.5
TARGET_SCANNING = 30
TARGET_PENDING = 10
```

### Közepes szerver (8 core, 32GB RAM)
```python
MAX_THREADS = 50
THREAD_RATE_LIMIT = 0.2
TARGET_SCANNING = 50
TARGET_PENDING = 20
```

### Nagy szerver (16+ core, 64GB+ RAM)
```python
MAX_THREADS = 100
THREAD_RATE_LIMIT = 0.1
TARGET_SCANNING = 100
TARGET_PENDING = 50
```

---

## CHANGELOG

| Dátum | Verzió | Változás |
|-------|--------|----------|
| 2025-11-26 | 1.0.0 | Dokumentáció elkészítése |

---

**Készítette**: Claude Code
**Projekt**: AI Security Scanner
**Licenc**: Proprietary

# 🎯 AI Security Scanner - Terminal Scanner Architecture

## 📊 Jelenlegi probléma

A rendszer jelenleg **káoszban** van:
- **19+ háttérfolyamat** fut párhuzamosan
- **Kétféle adatbázis**: PostgreSQL (scan rekordok) + SQLite (job queue)
- **Worker probléma**: A workerek SQLite-ot használnak, de a scanek PostgreSQL-ben vannak
- **Nincs timeout kezelés**: Scanek órákig futhatnak
- **Nincs monitoring**: Nem látjuk mi történik

## 🏗️ Új architektúra

### Alapelvek
1. **Egyetlen vezérlő script** - Minden egy helyről fut
2. **PostgreSQL only** - Nincs SQLite, csak PostgreSQL
3. **Szigorú limitek**:
   - Max 120 másodperc per scan
   - Max 5 SCANNING egyszerre
   - Max 2 PENDING várakozó
4. **Dupla biztonsági háló**:
   - Valós idejű timeout (120s)
   - 5 percenként ellenőrzés (4+ perces scanek kilövése)
5. **Teljes átláthatóság** - Minden látszik a terminalban

### Állapot átmenetek

```
PENDING → SCANNING → COMPLETED
   ↓         ↓
 FAILED   TIMEOUT
```

### Adatbázis séma bővítés

```sql
-- Worker tracking tábla
CREATE TABLE WorkerStatus (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES Scan(id),
  worker_pid INTEGER,
  started_at TIMESTAMP,
  last_heartbeat TIMESTAMP,
  status VARCHAR(20) -- RUNNING, COMPLETED, TIMEOUT, KILLED
);
```

## 🔧 Megvalósítás

### 1. Master Scanner Script

```python
class MasterScanner:
    def __init__(self):
        self.max_scanning = 5
        self.max_pending = 2
        self.scan_timeout = 120
        self.workers = {}

    def run(self):
        # Fő loop
        while True:
            self.check_timeouts()      # Timeout ellenőrzés
            self.process_pending()      # PENDING → SCANNING
            self.spawn_workers()        # Worker indítás
            self.show_status()          # Terminal display
            time.sleep(1)

    def check_timeouts(self):
        # 120mp+ scanek kilövése
        old_scans = db.query("SELECT * FROM Scan WHERE status='SCANNING'
                              AND started_at < NOW() - INTERVAL '120 seconds'")
        for scan in old_scans:
            self.kill_scan(scan)

    def periodic_cleanup(self):
        # 5 percenként fut
        # 4 perces+ scanek ellenőrzése
        stuck_scans = db.query("SELECT * FROM Scan WHERE status='SCANNING'
                                AND started_at < NOW() - INTERVAL '4 minutes'")
        for scan in stuck_scans:
            self.force_kill(scan)
```

### 2. Worker Process

```python
class ScanWorker:
    def __init__(self, scan_id):
        self.scan_id = scan_id
        self.pid = os.getpid()
        self.start_time = time.time()

    def execute(self):
        # Regisztráció
        db.execute("INSERT INTO WorkerStatus (scan_id, worker_pid, started_at)
                    VALUES (?, ?, ?)", self.scan_id, self.pid, now())

        # Timeout wrapper
        with timeout(120):
            result = self.perform_scan()

        # Befejezés
        db.execute("UPDATE Scan SET status='COMPLETED' WHERE id=?", self.scan_id)

    def heartbeat(self):
        # 10 másodpercenként életjel
        db.execute("UPDATE WorkerStatus SET last_heartbeat=NOW()
                    WHERE scan_id=?", self.scan_id)
```

### 3. Terminal UI

```
╔══════════════════════════════════════════════════════════════════╗
║                   AI SECURITY SCANNER v2.0                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Status: RUNNING | Uptime: 02:34:15 | Processed: 1,245            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ 🔄 SCANNING (3/5):                                               ║
║   • example.com      [████████░░░░░░░░] 45s/120s  PID:12345     ║
║   • test-site.org    [██████████████░░] 89s/120s  PID:12346     ║
║   • slow-site.net    [████████████████] 115s/120s PID:12347 ⚠️  ║
║                                                                   ║
║ ⏳ PENDING (2/2):                                                ║
║   • next-domain.com                                              ║
║   • another-site.io                                              ║
║                                                                   ║
║ 📊 Statistics:                                                   ║
║   Success: 1,198 | Failed: 32 | Timeout: 15                     ║
║                                                                   ║
║ 📝 Latest:                                                       ║
║   ✅ 13:45:23 fast-site.com completed (Risk: 72, Time: 23s)     ║
║   ⏱️ 13:44:15 timeout-site.net timeout (120s exceeded)          ║
║   ✅ 13:43:45 good-site.org completed (Risk: 85, Time: 45s)     ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝

[Ctrl+C to stop] [Space to pause] [R to resume]
```

## 🚀 Használat

```bash
# Egyetlen parancs
python3 master-scanner.py domains.txt

# Opciók
--max-scanning 5      # Max párhuzamos scan
--max-pending 2       # Max várakozó
--timeout 120         # Timeout másodpercben
--resume              # Folytatás ahol abbahagyta
```

## 🔒 Biztonsági mechanizmusok

1. **Process timeout**: signal.alarm(120) használata
2. **Database timeout**: PostgreSQL statement_timeout
3. **Worker heartbeat**: 10 másodpercenként életjel
4. **Periodic cleanup**: 5 percenként teljes ellenőrzés
5. **Process tracking**: Minden worker PID mentve
6. **Force kill**: SIGKILL ha nem reagál

## 📈 Monitoring

- Valós idejű státusz a terminalban
- Minden esemény logolva
- Worker PID-ek követése
- Memória használat figyelése
- Automatikus újraindítás hiba esetén

## ⚡ Előnyök

1. **Egyszerű**: Egy script, egy terminal
2. **Biztonságos**: Többszörös timeout védelem
3. **Átlátható**: Minden látszik
4. **Megbízható**: Nem ragad be semmi
5. **Skálázható**: Párhuzamos feldolgozás
6. **Folytatható**: Bármikor leállítható/folytatható
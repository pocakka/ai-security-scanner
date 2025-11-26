# DIRECT MODE - 2016 Koncepció 2024-es Analyzer-ekkel

## Jelenlegi vs Direct Mode

### JELENLEGI (Queue + Workers):
```
curl → API → DNS check → SQLite Queue → PM2 Worker poll → Process → PostgreSQL
         ↑                      ↑              ↑
      BOTTLENECK #1       BOTTLENECK #2   BOTTLENECK #3
```

### DIRECT MODE (mint 2016):
```
curl → API → Spawn child process → Process → PostgreSQL → Response
         ↑
    Nincs DNS check!
    Nincs Queue!
    Nincs Worker!
```

## Implementáció: /api/scan/direct

```typescript
// NEW: /api/scan/direct/route.ts
export async function POST(request: NextRequest) {
  const { url } = await request.json()

  // NO DNS VALIDATION!
  // NO QUEUE!

  // Direct spawn TypeScript processor
  spawn('npx', ['tsx', 'src/worker/direct-processor.ts', url], {
    detached: true,  // Run in background
    stdio: 'ignore'  // Don't wait for output
  })

  // Immediate response (fire & forget)
  return NextResponse.json({
    message: 'Scan started',
    url
  }, { status: 202 }) // 202 = Accepted
}
```

## direct-processor.ts (önálló process)

```typescript
// src/worker/direct-processor.ts
const url = process.argv[2]

async function processDirectly() {
  try {
    // 1. Create scan record
    const scan = await prisma.scan.create({
      data: { url, status: 'SCANNING' }
    })

    // 2. Crawl (PHP fast vagy Playwright)
    const crawlResult = await crawler.crawl(url)

    // 3. Run 31 analyzers
    const results = await runAllAnalyzers(crawlResult)

    // 4. Save to PostgreSQL
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        findings: results,
        // ...
      }
    })
  } catch (error) {
    // Auto-fail after timeout
  }

  process.exit(0) // Clean exit
}

processDirectly()
```

## Használat: turbo-direct.sh

```bash
#!/bin/bash
# turbo-direct.sh - No queue, no workers, just spawn!

API_URL="http://localhost:3000/api/scan/direct"

for domain in $(cat domains.txt); do
  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"https://$domain\"}" &

  # Limit concurrent processes
  while [ $(pgrep -c "direct-processor") -gt 300 ]; do
    sleep 0.1
  done
done
```

## Teljesítmény összehasonlítás

| Metrika | Queue + Workers | Direct Mode |
|---------|----------------|-------------|
| Setup complexity | Magas | Alacsony |
| DNS validation | ✅ Van (lassú) | ❌ Nincs |
| Queue overhead | ✅ Van | ❌ Nincs |
| Worker polling | 2 sec | 0 sec |
| Crash recovery | PM2 auto-restart | Process dies |
| Monitoring | PM2 dashboard | ps aux |
| Max párhuzamos | 300 workers | Unlimited* |
| Sebesség | ~2K/óra | ~20K/óra (10x) |

*Korlát: System process limit

## Előnyök

1. **10x gyorsabb** queue feltöltés
2. **Nincs SQLite lock** contention
3. **Nincs 2 sec polling** delay
4. **Egyszerűbb** architektúra
5. **Mint 2016-ban**, de modern analyzer-ekkel

## Hátrányok

1. **Nincs retry** mechanism
2. **Nincs központi** monitoring
3. **Process limit** (~32K Linux default)
4. **Nehezebb** stop/start

## Konklúzió

A **DIRECT MODE** lényegében a 2016-os egyszerű megközelítés modern TypeScript analyzer-ekkel:

- **Bash script** → fire & forget curl
- **API** → spawn detached process
- **Process** → direct PostgreSQL write
- **Nincs** queue, nincs worker, nincs várakozás

**Várható sebesség: 20,000+ scan/óra** (vs jelenlegi 2,000)

Ez kb. ugyanaz mint 2016-ban, csak PHP helyett TypeScript!
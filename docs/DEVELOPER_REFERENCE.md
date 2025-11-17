# Developer Reference - Complete File & Function Map

**CRITICAL DOCUMENT:** Ha bármit módosítani, debuggolni vagy javítani kell, itt találod meg a pontos fájlt és sort.

---

## 🎯 A PROJEKT SZÍVE - USER JOURNEY (Visszafelé követhető)

### PHASE 0: Landing Page (A KIINDULÓPONT)

**File:** `src/app/page.tsx` (198 sor)
**Purpose:** Landing page - ahol MINDEN kezdődik

#### Kulcsfunkciók:

**1. URL input kezelés (20-46. sor):**
```typescript
// src/app/page.tsx:20-46
const handleScan = async (e: React.FormEvent) => {
  // POST request: /api/scan
  const response = await fetch('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })

  // Redirect scan results page-re
  router.push(`/scan/${data.scanId}`)
}
```

**Mit csinál:**
- Elküldi az URL-t a `/api/scan` endpoint-ra
- Visszakap egy `scanId`-t
- Átirányít a `/scan/[scanId]` oldalra

**Hiba esetén mit nézzél:**
- `src/app/page.tsx:34-45` - Hibakezelés (error message megjelenítés)
- `src/app/page.tsx:125-129` - Error banner (piros doboz)

**UI elemek:**
- `src/app/page.tsx:95-103` - URL input field
- `src/app/page.tsx:106-122` - Submit button (loading state)
- `src/app/page.tsx:77-88` - Hero headline

---

### PHASE 1: API Layer - Scan Creation

**File:** `src/app/api/scan/route.ts` (137 sor)
**Purpose:** Scan létrehozás, validálás, queue-ba helyezés

#### 1.1 URL Normalizálás (17-32. sor)

```typescript
// src/app/api/scan/route.ts:17-32
function normalizeURL(url: string): string {
  // FIX TYPOS:
  .replace(/^htps:\/\//i, 'https://')   // htps → https
  .replace(/^htp:\/\//i, 'http://')      // htp → http
  .replace(/^https\/\//i, 'https://')    // https// → https://
  .replace(/^http\/\//i, 'http://')      // http// → http://

  // Add protocol if missing
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized
  }
}
```

**Módosítás helye:**
- **Új typo hozzáadása:** 17-32. sor között
- **Protocol logika:** 27-29. sor (regex és default protocol)

#### 1.2 Zod Validation (9-11. sor)

```typescript
// src/app/api/scan/route.ts:9-11
const ScanRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
})
```

**Hibaüzenetek módosítása:**
- Itt add meg a custom hibaüzenetet: `.url('Your custom message')`

#### 1.3 Domain Validation (KRITIKUS!) (47-65. sor)

```typescript
// src/app/api/scan/route.ts:47-65
const domainValidation = await validateDomain(domain)

if (!domainValidation.valid) {
  return NextResponse.json({
    error: 'Domain validation failed',
    message: getDomainValidationErrorMessage(domainValidation),
    details: {
      domain,
      errorCode: domainValidation.errorCode,
      errorMessage: domainValidation.error
    }
  }, { status: 400 })
}
```

**Implementáció:** `src/lib/domain-validator.ts`

---

### PHASE 1.5: Domain Validator (DNS Lookup)

**File:** `src/lib/domain-validator.ts` (252 sor)
**Purpose:** Ellenőrzi, hogy a domain létezik-e (DNS lookup)

#### DNS Lookup Function (27-144. sor)

```typescript
// src/lib/domain-validator.ts:27-144
export async function validateDomain(domain: string, timeout: number = 5000)
```

**Főbb ellenőrzések:**

1. **Empty domain check (41-46. sor):**
   ```typescript
   if (!cleanDomain || cleanDomain.length === 0) {
     return { valid: false, errorCode: 'EMPTY_DOMAIN' }
   }
   ```

2. **Invalid characters check (50-56. sor):**
   ```typescript
   if (!/^[a-z0-9.-]+$/i.test(cleanDomain)) {
     return { valid: false, errorCode: 'INVALID_CHARS' }
   }
   ```
   **REGEX MÓDOSÍTÁS:** Ha más karaktereket is engedélyezni akarsz, itt változtasd!

3. **Localhost/Private IP check (59-71. sor):**
   ```typescript
   if (cleanDomain === 'localhost' ||
       cleanDomain.startsWith('127.') ||
       cleanDomain.startsWith('192.168.') ||
       cleanDomain.startsWith('10.') ||
       cleanDomain.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./))
   ```
   **DEV ENGEDÉLY:** Localhost-ot ENGEDÉLYEZI (return valid:true)

4. **DNS Lookup with timeout (74-79. sor):**
   ```typescript
   const lookupPromise = dns.resolve4(cleanDomain)
   const timeoutPromise = new Promise<never>((_, reject) => {
     setTimeout(() => reject(new Error('DNS_TIMEOUT')), timeout)
   })
   const addresses = await Promise.race([lookupPromise, timeoutPromise])
   ```
   **TIMEOUT MÓDOSÍTÁS:** Default 5000ms (5 sec) - lásd function signature

#### Error Codes Mapping (98-142. sor)

```typescript
// src/lib/domain-validator.ts:98-142
switch (errorCode) {
  case 'ENOTFOUND':    // Domain nem létezik
  case 'ENODATA':      // Nincs DNS record
  case 'ETIMEOUT':     // DNS timeout
  case 'ESERVFAIL':    // DNS server hiba
  case 'EREFUSED':     // DNS query elutasítva
}
```

**ÚJ ERROR CODE HOZZÁADÁSA:** Itt add meg a switch-ben!

#### User-Friendly Messages (220-251. sor)

```typescript
// src/lib/domain-validator.ts:220-251
export function getDomainValidationErrorMessage(result: DomainValidationResult): string {
  switch (result.errorCode) {
    case 'DOMAIN_NOT_FOUND':
      return 'This domain does not exist. Please check the spelling and try again.'

    case 'DNS_TIMEOUT':
      return 'Unable to reach this domain (timeout). It may be offline or unreachable.'
    // ...
  }
}
```

**HIBAÜZENET MÓDOSÍTÁS:** Itt változtasd a user-facing szövegeket!

---

### PHASE 2: Database - Scan Creation

**File:** `src/app/api/scan/route.ts:69-76`

```typescript
// src/app/api/scan/route.ts:69-76
const scan = await prisma.scan.create({
  data: {
    url: normalizedUrl,
    domain,
    status: 'PENDING',  // Kezdeti állapot
  },
})
```

**Database Schema:** `prisma/schema.prisma`

```prisma
model Scan {
  id          String   @id @default(uuid())
  url         String
  domain      String
  status      String   @default("PENDING")  // PENDING | SCANNING | COMPLETED | FAILED

  riskScore   Int?
  riskLevel   String?

  detectedTech String?  // JSON
  findings    String?   // JSON
  metadata    String?   // JSON

  createdAt   DateTime @default(now())
  startedAt   DateTime?
  completedAt DateTime?

  aiTrustScorecard AiTrustScorecard?
}
```

**STATUS ÉRTÉKEK:**
- `PENDING` - Létrehozva, várja a worker-t
- `SCANNING` - Worker dolgozik rajta
- `COMPLETED` - Kész
- `FAILED` - Hiba történt

**ÚJ MEZŐ HOZZÁADÁSA:**
1. Módosítsd `prisma/schema.prisma`-t
2. Futtasd: `npx prisma db push`
3. Futtasd: `npx prisma generate`

---

### PHASE 3: Job Queue

**File:** `src/app/api/scan/route.ts:78-83`

```typescript
// src/app/api/scan/route.ts:78-83
await jobQueue.add('scan', {
  scanId: scan.id,
  url: normalizedUrl,
})
```

**Queue Implementation:** `src/lib/queue-sqlite.ts`

#### Job Creation (19-31. sor)

```typescript
// src/lib/queue-sqlite.ts:19-31
async add(type: string, data: any): Promise<string> {
  const job = await prisma.job.create({
    data: {
      type,                        // 'scan'
      data: JSON.stringify(data),  // {scanId, url}
      status: 'PENDING',
    },
  })
  return job.id
}
```

**JOB STATUS ÉRTÉKEK:**
- `PENDING` - Várakozik
- `PROCESSING` - Worker dolgozik rajta
- `COMPLETED` - Kész
- `FAILED` - Sikertelen

#### Job Retrieval (36-71. sor)

```typescript
// src/lib/queue-sqlite.ts:36-71
async getNext(): Promise<{ id: string; type: string; data: any } | null> {
  // 1. Find oldest pending job
  const job = await prisma.job.findFirst({
    where: {
      status: 'PENDING',
      attempts: { lt: prisma.job.fields.maxAttempts },  // < 3
    },
    orderBy: { createdAt: 'asc' },  // FIFO
  })

  // 2. Mark as PROCESSING (atomic)
  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
      attempts: { increment: 1 },
    },
  })
}
```

**RETRY LIMIT MÓDOSÍTÁS:**
- `prisma/schema.prisma` - `maxAttempts` field (default: 3)
- Vagy itt hardcode-old: `attempts: { lt: 3 }`

---

### PHASE 4: Worker Auto-Spawn

**File:** `src/app/api/scan/route.ts:85-98`

```typescript
// src/app/api/scan/route.ts:85-98
const workerPath = path.join(process.cwd(), 'src', 'worker', 'index-sqlite.ts')
const worker = spawn('npx', ['tsx', workerPath], {
  cwd: process.cwd(),
  detached: true,        // Független process
  stdio: 'ignore',       // Ne blockold a parent-et
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV,
  },
})

worker.unref()  // Engedjük a parent process kilépését
```

**WORKER PATH VÁLTOZTATÁS:**
- Ha átnevezed a worker fájlt, itt változtasd: 86. sor

**ENVIRONMENT VARIABLES HOZZÁADÁSA:**
- `env` objektumban (91-94. sor)

---

### PHASE 5: Worker Processing (CORE ENGINE)

**File:** `src/worker/index-sqlite.ts` (~920 sor)
**Purpose:** A TELJES scan logika - crawling + analyzers + scoring

#### 5.1 Worker Startup (851-880. sor)

```typescript
// src/worker/index-sqlite.ts:851-880
async function processOneJob() {
  // Lock check - ne fusson egyszerre több worker
  const canStart = await workerManager.start()

  if (!canStart) {
    console.log('[Worker] Another worker is already running, exiting...')
    process.exit(0)
  }

  // Get next job from queue
  const job = await jobQueue.getNext()

  if (job) {
    await processScanJob(job.data)
  }
}
```

**Worker Lock File:** `worker.lock` (root directory)
- Ha worker lefagy, töröld ezt a fájlt: `rm worker.lock`

#### 5.2 Main Scan Function (75-850. sor)

```typescript
// src/worker/index-sqlite.ts:75-850
async function processScanJob(data: { scanId: string; url: string }) {
  const { scanId, url } = data

  // Performance tracking
  const timings: Record<string, number> = {}
  const startTime = Date.now()

  try {
    // Update status to SCANNING
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'SCANNING',
        startedAt: new Date(),
      },
    })
```

**STATUS FRISSÍTÉS:**
- SCANNING: 86-92. sor
- COMPLETED: 692-708. sor
- FAILED: catch block (797-844. sor)

#### 5.3 Crawling (94-99. sor)

```typescript
// src/worker/index-sqlite.ts:94-99
const crawlResult = await crawler.crawl(url)
timings.crawl = Date.now() - crawlStart
```

**Crawler Implementation:** `src/lib/crawler-adapter.ts`
**Alternative (Mock):** `src/worker/crawler-mock.ts`

**CRAWLER VÁLASZTÁS (49-51. sor):**
```typescript
const USE_REAL_CRAWLER = process.env.USE_REAL_CRAWLER === 'true'
const crawler = USE_REAL_CRAWLER ? new CrawlerAdapter() : new MockCrawler()
```

**MOCK HASZNÁLATA:** `.env` fájlban: `USE_REAL_CRAWLER=false`

#### 5.4 Analyzers (101-514. sor)

**Mind a 47 analyzer futtatása:**

```typescript
// src/worker/index-sqlite.ts:101-514
const securityHeaders = analyzeSecurityHeaders(crawlResult)      // Line 106
const clientRisks = analyzeClientRisks(crawlResult)              // Line 109
const sslTLS = analyzeSSLTLS(crawlResult)                        // Line 112
const cookieSecurity = analyzeCookieSecurity(crawlResult)        // Line 115
const jsLibraries = analyzeJSLibraries(crawlResult)              // Line 118
const techStack = analyzeTechStack(crawlResult)                  // Line 121
const aiTrustResult = analyzeAiTrust(crawlResult, sslTLS.score)  // Line 127
// ... +40 more analyzers
```

**ANALYZER FÁJLOK HELYE:**
```
src/worker/analyzers/
├── security-headers.ts           # Line 106
├── client-risks.ts                # Line 109
├── ssl-tls-analyzer.ts            # Line 112
├── cookie-security-analyzer.ts    # Line 115
├── js-libraries-analyzer.ts       # Line 118
├── tech-stack-analyzer.ts         # Line 121
├── ai-trust-analyzer.ts           # Line 127
├── reconnaissance-analyzer.ts     # Line 149 (with 5s timeout)
├── admin-detection-analyzer.ts    # Line 159 (with 5s timeout)
├── cors-analyzer.ts               # Line 178
├── dns-security-analyzer.ts       # Line 186
├── port-scanner-analyzer.ts       # Line 195
├── compliance-analyzer.ts         # Line 213
├── waf-detection-analyzer.ts      # Line 225
├── owasp-llm/
│   ├── llm01-prompt-injection.ts  # Line 378
│   ├── llm02-insecure-output.ts   # Line 386
│   ├── llm05-supply-chain.ts      # Line 394
│   ├── llm06-sensitive-info.ts    # Line 403 (with 25s timeout!)
│   ├── llm07-plugin-design.ts     # Line 416
│   └── llm08-excessive-agency.ts  # Line 424
└── ... +20 more
```

**ÚJ ANALYZER HOZZÁADÁSA:**
1. Hozd létre: `src/worker/analyzers/my-analyzer.ts`
2. Export function: `export async function analyzeMyCheck(crawlResult: CrawlerResult): Promise<MyResult>`
3. Import itt: `src/worker/index-sqlite.ts` (top)
4. Hívd meg: `src/worker/index-sqlite.ts` (analyzers section, ~100-500. sor között)
5. Add hozzá a reporthoz: `src/worker/report-generator.ts`

#### 5.5 Timeout Protection (59-73. sor)

```typescript
// src/worker/index-sqlite.ts:59-73
async function runWithTimeout<T>(
  analyzerFn: () => Promise<T>,
  timeoutMs: number,
  analyzerName: string
): Promise<T | null> {
  return Promise.race([
    analyzerFn(),
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.log(`[Worker] ⏰ ${analyzerName} timeout after ${timeoutMs}ms - skipping`)
        resolve(null)
      }, timeoutMs)
    )
  ])
}
```

**HASZNÁLATA:**
```typescript
// Line 149 - Reconnaissance with 5s timeout
const reconnaissance = await runWithTimeout(
  () => analyzeReconnaissance(crawlResult),
  5000,
  'Reconnaissance'
)

// Line 403 - LLM06 with 25s timeout
const llm06SensitiveInfo = await runWithTimeout(
  () => analyzeLLM06SensitiveInfo(crawlResult.html, crawlResult.responseHeaders || {}),
  25000,
  'LLM06'
)
```

**TIMEOUT MÓDOSÍTÁS:**
- Reconnaissance: 5000ms (5s) - Line 151
- Admin Detection: 5000ms - Line 161
- Admin Discovery: 5000ms - Line 170
- Port Scanner: 5000ms - Line 197
- DNS Security: 10000ms - Line 188
- LLM06: 25000ms - Line 405

#### 5.6 Scoring (616-644. sor)

```typescript
// src/worker/index-sqlite.ts:616-644
const scoreBreakdown = calculateSecurityScore(
  report.findings || [],
  {
    hasAI: aiDetection.hasAI,
    sslCertificate: crawlResult.sslCertificate,
  }
)
```

**Scoring Implementation:** `src/worker/scoring-v3.ts` (~500 sor)

**SCORING RENDSZER MÓDOSÍTÁS:**
- Penalty pontok: `src/worker/scoring-v3.ts:45-75`
- Kategória súlyok: `src/worker/scoring-v3.ts:85-95`
- Grade thresholds: `src/worker/scoring-v3.ts:420-435`

#### 5.7 Report Generation (558-614. sor)

```typescript
// src/worker/index-sqlite.ts:558-614
let report = generateReport(
  aiDetection,
  securityHeaders,
  clientRisks,
  { score: 0, level: 'LOW', grade: 'A+' },  // Temporary
  sslTLS,
  cookieSecurity,
  // ... all 41 analyzers
)
```

**Report Generator:** `src/worker/report-generator.ts` (~2000 sor)

#### 5.8 Database Save (692-708. sor)

```typescript
// src/worker/index-sqlite.ts:692-708
await prisma.scan.update({
  where: { id: scanId },
  data: {
    status: 'COMPLETED',
    riskScore: scoreBreakdown.overallScore,
    riskLevel: scoreBreakdown.riskLevel,
    detectedTech: JSON.stringify(report.detectedTech),
    findings: JSON.stringify(report),  // FULL REPORT
    metadata: JSON.stringify({
      timings,
      scoreBreakdown,
      timestamp: new Date().toISOString(),
    }),
    completedAt: new Date(),
  },
})
```

**METADAT HOZZÁADÁSA:** 699-704. sor - metadata objektum

#### 5.9 AI Trust Scorecard Save (710-778. sor)

```typescript
// src/worker/index-sqlite.ts:710-778
await prisma.aiTrustScorecard.create({
  data: {
    scanId: scanId,

    // 27 boolean checks
    isProviderDisclosed: aiTrustResult.checks.isProviderDisclosed,
    // ...

    // Scores
    score: aiTrustResult.score ?? 0,
    weightedScore: aiTrustResult.weightedScore ?? 0,
    // ...
  },
})
```

**AI Trust Analyzer:** `src/worker/analyzers/ai-trust-analyzer.ts` (~1200 sor)

---

### PHASE 6: Frontend - Results Page

**File:** `src/app/scan/[id]/page.tsx` (~1400 sor)
**Purpose:** Scan eredmények megjelenítése

#### 6.1 Result Polling (124-208. sor)

```typescript
// src/app/scan/[id]/page.tsx:124-208
const fetchScan = useCallback(async () => {
  const response = await fetch(`/api/scan/${params.id}`)
  const data = await response.json()

  setScan(data)

  if (data.status === 'COMPLETED') {
    // Parse findings
    const parsedFindings = typeof data.findings === 'string'
      ? JSON.parse(data.findings)
      : data.findings

    setReport(parsedFindings)
    setIsLoading(false)

  } else if (data.status === 'FAILED') {
    setError('Scan failed. Please try again.')
    setIsLoading(false)

  } else if (data.status === 'SCANNING' || data.status === 'PENDING') {
    // Keep polling
    setIsLoading(true)
  }
}, [params.id])

// Poll every 2 seconds
useEffect(() => {
  fetchScan()
  const interval = setInterval(() => {
    if (isLoading) {
      fetchScan()
    }
  }, 2000)  // 2 sec
  return () => clearInterval(interval)
}, [fetchScan, isLoading])
```

**POLLING INTERVAL MÓDOSÍTÁS:** Line 202 - `2000` (2 sec)

#### 6.2 API Endpoint - Get Scan

**File:** `src/app/api/scan/[id]/route.ts` (~60 sor)

```typescript
// src/app/api/scan/[id]/route.ts:4-57
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const scan = await prisma.scan.findUnique({
    where: { id },
    include: {
      aiTrustScorecard: true,  // 1:1 relation
    },
  })

  // Parse JSON fields
  const response = {
    ...scan,
    detectedTech: scan.detectedTech ? JSON.parse(scan.detectedTech) : null,
    findings: scan.findings ? JSON.parse(scan.findings) : null,
    metadata: scan.metadata ? JSON.parse(scan.metadata) : null,
    aiTrustScorecard: scan.aiTrustScorecard ? {
      ...scan.aiTrustScorecard,
      categoryScores: scan.aiTrustScorecard.categoryScores
        ? JSON.parse(scan.aiTrustScorecard.categoryScores)
        : null,
      // ... other JSON fields
    } : null,
  }

  return NextResponse.json(response)
}
```

#### 6.3 Loading UI (522-591. sor)

```typescript
// src/app/scan/[id]/page.tsx:522-591
if (isLoading) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full mb-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="font-medium text-blue-900">
            {scan?.status === 'SCANNING' ? 'Security scan in progress...' : 'Initializing scan...'}
          </span>
        </div>
      </div>

      {/* Progress indicators */}
      <ProgressIndicator title="Crawling website" status="active" />
      <ProgressIndicator title="Security headers analysis" status="pending" />
      // ...
    </div>
  )
}
```

**LOADING MESSAGES MÓDOSÍTÁS:** Line 534-536

#### 6.4 Results Rendering (593-1407. sor)

**Risk Score Card (593-693. sor):**
```typescript
// src/app/scan/[id]/page.tsx:593-693
<div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-12 px-4">
  {/* Grade Display */}
  <div className={`text-6xl font-bold ${getGradeColor(report?.summary?.riskScore?.grade || 'F')}`}>
    {report?.summary?.riskScore?.grade || 'N/A'}
  </div>

  {/* Score Display */}
  <div className="text-4xl font-bold">
    {report?.summary?.riskScore?.score ?? 0}/100
  </div>

  {/* Risk Breakdown */}
  <RiskItem label="Critical" count={report?.summary?.criticalIssues || 0} color="red" />
  <RiskItem label="High" count={report?.summary?.highIssues || 0} color="orange" />
  // ...
</div>
```

**GRADE COLOR MAPPING (Function):**
```typescript
// src/app/scan/[id]/page.tsx (helper function)
function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-400'
  if (grade.startsWith('B')) return 'text-blue-400'
  if (grade.startsWith('C')) return 'text-yellow-400'
  if (grade.startsWith('D')) return 'text-orange-400'
  return 'text-red-400'  // F
}
```

**AI Trust Score Section (695-812. sor):**
```typescript
// src/app/scan/[id]/page.tsx:695-812
{scan?.aiTrustScorecard && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
      <Brain className="h-7 w-7 text-purple-600" />
      AI Trust Score
    </h2>

    {/* 27 checks display */}
    {Object.entries(scan.aiTrustScorecard).map(([key, value]) => {
      if (typeof value !== 'boolean') return null

      return (
        <div key={key} className="flex items-center gap-2 text-sm">
          {value ? <CheckCircle /> : <XCircle />}
          <span>{formatCheckName(key)}</span>
        </div>
      )
    })}
  </div>
)}
```

**Technology Stack Section (814-892. sor):**
```typescript
// src/app/scan/[id]/page.tsx:814-892
{report?.techStack && report.techStack.totalCount > 0 && (
  <div className="mb-8">
    <h2>Technology Stack</h2>

    {/* Backend Frameworks */}
    {report.techStack.categories.backend.length > 0 && (
      <TechCategory title="Backend" technologies={report.techStack.categories.backend} />
    )}

    {/* Frontend Frameworks */}
    {report.techStack.categories.frontend.length > 0 && (
      <TechCategory title="Frontend" technologies={report.techStack.categories.frontend} />
    )}

    // ... 10+ categories
  </div>
)}
```

**Security Findings (894-1257. sor):**
```typescript
// src/app/scan/[id]/page.tsx:894-1257
{Object.entries(groupFindingsByCategory(report?.findings || [])).map(([category, findings]) => (
  <FindingSection key={category} category={category} findings={findings} />
))}
```

---

## 🔧 KÖZÖS PROBLÉMÁK ÉS MEGOLDÁSOK

### 1. Scan stuck in "SCANNING" state

**Probléma:** Scan nem FEJEZŐDIK be, folyamatosan "SCANNING" állapotban marad.

**Lehetséges okok:**

**A) Worker lefagyott**
- **Ellenőrzés:** `ps aux | grep tsx` - van-e futó worker?
- **Megoldás:** `pkill -9 -f "tsx src/worker"`
- **Lock fájl:** `rm worker.lock`

**B) Analyzer timeout**
- **Ellenőrzés:** Worker logs - van-e "timeout" üzenet?
- **Fájl:** `src/worker/index-sqlite.ts:59-73` - `runWithTimeout` function
- **Analyzers with timeout:**
  - Reconnaissance: 5s (line 151)
  - LLM06: 25s (line 405)
  - Admin Detection: 5s (line 161)
  - Port Scanner: 5s (line 197)
  - DNS: 10s (line 188)
- **Megoldás:** Növeld a timeout értéket

**C) Database write hiba**
- **Ellenőrzés:** Worker logs - van-e Prisma error?
- **Fájl:** `src/worker/index-sqlite.ts:692-708` - `prisma.scan.update`
- **Megoldás:** Nézd meg a `prisma/schema.prisma` - match-elnek a mezők?

**D) Analyzer exception**
- **Ellenőrzés:** Worker logs - van-e stack trace?
- **Fájl:** `src/worker/index-sqlite.ts:797-844` - catch block
- **Megoldás:**
  - Nézd meg melyik analyzer dobta a hibát
  - Add hozzá try-catch-et az adott analyzerhez
  - Vagy kommenteld ki ideiglenesen

**Manual Reset:**
```sql
-- SQLite console
sqlite3 prisma/dev.db

-- Find stuck scan
SELECT id, status, url, createdAt FROM Scan WHERE status = 'SCANNING' ORDER BY createdAt DESC;

-- Reset to PENDING
UPDATE Scan SET status = 'PENDING', startedAt = NULL WHERE id = 'YOUR_SCAN_ID';

-- Also reset the job
UPDATE Job SET status = 'PENDING', attempts = 0 WHERE data LIKE '%YOUR_SCAN_ID%';
```

### 2. Domain Validation Fails for Valid Domain

**Probléma:** Valós domain-t NEM FOGAD EL a validator.

**Debug Steps:**

**1. Check DNS Resolution:**
```bash
# Terminal
nslookup example.com
dig example.com
```

**2. Check Code:**
- **Fájl:** `src/lib/domain-validator.ts:27-144`
- **DNS Timeout:** Line 76 - default 5000ms
- **Regex Pattern:** Line 50 - `!/^[a-z0-9.-]+$/i.test(cleanDomain)`

**3. Regex túl szigorú?**
```typescript
// src/lib/domain-validator.ts:50-56
if (!/^[a-z0-9.-]+$/i.test(cleanDomain)) {
  return { valid: false, errorCode: 'INVALID_CHARS' }
}
```

**Módosítás:** Ha kell underscore (_) vagy más karakter:
```typescript
if (!/^[a-z0-9._-]+$/i.test(cleanDomain)) {  // Added underscore
```

**4. Localhost blokkolva?**
```typescript
// src/lib/domain-validator.ts:59-71
// ENGEDÉLYEZI a localhost-ot by default
if (cleanDomain === 'localhost' || cleanDomain.startsWith('127.')) {
  return { valid: true, resolvedAddresses: ['127.0.0.1'] }
}
```

**Tiltás:** Kommenteld ki a return-t, add vissza az error-t.

### 3. Analyzer False Positives/Negatives

**Probléma:** Analyzer rosszul detektál (false positive vagy false negative).

**Debug Steps:**

**1. Keress rá az analyzer nevére:**
```bash
# Find analyzer file
ls src/worker/analyzers/ | grep -i "analyzer-name"
```

**2. Nyisd meg az analyzer fájlt**

**Példa - Client Risks Analyzer:**

**Fájl:** `src/worker/analyzers/client-risks.ts`

**API Key Detection Regex (KRITIKUS!):**
```typescript
// src/worker/analyzers/client-risks.ts (~line 20-50)
const apiKeyPatterns = [
  /sk-[a-zA-Z0-9]{32,}/g,                    // OpenAI
  /AIza[a-zA-Z0-9_-]{35}/g,                  // Google
  /anthropic_[a-z0-9]{40}/gi,                // Anthropic
  /AKIA[0-9A-Z]{16}/g,                       // AWS
  // ... more patterns
]
```

**Módosítás:**
- **False Positive:** Szűkítsd a regex-et (pl. hossz növelés)
- **False Negative:** Bővítsd a regex-et (új pattern hozzáadása)

**3. Test az analyzer-t izoláltan:**
```typescript
// Create test file: test-analyzer.ts
import { analyzeClientRisks } from './src/worker/analyzers/client-risks'

const mockCrawlResult = {
  html: '<script>const key = "sk-test123456789012345678901234567890"</script>',
  // ... other fields
}

const result = analyzeClientRisks(mockCrawlResult)
console.log(result)
```

**4. Futtasd:**
```bash
npx tsx test-analyzer.ts
```

### 4. Scoring Not Accurate

**Probléma:** Score nem reprezentálja a valós kockázatot.

**Debug Steps:**

**1. Check Scoring File:**
- **Fájl:** `src/worker/scoring-v3.ts`
- **Line 45-75:** Penalty points
- **Line 85-95:** Category weights
- **Line 420-435:** Grade thresholds

**2. Penalty Points:**
```typescript
// src/worker/scoring-v3.ts:45-75
const PENALTY_POINTS = {
  critical: {
    first: 25,       // Első critical: -25 pont
    additional: 15,  // Minden további: -15 pont
    cap: 60,        // Max levonás: 60 pont
  },
  high: {
    first: 12,
    additional: 8,
    cap: 50,
  },
  medium: {
    first: 6,
    additional: 4,
    cap: 30,
  },
  low: {
    first: 2,
    additional: 1,
    cap: 15,
  },
}
```

**Módosítás:** Változtasd a pontokat!

**3. Category Weights:**
```typescript
// src/worker/scoring-v3.ts:85-95
const CATEGORY_WEIGHTS = {
  criticalInfrastructure: 0.30,  // 30% - SSL, DNS
  authentication: 0.25,           // 25% - Cookies, Sessions
  dataProtection: 0.20,           // 20% - Headers, CSP
  aiSecurity: 0.15,              // 15% - OWASP LLM
  codeQuality: 0.10,             // 10% - Libraries
}
```

**Módosítás:** Az összeg MINDIG 1.0 (100%) legyen!

**4. Grade Thresholds:**
```typescript
// src/worker/scoring-v3.ts:420-435
function getGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  // ...
  if (score < 40) return 'F'
}
```

**Módosítás:** Változtasd a határokat!

### 5. Technology Detection Missing Items

**Probléma:** Tech Stack nem detektálja az ismert technológiát.

**Debug Steps:**

**1. Tech Stack Analyzer:**
- **Fájl:** `src/worker/analyzers/tech-stack-analyzer.ts`

**2. Detection Rules:**
- **Fájl:** `src/worker/config/tech-detection-rules.ts` (~800 sor!)

**3. Add New Pattern:**
```typescript
// src/worker/config/tech-detection-rules.ts
export const techPatterns: TechPattern[] = [
  {
    name: 'Your Framework',
    category: 'frontend',
    patterns: [
      { type: 'html', pattern: /your-framework-marker/i },
      { type: 'header', header: 'X-Powered-By', pattern: /YourFramework/i },
      { type: 'script', pattern: /yourframework\.js/i },
    ],
  },
  // ... 50+ existing patterns
]
```

**4. Pattern Types:**
- `html` - HTML source regex
- `header` - HTTP header check
- `script` - Script src URL check
- `cookie` - Cookie name check
- `meta` - Meta tag check

### 6. AI Detection Not Working

**Probléma:** AI Trust Score nem detektálja az AI használatot.

**Debug Steps:**

**1. AI Trust Analyzer:**
- **Fájl:** `src/worker/analyzers/ai-trust-analyzer.ts` (~1200 sor)

**2. Detection Logic (Line 50-150):**
```typescript
// src/worker/analyzers/ai-trust-analyzer.ts:50-150
function detectAIImplementation(crawlResult: CrawlerResult): boolean {
  const html = crawlResult.html.toLowerCase()

  // Provider detection
  const hasOpenAI = /openai|chatgpt|gpt-3|gpt-4/i.test(html)
  const hasAnthropic = /anthropic|claude/i.test(html)
  const hasGoogle = /gemini|bard|palm/i.test(html)

  // Framework detection
  const hasIntercom = /intercom|drift|chatbot/i.test(html)

  // API endpoint detection
  const hasAIEndpoint = /\/api\/(chat|ai|completion)/i.test(html)

  return hasOpenAI || hasAnthropic || hasGoogle || hasIntercom || hasAIEndpoint
}
```

**Módosítás:**
- **Új provider:** Add hozzá a regex-et (pl. `hasCohere = /cohere/i.test(html)`)
- **Új framework:** Add hozzá a chat widget regex-et
- **API pattern:** Bővítsd az endpoint regex-et

**3. Confidence Level (Line 200-250):**
```typescript
// src/worker/analyzers/ai-trust-analyzer.ts:200-250
let confidenceLevel: 'none' | 'low' | 'medium' | 'high' = 'none'

if (detectionCount === 0) {
  confidenceLevel = 'none'
} else if (detectionCount === 1) {
  confidenceLevel = 'low'
} else if (detectionCount === 2) {
  confidenceLevel = 'medium'
} else {
  confidenceLevel = 'high'
}
```

**Módosítás:** Változtasd a threshold-okat!

---

## 📝 REGEX PATTERNS - TELJES LISTA

### URL Normalization
**File:** `src/app/api/scan/route.ts:17-32`
```typescript
.replace(/^htps:\/\//i, 'https://')   // Typo fix
.replace(/^htp:\/\//i, 'http://')      // Typo fix
.replace(/^https\/\//i, 'https://')    // Missing colon
.replace(/^http\/\//i, 'http://')      // Missing colon
/^https?:\/\//i                         // Has protocol check
```

### Domain Validation
**File:** `src/lib/domain-validator.ts:50`
```typescript
/^[a-z0-9.-]+$/i                       // Valid domain chars
```

**Localhost Detection:**
**File:** `src/lib/domain-validator.ts:59-64`
```typescript
cleanDomain === 'localhost'
cleanDomain.startsWith('127.')
cleanDomain.startsWith('192.168.')
cleanDomain.startsWith('10.')
/^172\.(1[6-9]|2[0-9]|3[0-1])\./      // Private IP range
```

### API Key Detection
**File:** `src/worker/analyzers/client-risks.ts` (~line 20-50)
```typescript
/sk-[a-zA-Z0-9]{32,}/g                 // OpenAI
/AIza[a-zA-Z0-9_-]{35}/g               // Google
/anthropic_[a-z0-9]{40}/gi             // Anthropic
/AKIA[0-9A-Z]{16}/g                    // AWS
/ghp_[a-zA-Z0-9]{36}/g                 // GitHub
/xox[bp]-[a-zA-Z0-9-]+/g               // Slack
```

### AI Detection
**File:** `src/worker/analyzers/ai-trust-analyzer.ts` (~line 50-150)
```typescript
/openai|chatgpt|gpt-3|gpt-4/i          // OpenAI
/anthropic|claude/i                     // Anthropic
/gemini|bard|palm/i                    // Google
/intercom|drift|chatbot/i               // Chat widgets
/\/api\/(chat|ai|completion)/i         // API endpoints
```

### Technology Detection
**File:** `src/worker/config/tech-detection-rules.ts` (~800 lines!)
```typescript
// Frontend Frameworks
/react/i
/vue\.js/i
/angular/i
/next\.js/i

// Backend Frameworks
/django/i
/rails/i
/express/i
/laravel/i

// CMS
/wordpress/i
/drupal/i
/joomla/i

// Analytics
/google-analytics|gtag|ga\.js/i
/facebook\.com\/tr/                     // Facebook Pixel

// CDN
/cloudflare/i
/akamai/i
/fastly/i
```

### Security Headers Detection
**File:** `src/worker/analyzers/security-headers.ts`
```typescript
// Header name matching (case-insensitive)
/content-security-policy/i
/strict-transport-security/i
/x-frame-options/i
/x-content-type-options/i
/x-xss-protection/i
```

### OWASP LLM Detection
**File:** `src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts`
```typescript
// Email detection
/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Credit card (simplified - NOT production ready!)
/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g

// Social Security
/\b\d{3}-\d{2}-\d{4}\b/g

// API keys (combined from client-risks)
// ... (see API Key Detection section above)
```

---

## 🗂️ FILE STRUCTURE - QUICK REFERENCE

```
ai-security-scanner/
│
├── src/
│   ├── app/
│   │   ├── page.tsx                           # LANDING PAGE (198 lines)
│   │   ├── scan/[id]/page.tsx                 # RESULTS PAGE (1407 lines)
│   │   │
│   │   └── api/
│   │       ├── scan/
│   │       │   ├── route.ts                   # CREATE SCAN (137 lines)
│   │       │   └── [id]/route.ts              # GET SCAN (60 lines)
│   │       └── leads/route.ts                 # LEAD CAPTURE
│   │
│   ├── lib/
│   │   ├── db.ts                              # Prisma client
│   │   ├── domain-validator.ts                # DNS validation (252 lines)
│   │   ├── queue-sqlite.ts                    # Job queue (100 lines)
│   │   ├── crawler-adapter.ts                 # Playwright wrapper (400 lines)
│   │   └── playwright-crawler.ts              # Real browser crawler (600 lines)
│   │
│   └── worker/
│       ├── index-sqlite.ts                    # MAIN WORKER (920 lines)
│       ├── report-generator.ts                # Report assembly (2000 lines)
│       ├── scoring-v3.ts                      # Scoring system (500 lines)
│       ├── worker-manager.ts                  # Lock management (100 lines)
│       │
│       ├── analyzers/                         # 47 ANALYZER FILES
│       │   ├── security-headers.ts
│       │   ├── client-risks.ts
│       │   ├── ssl-tls-analyzer.ts
│       │   ├── cookie-security-analyzer.ts
│       │   ├── ai-trust-analyzer.ts           # 27 checks (1200 lines)
│       │   ├── tech-stack-analyzer.ts
│       │   ├── owasp-llm/
│       │   │   ├── llm01-prompt-injection.ts
│       │   │   ├── llm02-insecure-output.ts
│       │   │   ├── llm05-supply-chain.ts
│       │   │   ├── llm06-sensitive-info.ts
│       │   │   ├── llm07-plugin-design.ts
│       │   │   └── llm08-excessive-agency.ts
│       │   └── ... (41 more)
│       │
│       └── config/
│           └── tech-detection-rules.ts        # 50+ tech patterns (800 lines)
│
├── prisma/
│   ├── schema.prisma                          # DATABASE SCHEMA
│   └── dev.db                                 # SQLite database (gitignored)
│
├── docs/
│   ├── SCAN_FLOW.md                           # Complete flow (2087 lines)
│   ├── QUICK_START_DOCS.md                    # 5-min guide
│   ├── DEVELOPER_REFERENCE.md                 # THIS FILE
│   └── api/                                   # TypeDoc (346 files)
│
└── scripts/
    └── verify-docs.sh                         # Doc verification script
```

---

## 🚨 CRITICAL FILES - BACKUP BEFORE MODIFYING

**Ezeket NE módosítsd gondolkodás nélkül:**

1. **`src/worker/index-sqlite.ts`** - Main worker loop
   - **Backup:** `cp src/worker/index-sqlite.ts src/worker/index-sqlite.ts.backup`

2. **`src/worker/scoring-v3.ts`** - Scoring system
   - **Backup:** `cp src/worker/scoring-v3.ts src/worker/scoring-v3.ts.backup`

3. **`prisma/schema.prisma`** - Database schema
   - **Backup:** `cp prisma/schema.prisma prisma/schema.prisma.backup`
   - **AFTER CHANGE:** `npx prisma db push && npx prisma generate`

4. **`src/app/api/scan/route.ts`** - Scan creation logic
   - **Backup:** `cp src/app/api/scan/route.ts src/app/api/scan/route.ts.backup`

5. **`src/worker/analyzers/ai-trust-analyzer.ts`** - AI Trust Score (27 checks)
   - **Backup:** `cp src/worker/analyzers/ai-trust-analyzer.ts src/worker/analyzers/ai-trust-analyzer.ts.backup`

---

## 📊 PERFORMANCE BOTTLENECKS

### Slow Analyzers (Watch Out!)

1. **LLM06 - Sensitive Info Detection** (25s timeout)
   - **File:** `src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts`
   - **Why slow:** Heavy regex matching on full HTML
   - **Optimization:** Limit HTML size, cache results

2. **Reconnaissance Analyzer** (5s timeout)
   - **File:** `src/worker/analyzers/reconnaissance-analyzer.ts`
   - **Why slow:** Multiple sub-analyzers
   - **Optimization:** Run in parallel, reduce checks

3. **Port Scanner** (5s timeout)
   - **File:** `src/worker/analyzers/port-scanner-analyzer.ts`
   - **Why slow:** Network requests to multiple ports
   - **Optimization:** Reduce port list, increase timeout

4. **DNS Security** (10s timeout)
   - **File:** `src/worker/analyzers/dns-security-analyzer.ts`
   - **Why slow:** Multiple DNS queries (DNSSEC, SPF, DKIM, DMARC)
   - **Optimization:** Cache DNS results, parallel queries

5. **Playwright Crawling** (varies, 5-30s typical)
   - **File:** `src/lib/playwright-crawler.ts`
   - **Why slow:** Full browser automation
   - **Optimization:** Disable images, reduce wait time

---

## 🔍 DEBUGGING COMMANDS

```bash
# Check worker status
ps aux | grep tsx

# Kill stuck worker
pkill -9 -f "tsx src/worker"

# Remove lock file
rm worker.lock

# Check database
sqlite3 prisma/dev.db
SELECT * FROM Scan ORDER BY createdAt DESC LIMIT 5;
SELECT * FROM Job ORDER BY createdAt DESC LIMIT 5;

# Check logs
tail -f logs/worker-*.log

# Regenerate Prisma client
npx prisma generate

# Reset database
npx prisma db push --force-reset

# Test single analyzer
npx tsx test-analyzer.ts
```

---

**Last Updated:** November 17, 2025
**Total Files Documented:** 50+ critical files
**Total Lines Mapped:** ~10,000+ lines
**Coverage:** 100% of user journey + error handling

---

## ⚠️ FIGYELMEZTETÉS

**Ez a dokumentum a projekt GERINCE.** Ha bármit módosítasz:

1. ✅ Backup-old a fájlt ELŐTTE
2. ✅ Teszteld izoláltan ELŐSZÖR
3. ✅ Nézd meg a hatását a teljes flow-ra
4. ✅ Frissítsd ezt a dokumentációt UTÁNA
5. ✅ Commit-old a változást git-be

**Regex módosításnál:**
- ✅ Teszteld 10+ különböző input-tal
- ✅ False positive check
- ✅ False negative check
- ✅ Performance check (long strings)

**Database schema változtatásnál:**
- ✅ BACKUP az adatbázist: `cp prisma/dev.db prisma/dev.db.backup`
- ✅ Futtatsd: `npx prisma db push`
- ✅ Futtatsd: `npx prisma generate`
- ✅ Ellenőrizd a TypeScript type-okat

**Sok sikert a debuggoláshoz! 🚀**

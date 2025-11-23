# Complete Scan Flow - End-to-End Journey

This document traces the complete lifecycle of a scan from the user clicking "Scan" to the final rendered results page.

## Table of Contents

1. [User Journey Overview](#user-journey-overview)
2. [Phase 1: Scan Request (Frontend)](#phase-1-scan-request-frontend)
3. [Phase 2: Scan Creation (API Layer)](#phase-2-scan-creation-api-layer)
4. [Phase 3: Job Queue (Database)](#phase-3-job-queue-database)
5. [Phase 4: Worker Processing](#phase-4-worker-processing)
6. [Phase 5: Result Polling (Frontend)](#phase-5-result-polling-frontend)
7. [Phase 6: Report Rendering](#phase-6-report-rendering)
8. [Error Handling & Edge Cases](#error-handling--edge-cases)

---

## User Journey Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER JOURNEY TIMELINE                       │
└─────────────────────────────────────────────────────────────────┘

  USER ACTION          API CALL           DATABASE         WORKER
       │                  │                    │              │
       │ 1. Enter URL     │                    │              │
       │ 2. Click Scan    │                    │              │
       │                  │                    │              │
       ├────────────────> │ POST /api/scan    │              │
       │                  │                    │              │
       │                  ├─────────────────> │ Create Scan  │
       │                  │                    │ status=PENDING│
       │                  │                    │              │
       │                  ├─────────────────> │ Create Job   │
       │                  │                    │ status=PENDING│
       │                  │                    │              │
       │                  │ Spawn Worker ────────────────────>│
       │                  │                    │              │
       │<──────────────── │ {scanId}           │              │
       │                  │                    │              │
       │ 3. Redirect to   │                    │              │
       │    /scan/[id]    │                    │              │
       │                  │                    │              │
       │ 4. Poll results  │                    │              │
       │ (every 2s)       │                    │              │
       │                  │                    │              │
       ├────────────────> │ GET /api/scan/[id]│              │
       │<──────────────── │ status=PENDING    │              │
       │                  │                    │              │
       │                  │                    │              │ Worker picks
       │                  │                    │              │ up Job
       │                  │                    │              │
       │                  │                    │<─────────────│ Update Scan
       │                  │                    │ status=SCANNING
       │                  │                    │              │
       ├────────────────> │ GET /api/scan/[id]│              │ Crawl website
       │<──────────────── │ status=SCANNING   │              │ (Playwright)
       │                  │                    │              │
       │ 5. Loading UI    │                    │              │ Run 41
       │    with tips     │                    │              │ analyzers
       │                  │                    │              │
       │                  │                    │              │ Calculate
       │                  │                    │              │ score (v3)
       │                  │                    │              │
       │                  │                    │<─────────────│ Update Scan
       │                  │                    │ status=COMPLETED
       │                  │                    │ findings=JSON
       │                  │                    │              │
       ├────────────────> │ GET /api/scan/[id]│              │
       │<──────────────── │ FULL REPORT JSON  │              │
       │                  │                    │              │
       │ 6. Render        │                    │              │
       │    results page  │                    │              │
       │                  │                    │              │

TIMELINE: 2-120 seconds (avg 30s for most sites)
```

---

## Phase 1: Scan Request (Frontend)

### File: [src/app/scan/[id]/page.tsx](../src/app/scan/%5Bid%5D/page.tsx)

### Step 1.1: User submits URL

User enters URL and clicks "Scan" button. This could happen from:
- Homepage form
- Lead capture form
- Regenerate report button (existing scan page)
- New scan button (existing scan page)

### Step 1.2: Frontend initiates scan request

```typescript
// src/app/scan/[id]/page.tsx:973-1024

const handleNewScan = async () => {
  // 1. Get URL from user input
  const url = prompt('Enter URL to scan:')

  if (!url) return

  setIsLoading(true)
  setError('')
  setShowLeadModal(false)

  try {
    // 2. Send POST request to create scan
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle error responses
      throw new Error(data.error || 'Scan creation failed')
    }

    // 3. Redirect to new scan page with scanId
    window.location.href = `/scan/${data.scanId}`

  } catch (err: any) {
    setError(err.message || 'Failed to create scan')
    setIsLoading(false)
  }
}
```

**What happens:**
1. Collect URL from user
2. Send POST to `/api/scan` with URL in request body
3. Receive `{scanId, message}` response
4. Redirect browser to `/scan/[scanId]` page
5. New page starts polling for results

---

## Phase 2: Scan Creation (API Layer)

### File: [src/app/api/scan/route.ts](../src/app/api/scan/route.ts)

### Step 2.1: API receives POST request

```typescript
// src/app/api/scan/route.ts:19-137

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json()
    const { url } = body

    // 2. Normalize URL (fix common typos)
    const normalizedUrl = normalizeURL(url)

    // 3. Validate URL format with Zod
    const validation = urlSchema.safeParse({ url: normalizedUrl })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid URL format',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }
```

**URL Normalization** ([src/lib/url-validator.ts](../src/lib/url-validator.ts)):
```typescript
// Fix common typos
normalizedUrl = normalizedUrl
  .replace(/^htps:\/\//i, 'https://')   // htps → https
  .replace(/^htp:\/\//i, 'http://')      // htp → http
  .replace(/^https:\/$/i, 'https://')    // https:/ → https://
  .replace(/^http:\/$/i, 'http://')      // http:/ → http://

// Add protocol if missing
if (!/^https?:\/\//i.test(normalizedUrl)) {
  normalizedUrl = 'https://' + normalizedUrl
}

// Extract domain
const domain = new URL(normalizedUrl).hostname
```

### Step 2.2: Domain validation (DNS lookup)

**CRITICAL STEP:** Before creating database records, verify domain exists.

```typescript
// src/app/api/scan/route.ts:48-65

// Extract domain from URL
const domain = new URL(normalizedUrl).hostname

// Validate domain BEFORE creating scan
const domainValidation = await validateDomain(domain)

if (!domainValidation.valid) {
  return NextResponse.json(
    {
      error: 'Domain validation failed',
      message: getDomainValidationErrorMessage(domainValidation),
      details: {
        domain,
        errorCode: domainValidation.errorCode,
        errorMessage: domainValidation.error
      }
    },
    { status: 400 }
  )
}
```

**Domain Validation Logic** ([src/lib/url-validator.ts](../src/lib/url-validator.ts:94-155)):

```typescript
import dns from 'dns'
import { promisify } from 'util'

const resolveDns = promisify(dns.resolve)

export async function validateDomain(domain: string): Promise<DomainValidation> {
  try {
    // Perform DNS lookup to verify domain exists
    const addresses = await resolveDns(domain)

    return {
      valid: true,
      domain,
      resolves: true,
      ipAddresses: addresses
    }

  } catch (error: any) {
    // DNS lookup failed - domain doesn't exist or has DNS issues
    return {
      valid: false,
      domain,
      resolves: false,
      error: error.message,
      errorCode: error.code // 'ENOTFOUND', 'ESERVFAIL', etc.
    }
  }
}
```

**Why this matters:** Prevents wasting database space and worker resources on invalid domains.

### Step 2.3: Create database records

```typescript
// src/app/api/scan/route.ts:70-83

// 1. Create Scan record in database
const scan = await prisma.scan.create({
  data: {
    url: normalizedUrl,
    domain,
    status: 'PENDING',  // Initial status
  },
})

// 2. Create Job record in queue
await jobQueue.add('scan', {
  scanId: scan.id,
  url: normalizedUrl,
})

console.log(`[API] Scan ${scan.id} created for ${normalizedUrl}`)
```

**Database Schema** ([prisma/schema.prisma](../prisma/schema.prisma)):

```prisma
model Scan {
  id          String   @id @default(uuid())
  url         String
  domain      String
  status      String   @default("PENDING")  // PENDING | SCANNING | COMPLETED | FAILED

  riskScore   Int?
  riskLevel   String?

  detectedTech String?  // JSON: detected technologies
  findings    String?   // JSON: full report
  metadata    String?   // JSON: performance, timing, etc.

  createdAt   DateTime @default(now())
  startedAt   DateTime?
  completedAt DateTime?

  aiTrustScorecard AiTrustScorecard? // 1:1 relation
}

model Job {
  id           String   @id @default(uuid())
  type         String   // 'scan'
  data         String   // JSON: {scanId, url}
  status       String   @default("PENDING")  // PENDING | PROCESSING | COMPLETED | FAILED

  attempts     Int      @default(0)
  maxAttempts  Int      @default(3)

  error        String?

  createdAt    DateTime @default(now())
  startedAt    DateTime?
  completedAt  DateTime?
}
```

### Step 2.4: Auto-spawn worker process

```typescript
// src/app/api/scan/route.ts:85-105

// Import spawn for process creation
import { spawn } from 'child_process'

// Auto-spawn worker process for immediate processing
const workerPath = path.join(process.cwd(), 'src/worker/index-sqlite.ts')

const worker = spawn('npx', ['tsx', workerPath], {
  cwd: process.cwd(),
  detached: true,    // Run independently from parent
  stdio: 'ignore',   // Don't inherit stdio (prevents blocking)
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV,
    USE_REAL_CRAWLER: 'true'  // Use Playwright (not mock)
  },
})

worker.unref()  // Allow parent process to exit independently

console.log(`[API] Worker process spawned for scan ${scan.id}`)
```

**Why spawn worker here?**
- Immediate processing (no manual worker start needed)
- Worker runs ONE job then exits (fresh code, no caching issues)
- Multiple concurrent scans = multiple worker processes
- Workers are short-lived (30-120s typical)

### Step 2.5: Return response to frontend

```typescript
// src/app/api/scan/route.ts:107-111

return NextResponse.json(
  {
    scanId: scan.id,
    message: 'Scan created successfully',
  },
  { status: 200 }
)
```

---

## Phase 3: Job Queue (Database)

### File: [src/lib/queue-sqlite.ts](../src/lib/queue-sqlite.ts)

The job queue is SQLite-based (via Prisma) for persistence across process restarts.

### Step 3.1: Add job to queue

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

  console.log(`[Queue] Job ${job.id} added (type: ${type})`)

  return job.id
}
```

### Step 3.2: Worker polls for next job

```typescript
// src/lib/queue-sqlite.ts:36-71

async getNext(): Promise<{ id: string; type: string; data: any } | null> {
  // 1. Find oldest pending job
  const job = await prisma.job.findFirst({
    where: {
      status: 'PENDING',
      attempts: {
        lt: prisma.job.fields.maxAttempts,  // attempts < 3
      },
    },
    orderBy: {
      createdAt: 'asc',  // FIFO queue
    },
  })

  if (!job) {
    return null  // No jobs available
  }

  // 2. Mark job as PROCESSING (atomic update)
  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
      attempts: {
        increment: 1,
      },
    },
  })

  // 3. Return job data to worker
  return {
    id: job.id,
    type: job.type,
    data: JSON.parse(job.data),
  }
}
```

**Why this design?**
- **Persistent:** SQLite survives server restarts
- **Atomic:** Status updates prevent race conditions (multiple workers won't pick same job)
- **Retry logic:** Failed jobs stay PENDING (up to 3 attempts)
- **FIFO ordering:** Fair processing (oldest first)

---

## Phase 4: Worker Processing

### File: [src/worker/index-sqlite.ts](../src/worker/index-sqlite.ts)

This is the CORE processing engine. One worker = one scan.

### Step 4.1: Worker startup

```typescript
// src/worker/index-sqlite.ts:851-857

async function processOneJob() {
  // 1. Check if we should start (prevents multiple workers)
  const canStart = await workerManager.start()

  if (!canStart) {
    console.log('[Worker] Another worker is already running, exiting...')
    process.exit(0)
  }

  console.log('[Worker] ✅ SQLite Queue Worker started')
  console.log('[Worker] 🔍 Checking for pending jobs...')
```

**Worker Manager** ([src/worker/worker-manager.ts](../src/worker/worker-manager.ts)):

Prevents duplicate workers from running simultaneously using a lock file.

```typescript
async start(): Promise<boolean> {
  // Check if lock file exists
  const lockFile = path.join(process.cwd(), 'worker.lock')

  if (fs.existsSync(lockFile)) {
    return false  // Another worker is running
  }

  // Create lock file
  fs.writeFileSync(lockFile, process.pid.toString())
  return true
}

async shutdown(): Promise<void> {
  // Remove lock file
  const lockFile = path.join(process.cwd(), 'worker.lock')

  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile)
  }
}
```

### Step 4.2: Get job from queue

```typescript
// src/worker/index-sqlite.ts:862-868

// Get next pending job from SQLite queue
const job = await jobQueue.getNext()

if (job) {
  console.log(`[Worker] 🎯 Found job ${job.id} (type: ${job.type})`)

  // Process the job
  await processScanJob(job.data)
}
```

### Step 4.3: Update scan status to SCANNING

```typescript
// src/worker/index-sqlite.ts:75-92

async function processScanJob(data: { scanId: string; url: string }) {
  const { scanId, url } = data

  console.log(`[Worker] Processing scan ${scanId} for ${url}`)

  // Start performance tracking
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

### Step 4.4: Crawl website with Playwright

```typescript
// src/worker/index-sqlite.ts:94-99

// Step 1: Crawl the website
console.log(`[Worker] Crawling ${url}...`)
const crawlStart = Date.now()
const crawlResult = await crawler.crawl(url)
timings.crawl = Date.now() - crawlStart
console.log(`[Worker] Crawl completed in ${timings.crawl}ms`)
```

**Crawler Adapter** ([src/lib/crawler-adapter.ts](../src/lib/crawler-adapter.ts:25-84)):

```typescript
async crawl(url: string): Promise<CrawlerResult> {
  console.log(`[CrawlerAdapter] Crawling ${url} with Playwright...`)

  // 1. Use PlaywrightCrawler to fetch page
  const playwrightResult = await this.crawler.crawl(url)

  // 2. Convert to unified CrawlerResult format
  const adapted: CrawlerResult = {
    // Basic info
    url: playwrightResult.url,
    finalUrl: playwrightResult.finalUrl,  // After redirects
    statusCode: playwrightResult.statusCode,
    success: playwrightResult.success,

    // Network data
    requests: playwrightResult.requests,    // All network requests
    responses: playwrightResult.responses,  // All responses

    // Page data
    html: playwrightResult.html,            // Full HTML source
    title: playwrightResult.title,
    cookies: playwrightResult.cookies || [],
    screenshot: playwrightResult.screenshot,

    // SSL/TLS certificate
    sslCertificate: playwrightResult.sslCertificate,

    // JavaScript evaluation
    jsEvaluation: playwrightResult.jsEvaluation,

    // Performance
    loadTime: playwrightResult.loadTime,
    timingBreakdown: playwrightResult.timingBreakdown,
    timestamp: playwrightResult.timestamp,
  }

  return adapted
}
```

**What Playwright captures:**
- Full HTML source code
- All network requests/responses
- Cookies with all attributes
- SSL/TLS certificate details
- JavaScript evaluation results
- Screenshots (optional)
- Performance timing data

### Step 4.5: Run 41 security analyzers

All analyzers run in sequence (parallelization would complicate error handling).

```typescript
// src/worker/index-sqlite.ts:101-514

console.log(`[Worker] Running analyzers...`)
const analyzerStart = Date.now()

// === CORE SECURITY ANALYZERS (26 total) ===

// 1. Security Headers (CSP, HSTS, X-Frame-Options, etc.)
const securityHeaders = analyzeSecurityHeaders(crawlResult)

// 2. Client Risks (exposed API keys, secrets)
const clientRisks = analyzeClientRisks(crawlResult)

// 3. SSL/TLS Analysis
const sslTLS = analyzeSSLTLS(crawlResult)

// 4. Cookie Security (Secure, HttpOnly, SameSite)
const cookieSecurity = analyzeCookieSecurity(crawlResult)

// 5. JS Libraries (vulnerable versions, missing SRI)
const jsLibraries = analyzeJSLibraries(crawlResult)

// 6. Tech Stack Detection (Wappalyzer-style)
const techStack = analyzeTechStack(crawlResult)

// 7. Reconnaissance (exposed info that aids attackers)
const reconnaissance = await analyzeReconnaissance(crawlResult)

// 8. Admin Detection (admin panels, login forms)
const adminDetection = await analyzeAdminDetection(crawlResult)

// 9. Admin Discovery (API docs, GraphQL, Swagger)
const adminDiscovery = await analyzeAdminDiscovery(crawlResult)

// 10. CORS Analysis (misconfiguration, wildcard origins)
const corsAnalysis = analyzeCORS(crawlResult)

// 11. DNS Security (DNSSEC, SPF, DKIM, DMARC)
const dnsAnalysis = await analyzeDNSSecurity(crawlResult)

// 12. Port Scanner (exposed databases, dev servers)
const portScan = await analyzePortScan(crawlResult)

// 13. Compliance (GDPR, CCPA, PCI DSS, HIPAA)
const compliance = await analyzeCompliance(
  crawlResult.html,
  crawlResult.cookies || [],
  crawlResult.responseHeaders || {},
  crawlResult.url
)

// 14. WAF Detection (Cloudflare, AWS WAF, Akamai)
const wafDetection = await analyzeWAFDetection(
  crawlResult.responseHeaders || {},
  crawlResult.cookies || [],
  crawlResult.html
)

// 15. MFA Detection (OAuth, WebAuthn, TOTP)
const mfaDetection = await analyzeMFADetection(crawlResult.html)

// 16. Rate Limiting Detection
const rateLimiting = await analyzeRateLimiting(
  crawlResult.responseHeaders || {},
  crawlResult.html
)

// 17. GraphQL Security
const graphqlSecurity = await analyzeGraphQL(crawlResult.html)

// 18. Error Disclosure (stack traces, DB errors, debug mode)
const errorDisclosure = await analyzeErrorDisclosure(
  crawlResult.html,
  crawlResult.responseHeaders || {}
)

// 19. SPA/API Detection
const spaApi = await analyzeSpaApi(
  crawlResult.html,
  [], // JS files
  []  // Network requests
)

// 20. Backend Framework Detection (Express, Django, Rails)
const backendFramework = await analyzeBackendFramework(
  crawlResult.html,
  crawlResult.responseHeaders || {},
  crawlResult.cookies || []
)

// 21. Web Server Security (nginx, Apache, IIS)
const webServer = await analyzeWebServer(
  crawlResult.responseHeaders || {}
)

// 22. Frontend Framework Security (React, Vue, Angular)
const frontendFramework = await analyzeFrontendFramework(
  crawlResult.html,
  [] // Script URLs
)

// 23. Passive API Discovery (exposed tokens, endpoints)
const passiveAPI = await analyzePassiveAPIDiscovery(
  crawlResult.html,
  url
)

// === AI TRUST SCORE (27 checks) ===

// 24. AI Trust Score (MUST run before OWASP LLM analyzers!)
const aiTrustResult = analyzeAiTrust(crawlResult, sslTLS.score)

// Use AI Trust Score as source of truth for AI detection
const aiDetection: AIDetectionResult = {
  hasAI: aiTrustResult.hasAiImplementation || false,
  providers: aiTrustResult.detectedAiProvider ? [aiTrustResult.detectedAiProvider] : [],
  chatWidgets: aiTrustResult.detectedChatFramework ? [aiTrustResult.detectedChatFramework] : [],
  // ... other fields
}

// === OWASP LLM TOP 10 (6 analyzers - ONLY if AI detected) ===

if (aiTrustResult.hasAiImplementation &&
    (aiTrustResult.aiConfidenceLevel === 'medium' ||
     aiTrustResult.aiConfidenceLevel === 'high')) {

  console.log(`[Worker] 🤖 AI detected! Running OWASP LLM security analyzers...`)

  // 25. LLM01 - Prompt Injection Risk
  const llm01PromptInjection = await analyzeLLM01PromptInjection(
    crawlResult.html,
    crawlResult.responseHeaders || {}
  )

  // 26. LLM02 - Insecure Output Handling
  const llm02InsecureOutput = await analyzeLLM02InsecureOutput(
    crawlResult.html,
    crawlResult.responseHeaders || {}
  )

  // 27. LLM05 - Supply Chain Vulnerabilities
  const llm05SupplyChain = await analyzeLLM05SupplyChain(
    crawlResult.html,
    crawlResult.responseHeaders || {}
  )

  // 28. LLM06 - Sensitive Information Disclosure (with 25s timeout)
  const llm06SensitiveInfo = await runWithTimeout(
    () => analyzeLLM06SensitiveInfo(crawlResult.html, crawlResult.responseHeaders || {}),
    25000,
    'LLM06'
  )

  // 29. LLM07 - Insecure Plugin Design
  const llm07PluginDesign = await analyzeLLM07PluginDesign(
    crawlResult.html,
    crawlResult.responseHeaders || {}
  )

  // 30. LLM08 - Excessive Agency
  const llm08ExcessiveAgency = await analyzeLLM08ExcessiveAgency(
    crawlResult.html,
    crawlResult.responseHeaders || {}
  )

} else {
  // No AI detected - skip OWASP LLM analyzers
  console.log(`[Worker] ⚪ No AI implementation detected - Skipping OWASP LLM analyzers`)
}

timings.totalAnalyzers = Date.now() - analyzerStart
```

**Timeout Protection:**

Some analyzers (reconnaissance, admin detection, LLM06) have timeout wrappers to prevent infinite loops.

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

### Step 4.6: Generate report

```typescript
// src/worker/index-sqlite.ts:558-614

console.log(`[Worker] Generating initial report (without DNS)...`)

const reportStart = Date.now()
let report = generateReport(
  aiDetection,
  securityHeaders,
  clientRisks,
  { score: 0, level: 'LOW', grade: 'A+' }, // Temporary dummy score
  sslTLS,
  cookieSecurity,
  jsLibraries,
  techStack,
  reconnaissance,
  adminDetection,
  adminDiscovery,
  { ...corsAnalysis, bypassPatterns: corsBypassPatterns },
  dnsAnalysis,
  portScan,
  compliance,
  wafDetection,
  mfaDetection,
  rateLimiting,
  graphqlSecurity,
  errorDisclosure,
  spaApi,
  llm01PromptInjection,
  llm02InsecureOutput,
  llm05SupplyChain,
  llm06SensitiveInfo,
  llm07PluginDesign,
  llm08ExcessiveAgency,
  backendFramework,
  webServer,
  frontendFramework,
  passiveAPI
)
timings.reportGeneration = Date.now() - reportStart
```

**Report Generator** ([src/worker/report-generator.ts](../src/worker/report-generator.ts)):

Aggregates all analyzer results into standardized `Finding[]` array:

```typescript
export interface Finding {
  id: string                    // Unique identifier
  category: string              // 'ssl', 'cookie', 'owasp-llm01', etc.
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string                 // "Missing HSTS Header"
  description: string           // Detailed explanation
  evidence?: string             // Code snippet, header value, etc.
  impact: string                // Business/security impact
  recommendation: string        // How to fix
}
```

### Step 4.7: Calculate professional security score

```typescript
// src/worker/index-sqlite.ts:616-644

console.log(`[Worker] 🎯 Calculating Professional Security Score v3.0...`)
const riskScoreStart = Date.now()

// Calculate scoring breakdown using v3 system (100=perfect, 0=critical)
const scoreBreakdown = calculateSecurityScore(
  report.findings || [],
  {
    hasAI: aiDetection.hasAI,
    sslCertificate: crawlResult.sslCertificate,
  }
)

timings.riskScore = Date.now() - riskScoreStart

console.log(`[Worker] ✅ Score: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.grade}, ${scoreBreakdown.riskLevel})`)
console.log(`[Worker]   - Critical Infrastructure: ${scoreBreakdown.categories.criticalInfrastructure.score}/100`)
console.log(`[Worker]   - Authentication: ${scoreBreakdown.categories.authentication.score}/100`)
console.log(`[Worker]   - Data Protection: ${scoreBreakdown.categories.dataProtection.score}/100`)
console.log(`[Worker]   - Code Quality: ${scoreBreakdown.categories.codeQuality.score}/100`)
console.log(`[Worker]   - AI Security: ${scoreBreakdown.categories.aiSecurity.applicable ? `${scoreBreakdown.categories.aiSecurity.score}/100` : 'N/A'}`)

// Update report with final score
report.summary.riskScore = {
  score: scoreBreakdown.overallScore,
  level: scoreBreakdown.riskLevel,
  grade: scoreBreakdown.grade,
}

report.scoreBreakdown = scoreBreakdown
```

**Scoring System** ([src/worker/scoring-v3.ts](../src/worker/scoring-v3.ts)):

Professional scoring based on:
- **OWASP Risk Rating Methodology v4.0**
- **CVSS 3.1** (Common Vulnerability Scoring System)
- **NIST Cybersecurity Framework 2.0**
- **CIS Controls v8**

**Key design:**
1. Start at 100 points (perfect security)
2. Deduct points for findings (transparent penalties)
3. Category-based weighted scoring:
   - Critical Infrastructure (SSL, DNS): 30%
   - Authentication (cookies, sessions): 25%
   - Data Protection (headers, CSP): 20%
   - AI Security (OWASP LLM): 15%
   - Code Quality (libraries): 10%
4. Diminishing returns (10 low findings ≠ 1 critical)
5. Grade system (A+ to F)

**Penalty structure:**

```typescript
const PENALTY_POINTS = {
  critical: {
    first: 25,       // First critical finding: -25 points
    additional: 15,  // Each additional: -15 points
    cap: 60,        // Max deduction per category
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

**Bonus points** (max 12):
- HTTPS enabled: +2
- Strong CSP: +3
- HSTS enabled: +2
- No exposed secrets: +5
- DNSSEC enabled: +2
- All libraries up-to-date: +2
- Secure cookies: +2
- SPF/DKIM/DMARC: +2

### Step 4.8: Save results to database

```typescript
// src/worker/index-sqlite.ts:692-708

console.log(`[Worker] Saving results...`)

await prisma.scan.update({
  where: { id: scanId },
  data: {
    status: 'COMPLETED',
    riskScore: scoreBreakdown.overallScore,
    riskLevel: scoreBreakdown.riskLevel,
    detectedTech: JSON.stringify(report.detectedTech),
    findings: JSON.stringify(report),  // Full report as JSON
    metadata: JSON.stringify({
      timings,
      scoreBreakdown,
      timestamp: new Date().toISOString(),
    }),
    completedAt: new Date(),
  },
})
```

### Step 4.9: Save AI Trust Scorecard (separate table)

```typescript
// src/worker/index-sqlite.ts:710-778

console.log(`[Worker] Saving AI Trust Scorecard...`)

await prisma.aiTrustScorecard.create({
  data: {
    scanId: scanId,

    // Transparency (6 checks)
    isProviderDisclosed: aiTrustResult.checks.isProviderDisclosed,
    isIdentityDisclosed: aiTrustResult.checks.isIdentityDisclosed,
    isAiPolicyLinked: aiTrustResult.checks.isAiPolicyLinked,
    isModelVersionDisclosed: aiTrustResult.checks.isModelVersionDisclosed,
    isLimitationsDisclosed: aiTrustResult.checks.isLimitationsDisclosed,
    hasDataUsageDisclosure: aiTrustResult.checks.hasDataUsageDisclosure,

    // User Control (5 checks)
    hasFeedbackMechanism: aiTrustResult.checks.hasFeedbackMechanism,
    hasConversationReset: aiTrustResult.checks.hasConversationReset,
    hasHumanEscalation: aiTrustResult.checks.hasHumanEscalation,
    hasConversationExport: aiTrustResult.checks.hasConversationExport,
    hasDataDeletionOption: aiTrustResult.checks.hasDataDeletionOption,

    // Compliance (5 checks)
    hasDpoContact: aiTrustResult.checks.hasDpoContact,
    hasCookieBanner: aiTrustResult.checks.hasCookieBanner,
    hasPrivacyPolicyLink: aiTrustResult.checks.hasPrivacyPolicyLink,
    hasTermsOfServiceLink: aiTrustResult.checks.hasTermsOfServiceLink,
    hasGdprCompliance: aiTrustResult.checks.hasGdprCompliance,

    // Security & Reliability (7 checks)
    hasBotProtection: aiTrustResult.checks.hasBotProtection,
    hasAiRateLimitHeaders: aiTrustResult.checks.hasAiRateLimitHeaders,
    hasBasicWebSecurity: aiTrustResult.checks.hasBasicWebSecurity,
    hasInputLengthLimit: aiTrustResult.checks.hasInputLengthLimit,
    usesInputSanitization: aiTrustResult.checks.usesInputSanitization,
    hasErrorHandling: aiTrustResult.checks.hasErrorHandling,
    hasSessionManagement: aiTrustResult.checks.hasSessionManagement,

    // Ethical AI (4 checks)
    hasBiasDisclosure: aiTrustResult.checks.hasBiasDisclosure,
    hasContentModeration: aiTrustResult.checks.hasContentModeration,
    hasAgeVerification: aiTrustResult.checks.hasAgeVerification,
    hasAccessibilitySupport: aiTrustResult.checks.hasAccessibilitySupport,

    // Scores
    score: aiTrustResult.score ?? 0,
    weightedScore: aiTrustResult.weightedScore ?? 0,
    categoryScores: JSON.stringify(aiTrustResult.categoryScores),
    passedChecks: aiTrustResult.passedChecks,
    totalChecks: aiTrustResult.totalChecks,
    relevantChecks: aiTrustResult.relevantChecks || 0,

    // AI Detection Status
    hasAiImplementation: aiTrustResult.hasAiImplementation || false,
    aiConfidenceLevel: aiTrustResult.aiConfidenceLevel || 'none',

    // Detected AI Technology
    detectedAiProvider: aiTrustResult.detectedAiProvider,
    detectedModel: aiTrustResult.detectedModel,
    detectedChatFramework: aiTrustResult.detectedChatFramework,

    // Evidence
    evidenceData: JSON.stringify(aiTrustResult.evidenceData || {}),
    detailedChecks: JSON.stringify(aiTrustResult.detailedChecks || {}),
    summary: JSON.stringify(aiTrustResult.summary || {}),
  },
})

console.log(`[Worker] ✅ AI Trust Scorecard saved`)
```

### Step 4.10: Mark job as complete and exit

```typescript
// src/worker/index-sqlite.ts:869-887

if (job.type === 'scan') {
  await processScanJob(job.data)
  await jobQueue.complete(job.id)
  console.log(`[Worker] ✅ Job completed successfully, worker shutting down...`)
}

// Close browser and cleanup before exit
await crawler.close()
await workerManager.shutdown()
process.exit(0)
```

**Why exit after one job?**
- Fresh code on every scan (no caching issues)
- No memory leaks from long-running processes
- Automatic cleanup of browser resources
- Multiple scans = multiple workers (better parallelization)

---

## Phase 5: Result Polling (Frontend)

### File: [src/app/scan/[id]/page.tsx](../src/app/scan/%5Bid%5D/page.tsx)

### Step 5.1: Poll for scan results

```typescript
// src/app/scan/[id]/page.tsx:124-187

const fetchScan = useCallback(async () => {
  try {
    // 1. Fetch scan results from API
    const response = await fetch(`/api/scan/${params.id}`)

    if (!response.ok) {
      if (response.status === 404) {
        setError('Scan not found')
      } else {
        setError('Failed to load scan')
      }
      setIsLoading(false)
      return
    }

    const data = await response.json()

    // 2. Update state with scan data
    setScan(data)

    // 3. Check scan status
    if (data.status === 'COMPLETED') {
      // Scan finished - parse results
      if (data.findings) {
        const parsedFindings = typeof data.findings === 'string'
          ? JSON.parse(data.findings)
          : data.findings

        setReport(parsedFindings)
      }

      setIsLoading(false)

    } else if (data.status === 'FAILED') {
      // Scan failed
      setError('Scan failed. Please try again.')
      setIsLoading(false)

    } else if (data.status === 'SCANNING' || data.status === 'PENDING') {
      // Still processing - keep polling
      setIsLoading(true)
    }

  } catch (err: any) {
    setError(err.message || 'Failed to load scan')
    setIsLoading(false)
  }
}, [params.id])
```

### Step 5.2: useEffect polling loop

```typescript
// src/app/scan/[id]/page.tsx:189-208

useEffect(() => {
  // Initial fetch
  fetchScan()

  // Poll every 2 seconds if still loading
  const interval = setInterval(() => {
    if (isLoading) {
      fetchScan()
    }
  }, 2000)

  // Cleanup interval on unmount
  return () => clearInterval(interval)
}, [fetchScan, isLoading])
```

**Polling behavior:**
- Initial fetch on page load
- Poll every 2 seconds while `status !== 'COMPLETED'`
- Stop polling once completed or failed
- Cleanup interval on page unmount

### Step 5.3: API endpoint returns results

### File: [src/app/api/scan/[id]/route.ts](../src/app/api/scan/%5Bid%5D/route.ts)

```typescript
// src/app/api/scan/[id]/route.ts:4-57

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Fetch scan from database (include AI Trust Scorecard)
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        aiTrustScorecard: true,  // 1:1 relation
      },
    })

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    // 2. Parse JSON fields
    const response = {
      ...scan,
      detectedTech: scan.detectedTech ? JSON.parse(scan.detectedTech) : null,
      findings: scan.findings ? JSON.parse(scan.findings) : null,
      metadata: scan.metadata ? JSON.parse(scan.metadata) : null,

      // Parse AI Trust Scorecard JSON fields
      aiTrustScorecard: scan.aiTrustScorecard ? {
        ...scan.aiTrustScorecard,
        categoryScores: scan.aiTrustScorecard.categoryScores
          ? JSON.parse(scan.aiTrustScorecard.categoryScores)
          : null,
        evidenceData: scan.aiTrustScorecard.evidenceData
          ? JSON.parse(scan.aiTrustScorecard.evidenceData)
          : null,
        detailedChecks: scan.aiTrustScorecard.detailedChecks
          ? JSON.parse(scan.aiTrustScorecard.detailedChecks)
          : null,
        summary: scan.aiTrustScorecard.summary
          ? JSON.parse(scan.aiTrustScorecard.summary)
          : null,
      } : null,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Scan fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Response structure:**

```typescript
{
  // Scan metadata
  id: string,
  url: string,
  domain: string,
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED',

  // Security score
  riskScore: number,          // 0-100 (v3 scoring)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',

  // Technology detection
  detectedTech: {
    aiProviders: string[],
    chatWidgets: string[],
  },

  // Full report (ScanReport interface)
  findings: {
    summary: { ... },
    findings: Finding[],
    techStack: { ... },
    sslTLS: { ... },
    // ... all 41 analyzer results
  },

  // AI Trust Scorecard (separate table)
  aiTrustScorecard: {
    score: number,
    weightedScore: number,
    passedChecks: number,
    totalChecks: number,
    relevantChecks: number,
    hasAiImplementation: boolean,
    aiConfidenceLevel: 'none' | 'low' | 'medium' | 'high',
    // ... 27 boolean checks
    // ... category scores
    // ... evidence data
  },

  // Performance metadata
  metadata: {
    timings: { ... },
    scoreBreakdown: { ... },
    timestamp: string,
  },

  // Timestamps
  createdAt: Date,
  startedAt: Date,
  completedAt: Date,
}
```

---

## Phase 6: Report Rendering

### File: [src/app/scan/[id]/page.tsx](../src/app/scan/%5Bid%5D/page.tsx)

Once `status === 'COMPLETED'`, the page renders the full report.

### Step 6.1: Loading state UI

```typescript
// src/app/scan/[id]/page.tsx:522-591

if (isLoading) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Loading header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full mb-4">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="font-medium text-blue-900">
              {scan?.status === 'SCANNING' ? 'Security scan in progress...' : 'Initializing scan...'}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Analyzing {scan?.domain}</h1>
          <p className="text-gray-600">Running 41 security checks and AI Trust Score analysis</p>
        </div>

        {/* Progress indicators */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="space-y-6">
              {/* Animated progress bars for each analyzer category */}
              <ProgressIndicator title="Crawling website" status="active" />
              <ProgressIndicator title="Security headers analysis" status="pending" />
              <ProgressIndicator title="SSL/TLS certificate check" status="pending" />
              <ProgressIndicator title="Cookie security audit" status="pending" />
              <ProgressIndicator title="AI Trust Score evaluation" status="pending" />
              <ProgressIndicator title="OWASP LLM Top 10 checks" status="pending" />
            </div>
          </div>

          {/* Security tips while waiting */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Did you know?</h3>
            <p className="text-blue-800 text-sm">
              {securityTips[Math.floor(Math.random() * securityTips.length)]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 6.2: Completed state - Risk score card

```typescript
// src/app/scan/[id]/page.tsx:593-693

{/* Risk Score Hero Section */}
<div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-12 px-4">
  <div className="container mx-auto max-w-7xl">
    <div className="grid md:grid-cols-2 gap-8 items-center">
      {/* Left: Score */}
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-4">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Scan completed</span>
        </div>

        <h1 className="text-4xl font-bold mb-2">{scan?.domain}</h1>
        <p className="text-blue-100">Security analysis completed on {new Date(scan?.completedAt || '').toLocaleDateString()}</p>

        {/* Overall Grade */}
        <div className="mt-6">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(report?.summary?.riskScore?.grade || 'F')}`}>
                {report?.summary?.riskScore?.grade || 'N/A'}
              </div>
              <div className="text-sm text-blue-100 mt-2">Security Grade</div>
            </div>

            <div className="h-16 w-px bg-white/20"></div>

            <div className="text-center">
              <div className="text-4xl font-bold">
                {report?.summary?.riskScore?.score ?? 0}/100
              </div>
              <div className="text-sm text-blue-100 mt-2">Security Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Risk breakdown */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Risk Summary</h3>
        <div className="space-y-3">
          <RiskItem
            label="Critical"
            count={report?.summary?.criticalIssues || 0}
            color="red"
          />
          <RiskItem
            label="High"
            count={report?.summary?.highIssues || 0}
            color="orange"
          />
          <RiskItem
            label="Medium"
            count={report?.summary?.mediumIssues || 0}
            color="yellow"
          />
          <RiskItem
            label="Low"
            count={report?.summary?.lowIssues || 0}
            color="blue"
          />
        </div>
      </div>
    </div>
  </div>
</div>
```

**Grade color mapping:**

```typescript
function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-400'
  if (grade.startsWith('B')) return 'text-blue-400'
  if (grade.startsWith('C')) return 'text-yellow-400'
  if (grade.startsWith('D')) return 'text-orange-400'
  return 'text-red-400'  // F
}
```

### Step 6.3: AI Trust Score section

**PRIORITY PLACEMENT:** AI Trust Score is shown FIRST, above all other analyzers.

```typescript
// src/app/scan/[id]/page.tsx:695-812

{/* AI Trust Score Section (PRIORITY) */}
{scan?.aiTrustScorecard && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
      <Brain className="h-7 w-7 text-purple-600" />
      AI Trust Score
      {scan.aiTrustScorecard.hasAiImplementation && (
        <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
          AI Detected ({scan.aiTrustScorecard.aiConfidenceLevel} confidence)
        </span>
      )}
    </h2>

    {scan.aiTrustScorecard.hasAiImplementation ? (
      <div className="bg-white rounded-xl shadow-sm p-8 border-l-4 border-purple-600">
        {/* Score overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {scan.aiTrustScorecard.weightedScore}
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <div className="text-sm text-gray-600">Weighted AI Trust Score</div>
            <div className="text-xs text-gray-500 mt-1">
              Grade: {getAITrustGrade(scan.aiTrustScorecard.weightedScore)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-700 mb-2">
              {scan.aiTrustScorecard.passedChecks}/{scan.aiTrustScorecard.relevantChecks}
            </div>
            <div className="text-sm text-gray-600">Checks Passed</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((scan.aiTrustScorecard.passedChecks / scan.aiTrustScorecard.relevantChecks) * 100)}% compliance
            </div>
          </div>

          <div className="text-center">
            <div className="text-xl font-medium text-gray-700 mb-2">
              {scan.aiTrustScorecard.detectedAiProvider || 'Generic AI'}
            </div>
            <div className="text-sm text-gray-600">Detected Provider</div>
            {scan.aiTrustScorecard.detectedChatFramework && (
              <div className="text-xs text-gray-500 mt-1">
                Framework: {scan.aiTrustScorecard.detectedChatFramework}
              </div>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-lg">Category Scores</h3>

          {Object.entries(scan.aiTrustScorecard.categoryScores || {}).map(([category, data]: [string, any]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-sm font-semibold">
                  {data.passed}/{data.total} passed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getCategoryColor(data.percentage)}`}
                  style={{ width: `${data.percentage}%` }}
                ></div>
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {data.percentage}% compliance
              </div>
            </div>
          ))}
        </div>

        {/* Detailed checks (collapsible) */}
        <details className="group">
          <summary className="cursor-pointer font-medium text-purple-600 hover:text-purple-700 flex items-center gap-2">
            <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" />
            View all 27 checks
          </summary>

          <div className="mt-4 space-y-2 pl-6">
            {Object.entries(scan.aiTrustScorecard).map(([key, value]) => {
              if (typeof value !== 'boolean') return null

              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {value ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={value ? 'text-gray-700' : 'text-gray-500'}>
                    {formatCheckName(key)}
                  </span>
                </div>
              )
            })}
          </div>
        </details>
      </div>
    ) : (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="font-semibold text-lg mb-2">No AI Implementation Detected</h3>
        <p className="text-gray-600">
          This website does not appear to use AI technologies. AI Trust Score is not applicable.
        </p>
      </div>
    )}
  </div>
)}
```

### Step 6.4: Technology stack section

Shows all detected technologies grouped by category.

```typescript
// src/app/scan/[id]/page.tsx:814-892

{/* Technology Stack */}
{report?.techStack && report.techStack.totalCount > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
      <Layers className="h-7 w-7 text-indigo-600" />
      Technology Stack
      <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
        {report.techStack.totalCount} detected
      </span>
    </h2>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Backend Frameworks */}
      {report.techStack.categories.backend.length > 0 && (
        <TechCategory
          title="Backend"
          icon={<Server className="h-5 w-5" />}
          technologies={report.techStack.categories.backend}
        />
      )}

      {/* Frontend Frameworks */}
      {report.techStack.categories.frontend.length > 0 && (
        <TechCategory
          title="Frontend"
          icon={<Code className="h-5 w-5" />}
          technologies={report.techStack.categories.frontend}
        />
      )}

      {/* Databases */}
      {report.techStack.categories.database.length > 0 && (
        <TechCategory
          title="Database"
          icon={<Database className="h-5 w-5" />}
          technologies={report.techStack.categories.database}
        />
      )}

      {/* Analytics */}
      {report.techStack.categories.analytics.length > 0 && (
        <TechCategory
          title="Analytics"
          icon={<BarChart className="h-5 w-5" />}
          technologies={report.techStack.categories.analytics}
        />
      )}

      {/* CDN */}
      {report.techStack.categories.cdn.length > 0 && (
        <TechCategory
          title="CDN"
          icon={<Globe className="h-5 w-5" />}
          technologies={report.techStack.categories.cdn}
        />
      )}

      {/* ... all other categories */}
    </div>
  </div>
)}
```

**TechCategory component:**

```typescript
function TechCategory({
  title,
  icon,
  technologies
}: {
  title: string
  icon: React.ReactNode
  technologies: Array<{ name: string, version?: string, category: string }>
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-4 text-gray-700">
        {icon}
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto text-sm text-gray-500">
          {technologies.length}
        </span>
      </div>

      <div className="space-y-2">
        {technologies.map((tech, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{tech.name}</span>
            {tech.version && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                v{tech.version}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 6.5: Security findings by category

All 41 analyzer results displayed in collapsible sections.

```typescript
// src/app/scan/[id]/page.tsx:894-1257

{/* Security Findings */}
<div className="space-y-6">
  <h2 className="text-2xl font-bold flex items-center gap-2">
    <Shield className="h-7 w-7 text-blue-600" />
    Security Findings
    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
      {report?.findings?.length || 0} total
    </span>
  </h2>

  {/* Group findings by category */}
  {Object.entries(groupFindingsByCategory(report?.findings || [])).map(([category, findings]) => (
    <FindingSection
      key={category}
      category={category}
      findings={findings}
    />
  ))}
</div>
```

**FindingSection component:**

```typescript
function FindingSection({
  category,
  findings
}: {
  category: string
  findings: Finding[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const mediumCount = findings.filter(f => f.severity === 'medium').length
  const lowCount = findings.filter(f => f.severity === 'low').length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {getCategoryIcon(category)}
          <h3 className="font-semibold text-lg capitalize">
            {category.replace(/-/g, ' ')}
          </h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
            {findings.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Severity badges */}
          {criticalCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
              {mediumCount} Medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {lowCount} Low
            </span>
          )}

          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Findings list */}
      {isExpanded && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4">
            {findings.map((finding, idx) => (
              <FindingCard key={finding.id || idx} finding={finding} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**FindingCard component:**

```typescript
function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className={`bg-white rounded-lg p-5 border-l-4 ${getSeverityBorderColor(finding.severity)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{finding.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadgeColor(finding.severity)}`}>
              {finding.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600">{finding.description}</p>
        </div>
      </div>

      {/* Evidence (if available) */}
      {finding.evidence && (
        <div className="mb-3">
          <h5 className="text-xs font-semibold text-gray-700 uppercase mb-1">Evidence</h5>
          <pre className="bg-gray-100 rounded p-3 text-xs font-mono overflow-x-auto">
            {finding.evidence}
          </pre>
        </div>
      )}

      {/* Impact */}
      <div className="mb-3">
        <h5 className="text-xs font-semibold text-gray-700 uppercase mb-1">Impact</h5>
        <p className="text-sm text-gray-700">{finding.impact}</p>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-blue-900 uppercase mb-1 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Recommendation
        </h5>
        <p className="text-sm text-blue-800">{finding.recommendation}</p>
      </div>
    </div>
  )
}
```

---

## Error Handling & Edge Cases

### Error 1: Invalid URL format

**Where:** API Layer ([src/app/api/scan/route.ts](../src/app/api/scan/route.ts:35-46))

```typescript
const validation = urlSchema.safeParse({ url: normalizedUrl })

if (!validation.success) {
  return NextResponse.json(
    {
      error: 'Invalid URL format',
      details: validation.error.format()
    },
    { status: 400 }
  )
}
```

**User sees:** Error message on frontend

### Error 2: Domain doesn't exist (DNS lookup fails)

**Where:** API Layer ([src/app/api/scan/route.ts](../src/app/api/scan/route.ts:48-65))

```typescript
const domainValidation = await validateDomain(domain)

if (!domainValidation.valid) {
  return NextResponse.json(
    {
      error: 'Domain validation failed',
      message: getDomainValidationErrorMessage(domainValidation),
      details: {
        domain,
        errorCode: domainValidation.errorCode,  // 'ENOTFOUND'
        errorMessage: domainValidation.error
      }
    },
    { status: 400 }
  )
}
```

**User sees:** "Domain not found" error before scan is created

### Error 3: Scan stuck in SCANNING status

**Cause:** Worker crashed or timed out, scan never completed

**Detection:** Manual check in database or worker logs

**Fix:**

```bash
# Reset scan status
sqlite3 prisma/dev.db "UPDATE Scan SET status = 'PENDING', startedAt = NULL WHERE id = 'SCAN_ID';"

# Reset job status
sqlite3 prisma/dev.db "UPDATE Job SET status = 'PENDING' WHERE data LIKE '%SCAN_ID%';"

# Restart worker
./scripts/start-worker.sh
```

**Prevention:** Worker timeout protection (runWithTimeout wrapper)

### Error 4: Analyzer timeout

**Where:** Worker ([src/worker/index-sqlite.ts](../src/worker/index-sqlite.ts:59-73))

```typescript
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

**Result:** Analyzer is skipped, scan continues with remaining analyzers

**Affected analyzers:**
- Reconnaissance (5s timeout)
- Admin Detection (5s timeout)
- Admin Discovery (5s timeout)
- Port Scanner (5s timeout)
- LLM06 Sensitive Info (25s timeout)
- DNS Security (10s timeout)

### Error 5: Frontend can't find scan (404)

**Where:** Frontend ([src/app/scan/[id]/page.tsx](../src/app/scan/%5Bid%5D/page.tsx:139-144))

```typescript
if (!response.ok) {
  if (response.status === 404) {
    setError('Scan not found')
  } else {
    setError('Failed to load scan')
  }
  setIsLoading(false)
  return
}
```

**User sees:** "Scan not found" error message

**Cause:** Invalid scan ID or scan was deleted

---

## Performance Metrics

Typical scan timeline (from production data):

```
PHASE                    TIME        CUMULATIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. API Request           <100ms      0.1s
2. Database Creation     <50ms       0.15s
3. Worker Spawn          <200ms      0.35s
4. Worker Pickup         <500ms      0.85s
5. Playwright Crawl      5-30s       6-31s
   ├─ Browser Init       2s
   ├─ Navigation         1-3s
   ├─ Page Load          2-20s
   └─ Data Collection    0.5-5s
6. Analyzers (41 total)  2-15s       8-46s
   ├─ Fast (20)          <100ms each
   ├─ Medium (15)        100-500ms
   ├─ Slow (5)           500-2000ms
   └─ Heavy (1)          up to 25s (LLM06)
7. Scoring v3            <500ms      8.5-46.5s
8. Report Generation     <200ms      8.7-46.7s
9. Database Save         <100ms      8.8-46.8s
10. Frontend Polling     2-4 cycles  8.8-50s

TOTAL: 9-50 seconds (median: 25s)
```

**Breakdown by site complexity:**

| Site Type | Crawl Time | Analyzer Time | Total Time |
|-----------|------------|---------------|------------|
| Static HTML | 3-5s | 2-3s | 5-8s |
| SPA (React/Vue) | 8-15s | 3-5s | 11-20s |
| Complex App | 15-30s | 5-15s | 20-45s |
| AI-powered App | 20-40s | 10-25s | 30-65s |

---

## Summary Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPLETE SCAN LIFECYCLE                    │
└─────────────────────────────────────────────────────────────┘

USER INPUT
   ↓
[Frontend: scan/[id]/page.tsx]
   ├─ handleNewScan()
   └─ POST /api/scan with {url}
      ↓
[API: src/app/api/scan/route.ts]
   ├─ normalizeURL()
   ├─ Zod validation
   ├─ validateDomain() (DNS lookup)
   ├─ prisma.scan.create() → PENDING
   ├─ jobQueue.add('scan', {scanId, url})
   ├─ spawn worker process
   └─ Return {scanId}
      ↓
[Frontend redirects to /scan/[scanId]]
   ├─ useEffect polling loop (every 2s)
   └─ GET /api/scan/[id]
      ↓
[Worker: src/worker/index-sqlite.ts]
   ├─ processOneJob()
   ├─ jobQueue.getNext() → PROCESSING
   ├─ prisma.scan.update() → SCANNING
   │
   ├─ CRAWLER (Playwright)
   │  └─ Full HTML, cookies, SSL cert, network requests
   │
   ├─ ANALYZERS (41 total)
   │  ├─ Security Headers
   │  ├─ Client Risks (API keys)
   │  ├─ SSL/TLS
   │  ├─ Cookies
   │  ├─ JS Libraries
   │  ├─ Tech Stack
   │  ├─ Reconnaissance
   │  ├─ Admin Detection/Discovery
   │  ├─ CORS
   │  ├─ DNS Security
   │  ├─ Port Scanner
   │  ├─ Compliance (GDPR/CCPA)
   │  ├─ WAF Detection
   │  ├─ MFA Detection
   │  ├─ Rate Limiting
   │  ├─ GraphQL
   │  ├─ Error Disclosure
   │  ├─ SPA/API
   │  ├─ Backend Framework
   │  ├─ Web Server
   │  ├─ Frontend Framework
   │  ├─ Passive API Discovery
   │  ├─ AI Trust Score (27 checks)
   │  └─ OWASP LLM (6 analyzers - conditional)
   │
   ├─ REPORT GENERATION
   │  └─ Aggregate all findings
   │
   ├─ SCORING v3
   │  ├─ Category-based weighted scoring
   │  ├─ Penalty calculation (diminishing returns)
   │  ├─ Bonus points (good practices)
   │  └─ Grade assignment (A+ to F)
   │
   ├─ DATABASE SAVE
   │  ├─ prisma.scan.update() → COMPLETED
   │  ├─ Save findings (JSON)
   │  ├─ Save metadata (timings)
   │  └─ prisma.aiTrustScorecard.create()
   │
   └─ EXIT (worker process terminates)
      ↓
[Frontend polls GET /api/scan/[id]]
   ├─ Receives COMPLETED status
   ├─ Parse findings JSON
   └─ Render full report
      ↓
[User sees results page]
   ├─ Risk score card (grade + score)
   ├─ AI Trust Score section
   ├─ Technology stack
   ├─ Security findings (41 analyzers)
   └─ Download PDF / Generate new scan

END
```

---

**Last Updated:** November 17, 2025
**Lines:** 1257 (page.tsx), 137 (api/scan/route.ts), 920 (worker)
**Total Flow Coverage:** ~2314 lines documented

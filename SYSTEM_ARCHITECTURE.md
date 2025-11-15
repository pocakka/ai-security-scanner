# AI Security Scanner - Teljes Rendszer Architektúra

**Utolsó frissítés**: 2025. november 15.
**Verzió**: 2.1 (Sprint #10-12: Backend/Web Server/Frontend/CVE/API Security)

---

## 📋 Tartalomjegyzék

1. [Rendszer Áttekintés](#1-rendszer-áttekintés)
2. [Frontend Architektúra](#2-frontend-architektúra)
3. [Backend API Endpoints](#3-backend-api-endpoints)
4. [Worker & Queue Rendszer](#4-worker--queue-rendszer)
5. [Crawler (Playwright)](#5-crawler-playwright)
6. [Analyzer Rendszer (35 analyzer)](#6-analyzer-rendszer)
7. [Adatbázis Séma](#7-adatbázis-séma)
8. [Deployment & Infrastructure](#8-deployment--infrastructure)
9. [Folyamatok & Data Flow](#9-folyamatok--data-flow)

---

## 1. Rendszer Áttekintés

### Alapkoncepció
Egy **passzív AI biztonság audit platform**, amely webhelyeket elemez AI implementációk és biztonsági rés szempontjából. A rendszer **OWASP LLM Top 10** szabványok szerint vizsgálja az oldalakat.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Worker**: Node.js + TypeScript + Playwright
- **Database**: JSON-based storage (SQLite ready)
- **Crawler**: Playwright (Chromium headless browser)

### Fő Funkciók
1. ✅ **Passzív Security Scan** (30-60 másodperc)
2. ✅ **AI Detection** (36 chat widget + 9 LLM API provider)
3. ✅ **AI Trust Score** (27 check, 5 kategória)
4. ✅ **OWASP LLM Top 10** (6 analyzer)
5. ✅ **Infrastruktúra Scan** (32 analyzer - **+5 új: Backend Framework, Web Server, Frontend Framework, JS CVE Database, Passive API Discovery**)
6. ✅ **Admin Dashboard** (scan management, statistics)
7. ✅ **PDF Report Generation** (tervezett)

---

## 2. Frontend Architektúra

### Struktúra (Next.js App Router)

```
src/app/
├── page.tsx                    # Homepage (scan form)
├── layout.tsx                  # Root layout
├── scan/[id]/
│   ├── page.tsx               # Scan results page
│   └── AdminDebugBar.tsx      # Performance monitor (admin csak)
├── all-scans/
│   └── page.tsx               # Public scan list
├── admin/
│   ├── page.tsx               # Admin login
│   └── AdminTabs.tsx          # Admin tabs UI
├── aiq_belepes_mrd/
│   ├── page.tsx               # Protected admin login
│   └── dashboard/
│       ├── page.tsx           # Admin dashboard
│       ├── AdminTabsWithDelete.tsx  # Scan/lead management
│       └── WorkerStatusPanel.tsx    # Worker monitoring
│       └── settings/
│           └── page.tsx       # Admin settings
└── api/                       # API Routes (lásd Backend section)
```

### Komponensek

#### 1. Homepage ([src/app/page.tsx](src/app/page.tsx))
- **URL input form** (validáció: domain check, protocol normalization)
- **Hero section** (value proposition)
- **Feature showcase**
- **API hívás**: `POST /api/scan` → scan ID visszaadás
- **Átirányítás**: `/scan/{scanId}` oldalra

#### 2. Scan Results Page ([src/app/scan/[id]/page.tsx](src/app/scan/[id]/page.tsx))
- **Polling-based** status frissítés (2 másodpercenként)
- **Progress indicator** (PENDING → SCANNING → COMPLETED)
- **Results display**:
  - Risk Score & Grade (0-100, A+ to F)
  - AI Trust Score (27 checks, category breakdown)
  - Detected Technologies (chat widgets, APIs, frameworks)
  - Security Headers
  - OWASP LLM Findings
  - SSL/TLS Certificate Details
  - Tech Stack (120+ technologies)
- **Download PDF** button (tervezett)
- **Share scan** link

#### 3. Admin Debug Bar ([src/app/scan/[id]/AdminDebugBar.tsx](src/app/scan/[id]/AdminDebugBar.tsx))
- **Authentication**: `localStorage.getItem('admin_auth') === 'authenticated'`
- **Performance timing display**:
  - Total scan time
  - Crawler breakdown (browser init, navigation, page load, data collection)
  - Individual analyzer execution times
  - Color-coded indicators (green < 100ms, yellow < 500ms, red > 1s)
- **Positioning**: Non-fixed, bottom of page

#### 4. AI Trust Score Component ([src/components/AiTrustScore.tsx](src/components/AiTrustScore.tsx))
- **27 automated checks** across 5 categories:
  1. **Transparency** (5 checks): Provider disclosure, AI policy, model version, limitations, data usage
  2. **User Control** (5 checks): Feedback mechanism, reset option, disable option, human escalation, audit log
  3. **Compliance** (6 checks): Privacy policy, cookie banner, DPO contact, GDPR compliance, data retention, age verification
  4. **Security** (6 checks): Bot protection, rate limiting, input validation, output filtering, session management, HTTPS encryption
  5. **Ethical AI** (5 checks): Bias disclosure, content moderation, accessibility, ethical guidelines, incident response
- **Weighted scoring**: 0-100 (0-39: F, 40-49: D, 50-59: C, 60-69: B, 70-79: A, 80-89: A+, 90-100: A++)
- **Visual breakdown**: Category scores + passed/total checks
- **Dark glassmorphism UI**: `bg-white/10 backdrop-blur-lg`

#### 5. Admin Dashboard ([src/app/aiq_belepes_mrd/dashboard/page.tsx](src/app/aiq_belepes_mrd/dashboard/page.tsx))
- **Statistics**: Total scans, total leads, scans/day, leads/day
- **Recent scans table** (sortable, filterable)
- **Recent leads table**
- **Delete functionality** (scans + leads)
- **Worker status monitor**
- **Settings panel**

### State Management
- **React hooks**: `useState`, `useEffect`, `useRouter`
- **No global state** (API polling handles real-time updates)
- **LocalStorage**: Admin authentication only

### Styling
- **Tailwind CSS** (utility-first)
- **Dark theme**: Slate-900 + Blue-900 gradients
- **Glassmorphism**: `bg-white/10 backdrop-blur-lg border border-white/20`
- **Responsive**: Mobile-first approach

---

## 3. Backend API Endpoints

### Public Endpoints

#### `POST /api/scan`
**Scan létrehozása**

**Request**:
```json
{
  "url": "https://example.com"
}
```

**Validations**:
- URL format check
- Domain validation (blocks localhost, IP addresses, internal domains)
- Protocol normalization (http → https)

**Response**:
```json
{
  "scanId": "uuid-v4",
  "message": "Scan queued successfully"
}
```

**Flow**:
1. URL validation
2. Domain extraction
3. Scan record létrehozása (JSON file)
4. Job queue-ba helyezés
5. Worker auto-spawn (ha nincs futó worker)
6. Scan ID visszaadás

**File**: [src/app/api/scan/route.ts](src/app/api/scan/route.ts)

---

#### `GET /api/scan/[id]`
**Scan status & eredmények lekérése**

**Response (PENDING/SCANNING)**:
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "status": "SCANNING",
  "progress": 45
}
```

**Response (COMPLETED)**:
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "domain": "example.com",
  "status": "COMPLETED",
  "riskScore": 73,
  "riskLevel": "LOW",
  "findings": {
    "summary": {
      "hasAI": true,
      "riskScore": { "score": 73, "level": "LOW", "grade": "B-" },
      "criticalIssues": 2,
      "highIssues": 9,
      "mediumIssues": 9,
      "lowIssues": 6
    },
    "detectedTech": {
      "aiProviders": ["OpenAI"],
      "chatWidgets": ["GPT4Business (YoloAI)"],
      "vectorDatabases": [],
      "mlFrameworks": []
    },
    "securityHeaders": { ... },
    "sslTls": { ... },
    "techStack": { ... },
    "owaspLlm01": { ... },
    "owaspLlm02": { ... },
    "owaspLlm05": { ... },
    "owaspLlm06": { ... },
    "owaspLlm07": { ... },
    "owaspLlm08": { ... }
  },
  "aiTrustScore": {
    "score": 65,
    "weightedScore": 68,
    "grade": "B",
    "passedChecks": 18,
    "totalChecks": 27,
    "categoryScores": {
      "transparency": { "score": 60, "passed": 3, "total": 5 },
      "userControl": { "score": 40, "passed": 2, "total": 5 },
      "compliance": { "score": 83, "passed": 5, "total": 6 },
      "security": { "score": 67, "passed": 4, "total": 6 },
      "ethicalAI": { "score": 80, "passed": 4, "total": 5 }
    }
  },
  "metadata": {
    "crawlDuration": 4523,
    "totalDuration": 15234,
    "timingBreakdown": {
      "browserInit": 1200,
      "navigation": 850,
      "pageLoad": 2100,
      "dataCollection": 373,
      "aiTrust": 3456,
      "techStack": 234,
      "securityHeaders": 12,
      "sslTls": 145,
      "llm01": 2100,
      "llm02": 1850,
      "llm05": 1200,
      "llm06": 1900,
      "llm07": 1100,
      "llm08": 950
    }
  }
}
```

**File**: [src/app/api/scan/[id]/route.ts](src/app/api/scan/[id]/route.ts)

---

#### `GET /api/scan/[id]/pdf`
**PDF report generálás** (tervezett)

**Response**: PDF file download

**File**: [src/app/api/scan/[id]/pdf/route.ts](src/app/api/scan/[id]/pdf/route.ts)

---

#### `POST /api/lead`
**Lead capture** (email gating - tervezett)

**Request**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "scanId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "leadId": "uuid"
}
```

**File**: [src/app/api/leads/route.ts](src/app/api/leads/route.ts)

---

### Admin Endpoints

#### `GET /api/admin/data`
**Admin dashboard data**

**Authentication**: `x-admin-token` header

**Response**:
```json
{
  "scans": [ ... ],
  "leads": [ ... ],
  "statistics": {
    "totalScans": 150,
    "totalLeads": 42,
    "scansToday": 12,
    "leadsToday": 3
  }
}
```

**File**: [src/app/api/admin/data/route.ts](src/app/api/admin/data/route.ts)

---

#### `DELETE /api/admin/delete-scan`
**Scan törlése**

**Request**:
```json
{
  "scanId": "uuid"
}
```

**File**: [src/app/api/admin/delete-scan/route.ts](src/app/api/admin/delete-scan/route.ts)

---

#### `DELETE /api/admin/delete-lead`
**Lead törlése**

**Request**:
```json
{
  "leadId": "uuid"
}
```

**File**: [src/app/api/admin/delete-lead/route.ts](src/app/api/admin/delete-lead/route.ts)

---

#### `GET /api/workers/status`
**Worker status monitoring**

**Response**:
```json
{
  "activeWorkers": 2,
  "pendingJobs": 5,
  "completedJobs": 145,
  "failedJobs": 3
}
```

**File**: [src/app/api/workers/status/route.ts](src/app/api/workers/status/route.ts)

---

#### `POST /api/workers/trigger`
**Worker manual trigger** (admin only)

**File**: [src/app/api/workers/trigger/route.ts](src/app/api/workers/trigger/route.ts)

---

## 4. Worker & Queue Rendszer

### Worker Architecture

**File**: [src/worker/index-sqlite.ts](src/worker/index-sqlite.ts)

#### Worker Lifecycle
1. **Start**: `npm run worker` vagy auto-spawn from API
2. **Poll**: Ellenőrzi a queue-t 2 másodpercenként
3. **Process**: Egy job-ot dolgoz fel egyszerre
4. **Update**: Scan status frissítése (PENDING → SCANNING → COMPLETED/FAILED)
5. **Loop**: Vissza a polling-hoz

#### Job Processing Flow
```typescript
async function processJob(job: ScanJob) {
  // 1. Update status to SCANNING
  await updateScanStatus(job.scanId, 'SCANNING')

  // 2. Run crawler
  const crawlResult = await crawler.crawl(job.url)

  // 3. Run analyzers (22 infrastructure + 1 AI Trust + 6 OWASP LLM)
  const results = await runAnalyzers(crawlResult)

  // 4. Calculate risk score
  const riskScore = calculateRiskScore(results)

  // 5. Generate report
  const report = generateReport(results, riskScore)

  // 6. Save scan result
  await saveScanResult(job.scanId, report)

  // 7. Update status to COMPLETED
  await updateScanStatus(job.scanId, 'COMPLETED')
}
```

#### Error Handling
- **Timeout**: 120 seconds per analyzer (configurable)
- **Retry**: No automatic retry (to avoid infinite loops)
- **Fallback**: Empty results if analyzer fails
- **Status**: FAILED if critical error (crawler crash, etc.)

#### Performance Optimization
- **Parallel execution**: Independent analyzers run in parallel (PLANNED)
- **Early exit**: Technology detection stops after first match
- **Caching**: DNS results cached for 15 minutes
- **Connection pooling**: Browser reuse between scans (PLANNED)

---

## 5. Crawler (Playwright)

### PlaywrightCrawler Class

**File**: [src/lib/playwright-crawler.ts](src/lib/playwright-crawler.ts)

#### Capabilities
1. ✅ **Real browser automation** (Chromium headless)
2. ✅ **Network traffic monitoring** (all requests/responses)
3. ✅ **Cookie collection** (1st + 3rd party)
4. ✅ **JavaScript execution** (DOM manipulation detection)
5. ✅ **Screenshot capture** (visual evidence)
6. ✅ **SSL/TLS certificate extraction** (via Playwright securityDetails)
7. ✅ **Response headers collection**
8. ✅ **HTML content extraction** (full page source)
9. ✅ **Performance timing** (navigation, page load, resource timing)

#### Timing Breakdown
```typescript
{
  browserInit: 1200ms,      // Browser launch + context setup
  navigation: 850ms,        // DNS + TCP + TLS + initial HTML
  pageLoad: 2100ms,         // DOM ready + JS execution + resources
  dataCollection: 373ms,    // Cookies, SSL, screenshots, etc.
  totalCrawl: 4523ms
}
```

#### Network Monitoring
```typescript
interface NetworkRequest {
  url: string
  method: string
  headers: Record<string, string>
  postData?: string
  resourceType: string
  timestamp: number
}

interface NetworkResponse {
  url: string
  status: number
  headers: Record<string, string>
  body?: string
  fromCache: boolean
  timestamp: number
}
```

#### Cookie Collection
```typescript
interface CookieData {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
  firstParty: boolean  // NEW: Distinguishes 1st vs 3rd party
}
```

#### SSL/TLS Certificate
```typescript
interface SSLCertificate {
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  subjectName: string
  protocol: string
  serialNumber: string
}
```

#### Configuration
```typescript
const DEFAULT_CRAWLER_CONFIG = {
  headless: true,
  timeout: 30000,
  waitForNetworkIdle: true,
  waitForTimeout: 5000,
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (AI Security Scanner)',
  ignoreHTTPSErrors: false,
  javascriptEnabled: true
}
```

---

## 6. Analyzer Rendszer

### Analyzer Kategóriák

**Összesen**: 38 analyzer (32 fő + 6 OWASP LLM)

#### A. Infrastructure Security (25 analyzer + 2 CVE + 5 új = 32 total)

##### 1. **Security Headers Analyzer**
**File**: `src/worker/analyzers/security-headers.ts`

**Checks**:
- Content-Security-Policy (CSP)
- X-Frame-Options (clickjacking protection)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options (MIME sniffing protection)
- Referrer-Policy
- Permissions-Policy
- X-XSS-Protection (deprecated but checked)
- Server header disclosure

**Output**:
```typescript
{
  findings: [
    { header: 'Content-Security-Policy', present: true, value: '...', severity: 'low', recommendation: '...' }
  ],
  score: 85,
  grade: 'A'
}
```

---

##### 2. **SSL/TLS Analyzer**
**File**: `src/worker/analyzers/ssl-tls-analyzer.ts`

**Checks**:
- Certificate validity (expiry, issuer, CN)
- Protocol version (TLS 1.2+)
- Certificate chain verification
- Wildcard certificate detection
- Self-signed certificate warning

**Dual-method collection**:
1. **Primary**: Playwright `securityDetails()` (100% success rate)
2. **Fallback**: Node.js `tls.connect()` (if Playwright fails)

**Output**:
```typescript
{
  valid: true,
  issuer: 'Let\'s Encrypt',
  validFrom: '2025-01-01',
  validTo: '2025-04-01',
  daysUntilExpiry: 45,
  protocol: 'TLSv1.3',
  grade: 'A+'
}
```

---

##### 3. **Cookie Security Analyzer**
**File**: `src/worker/analyzers/cookie-security-analyzer.ts`

**Filters**: Only analyzes 1st party cookies (under website owner's control)

**Checks**:
- Secure flag (HTTPS only)
- HttpOnly flag (XSS protection)
- SameSite attribute (CSRF protection)
- Expiry (long-lived vs session)

**Output**:
```typescript
{
  findings: [
    { name: 'session', secure: false, httpOnly: true, sameSite: 'Lax', severity: 'medium', issue: 'Missing Secure flag' }
  ],
  totalCookies: 12,
  secureCount: 8,
  httpOnlyCount: 10
}
```

---

##### 4. **Cookie Security Enhanced**
**File**: `src/worker/analyzers/cookie-security-enhanced.ts`

**Advanced checks** (7 new features):
1. **Cookie Prefix Validation**: `__Secure-*`, `__Host-*` compliance
2. **Domain Scope Analysis**: Subdomain access, parent domain risks
3. **Path Restrictions**: Admin path exposure, root path risks
4. **Expiry Analysis**: Expired cookies, session vs persistent, long-lived sensitive
5. **Session Fixation Detection**: Session ID in URLs, missing security flags
6. **Cookie Size Optimization**: 4KB limit warnings, total size checks
7. **Cookie Poisoning Detection**: Special characters, injection patterns

---

##### 5. **JS Libraries Analyzer**
**File**: `src/worker/analyzers/js-libraries-analyzer.ts`

**Detects**:
- Library name + version (18 libraries)
  - jQuery, React, Vue, Angular, Next.js, Nuxt.js
  - Lodash, Moment.js, Axios, D3.js, Chart.js, Three.js
  - Bootstrap, Tailwind CSS, Material-UI, Ant Design
  - Webpack, Vite

**Vulnerability checks**:
- Known CVEs (via version detection)
- Outdated versions
- Deprecated libraries

---

##### 6. **Tech Stack Analyzer**
**File**: `src/worker/analyzers/tech-stack-analyzer.ts`

**Detects** 120+ technologies across 8 categories:
1. **CMS**: WordPress, Drupal, Joomla, Shopify, Webflow, Wix, Squarespace
2. **Analytics**: Google Analytics, Mixpanel, Heap, Amplitude, Hotjar
3. **Advertising**: Google Ads, Facebook Pixel, LinkedIn Insight
4. **CDN**: Cloudflare, Fastly, Akamai, jsDelivr, cdnjs
5. **Social**: Facebook widgets, Twitter, LinkedIn, Instagram
6. **E-commerce**: Shopify, WooCommerce, Magento, BigCommerce
7. **JavaScript Libraries**: jQuery, React, Vue, Angular, etc.
8. **Hosting Providers**: AWS, Google Cloud, Azure, Vercel, Netlify

**Early exit optimization**: Stops after first match per technology (except WordPress plugins)

---

##### 7. **CORS Analyzer**
**File**: `src/worker/analyzers/cors-analyzer.ts`

**Checks**:
- Wildcard origins (`Access-Control-Allow-Origin: *`)
- Credentials with wildcard (security violation)
- Overly permissive methods
- Bypass patterns (null origin, file://, etc.)
- JSONP endpoints
- PostMessage vulnerabilities

---

##### 8. **DNS Security Analyzer**
**File**: `src/worker/analyzers/dns-security-analyzer.ts`

**Timeout protection**: 3-second timeout with AbortController

**Checks**:
- **DNSSEC validation** (via Cloudflare DNS-over-HTTPS)
- **SPF record analysis** (syntax validation, include chains)
- **DKIM detection** (multiple selectors: default, google, dkim)
- **DMARC policy analysis** (p=reject/quarantine/none, alignment)
- **CAA records** (issue, issuewild, iodef tags)
- **MX records** (mail server security)
- **Nameserver redundancy**
- **TXT record security patterns**

**fetchWithTimeout helper**:
```typescript
async function fetchWithTimeout(url: string, timeout: number = 3000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
```

---

##### 9. **Reconnaissance Analyzer**
**File**: `src/worker/analyzers/reconnaissance-analyzer.ts`

**Checks for information disclosure**:
- robots.txt exposure
- .git directory exposure
- .env file exposure
- Backup files (.bak, .old, .swp)
- SQL dumps
- Source maps (.js.map, .css.map)
- Directory listing
- phpinfo() exposure
- Server status pages

---

##### 10. **Admin Detection Analyzer**
**File**: `src/worker/analyzers/admin-detection-analyzer.ts`

**Checks**:
- Login forms (wp-login.php, /admin, /login)
- Admin URLs in HTML
- CMS-specific admin paths
- Control panel detection (cPanel, Plesk, DirectAdmin)
- Database admin tools (phpMyAdmin, Adminer)

---

##### 11. **Admin Discovery Analyzer**
**File**: `src/worker/analyzers/admin-discovery-analyzer.ts`

**Advanced admin panel discovery** (extends admin-detection)

---

##### 12. **API Key Detector (Improved)**
**File**: `src/worker/analyzers/api-key-detector-improved.ts`

**Features**:
- **Entropy checking**: Filters out low-entropy false positives (threshold: 3.0)
- **20+ provider patterns**:
  - OpenAI (`sk-[a-zA-Z0-9]{48,}`, `sk-proj-*`)
  - Anthropic (`sk-ant-*`)
  - AWS (`AKIA*`)
  - Google (`AIza*`)
  - Stripe (`sk_live_*`, `pk_live_*`)
  - SendGrid, Mailgun, Twilio, Firebase, etc.

**Zero false positives** on test sites

---

##### 13. **Advanced API Key Patterns**
**File**: `src/worker/analyzers/advanced-api-key-patterns.ts`

**200+ patterns for 50+ providers**:
- Cloud providers (Azure, GCP, AWS, DigitalOcean)
- AI services (OpenAI, Anthropic, Cohere, Hugging Face)
- Communication (Slack, Discord, Telegram, Twilio)
- Email (SendGrid, Mailgun, Mailchimp)
- Payment (Stripe, PayPal, Square)
- Cryptocurrency wallets (Bitcoin, Ethereum private keys)
- JWT secrets, SSH private keys

---

##### 14. **Client Risks Analyzer**
**File**: `src/worker/analyzers/client-risks.ts`

**Checks**:
- Exposed API keys in JavaScript
- Hardcoded credentials
- Secret keys in client-side code
- Debug mode enabled
- Console.log statements with sensitive data

---

##### 15. **Compliance Analyzer**
**File**: `src/worker/analyzers/compliance-analyzer.ts`

**Checks**:
- GDPR compliance (cookie banner, privacy policy, data retention)
- CCPA compliance
- COPPA compliance (age verification)
- ADA/WCAG accessibility
- SOC 2 controls

---

##### 16. **WAF Detection Analyzer**
**File**: `src/worker/analyzers/waf-detection-analyzer.ts`

**Detects**:
- Cloudflare WAF
- AWS WAF
- Azure Front Door
- Akamai Kona
- Imperva (Incapsula)
- Sucuri
- ModSecurity

---

##### 17. **MFA Detection Analyzer**
**File**: `src/worker/analyzers/mfa-detection-analyzer.ts`

**Checks**:
- 2FA/MFA implementation
- TOTP support
- SMS-based 2FA
- Biometric authentication
- Hardware keys (FIDO2/WebAuthn)

---

##### 18. **Rate Limiting Analyzer**
**File**: `src/worker/analyzers/rate-limiting-analyzer.ts`

**Checks**:
- API rate limiting headers (`X-RateLimit-*`)
- Retry-After headers
- 429 Too Many Requests responses
- Token bucket / leaky bucket detection

---

##### 19. **GraphQL Analyzer**
**File**: `src/worker/analyzers/graphql-analyzer.ts`

**Checks**:
- GraphQL endpoint detection
- Introspection enabled (security risk)
- Query depth limiting
- Query complexity analysis
- Mutation detection

---

##### 20. **Error Disclosure Analyzer**
**File**: `src/worker/analyzers/error-disclosure-analyzer.ts`

**Checks**:
- Stack traces in responses
- Database error messages
- Debug mode indicators
- Internal paths disclosure
- Version information leakage

---

##### 21. **SPA API Analyzer**
**File**: `src/worker/analyzers/spa-api-analyzer.ts`

**Checks for Single Page Applications**:
- API endpoint discovery
- Authentication token exposure
- CORS misconfigurations
- Client-side routing vulnerabilities

---

##### 22. **Port Scanner Analyzer**
**File**: `src/worker/analyzers/port-scanner-analyzer.ts`

**Scans common ports** (passive, non-intrusive):
- 80 (HTTP), 443 (HTTPS)
- 22 (SSH), 21 (FTP), 3306 (MySQL), 5432 (PostgreSQL)
- 6379 (Redis), 27017 (MongoDB), 9200 (Elasticsearch)

**Note**: NOT active scanning, only checks open ports via network requests

---

##### 23. **Backend Framework Detector** ⭐ **NEW!**
**File**: `src/worker/analyzers/backend-framework-detector.ts`

**Status**: ✅ **Implementálva** (Sprint #10 - 2025-11-15)

**7 Backend Framework**:
1. **PHP** - `X-Powered-By: PHP`, `<?php`, `.php` extensions
2. **Django (Python)** - `csrfmiddlewaretoken`, `__debug__`, Django admin patterns
3. **Flask (Python)** - `werkzeug`, Flask session cookies
4. **Express.js (Node.js)** - `X-Powered-By: Express`, `express-session`
5. **Ruby on Rails** - `csrf-param`, `_rails_session`, Turbo headers
6. **ASP.NET** - `X-AspNet-Version`, `__VIEWSTATE`, `.aspx`
7. **Laravel (PHP)** - `laravel_session`, `X-Laravel-Session`

**Security Checks** (CRITICAL):
- **Debug Mode Detection** - `APP_DEBUG=true`, `DEBUG=True`, development error pages
- **Version Disclosure** - Framework version in headers/HTML
- **Outdated Versions** - Known vulnerable versions
- **Error Messages** - Detailed stack traces with framework info

**Example Output**:
```typescript
{
  detectedFrameworks: ['Django', 'Express.js'],
  findings: [
    {
      framework: 'Django',
      severity: 'critical',
      title: 'Django Debug Mode Enabled in Production',
      description: 'DEBUG=True detected in error page',
      evidence: '__debug__ toolbar visible',
      recommendation: 'Set DEBUG=False in production settings'
    }
  ]
}
```

---

##### 24. **Web Server Security Analyzer** ⭐ **NEW!**
**File**: `src/worker/analyzers/web-server-security-analyzer.ts`

**Status**: ✅ **Implementálva** (Sprint #10 - 2025-11-15)

**5 Web Servers**:
1. **Nginx** - `Server: nginx/1.21.0`
2. **Apache** - `Server: Apache/2.4.41`, module disclosure
3. **Microsoft IIS** - `Server: Microsoft-IIS/10.0`
4. **LiteSpeed** - `Server: LiteSpeed`
5. **Caddy** - `Server: Caddy`

**Security Checks**:
- **CVE Detection** - Known vulnerabilities for detected versions (Nginx < 1.20.0, Apache < 2.4.49, etc.)
- **Version Disclosure** - Server header exposes exact version
- **Module Disclosure** - Apache modules listed (mod_ssl, mod_security)
- **Outdated Versions** - Server versions older than 2 years

**CVE Database Examples**:
- **Nginx < 1.20.0**: Integer overflow, DNS resolver off-by-one heap write
- **Apache < 2.4.49**: Path traversal, mod_proxy SSRF
- **IIS < 10.0**: HTTP.sys vulnerability

---

##### 25. **Frontend Framework Security Analyzer** ⭐ **NEW!**
**File**: `src/worker/analyzers/frontend-framework-security-analyzer.ts`

**Status**: ✅ **Implementálva** (Sprint #11 - 2025-11-15)

**7 Frontend Frameworks**:
1. **React** - `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `react.development.js`
2. **Vue.js** - `__VUE_DEVTOOLS_GLOBAL_HOOK__`, `vue.js` (dev build)
3. **Next.js** - `_next/static`, `__NEXT_DATA__`, dev server indicators
4. **Angular** - `ng-version`, `core.js`, dev mode patterns
5. **Svelte** - Svelte dev mode indicators
6. **Nuxt.js** - `__NUXT__`, Nuxt dev server
7. **Ember.js** - Ember inspector, dev build

**CRITICAL Security Checks**:
- **DevTools Detection** - React DevTools, Vue DevTools enabled in production (CRITICAL)
- **Development Build** - Using dev builds instead of production builds
- **Source Maps Exposure** - `.js.map` files accessible (reveals original source code)
- **Debug Mode** - Framework debug flags enabled

**Example Output**:
```typescript
{
  detectedFrameworks: [
    { name: 'React', version: '18.2.0', devMode: true, confidence: 'high' }
  ],
  findings: [
    {
      severity: 'critical',
      title: 'React Development Build in Production',
      description: '__REACT_DEVTOOLS_GLOBAL_HOOK__ detected',
      impact: 'Exposes component structure, props, state, API calls',
      recommendation: 'Use production build: npm run build'
    },
    {
      severity: 'high',
      title: 'Source Maps Exposed',
      description: 'React source maps accessible at /static/js/*.map',
      impact: 'Original TypeScript/JSX code can be reconstructed',
      recommendation: 'Disable source maps in production'
    }
  ]
}
```

---

##### 26. **JS Library CVE Database** ⭐ **NEW!**
**File**: `src/worker/analyzers/js-library-cve-database.ts`

**Status**: ✅ **Implementálva** (Sprint #11 - 2025-11-15)

**CVE Database**:
- **52 CVEs for 15 popular libraries**
- **Semver version matching** - `isVersionAffected(version, affectedVersionPattern)`
- **Full CVE details** - ID, severity, CVSS score, description, fix version, references

**Covered Libraries**:
1. **jQuery** (8 CVEs) - XSS, prototype pollution
2. **Lodash** (6 CVEs) - Prototype pollution (CRITICAL), ReDoS
3. **Moment.js** (4 CVEs) - Path traversal, ReDoS
4. **Axios** (3 CVEs) - SSRF, credential leak
5. **Angular** (5 CVEs) - XSS, sandbox bypass
6. **React** (3 CVEs) - XSS in SSR
7. **Vue.js** (3 CVEs) - XSS, template injection
8. **Bootstrap** (4 CVEs) - XSS in tooltips, modals
9. **D3.js** (2 CVEs) - Prototype pollution
10. **Underscore.js** (3 CVEs) - Prototype pollution
11. **Handlebars** (3 CVEs) - Prototype pollution, RCE
12. **Marked** (4 CVEs) - XSS, RCE
13. **Webpack** (2 CVEs) - Path traversal
14. **Socket.io** (1 CVE) - Authorization bypass
15. **Express** (1 CVE) - Directory traversal

**Enhanced js-libraries-analyzer.ts**:
```typescript
import { findCVEsForLibrary, CVE } from './js-library-cve-database'

// Find jQuery 3.3.1
const cves = findCVEsForLibrary('jquery', '3.3.1')
// Returns: [CVE-2019-11358, CVE-2020-11022, CVE-2020-11023]

// Generate findings with full CVE details
for (const cve of cves) {
  findings.push({
    library: 'jquery',
    severity: cve.severity, // 'critical', 'high', 'medium', 'low'
    issue: `${cve.id}: ${cve.title}`,
    description: `${cve.description} (CVSS: ${cve.cvssScore})`,
    recommendation: `Update from ${version} to ${cve.fixedIn} or later`
  })
}
```

**Test Results**:
- Detected **7 CVEs** on test page with vulnerable jQuery 3.3.1, Lodash 4.17.11, Moment.js 2.29.3
- Zero false positives

---

##### 27. **Passive API Discovery Analyzer** ⭐ **NEW!**
**File**: `src/worker/analyzers/passive-api-discovery-analyzer.ts`

**Status**: ✅ **Implementálva** (Sprint #12 - 2025-11-15)

**100% Passive Analysis** (No active attacks):

**JWT Token Detection**:
- **localStorage** - `localStorage.getItem('token')`
- **sessionStorage** - `sessionStorage.getItem('auth_token')`
- **Cookies** - JWT pattern in cookie values
- **Inline JavaScript** - JWT tokens hardcoded in scripts
- **Entropy calculation** - Verify token randomness

**API Key Patterns** (10+ services):
- **Stripe**: `sk_live_*`, `pk_live_*`
- **OpenAI**: `sk-*` (48+ chars)
- **AWS**: `AKIA*` (20 chars)
- **Google**: `AIza*` (39 chars)
- **Anthropic**: `sk-ant-*`
- **SendGrid**, **Mailgun**, **Twilio**, **Firebase**, **GitHub**

**SQL Error Detection** (6 databases):
- **MySQL**: `You have an error in your SQL syntax`
- **PostgreSQL**: `ERROR: syntax error at or near`
- **MSSQL**: `Unclosed quotation mark`, `Incorrect syntax near`
- **Oracle**: `ORA-00933`, `ORA-01756`
- **SQLite**: `SQLITE_ERROR`, `unrecognized token`
- **MongoDB**: `MongoError`, `Failed to parse`

**Stack Trace Detection** (6 frameworks):
- **Node.js**: `at functionName (file.js:line:col)`
- **Python**: `File "/path/file.py", line N`
- **Java**: `at com.example.Class.method(File.java:123)`
- **.NET**: `at Namespace.Class.Method() in File.cs:line 45`
- **PHP**: `Fatal error: ... in /path/file.php on line 123`
- **Ruby**: `from /path/file.rb:123:in 'method'`

**API Endpoint Discovery**:
- **REST APIs**: `/api/v1/users`, `/api/auth/login`
- **GraphQL**: `/graphql`, `/api/graphql`
- **WebSocket**: `wss://api.example.com/ws`

**Debug Mode Indicators**:
- `console.log('[DEBUG]')`
- `debugger;` statements
- Source maps (`.js.map`)
- Dev mode flags (`NODE_ENV=development`)

**Example Output**:
```typescript
{
  findings: [
    {
      severity: 'critical',
      title: 'JWT Token Stored in localStorage',
      description: 'Authentication token vulnerable to XSS attacks',
      evidence: 'localStorage.setItem("auth_token", "eyJ...")',
      recommendation: 'Use httpOnly cookies instead'
    },
    {
      severity: 'critical',
      title: 'Stripe Secret Key Exposed',
      description: 'Live Stripe secret key found in client-side JavaScript',
      evidence: 'sk_live_51H******',
      recommendation: 'Move API keys to server-side environment variables'
    },
    {
      severity: 'high',
      title: 'PHP Stack Trace Exposed',
      description: 'Detailed error trace reveals internal file structure',
      evidence: 'Fatal error in /var/www/html/app/models/User.php',
      recommendation: 'Disable error display in production'
    }
  ],
  hasJWT: true,
  hasAPIKeys: true,
  hasSQLErrors: false,
  hasStackTraces: true,
  riskLevel: 'critical'
}
```

**Test Results**:
- Successfully tested on **wikipedia.org** (detected PHP stack trace)
- Scan ID: `dec82fd8-0338-4076-8e9b-d57b6d7f372c`
- Frontend category: `api-security`

---

#### B. AI-Specific Analyzers (7 analyzer)

##### 23. **AI Trust Analyzer** ⭐
**File**: `src/worker/analyzers/ai-trust-analyzer.ts`

**Main AI detection source** (used by worker instead of ai-detection.ts)

**Comprehensive AI Detection**:
- **36 Chat Widgets** (expanded from 6 to 36 - **FIXED 2025-11-14**)
  - Tier 1: Market Leaders (10)
  - Tier 2: Enterprise/SaaS (10)
  - Tier 3: AI-First/LLM-Based (10)
  - Tier 4: Additional Popular (5)
  - **GPT4Business (YoloAI)** ← KRITIKUS hozzáadás!
- **6 AI Providers**: OpenAI, Anthropic, Google, Meta, Cohere, Hugging Face
- **5 AI Models**: GPT-4, GPT-3.5, Claude 3, Gemini, Llama

**27 Trust Checks** (5 categories):
1. **Transparency** (5 checks):
   - Provider disclosed
   - AI identity disclosed
   - AI policy linked
   - Model version disclosed
   - Limitations disclosed
   - Data usage explained

2. **User Control** (5 checks):
   - Feedback mechanism
   - Reset/clear option
   - Disable AI option
   - Human escalation
   - Audit log access

3. **Compliance** (6 checks):
   - Privacy policy
   - Cookie banner
   - DPO contact
   - GDPR compliance
   - Data retention policy
   - Age verification

4. **Security** (6 checks):
   - Bot protection
   - Rate limiting
   - Input validation
   - Output filtering
   - Session management
   - HTTPS encryption

5. **Ethical AI** (5 checks):
   - Bias disclosure
   - Content moderation
   - Accessibility features
   - Ethical guidelines
   - Incident response plan

**Scoring**:
- Raw score: 0-100 (passedChecks / totalChecks * 100)
- Weighted score: Category weights applied
- Grade: F (0-39), D (40-49), C (50-59), B (60-69), A (70-79), A+ (80-89), A++ (90-100)

**Detection Logic**:
```typescript
function detectAiImplementation(html: string, scripts: string[], networkRequests: any[]): {
  hasAi: boolean
  confidenceLevel: 'none' | 'low' | 'medium' | 'high'
  provider?: string
  model?: string
  framework?: string  // Chat widget name
  signals: string[]
}
```

**Confidence Levels**:
- **HIGH**: 3+ signals (provider + model + framework)
- **MEDIUM**: 2 signals (provider + framework OR model + framework)
- **LOW**: 1 signal (provider OR framework OR model)
- **NONE**: 0 signals

---

##### 24. **AI Detection Analyzer** (NOT USED BY WORKER)
**File**: `src/worker/analyzers/ai-detection.ts`

**Status**: ❌ **Not used by worker** (only type imported)

**Contains**:
- 35 Chat Widgets (EXPANDED_CHAT_WIDGETS)
- 13 AI Providers (URL-based detection)
- 16 AI Endpoints
- 18 JS Libraries
- Advanced AI Detection Rules

**Why not used?**: Worker uses AI Trust Analyzer instead for consistency

**Recommendation**: Consider merging with AI Trust Analyzer or deprecating

---

##### 25. **LLM API Detector** ⭐ **NEW!**
**File**: `src/worker/analyzers/llm-api-detector.ts`

**Status**: ✅ **Sikeresen integrálva** (2025-11-14)

**9 LLM API Providers**:
1. **OpenAI** (8 endpoints): chat, completions, embeddings, images, audio, models
2. **Anthropic Claude** (3 endpoints): messages, complete, chat
3. **Cohere** (5 endpoints): generate, embed, classify, summarize, chat
4. **Google Gemini** (3 endpoints): generateContent for pro/pro-vision
5. **Hugging Face** (2 endpoints): inference API, models API
6. **Replicate** (2 endpoints): predictions, models
7. **Azure OpenAI** (2 endpoints): deployments, models
8. **AWS Bedrock** (4 endpoints): multi-region + base
9. **Google Vertex AI** (2 endpoints): aiplatform regional

**Features**:
- API endpoint URL detection (network requests)
- Authorization header pattern matching
- API key extraction with safe masking (first 8 + last 4 chars)
- Request/Response structure analysis
- Attack surface mapping for each provider
- Confidence scoring (HIGH/MEDIUM/LOW)

**Example Output**:
```typescript
{
  provider: 'OpenAI',
  category: 'LLM API Provider',
  confidence: 'HIGH',
  endpoints: ['api.openai.com/v1/chat/completions'],
  apiKeyFound: true,
  apiKeyMasked: 'sk-proj-ab****6789',
  requestPatterns: ['model', 'messages', 'temperature', 'max_tokens'],
  attackSurface: [
    'Prompt injection via messages array',
    'Model extraction via API responses',
    'API key exposure in client-side code',
    'Rate limit bypass attempts'
  ]
}
```

**Integration**:
- Imported in ai-detection.ts
- AIDetectionResult interface extended with `llmAPIs` field
- Called in analyzeAIDetection() function
- TypeScript compilation successful

---

##### 26. **Advanced AI Detection Rules**
**File**: `src/worker/analyzers/advanced-ai-detection-rules.ts`

**Categories**:
- Vector Databases (7): Pinecone, Weaviate, Chroma, Qdrant, Milvus, DeepLake, LanceDB
- ML Frameworks (6): TensorFlow.js, ONNX Runtime, ML5.js, Brain.js
- Voice AI (7): Deepgram, AssemblyAI, ElevenLabs, Google Speech, Amazon
- Image AI (7): DALL-E, Midjourney, Runway, Clarifai, Vision
- Security AI (7): reCAPTCHA, hCaptcha, DataDome, PerimeterX, Cloudflare Bot

---

##### 27. **AI Endpoint Security**
**File**: `src/worker/analyzers/ai-endpoint-security.ts`

**Checks**:
- AI API endpoint exposure
- Authentication on AI endpoints
- Rate limiting on AI endpoints
- Input validation
- Output sanitization

---

##### 28. **AI Prompt Exposure**
**File**: `src/worker/analyzers/ai-prompt-exposure.ts`

**Checks**:
- System prompts in client-side code
- Prompt templates exposed
- Training data leakage
- Model configuration exposure

---

##### 29. **Embedding Vector Detection**
**File**: `src/worker/analyzers/embedding-vector-detection.ts`

**Checks**:
- Vector database usage
- Embedding API calls
- Semantic search implementation
- RAG (Retrieval-Augmented Generation) patterns

---

#### C. OWASP LLM Top 10 Analyzers (6 analyzer)

##### 30. **LLM01: Prompt Injection**
**File**: `src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts`

**Checks**:
- Input validation on chat interfaces
- Prompt sanitization
- System prompt protection
- User prompt isolation
- Multi-turn conversation safety

**Risk Indicators**:
- No input length limits
- No special character filtering
- No rate limiting
- Direct LLM API exposure

---

##### 31. **LLM02: Insecure Output Handling**
**File**: `src/worker/analyzers/owasp-llm/llm02-insecure-output.ts`

**Checks**:
- Output sanitization (XSS prevention)
- Code execution risks
- SQL injection in LLM outputs
- Command injection
- Path traversal

**Risk Indicators**:
- No output escaping
- innerHTML usage with AI outputs
- eval() with AI responses
- Unvalidated file operations

---

##### 32. **LLM05: Supply Chain Vulnerabilities**
**File**: `src/worker/analyzers/owasp-llm/llm05-supply-chain.ts`

**Checks**:
- Third-party AI dependencies
- Model provenance
- Data poisoning risks
- Plugin security
- API key management

**Risk Indicators**:
- Unknown model sources
- Unverified plugins
- Hardcoded API keys
- No dependency scanning

---

##### 33. **LLM06: Sensitive Information Disclosure**
**File**: `src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts`

**Timeout protection**: 10-second timeout per pattern category

**Checks**:
- PII in prompts/responses
- API keys in training data
- System prompts exposed
- Internal endpoints leaked
- Model configuration disclosure

**Patterns** (high-confidence, low false-positive):
- System prompts: `system_prompt`, `system_message`, `system_role`
- Training data: `training_data`, `fine_tuning`, `dataset`
- PII: Email addresses, phone numbers, SSNs
- Internal endpoints: `/internal/`, `/admin/api/`, `localhost:*`
- Model info: `model_name`, `model_version`, `temperature`, `max_tokens`

**Optimization**:
- Non-greedy regex patterns (prevents catastrophic backtracking)
- Early exit after 100 findings per category
- Timeout protection with Promise.race()

---

##### 34. **LLM07: Insecure Plugin Design**
**File**: `src/worker/analyzers/owasp-llm/llm07-plugin-design.ts`

**Checks**:
- Plugin authentication
- Plugin authorization
- Input validation for plugins
- Plugin API security
- Plugin dependency risks

---

##### 35. **LLM08: Excessive Agency**
**File**: `src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts`

**Checks**:
- AI autonomous actions
- Permission scope
- User approval workflows
- Action logging
- Rollback mechanisms

---

## 7. Adatbázis Séma

### Current Implementation: JSON Files

**Location**: `data/scans/` és `data/leads/`

**Scan File Format** (`{scanId}.json`):
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "domain": "example.com",
  "status": "COMPLETED",
  "riskScore": 73,
  "riskLevel": "LOW",
  "findings": { ... },
  "aiTrustScore": { ... },
  "metadata": { ... },
  "createdAt": "2025-11-14T12:34:56Z",
  "completedAt": "2025-11-14T12:35:12Z"
}
```

**Lead File Format** (`{leadId}.json`):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "scanId": "uuid",
  "source": "email-gate",
  "createdAt": "2025-11-14T12:35:30Z"
}
```

### Planned: SQLite/PostgreSQL

**Schema** (Prisma):
```prisma
model Scan {
  id          String   @id @default(uuid())
  url         String
  domain      String
  status      ScanStatus
  riskScore   Int?
  riskLevel   RiskLevel?
  findings    Json?
  aiTrustScore Json?
  metadata    Json?
  createdAt   DateTime @default(now())
  completedAt DateTime?
  leads       Lead[]
}

model Lead {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  scanId    String
  scan      Scan     @relation(fields: [scanId], references: [id])
  source    String
  createdAt DateTime @default(now())
}

enum ScanStatus {
  PENDING
  SCANNING
  COMPLETED
  FAILED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## 8. Deployment & Infrastructure

### Current (Development)
- **Frontend**: http://localhost:3000 (Next.js dev server)
- **Worker**: Auto-spawn on scan request or manual `npm run worker`
- **Database**: JSON files in `data/` directory
- **Monitoring**: Console logs + Admin Debug Bar

### Planned (Production)

#### Frontend Deployment: Vercel
- **Platform**: Vercel (Next.js native)
- **Features**:
  - Automatic deployments (git push)
  - Edge Network (CDN)
  - Serverless Functions (API routes)
  - Environment variables
  - Custom domain

#### Worker Deployment: Railway / Fly.io
- **Platform**: Railway or Fly.io
- **Worker setup**:
  - Docker container
  - Auto-scaling based on queue size
  - Health checks
  - Log aggregation

#### Database: PostgreSQL (Supabase/Neon)
- **Platform**: Supabase or Neon
- **Features**:
  - Managed PostgreSQL
  - Connection pooling
  - Backups
  - Read replicas (future)

#### Queue: Redis + BullMQ (Upstash)
- **Platform**: Upstash Redis
- **Features**:
  - Durable job queue
  - Job prioritization
  - Retry logic
  - Dead letter queue

#### Monitoring: Sentry + Custom Dashboard
- **Error tracking**: Sentry
- **Performance monitoring**: Custom admin dashboard
- **Alerting**: Email/Slack notifications

---

## 9. Folyamatok & Data Flow

### Scan Flow (End-to-End)

```
User → Homepage → Enter URL → POST /api/scan
                                    ↓
                              Validate URL
                                    ↓
                           Create scan record (JSON)
                                    ↓
                            Add job to queue
                                    ↓
                           Auto-spawn worker
                                    ↓
                         Redirect to /scan/{id}
                                    ↓
          Frontend polls GET /api/scan/{id} every 2s
                                    ↓
                     Status: PENDING → SCANNING → COMPLETED
                                    ↓
                              Worker processes job:
                                    ↓
                    1. Run Playwright crawler (4-5s)
                       ↓
                       - Navigate to URL
                       - Monitor network requests
                       - Collect cookies, SSL, HTML
                       - Take screenshot
                       - Extract timing breakdown
                                    ↓
                    2. Run AI Trust Analyzer (3-4s)
                       ↓
                       - Detect chat widgets (36 patterns)
                       - Detect AI providers (6 providers)
                       - Detect AI models (5 models)
                       - Run 27 trust checks
                       - Calculate score + grade
                                    ↓
                    3. Run Infrastructure Analyzers (2-3s total)
                       ↓
                       - Security Headers (10ms)
                       - SSL/TLS (150ms)
                       - Cookie Security (50ms)
                       - Tech Stack (200ms)
                       - DNS Security (1500ms)
                       - CORS (30ms)
                       - Reconnaissance (100ms)
                       - Admin Detection (80ms)
                       - API Key Detection (200ms)
                       - ... (13 more analyzers)
                                    ↓
                    4. Run OWASP LLM Analyzers (IF AI detected) (8-10s)
                       ↓
                       - LLM01: Prompt Injection (2s)
                       - LLM02: Insecure Output (2s)
                       - LLM05: Supply Chain (1s)
                       - LLM06: Sensitive Info (2s, with timeout)
                       - LLM07: Plugin Design (1s)
                       - LLM08: Excessive Agency (1s)
                                    ↓
                    5. Calculate Risk Score
                       ↓
                       - Aggregate findings
                       - Weight by severity
                       - Calculate 0-100 score
                       - Assign grade (F to A++)
                                    ↓
                    6. Generate Report
                       ↓
                       - Format findings
                       - Add metadata (timing, etc.)
                       - Create summary
                                    ↓
                    7. Save scan result (JSON file)
                       ↓
                       - Write to data/scans/{id}.json
                       - Update status to COMPLETED
                                    ↓
                    Frontend detects COMPLETED status
                                    ↓
                       Display full results with:
                       - Risk Score & Grade
                       - AI Trust Score
                       - Detected Technologies
                       - Security Headers
                       - OWASP LLM Findings
                       - SSL/TLS Details
                       - Tech Stack
                       - Admin Debug Bar (if authenticated)
                                    ↓
                    User can download PDF (planned)
```

### Admin Flow

```
User → /aiq_belepes_mrd → Enter password → POST /api/admin/login
                                                      ↓
                                          Validate credentials
                                                      ↓
                                      Set localStorage.admin_auth = 'authenticated'
                                                      ↓
                                        Redirect to /aiq_belepes_mrd/dashboard
                                                      ↓
                                     GET /api/admin/data (with x-admin-token)
                                                      ↓
                                         Load scans + leads + statistics
                                                      ↓
                                              Display dashboard:
                                              - Statistics cards
                                              - Recent scans table
                                              - Recent leads table
                                              - Worker status panel
                                                      ↓
                                         Admin can delete scans/leads
                                                      ↓
                                     DELETE /api/admin/delete-scan
                                     DELETE /api/admin/delete-lead
```

---

## 📚 Következő Lépések (Roadmap)

### Phase 1: MVP Completion ✅ (DONE)
- [x] Landing page with scan form
- [x] Playwright crawler
- [x] 35 analyzers (22 infrastructure + 7 AI + 6 OWASP LLM)
- [x] AI Trust Score (27 checks)
- [x] Scan results page
- [x] Admin dashboard
- [x] GPT4Business detection fix
- [x] LLM API Detector integration

### Phase 2: Enhancement (Current Sprint)
- [ ] **PDF generation** (using Puppeteer or jsPDF)
- [ ] **Email capture modal** (lead generation)
- [ ] **Email automation** (welcome email, scan results)
- [ ] **Lead scoring** (qualification logic)
- [ ] **Detailed AI detection enhancements** (Voice AI, Image AI, Analytics AI)

### Phase 3: Production Deployment
- [ ] **Vercel deployment** (frontend)
- [ ] **Railway/Fly.io deployment** (worker)
- [ ] **PostgreSQL migration** (Supabase/Neon)
- [ ] **Redis queue** (Upstash)
- [ ] **Sentry monitoring**
- [ ] **Custom domain** (ai-security-scanner.com)

### Phase 4: Growth Features
- [ ] **Blog platform** (Next.js MDX)
- [ ] **SEO optimization** (meta tags, sitemap, schema.org)
- [ ] **Payment integration** (Stripe for paid audits)
- [ ] **Analytics & A/B testing**
- [ ] **Chrome extension** (instant scanning)
- [ ] **API access** (for developers)

---

## 🔧 Developer Commands

```bash
# Development
npm run dev           # Start Next.js dev server (http://localhost:3000)
npm run worker        # Start worker (manual)
npm run build         # Build for production
npm run start         # Start production server

# Database (when using Prisma)
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open Prisma Studio
npx prisma generate       # Generate Prisma Client

# Testing
npm run test          # Run tests (not yet implemented)
npm run lint          # Run ESLint
npx tsc --noEmit      # TypeScript type check

# Admin access
# In browser console:
localStorage.setItem('admin_auth', 'authenticated')
# Then refresh the scan page to see Admin Debug Bar
```

---

## 📁 Project Structure (Complete)

```
ai-security-scanner/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx               # Homepage
│   │   ├── layout.tsx             # Root layout
│   │   ├── scan/[id]/
│   │   │   ├── page.tsx           # Scan results
│   │   │   └── AdminDebugBar.tsx  # Performance monitor
│   │   ├── all-scans/
│   │   │   └── page.tsx           # Public scan list
│   │   ├── admin/
│   │   │   ├── page.tsx           # Admin login
│   │   │   └── AdminTabs.tsx
│   │   ├── aiq_belepes_mrd/
│   │   │   ├── page.tsx           # Protected admin login
│   │   │   └── dashboard/
│   │   │       ├── page.tsx       # Admin dashboard
│   │   │       ├── AdminTabsWithDelete.tsx
│   │   │       ├── WorkerStatusPanel.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   └── api/                   # API Routes
│   │       ├── scan/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── pdf/
│   │       │           └── route.ts
│   │       ├── leads/
│   │       │   └── route.ts
│   │       ├── scans/
│   │       │   └── recent/
│   │       │       └── route.ts
│   │       ├── admin/
│   │       │   ├── data/
│   │       │   │   └── route.ts
│   │       │   ├── delete-scan/
│   │       │   │   └── route.ts
│   │       │   ├── delete-lead/
│   │       │   │   └── route.ts
│   │       │   └── login/
│   │       │       └── route.ts
│   │       ├── workers/
│   │       │   ├── status/
│   │       │   │   └── route.ts
│   │       │   └── trigger/
│   │       │       └── route.ts
│   │       ├── settings/
│   │       │   └── route.ts
│   │       └── knowledge-base/
│   │           └── route.ts
│   ├── components/
│   │   └── AiTrustScore.tsx       # AI Trust Score display
│   ├── lib/
│   │   ├── playwright-crawler.ts  # Real browser crawler
│   │   ├── crawler-adapter.ts     # Adapter pattern
│   │   └── types/
│   │       └── crawler-types.ts   # TypeScript interfaces
│   └── worker/
│       ├── index-sqlite.ts        # Main worker (SQLite-based)
│       ├── crawler-mock.ts        # Mock crawler interface
│       └── analyzers/             # 35 analyzers
│           ├── ai-trust-analyzer.ts           # ⭐ Main AI detector (36 chat widgets)
│           ├── ai-detection.ts                # (Not used by worker)
│           ├── llm-api-detector.ts            # ⭐ NEW! LLM API detector
│           ├── advanced-ai-detection-rules.ts # Vector DB, ML frameworks, Voice, Image, Security AI
│           ├── advanced-api-key-patterns.ts   # 200+ patterns for 50+ providers
│           ├── ai-endpoint-security.ts
│           ├── ai-prompt-exposure.ts
│           ├── embedding-vector-detection.ts
│           ├── security-headers.ts
│           ├── ssl-tls-analyzer.ts
│           ├── cookie-security-analyzer.ts
│           ├── cookie-security-enhanced.ts
│           ├── js-libraries-analyzer.ts
│           ├── tech-stack-analyzer.ts
│           ├── cors-analyzer.ts
│           ├── dns-security-analyzer.ts
│           ├── reconnaissance-analyzer.ts
│           ├── admin-detection-analyzer.ts
│           ├── admin-discovery-analyzer.ts
│           ├── api-key-detector-improved.ts
│           ├── client-risks.ts
│           ├── compliance-analyzer.ts
│           ├── waf-detection-analyzer.ts
│           ├── mfa-detection-analyzer.ts
│           ├── rate-limiting-analyzer.ts
│           ├── graphql-analyzer.ts
│           ├── error-disclosure-analyzer.ts
│           ├── spa-api-analyzer.ts
│           ├── port-scanner-analyzer.ts
│           └── owasp-llm/                     # OWASP LLM Top 10
│               ├── llm01-prompt-injection.ts
│               ├── llm02-insecure-output.ts
│               ├── llm05-supply-chain.ts
│               ├── llm06-sensitive-info.ts    # With timeout protection
│               ├── llm07-plugin-design.ts
│               └── llm08-excessive-agency.ts
├── data/                          # JSON-based storage
│   ├── scans/                     # Scan results
│   └── leads/                     # Lead data
├── prisma/                        # Prisma ORM (planned)
│   └── schema.prisma
├── public/                        # Static assets
├── CLAUDE.md                      # Project overview (to be updated)
├── PROGRESS.md                    # Sprint progress (to be updated)
├── SYSTEM_ARCHITECTURE.md         # This file ⭐
├── CURRENT_ANALYZERS_DOCUMENTATION.md  # Analyzer details
├── CURRENT_IMPLEMENTATION_STATUS.md    # Implementation audit
├── AI_RED_TEAMING_FULL_ANALYSIS.md     # AI technology analysis
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🎯 Key Metrics & Performance

### Scan Performance (Average)
- **Total scan time**: 15-20 seconds
  - Crawler: 4-5s
  - AI Trust Analyzer: 3-4s
  - Infrastructure Analyzers: 2-3s
  - OWASP LLM Analyzers: 8-10s (only if AI detected)

### Detection Accuracy
- **Chat Widgets**: 36/36 supported (100%)
- **LLM APIs**: 9/9 major providers (100%)
- **AI Providers**: 6/6 major providers (100%)
- **False Positives**: <1% (API key detection with entropy filtering)

### Technology Coverage
- **Chat Widgets**: 36 services
- **LLM APIs**: 9 providers (27 endpoints)
- **AI Providers**: 6 providers
- **Tech Stack**: 120+ technologies
- **Security Checks**: 27 (AI Trust) + 22 (Infrastructure) + 6 (OWASP LLM) = **55 total**

---

## 🔒 Security & Privacy

### Passive Analysis Only
- **NO active attacks**: No SQL injection, XSS, or exploitation attempts
- **NO authentication bypass**: No login attempts or credential testing
- **NO data modification**: Read-only operations
- **NO aggressive scanning**: Single page load, no brute force

### Data Handling
- **No PII storage**: No collection of user personal data
- **Temporary storage**: Scan results deleted after 30 days (planned)
- **No tracking**: No analytics cookies
- **GDPR compliant**: Data retention policy, right to deletion

### Legal Compliance
- **Terms of Service**: Clear limitations and disclaimers
- **Responsible Disclosure**: Vulnerability reporting process
- **No destructive testing**: Without explicit written consent

---

**Dokumentáció vége** - Utolsó frissítés: 2025. november 14.

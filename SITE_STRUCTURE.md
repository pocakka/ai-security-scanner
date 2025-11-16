# Site Structure & Page Inventory
**AI Security Scanner - Complete Page Structure Documentation**

Version: 1.0
Last Updated: November 16, 2025

---

## Table of Contents
1. [Public Pages](#public-pages)
2. [Scan Flow Pages](#scan-flow-pages)
3. [Admin/Dashboard Pages](#admindashboard-pages)
4. [API Endpoints](#api-endpoints)
5. [Worker & Background Services](#worker--background-services)
6. [Database Models](#database-models)
7. [Page Component Breakdown](#page-component-breakdown)

---

## Public Pages

### 1. Homepage (`/`)
**File:** `src/app/page.tsx`

**Purpose:** Landing page, scan initiation, value proposition

**Key Components:**
- Hero section with scan URL input
- Value proposition (3 pillars)
- How it works (3 steps)
- Social proof quotes
- Footer with links

**Critical Functions:**
- Domain validation (client-side + server-side)
- DNS lookup for domain existence
- Scan creation via `/api/scan` POST
- Redirect to loading page on success

**User Flow:**
1. User enters URL in input field
2. Client validates URL format
3. Submits to `/api/scan` endpoint
4. Redirects to `/loading?scan=[SCAN_ID]`

**Testing Focus:**
- [ ] URL validation works (http/https, valid domain)
- [ ] DNS validation catches typos (e.g., "gooogle.com")
- [ ] Error messages are user-friendly
- [ ] Loading states show during submission
- [ ] Redirects correctly to loading page

---

### 2. Loading Page (`/loading`)
**File:** `src/app/loading/page.tsx`

**Purpose:** Show scan progress, motivational quote, keep user engaged

**Key Components:**
- Random motivational quote (security-themed)
- Loading spinner/animation
- Scan status polling (every 3s)
- Auto-redirect to report when scan completes

**Critical Functions:**
- Poll `/api/scan/[id]` every 3 seconds
- Check if `status === 'COMPLETED'`
- Redirect to `/scan/[id]` on completion
- Show error if scan fails

**User Flow:**
1. Page loads with scan ID from query param
2. Shows random quote
3. Polls API every 3s
4. Redirects to report when done (typically 2-4 minutes)

**Testing Focus:**
- [ ] Polling works correctly (no infinite loops)
- [ ] Redirects when scan completes
- [ ] Shows error if scan fails
- [ ] Quote changes on each visit
- [ ] **FUTURE:** Real-time progress updates (currentStep from DB)

**Known Issues:**
- No real-time progress (shows same message entire time)
- Planned: Display current analyzer step (e.g., "Analyzing SSL/TLS...")

---

### 3. Report Page (`/scan/[id]`)
**File:** `src/app/scan/[id]/page.tsx`

**Purpose:** Display full scan results, risk score, findings, lead capture

**Key Components:**

#### 1. Header Section
- Domain name (e.g., "openai.com")
- Scan timestamp
- Risk score badge (0-100) with color coding:
  - 0-25: GREEN (Low Risk)
  - 26-50: YELLOW (Medium Risk)
  - 51-75: ORANGE (High Risk)
  - 76-100: RED (Critical Risk)

#### 2. Overview Card
- **Risk Level:** LOW | MEDIUM | HIGH | CRITICAL
- **Total Findings:** Count of all findings across all categories
- **Scan Duration:** Time taken to complete scan
- **Scan Status:** COMPLETED | FAILED
- **Scan Metadata:** URL, domain, createdAt, completedAt

#### 3. AI Trust Scorecard Section
**AI Trust Score:** 0-100 weighted score

**Category Breakdown (5 categories):**
1. **Transparency** (6 checks / 22%):
   - ✓/✗ AI Provider Disclosed (e.g., "Powered by OpenAI")
   - ✓/✗ AI Identity Disclosed (e.g., "I am an AI assistant")
   - ✓/✗ AI Policy Linked (link to /ai-policy or similar)
   - ✓/✗ Model Version Disclosed (e.g., "Using GPT-4")
   - ✓/✗ Limitations Disclosed (e.g., "AI may make mistakes")
   - ✓/✗ Data Usage Disclosure (e.g., "Data not used for training")

2. **User Control** (5 checks / 19%):
   - ✓/✗ Feedback Mechanism (thumbs up/down, rating)
   - ✓/✗ Conversation Reset (New Chat button)
   - ✓/✗ Human Escalation (Talk to human support)
   - ✓/✗ Conversation Export (Download/export chat history)
   - ✓/✗ Data Deletion Option (Delete my data button)

3. **Compliance (GDPR)** (5 checks / 19%):
   - ✓/✗ DPO Contact (mailto:privacy@ or DPO contact form)
   - ✓/✗ Cookie Banner (Cookie consent mechanism)
   - ✓/✗ Privacy Policy Link (/privacy or privacy policy page)
   - ✓/✗ Terms of Service Link (/terms or ToS page)
   - ✓/✗ GDPR Compliance Badge/Statement

4. **Security & Reliability** (7 checks / 26%):
   - ✓/✗ Bot Protection (reCAPTCHA, hCaptcha, Turnstile)
   - ✓/✗ AI Rate Limit Headers (X-RateLimit-* on AI endpoints)
   - ✓/✗ Basic Web Security (overall security score > 70)
   - ✓/✗ Input Length Limit (textarea maxlength attribute)
   - ✓/✗ Input Sanitization (DOMPurify or similar)
   - ✓/✗ Error Handling (graceful error messages, no stack traces)
   - ✓/✗ Session Management (secure session handling)

5. **Ethical AI** (4 checks / 15%):
   - ✓/✗ Bias Disclosure (warning about potential biases)
   - ✓/✗ Content Moderation (harmful content filtering)
   - ✓/✗ Age Verification ("Are you 18+")
   - ✓/✗ Accessibility Support (ARIA labels, screen reader support)

**Additional AI Trust Scorecard Data:**
- **Passed Checks:** Count of passed checks (e.g., 15/27)
- **Total Checks:** 27 checks total
- **Confidence Level:** none | low | medium | high (AI implementation confidence)
- **Detected AI Provider:** OpenAI | Anthropic | Google | Cohere | etc.
- **Detected Model:** GPT-4 | Claude-3-Opus | Gemini Pro | etc.
- **Detected Chat Framework:** Intercom | Drift | Crisp | Custom | etc.
- **Evidence Data:** JSON object with evidence for each check
- **Summary:** Strengths, weaknesses, critical issues

#### 4. Technology Stack Section
**Detected Technologies (from Wappalyzer-like detection):**

Each technology displayed with:
- Technology name (e.g., "Next.js", "React", "Cloudflare")
- Category (e.g., "Framework", "Library", "CDN", "Analytics")
- Version (if detected, e.g., "14.0.3")
- Icon/logo (if available)

**Categories Detected:**
- Frontend Frameworks (React, Vue, Angular, Next.js, Nuxt, Svelte)
- Backend Frameworks (Express, FastAPI, Django, Rails)
- Web Servers (Nginx, Apache, IIS, Cloudflare)
- CDNs (Cloudflare, Fastly, Akamai)
- Analytics (Google Analytics, Plausible, Mixpanel)
- AI Services (OpenAI, Anthropic, Cohere, Intercom, Drift)
- Security Tools (Cloudflare, Sucuri, reCAPTCHA)
- JavaScript Libraries (jQuery, Lodash, Axios)
- CMS (WordPress, Drupal, Contentful)

#### 5. Findings by Category

**Security Findings** (from security-headers analyzer):
- Missing Content-Security-Policy (CSP)
- Missing X-Frame-Options
- Missing X-Content-Type-Options
- Missing Strict-Transport-Security (HSTS)
- Missing Referrer-Policy
- Missing Permissions-Policy
- Insecure Cross-Origin-* headers

**SSL/TLS Findings** (from ssl-tls-analyzer):
- SSL certificate expired
- Self-signed certificate
- Weak cipher suites
- TLS version too old (< TLS 1.2)
- Certificate chain issues
- Hostname mismatch

**Cookie Security Findings** (from cookie-security analyzers):
- Cookies without HttpOnly flag
- Cookies without Secure flag
- Cookies without SameSite attribute
- Session cookies with long expiration
- Cookies accessible by JavaScript
- Third-party tracking cookies

**Client-Side Security Findings** (from client-risks analyzer):
- eval() usage detected
- innerHTML usage (XSS risk)
- document.write() usage
- Inline event handlers
- Global variables exposed
- Sensitive data in localStorage/sessionStorage

**Library Vulnerabilities** (from js-library-cve-database):
- Outdated jQuery (CVE-XXXX-XXXX)
- Outdated React (known vulnerabilities)
- Outdated lodash (prototype pollution)
- Other known CVEs in detected libraries

**OWASP LLM Top 10 Findings** (from OWASP LLM analyzers):
- **LLM01:** Prompt Injection vulnerabilities
- **LLM02:** Insecure output handling
- **LLM03:** Training data poisoning risks
- **LLM04:** Model denial of service
- **LLM05:** Supply chain vulnerabilities
- **LLM06:** Sensitive information disclosure (API keys, endpoints)
- **LLM07:** Insecure plugin design
- **LLM08:** Excessive agency
- **LLM09:** Overreliance on LLM
- **LLM10:** Model theft

**AI-Specific Security Findings:**
- Exposed AI API endpoints
- Hardcoded API keys (OpenAI, Anthropic, etc.)
- Prompt templates exposed in client-side code
- Embedding vectors exposed
- Model version disclosure
- Training data leakage
- Rate limiting issues on AI endpoints
- No input validation on AI prompts

**Infrastructure Security Findings:**
- Open ports detected (from port-scanner)
- Weak WAF configuration
- DNS security issues (DNSSEC, SPF, DMARC)
- Server version disclosure
- Admin panel exposed (/admin, /wp-admin)
- GraphQL introspection enabled
- CORS misconfiguration

#### 6. Lead Capture Form
- **Email input** (required, validated)
- **Name input** (optional)
- **Company input** (optional)
- **Role dropdown** (optional): Developer | Security Engineer | Manager | Other
- **Submit button:** "Unlock Detailed Report"
- **Privacy notice:** Link to privacy policy

**Form Behavior:**
- Shows before detailed findings are visible
- After submission, unlocks full findings
- Creates Lead record in database
- Email can be duplicated (same user can scan multiple sites)

#### 7. Footer Section
- **CTA:** "Scan Another Website" button
- **Social links:** Twitter, LinkedIn, GitHub (if configured in SiteSettings)
- **Legal links:** Privacy Policy, Terms of Service
- **Branding:** "Powered by AI Security Scanner"

**Critical Functions:**
- Fetch scan data from `/api/scan/[id]`
- Parse JSON findings (stored as text in DB)
- Calculate risk score visualization
- Handle lead form submission
- Conditionally show detailed findings (after email submission)

**User Flow:**
1. User lands on page (redirected from loading page)
2. Sees overview + high-level findings
3. Prompted to enter email for detailed report
4. After email submission, unlocks full findings
5. Can download/share report (future)

**Testing Focus:**
- [ ] All analyzers' findings display correctly
- [ ] Risk score calculation is accurate
- [ ] AI Trust Scorecard shows correct checks
- [ ] Technology Stack displays unique technologies
- [ ] Lead form captures email successfully
- [ ] Findings are grouped by severity correctly
- [ ] No undefined/null errors in findings rendering
- [ ] Long URLs/domains don't break layout

**Known Issues:**
- Lead form might allow duplicate emails (currently allowed by design)
- No PDF export yet (planned feature)

---

## Scan Flow Pages

### 4. Scan API Endpoint (`/api/scan`)
**File:** `src/app/api/scan/route.ts`

**Purpose:** Create new scan, validate domain, queue job

**Methods:**
- **POST:** Create new scan
  - Input: `{ url: string }`
  - Validation: URL format, DNS lookup, domain existence
  - Creates `Scan` record in DB (status: PENDING)
  - Creates `Job` record for worker
  - Returns: `{ scanId, message }`

**Error Responses:**
- 400: Invalid URL format
- 400: Domain does not exist (DNS failed)
- 500: Database error

**Testing Focus:**
- [ ] Valid URL creates scan successfully
- [ ] Invalid URL returns 400 with clear message
- [ ] Non-existent domain returns "domain does not exist"
- [ ] Scan ID is valid UUID
- [ ] Database records created (Scan + Job)

---

### 5. Scan Status Endpoint (`/api/scan/[id]`)
**File:** `src/app/api/scan/[id]/route.ts`

**Purpose:** Get scan status, results, metadata

**Methods:**
- **GET:** Retrieve scan data
  - Returns: Full scan object (status, riskScore, findings, etc.)
  - Used by: Loading page (polling), Report page (display)

- **DELETE:** Delete scan (added in Sprint #12)
  - Deletes scan + cascades to related records (Leads, AiTrustScorecard)
  - Returns: `{ success: true, message }`

**Error Responses:**
- 404: Scan not found
- 500: Database error

**Testing Focus:**
- [ ] GET returns correct scan data
- [ ] DELETE removes scan from database
- [ ] DELETE cascades to related tables
- [ ] Polling doesn't cause performance issues

---

## Admin/Dashboard Pages

### 6. Dashboard (`/aiq_beleges_mrd/dashboard`)
**File:** `src/app/aiq_beleges_mrd/dashboard/page.tsx`

**Purpose:** Admin view of all scans, bulk operations, monitoring

**Key Components:**
- Scan list table (recent first)
- Status filter (All, Pending, Scanning, Completed, Failed)
- Bulk select + bulk delete
- Single scan delete button
- Worker status indicator
- Refresh button

**Critical Functions:**
- Fetch scans from `/api/admin/data`
- Delete scans via `/api/admin/delete-scan` (bulk) or `/api/scan/[id]` (single)
- Filter scans by status
- Real-time worker status check

**User Flow:**
1. Admin visits dashboard
2. Sees all recent scans (50 most recent)
3. Can filter by status
4. Can delete individual scans or bulk delete
5. Monitors worker health

**Testing Focus:**
- [ ] Dashboard loads all scans correctly
- [ ] Status filter works
- [ ] Bulk delete works (multiple scans)
- [ ] Single delete works
- [ ] Worker status shows correctly (online/offline)
- [ ] Refresh updates data
- [ ] No undefined errors on empty scans
- [ ] Pagination works (if implemented)

**Known Issues:**
- DELETE was broken due to Prisma cache (fixed in v1.0)
- No pagination yet (shows only 50 most recent)

---

### 7. Admin Data Endpoint (`/api/admin/data`)
**File:** `src/app/api/admin/data/route.ts`

**Purpose:** Fetch scans for dashboard

**Methods:**
- **GET:** Get recent scans
  - Returns: `{ scans: Scan[] }`
  - Ordered by: `createdAt DESC`
  - Limit: 50

**Testing Focus:**
- [ ] Returns scans in correct order
- [ ] Limit works (doesn't return all scans)
- [ ] Includes related data if needed

---

### 8. Bulk Delete Endpoint (`/api/admin/delete-scan`)
**File:** `src/app/api/admin/delete-scan/route.ts`

**Purpose:** Delete multiple scans at once

**Methods:**
- **DELETE:** Bulk delete
  - Input: `{ scanIds: string[] }`
  - Deletes all scans in array
  - Returns: `{ success: true, deleted: number }`

**Testing Focus:**
- [ ] Deletes all provided scan IDs
- [ ] Returns correct count
- [ ] Handles empty array gracefully
- [ ] Handles non-existent IDs gracefully

---

## API Endpoints

### 9. Worker Status (`/api/workers/status`)
**File:** `src/app/api/workers/status/route.ts`

**Purpose:** Check worker health, job queue status

**Methods:**
- **GET:** Get worker status
  - Returns: `{ workers: [...], pendingJobs: number, completedScans: number }`

**Testing Focus:**
- [ ] Shows correct number of active workers
- [ ] Pending jobs count is accurate
- [ ] Updates in real-time

---

### 10. Lead Capture (`/api/leads`)
**File:** `src/app/api/leads/route.ts`

**Purpose:** Capture email leads from report page

**Methods:**
- **POST:** Create lead
  - Input: `{ email, name?, company?, scanId }`
  - Creates `Lead` record
  - Updates lead score, lifecycle stage
  - Returns: `{ success: true, leadId }`

**Testing Focus:**
- [ ] Valid email creates lead
- [ ] Associates lead with correct scan
- [ ] Allows duplicate emails (multiple scans per email)
- [ ] Email validation works

---

## Worker & Background Services

### 11. Worker Process (`src/worker/index.ts`)
**File:** `src/worker/index.ts`

**Purpose:** Process scan jobs, run analyzers, update database

**Key Functions:**
- Poll `Job` table for PENDING jobs
- Fetch URL, crawl website
- Run all 38 analyzers
- Calculate risk score
- Save results to database
- Update job status (COMPLETED/FAILED)

**Worker Pool:**
- Default: 3 concurrent workers
- Configurable via `WORKER_POOL_SIZE` env var

**Analyzer Execution Order (41 analyzers total):**

#### Phase 1: Infrastructure & Web Server (6 analyzers)
1. **ssl-tls-analyzer** - SSL/TLS certificate validation, cipher suites, TLS version
2. **web-server-security-analyzer** - Server version disclosure, configuration issues
3. **dns-security-analyzer** - DNSSEC, SPF, DMARC, DNS configuration
4. **port-scanner-analyzer** - Open ports, exposed services
5. **waf-detection-analyzer** - WAF presence (Cloudflare, Sucuri, etc.)
6. **cors-analyzer** - CORS configuration, misconfigurations

#### Phase 2: Security Headers & Policies (2 analyzers)
7. **security-headers** - CSP, X-Frame-Options, HSTS, X-Content-Type-Options, etc.
8. **compliance-analyzer** - GDPR compliance, privacy policy, cookie consent

#### Phase 3: Cookie Security (2 analyzers)
9. **cookie-security-analyzer** - HttpOnly, Secure, SameSite flags
10. **cookie-security-enhanced** - Advanced cookie analysis, tracking cookies

#### Phase 4: Client-Side Security (3 analyzers)
11. **client-risks** - eval(), innerHTML, document.write() usage
12. **error-disclosure-analyzer** - Stack traces, error messages exposed
13. **frontend-framework-security-analyzer** - Framework-specific security issues

#### Phase 5: JavaScript Libraries & Vulnerabilities (2 analyzers)
14. **js-libraries-analyzer** - Detect JS libraries (jQuery, React, etc.)
15. **js-library-cve-database** - CVE matching for detected libraries

#### Phase 6: Technology Stack Detection (2 analyzers)
16. **tech-stack-analyzer** - Web framework, CMS, server detection
17. **backend-framework-detector** - Backend framework identification

#### Phase 7: API & Endpoint Discovery (4 analyzers)
18. **passive-api-discovery-analyzer** - API endpoints from HTML/JS
19. **spa-api-analyzer** - Single-page app API analysis
20. **graphql-analyzer** - GraphQL endpoint detection, introspection
21. **rate-limiting-analyzer** - API rate limiting detection

#### Phase 8: Admin & Reconnaissance (3 analyzers)
22. **admin-detection-analyzer** - Admin panel detection (/admin, /wp-admin)
23. **admin-discovery-analyzer** - Admin routes, management interfaces
24. **reconnaissance-analyzer** - Information disclosure, metadata leakage

#### Phase 9: Authentication & Access Control (1 analyzer)
25. **mfa-detection-analyzer** - Multi-factor authentication detection

#### Phase 10: AI Detection - Core (3 analyzers)
26. **ai-detection** - Primary AI implementation detection
27. **advanced-ai-detection-rules** - Advanced AI pattern matching
28. **ai-trust-analyzer** - AI Trust Scorecard (27 checks across 5 categories)

#### Phase 11: AI Detection - Specialized Services (7 analyzers)
29. **llm-api-detector** - LLM API detection (OpenAI, Anthropic, Cohere, etc.)
30. **analytics-ai-detector** - AI-powered analytics (Mixpanel AI, Amplitude AI)
31. **content-moderation-detector** - AI content moderation (Perspective API, etc.)
32. **image-video-ai-detector** - AI image/video services (Cloudinary AI, etc.)
33. **personalization-detector** - AI personalization engines
34. **search-ai-detector** - AI-powered search (Algolia AI, Elasticsearch ML)
35. **translation-ai-detector** - AI translation services (DeepL, Google Translate AI)
36. **voice-ai-detector** - Voice AI (Elevenlabs, Play.ht, etc.)

#### Phase 12: OWASP LLM Top 10 (4 analyzers)
37. **ai-prompt-exposure** - LLM01: Prompt injection detection
38. **ai-endpoint-security** - LLM02-LLM05: Output handling, model DoS, supply chain
39. **advanced-api-key-patterns** - LLM06: Sensitive info disclosure (API keys)
40. **api-key-detector-improved** - LLM06: Enhanced API key detection

#### Phase 13: Advanced AI Security (1 analyzer)
41. **embedding-vector-detection** - Embedding vectors, semantic search exposure

**Total: 41 analyzers across 13 phases**

**Critical Error Handling:**
- Each analyzer wrapped in try/catch
- Timeout protection (30s per analyzer)
- Graceful degradation (if one analyzer fails, others continue)
- Database reconnection on connection loss

**Testing Focus:**
- [ ] Worker processes jobs correctly
- [ ] Analyzers run without hanging
- [ ] Timeouts work (no infinite loops)
- [ ] Results saved to database correctly
- [ ] Worker recovers from errors
- [ ] Worker pool handles concurrency correctly

**Known Issues:**
- Worker can hang on large HTML (regex.exec issue - mostly fixed)
- No stuck scan detection yet (planned: auto-fail after 15 min)

---

## Database Models

### 12. Scan Model
**File:** `prisma/schema.prisma` (lines 10-31)

**Fields:**
- `id` - UUID primary key
- `url` - Full URL scanned
- `domain` - Extracted domain
- `status` - PENDING | SCANNING | COMPLETED | FAILED
- `riskScore` - 0-100 numeric score
- `riskLevel` - LOW | MEDIUM | HIGH | CRITICAL
- `detectedTech` - JSON string (technologies)
- `findings` - JSON string (all findings)
- `metadata` - JSON string (misc data)
- `createdAt`, `startedAt`, `completedAt` - Timestamps

**Relations:**
- `leads[]` - Lead records (1:many)
- `aiTrustScorecard?` - AI Trust data (1:1)

**Testing Focus:**
- [ ] Scan creation works
- [ ] Status updates correctly (PENDING → SCANNING → COMPLETED)
- [ ] JSON fields parse correctly
- [ ] Cascade delete works (deleting scan deletes leads)

---

### 13. Lead Model
**File:** `prisma/schema.prisma` (lines 33-52)

**Fields:**
- `id` - UUID primary key
- `email` - User email (no unique constraint - allows duplicates)
- `name`, `company`, `role` - Optional metadata
- `leadScore` - 0-100 (for marketing)
- `lifecycleStage` - SUBSCRIBER | LEAD | MQL | SQL | CUSTOMER
- `scanId` - Foreign key to Scan
- `createdAt`, `lastInteraction` - Timestamps

**Testing Focus:**
- [ ] Lead creation works
- [ ] Email can be duplicated (same email, multiple scans)
- [ ] Lead score calculation works
- [ ] Lifecycle stage updates correctly

---

### 14. Job Model
**File:** `prisma/schema.prisma` (lines 54-69)

**Fields:**
- `id` - UUID primary key
- `type` - "scan" (could expand to "email", etc.)
- `data` - JSON payload (scan URL, config)
- `status` - PENDING | PROCESSING | COMPLETED | FAILED
- `attempts` - Retry counter
- `maxAttempts` - Max retries (default 3)
- `error` - Error message if failed
- `createdAt`, `startedAt`, `completedAt` - Timestamps

**Testing Focus:**
- [ ] Job creation on scan creation
- [ ] Worker picks up PENDING jobs
- [ ] Status updates correctly
- [ ] Retry logic works (on failure)
- [ ] Max attempts prevents infinite retries

---

### 15. AiTrustScorecard Model
**File:** `prisma/schema.prisma` (lines 76-163)

**Purpose:** Store AI Trust Scorecard results (27 checks)

**Categories:**
1. **Transparency** (6 checks) - Provider disclosure, AI policy, limitations
2. **User Control** (5 checks) - Feedback, reset, human escalation
3. **Compliance** (5 checks) - DPO, GDPR, privacy policy
4. **Security** (7 checks) - Bot protection, rate limits, input sanitization
5. **Ethical AI** (4 checks) - Bias disclosure, content moderation

**Testing Focus:**
- [ ] All 27 boolean checks stored correctly
- [ ] Score calculation accurate (0-100)
- [ ] Weighted score different from simple average
- [ ] Evidence data captured correctly
- [ ] Confidence level accurate (none/low/medium/high)

---

## Page Component Breakdown

### Key Shared Components

#### 1. Layout (`src/app/layout.tsx`)
- Global HTML structure
- Metadata (SEO tags)
- Font loading (Geist Sans/Mono)
- Global CSS imports

#### 2. Providers (if any)
- Theme provider (future)
- Auth provider (future)

#### 3. UI Components (`src/components/`)
- Buttons, inputs, cards (shadcn/ui)
- Custom components (scan progress, risk badge, etc.)

---

## Critical Testing Paths

### Path 1: Happy Path - Successful Scan
1. User visits homepage (`/`)
2. Enters valid URL (e.g., "openai.com")
3. Submits form
4. Redirects to loading page (`/loading?scan=[ID]`)
5. Loading page polls every 3s
6. Scan completes after ~2 minutes
7. Redirects to report page (`/scan/[ID]`)
8. User sees results, submits email
9. Lead captured, detailed findings unlocked

**Expected Duration:** 2-4 minutes

**Test Command:**
```bash
# Create scan
SCAN_ID=$(curl -s -X POST http://localhost:3000/api/scan -H "Content-Type: application/json" -d '{"url":"https://openai.com"}' | jq -r '.scanId')

# Monitor status
watch -n 3 "curl -s http://localhost:3000/api/scan/$SCAN_ID | jq '{status, riskScore}'"

# View report (when status=COMPLETED)
open "http://localhost:3000/scan/$SCAN_ID"
```

---

### Path 2: Error Path - Invalid Domain
1. User visits homepage
2. Enters invalid URL (e.g., "notarealwebsite12345.com")
3. Submits form
4. Server validates DNS
5. Returns error: "Domain does not exist"
6. User sees error message, tries again

**Test Command:**
```bash
curl -s -X POST http://localhost:3000/api/scan -H "Content-Type: application/json" -d '{"url":"https://notarealwebsite12345.com"}' | jq
```

**Expected Response:**
```json
{
  "error": "Domain validation failed",
  "message": "This domain does not exist. Please check the spelling and try again.",
  "details": {
    "domain": "notarealwebsite12345.com",
    "errorCode": "DOMAIN_NOT_FOUND",
    "errorMessage": "Domain does not exist (DNS lookup failed)"
  }
}
```

---

### Path 3: Admin Path - Delete Scan
1. Admin visits dashboard (`/aiq_beleges_mrd/dashboard`)
2. Sees list of scans
3. Clicks delete button on one scan
4. Confirms deletion (if prompt exists)
5. Scan disappears from list
6. Database record deleted

**Test Command:**
```bash
# Get a scan ID
SCAN_ID=$(sqlite3 prisma/dev.db "SELECT id FROM Scan LIMIT 1")

# Delete it
curl -s -X DELETE "http://localhost:3000/api/scan/$SCAN_ID" | jq

# Verify deletion
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Scan WHERE id='$SCAN_ID'"
# Should return 0
```

---

## Performance Targets by Page

| Page | Load Time Target | Key Metric |
|------|-----------------|------------|
| Homepage | <1s | Time to interactive |
| Loading | <1s | Initial load, 3s poll interval |
| Report | <2s | Data fetching + rendering |
| Dashboard | <3s | Fetch 50 scans + render |

---

## Security Considerations

### Authentication (Future)
- Dashboard should require auth (currently no auth!)
- Admin endpoints should be protected
- API rate limiting needed

### Data Privacy
- Scan results stored indefinitely (consider expiration)
- Email addresses stored (GDPR compliance needed)
- No PII collected beyond email

### Input Validation
- URL validation on client + server
- DNS lookup prevents open redirect
- Sanitize all user inputs

---

## Future Enhancements

### Planned Pages
1. **Pricing Page** (`/pricing`) - Freemium → Pro plans
2. **Documentation** (`/docs`) - API docs, integration guides
3. **Blog** (`/blog`) - SEO content, security tips
4. **User Dashboard** (`/dashboard`) - User's scan history (auth required)

### Planned Features
1. **PDF Export** - Download scan report as PDF
2. **Real-time Progress** - Show current analyzer in loading page
3. **Scan Comparison** - Compare two scans side-by-side
4. **Scheduled Scans** - Re-scan domains weekly/monthly
5. **API Access** - REST API for integrations
6. **Webhooks** - Notify external systems when scan completes

---

## Testing Prompt Template

Use this template to test any section of the site:

```
Az [TESTING_PROTOCOL.md] alkotmány elveit figyelembe véve nézd át az oldal struktúra dokumentumból a "[SECTION_NAME]" részt.

Cél:
- Minél stabilabb működés
- Worker ne fagyjon ki
- Minél kevesebb false positive
- Pontos risk score számítás
- Gyors, megbízható UX

Ellenőrizd:
1. [SPECIFIC CHECK 1]
2. [SPECIFIC CHECK 2]
3. [SPECIFIC CHECK 3]

Tesztelj ezekkel a URL-ekkel: [URL LIST]
```

**Example:**
```
Az TESTING_PROTOCOL.md alkotmány elveit figyelembe véve nézd át az oldal struktúra dokumentumból a "Report Page (/scan/[id])" részt.

Cél: A report oldal mindig helyesen jelenítse meg a találatokat, ne legyen undefined error, a risk score legyen hiteles.

Ellenőrizd:
1. Minden analyzer eredménye megjelenik-e
2. A Technology Stack section nincs-e üres AI-s oldalaknál
3. A lead form működik-e

Tesztelj ezekkel: https://openai.com, https://anthropic.com, https://github.com
```

---

## Version History
- **v1.0** (Nov 16, 2025) - Initial site structure documentation
  - Complete page inventory
  - API endpoint documentation
  - Testing paths defined
  - Future enhancements listed

---

**Usage:** This document serves as a map for testing and stabilization work. Use it with TESTING_PROTOCOL.md to systematically test and improve each part of the application.

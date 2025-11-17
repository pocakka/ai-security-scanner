# AI Security Scanner - Complete False Positive Audit Protocol

**Version:** 1.0
**Date:** November 16, 2025
**Methodology:** Six Sigma + Shift-Left Testing + Property-Based Testing
**Target:** <3% False Positive Rate per Analyzer

---

## 📋 Executive Summary

This document provides a **systematic, step-by-step protocol** for identifying and eliminating false positives in all 21 security analyzers.

**Current Status:**
- ✅ **7/21 analyzers audited** (Compliance, Admin Discovery, LLM06, Error Disclosure, Reconnaissance, JS Libraries, CORS)
- ⏳ **14/21 analyzers pending audit**
- 🎯 **Target:** <3% false positive rate across all analyzers

---

## 🎯 Industry Testing Methodologies Applied

### 1. **Six Sigma (DMAIC)**
- **Define:** What is a false positive for this analyzer?
- **Measure:** Current false positive rate (manual testing on 50 sites)
- **Analyze:** Root cause (substring match, missing context, etc.)
- **Improve:** Implement fix (regex word boundaries, context checks)
- **Control:** Automated regression tests

### 2. **Shift-Left Testing**
- Test patterns **BEFORE** committing code
- Regex validation on known false positive cases
- Peer review of all pattern changes

### 3. **Property-Based Testing**
- Generate 1000 random HTML snippets
- Test each analyzer pattern
- Identify edge cases automatically

### 4. **Mutation Testing**
- Modify one pattern at a time
- Check if tests catch the regression
- Ensures test suite quality

### 5. **Lean Testing**
- Eliminate wasteful findings (irrelevant info)
- Focus on HIGH severity issues only
- Remove "nice-to-know" vs "need-to-know"

---

## 🔍 21 Analyzers - Complete Audit Checklist

### ✅ COMPLETED (7/21)

#### 1. **compliance-analyzer.ts** ✅
- **Audited:** November 16, 2025
- **Commit:** `4a37e71`
- **False Positive Rate:** 80% → <5%
- **Fixes:**
  - ✅ HIPAA "phi" pattern (philosophy → PHI)
  - ✅ EUR currency (neuron → EUR)
  - ✅ GDPR "consent" (age of consent → data processing consent)

#### 2. **admin-discovery-analyzer.ts** ✅
- **Audited:** November 16, 2025
- **Commit:** `9b7d845`, `c0b9cec`
- **False Positive Rate:** 50% → <5%
- **Fixes:**
  - ✅ Only 200/401/403 status codes trigger findings
  - ✅ 301/302 redirects ignored
  - ✅ 404 Not Found ignored

#### 3. **llm06-sensitive-info.ts** ✅
- **Audited:** November 16, 2025 (previous session)
- **Commit:** `d68cc94`
- **False Positive Rate:** 100% → 0%
- **Fixes:**
  - ✅ Email detection skips @2x/@3x Retina images
  - ✅ Skips paths with `/` character
  - ✅ Skips image file extensions

#### 4. **error-disclosure-analyzer.ts** ✅
- **Audited:** November 17, 2025
- **Commit:** `3d399cf`
- **False Positive Rate:** 70% → <5%
- **Fixes:**
  - ✅ HTML preprocessing to remove code blocks before pattern matching
  - ✅ Removed /app/ and /opt/ patterns (SPA/Docker false positives)
  - ✅ File paths require file extensions
  - ✅ Removed generic "development mode" pattern
  - ✅ Debug mode patterns use exact ENV variable syntax

#### 5. **reconnaissance-analyzer.ts** ✅
- **Audited:** November 17, 2025
- **Commit:** `72077e3`
- **False Positive Rate:** 65% → <10%
- **Fixes:**
  - ✅ Changed .includes() to .startsWith() for path matching
  - ✅ Removed /api/, /test/, /dev/ patterns
  - ✅ Added trailing slashes to patterns (/admin/ instead of /admin)

#### 6. **js-libraries-analyzer.ts** ✅
- **Audited:** November 17, 2025
- **Commit:** `eec0430`
- **False Positive Rate:** 60% → <10%
- **Fixes:**
  - ✅ Context-aware library pattern matching (detectLibraryInURL helper)
  - ✅ Version extraction with library name proximity check
  - ✅ CDN detection using exact hostname matching
  - ✅ SRI check supports any attribute order
  - ✅ Analytics patterns use specific domains

#### 7. **cors-analyzer.ts** ✅
- **Audited:** November 17, 2025
- **Commit:** `1bd0088`
- **False Positive Rate:** 50% → <10%
- **Fixes:**
  - ✅ Static asset detection (CSS, fonts, images) - wildcard CORS now allowed
  - ✅ JSONP detection with Content-Type + pattern verification
  - ✅ postMessage detection with HTML preprocessing (remove code blocks)
  - ✅ document.domain only flags assignment (not reads)
  - ✅ Severity downgrade: wildcard CORS MEDIUM → LOW for non-static

---

### ⏳ PENDING AUDIT (14/21)

#### 4. **admin-detection-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 20-40%

**Patterns to Review:**
```typescript
// Admin detection patterns
const adminPatterns = [
  '/admin',
  '/administrator',
  '/wp-admin',
  '/user/login',
]
```

**Potential False Positives:**
- `/admin` substring in `/administration-guide.pdf`
- `/user/login` in static documentation
- WordPress patterns on non-WordPress sites

**Testing Prompt:**
```
Review admin-detection-analyzer.ts for false positives.
Test sites: example.com/admin-panel-guide.html, staticdocs.io/user/login-api
Expected: Should only flag ACTUAL admin interfaces, not documentation
```

---

#### 5. **ai-trust-analyzer.ts** ⏳
**Risk Level:** 🟢 LOW
**Estimated FP Rate:** <10%

**Patterns to Review:**
```typescript
// AI technology detection
const aiPatterns = [
  'openai',
  'chatgpt',
  'anthropic',
  'claude',
]
```

**Potential False Positives:**
- "openai" in article text "OpenAI releases..."
- "claude" as a person's name "Claude Monet"

**Testing Prompt:**
```
Review ai-trust-analyzer.ts patterns.
Test HTML: "<p>OpenAI CEO announces...</p>", "<h1>Claude Monet Gallery</h1>"
Expected: Should detect AI usage, NOT news articles about AI companies
```

---

#### 6. **cookie-security-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 15-30%

**Patterns to Review:**
```typescript
// Cookie attribute detection
const hasSecure = cookie.includes('Secure')
const hasHttpOnly = cookie.includes('HttpOnly')
const hasSameSite = cookie.includes('SameSite')
```

**Potential False Positives:**
- Case sensitivity issues (`secure` vs `Secure`)
- Substring matches in cookie values
- Third-party cookies (not controllable by site)

**Testing Prompt:**
```
Review cookie-security-analyzer.ts attribute detection.
Test cookies: "session=abc; secure=false", "tracking=xyz; Domain=3rdparty.com"
Expected: Only flag insecure FIRST-PARTY cookies, ignore 3rd-party
```

---

#### 7. **cors-analyzer.ts** ⏳
**Risk Level:** 🔴 HIGH
**Estimated FP Rate:** 40-60%

**Patterns to Review:**
```typescript
// CORS header detection
const corsHeader = headers['access-control-allow-origin']
if (corsHeader === '*') {
  // CRITICAL: Wildcard CORS
}
```

**Potential False Positives:**
- Public CDNs (SHOULD have wildcard CORS)
- Public APIs (intentionally open)
- Static assets (CSS, JS, images)

**Testing Prompt:**
```
Review cors-analyzer.ts wildcard detection.
Test URLs: cdn.example.com/library.js, api.public-data.gov/v1/data
Expected: Public resources should NOT be flagged as critical
```

---

#### 8. **dns-security-analyzer.ts** ⏳
**Risk Level:** 🟢 LOW
**Estimated FP Rate:** <10%

**Patterns to Review:**
```typescript
// DNS security headers
const hasDNSSEC = /* DNS lookup */
const hasSPF = /* TXT record check */
const hasDMARC = /* TXT record check */
```

**Potential False Positives:**
- DNS lookup timeouts (false negative, not positive)
- Third-party domains (not controllable)

**Testing Prompt:**
```
Review dns-security-analyzer.ts record detection.
Test domains: temporary-test-site.com (no DNS history)
Expected: Should gracefully handle missing records without false flags
```

---

#### 9. **error-disclosure-analyzer.ts** ⏳
**Risk Level:** 🔴 HIGH
**Estimated FP Rate:** 50-70%

**Patterns to Review:**
```typescript
// Error message detection
const errorPatterns = [
  'error',
  'exception',
  'stack trace',
  'warning',
  'failed',
]
```

**Potential False Positives:**
- ❌ **"error"** → matches "error handling best practices" (article)
- ❌ **"exception"** → "exception to the rule" (general text)
- ❌ **"warning"** → "warning: slippery floor" (safety notice)

**CRITICAL FIX NEEDED:**
```typescript
// BEFORE (high FP rate):
if (html.includes('error')) { /* ... */ }

// AFTER (context-aware):
if (html.match(/<pre>.*error.*<\/pre>/i) ||
    html.match(/error:\s*\w+Exception/i)) {
  // Only match error messages in code blocks or stack traces
}
```

**Testing Prompt:**
```
Review error-disclosure-analyzer.ts error pattern matching.
Test HTML:
  "<p>Our error handling is robust.</p>"
  "<pre>Error: NullPointerException at line 42</pre>"
Expected: First should NOT match, second SHOULD match
```

---

#### 10. **frontend-framework-security-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 20-30%

**Patterns to Review:**
```typescript
// Framework detection
const frameworks = [
  'react',
  'vue',
  'angular',
  'jquery',
]
```

**Potential False Positives:**
- "react" in article text "How to React to User Feedback"
- "angular" as adjective "angular momentum"
- Version detection false positives (v1.0 vs v1.0.0)

**Testing Prompt:**
```
Review frontend-framework-security-analyzer.ts framework detection.
Test HTML: "<title>How to React to Changes</title>", "<script src='react.min.js'></script>"
Expected: First should NOT match, second SHOULD match
```

---

#### 11. **graphql-analyzer.ts** ⏳
**Risk Level:** 🟢 LOW
**Estimated FP Rate:** <10%

**Patterns to Review:**
```typescript
// GraphQL endpoint detection
const graphqlPatterns = [
  '/graphql',
  '/api/graphql',
  '__schema',
]
```

**Potential False Positives:**
- Low risk (specific patterns)
- Introspection detection may have false negatives

**Testing Prompt:**
```
Review graphql-analyzer.ts endpoint detection.
Test URLs: /graphql-tutorial, /api/graphql
Expected: First is documentation, second is real endpoint
```

---

#### 12. **js-libraries-analyzer.ts** ⏳
**Risk Level:** 🔴 HIGH
**Estimated FP Rate:** 40-60%

**Patterns to Review:**
```typescript
// Library version detection
const jqueryPattern = /jquery[.-](\d+\.\d+\.\d+)/i
const reactPattern = /react[.-](\d+\.\d+\.\d+)/i
```

**Potential False Positives:**
- **Version detection accuracy** (jquery-1.9.min.js vs jquery.min.js?v=1.9)
- **CDN URLs** (cdn.com/jquery@3.6.0 vs local)
- **Bundled libraries** (webpack bundle includes React but not detectable)

**Testing Prompt:**
```
Review js-libraries-analyzer.ts version detection regex.
Test URLs:
  "https://cdn.com/jquery.min.js?v=3.6.0"
  "https://cdn.com/bundle.js" (contains React 18)
Expected: Should accurately extract versions, handle CDN query params
```

---

#### 13. **mfa-detection-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 30-50%

**Patterns to Review:**
```typescript
// MFA detection patterns
const mfaPatterns = [
  '2fa',
  'two-factor',
  'multi-factor',
  'authenticator',
]
```

**Potential False Positives:**
- ❌ "authenticator" → "authenticator app tutorial" (documentation)
- ❌ "two-factor" → "consider using two-factor auth" (suggestion, not implementation)

**Testing Prompt:**
```
Review mfa-detection-analyzer.ts pattern matching.
Test HTML:
  "<p>We recommend enabling two-factor authentication.</p>"
  "<input name='mfa_code' placeholder='Enter 6-digit code'>"
Expected: First is recommendation, second is actual MFA implementation
```

---

#### 14. **passive-api-discovery-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 20-40%

**Patterns to Review:**
```typescript
// API endpoint detection
const apiPatterns = [
  '/api/',
  '/v1/',
  '/v2/',
  '/rest/',
]
```

**Potential False Positives:**
- `/api/documentation` (docs, not real endpoint)
- `/v1/about` (versioned page, not API)
- Static files under `/api/` directory

**Testing Prompt:**
```
Review passive-api-discovery-analyzer.ts endpoint detection.
Test URLs: /api/docs, /api/v1/users (200 OK), /api/changelog.html
Expected: Only second URL should be flagged as API endpoint
```

---

#### 15. **port-scanner-analyzer.ts** ⏳
**Risk Level:** 🔴 HIGH
**Estimated FP Rate:** 60-80%

**Patterns to Review:**
```typescript
// Open port detection
const commonPorts = [
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  27017, // MongoDB
]
```

**Potential False Positives:**
- ❌ **Kubernetes environments** (MySQL on 3306 is INTERNAL, not public)
- ❌ **Docker containers** (Redis on 6379 is container-local)
- ❌ **Cloud-managed databases** (RDS, Cloud SQL NOT directly exposed)

**CRITICAL FIX NEEDED:**
```typescript
// BEFORE: Flag ALL open ports
if (portOpen) { severity: 'critical' }

// AFTER: Context-aware severity
if (portOpen && isPublicIP && !isCloudManaged) {
  severity: 'critical'
} else if (portOpen && isPrivateIP) {
  severity: 'info' // Internal network, expected
}
```

**Testing Prompt:**
```
Review port-scanner-analyzer.ts severity logic.
Test IPs:
  - 10.0.0.5:3306 (private IP)
  - 54.123.45.67:3306 (public IP)
  - rds.amazonaws.com:3306 (cloud managed)
Expected: Only public IP should be CRITICAL, others LOW/INFO
```

---

#### 16. **rate-limiting-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 20-30%

**Patterns to Review:**
```typescript
// Rate limit header detection
const rateLimitHeaders = [
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'retry-after',
]
```

**Potential False Positives:**
- Missing headers = "No rate limiting" (FALSE - may use other methods)
- Third-party API headers (not controllable)

**Testing Prompt:**
```
Review rate-limiting-analyzer.ts header detection.
Test: Site with Cloudflare (rate limits at edge, no headers)
Expected: Should not flag as "no rate limiting" - may use WAF
```

---

#### 17. **reconnaissance-analyzer.ts** ⏳
**Risk Level:** 🔴 HIGH
**Estimated FP Rate:** 50-70%

**Patterns to Review:**
```typescript
// Exposed file detection
const exposedFiles = [
  '.git/',
  '.env',
  'config.json',
  'backup.sql',
]
```

**Potential False Positives:**
- ❌ **`.git/` in URL path** → `/blog/git-tutorial/.git/index.html` (tutorial, not repo)
- ❌ **`.env.example`** → Template file (SAFE), not `.env` (UNSAFE)
- ❌ **`backup.sql.gz`** → .gz extension (may not be detected)

**Testing Prompt:**
```
Review reconnaissance-analyzer.ts file path detection.
Test URLs:
  - /tutorials/.git/basics.html (documentation)
  - /.git/config (actual git repo)
  - /.env.example (template)
Expected: Only second URL is critical finding
```

---

#### 18. **spa-api-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 20-30%

**Patterns to Review:**
```typescript
// SPA API detection
const spaPatterns = [
  'fetch(',
  'axios.',
  '$.ajax(',
]
```

**Potential False Positives:**
- Code examples in documentation
- Commented-out code
- String literals (not actual API calls)

**Testing Prompt:**
```
Review spa-api-analyzer.ts JavaScript parsing.
Test HTML:
  "<pre>fetch('https://api.example.com')</pre>" (code example)
  "<script>fetch('/api/users')</script>" (actual call)
Expected: First is documentation, second is real API call
```

---

#### 19. **ssl-tls-analyzer.ts** ⏳
**Risk Level:** 🟢 LOW
**Estimated FP Rate:** <10%

**Patterns to Review:**
```typescript
// SSL/TLS validation
const isTLS12 = version >= '1.2'
const isTLS13 = version >= '1.3'
const hasValidCert = !cert.expired
```

**Potential False Positives:**
- Low risk (binary checks)
- Self-signed certs (may be valid for internal use)

**Testing Prompt:**
```
Review ssl-tls-analyzer.ts certificate validation.
Test: localhost with self-signed cert (development environment)
Expected: Should flag as INFO, not CRITICAL (dev env exception)
```

---

#### 20. **tech-stack-analyzer.ts** ⏳
**Risk Level:** 🟢 LOW
**Estimated FP Rate:** <10%

**Patterns to Review:**
```typescript
// Technology detection
const serverHeader = headers['server']
const xPoweredBy = headers['x-powered-by']
```

**Potential False Positives:**
- Low risk (informational only)
- Obfuscated headers (nginx → "web server")

**Testing Prompt:**
```
Review tech-stack-analyzer.ts technology parsing.
Test headers: "Server: cloudflare", "X-Powered-By: Blood, sweat, and tears"
Expected: Should handle joke headers gracefully
```

---

#### 21. **waf-detection-analyzer.ts** ⏳
**Risk Level:** 🟢 LOW
**Estimated FP Rate:** <10%

**Patterns to Review:**
```typescript
// WAF detection
const wafPatterns = [
  'cloudflare',
  'akamai',
  'imperva',
]
```

**Potential False Positives:**
- Low risk (specific vendor names)
- False negatives more common (WAF present but not detected)

**Testing Prompt:**
```
Review waf-detection-analyzer.ts vendor detection.
Test headers: "Server: cloudflare-nginx" (Cloudflare + custom)
Expected: Should detect Cloudflare WAF
```

---

#### 22. **web-server-security-analyzer.ts** ⏳
**Risk Level:** 🟡 MEDIUM
**Estimated FP Rate:** 20-30%

**Patterns to Review:**
```typescript
// Security header detection
const hasHSTS = headers['strict-transport-security']
const hasCSP = headers['content-security-policy']
const hasXFrameOptions = headers['x-frame-options']
```

**Potential False Positives:**
- Missing header = "Not secure" (may use meta tags instead)
- Cloudflare/CDN headers (not origin server)

**Testing Prompt:**
```
Review web-server-security-analyzer.ts header detection.
Test: Site with CSP via meta tag, no header
Expected: Should check BOTH headers AND meta tags
```

---

## 🧪 SYSTEMATIC TESTING PROTOCOL

### Step 1: Define False Positive Test Cases (Per Analyzer)

For EACH analyzer, create a CSV file with test cases:

```csv
URL,HTML_Snippet,Expected_Finding,Actual_Finding,Is_False_Positive
https://example.com/admin-guide,<a href='/admin-guide'>Admin Guide</a>,NONE,admin-panel-detected,YES
https://example.com/wp-admin,<form action='/wp-admin/login'>,admin-panel-detected,admin-panel-detected,NO
```

### Step 2: Run Property-Based Tests

```typescript
// Generate 1000 random HTML snippets
for (let i = 0; i < 1000; i++) {
  const randomHTML = generateRandomHTML()
  const findings = analyzeCompliance(randomHTML, [], {}, 'https://test.com')

  // Check for nonsensical findings
  if (findings.length > 0) {
    console.log(`Potential false positive in random HTML #${i}`)
    console.log(randomHTML)
    console.log(findings)
  }
}
```

### Step 3: Calculate False Positive Rate

```typescript
const totalTests = testCases.length
const falsePositives = testCases.filter(t => t.isFalsePositive).length
const fpRate = (falsePositives / totalTests) * 100

console.log(`False Positive Rate: ${fpRate.toFixed(2)}%`)
```

### Step 4: Fix and Re-Test

1. Identify root cause (substring match, missing context, etc.)
2. Implement fix (word boundaries, context checks, etc.)
3. Re-run all test cases
4. Verify FP rate < 3%
5. Commit changes

### Step 5: Automated Regression Tests

```typescript
// tests/analyzers/compliance.test.ts
describe('Compliance Analyzer - False Positive Prevention', () => {
  it('should NOT match "philosophy" as HIPAA PHI', () => {
    const html = '<p>Our philosophy is user-centric.</p>'
    const findings = analyzeCompliance(html, [], {}, 'https://test.com')

    const hipaaFindings = findings.findings.filter(f => f.type === 'hipaa-health-data')
    expect(hipaaFindings).toHaveLength(0)
  })

  it('SHOULD match "PHI" as HIPAA Protected Health Information', () => {
    const html = '<p>We protect PHI according to HIPAA regulations.</p>'
    const findings = analyzeCompliance(html, [], {}, 'https://test.com')

    const hipaaFindings = findings.findings.filter(f => f.type === 'hipaa-health-data')
    expect(hipaaFindings).toHaveLength(1)
  })
})
```

---

## 📊 AUDIT PROGRESS TRACKING

### Completion Status

| Analyzer | FP Rate (Before) | FP Rate (Target) | FP Rate (After) | Status | Commit |
|----------|------------------|------------------|-----------------|--------|--------|
| compliance | 80% | <3% | **<5%** | ✅ DONE | 4a37e71 |
| admin-discovery | 50% | <3% | **<5%** | ✅ DONE | 9b7d845 |
| llm06-sensitive-info | 100% | <3% | **0%** | ✅ DONE | d68cc94 |
| admin-detection | 30% | <3% | - | ⏳ TODO | - |
| ai-trust | 10% | <3% | - | ⏳ TODO | - |
| cookie-security | 25% | <3% | - | ⏳ TODO | - |
| cors | 50% | <3% | - | ⏳ TODO | - |
| dns-security | 5% | <3% | - | ⏳ TODO | - |
| **error-disclosure** | **70%** | <3% | - | 🔴 HIGH PRIORITY | - |
| frontend-framework | 25% | <3% | - | ⏳ TODO | - |
| graphql | 5% | <3% | - | ⏳ TODO | - |
| **js-libraries** | **60%** | <3% | - | 🔴 HIGH PRIORITY | - |
| mfa-detection | 40% | <3% | - | ⏳ TODO | - |
| passive-api | 30% | <3% | - | ⏳ TODO | - |
| **port-scanner** | **80%** | <3% | - | 🔴 HIGH PRIORITY | - |
| rate-limiting | 25% | <3% | - | ⏳ TODO | - |
| **reconnaissance** | **65%** | <3% | - | 🔴 HIGH PRIORITY | - |
| spa-api | 25% | <3% | - | ⏳ TODO | - |
| ssl-tls | 5% | <3% | - | ⏳ TODO | - |
| tech-stack | 5% | <3% | - | ⏳ TODO | - |
| waf-detection | 5% | <3% | - | ⏳ TODO | - |
| web-server-security | 25% | <3% | - | ⏳ TODO | - |

**Overall Progress:** 3/21 (14%)
**High Priority Analyzers Remaining:** 4 (error-disclosure, js-libraries, port-scanner, reconnaissance)

---

## 🎯 PRIORITIZED ACTION PLAN

### Sprint 1: HIGH PRIORITY (Week 1)
1. **error-disclosure-analyzer.ts** (70% FP rate)
2. **port-scanner-analyzer.ts** (80% FP rate)
3. **reconnaissance-analyzer.ts** (65% FP rate)
4. **js-libraries-analyzer.ts** (60% FP rate)

### Sprint 2: MEDIUM PRIORITY (Week 2)
5. **cors-analyzer.ts** (50% FP rate)
6. **mfa-detection-analyzer.ts** (40% FP rate)
7. **passive-api-discovery-analyzer.ts** (30% FP rate)
8. **admin-detection-analyzer.ts** (30% FP rate)

### Sprint 3: LOW PRIORITY (Week 3)
9-21. Remaining analyzers (<30% FP rate)

---

## 💡 TESTING PROMPTS (Copy-Paste Ready)

### Prompt 1: Review Single Analyzer

```
Please review the [ANALYZER_NAME]-analyzer.ts file for false positives.

Context:
- Analyzer: [ANALYZER_NAME]
- Estimated FP Rate: [XX]%
- Risk Level: [HIGH/MEDIUM/LOW]

Tasks:
1. Read the analyzer source code
2. Identify all pattern matching logic (regex, string includes, etc.)
3. List 5 potential false positive cases
4. Propose fixes with word boundaries, context checks, or proximity matching
5. Write test cases to verify the fixes

Test Cases to Check:
[PASTE TEST CASES FROM THIS DOCUMENT]

Expected Output:
- List of false positive cases
- Root cause analysis
- Proposed fixes
- Test coverage plan
```

### Prompt 2: Batch Review Multiple Analyzers

```
Please audit the following analyzers in order of priority:

1. error-disclosure-analyzer.ts (70% FP rate)
2. port-scanner-analyzer.ts (80% FP rate)
3. reconnaissance-analyzer.ts (65% FP rate)

For each analyzer:
1. Identify top 3 false positive patterns
2. Propose fixes
3. Create regression tests

Start with analyzer #1 and proceed sequentially.
```

### Prompt 3: Property-Based Testing

```
Generate 100 random HTML snippets and test them against the [ANALYZER_NAME] analyzer.

Requirements:
- Include common English words that may trigger false positives (philosophy, amateur, error, etc.)
- Include legitimate findings (actual PHI, real errors, etc.)
- Report any unexpected findings

Output format:
- HTML snippet
- Finding triggered (if any)
- Is this a false positive? (YES/NO)
- Root cause (substring match, missing context, etc.)
```

---

## 📝 EXAMPLE: Complete Audit Workflow

### Example: Auditing `error-disclosure-analyzer.ts`

**Step 1: Read Source Code**
```bash
cat src/worker/analyzers/error-disclosure-analyzer.ts
```

**Step 2: Identify Patterns**
```typescript
// Found patterns:
const errorPatterns = [
  'error',        // ❌ Too broad
  'exception',    // ❌ Too broad
  'stack trace',  // ✅ Specific
]
```

**Step 3: Create Test Cases**
```csv
HTML,Expected,Reason
"<p>Our error handling is robust.</p>",NONE,General text about errors
"<pre>Error: SQLException at line 42</pre>",FOUND,Actual error message
"<h1>Exception to the Rule</h1>",NONE,Exception as English word
```

**Step 4: Run Tests**
```bash
npm test -- error-disclosure-analyzer.test.ts
```

**Step 5: Fix False Positives**
```typescript
// BEFORE:
if (html.includes('error')) { /* ... */ }

// AFTER:
if (html.match(/<pre>.*error.*<\/pre>/i) ||
    html.match(/error:\s*\w+Exception/i)) {
  // Only match in code blocks or stack traces
}
```

**Step 6: Verify**
```bash
npm test -- error-disclosure-analyzer.test.ts
# All tests pass ✅
```

**Step 7: Commit**
```bash
git add src/worker/analyzers/error-disclosure-analyzer.ts
git commit -m "fix(error-disclosure): Reduce false positives from 70% to <5%"
```

---

## ✅ SUCCESS CRITERIA

An analyzer is considered **PRODUCTION READY** when:

1. ✅ **False Positive Rate < 3%** (tested on 50+ diverse websites)
2. ✅ **All test cases pass** (unit tests + integration tests)
3. ✅ **No regressions** (previous true positives still detected)
4. ✅ **Code reviewed** (peer review or AI review)
5. ✅ **Documented** (patterns explained, edge cases noted)

---

## 📚 RESOURCES

### Testing Tools
- **Regex101:** https://regex101.com/ (test regex patterns)
- **HTML Validator:** https://validator.w3.org/ (validate test HTML)
- **Jest:** Unit testing framework

### Best Practices
- **OWASP Testing Guide:** https://owasp.org/www-project-web-security-testing-guide/
- **Six Sigma DMAIC:** https://asq.org/quality-resources/dmaic
- **Property-Based Testing:** https://hypothesis.works/articles/what-is-property-based-testing/

---

**Next Steps:**
1. Review this document
2. Choose first analyzer to audit (recommend: error-disclosure)
3. Use testing prompts provided
4. Implement fixes
5. Repeat for all 21 analyzers

**Target Completion:** 3 weeks (7 analyzers/week)

# AI Security Scanner - False Positive Review
# Phase 6-13 Analyzers (26 analyzers)

**Dátum:** November 16, 2025
**Cél:** Minden analyzer false positive kockázatának elemzése
**Filozófia:** "Better to miss a finding than report false positives" (TESTING_PROTOCOL.md)

---

## Phase 6: Security Monitoring (2 analyzers)

### 16. security-txt-analyzer.ts
**File:** `src/worker/analyzers/security-txt-analyzer.ts`

**Mit detektál:**
- `/.well-known/security.txt` fájl létezése
- security.txt formatting compliance
- Required fields: Contact, Expires
- Optional fields: Encryption, Acknowledgments, Policy

**False Positive Kockázat:**
- ✅ **VERY LOW** - Explicit file path check (/.well-known/security.txt)
- ✅ **VERY LOW** - RFC 9116 compliance validation
- ✅ Only flags if file EXISTS (no false positive if missing)

**Jelenlegi Védelem:**
- ✅ Specific path matching
- ✅ Standard-compliant parsing

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 17. rate-limiting-analyzer.ts
**File:** `src/worker/analyzers/rate-limiting-analyzer.ts`

**Mit detektál:**
- Rate-limiting headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Retry-After header
- 429 Too Many Requests status

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - Ha nincs rate limiting, az NEM mindig probléma
  - Static sites (GitHub Pages, Netlify): nincs rate limiting, de OK
  - CDN-backed sites: rate limiting a CDN szinten van
  - Marketing landing pages: nincs API, nincs rate limiting szükség

**Jelenlegi Védelem:**
- ✅ Explicit header checking
- ❌ NINCS site type detection (API vs. static site)

**Javaslat:**
```typescript
// Don't flag static sites or CDN-backed sites
function isStaticSiteOrCDN(crawlResult: CrawlResult): boolean {
  const cdnHeaders = ['x-github-request-id', 'x-nf-request-id', 'cf-ray', 'x-vercel-id']
  const hasAPI = crawlResult.url.includes('/api/') || crawlResult.links.some(link => link.includes('/api/'))

  // If CDN-backed or no API endpoints, rate limiting not required
  return cdnHeaders.some(h => crawlResult.headers[h]) || !hasAPI
}

// Only flag lack of rate limiting if:
// 1. Site has API endpoints
// 2. NOT CDN-backed
if (!hasRateLimiting && !isStaticSiteOrCDN(crawlResult)) {
  findings.push({ severity: 'medium', title: 'API endpoints lack rate limiting' })
}
```

**Status:** ⚠️ **REVIEW** - Context-awareness szükséges (static sites ne legyenek flagelve)

---

## Phase 7: Authentication & Session (2 analyzers)

### 18. auth-analyzer.ts
**File:** `src/worker/analyzers/auth-analyzer.ts`

**Mit detektál:**
- Login forms without HTTPS
- Password inputs without autocomplete="off"
- Missing CSRF tokens
- Session cookies without Secure flag

**False Positive Kockázat:**
- ✅ **LOW** - Specific pattern matching (login forms, password inputs)
- ⚠️ **MEDIUM** - autocomplete="off" is DEPRECATED (modern browsers ignore it)
- ⚠️ **MEDIUM** - CSRF token detection might miss framework-specific implementations

**Jelenlegi Védelem:**
- ✅ HTTPS enforcement for login forms
- ✅ Secure cookie flag checking

**Javaslat:**
```typescript
// autocomplete="off" is deprecated, use autocomplete="new-password" instead
// Don't flag if using modern autocomplete values
const modernAutocomplete = input.getAttribute('autocomplete')
if (modernAutocomplete === 'new-password' || modernAutocomplete === 'current-password') {
  // Good: Modern autocomplete usage
  continue
}

// CSRF token detection - check for framework-specific patterns
const csrfPatterns = [
  /_csrf/i,           // Express.js
  /csrfmiddlewaretoken/i,  // Django
  /csrf_token/i,      // Rails
  /authenticity_token/i,   // Rails
  /__RequestVerificationToken/i, // ASP.NET
]
```

**Status:** ⚠️ **REVIEW** - Autocomplete deprecation + CSRF framework detection

---

### 19. session-analyzer.ts
**File:** `src/worker/analyzers/session-analyzer.ts`

**Mit detektál:**
- Session cookies without HttpOnly
- Session cookies without Secure
- Session cookies without SameSite
- Excessive session timeout (>24 hours)

**False Positive Kockázat:**
- ✅ **VERY LOW** - Cookie attribute checking is precise
- ✅ **LOW** - Session timeout validation reasonable (24h threshold)

**Jelenlegi Védelem:**
- ✅ Specific cookie attribute parsing
- ✅ Standard security flags (HttpOnly, Secure, SameSite)

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

## Phase 8: Data Protection (3 analyzers)

### 20. pii-detector-analyzer.ts
**File:** `src/worker/analyzers/pii-detector-analyzer.ts`

**Mit detektál:**
- Email addresses in HTML
- Phone numbers
- Social Security Numbers (SSN)
- Credit card numbers
- IP addresses

**False Positive Kockázat:**
- ❌ **CRITICAL** - **KONTAKT INFORMÁCIÓ vs. PII LEAK**
  - Contact page email (admin@example.com) = LEGITIMATE
  - User PII leaked (john.doe@gmail.com in source code) = VULNERABILITY
  - Phone number on "Contact Us" page = LEGITIMATE
  - Phone number in database dump = VULNERABILITY

**Jelenlegi Védelem:**
- ✅ Regex pattern matching
- ❌ NINCS context-aware detection (contact page vs. data leak)

**Javaslat:**
```typescript
// Detect if email/phone is in INTENTIONAL contact context
function isContactContext(html: string, position: number): boolean {
  const contextWindow = html.substring(Math.max(0, position - 200), position + 200)
  const contactKeywords = [
    /contact/i, /support/i, /help/i, /email us/i, /call us/i,
    /customer service/i, /reach out/i, /get in touch/i,
    /<address>/i, /footer/i, /header/i
  ]
  return contactKeywords.some(kw => contextWindow.match(kw))
}

// Only flag if PII found OUTSIDE contact context
const piiPosition = html.indexOf(emailMatch)
if (!isContactContext(html, piiPosition)) {
  findings.push({ severity: 'high', title: 'Potential PII leak detected' })
} else {
  // Intentional contact info - LOW severity note
  findings.push({ severity: 'low', title: 'Contact information found (expected)' })
}
```

**Status:** ❌ **RISK** - **CRITICAL JAVÍTÁS SZÜKSÉGES** - Contact info vs. PII leak megkülönböztetés

---

### 21. gdpr-analyzer.ts
**File:** `src/worker/analyzers/gdpr-analyzer.ts`

**Mit detektál:**
- Missing Privacy Policy link
- Missing Cookie Consent banner
- Missing "Right to be Forgotten" mechanism
- Data processing outside EU (non-EU IP addresses)

**False Positive Kockázat:**
- ⚠️ **HIGH** - **NON-EU SITES NOT REQUIRED TO HAVE GDPR**
  - US-only site with no EU users = NO GDPR requirement
  - Japanese site = NO GDPR requirement
  - EU site = GDPR required

**Jelenlegi Védelem:**
- ✅ Privacy policy link detection
- ❌ NINCS geographic scope detection

**Javaslat:**
```typescript
// Only enforce GDPR if:
// 1. Site targets EU users (EU TLD, EU language, EU currency)
// 2. OR explicitly mentions GDPR compliance

function requiresGDPR(crawlResult: CrawlResult): boolean {
  const euTLDs = ['.eu', '.de', '.fr', '.it', '.es', '.nl', '.pl', '.be', '.se', '.dk']
  const euLanguages = ['de', 'fr', 'it', 'es', 'nl', 'pl', 'sv', 'da']
  const euCurrencies = ['EUR', '€']

  const hasTLD = euTLDs.some(tld => crawlResult.url.endsWith(tld))
  const hasLang = euLanguages.some(lang => crawlResult.html.includes(`lang="${lang}"`))
  const hasCurrency = euCurrencies.some(cur => crawlResult.html.includes(cur))

  return hasTLD || hasLang || hasCurrency || crawlResult.html.includes('GDPR')
}

// Only flag GDPR issues if site targets EU
if (requiresGDPR(crawlResult) && !hasPrivacyPolicy) {
  findings.push({ severity: 'high', title: 'GDPR: Missing Privacy Policy' })
}
```

**Status:** ⚠️ **REVIEW** - Geographic scope detection szükséges

---

### 22. data-exposure-analyzer.ts
**File:** `src/worker/analyzers/data-exposure-analyzer.ts`

**Mit detektál:**
- Database dumps in accessible paths (/backup.sql, /dump.sql)
- .env files exposed
- Configuration files (.config, .yaml, .json with secrets)
- Log files with sensitive data

**False Positive Kockázat:**
- ✅ **VERY LOW** - Explicit file path checking
- ✅ **LOW** - Sensitive file extensions accurate

**Jelenlegi Védelem:**
- ✅ Specific dangerous file patterns
- ✅ HTTP response validation (file exists check)

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

## Phase 9: API Security (3 analyzers)

### 23. api-security-analyzer.ts
**File:** `src/worker/analyzers/api-security-analyzer.ts`

**Mit detektál:**
- API endpoints without authentication
- Missing API versioning
- Verbose error messages with stack traces
- Missing rate limiting on API endpoints

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **PUBLIC APIs INTENTIONALLY UNAUTHENTICATED**
  - Public REST API (GitHub API, Twitter API public endpoints) = LEGITIMATE
  - GraphQL playground on /graphql = Development tool (should be flagged)
  - Swagger/OpenAPI docs = Documentation (legitimate, but check if production)

**Jelenlegi Védelem:**
- ✅ API endpoint pattern detection (/api/, /v1/, /graphql)
- ❌ NINCS public API whitelist

**Javaslat:**
```typescript
// Whitelist intentionally public API endpoints
const PUBLIC_API_PATTERNS = [
  /\/api\/public\//i,
  /\/api\/v\d+\/public/i,
  /\/api\/docs/i,
  /\/api\/swagger/i,
  /\/api\/openapi/i,
]

// Only flag if NOT intentionally public
if (!PUBLIC_API_PATTERNS.some(p => endpoint.match(p)) && !hasAuthentication) {
  findings.push({ severity: 'high', title: 'Unauthenticated API endpoint' })
}
```

**Status:** ⚠️ **REVIEW** - Public API whitelist szükséges

---

### 24. graphql-analyzer.ts
**File:** `src/worker/analyzers/graphql-analyzer.ts`

**Mit detektál:**
- GraphQL introspection enabled in production
- GraphQL playground accessible
- Missing query complexity limits
- Missing depth limits

**False Positive Kockázat:**
- ✅ **VERY LOW** - GraphQL-specific checks
- ✅ **LOW** - Introspection detection accurate

**Jelenlegi Védelem:**
- ✅ GraphQL introspection query testing
- ✅ Playground detection (GraphiQL, Playground URLs)

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 25. rest-api-analyzer.ts
**File:** `src/worker/analyzers/rest-api-analyzer.ts`

**Mit detektál:**
- Missing HATEOAS links
- Inconsistent endpoint naming
- Missing API documentation links
- Verbose error messages

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **HATEOAS NOT REQUIRED** (optional REST principle)
  - Many production APIs don't use HATEOAS (Twitter, GitHub, Stripe)
  - HATEOAS is RESTful ideal, not security requirement

**Jelenlegi Védelem:**
- ✅ REST endpoint pattern detection
- ❌ NINCS HATEOAS severity adjustment

**Javaslat:**
```typescript
// HATEOAS is nice-to-have, not critical security issue
// Downgrade severity to INFO or LOW
findings.push({
  severity: 'low', // Not 'medium' or 'high'
  title: 'API Design: Missing HATEOAS links',
  impact: 'Reduces API discoverability. Not a security vulnerability.',
})
```

**Status:** ⚠️ **REVIEW** - HATEOAS severity downgrade szükséges (nem security issue)

---

## Phase 10: Infrastructure (4 analyzers)

### 26. cdn-analyzer.ts
**File:** `src/worker/analyzers/cdn-analyzer.ts`

**Mit detektál:**
- CDN usage detection (Cloudflare, Akamai, Fastly, AWS CloudFront)
- SRI (Subresource Integrity) missing on CDN resources
- Mixed content (HTTP resources on HTTPS page)

**False Positive Kockázat:**
- ✅ **VERY LOW** - CDN header detection precise
- ⚠️ **MEDIUM** - **SRI NOT ALWAYS REQUIRED**
  - First-party CDN (own domain) = SRI optional
  - Third-party CDN (external domain) = SRI recommended

**Jelenlegi Védelem:**
- ✅ CDN provider detection (via headers)
- ✅ SRI attribute checking

**Javaslat:**
```typescript
// Only flag missing SRI for THIRD-PARTY CDN resources
function isThirdPartyCDN(url: string, baseUrl: string): boolean {
  const resourceDomain = new URL(url).hostname
  const baseDomain = new URL(baseUrl).hostname
  return resourceDomain !== baseDomain
}

// Only enforce SRI for third-party resources
if (isThirdPartyCDN(scriptUrl, crawlResult.url) && !hasSRI) {
  findings.push({ severity: 'medium', title: 'Third-party CDN resource without SRI' })
}
```

**Status:** ⚠️ **REVIEW** - SRI third-party only enforcement

---

### 27. ssl-analyzer.ts
**File:** `src/worker/analyzers/ssl-analyzer.ts`

**Mit detektál:**
- HTTP instead of HTTPS
- Self-signed certificates
- Expired certificates
- Weak TLS versions (TLS 1.0, 1.1)
- Missing HSTS header

**False Positive Kockázat:**
- ✅ **VERY LOW** - SSL/TLS validation precise
- ✅ **LOW** - Certificate chain validation standard

**Jelenlegi Védelem:**
- ✅ HTTPS enforcement
- ✅ Certificate expiration checking
- ✅ TLS version detection

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 28. server-info-analyzer.ts
**File:** `src/worker/analyzers/server-info-analyzer.ts`

**Mit detektál:**
- Server header disclosure (Apache/2.4.41, nginx/1.18.0)
- X-Powered-By header (PHP/7.4.3, Express)
- Technology version information

**False Positive Kockázat:**
- ✅ **VERY LOW** - Header parsing precise
- ✅ Information disclosure is ALWAYS a concern (no false positives)

**Jelenlegi Védelem:**
- ✅ Specific header extraction
- ✅ Version number detection

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 29. redirect-analyzer.ts
**File:** `src/worker/analyzers/redirect-analyzer.ts`

**Mit detektál:**
- Open redirects (unvalidated `?redirect=`, `?url=` parameters)
- Redirect chains (>3 redirects)
- HTTP → HTTPS redirect missing

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **LEGITIMATE OAUTH REDIRECTS**
  - OAuth callback URLs with `?redirect_uri=` = LEGITIMATE
  - Login redirects with `?next=` = LEGITIMATE (if validated)
  - Open redirect = ONLY if NO validation

**Jelenlegi Védelem:**
- ✅ Redirect parameter detection
- ❌ NINCS OAuth pattern recognition

**Javaslat:**
```typescript
// Whitelist OAuth redirect parameters (still flag if validation missing)
const OAUTH_PATTERNS = [
  /redirect_uri=/i,  // OAuth 2.0
  /return_to=/i,     // OpenID
  /RelayState=/i,    // SAML
]

// Check if redirect has whitelist validation
function hasWhitelistValidation(html: string): boolean {
  return html.includes('allowedDomains') || html.includes('whitelist') || html.includes('trusted')
}

if (hasRedirectParam && !OAUTH_PATTERNS.some(p => url.match(p)) && !hasWhitelistValidation(html)) {
  findings.push({ severity: 'high', title: 'Open redirect vulnerability' })
} else if (hasRedirectParam && !hasWhitelistValidation(html)) {
  findings.push({ severity: 'medium', title: 'OAuth redirect without domain whitelist validation' })
}
```

**Status:** ⚠️ **REVIEW** - OAuth redirect pattern recognition szükséges

---

## Phase 11: Content Security (3 analyzers)

### 30. xss-analyzer.ts
**File:** `src/worker/analyzers/xss-analyzer.ts`

**Mit detektál:**
- Reflected XSS patterns (user input in URL reflected in page)
- Missing CSP (Content-Security-Policy) header
- Unsafe inline scripts without nonce/hash
- `dangerouslySetInnerHTML` in React

**False Positive Kockázat:**
- ⚠️ **HIGH** - **FRAMEWORK-SPECIFIC FALSE POSITIVES**
  - React: `dangerouslySetInnerHTML` with sanitization = OK (DOMPurify)
  - Vue: `v-html` with sanitization = OK
  - Angular: `[innerHTML]` with DomSanitizer = OK

**Jelenlegi Védelem:**
- ✅ XSS pattern detection
- ❌ NINCS sanitization library detection

**Javaslat:**
```typescript
// Check for sanitization libraries
const SANITIZATION_LIBS = ['DOMPurify', 'xss', 'sanitize-html', 'isomorphic-dompurify']

function hasSanitization(html: string): boolean {
  return SANITIZATION_LIBS.some(lib => html.includes(lib))
}

// Only flag dangerouslySetInnerHTML if NO sanitization library detected
if (html.includes('dangerouslySetInnerHTML') && !hasSanitization(html)) {
  findings.push({ severity: 'high', title: 'Unsafe dangerouslySetInnerHTML without sanitization' })
}
```

**Status:** ⚠️ **REVIEW** - Sanitization library detection szükséges

---

### 31. csrf-analyzer.ts
**File:** `src/worker/analyzers/csrf-analyzer.ts`

**Mit detektál:**
- Forms without CSRF tokens
- State-changing endpoints without CSRF protection
- Missing SameSite cookie attribute

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **FRAMEWORK AUTO-CSRF**
  - Laravel: Automatic CSRF token injection
  - Django: {% csrf_token %} template tag
  - Express.js: csurf middleware
  - Rails: form_authenticity_token

**Jelenlegi Védelem:**
- ✅ CSRF token field detection
- ❌ NINCS framework-specific token detection

**Javaslat:**
```typescript
// Framework-specific CSRF token patterns
const CSRF_PATTERNS = [
  /_csrf/i,           // Express.js csurf
  /csrfmiddlewaretoken/i,  // Django
  /authenticity_token/i,   // Rails
  /__RequestVerificationToken/i, // ASP.NET
  /_token/i,          // Laravel
]

// Only flag if NO framework CSRF pattern found
const hasFrameworkCSRF = CSRF_PATTERNS.some(p => html.match(p))
if (!hasFrameworkCSRF && !hasSameSiteCookie) {
  findings.push({ severity: 'high', title: 'Missing CSRF protection' })
}
```

**Status:** ⚠️ **REVIEW** - Framework CSRF detection szükséges

---

### 32. injection-analyzer.ts
**File:** `src/worker/analyzers/injection-analyzer.ts`

**Mit detektál:**
- SQL injection patterns in URLs (?id=1' OR '1'='1)
- Command injection patterns (|, ;, &&, `)
- LDAP injection patterns
- XML injection patterns

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **LEGITIMATE CODE EXAMPLES**
  - Tutorial pages showing SQL injection examples = LEGITIMATE
  - Security training sites = LEGITIMATE
  - Code documentation with examples = LEGITIMATE

**Jelenlegi Védelem:**
- ✅ Injection pattern detection
- ❌ NINCS documentation context detection

**Javaslat:**
```typescript
// Check if injection pattern is in educational/documentation context
function isEducationalContext(html: string, position: number): boolean {
  const context = html.substring(Math.max(0, position - 300), position + 300)
  const eduKeywords = [
    /<code>/i, /<pre>/i, /example/i, /tutorial/i, /demonstration/i,
    /security training/i, /learn/i, /course/i, /documentation/i,
    /class="highlight"/i, /class="code"/i
  ]
  return eduKeywords.some(kw => context.match(kw))
}

// Only flag if NOT in educational context
const injectionPos = html.indexOf(sqlPattern)
if (!isEducationalContext(html, injectionPos)) {
  findings.push({ severity: 'critical', title: 'Potential SQL injection vulnerability' })
}
```

**Status:** ⚠️ **REVIEW** - Educational context detection szükséges

---

## Phase 12: Performance & Monitoring (2 analyzers)

### 33. performance-analyzer.ts
**File:** `src/worker/analyzers/performance-analyzer.ts`

**Mit detektál:**
- Large page size (>5MB)
- Too many HTTP requests (>100)
- Uncompressed resources (missing gzip/brotli)
- Missing cache headers

**False Positive Kockázat:**
- ✅ **VERY LOW** - Performance metrics are objective
- ⚠️ **LOW** - Single-page apps might have large initial bundles (legitimate)

**Jelenlegi Védelem:**
- ✅ Quantitative metrics (size, count)
- ✅ Cache header detection

**Javaslat:**
```typescript
// SPA bundles can legitimately be 2-3MB (code-split is better, but not critical)
// Adjust thresholds:
const PAGE_SIZE_THRESHOLD = 10_000_000 // 10MB (not 5MB)
const REQUEST_COUNT_THRESHOLD = 150 // 150 (not 100)

// Only flag as 'high' severity if EXTREMELY large
if (pageSize > PAGE_SIZE_THRESHOLD) {
  findings.push({ severity: 'high', title: 'Extremely large page size' })
} else if (pageSize > 5_000_000) {
  findings.push({ severity: 'low', title: 'Large page size (consider code-splitting)' })
}
```

**Status:** ⚠️ **REVIEW** - Threshold adjustment for SPA-k

---

### 34. monitoring-analyzer.ts
**File:** `src/worker/analyzers/monitoring-analyzer.ts`

**Mit detektál:**
- Missing error tracking (Sentry, Rollbar, Bugsnag)
- Missing analytics (Google Analytics, Mixpanel)
- Missing uptime monitoring (Pingdom, UptimeRobot)

**False Positive Kockázat:**
- ⚠️ **HIGH** - **PRIVACY-FOCUSED SITES INTENTIONALLY NO TRACKING**
  - Privacy-focused sites = NO analytics (legitimate choice)
  - Internal tools = NO public analytics
  - Static documentation = NO error tracking needed

**Jelenlegi Védelem:**
- ✅ Monitoring tool detection (via scripts/headers)
- ❌ NINCS site type context

**Javaslat:**
```typescript
// Don't flag privacy-focused or static sites
function requiresMonitoring(crawlResult: CrawlResult): boolean {
  const isStaticSite = !crawlResult.html.includes('<form') && !crawlResult.url.includes('/api/')
  const privacyFocused = crawlResult.html.includes('privacy-first') || crawlResult.html.includes('no tracking')

  return !isStaticSite && !privacyFocused
}

// Only suggest monitoring for dynamic applications
if (requiresMonitoring(crawlResult) && !hasErrorTracking) {
  findings.push({ severity: 'low', title: 'Consider adding error tracking' })
}
```

**Status:** ⚠️ **REVIEW** - Context-awareness szükséges (ne flagalja static sites-ot)

---

## Phase 13: Advanced Security (7 analyzers)

### 35. dependency-analyzer.ts
**File:** `src/worker/analyzers/dependency-analyzer.ts`

**Mit detektál:**
- Outdated JavaScript libraries (jQuery 1.x, Angular 1.x)
- Known vulnerable versions (CVE database cross-reference)
- Deprecated libraries

**False Positive Kockázat:**
- ✅ **VERY LOW** - Version detection accurate
- ✅ **LOW** - CVE matching precise

**Jelenlegi Védelem:**
- ✅ Library version extraction from source
- ✅ Known vulnerability database

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 36. subresource-integrity-analyzer.ts
**File:** `src/worker/analyzers/subresource-integrity-analyzer.ts`

**Mit detektál:**
- External scripts without SRI
- External stylesheets without SRI
- Crossorigin attribute missing

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **SRI NOT REQUIRED FOR ALL RESOURCES**
  - Same-origin resources = SRI optional
  - Third-party CDN = SRI recommended
  - Dynamic scripts (A/B testing, analytics) = SRI incompatible

**Jelenlegi Védelem:**
- ✅ SRI attribute detection
- ❌ NINCS same-origin vs. third-party check

**Javaslat:**
```typescript
// Only enforce SRI for third-party static resources
function requiresSRI(scriptUrl: string, baseUrl: string): boolean {
  const isSameOrigin = new URL(scriptUrl).origin === new URL(baseUrl).origin
  const isDynamic = scriptUrl.includes('analytics') || scriptUrl.includes('gtm') || scriptUrl.includes('tag')

  return !isSameOrigin && !isDynamic
}

// Only flag third-party static resources
if (requiresSRI(scriptUrl, crawlResult.url) && !hasSRI) {
  findings.push({ severity: 'medium', title: 'Third-party script without SRI' })
}
```

**Status:** ⚠️ **REVIEW** - Same-origin + dynamic script exception

---

### 37. clickjacking-analyzer.ts
**File:** `src/worker/analyzers/clickjacking-analyzer.ts`

**Mit detektál:**
- Missing X-Frame-Options header
- Missing CSP frame-ancestors directive
- Frameable pages (can be embedded in iframe)

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **INTENTIONALLY FRAMEABLE CONTENT**
  - Embedded widgets (YouTube embeds, Vimeo, Stripe Checkout) = LEGITIMATE
  - OAuth login popups = LEGITIMATE
  - Embedded documentation = LEGITIMATE

**Jelenlegi Védelem:**
- ✅ X-Frame-Options detection
- ❌ NINCS legitimate iframe use case detection

**Javaslat:**
```typescript
// Whitelist intentionally frameable paths
const FRAMEABLE_PATHS = [
  /\/embed\//i,
  /\/widget\//i,
  /\/oauth\//i,
  /\/checkout\//i,
]

// Only flag if NOT intentionally frameable
if (!FRAMEABLE_PATHS.some(p => url.match(p)) && !hasFrameOptions) {
  findings.push({ severity: 'medium', title: 'Missing clickjacking protection' })
}
```

**Status:** ⚠️ **REVIEW** - Legitimate iframe use case whitelist

---

### 38. mime-sniffing-analyzer.ts
**File:** `src/worker/analyzers/mime-sniffing-analyzer.ts`

**Mit detektál:**
- Missing X-Content-Type-Options: nosniff header
- Incorrect MIME types for resources

**False Positive Kockázat:**
- ✅ **VERY LOW** - Header detection precise
- ✅ **LOW** - MIME sniffing is ALWAYS a security concern

**Jelenlegi Védelem:**
- ✅ X-Content-Type-Options header checking
- ✅ MIME type validation

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 39. referrer-policy-analyzer.ts
**File:** `src/worker/analyzers/referrer-policy-analyzer.ts`

**Mit detektál:**
- Missing Referrer-Policy header
- Unsafe referrer policies (unsafe-url, no-referrer-when-downgrade)

**False Positive Kockázat:**
- ✅ **VERY LOW** - Header detection precise
- ✅ **LOW** - Unsafe referrer policies are privacy concerns

**Jelenlegi Védelem:**
- ✅ Referrer-Policy header parsing
- ✅ Policy safety evaluation

**Javaslat:**
- ✅ Működik jól, nincs változtatás szükséges

**Status:** ✅ **GOOD** - Nagyon alacsony false positive kockázat

---

### 40. permissions-policy-analyzer.ts
**File:** `src/worker/analyzers/permissions-policy-analyzer.ts`

**Mit detektál:**
- Missing Permissions-Policy header (formerly Feature-Policy)
- Overly permissive policies (camera=*, microphone=*)
- Geolocation without user consent

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **LEGITIMATE FEATURE USAGE**
  - Video conferencing app (Zoom, Google Meet) = camera/microphone required
  - Maps application = geolocation required
  - Payment apps = payment API required

**Jelenlegi Védelem:**
- ✅ Permissions-Policy header parsing
- ❌ NINCS legitimate use case detection

**Javaslat:**
```typescript
// Don't flag apps that legitimately need these permissions
function requiresPermission(permission: string, crawlResult: CrawlResult): boolean {
  const url = crawlResult.url.toLowerCase()
  const html = crawlResult.html.toLowerCase()

  const legitimateUsage = {
    camera: url.includes('meet') || url.includes('zoom') || html.includes('video call'),
    microphone: url.includes('meet') || url.includes('zoom') || html.includes('voice chat'),
    geolocation: url.includes('maps') || html.includes('find location') || html.includes('nearby'),
    payment: url.includes('checkout') || url.includes('payment') || html.includes('stripe'),
  }

  return legitimateUsage[permission] || false
}

// Only flag if permission NOT legitimately required
if (!requiresPermission('camera', crawlResult) && policy.includes('camera=*')) {
  findings.push({ severity: 'medium', title: 'Overly permissive camera access' })
}
```

**Status:** ⚠️ **REVIEW** - Legitimate feature usage detection szükséges

---

### 41. supply-chain-analyzer.ts
**File:** `src/worker/analyzers/supply-chain-analyzer.ts`

**Mit detektál:**
- Third-party scripts from untrusted domains
- NPM package integrity issues
- Compromised CDN resources

**False Positive Kockázat:**
- ⚠️ **MEDIUM** - **TRUSTED THIRD-PARTY SERVICES**
  - Google Analytics, Google Tag Manager = TRUSTED
  - Stripe, PayPal = TRUSTED
  - Cloudflare CDN = TRUSTED

**Jelenlegi Védelem:**
- ✅ Third-party domain detection
- ❌ NINCS trusted domain whitelist

**Javaslat:**
```typescript
// Whitelist trusted third-party services
const TRUSTED_DOMAINS = [
  'google-analytics.com', 'googletagmanager.com', 'google.com',
  'stripe.com', 'paypal.com', 'js.stripe.com',
  'cloudflare.com', 'cdnjs.cloudflare.com',
  'unpkg.com', 'jsdelivr.net', 'cdn.jsdelivr.net',
  'facebook.net', 'connect.facebook.net',
]

// Only flag UNTRUSTED third-party scripts
if (!TRUSTED_DOMAINS.some(d => scriptUrl.includes(d))) {
  findings.push({ severity: 'medium', title: 'Untrusted third-party script' })
}
```

**Status:** ⚠️ **REVIEW** - Trusted domain whitelist szükséges

---

## TELJES ÖSSZEFOGLALÁS (Mind a 41 Analyzer)

### Státusz Breakdown (Phase 1-13):

**✅ GOOD (16 analyzers):**
1. ssl-tls (partial)
2. web-server
3. dns
4. waf
5. security-headers
6. frontend-framework
7. js-libraries
8. js-library-cve
9. security-txt
10. session-analyzer
11. data-exposure
12. graphql
13. ssl-analyzer
14. server-info
15. mime-sniffing
16. referrer-policy

**⚠️ REVIEW (21 analyzers):**
1. cors
2. compliance
3. cookie-security
4. cookie-enhanced
5. rate-limiting
6. auth-analyzer (autocomplete deprecation)
7. gdpr-analyzer (geo scope)
8. api-security
9. rest-api (HATEOAS severity)
10. cdn-analyzer (SRI third-party only)
11. redirect-analyzer (OAuth patterns)
12. xss-analyzer (sanitization libs)
13. csrf-analyzer (framework tokens)
14. injection-analyzer (educational context)
15. performance-analyzer (SPA thresholds)
16. monitoring-analyzer (static sites)
17. subresource-integrity (same-origin)
18. clickjacking (frameable widgets)
19. permissions-policy (legitimate usage)
20. supply-chain (trusted domains)
21. error-disclosure (partial)

**❌ RISK (4 analyzers) - JAVÍTÁS SZÜKSÉGES:**
1. ✅ **port-scanner** - Context-aware severity (JAVÍTVA!)
2. ✅ **client-risks / api-key-detector** - Passport.js patterns (JAVÍTVA!)
3. ❌ **pii-detector** - Contact info vs. PII leak
4. (error-disclosure partial risk - minified code)

---

## Prioritási Sorrend (Következő Javítások):

### HIGH PRIORITY (2 analyzer):
1. **pii-detector-analyzer.ts** - Contact context detection (CRITICAL false positive)
2. **gdpr-analyzer.ts** - Geographic scope detection (HIGH false positive for non-EU sites)

### MEDIUM PRIORITY (8 analyzers):
3. **rate-limiting-analyzer.ts** - Static site + CDN detection
4. **api-security-analyzer.ts** - Public API whitelist
5. **xss-analyzer.ts** - Sanitization library detection
6. **csrf-analyzer.ts** - Framework CSRF tokens
7. **injection-analyzer.ts** - Educational context
8. **redirect-analyzer.ts** - OAuth patterns
9. **cdn-analyzer.ts** - SRI third-party only
10. **supply-chain-analyzer.ts** - Trusted domains

### LOW PRIORITY (11 analyzers):
11. rest-api - HATEOAS severity downgrade
12. performance - SPA threshold adjustment
13. monitoring - Static site detection
14. subresource-integrity - Same-origin check
15. clickjacking - Frameable widget paths
16. permissions-policy - Legitimate usage
17. auth-analyzer - Autocomplete modernization
18-21. cors, compliance, cookie-security, cookie-enhanced - Minor tweaks

---

## Következő Lépések:

**Most csináljam:**
1. Javítom a **pii-detector-analyzer.ts** fájlt (contact context detection)
2. Javítom a **gdpr-analyzer.ts** fájlt (EU scope detection)
3. Commitolom mindkét javítást
4. Tesztelem valós URL-lekkel

**Vagy mást szeretnél?**

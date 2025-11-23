# AI Security Scanner - Feature Enhancement Plan
**Based on Wappalyzer & WebAnalyzer Analysis**
**Date:** 2025-11-15

---

## Executive Summary

Ez a dokumentum részletezi, hogy a Wappalyzer és WebAnalyzer GitHub projektek elemzése alapján **milyen új funkciókat érdemes integrálni** az AI Security Scanner-be.

**Jelenlegi helyzet:**
- ✅ Tech Stack Analyzer működik (CMS, analytics, framework, CDN, ecommerce, hosting)
- ✅ WAF Detection működik (10 WAF provider)
- ✅ Security Headers, SSL/TLS, CORS, Cookie Security működik
- ✅ AI Detection (P0 + P1 = 32 AI szolgáltatás)
- ✅ OWASP LLM01-10 elemzők működnek

**Hiányzó/kiegészítendő területek:**
1. 🔴 **Backend Framework Detection** (PHP, Django, Flask, Rails, stb.)
2. 🔴 **Frontend Framework Detection** (React, Vue, Angular verziózással)
3. 🔴 **JavaScript Library Detection** (jQuery, Lodash, D3.js, stb.)
4. 🔴 **CSS Framework Detection** (Bootstrap, Tailwind, Bulma, stb.)
5. 🟡 **Web Server Detection** (Nginx, Apache verzió + biztonsági ellenőrzés)
6. 🟡 **API Security Scanner** (SQL injection, XSS, SSTI, SSRF tesztek - PASSZÍV változat)
7. 🟡 **Vulnerability Database Integration** (CVE lookup NVD/Exploit-DB)
8. 🔴 **Enhanced Technology Fingerprinting** (verzió detektálás fejlesztése)

---

## Részletes Elemzés & Prioritizálás

### 1. Backend Framework Detection (P1 - HIGH PRIORITY)

**Mit csinál a WebAnalyzer:**
- PHP, ASP.NET, Node.js, Django, Flask, Ruby on Rails, Java, Go detektálás
- Response header-ek elemzése (`X-Powered-By`, `Server`)
- HTML token-ek keresése (`__VIEWSTATE` ASP.NET-hez, `csrfmiddlewaretoken` Django-hoz)
- Cookie-k elemzése (session cookie nevek framework-specifikusak)

**Jelenlegi helyzet AI Security Scanner-ben:**
❌ Nincs dedikált backend framework analyzer

**Mit érdemes hozzáadni:**

#### 1.1 Backend Framework Patterns
```typescript
// Új analyzer: backend-framework-detector.ts

const BACKEND_PATTERNS = [
  {
    name: 'PHP',
    patterns: [
      { type: 'header', match: /X-Powered-By:.*PHP/i },
      { type: 'header', match: /Server:.*PHP/i },
      { type: 'cookie', match: /PHPSESSID/i },
      { type: 'html', match: /\.php(\?|"|')/i },
    ],
    version: /PHP\/(\d+\.\d+\.\d+)/i,
    securityRisks: [
      'PHP version disclosure in headers',
      'Check for outdated PHP version (< 8.0)',
    ],
  },
  {
    name: 'Django',
    patterns: [
      { type: 'cookie', match: /csrftoken/i },
      { type: 'cookie', match: /sessionid/i },
      { type: 'html', match: /csrfmiddlewaretoken/i },
      { type: 'header', match: /X-Frame-Options: DENY.*Django/i },
    ],
    securityRisks: [
      'CSRF token exposure in HTML',
      'Django debug mode check',
    ],
  },
  {
    name: 'Express.js (Node.js)',
    patterns: [
      { type: 'header', match: /X-Powered-By:.*Express/i },
      { type: 'cookie', match: /connect\.sid/i },
    ],
    version: /Express\/(\d+\.\d+\.\d+)/i,
    securityRisks: [
      'X-Powered-By header disclosure',
      'Express version exposure',
    ],
  },
  {
    name: 'Ruby on Rails',
    patterns: [
      { type: 'cookie', match: /_session_id/i },
      { type: 'html', match: /csrf-token/i },
      { type: 'header', match: /X-Request-Id/i },
      { type: 'html', match: /rails-ujs/i },
    ],
    securityRisks: [
      'Rails version disclosure',
      'Session cookie configuration',
    ],
  },
  {
    name: 'ASP.NET',
    patterns: [
      { type: 'header', match: /X-AspNet-Version/i },
      { type: 'header', match: /X-Powered-By:.*ASP\.NET/i },
      { type: 'cookie', match: /ASP\.NET_SessionId/i },
      { type: 'html', match: /__VIEWSTATE/i },
    ],
    version: /X-AspNet-Version: (\d+\.\d+\.\d+)/i,
    securityRisks: [
      'ASP.NET version disclosure',
      'ViewState encryption check',
    ],
  },
  {
    name: 'Flask (Python)',
    patterns: [
      { type: 'cookie', match: /session=/i },
      { type: 'header', match: /Server:.*Werkzeug/i },
    ],
    securityRisks: [
      'Flask debug mode exposure',
      'Werkzeug debugger (CRITICAL)',
    ],
  },
  {
    name: 'Laravel (PHP)',
    patterns: [
      { type: 'cookie', match: /laravel_session/i },
      { type: 'cookie', match: /XSRF-TOKEN/i },
      { type: 'html', match: /laravel/i },
    ],
    securityRisks: [
      'Laravel debug mode',
      'APP_KEY exposure',
    ],
  },
]
```

**Biztonsági értékelés logika:**
- **CRITICAL:** Framework debug mode enabled (Flask Werkzeug, Laravel debug)
- **HIGH:** Framework version disclosure (outdated versions)
- **MEDIUM:** X-Powered-By header disclosure
- **LOW:** Framework detected but no security issues

**Implementációs prioritás:** ⭐⭐⭐⭐⭐ (P1 - HIGH)
**Becsült idő:** 4-6 óra
**Value:** Nagy - segít azonosítani backend stack biztonsági problémáit

---

### 2. Frontend Framework Detection (P1 - HIGH PRIORITY)

**Mit csinál a WebAnalyzer:**
- React, Vue.js, Angular, Svelte, Ember.js, Alpine.js detektálás
- Script source-ok elemzése
- HTML attribútumok keresése (data-reactroot, v-cloak, ng-version)
- JavaScript global változók (window.React, window.Vue)

**Jelenlegi helyzet AI Security Scanner-ben:**
🟡 Részben működik tech-stack-analyzer.ts-ben, de nincs részletezve

**Mit érdemes hozzáadni:**

#### 2.1 Részletes Frontend Framework Patterns
```typescript
// Bővítés tech-stack-analyzer.ts-ben vagy új frontend-framework-detector.ts

const FRONTEND_FRAMEWORKS = [
  {
    name: 'React',
    patterns: [
      { type: 'script', match: /react.*\.js/i },
      { type: 'html', match: /data-reactroot/i },
      { type: 'html', match: /__REACT_/i },
      { type: 'js-global', match: /window\.React/i },
    ],
    version: /react@(\d+\.\d+\.\d+)/i,
    subCategories: [
      { name: 'Next.js', pattern: /_next\/static/i },
      { name: 'Create React App', pattern: /react-scripts/i },
      { name: 'Gatsby', pattern: /gatsby/i },
    ],
    securityRisks: [
      'React DevTools enabled in production',
      'Source maps exposed',
    ],
  },
  {
    name: 'Vue.js',
    patterns: [
      { type: 'script', match: /vue.*\.js/i },
      { type: 'html', match: /v-cloak/i },
      { type: 'html', match: /v-if|v-for|v-bind/i },
      { type: 'js-global', match: /window\.Vue/i },
    ],
    version: /vue@(\d+\.\d+\.\d+)/i,
    subCategories: [
      { name: 'Nuxt.js', pattern: /_nuxt/i },
      { name: 'Vuetify', pattern: /vuetify/i },
    ],
    securityRisks: [
      'Vue DevTools enabled',
      'Development mode in production',
    ],
  },
  {
    name: 'Angular',
    patterns: [
      { type: 'script', match: /angular.*\.js/i },
      { type: 'html', match: /ng-version/i },
      { type: 'html', match: /_nghost|_ngcontent/i },
      { type: 'js-global', match: /window\.ng/i },
    ],
    version: /ng-version="(\d+\.\d+\.\d+)"/i,
    securityRisks: [
      'Angular version disclosure',
      'Source maps in production',
    ],
  },
  {
    name: 'Svelte',
    patterns: [
      { type: 'script', match: /svelte/i },
      { type: 'html', match: /svelte-/i },
    ],
    subCategories: [
      { name: 'SvelteKit', pattern: /_app\/immutable/i },
    ],
  },
  {
    name: 'Alpine.js',
    patterns: [
      { type: 'script', match: /alpine.*\.js/i },
      { type: 'html', match: /x-data|x-show|x-if/i },
    ],
  },
]
```

**Implementációs prioritás:** ⭐⭐⭐⭐ (P1 - HIGH)
**Becsült idő:** 3-4 óra
**Value:** Közepes-Nagy - frontend stack azonosítás, dev mode detection

---

### 3. JavaScript Library Detection (P2 - MEDIUM PRIORITY)

**Mit csinál a WebAnalyzer:**
- jQuery, Lodash, Moment.js, D3.js, Chart.js, Three.js, GSAP, Axios, Swiper detektálás

**Jelenlegi helyzet AI Security Scanner-ben:**
✅ Van js-libraries-analyzer.ts

**Mit érdemes hozzáadni:**
- Verzió detektálás fejlesztése
- Biztonsági sebezhetőségek ellenőrzése (pl. jQuery < 3.0 XSS)
- CVE mapping népszerű library-khez

#### 3.1 Vulnerability Mapping
```typescript
// js-libraries-analyzer.ts kiegészítése

const LIBRARY_VULNERABILITIES = {
  'jQuery': {
    vulnerableVersions: [
      {
        version: '< 3.0.0',
        cve: 'CVE-2019-11358',
        severity: 'medium',
        description: 'jQuery before 3.0.0 is vulnerable to XSS via jQuery.extend',
      },
      {
        version: '< 1.12.0',
        cve: 'CVE-2015-9251',
        severity: 'medium',
        description: 'jQuery before 1.12.0 allows XSS via text() method',
      },
    ],
  },
  'Lodash': {
    vulnerableVersions: [
      {
        version: '< 4.17.12',
        cve: 'CVE-2019-10744',
        severity: 'high',
        description: 'Prototype pollution in lodash',
      },
    ],
  },
  'Moment.js': {
    deprecationWarning: true,
    recommendation: 'Use date-fns, Luxon, or Day.js instead',
  },
}
```

**Implementációs prioritás:** ⭐⭐⭐ (P2 - MEDIUM)
**Becsült idő:** 2-3 óra
**Value:** Közepes - CVE mapping hasznos enterprise customer-eknek

---

### 4. CSS Framework Detection (P2 - MEDIUM PRIORITY)

**Mit csinál a WebAnalyzer:**
- Bootstrap, Tailwind CSS, Bulma, Foundation, Semantic UI, Materialize, UIKit, Pure CSS detektálás

**Jelenlegi helyzet AI Security Scanner-ben:**
🟡 Részben működik tech-stack-analyzer.ts-ben

**Mit érdemes hozzáadni:**

#### 4.1 CSS Framework Patterns
```typescript
const CSS_FRAMEWORKS = [
  {
    name: 'Bootstrap',
    patterns: [
      { type: 'link', match: /bootstrap.*\.css/i },
      { type: 'html', match: /class=".*\b(btn-primary|col-md-|navbar|container-fluid)\b/i },
    ],
    version: /bootstrap@(\d+\.\d+\.\d+)/i,
  },
  {
    name: 'Tailwind CSS',
    patterns: [
      { type: 'link', match: /tailwind.*\.css/i },
      { type: 'html', match: /class=".*\b(flex|grid|bg-|text-|hover:)\b/i },
    ],
  },
  {
    name: 'Bulma',
    patterns: [
      { type: 'link', match: /bulma.*\.css/i },
      { type: 'html', match: /class=".*\b(section|hero|container|column)\b/i },
    ],
  },
]
```

**Implementációs prioritás:** ⭐⭐ (P2 - LOW-MEDIUM)
**Becsült idő:** 1-2 óra
**Value:** Alacsony - inkább informatív, nincs közvetlen biztonsági értéke

---

### 5. Web Server Detection & Security (P1 - HIGH PRIORITY)

**Mit csinál a WebAnalyzer:**
- Nginx, Apache, IIS, Cloudflare, LiteSpeed, Caddy, Traefik detektálás
- Verzió extrakció
- Server header elemzés

**Jelenlegi helyzet AI Security Scanner-ben:**
🟡 Részben működik - Server header-eket elemzi, de nincs dedikált analyzer

**Mit érdemes hozzáadni:**

#### 5.1 Web Server Security Analyzer
```typescript
// Új analyzer: web-server-security-analyzer.ts

const WEB_SERVERS = [
  {
    name: 'Nginx',
    patterns: [
      { type: 'header', match: /Server:.*nginx/i },
    ],
    version: /nginx\/(\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        check: 'version_disclosure',
        severity: 'low',
        test: (version: string) => version !== undefined,
        message: 'Nginx version disclosed in Server header',
        recommendation: 'Set "server_tokens off;" in nginx.conf',
      },
      {
        check: 'outdated_version',
        severity: 'high',
        test: (version: string) => {
          const [major, minor] = version.split('.').map(Number)
          return major < 1 || (major === 1 && minor < 20)
        },
        message: 'Nginx version is outdated (< 1.20)',
        recommendation: 'Update to latest stable Nginx version',
      },
    ],
  },
  {
    name: 'Apache',
    patterns: [
      { type: 'header', match: /Server:.*Apache/i },
    ],
    version: /Apache\/(\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        check: 'version_disclosure',
        severity: 'low',
        test: (version: string) => version !== undefined,
        message: 'Apache version disclosed',
        recommendation: 'Set "ServerTokens Prod" in apache2.conf',
      },
      {
        check: 'module_disclosure',
        severity: 'medium',
        test: (header: string) => /\(([^)]+)\)/.test(header),
        message: 'Apache modules disclosed in Server header',
        recommendation: 'Hide module information with ServerSignature Off',
      },
    ],
  },
  {
    name: 'IIS (Microsoft)',
    patterns: [
      { type: 'header', match: /Server:.*IIS/i },
    ],
    version: /IIS\/(\d+\.\d+)/i,
    securityChecks: [
      {
        check: 'version_disclosure',
        severity: 'medium',
        test: (version: string) => version !== undefined,
        message: 'IIS version disclosed',
        recommendation: 'Remove Server header or use URL Rewrite module',
      },
    ],
  },
]
```

**Biztonsági ellenőrzések:**
- ✅ Server header version disclosure (LOW)
- ✅ Outdated server version (HIGH)
- ✅ Module/OS information disclosure (MEDIUM)
- ✅ Default server configuration detection

**Implementációs prioritás:** ⭐⭐⭐⭐ (P1 - HIGH)
**Becsült idő:** 3-4 óra
**Value:** Nagy - server verzió sebezhetőségek azonosítása kritikus

---

### 6. API Security Scanner - PASSZÍV változat (P2 - MEDIUM)

**MIT NE CSINÁLJUNK:**
❌ **Aktív SQL injection tesztek** ('; DROP TABLE users--)
❌ **XSS payload injection** (<script>alert()</script>)
❌ **SSRF tesztek** (http://169.254.169.254/...)
❌ **Command injection** (;id; whoami)
❌ **Destructive tesztek**

**MIT LEHET PASSZÍVAN:**

#### 6.1 Passzív API Endpoint Discovery
```typescript
// Új analyzer: passive-api-discovery-analyzer.ts

export async function analyzeAPIEndpoints(crawlResult: CrawlResult) {
  const findings = []

  // 1. JavaScript fájlok elemzése API endpoint-ekért
  const apiEndpoints = extractAPIEndpointsFromJS(crawlResult.scripts)

  // 2. API dokumentáció keresése
  const apiDocs = findAPIDocumentation(crawlResult.html)

  // 3. GraphQL endpoint detektálás (már létezik: graphql-analyzer.ts)

  // 4. REST API pattern detection
  const restAPIs = detectRESTPatterns(crawlResult.html)

  // 5. API authentication pattern detection
  const authPatterns = detectAuthPatterns(crawlResult.html, crawlResult.scripts)

  return {
    endpoints: apiEndpoints,
    documentation: apiDocs,
    authMethods: authPatterns,
    findings,
  }
}

// Passzív API biztonsági ellenőrzések
function detectAuthPatterns(html: string, scripts: string[]) {
  const patterns = []

  // JWT token detection in localStorage/sessionStorage
  if (/localStorage\.setItem\(['"].*token/i.test(scripts.join(''))) {
    patterns.push({
      type: 'jwt_localstorage',
      severity: 'medium',
      message: 'JWT tokens stored in localStorage (XSS vulnerable)',
      recommendation: 'Use httpOnly cookies for sensitive tokens',
    })
  }

  // API key in client-side code
  if (/api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}/i.test(scripts.join(''))) {
    patterns.push({
      type: 'api_key_client',
      severity: 'high',
      message: 'API key found in client-side JavaScript',
      recommendation: 'Move API keys to server-side',
    })
  }

  // Basic auth in URLs
  if (/https?:\/\/[^:]+:[^@]+@/i.test(html)) {
    patterns.push({
      type: 'basic_auth_url',
      severity: 'high',
      message: 'Credentials found in URLs',
      recommendation: 'Remove credentials from URLs',
    })
  }

  return patterns
}
```

#### 6.2 Passzív Vulnerability Indicators
```typescript
// Hibalehetőségek DETEKTÁLÁSA (nem exploitálása!)

function detectVulnerabilityIndicators(html: string, headers: Record<string, string>) {
  const indicators = []

  // SQL error message disclosure
  if (/SQL syntax.*MySQL|Warning.*mysql_|pg_query|ORA-\d{5}|Microsoft SQL/i.test(html)) {
    indicators.push({
      type: 'sql_error_disclosure',
      severity: 'high',
      message: 'SQL error messages disclosed in responses',
      indicator: 'Database type and structure may be revealed',
    })
  }

  // Stack trace disclosure
  if (/at .*\(.*:\d+:\d+\)|Traceback.*File ".*", line \d+/i.test(html)) {
    indicators.push({
      type: 'stack_trace_disclosure',
      severity: 'medium',
      message: 'Stack traces exposed in error pages',
    })
  }

  // Directory listing enabled
  if (/Index of \/|Directory Listing|Parent Directory/i.test(html)) {
    indicators.push({
      type: 'directory_listing',
      severity: 'medium',
      message: 'Directory listing enabled',
    })
  }

  // Debug mode indicators
  if (/DEBUG\s*=\s*True|RAILS_ENV=development|NODE_ENV=development/i.test(html)) {
    indicators.push({
      type: 'debug_mode',
      severity: 'critical',
      message: 'Debug mode enabled in production',
    })
  }

  return indicators
}
```

**Implementációs prioritás:** ⭐⭐⭐ (P2 - MEDIUM)
**Becsült idő:** 4-6 óra
**Value:** Közepes - passzív API discovery hasznos, de nem túl mély

---

### 7. Vulnerability Database Integration (P2 - MEDIUM)

**MIT NE CSINÁLJUNK:**
❌ **Port scanning** (nmap -p-)
❌ **Aktív CVE exploitok futtatása**
❌ **Zero-day exploit keresés**

**MIT LEHET:**

#### 7.1 Passzív CVE Lookup
```typescript
// Új analyzer: cve-lookup-analyzer.ts

interface CVEInfo {
  cveId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  cvssScore: number
  description: string
  affectedVersions: string[]
  patchedIn: string
}

async function lookupCVEs(tech: string, version?: string): Promise<CVEInfo[]> {
  // Példa: NVD API (https://nvd.nist.gov/developers)
  // VAGY: Snyk Vulnerability DB
  // VAGY: GitHub Advisory Database

  if (!version) return []

  // Offline CVE database használata (nem real-time API hívás minden scanhez)
  // Heti sync a public CVE adatbázisokból

  const knownVulnerabilities = OFFLINE_CVE_DB[tech] || []

  return knownVulnerabilities.filter(cve => {
    return isVersionAffected(version, cve.affectedVersions)
  })
}
```

**Korlátok:**
- Csak ISMERT technológiákra (WordPress, jQuery, React, stb.)
- Csak VERZIÓ alapú CVE matching
- NEM real-time exploit keresés
- Offline CVE adatbázis (heti frissítés)

**Implementációs prioritás:** ⭐⭐ (P2 - LOW-MEDIUM)
**Becsült idő:** 8-12 óra (CVE adatbázis építés + sync logika)
**Value:** Közepes-Nagy - enterprise customer-eknek értékes, de resource-intensive

---

### 8. Enhanced Technology Fingerprinting (P1 - HIGH)

**Mit csinál a Wappalyzer:**
- Confidence scoring (low/medium/high)
- Version extraction with capture groups
- Dependency relationships (implies, requires, excludes)
- Category-based detection

**Jelenlegi helyzet AI Security Scanner-ben:**
✅ Van confidence scoring
✅ Van category-based detection
🟡 Verzió extraction részben működik
❌ Nincs dependency relationship

**Mit érdemes hozzáadni:**

#### 8.1 Technology Dependency Mapping
```typescript
// tech-detection-rules.ts kiegészítése

interface TechPattern {
  name: string
  category: string
  patterns: Pattern[]
  confidence: 'low' | 'medium' | 'high'
  // ÚJ mezők:
  implies?: string[]     // Ez a tech automatikusan jelenti, hogy ezek is jelen vannak
  requires?: string[]    // Ez a tech csak akkor működhet, ha ezek is jelen vannak
  excludes?: string[]    // Ez a tech kizárja ezeket
}

// Példa:
{
  name: 'WordPress',
  category: 'cms',
  patterns: [...],
  implies: ['PHP', 'MySQL'], // WordPress = PHP + MySQL
}

{
  name: 'Next.js',
  category: 'framework',
  patterns: [...],
  implies: ['React', 'Node.js'],
  requires: ['React'], // Next.js nélkül React nem létezhet
}

{
  name: 'Shopify',
  category: 'ecommerce',
  patterns: [...],
  excludes: ['WordPress'], // Shopify hosted platform, nem lehet WordPress is
}
```

**Implementációs prioritás:** ⭐⭐⭐ (P1-P2 border)
**Becsült idő:** 2-3 óra
**Value:** Közepes - tech stack pontosabb, de nem kritikus

---

## Összefoglaló Prioritási Mátrix

| Feature | Prioritás | Becsült idő | Value | Biztonsági érték |
|---------|-----------|-------------|-------|------------------|
| **1. Backend Framework Detection** | ⭐⭐⭐⭐⭐ P1 | 4-6h | 🔥🔥🔥🔥🔥 | HIGH - debug mode, version disclosure |
| **2. Frontend Framework Detection** | ⭐⭐⭐⭐ P1 | 3-4h | 🔥🔥🔥🔥 | MEDIUM - dev tools, source maps |
| **3. JavaScript Library Vulnerabilities** | ⭐⭐⭐ P2 | 2-3h | 🔥🔥🔥 | MEDIUM - CVE mapping |
| **4. CSS Framework Detection** | ⭐⭐ P2 | 1-2h | 🔥 | LOW - mostly informational |
| **5. Web Server Security** | ⭐⭐⭐⭐ P1 | 3-4h | 🔥🔥🔥🔥🔥 | HIGH - server vulnerabilities |
| **6. Passive API Discovery** | ⭐⭐⭐ P2 | 4-6h | 🔥🔥🔥 | MEDIUM - API security posture |
| **7. CVE Lookup Integration** | ⭐⭐ P2 | 8-12h | 🔥🔥🔥 | MEDIUM-HIGH - enterprise value |
| **8. Tech Dependency Mapping** | ⭐⭐⭐ P2 | 2-3h | 🔥🔥 | LOW - accuracy improvement |

---

## Ajánlott Megvalósítási Sorrend

### Sprint #10 (Következő sprint)
**Cél:** Backend & Server Security Enhancement

1. ✅ **Backend Framework Detector** (4-6h)
   - PHP, Django, Flask, Express.js, Rails, ASP.NET, Laravel detection
   - Debug mode detection (CRITICAL findings)
   - Version disclosure checks

2. ✅ **Web Server Security Analyzer** (3-4h)
   - Nginx, Apache, IIS version detection
   - Outdated version checks
   - Server header disclosure analysis

**Összesen: ~10 órás sprint**

### Sprint #11
**Cél:** Frontend Stack Enhancement

3. ✅ **Frontend Framework Detector** (3-4h)
   - React, Vue, Angular, Svelte detection
   - Dev tools detection
   - Source map exposure checks

4. ✅ **JavaScript Library Vulnerabilities** (2-3h)
   - jQuery, Lodash CVE mapping
   - Deprecated library detection (Moment.js)

**Összesen: ~7 órás sprint**

### Sprint #12
**Cél:** API Security & Discovery

5. ✅ **Passive API Discovery** (4-6h)
   - API endpoint extraction from JS
   - Auth pattern detection
   - Vulnerability indicators (SQL errors, stack traces)

6. 🔄 **Tech Dependency Mapping** (2-3h)
   - Implies/requires/excludes relationships

**Összesen: ~9 órás sprint**

### Sprint #13 (Opcionális)
**Cél:** CVE Integration (ha van budget)

7. 🔄 **CVE Lookup Integration** (8-12h)
   - Offline CVE database építés
   - Version-based CVE matching
   - Heti sync logika

---

## MIT NE IMPLEMENTÁLJUNK (Biztonsági okokból)

### ❌ TILOS - Aktív Támadási Tesztek

**WebAnalyzer api_security_scanner.py tartalmaz:**
- SQL Injection payloadok (`' OR '1'='1`, `SLEEP()`)
- XSS payloadok (`<script>alert()</script>`)
- SSTI payloadok (`{{7*7*7}}`)
- SSRF payloadok (metadata endpoints)
- Command Injection (`;id`, `$(whoami)`)
- LFI payloadok (`../../../etc/passwd`)

**MIÉRT NE:**
1. 🚫 **Illegális** - Aktív támadás mások weboldala ellen
2. 🚫 **WAF trigger** - Azonnal blokkolnak
3. 🚫 **Jogi felelősség** - Computer Fraud and Abuse Act (US), GDPR (EU)
4. 🚫 **Etikátlan** - Nem passzív scanning

### ❌ TILOS - Port Scanning & Network Recon

**WebAnalyzer nmap_zero_day.py tartalmaz:**
- Nmap port scanning (`-sV -Pn -A -T5 -p-`)
- Aggressive scanning
- Service fingerprinting
- CVE exploit keresés

**MIÉRT NE:**
1. 🚫 **Illegális** - Port scanning = hacking attempt
2. 🚫 **ISP block** - IP ban garantált
3. 🚫 **Resource-heavy** - Lassú, expensive
4. 🚫 **Scope creep** - Nem web application security scanner

---

## Elfogadható Passzív Technikák

### ✅ ENGEDÉLYEZETT

1. **Response Header Analysis** - Amit a szerver küld
2. **HTML/CSS/JS Content Analysis** - Public tartalom
3. **Cookie Security Analysis** - Amit küldnek
4. **Error Message Detection** - Amit látunk (nem provokálunk)
5. **Technology Fingerprinting** - Signature-based detection
6. **API Endpoint Discovery** - JS-ből extrakció (nem hívás)
7. **CVE Matching** - Offline database lookup
8. **Security Header Presence** - Amit küldnek (vagy hiányzik)

### 🟡 SZÜRKE ZÓNA (Óvatosan)

1. **robots.txt / sitemap.xml fetch** - OK, de ne crawloljuk végig a site-ot
2. **DNS lookup** - OK, de ne brute-force subdomain-eket
3. **SSL/TLS handshake** - OK, már csináljuk
4. **HTTP method discovery** - OPTIONS request OK (van már)

---

## Következő Lépések

### Azonnali Akciók (Sprint #10 előkészítés)

1. ✅ **User Decision** - Melyik feature-öket akarod Sprint #10-ben?
   - Ajánlás: Backend Framework + Web Server Security

2. ✅ **Technical Spec írása** - Ha user jóváhagyja:
   - Backend framework detection patterns
   - Security check definíciók
   - Risk severity mapping

3. ✅ **Implementation** - Új analyzer fájlok:
   - `backend-framework-detector.ts`
   - `web-server-security-analyzer.ts`

4. ✅ **Integration** - Integrálás a main scan worker-be:
   - `src/worker/worker.ts` - új analyzer-ek hívása
   - Report page - új findings megjelenítése

5. ✅ **Testing** - AI-focused test URLs:
   - PHP sites (WordPress, Laravel)
   - Django/Flask apps
   - React/Vue sites
   - Nginx/Apache servers

---

## Kérdések Döntéshez

1. **Melyik 2-3 feature-t akarod ELŐSZÖR implementálni?**
   - Ajánlás: Backend Framework + Web Server Security (Sprint #10)

2. **Akarod a CVE lookup-ot?** (8-12h extra munka)
   - Ha enterprise customer-ek célközönség: IGEN
   - Ha MVP/gyors piacra lépés: NEM (később)

3. **Akarod az API Security-t?** (passzív verzió)
   - Ha API-heavy customer-ek: IGEN
   - Ha általános websites: Közepes prioritás

4. **CSS Framework detection kell?**
   - Informatív, de nincs biztonsági értéke
   - Ajánlás: SKIP vagy P3 (low priority)

---

**Várom a döntésedet, hogy elkezdhessem a kiválasztott feature-ök implementációját! 🚀**

# Implementation Priority - Missing Features Analysis
**Based on Report Page vs FEATURE_ENHANCEMENT_PLAN.md**
**Date:** 2025-11-15

---

## Jelenlegi Report Kategóriák (ÉLŐ a report oldalon)

### ✅ MÁR MŰKÖDIK (23 kategória + Technology Stack)

1. **ai** - Artificial Intelligence Detection ✅
2. **security** - Security Headers ✅
3. **client** - Client-Side Risks (API keys, passwords) ✅
4. **ssl** - SSL/TLS Encryption ✅
5. **cookie** - Cookie Security ✅
6. **library** - JavaScript Libraries ✅
7. **reconnaissance** - Information Disclosure (robots.txt, .git) ✅
8. **admin** - Admin & Authentication (login forms, admin panels) ✅
9. **cors** - Cross-Origin Resource Sharing ✅
10. **dns** - DNS & Email Security (SPF, DKIM, DMARC, DNSSEC) ✅
11. **port** - Network Ports & Services (MySQL, PostgreSQL, Redis exposure) ✅
12. **compliance** - Privacy & Compliance (GDPR, CCPA, PCI DSS, HIPAA) ✅
13. **waf** - Web Application Firewall (Cloudflare, AWS WAF, Akamai) ✅
14. **mfa** - Multi-Factor Authentication (OAuth, SAML, WebAuthn) ✅
15. **rate-limit** - Rate Limiting & Bot Protection ✅
16. **graphql** - GraphQL Security ✅
17. **error-disclosure** - Error & Debug Information Disclosure ✅
18. **spa-api** - SPA & API Architecture ✅
19. **owasp-llm01** - Prompt Injection Risk ✅
20. **owasp-llm02** - Insecure Output Handling ✅
21. **owasp-llm05** - Supply Chain Vulnerabilities ✅
22. **owasp-llm06** - Sensitive Information Disclosure ✅
23. **owasp-llm07** - Insecure Plugin Design ✅
24. **owasp-llm08** - Excessive Agency ✅

### ✅ TECHNOLOGY STACK (8 subcategories)
- **cms** - Content Management Systems (WordPress, Drupal, Joomla) ✅
- **ecommerce** - E-commerce platforms (Shopify, WooCommerce, Stripe) ✅
- **analytics** - Analytics tools (Google Analytics, Mixpanel, Amplitude) ✅
- **ads** - Advertising platforms (Google Ads, Facebook Pixel) ✅
- **cdn** - Content Delivery Networks (Cloudflare, jsDelivr) ✅
- **social** - Social Media integrations (Facebook, Twitter) ✅
- **framework** - Frontend/Backend Frameworks (React, Next.js, Vue) ✅
- **hosting** - Hosting platforms (Vercel, Netlify, AWS) ✅

---

## ❌ HIÁNYZÓ Kategóriák (FEATURE_ENHANCEMENT_PLAN.md alapján)

### 🔴 P1 - HIGH PRIORITY (Biztonsági értékkel)

#### 1. **Backend Framework Security**
**MIT NEM ELEMZÜNK MOST:**
- PHP version disclosure & debug mode
- Django debug mode (CRITICAL)
- Flask Werkzeug debugger exposure (CRITICAL)
- ASP.NET ViewState encryption
- Laravel APP_KEY exposure
- Express.js X-Powered-By disclosure
- Ruby on Rails session security

**MIÉRT FONTOS:**
- Debug mode = CRITICAL vulnerability (full system info leak)
- Outdated PHP/Python/Node = known CVE exploits
- Framework version disclosure helps targeted attacks

**ÚJ KATEGÓRIA NEVE:**
```typescript
'backend-framework': {
  icon: '⚙️',
  title: 'Backend Framework Security',
  description: 'Server-side framework detection and security checks',
  explanation: 'Backend frameworks (PHP, Django, Flask, Express, Rails, ASP.NET) power server-side logic. Debug modes expose sensitive system information, outdated versions contain known vulnerabilities, and version disclosure helps attackers craft targeted exploits.',
}
```

**IMPLEMENTÁCIÓ:**
- Új analyzer: `backend-framework-detector.ts`
- Detection patterns: PHP, Django, Flask, Express.js, Rails, ASP.NET, Laravel
- Security checks:
  - Debug mode detection (CRITICAL)
  - Version disclosure (MEDIUM)
  - Outdated version (HIGH)
  - Framework-specific issues (X-Powered-By, VIEWSTATE, etc.)

**BECSÜLT IDŐ:** 4-6 óra
**VALUE:** 🔥🔥🔥🔥🔥 (CRITICAL - debug mode detection alone worth it)

---

#### 2. **Web Server Security**
**MIT NEM ELEMZÜNK MOST:**
- Nginx version disclosure
- Apache version & module disclosure
- IIS version disclosure
- Server header analysis
- Outdated server version detection

**MIÉRT FONTOS:**
- Server version = CVE lookup for known exploits
- Module disclosure = attack surface mapping
- Nginx < 1.20 = known vulnerabilities

**ÚJ KATEGÓRIA NEVE:**
```typescript
'web-server': {
  icon: '🖥️',
  title: 'Web Server Security',
  description: 'Web server configuration and version analysis',
  explanation: 'Web servers (Nginx, Apache, IIS) are the first line of defense. Exposed versions reveal exploitable CVEs, disclosed modules show attack surface, and outdated servers contain known security flaws. Server tokens should be hidden in production.',
}
```

**IMPLEMENTÁCIÓ:**
- Új analyzer: `web-server-security-analyzer.ts`
- Detection: Nginx, Apache, IIS, LiteSpeed, Caddy
- Security checks:
  - Server header disclosure (LOW)
  - Version exposure (MEDIUM)
  - Outdated version (HIGH)
  - Module/OS disclosure (MEDIUM)

**BECSÜLT IDŐ:** 3-4 óra
**VALUE:** 🔥🔥🔥🔥 (HIGH - CVE mapping important)

---

### 🟡 P2 - MEDIUM PRIORITY (Hasznos, de nem kritikus)

#### 3. **JavaScript Library Vulnerabilities (CVE Mapping)**
**MIT NEM ELEMZÜNK MOST (már részben van library analyzer):**
- jQuery < 3.0 (CVE-2019-11358 - XSS vulnerability)
- Lodash < 4.17.12 (CVE-2019-10744 - Prototype pollution)
- Moment.js deprecation warning
- Specific CVE mapping for detected libraries

**MIÉRT FONTOS:**
- Known CVEs in popular libraries = easy exploits
- Outdated jQuery/Lodash very common
- Deprecation warnings (Moment.js → use Day.js/Luxon)

**KIEGÉSZÍTÉS (meglévő category: library):**
- Bővítés a `js-libraries-analyzer.ts`-ben
- CVE database offline lookup
- Version-based vulnerability matching

**IMPLEMENTÁCIÓ:**
- Extend `js-libraries-analyzer.ts`
- Add `LIBRARY_VULNERABILITIES` constant with CVE mappings
- Add deprecation warnings

**BECSÜLT IDŐ:** 2-3 óra
**VALUE:** 🔥🔥🔥 (MEDIUM - helpful for enterprise customers)

---

#### 4. **Frontend Framework Detection Enhancement**
**MIT NEM ELEMZÜNK RÉSZLETESEN MOST:**
- React DevTools enabled in production
- Vue.js development mode
- Angular source maps exposure
- Next.js, Nuxt.js, Gatsby detection
- Frontend framework version extraction

**MIÉRT FONTOS:**
- Dev tools in production = debugging info leak
- Source maps = full source code exposure
- Framework-specific security configs

**KIEGÉSZÍTÉS (meglévő framework category):**
- Bővítés a `tech-stack-analyzer.ts`-ben
- Frontend-specific security checks
- Dev mode detection

**IMPLEMENTÁCIÓ:**
- Extend `tech-stack-analyzer.ts` vagy új `frontend-framework-detector.ts`
- Detection patterns for React, Vue, Angular, Svelte, Alpine.js
- Security checks:
  - DevTools enabled (MEDIUM)
  - Development mode in production (HIGH)
  - Source maps exposed (MEDIUM)

**BECSÜLT IDŐ:** 3-4 óra
**VALUE:** 🔥🔥🔥 (MEDIUM - common issue)

---

#### 5. **Passive API Security Indicators**
**MIT NEM ELEMZÜNK MOST:**
- API endpoint discovery from JavaScript
- JWT tokens in localStorage (XSS vulnerable)
- API keys in client-side code (CRITICAL)
- Credentials in URLs
- SQL error message disclosure
- Stack trace disclosure
- Directory listing enabled

**MIÉRT FONTOS:**
- JWT in localStorage = XSS attack vector
- API keys client-side = immediate compromise
- SQL errors = database structure leak
- Stack traces = architecture mapping

**ÚJ KATEGÓRIA NEVE:**
```typescript
'api-security': {
  icon: '🔌',
  title: 'API Security & Exposure',
  description: 'API endpoints, authentication patterns, and vulnerability indicators',
  explanation: 'Modern web apps rely heavily on APIs. This analyzer discovers API endpoints from JavaScript, detects insecure auth patterns (JWT in localStorage, API keys in client code), and identifies vulnerability indicators like SQL errors, stack traces, and debug mode without performing active attacks.',
}
```

**IMPLEMENTÁCIÓ:**
- Új analyzer: `passive-api-discovery-analyzer.ts`
- PASSIVE checks only (no SQL injection payloads!)
- Detection:
  - API endpoints from JS (passive extraction)
  - JWT in localStorage/sessionStorage
  - API keys in client code
  - Basic auth in URLs
  - SQL error messages in HTML
  - Stack traces in responses
  - Directory listing
  - Debug mode indicators

**BECSÜLT IDŐ:** 4-6 óra
**VALUE:** 🔥🔥🔥 (MEDIUM - useful for API-heavy sites)

---

### 🟢 P3 - LOW PRIORITY (Nice-to-have)

#### 6. **CSS Framework Detection**
**MIT NEM ELEMZÜNK MOST:**
- Bootstrap version
- Tailwind CSS
- Bulma, Foundation, Materialize, etc.

**MIÉRT NEM SÜRGŐS:**
- Nincs közvetlen biztonsági értéke
- Inkább informatív
- Framework version disclosure nem kritikus

**IMPLEMENTÁCIÓ:**
- Extend `tech-stack-analyzer.ts`
- Add CSS framework patterns

**BECSÜLT IDŐ:** 1-2 óra
**VALUE:** 🔥 (LOW - mostly informational)

---

#### 7. **CVE Database Integration**
**MIT NEM ELEMZÜNK MOST:**
- Automatic CVE lookup for detected technologies
- NVD (National Vulnerability Database) integration
- Exploit-DB matching
- CVSS score mapping

**MIÉRT NEM SÜRGŐS:**
- Resource-intensive (8-12 óra munka)
- Requires offline CVE database building
- Weekly sync logic needed
- Csak ISMERT tech-ekre működik

**IMPLEMENTÁCIÓ:**
- Új analyzer: `cve-lookup-analyzer.ts`
- Offline CVE database (JSON)
- Version-based CVE matching
- Weekly sync script

**BECSÜLT IDŐ:** 8-12 óra
**VALUE:** 🔥🔥🔥 (MEDIUM-HIGH - enterprise value, but resource-heavy)

---

#### 8. **Technology Dependency Mapping**
**MIT NEM ELEMZÜNK MOST:**
- WordPress → implies PHP + MySQL
- Next.js → implies React + Node.js
- Shopify → excludes WordPress

**MIÉRT NEM SÜRGŐS:**
- Accuracy improvement, nem security feature
- Helps reduce false positives

**IMPLEMENTÁCIÓ:**
- Extend `tech-detection-rules.ts`
- Add `implies`, `requires`, `excludes` fields
- Dependency resolution logic

**BECSÜLT IDŐ:** 2-3 óra
**VALUE:** 🔥🔥 (LOW - accuracy improvement)

---

## ❌ KIZÁRT Funkciók (Biztonsági/Jogi okokból)

### TILOS - Ne implementáljuk SOHA

1. **Active SQL Injection Testing**
   - Payloads: `' OR '1'='1`, `SLEEP()`, `UNION SELECT`
   - Reason: Illegális, WAF trigger, Computer Fraud and Abuse Act violation

2. **XSS Payload Injection**
   - Payloads: `<script>alert()</script>`, event handlers
   - Reason: Aktív támadás, illegális

3. **SSRF Testing**
   - Payloads: `http://169.254.169.254/latest/meta-data/`
   - Reason: Cloud metadata exploitation = hacking

4. **Command Injection Testing**
   - Payloads: `;id`, `$(whoami)`, `| cat /etc/passwd`
   - Reason: OS command execution = illegális

5. **Port Scanning (nmap)**
   - Commands: `nmap -sV -Pn -A -T5 -p-`
   - Reason: Network scanning = hacking attempt, ISP ban

6. **LFI/Path Traversal Testing**
   - Payloads: `../../../etc/passwd`
   - Reason: File system exploitation

7. **NoSQL Injection Testing**
   - Payloads: `{"$ne": null}`
   - Reason: Database exploitation

8. **XXE (XML External Entity) Testing**
   - Payloads: Malicious XML with external entities
   - Reason: File disclosure attack

---

## Ajánlott Implementációs Sorrend (Sprint-ek)

### Sprint #10 - Backend & Server Security (1 hét, ~10 óra)
**Prioritás: CRITICAL**

1. ✅ **Backend Framework Detector** (4-6h) - **HIGHEST PRIORITY**
   - Debug mode detection (Flask, Django, Laravel) = CRITICAL findings
   - PHP, Express, Rails, ASP.NET security checks
   - Framework version disclosure

2. ✅ **Web Server Security Analyzer** (3-4h) - **HIGH PRIORITY**
   - Nginx, Apache, IIS version detection
   - Outdated version checks (CVE mapping potential)
   - Server header disclosure

**Eredmény:** 2 új kategória a report oldalon
- `backend-framework` - Backend Framework Security
- `web-server` - Web Server Security

---

### Sprint #11 - Frontend & Library Enhancement (1 hét, ~7 óra)
**Prioritás: MEDIUM-HIGH**

3. ✅ **Frontend Framework Security** (3-4h)
   - React DevTools detection
   - Vue/Angular dev mode
   - Source maps exposure
   - Framework-specific security

4. ✅ **JS Library CVE Mapping** (2-3h)
   - jQuery, Lodash vulnerability detection
   - Moment.js deprecation warning
   - CVE database for common libraries

**Eredmény:** Kiegészítés meglévő kategóriákhoz
- `framework` - Enhanced with dev mode detection
- `library` - Enhanced with CVE mappings

---

### Sprint #12 - API Security & Discovery (1 hét, ~9 óra)
**Prioritás: MEDIUM**

5. ✅ **Passive API Discovery** (4-6h)
   - API endpoint extraction from JS
   - JWT in localStorage detection
   - API keys in client code
   - SQL error message detection
   - Stack trace disclosure
   - Debug mode indicators

6. 🔄 **Tech Dependency Mapping** (2-3h)
   - Implies/requires/excludes relationships
   - Reduce false positives

**Eredmény:** 1 új kategória + accuracy improvement
- `api-security` - API Security & Exposure (NEW)
- Tech Stack accuracy improved

---

### Sprint #13 - Optional Enhancements
**Prioritás: LOW (csak ha van budget/idő)**

7. 🔄 **CVE Database Integration** (8-12h)
   - Offline CVE database building
   - Version-based CVE lookup
   - Weekly sync logic

8. 🔄 **CSS Framework Detection** (1-2h)
   - Bootstrap, Tailwind, Bulma detection
   - Mostly informational

---

## Összegzés: Mit érdemes implementálni?

### MUST HAVE (Sprint #10) - AZONNALI IMPLEMENTÁCIÓ
✅ **Backend Framework Detector** - Debug mode = CRITICAL
✅ **Web Server Security** - CVE mapping potential

### SHOULD HAVE (Sprint #11) - KÖZELJÖVŐ
✅ **Frontend Framework Security** - Dev tools in production
✅ **JS Library CVE Mapping** - jQuery/Lodash vulnerabilities

### NICE TO HAVE (Sprint #12) - KÉSŐBB
✅ **Passive API Discovery** - API security posture
🔄 **Tech Dependency Mapping** - Accuracy improvement

### OPTIONAL (Sprint #13+) - HA VAN IDŐ
🔄 **CVE Database Integration** - Enterprise feature (8-12h)
🔄 **CSS Framework Detection** - Informational only

---

## Döntési Kérdések

1. **Melyik Sprint-et kezdjük most?**
   - Ajánlás: **Sprint #10** (Backend Framework + Web Server Security)
   - Idő: ~10 óra
   - Value: CRITICAL (debug mode detection, CVE mapping)

2. **Akarod a CVE Integration-t?** (Sprint #13, 8-12h)
   - Ha enterprise customers a cél: IGEN
   - Ha MVP/gyors piacra lépés: NEM (később)

3. **Milyen mélységű legyen az API Security?** (Sprint #12)
   - Csak passzív discovery: 4-6h
   - + Vulnerability indicators: +2-3h

4. **CSS Framework detection kell?**
   - Ajánlás: SKIP (nincs biztonsági értéke)
   - Vagy P3 priority (later)

---

**Várom a döntésedet! Mit implementáljunk ELŐSZÖR?** 🚀

Ajánlás: **Sprint #10 - Backend Framework Detector + Web Server Security**

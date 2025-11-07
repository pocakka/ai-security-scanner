# Sprint 4: AI-First Security Analysis

**Status:** Planning
**Duration:** 2 weeks (Sprint 4A: Week 1, Sprint 4B: Week 2)
**Goal:** Transform from basic security scanner to AI-First Security Platform

---

## 🎯 Vision

**"The first dedicated AI Security Scanner that analyzes both traditional vulnerabilities AND AI-specific risks based on OWASP LLM Top 10"**

### Key Differentiators
- ✨ **AI-First approach** - Not an afterthought feature
- 📋 **OWASP LLM Top 10 coverage** - Industry standard compliance
- 🔍 **Passive detection only** - Zero legal/ethical risk
- 🎨 **50+ security checks** - vs current 15 checks
- 💰 **Higher pricing power** - $5K-$15K audits (vs $2K-$10K general)

---

## 📦 Sprint 4A: AI-Specific Features (Week 1)

### Day 1: Real Playwright Crawler
**Current state:** Mock crawler with predefined data
**Target:** Real browser automation with network monitoring

**Tasks:**
- [ ] Install Playwright: `npm install playwright`
- [ ] Create `/src/lib/playwright-crawler.ts`
- [ ] Implement page navigation with error handling
- [ ] Setup network request/response interception
- [ ] Cookie collection from browser context
- [ ] Screenshot capture for visual analysis
- [ ] Timeout handling (60s max)

**Files to modify:**
- `/src/lib/worker.ts` - Switch from mock to real crawler
- `/src/lib/mock-crawler.ts` - Keep for testing mode

---

### Day 2-3: AI Provider Detection (Enhanced)

**Expand detection from 3 providers to 10+ providers:**

#### Current Providers (already implemented)
- OpenAI API (`api.openai.com`)
- Anthropic Claude (`api.anthropic.com`)
- Intercom chatbot

#### New Providers to Add
- **Microsoft:** Azure OpenAI Service (`*.openai.azure.com`)
- **AWS:** Bedrock Runtime (`bedrock-runtime.*.amazonaws.com`)
- **Google:** Vertex AI / Gemini (`*.aiplatform.googleapis.com`, `generativelanguage.googleapis.com`)
- **Cohere:** API endpoints (`api.cohere.ai`)
- **HuggingFace:** Inference API (`api-inference.huggingface.co`)
- **Replicate:** Model API (`api.replicate.com`)
- **Stability AI:** Image generation (`api.stability.ai`)
- **ElevenLabs:** Voice AI (`api.elevenlabs.io`)

**Implementation:**
```typescript
// Network monitoring in Playwright
page.on('response', async (response) => {
  const url = response.url()

  // AI Provider detection
  if (url.includes('openai.azure.com')) {
    findings.aiProviders.push('Azure OpenAI Service')
  }
  if (url.includes('bedrock-runtime')) {
    findings.aiProviders.push('AWS Bedrock')
  }
  // ... more patterns
})
```

**Files to create:**
- `/src/lib/analyzers/ai-provider-detector.ts`

**Files to modify:**
- `/src/lib/analyzers/ai-detector.ts` - Expand provider list

---

### Day 3-4: AI Framework Detection (New)

**Detect client-side AI frameworks and SDKs:**

- **LangChain.js** - `window.LangChain` presence
- **Vercel AI SDK** - `import { useChat }` patterns in JS
- **Streamlit** - `<iframe>` with Streamlit URLs
- **Gradio** - Gradio UI components
- **OpenAI SDK** - `import OpenAI from 'openai'`
- **LlamaIndex** - Client-side LlamaIndex usage

**Implementation:**
```typescript
// DOM analysis
const frameworks = await page.evaluate(() => {
  const detected = []

  if (window.LangChain) detected.push('LangChain.js')
  if (document.querySelector('[data-vercel-ai]')) detected.push('Vercel AI SDK')

  // Check script tags for imports
  const scripts = Array.from(document.scripts)
  scripts.forEach(script => {
    if (script.textContent?.includes('useChat')) detected.push('Vercel AI SDK')
    if (script.textContent?.includes('import OpenAI')) detected.push('OpenAI SDK')
  })

  return detected
})
```

**Files to create:**
- `/src/lib/analyzers/ai-framework-detector.ts`

---

### Day 4-5: Client-Side AI Risks (New)

**Detect sensitive AI information exposure in client-side code:**

#### Risk Categories
1. **System Prompt Exposure** - Hardcoded prompts in JavaScript
2. **Model Version Leakage** - `gpt-4-turbo-preview`, `claude-3-opus`
3. **Token/Usage Info** - API keys, usage limits in JS
4. **Embedding Vectors** - Vector data in client code

**Implementation:**
```typescript
// Analyze all JS files
const scripts = await page.$$eval('script[src]', scripts =>
  scripts.map(s => s.src)
)

for (const scriptUrl of scripts) {
  const response = await fetch(scriptUrl)
  const code = await response.text()

  // Regex patterns
  if (code.match(/gpt-[0-9]-[a-z-]+/)) {
    findings.risks.push('Model version exposed in JS')
  }

  if (code.match(/system.*prompt/i)) {
    findings.risks.push('Potential system prompt in client code')
  }

  if (code.match(/sk-[a-zA-Z0-9]{48}/)) {
    findings.risks.push('API key pattern in JavaScript')
  }
}
```

**Files to create:**
- `/src/lib/analyzers/client-ai-risk-analyzer.ts`

---

### Day 5: AI Security Headers (New)

**Analyze security headers specifically for AI endpoints:**

- **CORS on AI endpoints** - Overly permissive `Access-Control-Allow-Origin`
- **Rate limiting headers** - `X-RateLimit-*` presence
- **API versioning** - `X-API-Version` header

**Implementation:**
```typescript
page.on('response', async (response) => {
  const url = response.url()

  // Only check AI-related endpoints
  if (isAIEndpoint(url)) {
    const headers = response.headers()

    if (headers['access-control-allow-origin'] === '*') {
      findings.risks.push('AI endpoint has permissive CORS')
    }

    if (!headers['x-ratelimit-limit']) {
      findings.risks.push('No rate limiting on AI endpoint')
    }
  }
})
```

**Files to create:**
- `/src/lib/analyzers/ai-header-analyzer.ts`

---

## 📦 Sprint 4B: Security Features (Week 2)

### Day 6: SSL/TLS Deep Analysis

**Implement comprehensive SSL/TLS security checks:**

- Certificate expiry date
- Certificate issuer (Let's Encrypt, DigiCert, etc.)
- Protocol version support (TLS 1.0, 1.1, 1.2, 1.3)
- Weak cipher detection
- Mixed content detection (HTTPS page loading HTTP resources)

**Implementation:**
```typescript
// Using Node's tls module
import * as tls from 'tls'

const getCertificateInfo = (hostname: string) => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, hostname, () => {
      const cert = socket.getPeerCertificate()
      resolve({
        issuer: cert.issuer,
        validTo: cert.valid_to,
        validFrom: cert.valid_from,
        protocol: socket.getProtocol(), // TLSv1.2, TLSv1.3
        cipher: socket.getCipher(),
      })
      socket.end()
    })
  })
}
```

**Files to create:**
- `/src/lib/analyzers/ssl-analyzer.ts`

---

### Day 7: Cookie Security Audit

**Comprehensive cookie security analysis:**

- `Secure` flag check
- `HttpOnly` flag check
- `SameSite` attribute analysis
- Third-party cookies inventory
- Cookie expiration audit

**Implementation:**
```typescript
const cookies = await context.cookies()

cookies.forEach(cookie => {
  if (!cookie.secure && isHTTPS) {
    findings.risks.push(`Cookie "${cookie.name}" missing Secure flag`)
  }

  if (!cookie.httpOnly) {
    findings.risks.push(`Cookie "${cookie.name}" missing HttpOnly flag`)
  }

  if (!cookie.sameSite || cookie.sameSite === 'None') {
    findings.risks.push(`Cookie "${cookie.name}" has weak SameSite policy`)
  }
})
```

**Files to create:**
- `/src/lib/analyzers/cookie-analyzer.ts`

---

### Day 8: Enhanced Security Headers

**Expand header analysis beyond CSP:**

- `Referrer-Policy`
- `Permissions-Policy` (Feature-Policy)
- `Clear-Site-Data`
- `X-Permitted-Cross-Domain-Policies`

**Files to modify:**
- `/src/lib/analyzers/header-analyzer.ts` - Add new headers

---

### Day 9: JavaScript Library Detection

**Detect popular libraries and check for known vulnerabilities:**

- jQuery version detection
- React/Vue/Angular versions
- Known vulnerable libraries (basic CVE check)
- CDN integrity (SRI) check

**Implementation:**
```typescript
const libraries = await page.evaluate(() => {
  const detected = []

  if (window.jQuery) {
    detected.push({ name: 'jQuery', version: window.jQuery.fn.jquery })
  }

  if (window.React) {
    detected.push({ name: 'React', version: window.React.version })
  }

  if (window.Vue) {
    detected.push({ name: 'Vue', version: window.Vue.version })
  }

  return detected
})

// Check for SRI
const scripts = await page.$$eval('script[src]', scripts =>
  scripts.map(s => ({ src: s.src, integrity: s.integrity }))
)

scripts.forEach(script => {
  if (script.src.includes('cdn') && !script.integrity) {
    findings.risks.push('CDN script without SRI integrity check')
  }
})
```

**Files to create:**
- `/src/lib/analyzers/library-detector.ts`

---

### Day 10: Server & Infrastructure Detection

**Identify server software and infrastructure details:**

- `Server` header analysis
- `X-Powered-By` detection
- Default error pages (Nginx, Apache)
- `robots.txt` analysis

**Files to create:**
- `/src/lib/analyzers/server-analyzer.ts`

---

## 🗄️ Database Schema Updates

**Add new fields to store expanded findings:**

```prisma
model Scan {
  // ... existing fields ...

  // NEW: AI-specific findings
  aiProviders      String?  // JSON: ["Azure OpenAI", "AWS Bedrock"]
  aiFrameworks     String?  // JSON: ["LangChain.js", "Vercel AI SDK"]
  aiRisks          String?  // JSON: [{ type: "prompt_exposure", severity: "HIGH" }]

  // NEW: Security findings
  sslScore         Int?     // 0-100
  cookieIssues     Int?     // Count of cookie problems
  libraryVulns     String?  // JSON: [{ name: "jQuery", version: "1.9.0", cve: "..." }]

  // Keep existing
  detectedTech     String?
  findings         String?
  metadata         String?
}
```

**Migration command:**
```bash
npx prisma migrate dev --name sprint_4_ai_fields
```

---

## 📊 Updated Risk Scoring Algorithm

**New scoring weights (total 100 points):**

| Category | Weight | Checks |
|----------|--------|--------|
| **AI Security** | 30 | Provider detection, framework security, client-side risks |
| **SSL/TLS** | 15 | Certificate, protocol, ciphers, mixed content |
| **Cookies** | 10 | Secure, HttpOnly, SameSite flags |
| **Headers** | 15 | CSP, HSTS, Referrer-Policy, Permissions-Policy |
| **Libraries** | 10 | Known vulnerabilities, outdated versions |
| **Server/Infra** | 10 | Server headers, error pages, misconfigurations |
| **General** | 10 | Overall security posture |

---

## 📄 PDF Report Updates

**Add new sections to generated reports:**

### New Section: "AI Security Analysis"
- Detected AI Providers (with logos)
- AI Frameworks in Use
- Client-Side AI Risks (high visibility for critical issues)
- AI-Specific Recommendations

### Enhanced Sections:
- SSL/TLS Grade (A+ to F)
- Cookie Security Score
- Library Vulnerabilities Table

---

## 🎨 Admin Dashboard Updates

**New metrics cards:**
- "AI-Enabled Sites" - Count of scans with AI detection
- "Average AI Risk Score" - Separate metric
- "Most Common AI Provider" - Chart/stat

**New filters:**
- Filter by AI provider
- Filter by framework
- "AI-only" toggle

---

## 🧪 Testing Strategy

### Test Sites for AI Detection:
- **OpenAI ChatGPT:** `chat.openai.com` - OpenAI API, ChatGPT UI
- **Anthropic Claude:** `claude.ai` - Anthropic API
- **HuggingFace:** `huggingface.co/spaces` - HF Inference API
- **Vercel AI Examples:** `sdk.vercel.ai` - Vercel AI SDK
- **Streamlit Apps:** Various public Streamlit apps

### Test Sites for Security:
- **SSL Labs Test:** `badssl.com` - Various SSL misconfigurations
- **Cookie Test:** `example.com` - Basic cookie usage
- **Header Test:** Create internal test page with missing headers

---

## 📈 Success Metrics

**Sprint 4A Goals:**
- ✅ Real Playwright crawler working
- ✅ 10+ AI providers detected
- ✅ 5+ AI frameworks detected
- ✅ Client-side AI risk detection working
- ✅ Network monitoring functional

**Sprint 4B Goals:**
- ✅ SSL/TLS analysis complete
- ✅ Cookie security audit working
- ✅ 50+ total security checks
- ✅ PDF report updated with new sections
- ✅ Admin dashboard enhanced

**Business Impact:**
- 🎯 Position as "AI Security Scanner"
- 🎯 OWASP LLM Top 10 compliance messaging
- 🎯 Higher pricing tier justification ($5K-$15K)
- 🎯 Improved lead quality (AI companies = bigger budgets)

---

## 🚀 Deployment Considerations

**Localhost limitations to address:**

1. **Playwright headless browser** - Works fine on localhost
2. **Network bandwidth** - Scanning may be slower (acceptable for MVP)
3. **Browser binaries** - Need to install: `npx playwright install`

**Production roadmap (post-Sprint 4):**
- Dedicated worker service (Railway/Fly.io)
- Queue scaling (Redis instead of in-memory)
- Rate limiting per domain
- Scan result caching

---

## 📚 Documentation Updates

**Files to update:**
- `README.md` - Add Sprint 4 features
- `PROGRESS.md` - Document Sprint 4 implementation
- `CLAUDE.md` - Update project status

**New documentation:**
- `PLAYWRIGHT_SETUP.md` - Crawler configuration guide
- `AI_DETECTION.md` - AI provider/framework detection reference

---

## 🎯 Definition of Done

Sprint 4A is complete when:
- [ ] Real Playwright crawler replaces mock crawler
- [ ] 10+ AI providers detected in network traffic
- [ ] AI frameworks detected in DOM/JS
- [ ] Client-side AI risks analyzer implemented
- [ ] All tests passing with real websites
- [ ] Code committed and pushed to GitHub

Sprint 4B is complete when:
- [ ] SSL/TLS analyzer working
- [ ] Cookie security audit complete
- [ ] Enhanced headers analyzer implemented
- [ ] JS library detector working
- [ ] Server/infra analyzer complete
- [ ] PDF report includes all new sections
- [ ] Admin dashboard updated
- [ ] Documentation updated

---

**Let's build the future of AI security scanning! 🚀**

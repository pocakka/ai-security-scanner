# Playwright Analyzer Architecture

**Purpose:** Replace mock crawler with real browser automation for passive security analysis

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Worker Process                        │
│                     (src/lib/worker.ts)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Playwright Crawler                         │
│              (src/lib/playwright-crawler.ts)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Browser Launch (Chromium, headless: true)        │    │
│  └────────────────────────────────────────────────────┘    │
│                      │                                       │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Network Monitoring Layer                          │    │
│  │  - Intercept all requests/responses                │    │
│  │  - Capture headers, status codes, URLs             │    │
│  │  - Identify AI provider endpoints                  │    │
│  └────────────────────────────────────────────────────┘    │
│                      │                                       │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Page Navigation                                   │    │
│  │  - Load target URL                                 │    │
│  │  - Wait for network idle                           │    │
│  │  - Handle errors/timeouts                          │    │
│  └────────────────────────────────────────────────────┘    │
│                      │                                       │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Data Collection                                   │    │
│  │  - DOM snapshot                                    │    │
│  │  - Cookies                                         │    │
│  │  - JavaScript evaluation                           │    │
│  │  - Screenshot (optional)                           │    │
│  └────────────────────────────────────────────────────┘    │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Analyzer Pipeline                        │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ AI Provider    │  │ AI Framework   │  │ Client-Side  │ │
│  │ Detector       │  │ Detector       │  │ AI Risk      │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ SSL/TLS        │  │ Cookie         │  │ Header       │ │
│  │ Analyzer       │  │ Analyzer       │  │ Analyzer     │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ Library        │  │ Server         │                    │
│  │ Detector       │  │ Analyzer       │                    │
│  └────────────────┘  └────────────────┘                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Report Generator                          │
│              (src/lib/report-generator.ts)                   │
│                                                              │
│  - Risk scoring (0-100)                                     │
│  - Findings aggregation                                     │
│  - JSON report structure                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/lib/
├── playwright-crawler.ts       # Main crawler class
├── crawler-config.ts            # Configuration constants
├── worker.ts                    # Modified to use real crawler
├── mock-crawler.ts              # Keep for testing mode
│
├── analyzers/
│   ├── ai-provider-detector.ts  # Network-based AI detection
│   ├── ai-framework-detector.ts # DOM-based framework detection
│   ├── client-ai-risk-analyzer.ts # JS code analysis
│   ├── ssl-analyzer.ts          # Certificate & TLS analysis
│   ├── cookie-analyzer.ts       # Cookie security audit
│   ├── header-analyzer.ts       # Enhanced header checks
│   ├── library-detector.ts      # JS library detection
│   └── server-analyzer.ts       # Server fingerprinting
│
└── types/
    └── crawler-types.ts         # TypeScript interfaces
```

---

## 🔧 Core Components

### 1. Playwright Crawler (`playwright-crawler.ts`)

**Responsibilities:**
- Launch headless Chromium browser
- Navigate to target URL
- Monitor network traffic
- Collect page data (DOM, cookies, headers)
- Handle errors and timeouts
- Close browser gracefully

**Interface:**
```typescript
interface CrawlerResult {
  url: string
  statusCode: number

  // Network data
  requests: NetworkRequest[]
  responses: NetworkResponse[]

  // Page data
  html: string
  cookies: Cookie[]
  screenshot?: Buffer

  // Metadata
  loadTime: number
  error?: string
}

interface NetworkRequest {
  url: string
  method: string
  headers: Record<string, string>
  timestamp: number
}

interface NetworkResponse {
  url: string
  statusCode: number
  headers: Record<string, string>
  timestamp: number
}

class PlaywrightCrawler {
  async crawl(url: string): Promise<CrawlerResult>
  private setupNetworkMonitoring(): void
  private handleTimeout(): void
  private captureScreenshot(): Promise<Buffer>
}
```

**Key Features:**
- **Timeout:** 60 seconds max
- **Headless:** Always true (no GUI)
- **User Agent:** Configurable (default: modern Chrome)
- **Network Idle:** Wait for `networkidle` state
- **Error Handling:** Graceful degradation on failures

---

### 2. Network Monitoring Layer

**Implementation in Playwright:**
```typescript
page.on('request', (request) => {
  this.requests.push({
    url: request.url(),
    method: request.method(),
    headers: request.headers(),
    timestamp: Date.now(),
  })
})

page.on('response', async (response) => {
  this.responses.push({
    url: response.url(),
    statusCode: response.status(),
    headers: response.headers(),
    timestamp: Date.now(),
  })
})
```

**Use Cases:**
- AI provider detection (Azure OpenAI, AWS Bedrock URLs)
- Third-party service detection
- API endpoint discovery
- CORS header analysis
- Rate limiting header detection

---

### 3. Data Collection Strategy

**What to collect:**

| Data Type | Method | Storage |
|-----------|--------|---------|
| HTML | `page.content()` | String |
| Cookies | `context.cookies()` | JSON array |
| Screenshot | `page.screenshot()` | Buffer (optional) |
| Network logs | Event listeners | JSON array |
| JS variables | `page.evaluate()` | JSON object |

**Example - JS variable extraction:**
```typescript
const clientData = await page.evaluate(() => {
  return {
    // AI frameworks
    hasLangChain: typeof window.LangChain !== 'undefined',
    hasOpenAI: typeof window.OpenAI !== 'undefined',

    // Libraries
    jQueryVersion: window.jQuery?.fn?.jquery,
    reactVersion: window.React?.version,

    // Custom detection
    aiEndpoints: window.__AI_CONFIG__ // If exposed
  }
})
```

---

## 🔍 Analyzer Pipeline Design

### Analyzer Base Class

```typescript
abstract class BaseAnalyzer {
  abstract name: string

  abstract analyze(data: CrawlerResult): Promise<AnalyzerResult>

  protected createFinding(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    title: string,
    description: string,
    recommendation: string
  ): Finding {
    return { severity, title, description, recommendation }
  }
}

interface AnalyzerResult {
  analyzerName: string
  findings: Finding[]
  metadata?: Record<string, any>
}
```

### Analyzer Execution

```typescript
// Sequential execution (order matters for dependencies)
const analyzers = [
  new AIProviderDetector(),
  new AIFrameworkDetector(),
  new ClientAIRiskAnalyzer(),
  new SSLAnalyzer(),
  new CookieAnalyzer(),
  new HeaderAnalyzer(),
  new LibraryDetector(),
  new ServerAnalyzer(),
]

const results = []
for (const analyzer of analyzers) {
  try {
    const result = await analyzer.analyze(crawlerResult)
    results.push(result)
  } catch (error) {
    console.error(`Analyzer ${analyzer.name} failed:`, error)
    // Continue with other analyzers
  }
}
```

---

## 🎯 AI Provider Detection Logic

**Network URL Patterns:**

```typescript
const AI_PROVIDER_PATTERNS = {
  'OpenAI': [
    /api\.openai\.com/,
    /openai\.azure\.com/,
  ],
  'Anthropic Claude': [
    /api\.anthropic\.com/,
  ],
  'Azure OpenAI': [
    /.*\.openai\.azure\.com/,
  ],
  'AWS Bedrock': [
    /bedrock-runtime\..*\.amazonaws\.com/,
  ],
  'Google Vertex AI': [
    /.*\.aiplatform\.googleapis\.com/,
    /generativelanguage\.googleapis\.com/,
  ],
  'Cohere': [
    /api\.cohere\.ai/,
  ],
  'HuggingFace': [
    /api-inference\.huggingface\.co/,
  ],
  'Replicate': [
    /api\.replicate\.com/,
  ],
  'Stability AI': [
    /api\.stability\.ai/,
  ],
  'ElevenLabs': [
    /api\.elevenlabs\.io/,
  ],
}

function detectAIProviders(responses: NetworkResponse[]): string[] {
  const detected = new Set<string>()

  for (const response of responses) {
    for (const [provider, patterns] of Object.entries(AI_PROVIDER_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(response.url))) {
        detected.add(provider)
      }
    }
  }

  return Array.from(detected)
}
```

---

## 🔒 Security Considerations

### Crawler Safety
- ✅ **Headless only** - No GUI, no user interaction
- ✅ **No form submissions** - Read-only analysis
- ✅ **No cookies persistence** - Incognito mode
- ✅ **No login attempts** - Public pages only
- ✅ **Timeout enforcement** - Max 60s per page
- ✅ **Resource limits** - Block unnecessary resources

### Resource Blocking (Performance Optimization)

```typescript
await page.route('**/*', (route) => {
  const url = route.request().url()

  // Block heavy resources we don't need
  if (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mp3') ||
    url.includes('youtube.com/embed')
  ) {
    route.abort()
  } else {
    route.continue()
  }
})
```

---

## ⚡ Performance Optimization

### Strategies:
1. **Parallel scanning (future)** - Multiple workers
2. **Resource blocking** - Skip videos, images (if not needed)
3. **Smart caching** - Cache results for 24h per domain
4. **Timeout tuning** - Adjust based on site complexity
5. **Incremental loading** - Don't wait for all resources

### Expected Performance:
- **Typical scan:** 5-15 seconds
- **Complex site:** 20-40 seconds
- **Timeout:** 60 seconds max

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test individual analyzers
describe('AIProviderDetector', () => {
  it('should detect Azure OpenAI from network logs', async () => {
    const mockResult = {
      responses: [
        { url: 'https://my-resource.openai.azure.com/openai/deployments' }
      ]
    }

    const analyzer = new AIProviderDetector()
    const result = await analyzer.analyze(mockResult)

    expect(result.metadata.providers).toContain('Azure OpenAI')
  })
})
```

### Integration Tests
```typescript
// Test full crawler + analyzer pipeline
describe('Full Scan Pipeline', () => {
  it('should scan OpenAI ChatGPT and detect OpenAI API', async () => {
    const crawler = new PlaywrightCrawler()
    const result = await crawler.crawl('https://chat.openai.com')

    const analyzer = new AIProviderDetector()
    const findings = await analyzer.analyze(result)

    expect(findings.metadata.providers).toContain('OpenAI')
  })
})
```

### Test Sites
- `chat.openai.com` - OpenAI detection
- `claude.ai` - Anthropic detection
- `badssl.com` - SSL issues
- `example.com` - Basic functionality

---

## 🚀 Implementation Plan

### Phase 1: Core Crawler (Day 1)
1. ✅ Install Playwright: `npm install playwright`
2. ✅ Run `npx playwright install chromium`
3. ✅ Create `PlaywrightCrawler` class
4. ✅ Implement basic navigation
5. ✅ Add network monitoring
6. ✅ Test with simple URL

### Phase 2: AI Provider Detection (Day 2)
1. ✅ Create `AIProviderDetector` analyzer
2. ✅ Implement pattern matching
3. ✅ Test with known AI sites
4. ✅ Update report generator

### Phase 3: AI Framework Detection (Day 3)
1. ✅ Create `AIFrameworkDetector` analyzer
2. ✅ Implement DOM/JS analysis
3. ✅ Test with framework examples

### Phase 4: Integration (Day 4-5)
1. ✅ Integrate all analyzers
2. ✅ Update worker to use real crawler
3. ✅ Add feature flag (mock vs real)
4. ✅ Update database schema
5. ✅ Update PDF generator

---

## 🔀 Mock vs Real Crawler Toggle

**Environment variable approach:**

```typescript
// .env
USE_REAL_CRAWLER=true  # Set to false for testing

// worker.ts
const crawler = process.env.USE_REAL_CRAWLER === 'true'
  ? new PlaywrightCrawler()
  : new MockCrawler()

const result = await crawler.crawl(url)
```

**Benefits:**
- Easy testing without real browser
- Faster CI/CD pipelines
- Localhost development without Playwright setup

---

## 📊 Data Flow

```
User submits URL
       ↓
Queue job created (BullMQ)
       ↓
Worker picks up job
       ↓
Playwright crawler launches
       ↓
Browser navigates to URL
       ↓
Network monitoring active
       ↓
Page loads (wait for network idle)
       ↓
Data collection:
  - HTML content
  - Cookies
  - Network logs
  - JS evaluation
       ↓
Close browser
       ↓
Run analyzer pipeline:
  1. AI Provider Detector
  2. AI Framework Detector
  3. Client AI Risk Analyzer
  4. SSL Analyzer
  5. Cookie Analyzer
  6. Header Analyzer
  7. Library Detector
  8. Server Analyzer
       ↓
Aggregate findings
       ↓
Calculate risk score
       ↓
Generate report structure
       ↓
Save to database
       ↓
Update scan status: COMPLETED
       ↓
User views results
```

---

## 🎯 Success Criteria

Sprint 4A is successful when:
- ✅ Playwright crawler works with real websites
- ✅ Network monitoring captures all requests/responses
- ✅ AI providers detected correctly (10+ providers)
- ✅ Scan completes in < 60 seconds for typical sites
- ✅ Error handling prevents crashes
- ✅ Results match or exceed mock crawler quality

---

**Next Steps:** Install Playwright and start Day 1 implementation! 🚀

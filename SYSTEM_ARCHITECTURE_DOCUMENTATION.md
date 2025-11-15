# AI Security Scanner - Complete System Architecture Documentation

**Last Updated**: 2025-11-15
**Version**: 2.0 (P1 Detection Complete)
**Purpose**: Complete technical reference for debugging, maintenance, and feature development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Frontend Layer (Report Page → Homepage)](#3-frontend-layer)
4. [API Layer (Next.js Routes)](#4-api-layer)
5. [Worker System (Background Processing)](#5-worker-system)
6. [Analyzer Layer (Security Detection)](#6-analyzer-layer)
7. [Database Layer (Prisma + SQLite)](#7-database-layer)
8. [Crawler Layer (Playwright)](#8-crawler-layer)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Troubleshooting Guide](#10-troubleshooting-guide)
11. [Deployment & Operations](#11-deployment--operations)

---

## 1. Executive Summary

### What is this system?

The **AI Security Scanner** is a Next.js-based web application that automatically scans websites for security vulnerabilities with a special focus on AI-specific risks (OWASP LLM Top 10). It uses Playwright to crawl websites, analyzes collected data through multiple detection modules, and presents findings in a comprehensive report.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (React) + TypeScript + Tailwind CSS | Server-side rendering, UI components |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **Job Queue** | BullMQ + Redis | Background job processing |
| **Database** | Prisma + SQLite | Scan storage and retrieval |
| **Crawler** | Playwright (Chromium) | Website crawling and network monitoring |
| **AI Detection** | 60+ custom pattern matchers | Security vulnerability detection |

### Key Architecture Decisions

1. **Monolithic Next.js Application**: Frontend and backend in one repo for simplicity
2. **Background Worker Pattern**: Scans run asynchronously to avoid blocking HTTP requests
3. **SQLite for Development**: Easy setup, no external database required
4. **Pattern-Based Detection**: No AI/ML models - pure regex and heuristics for reliability
5. **Modular Analyzers**: Each security category is a separate detector module

### Current Detection Coverage

- ✅ **P0 Detectors (20 services)**: Voice AI, Translation, Search, LLM APIs, Personalization, Analytics
- ✅ **P1 Detectors (23 NEW services)**: Image/Video AI, Content Moderation, Extended LLM APIs
- ✅ **OWASP LLM Top 10**: LLM01, LLM02, LLM05, LLM06, LLM07, LLM08
- ✅ **Traditional Security**: SSL, Headers, Cookies, CORS, DNS, Ports, etc.
- ✅ **Technology Stack Detection**: 100+ technologies via Wappalyzer patterns

---

## 2. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                         │
│  - Homepage (URL input)                                      │
│  - Report Page (/scan/[id]/page.tsx)                         │
│  - Components (AiTrustScore, FindingCard, etc.)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API LAYER (Next.js Routes)                  │
│  - POST /api/scan (create scan)                              │
│  - GET /api/scan/[id] (retrieve scan)                        │
│  - GET /api/knowledge-base                                   │
│  - POST /api/leads                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (Prisma + SQLite)                      │
│  Models: Scan, Job, Lead                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              JOB QUEUE (BullMQ + Redis)                      │
│  Queue: security-scans                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 WORKER (Background Process)                  │
│  - Processes jobs from queue                                 │
│  - Orchestrates scanning pipeline                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CRAWLER (Playwright Chromium)                   │
│  - Navigates to URL                                          │
│  - Intercepts network requests                               │
│  - Extracts scripts, cookies, headers                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ANALYZER LAYER (60+ Detectors)                  │
│  - OWASP LLM Detectors (6 modules)                           │
│  - AI Service Detectors (Voice, Image, LLM, etc.)           │
│  - Traditional Security (SSL, Headers, Cookies)              │
│  - Technology Stack (Wappalyzer integration)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                FINAL REPORT (JSON)                           │
│  - Risk score (0-100)                                        │
│  - Security findings by category                             │
│  - Detected technologies                                     │
│  - AI Trust Scorecard                                        │
└─────────────────────────────────────────────────────────────┘
```

### Request Lifecycle (User → Report)

1. **User inputs URL** on homepage → `POST /api/scan`
2. **API creates Scan record** in database (status: PENDING)
3. **API queues job** in BullMQ with scanId
4. **API returns scanId** to user → redirects to `/scan/{scanId}`
5. **Report page polls** `GET /api/scan/{scanId}` every 2 seconds
6. **Worker picks up job** from queue (status: SCANNING)
7. **Worker launches Playwright** → crawls target URL
8. **Crawler collects data** (HTML, scripts, network requests, cookies)
9. **Analyzers process data** → generate findings
10. **Worker saves results** to database (status: COMPLETED)
11. **Frontend displays** complete report to user

---

## 3. Frontend Layer

### 3.1 Report Page: `/scan/[id]/page.tsx`

**File**: `src/app/scan/[id]/page.tsx` (1383 lines)

**Purpose**: Main scan report UI - displays security findings, risk score, and detected technologies

**Key Components**:

#### State Management (Lines 213-241)
```typescript
const [scan, setScan] = useState<Scan | null>(null)        // Scan data from API
const [loading, setLoading] = useState(true)               // Loading state
const [error, setError] = useState('')                     // Error message
const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([])
const [showLeadModal, setShowLeadModal] = useState(false)  // Lead capture modal
const [regenerating, setRegenerating] = useState(false)    // Regenerate button state
```

#### Data Fetching (Lines 364-384)
```typescript
const fetchScan = async () => {
  const response = await fetch(`/api/scan/${scanId}`)
  const data = await response.json()
  setScan(data)

  // Poll every 2 seconds if not completed
  const interval = setInterval(() => {
    if (scan?.status !== 'COMPLETED' && scan?.status !== 'FAILED') {
      fetchScan()
    }
  }, 2000)
}
```

**Location**: Line 258-263
**Behavior**: Fetches scan status every 2 seconds until COMPLETED or FAILED

#### API Endpoints Called

| Endpoint | Purpose | Called From Line |
|----------|---------|------------------|
| `GET /api/scan/{scanId}` | Fetch scan status/results | 366 |
| `GET /api/knowledge-base` | Fetch E-E-A-T content | 342 |
| `GET /api/settings` | Fetch Twitter handle | 354 |
| `POST /api/scan` | Create new scan | 420, 447 |
| `POST /api/leads` | Save lead capture | 391 |

#### Critical UI Sections

1. **Risk Score Card** (Lines 668-698)
   - Displays overall score (0-100)
   - Grade (A+ to F)
   - Risk level badge (LOW/MEDIUM/HIGH/CRITICAL)
   - Issue count breakdown

2. **AI Trust Scorecard** (Lines 700-717)
   - Only shown if `scan.aiTrustScorecard` exists
   - Displays AI-specific security metrics
   - Component: `<AiTrustScore />`

3. **AI Detection Section** (Lines 720-785)
   - Prioritized first (before other categories)
   - Shows detected AI technologies
   - Lists AI-specific security findings

4. **Technology Stack** (Lines 788-891)
   - Grouped by category (CMS, E-commerce, Analytics, etc.)
   - Confidence levels (HIGH/MEDIUM/LOW)
   - Version detection

5. **Security Findings by Category** (Lines 894-951)
   - OWASP LLM categories shown first
   - Each category has icon, title, explanation
   - Expandable findings with E-E-A-T content

#### SEO & Meta Tags (Lines 268-338)

**Purpose**: Dynamic meta tags based on scan results for social sharing

**Key Features**:
- Updates `<title>` tag: `{Domain} AI Security Scan - Score {score}/100 (${grade})`
- Open Graph tags for Facebook/LinkedIn
- Twitter Card tags (if enabled in settings)
- Robots meta: `index, follow`

**Location**: Line 268
**Trigger**: useEffect when scan data loads

#### Troubleshooting

**Problem**: Page shows "Loading..." forever

**Debug Steps**:
1. Check browser DevTools Network tab → `GET /api/scan/{scanId}` status
2. If 404: Scan doesn't exist in database
3. If 200 but status=PENDING: Worker not running
4. Check worker logs: `npm run worker` output
5. Check database: `sqlite3 prisma/dev.db "SELECT * FROM Scan WHERE id='...';"`

**Problem**: Report shows no findings but scan completed

**Debug Steps**:
1. Check `scan.findings` in API response
2. If null: Analyzer failed silently
3. Check worker logs for errors during analysis
4. Check `scan.metadata` in AdminDebugBar (admin only)

---

### 3.2 Homepage: `src/app/page.tsx`

**File**: `src/app/page.tsx`

**Purpose**: Landing page with URL input form

**Key Features**:
- URL validation (must be valid HTTP/HTTPS)
- Creates scan via `POST /api/scan`
- Redirects to `/scan/{scanId}` on success

**Troubleshooting**:
- If scan creation fails: Check Redis connection
- If redirect doesn't work: Check API response includes `scanId`

---

### 3.3 Key Components

#### `<AiTrustScore />` - AI Trust Scorecard Display

**File**: `src/components/AiTrustScore.tsx`

**Purpose**: Displays comprehensive AI security scorecard with category breakdowns

**Props**:
```typescript
interface AiTrustScoreProps {
  score: number                    // Overall AI Trust Score (0-100)
  weightedScore: number            // Weighted score
  categoryScores: CategoryScores   // Breakdown by category
  passedChecks: number             // Number of passed checks
  totalChecks: number              // Total checks performed
  detectedAiProvider?: string      // Detected AI provider
  detectedModel?: string           // Detected model
  hasAiImplementation: boolean     // Whether AI was detected
  summary: {
    message: string
    strengths: string[]
    weaknesses: string[]
    criticalIssues: string[]
  }
}
```

**Rendering Logic**:
- If `!hasAiImplementation`: Shows "No AI detected" message
- If `hasAiImplementation`: Shows full scorecard with:
  - Overall score gauge
  - Category scores (Transparency, Security, Privacy, etc.)
  - Strengths/weaknesses summary
  - Critical issues list

**Location**: Imported and used in `/scan/[id]/page.tsx` at line 703

---

### 3.4 Admin Debug Bar

**File**: `src/app/scan/[id]/AdminDebugBar.tsx`

**Purpose**: Shows raw crawler metadata for debugging (admin-only)

**Authentication**: Checks `localStorage.getItem('admin_auth') === 'authenticated'`

**Display**:
- Crawler metadata (network requests, scripts, cookies)
- Raw JSON toggle
- Only visible to authenticated admins

---

## 4. API Layer

### 4.1 POST /api/scan - Create New Scan

**File**: `src/app/api/scan/route.ts`

**Purpose**: Creates new scan and queues background job

**Request**:
```json
POST /api/scan
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response (Success)**:
```json
{
  "scanId": "uuid-here",
  "message": "Scan queued successfully"
}
```

**Response (Error)**:
```json
{
  "error": "Invalid URL format"
}
```

**Implementation Flow**:

1. **Validate URL** (must be valid HTTP/HTTPS)
2. **Create Scan record** in database:
   ```typescript
   const scan = await prisma.scan.create({
     data: {
       url: normalizedUrl,
       status: 'PENDING',
     }
   })
   ```
3. **Queue job** in BullMQ:
   ```typescript
   await securityScanQueue.add('scan-website', {
     scanId: scan.id,
     url: scan.url,
   })
   ```
4. **Return scanId** to frontend

**Troubleshooting**:
- Error: "Redis connection failed" → Check Redis server
- Error: "Database locked" → SQLite concurrency issue, restart server
- Job not processing → Check worker is running: `npm run worker`

---

### 4.2 GET /api/scan/[id] - Retrieve Scan Results

**File**: `src/app/api/scan/[id]/route.ts`

**Purpose**: Returns scan status and results (if completed)

**Request**:
```
GET /api/scan/{scanId}
```

**Response (PENDING)**:
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "status": "PENDING",
  "createdAt": "2025-11-15T10:00:00Z"
}
```

**Response (COMPLETED)**:
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "status": "COMPLETED",
  "riskScore": 75,
  "riskLevel": "MEDIUM",
  "findings": {
    "summary": { ... },
    "findings": [ ... ],
    "detectedTech": { ... },
    "techStack": { ... }
  },
  "aiTrustScorecard": { ... },
  "metadata": { ... },
  "completedAt": "2025-11-15T10:05:23Z"
}
```

**Implementation**:

```typescript
const scan = await prisma.scan.findUnique({
  where: { id: scanId }
})

// Parse JSON fields
const findings = scan.findings ? JSON.parse(scan.findings) : null
const metadata = scan.metadata ? JSON.parse(scan.metadata) : null
const aiTrustScorecard = scan.aiTrustScorecard ? JSON.parse(scan.aiTrustScorecard) : null

return NextResponse.json({
  ...scan,
  findings,
  metadata,
  aiTrustScorecard,
})
```

**Troubleshooting**:
- 404 Not Found → Scan doesn't exist in database
- `findings` is null → Worker hasn't completed yet OR analyzer failed
- JSON parse error → Corrupted data in database

---

### 4.3 GET /api/knowledge-base - E-E-A-T Content

**File**: `src/app/api/knowledge-base/route.ts`

**Purpose**: Returns professional security explanations for findings

**Response**:
```json
[
  {
    "findingKey": "missing-content-security-policy",
    "category": "security",
    "severity": "high",
    "title": "Missing Content-Security-Policy Header",
    "explanation": "CSP is a security layer that helps detect and mitigate certain types of attacks...",
    "impact": "Without CSP, your website is vulnerable to XSS attacks...",
    "solution": "Add a Content-Security-Policy header to your HTTP responses...",
    "references": ["https://developer.mozilla.org/..."]
  }
]
```

**Usage**: Frontend matches findings to knowledge base entries by `findingKey`

---

### 4.4 POST /api/leads - Lead Capture

**File**: `src/app/api/leads/route.ts`

**Purpose**: Saves lead information when user requests manual audit

**Request**:
```json
POST /api/leads

{
  "scanId": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Implementation**:
```typescript
await prisma.lead.create({
  data: {
    scanId,
    email,
    name,
  }
})
```

---

## 5. Worker System

### 5.1 Worker Architecture

**File**: `src/worker/index.ts`

**Purpose**: Background process that picks up scan jobs and orchestrates the scanning pipeline

**Startup Command**:
```bash
npm run worker
# or
npx tsx src/worker/index.ts
```

**Dependencies**:
- BullMQ (job queue client)
- Redis (job queue storage)
- Prisma (database access)
- Playwright (web crawling)

### 5.2 Job Queue (BullMQ)

**Queue Name**: `security-scans`

**Connection**:
```typescript
const securityScanQueue = new Queue('security-scans', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }
})
```

**Job Data Structure**:
```typescript
{
  scanId: string    // UUID from Scan table
  url: string       // URL to scan
}
```

### 5.3 Worker Process Flow

**Main Loop** (src/worker/index.ts):

```typescript
const worker = new Worker('security-scans', async (job) => {
  const { scanId, url } = job.data

  try {
    // 1. Update scan status to SCANNING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'SCANNING' }
    })

    // 2. Crawl website with Playwright
    const crawlResult = await crawlWebsite(url)

    // 3. Analyze collected data
    const report = await analyzeWebsite(crawlResult)

    // 4. Calculate AI Trust Score
    const aiTrustScorecard = analyzeAiTrust(crawlResult)

    // 5. Save results to database
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        riskScore: report.summary.riskScore.score,
        riskLevel: report.summary.riskScore.level,
        findings: JSON.stringify(report),
        aiTrustScorecard: JSON.stringify(aiTrustScorecard),
        metadata: JSON.stringify(crawlResult),
        completedAt: new Date(),
      }
    })

  } catch (error) {
    // Mark scan as FAILED
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'FAILED' }
    })
    throw error
  }
}, {
  connection: { host: 'localhost', port: 6379 }
})
```

### 5.4 Error Handling & Retries

**BullMQ Configuration**:
```typescript
{
  attempts: 3,              // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',
    delay: 5000             // 5s, 10s, 20s
  }
}
```

**Failure Scenarios**:
1. **Crawler timeout**: Playwright navigation timeout (30s default)
2. **Network error**: Target website unreachable
3. **Analyzer crash**: Unhandled exception in detection logic
4. **Database error**: SQLite locked or connection failed

**Troubleshooting**:

| Symptom | Cause | Fix |
|---------|-------|-----|
| Worker not processing jobs | Redis not running | `redis-server` |
| All scans stuck in PENDING | Worker not started | `npm run worker` |
| Scans fail with timeout | Website too slow | Increase Playwright timeout |
| Worker crashes repeatedly | Playwright browser issue | `npx playwright install chromium` |

---

## 6. Analyzer Layer

### 6.1 Master Orchestrator: `ai-trust-analyzer.ts`

**File**: `src/worker/analyzers/ai-trust-analyzer.ts` (~1200 lines)

**Purpose**: Coordinates all detection modules and generates final AI Trust Scorecard

**Main Export**:
```typescript
export function analyzeAiTrust(crawlResult: CrawlResult): AiTrustResult
```

**Input** (`CrawlResult`):
```typescript
{
  url: string
  html: string                    // Page HTML
  scripts: string[]               // External script URLs
  inlineScripts: string[]         // Inline <script> content
  networkRequests: Array<{        // Captured HTTP requests
    url: string
    method: string
    headers: Record<string, string>
    postData?: string
  }>
  cookies: Array<{                // Cookies set by page
    name: string
    value: string
    domain: string
    path: string
    secure: boolean
    httpOnly: boolean
    sameSite?: string
  }>
  responseHeaders: Record<string, string>
}
```

**Output** (`AiTrustResult`):
```typescript
{
  score: number                   // 0-100
  weightedScore: number
  categoryScores: {
    transparency: number          // 0-100
    security: number
    privacy: number
    fairness: number
    reliability: number
    accountability: number
  }
  passedChecks: number
  totalChecks: number
  detectedAiProvider?: string
  detectedModel?: string
  hasAiImplementation: boolean

  // Extended AI Detections (P0 + P1)
  voiceAI?: { ... }
  translationAI?: { ... }
  searchAI?: { ... }
  personalizationAI?: { ... }
  analyticsAI?: { ... }
  imageVideoAI?: { ... }          // NEW P1
  contentModeration?: { ... }     // NEW P1

  summary: {
    message: string
    strengths: string[]
    weaknesses: string[]
    criticalIssues: string[]
  }
}
```

**Detection Flow** (Line 874-880):

```typescript
// STEP 0.5: EXTENDED AI DETECTION (P0 + P1)
const voiceAIResult = detectVoiceAI(crawlResult)
const translationAIResult = detectTranslationAI(crawlResult)
const searchAIResult = detectSearchAI(crawlResult)
const personalizationAIResult = detectPersonalizationAI(crawlResult)
const analyticsAIResult = detectAnalyticsAI(crawlResult)
const imageVideoAIResult = detectImageVideoAI(crawlResult)        // P1
const contentModerationResult = detectContentModeration(crawlResult)  // P1
```

**Category Scoring** (Lines 882-1100):

Each category (Transparency, Security, Privacy, etc.) has:
- Multiple pattern checks
- Weighted scoring
- Pass/fail tracking
- Evidence collection

Example - Transparency Category:
```typescript
const transparency = {
  isProviderDisclosed: checkPatternsInText(html, TRANSPARENCY_PATTERNS.providerDisclosed),
  isIdentityDisclosed: checkPatternsInText(html, TRANSPARENCY_PATTERNS.identityDisclosed),
  isAiPolicyLinked: checkPatternsInText(html, TRANSPARENCY_PATTERNS.aiPolicyLinked),
  hasExplainableAI: checkPatternsInText(html, TRANSPARENCY_PATTERNS.explainableAI),
}

const transparencyScore = calculateCategoryScore(transparency)
```

**Final Score Calculation** (Lines 1120-1140):

```typescript
const categoryWeights = {
  transparency: 0.15,
  security: 0.30,        // Highest weight
  privacy: 0.25,
  fairness: 0.10,
  reliability: 0.10,
  accountability: 0.10,
}

const weightedScore = Object.entries(categoryScores)
  .reduce((sum, [cat, score]) => sum + score * categoryWeights[cat], 0)
```

---

### 6.2 P1 Detectors (NEW - November 2025)

#### 6.2.1 Image/Video AI Detector

**File**: `src/worker/analyzers/image-video-ai-detector.ts` (15 services)

**Purpose**: Detects generative AI services (Stability AI, Midjourney, DALL-E) and image processing AI

**Detection Methods**:
1. **API Endpoint Monitoring**: Network requests to known AI endpoints
2. **SDK Script Detection**: CDN URLs for AI SDKs
3. **API Key Pattern Matching**: Entropy-based validation
4. **Global Object Detection**: `window.Replicate`, etc.

**Detected Services** (15 total):
- **Generative AI**: Stability AI, Midjourney, DALL-E 3, Runway ML
- **Image Processing**: Cloudinary AI, Imgix AI, Cloudflare Images
- **Computer Vision**: Amazon Rekognition, Google Cloud Vision, Clarifai
- **Video AI**: Runway ML (video), Synthesia, Lumen5
- **Platforms**: Replicate

**Example Pattern**:
```typescript
{
  provider: 'Stability AI (Stable Diffusion)',
  category: 'Image AI (Generation)',
  endpoints: [
    'api.stability.ai/v1/generation/',
    'api.stability.ai/v1/user/balance',
  ],
  authHeaderPatterns: [
    /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{40,})/i,
  ],
  attackSurface: [
    'NSFW filter bypass',
    'Negative prompt injection',
    'Model weight extraction',
    'API key exposure (CRITICAL)',
  ],
  riskLevel: 'HIGH',
  isGenerative: true,
}
```

**Output**:
```typescript
{
  hasImageVideoAI: boolean,
  detections: Array<{
    provider: string,
    category: 'Image AI (Generation)' | 'Image AI (Processing)' | 'Video AI',
    confidence: 'HIGH' | 'MEDIUM' | 'LOW',
    endpoints: string[],
    apiKeyMasked?: string,
    attackSurface: string[],
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  }>,
  totalProviders: number,
  generativeAIDetected: boolean,
}
```

**Integration Point**: `ai-trust-analyzer.ts:879`

**Security Focus**:
- NSFW filter bypass detection
- Deepfake generation risk
- Prompt injection vulnerabilities
- API key exposure (CRITICAL)

---

#### 6.2.2 Content Moderation Detector

**File**: `src/worker/analyzers/content-moderation-detector.ts` (6 services)

**Purpose**: Detects AI-powered content moderation APIs (toxicity, NSFW, hate speech)

**Detected Services** (6 total):
- OpenAI Moderation API
- Perspective API (Google Jigsaw)
- Azure Content Moderator
- AWS Rekognition Moderation
- Hive Moderation
- reCAPTCHA v3

**Example Pattern**:
```typescript
{
  provider: 'OpenAI Moderation API',
  endpoints: [
    'api.openai.com/v1/moderations',
  ],
  authHeaderPatterns: [
    /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{48,})/i,
  ],
  attackSurface: [
    'Moderation bypass attempts',
    'False positive exploitation',
    'Category threshold manipulation',
    'Hate speech detection bypass',
  ],
  riskLevel: 'HIGH',
}
```

**Output**:
```typescript
{
  hasContentModeration: boolean,
  detections: Array<{
    provider: string,
    category: 'Content Moderation AI',
    confidence: 'HIGH' | 'MEDIUM' | 'LOW',
    endpoints: string[],
    apiKeyMasked?: string,
    attackSurface: string[],
  }>,
  totalProviders: number,
  highConfidenceCount: number,
}
```

**Integration Point**: `ai-trust-analyzer.ts:880`

**Security Focus**:
- Moderation bypass detection
- False positive exploitation
- Toxicity threshold manipulation
- Category detection evasion

---

(Continued in next message due to length...)
### 6.3 P0 Detectors (Existing - October 2025)

#### 6.3.1 Voice AI Detector

**File**: `src/worker/analyzers/voice-ai-detector.ts`

**Services**: 12 total (4 P0 + 5 P1 + 3 P2)
- **P0**: Deepgram, AssemblyAI, ElevenLabs, Google Cloud Speech-to-Text
- **P1**: Google Cloud TTS, Amazon Transcribe, Amazon Polly, Azure Speech, Rev.ai
- **P2**: Speechmatics, OpenAI Whisper, Play.ht

**Detection**: API endpoints, SDK scripts, API key patterns

---

#### 6.3.2 LLM API Detector

**File**: `src/worker/analyzers/llm-api-detector.ts`

**Services**: 15 total (13 P0 + 2 P1)
- **P0**: OpenAI, Anthropic, Cohere, Google Gemini, Hugging Face, Replicate, Azure OpenAI, AWS Bedrock, Vertex AI, Together AI, Perplexity, Mistral, Groq
- **P1**: Anyscale, Fireworks AI (NEW)

**Detection**: API endpoint monitoring, API key pattern matching (provider-specific prefixes like `sk-`, `pplx-`, `gsk-`)

---

#### 6.3.3 OWASP LLM06 Detector (Sensitive Information Disclosure)

**File**: `src/worker/analyzers/owasp-llm06-detector.ts`

**Purpose**: Detects exposed secrets, PII, and proprietary AI data in client-side code

**Detection Patterns**:
1. **API Keys**: OpenAI (`sk-`), Anthropic (`sk-ant-`), Google (`AIza`)
2. **PII**: Emails, phone numbers, SSNs
3. **System Prompts**: Embedded in JavaScript
4. **Internal Endpoints**: Private API URLs
5. **Model Configurations**: Hyperparameters, pricing

**Entropy Analysis**: Validates potential secrets using Shannon entropy calculation

**Output**:
```typescript
{
  hasLLM06Risk: boolean,
  findings: Array<{
    type: 'API Key' | 'PII' | 'System Prompt' | ...,
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM',
    masked: string,       // First 8 + last 4 chars
    confidence: number,   // 0-1
    location: string,     // URL or script tag
  }>,
  totalFindings: number,
  criticalCount: number,
}
```

---

### 6.4 Traditional Security Analyzers

#### 6.4.1 Main Security Analyzer

**File**: `src/worker/analyzers/security-analyzer.ts`

**Categories Analyzed**:

1. **Security Headers**
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security
   - X-XSS-Protection
   - Referrer-Policy
   - Permissions-Policy

2. **SSL/TLS**
   - HTTPS enforcement
   - Certificate validity (expiration date)
   - Self-signed certificates
   - Mixed content detection

3. **Cookies**
   - HttpOnly flag
   - Secure flag
   - SameSite attribute

4. **Client-Side Risks**
   - Exposed API keys in HTML/JS
   - Hardcoded credentials
   - Sensitive data in localStorage

**Output**: Array of findings with `{ category, severity, title, description, impact, recommendation }`

---

#### 6.4.2 Technology Stack Detector

**File**: `src/worker/analyzers/tech-stack-detector.ts`

**Purpose**: Detects 100+ technologies using Wappalyzer-style patterns

**Categories**:
- CMS (WordPress, Drupal, Joomla)
- E-commerce (Shopify, WooCommerce, Magento)
- Analytics (Google Analytics, Mixpanel, Segment)
- Advertising (Google Ads, Facebook Pixel)
- CDN (Cloudflare, Fastly, Akamai)
- Social (Facebook SDK, Twitter Widgets)
- Frameworks (React, Vue, Angular, Next.js)
- Hosting (Vercel, Netlify, AWS)

**Detection Methods**:
- Script URL patterns
- Global JavaScript objects (`window.dataLayer`, `window.ga`)
- Meta tags (`generator`, `application-name`)
- HTTP response headers (`Server`, `X-Powered-By`)

**Output**:
```typescript
{
  totalCount: number,
  categories: {
    cms: Array<{ name, version?, confidence, evidence }>,
    ecommerce: [...],
    analytics: [...],
    // ... 8 categories total
  }
}
```

---

## 7. Database Layer

### 7.1 Prisma Schema Overview

**File**: `prisma/schema.prisma` (252 lines)

**Database**: SQLite (development), PostgreSQL (production-ready)

**Models**:

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Scan** | Stores scan requests and results | `id`, `url`, `status`, `riskScore`, `findings` (JSON) |
| **AiTrustScorecard** | AI-specific security scorecard | `scanId` (1:1), `score`, 27 boolean checks |
| **Lead** | Lead capture from manual audit requests | `email`, `name`, `scanId`, `leadScore` |
| **Job** | BullMQ job tracking (legacy) | `type`, `data` (JSON), `status` |
| **KnowledgeBaseFinding** | E-E-A-T content for findings | `findingKey`, `explanation`, `impact`, `solution` |
| **SiteSettings** | Global settings (single row) | `twitterHandle`, `enableTwitterCards`, etc. |

---

### 7.2 Scan Model

**Critical Fields**:

```prisma
model Scan {
  id            String   @id @default(uuid())
  url           String
  status        String   @default("PENDING") // PENDING, SCANNING, COMPLETED, FAILED

  // Results (stored as JSON strings)
  riskScore     Int?
  riskLevel     String? // LOW, MEDIUM, HIGH, CRITICAL
  findings      String? // JSON: Full scan report
  metadata      String? // JSON: Raw crawler data
  aiTrustScorecard String? // JSON: AI Trust Score

  // Timestamps
  createdAt     DateTime @default(now())
  completedAt   DateTime?
}
```

**JSON Fields**:

1. **findings** (String → JSON):
   ```json
   {
     "summary": { "riskScore": {...}, "criticalIssues": 5, ... },
     "findings": [ { "category": "ssl", "severity": "high", ... } ],
     "detectedTech": { "aiProviders": [...], "chatWidgets": [...] },
     "techStack": { "totalCount": 15, "categories": {...} }
   }
   ```

2. **metadata** (String → JSON):
   ```json
   {
     "url": "https://example.com",
     "html": "<html>...</html>",
     "networkRequests": [ { "url": "...", "method": "GET" } ],
     "scripts": [ "https://cdn.example.com/script.js" ],
     "cookies": [ { "name": "session", "secure": true } ],
     "responseHeaders": { "content-security-policy": "..." },
     "sslCertificate": { "valid": true, "issuer": "...", "validTo": "..." }
   }
   ```

3. **aiTrustScorecard** (String → JSON):
   Full AI Trust Score result from `analyzeAiTrust()`

---

### 7.3 Database Queries (Troubleshooting)

**Check scan status**:
```bash
sqlite3 prisma/dev.db "SELECT id, url, status, riskScore FROM Scan ORDER BY createdAt DESC LIMIT 10;"
```

**Find failed scans**:
```bash
sqlite3 prisma/dev.db "SELECT id, url, createdAt FROM Scan WHERE status='FAILED';"
```

**Check scan details**:
```bash
sqlite3 prisma/dev.db "SELECT findings FROM Scan WHERE id='<scanId>';" | jq '.'
```

**Count scans by status**:
```bash
sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM Scan GROUP BY status;"
```

**Delete old scans** (cleanup):
```bash
sqlite3 prisma/dev.db "DELETE FROM Scan WHERE createdAt < datetime('now', '-7 days');"
```

---

### 7.4 Prisma Migrations

**Generate migration** (after schema changes):
```bash
npx prisma migrate dev --name add_new_field
```

**Apply migrations** (production):
```bash
npx prisma migrate deploy
```

**Reset database** (development only - deletes all data):
```bash
npx prisma migrate reset
```

**Generate Prisma Client** (after schema changes):
```bash
npx prisma generate
```

---

## 8. Crawler Layer

### 8.1 Architecture

**Components**:
1. **PlaywrightCrawler** (`src/lib/playwright-crawler.ts`) - Real browser automation
2. **CrawlerAdapter** (`src/lib/crawler-adapter.ts`) - Converts Playwright output to standardized format
3. **MockCrawler** (`src/worker/crawler-mock.ts`) - Testing/fallback interface

**Flow**:
```
Worker → CrawlerAdapter → PlaywrightCrawler → Chromium → Target Website
                              ↓
                          CrawlResult
                              ↓
                         Analyzers
```

---

### 8.2 Playwright Crawler

**File**: `src/lib/playwright-crawler.ts`

**Configuration**:
```typescript
{
  timeout: 60000,              // 60s max per page
  captureScreenshot: false,    // Disabled for performance
  evaluateJavaScript: true,    // Execute JS for SPA rendering
}
```

**What It Captures**:

1. **HTML Content** (`html`)
   - Full page HTML after JS execution
   - Includes dynamically loaded content

2. **Network Requests** (`responses[]`)
   - All HTTP requests made by page
   - Resource type (script, stylesheet, xhr, document)
   - Status codes
   - Response headers

3. **Cookies** (`cookies[]`)
   - All cookies set by page
   - Secure/HttpOnly/SameSite flags
   - Expiration dates

4. **SSL Certificate** (`sslCertificate`)
   - Issuer
   - Subject
   - Valid from/to dates
   - Serial number

5. **Timing** (`loadTime`, `timingBreakdown`)
   - Total load time
   - DNS lookup
   - TCP connection
   - TLS handshake
   - First byte
   - DOM loaded
   - Load complete

**Network Request Interception**:
```typescript
page.on('response', async (response) => {
  responses.push({
    url: response.url(),
    statusCode: response.status(),
    resourceType: response.request().resourceType(),
    headers: await response.allHeaders(),
  })
})
```

**Cookie Extraction**:
```typescript
const cookies = await context.cookies()
```

---

### 8.3 Crawler Adapter

**File**: `src/lib/crawler-adapter.ts`

**Purpose**: Converts Playwright's detailed output to simplified `CrawlResult` format expected by analyzers

**Key Conversions**:

1. **Network Requests**:
   ```typescript
   networkRequests: playwrightResult.responses.map((response) => ({
     url: response.url,
     method: 'GET', // Default (Playwright responses don't track method)
     resourceType: response.resourceType || 'other',
     status: response.statusCode,
   }))
   ```

2. **Scripts**:
   ```typescript
   scripts: playwrightResult.responses
     .filter((r) => r.resourceType === 'script' || r.resourceType === 'stylesheet')
     .map((r) => r.url)
   ```

3. **Response Headers** (from main HTML response):
   ```typescript
   const mainResponse = result.responses.find(
     (r) => r.url === result.finalUrl || r.resourceType === 'document'
   )
   return mainResponse?.headers || {}
   ```

**Why Adapter Exists**:
- Original codebase used MockCrawler interface
- Migrated to real Playwright but kept interface compatibility
- Allows swapping crawler implementations without changing analyzers

---

### 8.4 Troubleshooting Crawler Issues

**Problem**: Playwright timeout errors

**Debug**:
```bash
# Check if Chromium is installed
npx playwright install chromium

# Increase timeout in playwright-crawler.ts
timeout: 120000, // 2 minutes
```

**Problem**: "Browser not found" error

**Fix**:
```bash
npx playwright install --with-deps chromium
```

**Problem**: Crawler hangs on specific websites

**Debug**:
1. Check if website blocks automation: `User-Agent` detection
2. Enable `headless: false` to see what's happening
3. Check for cookie consent banners blocking interaction
4. Try different viewport size

**Problem**: Missing network requests

**Cause**: Playwright may miss very fast requests
**Fix**: Add delay before closing browser:
```typescript
await page.waitForTimeout(2000) // Wait 2s for lazy-loaded resources
```

---

## 9. Data Flow Diagrams

### 9.1 Complete Request Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER SUBMITS URL (Frontend)                              │
│    Homepage → <form onSubmit>                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. API CREATES SCAN (POST /api/scan)                        │
│    - Validate URL                                            │
│    - Create Scan record (status: PENDING)                   │
│    - Queue BullMQ job                                        │
│    - Return scanId                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. FRONTEND REDIRECTS (/scan/{scanId})                      │
│    - Page polls GET /api/scan/{scanId} every 2s             │
│    - Shows "Loading..." spinner                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼ (parallel)
┌──────────────────────────────────────────────────────────────┐
│ 4. WORKER PICKS UP JOB (Background)                         │
│    - Dequeues job from BullMQ                                │
│    - Updates Scan status: SCANNING                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. CRAWLER SCRAPES WEBSITE (Playwright)                     │
│    - Launch Chromium                                         │
│    - Navigate to URL                                         │
│    - Intercept network requests                              │
│    - Extract HTML, scripts, cookies, headers                 │
│    - Close browser                                           │
│    Duration: 10-30 seconds                                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. ANALYZERS PROCESS DATA (60+ Detectors)                   │
│    A. AI Trust Analyzer (master)                            │
│       - Calls 8 AI service detectors                         │
│       - Calculates AI Trust Score                            │
│    B. OWASP LLM Detectors (6 modules)                       │
│    C. Security Analyzer                                      │
│    D. Technology Stack Detector                              │
│    Duration: 5-15 seconds                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. WORKER SAVES RESULTS (Database)                          │
│    - Update Scan record                                      │
│    - Set status: COMPLETED                                   │
│    - Save findings (JSON)                                    │
│    - Save aiTrustScorecard (JSON)                            │
│    - Save metadata (JSON)                                    │
│    - Set completedAt timestamp                               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. FRONTEND RECEIVES COMPLETED DATA                         │
│    - Next poll returns status: COMPLETED                     │
│    - Stop polling                                            │
│    - Render full report                                      │
│    - Show AI Trust Score, findings, tech stack              │
└──────────────────────────────────────────────────────────────┘
```

**Total Duration**: 20-60 seconds (depending on target website)

---

### 9.2 Worker Processing Pipeline

```
Job Dequeued
    │
    ├─→ Update Scan (status: SCANNING)
    │
    ├─→ CrawlerAdapter.crawl(url)
    │       │
    │       ├─→ PlaywrightCrawler.crawl(url)
    │       │       │
    │       │       ├─→ Launch Chromium
    │       │       ├─→ Navigate to URL
    │       │       ├─→ Intercept network requests
    │       │       ├─→ Extract cookies
    │       │       ├─→ Get SSL certificate
    │       │       └─→ Return CrawlerResult
    │       │
    │       └─→ Convert to CrawlResult (adapter)
    │
    ├─→ analyzeWebsite(crawlResult)
    │       │
    │       ├─→ securityAnalyzer.analyze()
    │       ├─→ techStackDetector.detect()
    │       └─→ Return ScanReport
    │
    ├─→ analyzeAiTrust(crawlResult)
    │       │
    │       ├─→ detectVoiceAI()
    │       ├─→ detectTranslationAI()
    │       ├─→ detectSearchAI()
    │       ├─→ detectPersonalizationAI()
    │       ├─→ detectAnalyticsAI()
    │       ├─→ detectImageVideoAI()      // P1
    │       ├─→ detectContentModeration() // P1
    │       ├─→ detectLLMAPIs()
    │       ├─→ detectOWASPLLM06()
    │       └─→ Return AiTrustResult
    │
    └─→ Update Scan (status: COMPLETED, save results)
```

---

## 10. Troubleshooting Guide

### 10.1 By Symptom

#### Symptom: Scan stuck in PENDING forever

**Possible Causes**:
1. Worker not running
2. Redis connection failed
3. BullMQ queue not processing jobs

**Debug Steps**:
```bash
# 1. Check worker process
ps aux | grep "tsx.*worker"
# If not running: npm run worker

# 2. Check Redis
redis-cli ping
# Should return: PONG
# If not: redis-server

# 3. Check BullMQ queue
redis-cli LLEN bull:security-scans:wait
# Should show number of pending jobs

# 4. Check worker logs
tail -f worker.log
```

**Fix**: Start missing services

---

#### Symptom: All scans failing with timeout

**Possible Causes**:
1. Playwright timeout too short
2. Target websites very slow
3. Network connectivity issues

**Debug Steps**:
```bash
# 1. Increase timeout in playwright-crawler.ts
timeout: 120000, // 2 minutes

# 2. Test specific URL manually
npx tsx -e "
import { PlaywrightCrawler } from './src/lib/playwright-crawler.js'
const crawler = new PlaywrightCrawler({ timeout: 120000 })
crawler.crawl('https://example.com').then(console.log)
"

# 3. Check network
curl -I https://example.com
```

---

#### Symptom: Report shows no findings (empty)

**Possible Causes**:
1. Analyzers crashed silently
2. `crawlResult` is empty/invalid
3. Detection patterns not matching

**Debug Steps**:
```bash
# 1. Check scan metadata in AdminDebugBar (admin login required)
localStorage.setItem('admin_auth', 'authenticated')
# Refresh scan page, click "View Metadata"

# 2. Check database for metadata
sqlite3 prisma/dev.db "SELECT metadata FROM Scan WHERE id='<scanId>';" | jq '.networkRequests | length'

# 3. Check worker logs for analyzer errors
grep -i "error\|crash\|fail" worker.log
```

---

#### Symptom: Frontend shows "Loading..." but scan is COMPLETED

**Possible Causes**:
1. Frontend polling not working
2. API returning incorrect status
3. Client-side JavaScript error

**Debug Steps**:
```bash
# 1. Check browser DevTools Console for errors

# 2. Manually test API endpoint
curl http://localhost:3000/api/scan/<scanId> | jq '.status'

# 3. Check if status is actually COMPLETED in database
sqlite3 prisma/dev.db "SELECT status FROM Scan WHERE id='<scanId>';"
```

**Fix**: Hard refresh (Cmd+Shift+R) to clear cached JavaScript

---

#### Symptom: P1 detectors not finding anything

**Possible Causes**:
1. Target website doesn't use P1 services
2. Detection patterns need updating
3. API endpoints changed

**Debug Steps**:
```bash
# 1. Check network requests captured by crawler
sqlite3 prisma/dev.db "SELECT metadata FROM Scan WHERE id='<scanId>';" \
  | jq '.networkRequests[] | select(.url | contains("stability")) | .url'

# 2. Test specific detector in isolation
npx tsx -e "
import { detectImageVideoAI } from './src/worker/analyzers/image-video-ai-detector.js'
const mockResult = { networkRequests: [{ url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image' }] }
console.log(detectImageVideoAI(mockResult))
"
```

---

### 10.2 Common Error Messages

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `Redis connection refused` | Redis not running | `redis-server` |
| `Prisma Client not generated` | Missing Prisma generation | `npx prisma generate` |
| `Browser not found` | Playwright browsers not installed | `npx playwright install chromium` |
| `Navigation timeout exceeded` | Website too slow or blocking | Increase timeout in config |
| `JSON parse error` | Corrupted data in database | Delete scan and retry |
| `Database locked` | SQLite concurrency issue | Restart Next.js server |
| `Worker not processing` | Worker crashed | Check `worker.log`, restart worker |

---

### 10.3 Debug Commands

**Check Redis queue**:
```bash
redis-cli LLEN bull:security-scans:wait    # Pending jobs
redis-cli LLEN bull:security-scans:active  # Active jobs
redis-cli LLEN bull:security-scans:failed  # Failed jobs
```

**Monitor worker in real-time**:
```bash
npm run worker | tee worker.log
```

**Test crawler directly**:
```bash
npx tsx test-crawler.ts https://example.com
```

**Check database size**:
```bash
du -h prisma/dev.db
```

**Vacuum database** (reclaim space after deletions):
```bash
sqlite3 prisma/dev.db "VACUUM;"
```

---

## 11. Deployment & Operations

### 11.1 Environment Variables

**Required**:
```bash
DATABASE_URL="file:./dev.db"                # SQLite path
REDIS_HOST="localhost"                      # Redis host
REDIS_PORT="6379"                           # Redis port
```

**Optional**:
```bash
NODE_ENV="production"                       # Environment
PORT="3000"                                 # Next.js port
NEXT_PUBLIC_API_URL="https://api.example.com"  # API base URL
```

---

### 11.2 Running Locally

**1. Install dependencies**:
```bash
npm install
```

**2. Generate Prisma Client**:
```bash
npx prisma generate
npx prisma migrate dev
```

**3. Start Redis**:
```bash
redis-server
```

**4. Start Next.js dev server**:
```bash
npm run dev
# Runs on http://localhost:3000
```

**5. Start worker** (in separate terminal):
```bash
npm run worker
```

**6. Open browser**:
```
http://localhost:3000
```

---

### 11.3 Production Deployment

**Recommended Stack**:
- **Frontend**: Vercel (Next.js native)
- **Database**: PostgreSQL (replace SQLite)
- **Redis**: Redis Cloud or AWS ElastiCache
- **Worker**: Separate EC2/Render.com instance

**Database Migration** (SQLite → PostgreSQL):
```prisma
// Update prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
# Apply migrations
npx prisma migrate deploy

# Optional: seed production data
npx prisma db seed
```

**Worker Deployment**:
```bash
# Dockerfile for worker
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npx playwright install --with-deps chromium
CMD ["npm", "run", "worker"]
```

---

### 11.4 Performance Optimization

**1. Database Indexing** (already configured):
```prisma
@@index([status, createdAt])
@@index([scanId])
@@index([score])
```

**2. Redis Connection Pooling**:
```typescript
const connection = new Redis({
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
})
```

**3. Playwright Browser Reuse** (future optimization):
Currently creates new browser instance per scan. Could reuse:
```typescript
// Keep browser instance alive
const browser = await playwright.chromium.launch()
// Reuse for multiple scans
const page = await browser.newPage()
```

**4. Worker Scaling**:
```bash
# Run multiple worker instances
npm run worker &  # Worker 1
npm run worker &  # Worker 2
npm run worker &  # Worker 3
```

BullMQ automatically distributes jobs across workers.

---

### 11.5 Monitoring

**Key Metrics to Track**:
- Scan completion rate (COMPLETED / total)
- Average scan duration
- Failed scan rate
- Worker queue length
- Database size growth

**Recommended Tools**:
- **Application**: Sentry (error tracking)
- **Infrastructure**: Datadog, New Relic
- **Uptime**: UptimeRobot, Pingdom

**BullMQ Dashboard** (optional):
```bash
npm install -g bull-board
bull-board --redis redis://localhost:6379
# Visit http://localhost:3000/bull-board
```

---

## 12. Appendix

### 12.1 File Structure Reference

```
ai-security-scanner/
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── dev.db                     # SQLite database
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx               # Homepage
│   │   ├── scan/[id]/page.tsx     # Report page
│   │   └── api/                   # API routes
│   │       ├── scan/route.ts      # POST /api/scan
│   │       └── scan/[id]/route.ts # GET /api/scan/{id}
│   ├── components/
│   │   └── AiTrustScore.tsx       # AI Trust Score component
│   ├── lib/
│   │   ├── playwright-crawler.ts  # Real browser crawler
│   │   └── crawler-adapter.ts     # Adapter layer
│   └── worker/
│       ├── index.ts               # Worker process
│       └── analyzers/             # 60+ detection modules
│           ├── ai-trust-analyzer.ts        # Master orchestrator
│           ├── image-video-ai-detector.ts  # P1 (NEW)
│           ├── content-moderation-detector.ts # P1 (NEW)
│           ├── voice-ai-detector.ts        # P0
│           ├── llm-api-detector.ts         # P0 + P1
│           ├── owasp-llm06-detector.ts     # OWASP LLM06
│           ├── security-analyzer.ts        # Traditional security
│           └── tech-stack-detector.ts      # Wappalyzer-style
├── package.json
└── README.md
```

---

### 12.2 Tech Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend | Next.js | 16.0.1 | React framework |
| UI | Tailwind CSS | 3.x | Styling |
| Language | TypeScript | 5.x | Type safety |
| Backend | Next.js API Routes | 16.0.1 | RESTful API |
| Database | Prisma + SQLite | 5.x | ORM + DB |
| Job Queue | BullMQ | 5.x | Background jobs |
| Cache | Redis | 7.x | Queue storage |
| Crawler | Playwright | 1.x | Browser automation |
| Runtime | Node.js | 20.x | Server runtime |

---

### 12.3 Detection Coverage Summary

**P0 Detectors (20 services)** - October 2025:
- Voice AI: 4 services
- Translation AI: 3 services
- Search AI: 2 services
- LLM APIs: 13 services
- Personalization: 3 services
- Analytics: 5 services

**P1 Detectors (23 NEW services)** - November 2025:
- Image/Video AI: 15 services
- Content Moderation: 6 services
- LLM APIs (extended): 2 services

**OWASP LLM Top 10**:
- ✅ LLM01: Prompt Injection
- ✅ LLM02: Insecure Output Handling
- ✅ LLM05: Supply Chain Vulnerabilities
- ✅ LLM06: Sensitive Information Disclosure
- ✅ LLM07: Insecure Plugin Design
- ✅ LLM08: Excessive Agency

**Traditional Security**:
- SSL/TLS
- Security Headers (CSP, HSTS, X-Frame-Options, etc.)
- Cookie Security
- CORS
- DNS Security (DNSSEC, SPF, DKIM)
- Network Ports
- Compliance (GDPR, CCPA, PCI DSS)
- WAF Detection
- MFA Detection
- Rate Limiting
- GraphQL Security
- Error Disclosure

**Technology Stack**:
- 100+ technologies across 8 categories
- Wappalyzer-style pattern matching

**Total Detection Modules**: 60+

---

## End of Documentation

**Last Updated**: 2025-11-15
**Version**: 2.0
**Maintained By**: AI Security Scanner Team

**Questions?** Check GitHub Issues or contact support.

---

---

## 13. Additional Frontend Pages

### 13.1 Homepage (`/`)

**File**: `src/app/page.tsx` (199 lines)

**Purpose**: Landing page with URL submission form for starting new scans

**Key Features**:

1. **URL Input Form** (Lines 90-136)
   - Validates URL format (must be valid HTTP/HTTPS)
   - Disabled state during scan creation
   - Real-time error display

2. **Scan Creation Flow** (Lines 20-46)
   ```typescript
   const handleScan = async (e: React.FormEvent) => {
     e.preventDefault()
     setLoading(true)

     try {
       const response = await fetch('/api/scan', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ url }),
       })

       const data = await response.json()
       
       if (!response.ok) {
         // Show user-friendly error message
         throw new Error(data.message || data.error || 'Failed to start scan')
       }

       // Redirect to scan results page
       router.push(`/scan/${data.scanId}`)
     } catch (err) {
       setError(err.message)
       setLoading(false)
     }
   }
   ```

3. **Authentication Check** (Lines 14-18)
   - Checks `localStorage.getItem('admin_auth')`
   - If authenticated: Shows link to Admin Dashboard
   - If not: Shows link to "All Scans" (public page)

4. **Hero Section** (Lines 72-88)
   - Main headline: "Is Your AI Implementation Putting You at Risk?"
   - Value proposition
   - Call-to-action

5. **Feature Grid** (Lines 139-169)
   - AI Risk Detection
   - Security Headers
   - OWASP LLM Top 10
   - Each with icon, title, description

6. **Trust Bar** (Lines 173-195)
   - Passive Scanning Only
   - No Server Access Required
   - Privacy Focused
   - Instant Results

**State Management**:
```typescript
const [url, setUrl] = useState('')                // User input
const [loading, setLoading] = useState(false)     // Submit state
const [error, setError] = useState('')            // Error message
const [isLoggedIn, setIsLoggedIn] = useState(false) // Admin check
```

**API Endpoint Called**:
- `POST /api/scan` - Creates scan and returns `scanId`

**Navigation**:
- Success → `/scan/{scanId}` (results page)
- "View All Scans" → `/all-scans` (public) or `/aiq_belepes_mrd/dashboard` (admin)

**Troubleshooting**:

| Issue | Cause | Fix |
|-------|-------|-----|
| "Failed to start scan" | API returned error | Check Redis connection, worker status |
| Form not submitting | JavaScript error | Check browser console |
| Redirect not working | Invalid scanId | Check API response |
| Admin link not showing | Auth token not set | `localStorage.setItem('admin_auth', 'authenticated')` |

---

### 13.2 All Scans Page (`/all-scans`)

**File**: `src/app/all-scans/page.tsx` (~250 lines)

**Purpose**: Public page showing recent scans with ability to start new scans

**Key Features**:

1. **Recent Scans List** (Lines 20-42)
   - Fetches from `GET /api/scans/recent`
   - Shows last 50 scans ordered by creation date
   - Displays: URL, status, risk score, risk level, timestamp

2. **Scan Creation Form** (Lines 119-150)
   - Same design as report page scan form
   - Inline new scan input
   - Redirects to `/scan/{scanId}` on submit

3. **Data Loading** (Lines 30-42)
   ```typescript
   const loadScans = async () => {
     try {
       setLoading(true)
       const response = await fetch('/api/scans/recent')
       if (!response.ok) throw new Error('Failed to load scans')
       const data = await response.json()
       setScans(data.scans)
     } catch (error) {
       console.error('Error loading scans:', error)
     } finally {
       setLoading(false)
     }
   }
   ```

4. **Helper Functions**:
   - `formatDateTime()` (Line 71-80) - Hungarian date format
   - `getRiskColor()` (Line 82-90) - Color coding by risk level
   - `getGrade()` (Line 92-107) - Letter grade from score (A+ to F)

**Scan Table Structure**:
```typescript
interface Scan {
  id: string
  url: string
  domain: string | null
  status: string             // PENDING, SCANNING, COMPLETED, FAILED
  riskScore: number | null   // 0-100
  riskLevel: string | null   // LOW, MEDIUM, HIGH, CRITICAL
  createdAt: string
}
```

**Risk Level Colors**:
- LOW → `text-green-400`
- MEDIUM → `text-yellow-400`
- HIGH → `text-orange-400`
- CRITICAL → `text-red-400`

**Grade Calculation**:
| Score Range | Grade |
|-------------|-------|
| 95-100 | A+ |
| 90-94 | A |
| 85-89 | A- |
| 80-84 | B+ |
| 75-79 | B |
| 70-74 | B- |
| 65-69 | C+ |
| 60-64 | C |
| 55-59 | C- |
| 50-54 | D+ |
| 45-49 | D |
| 40-44 | D- |
| 0-39 | F |

**API Endpoints**:
- `GET /api/scans/recent` - Fetch recent scans
- `POST /api/scan` - Create new scan

**Troubleshooting**:

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty list | No scans in database | Create a scan from homepage |
| "Failed to load scans" | API error | Check Next.js logs, database connection |
| Scans not updating | No auto-refresh | Manual page refresh required |

---

### 13.3 Admin Dashboard (`/aiq_belepes_mrd/dashboard`)

**File**: `src/app/aiq_belepes_mrd/dashboard/page.tsx` (163 lines)

**Purpose**: Protected admin panel for monitoring scans, managing leads, and viewing metrics

**Authentication** (Lines 41-51):
```typescript
useEffect(() => {
  // Check authentication
  const authToken = localStorage.getItem('admin_auth')
  if (authToken !== 'authenticated') {
    router.push('/aiq_belepes_mrd')  // Redirect to login
    return
  }

  setIsAuthenticated(true)
  loadData()
}, [router])
```

**Login Location**: `/aiq_belepes_mrd` (login page - separate file)

**Key Features**:

#### 1. Statistics Grid (Lines 126-150)

**Total Scans**:
```typescript
const totalScans = scans.length
const completedScans = scans.filter(s => s.status === 'COMPLETED').length
```

**Total Leads**:
```typescript
const totalLeads = leads.length
const conversionRate = ((totalLeads / totalScans) * 100).toFixed(1)
```

**Average Risk Score**:
```typescript
const avgRiskScore = scans
  .filter(s => s.riskScore !== null)
  .reduce((sum, s) => sum + (s.riskScore || 0), 0) / (completedScans || 1)
```

**High Risk Sites**:
```typescript
const criticalScans = scans.filter(s => s.riskLevel === 'CRITICAL').length
const highScans = scans.filter(s => s.riskLevel === 'HIGH').length
const totalHighRisk = criticalScans + highScans
```

#### 2. Data Loading (Lines 53-67)

**API Endpoint**: `GET /api/admin/data`

**Response Format**:
```json
{
  "scans": [ { id, url, status, riskScore, riskLevel, createdAt } ],
  "leads": [ { id, email, name, company, lifecycleStage, scan: {...} } ]
}
```

**Implementation**:
```typescript
const loadData = async () => {
  try {
    setLoading(true)
    const response = await fetch('/api/admin/data')
    if (!response.ok) throw new Error('Failed to load data')
    const data = await response.json()

    setScans(data.scans)
    setLeads(data.leads)
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    setLoading(false)
  }
}
```

#### 3. Worker Status Panel (Lines 152-155)

**Component**: `<WorkerStatusPanel />`

**Purpose**: Shows real-time worker health status
- Active workers count
- Queue length (pending jobs)
- Failed jobs count
- Last job completion time

**Data Source**: `GET /api/workers/status`

#### 4. Admin Tabs (Lines 157-158)

**Component**: `<AdminTabsWithDelete scans={scans} leads={leads} onDataChange={loadData} />`

**Tabs**:
1. **Scans Tab** - All scans with delete functionality
2. **Leads Tab** - All captured leads with contact info

**Features**:
- Delete individual scans
- Delete individual leads
- Pagination (50 per page)
- Search/filter (future enhancement)

#### 5. Logout Function (Lines 69-72)

```typescript
const handleLogout = () => {
  localStorage.removeItem('admin_auth')
  router.push('/')
}
```

**Navigation Links**:
- Settings → `/aiq_belepes_mrd/dashboard/settings`
- Back to Home → `/`
- Logout → Clears auth token, redirects to homepage

**Data Models**:

**Scan Interface**:
```typescript
interface Scan {
  id: string
  url: string
  domain: string | null
  status: string
  riskScore: number | null
  riskLevel: string | null
  createdAt: Date
}
```

**Lead Interface**:
```typescript
interface Lead {
  id: string
  email: string
  name: string | null
  company: string | null
  lifecycleStage: string  // SUBSCRIBER, LEAD, MQL, SQL, CUSTOMER
  createdAt: Date
  scan: {
    id: string
    domain: string | null
    url: string
    riskScore: number | null
    riskLevel: string | null
  }
}
```

**Lifecycle Stages**:
- **SUBSCRIBER**: Entered email only
- **LEAD**: Qualified interest
- **MQL** (Marketing Qualified Lead): Engaged with content
- **SQL** (Sales Qualified Lead): Ready for sales contact
- **CUSTOMER**: Converted to paying customer

**Troubleshooting**:

| Issue | Cause | Fix |
|-------|-------|-----|
| Redirected to login | Not authenticated | Login at `/aiq_belepes_mrd` |
| "Failed to load data" | API error | Check admin API route, database |
| Empty statistics | No data in database | Wait for scans to complete |
| Worker status not showing | Worker not running | `npm run worker` |

---

### 13.4 Admin Login Page (`/aiq_belepes_mrd`)

**File**: `src/app/aiq_belepes_mrd/page.tsx`

**Purpose**: Simple password protection for admin dashboard

**Authentication Method**: Hardcoded password check (for development)

**Login Flow**:
1. User enters password
2. Frontend checks password (client-side)
3. If correct: `localStorage.setItem('admin_auth', 'authenticated')`
4. Redirect to `/aiq_belepes_mrd/dashboard`

**⚠️ Security Warning**: This is NOT production-ready authentication!

**Production Recommendations**:
- Implement proper backend authentication (JWT, session cookies)
- Use environment variables for credentials
- Add rate limiting to prevent brute force
- Implement 2FA for admin access
- Use HTTPS only

---

### 13.5 Settings Page (`/aiq_belepes_mrd/dashboard/settings`)

**File**: `src/app/aiq_belepes_mrd/dashboard/settings/page.tsx`

**Purpose**: Configure site-wide settings (Twitter handle, branding, feature flags)

**Settings Categories**:

1. **Social Media Handles**
   - Twitter handle (for Twitter Cards)
   - Facebook URL
   - LinkedIn URL
   - GitHub URL

2. **SEO & Branding**
   - Site name
   - Default meta description
   - Site URL (production)
   - Open Graph image URL

3. **Contact Information**
   - Support email
   - Sales email
   - Company name
   - Company address

4. **Feature Flags**
   - Enable Twitter Cards (toggles Twitter meta tags)
   - Enable Open Graph tags
   - Enable Google Analytics

**Data Model**: `SiteSettings` (Prisma schema, Line 211-251)

**API Endpoints**:
- `GET /api/settings` - Fetch current settings
- `POST /api/settings` - Update settings

**Usage in Frontend**:
- Report page fetches settings to add Twitter Card meta tags (if enabled)
- Homepage uses site name and description
- Footer uses contact info

---

## 14. Admin API Routes

### 14.1 GET /api/admin/data

**File**: `src/app/api/admin/data/route.ts`

**Purpose**: Fetch all scans and leads for admin dashboard

**Authentication**: Currently none (should add in production!)

**Response**:
```json
{
  "scans": [
    {
      "id": "uuid",
      "url": "https://example.com",
      "domain": "example.com",
      "status": "COMPLETED",
      "riskScore": 75,
      "riskLevel": "MEDIUM",
      "createdAt": "2025-11-15T10:00:00Z"
    }
  ],
  "leads": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "company": "Acme Inc",
      "lifecycleStage": "LEAD",
      "createdAt": "2025-11-15T10:05:00Z",
      "scan": {
        "id": "scan-uuid",
        "url": "https://example.com",
        "domain": "example.com",
        "riskScore": 75,
        "riskLevel": "MEDIUM"
      }
    }
  ]
}
```

**Implementation**:
```typescript
const scans = await prisma.scan.findMany({
  orderBy: { createdAt: 'desc' },
  take: 100,  // Limit to last 100
})

const leads = await prisma.lead.findMany({
  orderBy: { createdAt: 'desc' },
  include: { scan: true },  // Include related scan data
})

return NextResponse.json({ scans, leads })
```

---

### 14.2 GET /api/scans/recent

**File**: `src/app/api/scans/recent/route.ts`

**Purpose**: Fetch recent scans for "All Scans" public page

**Response**:
```json
{
  "scans": [ { id, url, domain, status, riskScore, riskLevel, createdAt } ]
}
```

**Query**:
```typescript
const scans = await prisma.scan.findMany({
  orderBy: { createdAt: 'desc' },
  take: 50,
  select: {
    id: true,
    url: true,
    domain: true,
    status: true,
    riskScore: true,
    riskLevel: true,
    createdAt: true,
  }
})
```

---

### 14.3 GET /api/workers/status

**File**: `src/app/api/workers/status/route.ts`

**Purpose**: Real-time worker health monitoring for admin dashboard

**Response**:
```json
{
  "activeWorkers": 2,
  "queueLength": 5,
  "failedJobs": 1,
  "completedJobs": 150,
  "lastJobTime": "2025-11-15T10:30:45Z"
}
```

**Data Source**: BullMQ queue metrics

**Implementation**:
```typescript
import { Queue } from 'bullmq'

const queue = new Queue('security-scans', {
  connection: { host: 'localhost', port: 6379 }
})

const waiting = await queue.getWaitingCount()
const active = await queue.getActiveCount()
const completed = await queue.getCompletedCount()
const failed = await queue.getFailedCount()

return NextResponse.json({
  activeWorkers: active,
  queueLength: waiting,
  failedJobs: failed,
  completedJobs: completed,
})
```

**Troubleshooting**:
- If all values are 0: Redis not connected
- If queueLength keeps growing: Worker not processing jobs
- If failedJobs > 0: Check worker logs for errors

---

## 15. Complete Page Hierarchy

```
/                                    Homepage (public)
├── /scan/[id]                       Scan Report (public)
├── /all-scans                       Recent Scans List (public)
├── /aiq_belepes_mrd                 Admin Login (password protected)
└── /aiq_belepes_mrd/dashboard       Admin Dashboard (authenticated)
    ├── /settings                    Site Settings (authenticated)
    └── (future: /analytics)         Analytics Dashboard
```

**Authentication Flow**:
```
User → /aiq_belepes_mrd (login page)
  ↓
Enter password
  ↓
Check password (client-side)
  ↓
localStorage.setItem('admin_auth', 'authenticated')
  ↓
Redirect → /aiq_belepes_mrd/dashboard
  ↓
Every protected page checks:
  localStorage.getItem('admin_auth') === 'authenticated'
  ↓
If NOT authenticated → Redirect to login
```

**Public Pages** (no auth required):
- `/` - Homepage
- `/scan/[id]` - Report page
- `/all-scans` - Recent scans

**Protected Pages** (auth required):
- `/aiq_belepes_mrd/dashboard` - Admin dashboard
- `/aiq_belepes_mrd/dashboard/settings` - Settings

**Admin Features**:
- View all scans (with delete)
- View all leads (with delete)
- Monitor worker status
- Configure site settings (Twitter, SEO, branding)
- Statistics dashboard (total scans, conversion rate, avg risk score)

---

## 16. Updated Troubleshooting - Frontend Issues

### Issue: Admin login not working

**Symptoms**:
- Password accepted but redirects back to login
- Dashboard shows "Loading..." forever

**Debug Steps**:
```javascript
// 1. Check if auth token is set
console.log(localStorage.getItem('admin_auth'))
// Should return: "authenticated"

// 2. Manually set token
localStorage.setItem('admin_auth', 'authenticated')

// 3. Refresh page
location.reload()
```

**Common Causes**:
- Browser blocking localStorage (private/incognito mode)
- Password typo
- JavaScript error preventing token storage

---

### Issue: "All Scans" page empty

**Symptoms**:
- Page loads but shows no scans
- No error message

**Debug Steps**:
```bash
# 1. Check if scans exist in database
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Scan;"

# 2. Test API endpoint manually
curl http://localhost:3000/api/scans/recent | jq '.'

# 3. Check browser Network tab
# Look for /api/scans/recent request
# Status should be 200 OK
```

**Fix**: If database has scans but API returns empty → check API route implementation

---

### Issue: Worker Status Panel shows all zeros

**Symptoms**:
- Active workers: 0
- Queue length: 0
- No jobs shown

**Debug Steps**:
```bash
# 1. Check Redis connection
redis-cli ping
# Should return: PONG

# 2. Check BullMQ queue directly
redis-cli LLEN bull:security-scans:wait

# 3. Start worker if not running
npm run worker
```

**Fix**: Ensure Redis is running and worker process is active

---

## 17. Performance Considerations

### Frontend Optimization

**1. React Optimization**:
- ✅ Client-side rendering for dynamic content
- ✅ Server-side rendering for SEO pages
- 🔄 TODO: Implement React.memo for heavy components
- 🔄 TODO: Add lazy loading for admin dashboard

**2. API Polling**:
- Current: Poll every 2 seconds during scan
- Optimization: Use Server-Sent Events (SSE) for real-time updates
```typescript
// Future implementation
const eventSource = new EventSource(`/api/scan/${scanId}/stream`)
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  setScan(data)
}
```

**3. Data Caching**:
- Current: No caching
- Recommendation: Cache static data (knowledge base, settings) in localStorage
```typescript
const cachedKB = localStorage.getItem('knowledge_base')
if (cachedKB && Date.now() - lastFetch < 3600000) {
  return JSON.parse(cachedKB)
}
```

---

## 18. Security Best Practices

### Current Security Measures

✅ **Implemented**:
- Input validation (URL format)
- SQL injection prevention (Prisma ORM)
- XSS prevention (React auto-escaping)
- HTTPS enforcement in production
- Rate limiting (via BullMQ job queue)

⚠️ **TODO - Critical**:
- [ ] Implement proper backend authentication
- [ ] Add CSRF protection
- [ ] Implement API rate limiting (per IP)
- [ ] Add input sanitization for user-generated content
- [ ] Secure admin routes with proper auth middleware

### Admin Authentication Security

**Current State** (Development):
```typescript
// ⚠️ INSECURE - Client-side only
const authToken = localStorage.getItem('admin_auth')
if (authToken === 'authenticated') {
  // Grant access
}
```

**Production Recommendation**:
```typescript
// ✅ SECURE - Backend verification
const session = await getServerSession(authOptions)
if (!session || session.user.role !== 'admin') {
  return redirect('/login')
}
```

**Recommended Stack**:
- **NextAuth.js** for authentication
- **JWT** for session management
- **bcrypt** for password hashing
- **Iron Session** for encrypted cookies

---

## Appendix B: Quick Reference Commands

### Development Workflow

```bash
# 1. Start all services
redis-server &                    # Redis (background)
npm run dev &                     # Next.js (background)
npm run worker                    # Worker (foreground with logs)

# 2. Monitor logs
tail -f worker.log

# 3. Check queue status
redis-cli LLEN bull:security-scans:wait

# 4. Check database
sqlite3 prisma/dev.db "SELECT * FROM Scan ORDER BY createdAt DESC LIMIT 5;"

# 5. Test API endpoints
curl http://localhost:3000/api/scan/[scanId] | jq '.'
curl http://localhost:3000/api/scans/recent | jq '.scans | length'
curl http://localhost:3000/api/admin/data | jq '.scans | length, .leads | length'
```

### Database Management

```bash
# View all scans
sqlite3 prisma/dev.db "SELECT id, url, status, riskScore FROM Scan;"

# Count by status
sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM Scan GROUP BY status;"

# Find high-risk scans
sqlite3 prisma/dev.db "SELECT url, riskScore FROM Scan WHERE riskLevel='CRITICAL' OR riskLevel='HIGH';"

# Delete old scans (7+ days)
sqlite3 prisma/dev.db "DELETE FROM Scan WHERE createdAt < datetime('now', '-7 days');"

# Export scans to CSV
sqlite3 -header -csv prisma/dev.db "SELECT * FROM Scan;" > scans.csv
```

### Admin Tasks

```bash
# Login as admin (browser console)
localStorage.setItem('admin_auth', 'authenticated')
location.reload()

# Logout
localStorage.removeItem('admin_auth')
location.href = '/'

# Check auth status
console.log(localStorage.getItem('admin_auth'))
```

---

**END OF COMPREHENSIVE SYSTEM ARCHITECTURE DOCUMENTATION**

**Document Stats**:
- Total Sections: 18
- Total Lines: ~2400+
- Coverage: 100% of system components
- Last Updated: 2025-11-15
- Version: 2.1 (Added Frontend Pages + Admin)

For questions, issues, or contributions, please refer to the GitHub repository.

---

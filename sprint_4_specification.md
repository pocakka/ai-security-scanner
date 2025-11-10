# Sprint 4 Technical Specification: Advanced Security Analysis Features

**Document Version:** 1.0
**Date:** 2025-11-10
**Status:** Draft for Review
**Author:** Research & Development Team

---

## Executive Summary

This specification document outlines the technical implementation details for **Sprint 4**, which focuses on adding advanced URL-based security analysis capabilities to the AI Security Scanner. These features are **analysis-focused only** and do not include lead generation or marketing features.

The new features are divided into three priority tiers:
1. **Priority 1 (Sprint 4A):** AI-Specific Security Analyzers ⚡ HIGH VALUE
2. **Priority 2 (Sprint 4B):** Client-Side Security Patterns 🔒 MEDIUM VALUE
3. **Priority 3 (Sprint 4C):** Infrastructure & Reputation Analysis 🏗️ FOUNDATION VALUE

---

## Table of Contents

1. [Priority 1: AI-Specific Security Analyzers](#priority-1-ai-specific-security-analyzers)
2. [Priority 2: Client-Side Security Patterns](#priority-2-client-side-security-patterns)
3. [Priority 3: Infrastructure & Reputation Analysis](#priority-3-infrastructure--reputation-analysis)
4. [Implementation Architecture](#implementation-architecture)
5. [Database Schema Changes](#database-schema-changes)
6. [Frontend UI Components](#frontend-ui-components)
7. [Risk Scoring Impact](#risk-scoring-impact)
8. [Testing Strategy](#testing-strategy)
9. [Success Metrics](#success-metrics)

---

## Priority 1: AI-Specific Security Analyzers

**Why This Matters:** These are your **unique market differentiators**. No other security scanner focuses specifically on AI implementation vulnerabilities.

### 1.1 System Prompt Exposure Detection 🎯

**Security Risk:** CRITICAL
**Business Value:** ⚡⚡⚡ Highest lead conversion potential
**Implementation Complexity:** Medium

#### What We Detect

Exposed AI system prompts in client-side JavaScript that reveal:
- Model instructions and behavior guidelines
- Sensitive business logic
- Proprietary AI configurations
- Role definitions and constraints

#### Technical Implementation

**Location:** `/src/worker/analyzers/ai-prompt-exposure.ts` (NEW FILE)

**Detection Patterns:**

```typescript
export const SYSTEM_PROMPT_PATTERNS = [
  // OpenAI API format
  /role:\s*["']system["']\s*,\s*content:\s*["']([^"']{50,})["']/gi,

  // Anthropic Claude format
  /system:\s*["']([^"']{50,})["']/gi,

  // Variable assignments
  /(?:const|let|var)\s+(?:SYSTEM_)?PROMPT\s*=\s*["'`]([^"'`]{50,})["'`]/gi,
  /(?:const|let|var)\s+(?:system|assistant)Instructions\s*=\s*["'`]([^"'`]{50,})["'`]/gi,

  // Configuration objects
  /systemMessage:\s*["'`]([^"'`]{50,})["'`]/gi,
  /instructions:\s*["'`]([^"'`]{50,})["'`]/gi,

  // Template literals
  /\`You are (?:a|an)\s+([^`]{20,})\`/gi,
  /\`Your role is to\s+([^`]{20,})\`/gi,
]

export const AI_INSTRUCTION_KEYWORDS = [
  'You are a helpful assistant',
  'Your task is to',
  'Follow these instructions',
  'You must never',
  'Always respond with',
  'Do not reveal',
  'Ignore previous instructions',
  'System: ',
  'Assistant: ',
]
```

**Analysis Process:**

1. Extract all JavaScript files from Playwright page context
2. Search for system prompt patterns using regex
3. Extract surrounding context (±200 characters)
4. Validate findings using keyword matching
5. Calculate confidence score based on:
   - Pattern match strength (50%)
   - Keyword presence (30%)
   - Context relevance (20%)

**False Positive Prevention:**

```typescript
function isLikelyFalsePositive(match: string, context: string): boolean {
  // Exclude comments
  if (context.match(/\/\/.*|\/\*.*\*\//)) return true

  // Exclude demo/example code
  if (context.match(/example|demo|test|mock/i)) return true

  // Exclude very short matches (< 50 chars)
  if (match.length < 50) return true

  // Exclude configuration files (package.json, etc.)
  if (context.includes('package.json') || context.includes('tsconfig')) return true

  return false
}
```

**Output Format:**

```typescript
interface SystemPromptFinding {
  type: 'system_prompt_exposure'
  severity: 'critical'
  title: 'AI System Prompt Exposed in Client-Side Code'
  description: string
  evidence: {
    prompt: string // First 200 chars
    file: string
    line: number | null
    context: string
    confidence: 'high' | 'medium' | 'low'
  }
  recommendation: string
  impact: string
}
```

**Business Impact Message:**

> "Your AI system prompts are exposed in client-side JavaScript. This reveals your business logic, instruction sets, and potential vulnerabilities to attackers who can reverse-engineer your AI's behavior and craft targeted prompt injection attacks."

---

### 1.2 AI Framework Detection 🔍

**Security Risk:** LOW (informational, but valuable for lead qualification)
**Business Value:** ⚡⚡ High awareness factor
**Implementation Complexity:** Low

#### What We Detect

Client-side usage of popular AI frameworks:
- **LangChain.js** - Most popular AI orchestration framework
- **Vercel AI SDK** - Common for Next.js applications
- **OpenAI SDK** - Direct OpenAI API usage
- **Anthropic SDK** - Claude API usage
- **Transformers.js** - Browser-based ML models
- **TensorFlow.js** - Browser-based ML
- **ONNX Runtime Web** - Cross-platform ML inference

#### Technical Implementation

**Location:** Extend `/src/worker/analyzers/advanced-ai-detection-rules.ts`

**Detection Methods:**

1. **Script Import Detection:**
```typescript
const AI_FRAMEWORK_IMPORTS = [
  // LangChain
  { pattern: /from ['"]langchain['"]/gi, name: 'LangChain.js' },
  { pattern: /import.*langchain/gi, name: 'LangChain.js' },

  // Vercel AI SDK
  { pattern: /from ['"]ai['"]/gi, name: 'Vercel AI SDK' },
  { pattern: /@ai-sdk\//gi, name: 'Vercel AI SDK' },

  // OpenAI
  { pattern: /from ['"]openai['"]/gi, name: 'OpenAI SDK' },
  { pattern: /new OpenAI\(/gi, name: 'OpenAI SDK' },

  // Anthropic
  { pattern: /from ['"]@anthropic-ai['"]/gi, name: 'Anthropic SDK' },
  { pattern: /new Anthropic\(/gi, name: 'Anthropic SDK' },

  // Transformers.js
  { pattern: /@xenova\/transformers/gi, name: 'Transformers.js' },

  // TensorFlow.js
  { pattern: /@tensorflow\/tfjs/gi, name: 'TensorFlow.js' },
]
```

2. **Global Object Detection:**
```typescript
async function detectGlobalFrameworks(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const detected: string[] = []

    // Check for global objects
    if (typeof window !== 'undefined') {
      if ((window as any).LangChain) detected.push('LangChain.js')
      if ((window as any).ai) detected.push('Vercel AI SDK')
      if ((window as any).OpenAI) detected.push('OpenAI SDK')
      if ((window as any).tf) detected.push('TensorFlow.js')
    }

    return detected
  })
}
```

3. **Network Request Pattern Detection:**
```typescript
// Monitor network requests during page load
page.on('request', (request) => {
  const url = request.url()

  // Vercel AI SDK typical endpoints
  if (url.match(/\/api\/chat|\/api\/completion|\/api\/generate/)) {
    detectedFrameworks.add('Vercel AI SDK')
  }

  // Direct API calls
  if (url.includes('api.openai.com')) detectedFrameworks.add('OpenAI SDK')
  if (url.includes('api.anthropic.com')) detectedFrameworks.add('Anthropic SDK')
})
```

**Output Format:**

```typescript
interface AIFrameworkFinding {
  type: 'ai_framework_detection'
  severity: 'low' // informational
  title: 'AI Framework Detected'
  description: string
  evidence: {
    frameworks: string[]
    detectionMethod: 'import' | 'global' | 'network'
    implications: string[]
  }
  recommendation: string
}
```

---

### 1.3 Embedding Vector Exposure 🚨

**Security Risk:** CRITICAL
**Business Value:** ⚡⚡⚡ "Holy grail" finding - huge lead conversion
**Implementation Complexity:** Medium-High

#### What We Detect

Exposed embedding vectors in client-side code that reveal:
- Proprietary semantic search indexes
- Intellectual property encoded as vectors
- RAG (Retrieval Augmented Generation) system data
- Vector database contents

**Why This Is Critical:** Embedding vectors can be inverted to extract original training data, exposing sensitive documents, source code, or confidential information.

#### Technical Implementation

**Location:** `/src/worker/analyzers/embedding-vector-detection.ts` (NEW FILE)

**Detection Patterns:**

```typescript
export const EMBEDDING_VECTOR_PATTERNS = [
  // Standard embedding vector format (array of floats)
  /\[[\s\n]*-?0\.\d{3,}[\s\n]*,[\s\n]*-?0\.\d{3,}[\s\n]*,[\s\n]*-?0\.\d{3,}/g,

  // Named vector variables
  /(?:embedding|vector|embeddings)s?:\s*\[[\s\n]*-?0\.\d+/gi,

  // OpenAI embedding format (1536 dimensions)
  /\[(?:\s*-?0\.\d{4,}\s*,\s*){50,}\s*-?0\.\d{4,}\s*\]/g,

  // Cohere embedding format (768/4096 dimensions)
  /\[(?:\s*-?0\.\d{4,}\s*,\s*){100,}\s*-?0\.\d{4,}\s*\]/g,
]

export function isValidEmbeddingVector(match: string): boolean {
  try {
    const parsed = JSON.parse(match)

    // Must be an array
    if (!Array.isArray(parsed)) return false

    // Common embedding dimensions: 384, 768, 1024, 1536, 3072, 4096
    const validDimensions = [384, 768, 1024, 1536, 3072, 4096]
    if (!validDimensions.includes(parsed.length)) return false

    // All elements must be floats between -1 and 1
    const allFloats = parsed.every(
      (n) => typeof n === 'number' && n >= -1 && n <= 1
    )
    if (!allFloats) return false

    // Calculate entropy - real embeddings have high entropy
    const entropy = calculateEntropy(parsed)
    if (entropy < 0.7) return false // Low entropy = fake data

    return true
  } catch {
    return false
  }
}

function calculateEntropy(vector: number[]): number {
  // Shannon entropy calculation for floating point array
  const binned = vector.map(v => Math.floor((v + 1) * 50)) // Bin into 100 buckets
  const counts = new Map<number, number>()

  binned.forEach(bin => {
    counts.set(bin, (counts.get(bin) || 0) + 1)
  })

  let entropy = 0
  const total = vector.length

  counts.forEach(count => {
    const p = count / total
    entropy -= p * Math.log2(p)
  })

  // Normalize to 0-1 range
  return entropy / Math.log2(total)
}
```

**Analysis Process:**

1. Extract all JavaScript files
2. Search for array patterns with floating point numbers
3. Validate array length matches common embedding dimensions
4. Check value ranges (-1 to 1 typically)
5. Calculate entropy to filter out dummy data
6. Extract surrounding context to identify usage

**False Positive Prevention:**

```typescript
function isLikelyFalsePositive(vector: number[], context: string): boolean {
  // Exclude test data
  if (context.match(/test|mock|example|demo/i)) return true

  // Exclude CSS color arrays or other non-embedding numeric arrays
  if (vector.every(n => n >= 0 && n <= 255)) return true // RGB values

  // Exclude arrays with too uniform values (likely dummy data)
  const variance = calculateVariance(vector)
  if (variance < 0.001) return true

  return false
}
```

**Output Format:**

```typescript
interface EmbeddingVectorFinding {
  type: 'embedding_vector_exposure'
  severity: 'critical'
  title: 'AI Embedding Vectors Exposed in Client-Side Code'
  description: string
  evidence: {
    vectorCount: number
    dimensions: number
    file: string
    sampleVector: string // First 10 values
    estimatedProvider: string // 'OpenAI' | 'Cohere' | 'HuggingFace' | 'Unknown'
    confidence: 'high' | 'medium' | 'low'
  }
  recommendation: string
  impact: string
}
```

**Business Impact Message:**

> "Your embedding vectors are exposed in client-side code. These vectors represent your proprietary data in numerical form and can be inverted using modern techniques to extract the original content. This is equivalent to exposing your entire knowledge base, potentially including confidential documents, source code, or customer data."

---

### 1.4 CORS Misconfiguration on AI Endpoints 🌐

**Security Risk:** HIGH
**Business Value:** ⚡⚡ Strong technical credibility
**Implementation Complexity:** Medium

#### What We Detect

CORS (Cross-Origin Resource Sharing) misconfigurations on AI API endpoints that allow:
- Unauthorized domains to make API requests
- Potential API abuse from any website
- Cross-site request forgery (CSRF) attacks
- Data exfiltration via malicious sites

#### Technical Implementation

**Location:** `/src/worker/analyzers/ai-cors-checker.ts` (NEW FILE)

**Detection Process:**

1. **Identify AI Endpoints:**
```typescript
const AI_ENDPOINT_PATTERNS = [
  '/api/chat',
  '/api/completion',
  '/api/generate',
  '/api/ai',
  '/api/openai',
  '/api/anthropic',
  '/v1/chat/completions',
  '/v1/completions',
]

async function detectAIEndpoints(page: Page): Promise<string[]> {
  const endpoints: string[] = []

  page.on('request', (request) => {
    const url = request.url()

    // Check if URL matches AI endpoint patterns
    for (const pattern of AI_ENDPOINT_PATTERNS) {
      if (url.includes(pattern)) {
        endpoints.push(url)
      }
    }
  })

  // Wait for page to fully load
  await page.waitForLoadState('networkidle')

  return [...new Set(endpoints)]
}
```

2. **Test CORS Configuration:**
```typescript
async function testCORSConfiguration(endpoint: string): Promise<CORSFinding | null> {
  try {
    const response = await fetch(endpoint, {
      method: 'OPTIONS', // Preflight request
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    })

    const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
    const allowCredentials = response.headers.get('Access-Control-Allow-Credentials')
    const allowMethods = response.headers.get('Access-Control-Allow-Methods')

    // Check for dangerous configurations
    if (allowOrigin === '*') {
      return {
        severity: 'high',
        issue: 'Wildcard CORS origin',
        details: 'Endpoint allows requests from ANY domain',
      }
    }

    if (allowOrigin === 'https://malicious-site.com') {
      return {
        severity: 'high',
        issue: 'Dynamic origin reflection',
        details: 'Endpoint reflects the requesting origin without validation',
      }
    }

    if (allowCredentials === 'true' && allowOrigin === '*') {
      return {
        severity: 'critical',
        issue: 'CORS with credentials wildcard',
        details: 'Endpoint allows credentials from any domain - critical vulnerability',
      }
    }

    return null // No CORS issues detected
  } catch (error) {
    console.error(`CORS test failed for ${endpoint}:`, error)
    return null
  }
}
```

**Output Format:**

```typescript
interface CORSMisconfigurationFinding {
  type: 'cors_misconfiguration_ai_endpoint'
  severity: 'critical' | 'high'
  title: 'CORS Misconfiguration on AI Endpoint'
  description: string
  evidence: {
    endpoint: string
    allowOrigin: string
    allowCredentials: string | null
    allowMethods: string | null
    vulnerability: string
  }
  recommendation: string
  impact: string
}
```

**Business Impact Message:**

> "Your AI API endpoints have permissive CORS policies. This allows malicious websites to make API requests on behalf of your users, potentially leading to unauthorized API usage, data theft, or significant API cost abuse."

---

### 1.5 Missing Rate Limiting Headers on AI Endpoints ⏱️

**Security Risk:** MEDIUM
**Business Value:** ⚡ Good awareness builder
**Implementation Complexity:** Low

#### What We Detect

AI API endpoints that lack rate limiting indicators:
- Missing `X-RateLimit-*` headers
- No `Retry-After` headers
- Absence of `429 Too Many Requests` responses
- No visible rate limiting implementation

**Why This Matters:** AI API calls are expensive. Without rate limiting, attackers can abuse endpoints and cause significant cost overruns.

#### Technical Implementation

**Location:** Extend `/src/worker/analyzers/ai-cors-checker.ts`

**Detection Process:**

```typescript
async function checkRateLimitHeaders(endpoint: string): Promise<RateLimitFinding | null> {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Origin': window.location.origin,
      },
    })

    // Standard rate limit headers
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit')
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
    const rateLimitReset = response.headers.get('X-RateLimit-Reset')
    const retryAfter = response.headers.get('Retry-After')

    // Alternative header names
    const rateLimitAlt = response.headers.get('RateLimit-Limit')
    const rateLimitPolicy = response.headers.get('RateLimit-Policy')

    // Check if ANY rate limiting headers are present
    const hasRateLimiting = !!(
      rateLimitLimit ||
      rateLimitRemaining ||
      rateLimitReset ||
      retryAfter ||
      rateLimitAlt ||
      rateLimitPolicy
    )

    if (!hasRateLimiting) {
      return {
        severity: 'medium',
        title: 'Missing Rate Limiting Headers on AI Endpoint',
        endpoint: endpoint,
        recommendation: 'Implement rate limiting headers (X-RateLimit-*) to prevent API abuse',
      }
    }

    return null // Rate limiting detected
  } catch (error) {
    return null
  }
}
```

**Output Format:**

```typescript
interface RateLimitFinding {
  type: 'missing_rate_limiting'
  severity: 'medium'
  title: 'Missing Rate Limiting Headers on AI Endpoint'
  description: string
  evidence: {
    endpoint: string
    checkedHeaders: string[]
    missingHeaders: string[]
  }
  recommendation: string
  impact: string
}
```

**Business Impact Message:**

> "Your AI endpoints don't indicate rate limiting implementation through standard HTTP headers. Without rate limits, attackers can abuse your APIs, leading to unexpected costs and service degradation."

---

## Priority 2: Client-Side Security Patterns

**Why This Matters:** These findings improve the **professional credibility** of the report and appeal to **developer-focused** decision makers.

### 2.1 Output Validation Issues (dangerouslySetInnerHTML) ⚠️

**Security Risk:** HIGH
**Business Value:** ⚡⚡ Strong developer appeal
**Implementation Complexity:** Low

#### What We Detect

React applications using `dangerouslySetInnerHTML` without proper sanitization:
- XSS (Cross-Site Scripting) vulnerabilities
- Unvalidated user input rendering
- Missing DOMPurify or similar sanitizers
- AI-generated content rendered unsafely

#### Technical Implementation

**Location:** `/src/worker/analyzers/output-validation.ts` (NEW FILE)

**Detection Patterns:**

```typescript
export const DANGEROUS_OUTPUT_PATTERNS = [
  // React dangerouslySetInnerHTML
  /dangerouslySetInnerHTML\s*=\s*\{\{?\s*__html:\s*([^}]+)\s*\}?\}/gi,

  // Vue v-html
  /v-html\s*=\s*["']([^"']+)["']/gi,

  // Angular [innerHTML]
  /\[innerHTML\]\s*=\s*["']([^"']+)["']/gi,

  // Direct DOM manipulation
  /\.innerHTML\s*=\s*([^;]+);/gi,
  /\.outerHTML\s*=\s*([^;]+);/gi,
]

export const SANITIZATION_LIBRARIES = [
  'DOMPurify',
  'sanitize-html',
  'xss',
  'js-xss',
  'dompurify',
]

async function analyzeOutputValidation(page: Page): Promise<OutputValidationFinding[]> {
  const findings: OutputValidationFinding[] = []

  // Extract all script contents
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script'))
      .map(script => script.textContent || '')
      .join('\n')
  })

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_OUTPUT_PATTERNS) {
    const matches = scripts.matchAll(pattern)

    for (const match of matches) {
      const code = match[0]
      const context = extractContext(scripts, match.index!, 200)

      // Check if sanitization is present in the context
      const hasSanitization = SANITIZATION_LIBRARIES.some(lib =>
        context.includes(lib)
      )

      if (!hasSanitization) {
        findings.push({
          type: 'unsafe_output_rendering',
          severity: 'high',
          title: 'Potentially Unsafe Output Rendering Detected',
          description: `Found ${match[0].split(/\s+/)[0]} without visible sanitization`,
          evidence: {
            code: code,
            context: context,
            sanitizationFound: false,
          },
          recommendation: 'Use DOMPurify or similar library to sanitize dynamic HTML before rendering',
          impact: 'XSS vulnerability - attackers can inject malicious scripts',
        })
      }
    }
  }

  return findings
}
```

**Output Format:**

```typescript
interface OutputValidationFinding {
  type: 'unsafe_output_rendering'
  severity: 'high'
  title: 'Potentially Unsafe Output Rendering Detected'
  description: string
  evidence: {
    code: string
    context: string
    sanitizationFound: boolean
  }
  recommendation: string
  impact: string
}
```

---

### 2.2 JWT Tokens in localStorage 🔑

**Security Risk:** HIGH
**Business Value:** ⚡⚡ Very common issue, good conversion
**Implementation Complexity:** Low

#### What We Detect

Authentication tokens stored insecurely in browser storage:
- JWT tokens in `localStorage`
- JWT tokens in `sessionStorage`
- API keys in Web Storage
- Sensitive credentials accessible via JavaScript

**Why This Matters:** `localStorage` is vulnerable to XSS attacks. Tokens should be stored in HttpOnly cookies.

#### Technical Implementation

**Location:** `/src/worker/analyzers/storage-security.ts` (NEW FILE)

**Detection Process:**

```typescript
export const SENSITIVE_TOKEN_PATTERNS = [
  /^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/, // JWT pattern
  /^(ya29\.|1\/\/|AIza)[a-zA-Z0-9_-]{20,}$/, // Google OAuth tokens
  /^gh[pousr]_[a-zA-Z0-9]{36,}$/, // GitHub tokens
  /^sk-[a-zA-Z0-9]{32,}$/, // OpenAI API keys
  /^Bearer\s+[a-zA-Z0-9_-]{20,}$/, // Bearer tokens
]

async function checkLocalStorage(page: Page): Promise<StorageFinding[]> {
  const findings: StorageFinding[] = []

  // Check localStorage
  const localStorageData = await page.evaluate(() => {
    const data: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        data[key] = localStorage.getItem(key) || ''
      }
    }
    return data
  })

  // Check sessionStorage
  const sessionStorageData = await page.evaluate(() => {
    const data: Record<string, string> = {}
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        data[key] = sessionStorage.getItem(key) || ''
      }
    }
    return data
  })

  // Analyze localStorage
  for (const [key, value] of Object.entries(localStorageData)) {
    if (isSensitiveToken(key, value)) {
      findings.push({
        type: 'insecure_token_storage',
        severity: 'high',
        title: 'JWT Token or Sensitive Credential in localStorage',
        description: `Found sensitive token stored in localStorage under key: "${key}"`,
        evidence: {
          storageType: 'localStorage',
          key: key,
          valuePreview: maskToken(value),
          tokenType: identifyTokenType(value),
        },
        recommendation: 'Store authentication tokens in HttpOnly cookies, not localStorage',
        impact: 'Tokens in localStorage are vulnerable to XSS attacks. An attacker can steal credentials and impersonate users.',
      })
    }
  }

  // Analyze sessionStorage
  for (const [key, value] of Object.entries(sessionStorageData)) {
    if (isSensitiveToken(key, value)) {
      findings.push({
        type: 'insecure_token_storage',
        severity: 'medium', // sessionStorage is slightly less risky
        title: 'JWT Token or Sensitive Credential in sessionStorage',
        description: `Found sensitive token stored in sessionStorage under key: "${key}"`,
        evidence: {
          storageType: 'sessionStorage',
          key: key,
          valuePreview: maskToken(value),
          tokenType: identifyTokenType(value),
        },
        recommendation: 'Store authentication tokens in HttpOnly cookies, not sessionStorage',
        impact: 'Tokens in sessionStorage are vulnerable to XSS attacks during the session.',
      })
    }
  }

  return findings
}

function isSensitiveToken(key: string, value: string): boolean {
  // Check key names
  const sensitiveKeywords = ['token', 'auth', 'jwt', 'session', 'api_key', 'apikey', 'access', 'refresh']
  const keyLower = key.toLowerCase()

  const hasSensitiveKey = sensitiveKeywords.some(keyword => keyLower.includes(keyword))

  // Check value patterns
  const matchesPattern = SENSITIVE_TOKEN_PATTERNS.some(pattern => pattern.test(value))

  return hasSensitiveKey || matchesPattern
}

function maskToken(token: string): string {
  if (token.length <= 10) return '***'
  return token.substring(0, 10) + '...' + token.substring(token.length - 5)
}

function identifyTokenType(token: string): string {
  if (token.startsWith('eyJ')) return 'JWT'
  if (token.startsWith('sk-')) return 'OpenAI API Key'
  if (token.startsWith('gh')) return 'GitHub Token'
  if (token.startsWith('ya29') || token.startsWith('1//')) return 'Google OAuth Token'
  if (token.startsWith('Bearer')) return 'Bearer Token'
  return 'Unknown'
}
```

**Output Format:**

```typescript
interface StorageFinding {
  type: 'insecure_token_storage'
  severity: 'high' | 'medium'
  title: string
  description: string
  evidence: {
    storageType: 'localStorage' | 'sessionStorage'
    key: string
    valuePreview: string
    tokenType: string
  }
  recommendation: string
  impact: string
}
```

---

### 2.3 package.json Exposure 📦

**Security Risk:** MEDIUM
**Business Value:** ⚡ Easy win, common finding
**Implementation Complexity:** Very Low

#### What We Detect

Publicly accessible `package.json` files that reveal:
- All project dependencies and versions
- Known vulnerable packages
- Development dependencies
- Internal project structure
- Potential attack surface

#### Technical Implementation

**Location:** `/src/worker/analyzers/file-exposure.ts` (NEW FILE)

**Detection Process:**

```typescript
async function checkPackageJsonExposure(domain: string): Promise<PackageJsonFinding | null> {
  const urlsToCheck = [
    `https://${domain}/package.json`,
    `https://${domain}/package-lock.json`,
    `https://${domain}/yarn.lock`,
    `https://${domain}/pnpm-lock.yaml`,
    `https://${domain}/composer.json`, // PHP
    `https://${domain}/Gemfile.lock`,  // Ruby
  ]

  for (const url of urlsToCheck) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (AI Security Scanner)',
        },
      })

      if (response.ok && response.status === 200) {
        const contentType = response.headers.get('content-type') || ''

        // Verify it's actually JSON/text (not a 404 page)
        if (contentType.includes('json') || contentType.includes('text')) {
          const text = await response.text()

          // Verify it's a real package file
          if (isValidPackageFile(url, text)) {
            const dependencies = extractDependencies(url, text)

            return {
              type: 'package_file_exposure',
              severity: 'medium',
              title: 'Package Dependency File Publicly Accessible',
              description: `Found publicly accessible ${getFileName(url)} at ${url}`,
              evidence: {
                url: url,
                fileName: getFileName(url),
                dependencyCount: dependencies.length,
                sampleDependencies: dependencies.slice(0, 10),
                fileSize: text.length,
              },
              recommendation: 'Restrict access to package files using .htaccess or web server configuration',
              impact: 'Reveals all project dependencies and versions, allowing attackers to identify known vulnerabilities and plan targeted attacks.',
            }
          }
        }
      }
    } catch (error) {
      // File not accessible (expected)
      continue
    }
  }

  return null // No exposed files found
}

function isValidPackageFile(url: string, content: string): boolean {
  const fileName = getFileName(url)

  try {
    if (fileName === 'package.json' || fileName === 'package-lock.json') {
      const json = JSON.parse(content)
      return !!(json.dependencies || json.devDependencies)
    }

    if (fileName === 'yarn.lock' || fileName === 'pnpm-lock.yaml' || fileName === 'Gemfile.lock') {
      return content.length > 100 && content.includes('version')
    }

    if (fileName === 'composer.json') {
      const json = JSON.parse(content)
      return !!json.require
    }
  } catch {
    return false
  }

  return false
}

function extractDependencies(url: string, content: string): string[] {
  const fileName = getFileName(url)

  try {
    if (fileName === 'package.json') {
      const json = JSON.parse(content)
      return Object.keys({ ...json.dependencies, ...json.devDependencies })
    }

    if (fileName === 'package-lock.json') {
      const json = JSON.parse(content)
      return Object.keys(json.packages || {})
    }

    // For lock files, extract package names via regex
    const matches = content.matchAll(/^([a-z0-9@/-]+):/gm)
    return Array.from(matches).map(m => m[1])
  } catch {
    return []
  }
}

function getFileName(url: string): string {
  return url.split('/').pop() || ''
}
```

**Output Format:**

```typescript
interface PackageJsonFinding {
  type: 'package_file_exposure'
  severity: 'medium'
  title: 'Package Dependency File Publicly Accessible'
  description: string
  evidence: {
    url: string
    fileName: string
    dependencyCount: number
    sampleDependencies: string[]
    fileSize: number
  }
  recommendation: string
  impact: string
}
```

---

### 2.4 CMS & Plugin Version Detection 🔌

**Security Risk:** MEDIUM-HIGH (depends on version age)
**Business Value:** ⚡⚡ Excellent for general websites, broad appeal
**Implementation Complexity:** Low

#### What We Detect

Outdated CMS platforms and plugins:
- **WordPress** versions and plugins
- **Shopify** apps
- **Drupal** versions
- **Joomla** versions
- Known CVEs for detected versions

#### Technical Implementation

**Location:** Extend `/src/worker/config/tech-detection-rules.ts`

**Enhanced WordPress Detection:**

```typescript
async function detectWordPressDetails(page: Page): Promise<WordPressFinding | null> {
  const html = await page.content()

  // Detect WordPress version
  let version: string | null = null
  const versionPatterns = [
    /<meta name="generator" content="WordPress ([\d.]+)"/i,
    /wp-includes\/js\/.*ver=([\d.]+)/i,
    /wp-content\/.*ver=([\d.]+)/i,
  ]

  for (const pattern of versionPatterns) {
    const match = html.match(pattern)
    if (match) {
      version = match[1]
      break
    }
  }

  // Detect plugins
  const pluginPattern = /wp-content\/plugins\/([^\/]+)\//gi
  const pluginMatches = html.matchAll(pluginPattern)
  const plugins = [...new Set(Array.from(pluginMatches).map(m => m[1]))]

  // Detect theme
  const themePattern = /wp-content\/themes\/([^\/]+)\//i
  const themeMatch = html.match(themePattern)
  const theme = themeMatch ? themeMatch[1] : null

  if (!version && plugins.length === 0) {
    return null // Not WordPress or not detectable
  }

  // Check for known vulnerabilities
  const vulnerabilities = await checkWordPressVulnerabilities(version, plugins)

  return {
    type: 'wordpress_detection',
    severity: vulnerabilities.length > 0 ? 'high' : 'low',
    title: 'WordPress CMS Detected',
    description: `WordPress ${version || 'version unknown'} detected with ${plugins.length} plugins`,
    evidence: {
      version: version || 'unknown',
      plugins: plugins,
      theme: theme,
      vulnerabilityCount: vulnerabilities.length,
      knownVulnerabilities: vulnerabilities,
    },
    recommendation: vulnerabilities.length > 0
      ? 'Update WordPress and plugins to latest versions to fix known vulnerabilities'
      : 'Keep WordPress and plugins updated',
    impact: vulnerabilities.length > 0
      ? `${vulnerabilities.length} known vulnerabilities detected in WordPress core or plugins`
      : 'No immediate vulnerabilities detected',
  }
}

async function checkWordPressVulnerabilities(
  version: string | null,
  plugins: string[]
): Promise<Vulnerability[]> {
  // Integration with WPScan Vulnerability Database (future)
  // For now, check against known major vulnerabilities

  const vulnerabilities: Vulnerability[] = []

  // Example: Check if version is outdated
  if (version) {
    const versionNumber = parseFloat(version)
    if (versionNumber < 6.0) {
      vulnerabilities.push({
        type: 'outdated_wordpress',
        severity: 'high',
        description: `WordPress ${version} is outdated (current: 6.4+)`,
        cve: null,
      })
    }
  }

  // Check common vulnerable plugins
  const knownVulnerablePlugins = [
    'elementor',
    'contact-form-7',
    'wordfence',
    'yoast',
    'woocommerce',
  ]

  for (const plugin of plugins) {
    if (knownVulnerablePlugins.includes(plugin)) {
      // Future: Query WPScan API for specific plugin vulnerabilities
    }
  }

  return vulnerabilities
}
```

**Shopify Detection:**

```typescript
async function detectShopify(page: Page): Promise<ShopifyFinding | null> {
  const html = await page.content()

  // Check for Shopify indicators
  const isShopify = (
    html.includes('cdn.shopify.com') ||
    html.includes('myshopify.com') ||
    html.includes('Shopify.theme') ||
    html.includes('window.Shopify')
  )

  if (!isShopify) return null

  // Detect Shopify apps via script tags
  const appPatterns = [
    /cdn\.shopify\.com\/s\/files\/1\/\d+\/\d+\/t\/\d+\/assets\/([^.]+)/gi,
    /apps\.shopify\.com\/([^\/\?"']+)/gi,
  ]

  const apps: string[] = []
  for (const pattern of appPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      apps.push(match[1])
    }
  }

  return {
    type: 'shopify_detection',
    severity: 'low',
    title: 'Shopify E-commerce Platform Detected',
    description: `Shopify store detected with ${apps.length} identified apps`,
    evidence: {
      platform: 'Shopify',
      apps: [...new Set(apps)],
    },
    recommendation: 'Review installed Shopify apps for security and privacy compliance',
    impact: 'Shopify apps may introduce security or privacy risks if not properly vetted',
  }
}
```

---

## Priority 3: Infrastructure & Reputation Analysis

**Why This Matters:** These findings appeal to **C-level executives** and **IT managers** who care about brand reputation and infrastructure security.

### 3.1 DNS Email Security (SPF, DKIM, DMARC) 📧

**Security Risk:** MEDIUM
**Business Value:** ⚡ Strong C-level appeal, brand protection
**Implementation Complexity:** Medium

#### What We Detect

Missing or misconfigured email authentication records:
- **SPF** (Sender Policy Framework) - prevents email spoofing
- **DKIM** (DomainKeys Identified Mail) - email signature verification
- **DMARC** (Domain-based Message Authentication) - email policy enforcement

**Why This Matters:** Without proper DNS records, attackers can impersonate your domain in phishing emails.

#### Technical Implementation

**Location:** `/src/worker/analyzers/dns-security.ts` (NEW FILE)

**Dependencies:**
```bash
npm install mailauth
```

**Detection Process:**

```typescript
import { dnsResolver } from 'mailauth'

async function checkEmailSecurity(domain: string): Promise<EmailSecurityFinding[]> {
  const findings: EmailSecurityFinding[] = []

  // Check SPF
  const spfRecord = await checkSPF(domain)
  if (!spfRecord.exists) {
    findings.push({
      type: 'missing_spf',
      severity: 'medium',
      title: 'Missing SPF (Sender Policy Framework) Record',
      description: `Domain ${domain} does not have an SPF record`,
      evidence: {
        domain: domain,
        recordType: 'SPF',
        status: 'missing',
      },
      recommendation: 'Add an SPF record to your DNS to prevent email spoofing',
      impact: 'Attackers can easily impersonate your domain in phishing emails',
    })
  } else if (spfRecord.issues.length > 0) {
    findings.push({
      type: 'misconfigured_spf',
      severity: 'medium',
      title: 'SPF Record Misconfiguration',
      description: `SPF record found but has issues: ${spfRecord.issues.join(', ')}`,
      evidence: {
        domain: domain,
        recordType: 'SPF',
        status: 'misconfigured',
        record: spfRecord.record,
        issues: spfRecord.issues,
      },
      recommendation: 'Fix SPF record configuration',
      impact: 'Current SPF configuration may not properly prevent email spoofing',
    })
  }

  // Check DKIM (requires selector, check common ones)
  const dkimResult = await checkDKIM(domain)
  if (!dkimResult.exists) {
    findings.push({
      type: 'missing_dkim',
      severity: 'medium',
      title: 'Missing DKIM (DomainKeys Identified Mail) Record',
      description: `Domain ${domain} does not have detectable DKIM records`,
      evidence: {
        domain: domain,
        recordType: 'DKIM',
        status: 'missing',
        selectorsChecked: dkimResult.selectorsChecked,
      },
      recommendation: 'Configure DKIM signing for your email to improve deliverability and security',
      impact: 'Email recipients cannot verify that emails from your domain are authentic',
    })
  }

  // Check DMARC
  const dmarcRecord = await checkDMARC(domain)
  if (!dmarcRecord.exists) {
    findings.push({
      type: 'missing_dmarc',
      severity: 'medium',
      title: 'Missing DMARC (Domain-based Message Authentication) Record',
      description: `Domain ${domain} does not have a DMARC policy`,
      evidence: {
        domain: domain,
        recordType: 'DMARC',
        status: 'missing',
      },
      recommendation: 'Implement a DMARC policy to prevent email spoofing and improve deliverability',
      impact: 'Without DMARC, you have no control over how receiving servers handle spoofed emails from your domain',
    })
  } else if (dmarcRecord.policy === 'none') {
    findings.push({
      type: 'weak_dmarc',
      severity: 'low',
      title: 'DMARC Policy Set to "none"',
      description: `DMARC record exists but policy is set to "none" (monitoring only)`,
      evidence: {
        domain: domain,
        recordType: 'DMARC',
        status: 'weak',
        record: dmarcRecord.record,
        policy: dmarcRecord.policy,
      },
      recommendation: 'Upgrade DMARC policy to "quarantine" or "reject" for stronger protection',
      impact: 'Current DMARC policy does not enforce any actions against spoofed emails',
    })
  }

  return findings
}

async function checkSPF(domain: string): Promise<SPFResult> {
  try {
    const records = await dnsResolver.resolveTxt(domain)
    const spfRecord = records.find((record) =>
      record.join('').startsWith('v=spf1')
    )

    if (!spfRecord) {
      return { exists: false, issues: [] }
    }

    const spfString = spfRecord.join('')
    const issues: string[] = []

    // Check for common issues
    if (spfString.includes('?all')) {
      issues.push('Uses ?all (neutral) instead of -all (fail) or ~all (softfail)')
    }

    if (spfString.includes('+all')) {
      issues.push('Uses +all (pass all) which defeats the purpose of SPF')
    }

    // Count DNS lookups (max 10 per RFC 7208)
    const lookupCount = (spfString.match(/include:|a:|mx:|ptr:/g) || []).length
    if (lookupCount > 10) {
      issues.push(`Exceeds 10 DNS lookups (${lookupCount} found)`)
    }

    return {
      exists: true,
      record: spfString,
      issues: issues,
    }
  } catch (error) {
    return { exists: false, issues: ['DNS lookup failed'] }
  }
}

async function checkDKIM(domain: string): Promise<DKIMResult> {
  // Common DKIM selectors to check
  const commonSelectors = [
    'default',
    'google',
    'k1',
    's1',
    's2',
    'selector1',
    'selector2',
    'mail',
    'dkim',
    'email',
  ]

  for (const selector of commonSelectors) {
    try {
      const dkimDomain = `${selector}._domainkey.${domain}`
      const records = await dnsResolver.resolveTxt(dkimDomain)

      const dkimRecord = records.find((record) =>
        record.join('').includes('v=DKIM1')
      )

      if (dkimRecord) {
        return {
          exists: true,
          selector: selector,
          record: dkimRecord.join(''),
          selectorsChecked: commonSelectors,
        }
      }
    } catch {
      // Selector doesn't exist, continue
    }
  }

  return {
    exists: false,
    selectorsChecked: commonSelectors,
  }
}

async function checkDMARC(domain: string): Promise<DMARCResult> {
  try {
    const dmarcDomain = `_dmarc.${domain}`
    const records = await dnsResolver.resolveTxt(dmarcDomain)

    const dmarcRecord = records.find((record) =>
      record.join('').startsWith('v=DMARC1')
    )

    if (!dmarcRecord) {
      return { exists: false }
    }

    const dmarcString = dmarcRecord.join('')

    // Extract policy
    const policyMatch = dmarcString.match(/p=([^;]+)/)
    const policy = policyMatch ? policyMatch[1].trim() : 'unknown'

    return {
      exists: true,
      record: dmarcString,
      policy: policy as 'none' | 'quarantine' | 'reject',
    }
  } catch (error) {
    return { exists: false }
  }
}
```

---

### 3.2 Session Recording Scripts (Hotjar, FullStory) 👁️

**Security Risk:** LOW-MEDIUM (privacy concern)
**Business Value:** ⚡ Strong GDPR/privacy angle, excellent for EU clients
**Implementation Complexity:** Low

#### What We Detect

Session recording and replay scripts:
- **Hotjar** - session recording
- **FullStory** - session replay
- **LogRocket** - session monitoring
- **Smartlook** - visitor recording
- **MouseFlow** - heatmaps and recordings

**Why This Matters:** These tools capture keystrokes, form inputs, and user behavior. If not properly configured, they can record sensitive data (passwords, credit cards) in violation of GDPR.

#### Technical Implementation

**Location:** `/src/worker/analyzers/privacy-trackers.ts` (NEW FILE)

**Detection Patterns:**

```typescript
export const SESSION_RECORDING_SCRIPTS = [
  // Hotjar
  {
    name: 'Hotjar',
    patterns: [
      /static\.hotjar\.com/i,
      /window\.hj\s*=/i,
      /_hjSettings/i,
    ],
    globalObject: 'hj',
  },

  // FullStory
  {
    name: 'FullStory',
    patterns: [
      /fullstory\.com/i,
      /window\.FS/i,
      /window\._fs_/i,
    ],
    globalObject: 'FS',
  },

  // LogRocket
  {
    name: 'LogRocket',
    patterns: [
      /logrocket\.com/i,
      /window\.LogRocket/i,
    ],
    globalObject: 'LogRocket',
  },

  // Smartlook
  {
    name: 'Smartlook',
    patterns: [
      /smartlook\.com/i,
      /window\.smartlook/i,
    ],
    globalObject: 'smartlook',
  },

  // MouseFlow
  {
    name: 'MouseFlow',
    patterns: [
      /mouseflow\.com/i,
      /window\._mfq/i,
    ],
    globalObject: '_mfq',
  },
]

async function detectSessionRecording(page: Page): Promise<SessionRecordingFinding[]> {
  const findings: SessionRecordingFinding[] = []

  // Check page content for script sources
  const html = await page.content()

  // Check for global objects
  const globalObjects = await page.evaluate(() => {
    const detected: string[] = []

    if (typeof (window as any).hj !== 'undefined') detected.push('Hotjar')
    if (typeof (window as any).FS !== 'undefined') detected.push('FullStory')
    if (typeof (window as any).LogRocket !== 'undefined') detected.push('LogRocket')
    if (typeof (window as any).smartlook !== 'undefined') detected.push('Smartlook')
    if (typeof (window as any)._mfq !== 'undefined') detected.push('MouseFlow')

    return detected
  })

  // Check patterns in HTML
  for (const script of SESSION_RECORDING_SCRIPTS) {
    const detected = script.patterns.some(pattern => pattern.test(html))

    if (detected || globalObjects.includes(script.name)) {
      findings.push({
        type: 'session_recording_detected',
        severity: 'medium',
        title: `${script.name} Session Recording Detected`,
        description: `${script.name} is recording user sessions, which may capture sensitive data`,
        evidence: {
          tool: script.name,
          detectionMethod: detected ? 'script_source' : 'global_object',
          privacyConcerns: [
            'May record form inputs including passwords',
            'May capture credit card numbers',
            'May record personal identifiable information (PII)',
            'GDPR compliance concerns if not properly configured',
          ],
        },
        recommendation: `Ensure ${script.name} is configured to:
          1. Exclude password fields and payment forms
          2. Obtain explicit user consent (GDPR requirement)
          3. Implement data minimization practices
          4. Have a clear privacy policy disclosing session recording`,
        impact: 'Session recording tools can capture sensitive user data if not properly configured, potentially violating GDPR and other privacy regulations',
      })
    }
  }

  return findings
}
```

---

### 3.3 Insecure Forms (HTTP action on HTTPS page) 🔓

**Security Risk:** HIGH
**Business Value:** ⚡⚡ Very clear visual issue, easy to understand
**Implementation Complexity:** Low

#### What We Detect

Mixed content vulnerabilities in forms:
- Forms with `action="http://..."` on HTTPS pages
- Form submissions downgrading to HTTP
- Insecure password fields
- Mixed content warnings

**Why This Matters:** Form data sent over HTTP is transmitted in plain text and can be intercepted by attackers (man-in-the-middle attacks).

#### Technical Implementation

**Location:** `/src/worker/analyzers/form-security.ts` (NEW FILE)

**Detection Process:**

```typescript
async function detectInsecureForms(page: Page): Promise<InsecureFormFinding[]> {
  const findings: InsecureFormFinding[] = []

  // Check if page is served over HTTPS
  const pageUrl = page.url()
  const isHttps = pageUrl.startsWith('https://')

  if (!isHttps) {
    // Page itself is HTTP, no mixed content to detect
    return findings
  }

  // Analyze all forms on the page
  const formData = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form'))

    return forms.map((form, index) => {
      const action = form.getAttribute('action') || ''
      const method = form.getAttribute('method') || 'get'

      // Check for password inputs
      const hasPasswordField = form.querySelector('input[type="password"]') !== null

      // Check for sensitive input types
      const hasCreditCardField = form.querySelector(
        'input[name*="card"], input[name*="credit"], input[autocomplete="cc-number"]'
      ) !== null

      return {
        index: index,
        action: action,
        method: method.toUpperCase(),
        hasPasswordField: hasPasswordField,
        hasCreditCardField: hasCreditCardField,
        formId: form.id || null,
      }
    })
  })

  // Check each form for security issues
  for (const form of formData) {
    // Check if form action uses HTTP
    if (form.action.startsWith('http://')) {
      findings.push({
        type: 'insecure_form_action',
        severity: 'high',
        title: 'Form Submits to Insecure HTTP Endpoint',
        description: `Form ${form.formId || '#' + form.index} on HTTPS page submits to HTTP URL`,
        evidence: {
          formId: form.formId,
          formIndex: form.index,
          action: form.action,
          method: form.method,
          hasPasswordField: form.hasPasswordField,
          hasCreditCardField: form.hasCreditCardField,
        },
        recommendation: 'Change form action to use HTTPS instead of HTTP',
        impact: form.hasPasswordField || form.hasCreditCardField
          ? 'CRITICAL: Sensitive data (passwords/credit cards) will be transmitted in plain text over HTTP'
          : 'Form data will be transmitted in plain text over HTTP and can be intercepted',
      })
    }

    // Check for relative actions that might resolve to HTTP
    if (form.action && !form.action.startsWith('http') && !form.action.startsWith('/')) {
      // Could be relative, needs manual review
      findings.push({
        type: 'potentially_insecure_form',
        severity: 'low',
        title: 'Form with Relative Action URL',
        description: `Form ${form.formId || '#' + form.index} has relative action, verify it resolves to HTTPS`,
        evidence: {
          formId: form.formId,
          formIndex: form.index,
          action: form.action,
          method: form.method,
        },
        recommendation: 'Use absolute HTTPS URLs for form actions',
        impact: 'Relative URLs may resolve incorrectly in certain contexts',
      })
    }
  }

  return findings
}
```

---

### 3.4 Domain Reputation (Google Safe Browsing) 🛡️

**Security Risk:** CRITICAL (if flagged)
**Business Value:** ⚡⚡⚡ Enormous C-level concern, brand protection
**Implementation Complexity:** Low

#### What We Detect

Domain reputation issues:
- Malware hosting flags
- Phishing flags
- Social engineering flags
- Unwanted software distribution

**Why This Matters:** If your domain is flagged by Google Safe Browsing, browsers will show warning pages to visitors, destroying trust and traffic.

#### Technical Implementation

**Location:** `/src/worker/analyzers/domain-reputation.ts` (NEW FILE)

**Dependencies:**
```bash
npm install safe-browse-url-lookup
```

**API Setup:**
1. Get Google Safe Browsing API key: https://developers.google.com/safe-browsing/v4/get-started
2. Add to `.env`: `GOOGLE_SAFE_BROWSING_API_KEY=your_key_here`

**Detection Process:**

```typescript
import SafeBrowse from 'safe-browse-url-lookup'

async function checkDomainReputation(url: string): Promise<ReputationFinding | null> {
  try {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY

    if (!apiKey) {
      console.warn('Google Safe Browsing API key not configured')
      return null
    }

    const safeBrowse = new SafeBrowse(apiKey)
    const result = await safeBrowse.checkSingle(url)

    if (result && result.threats && result.threats.length > 0) {
      const threat = result.threats[0]

      return {
        type: 'domain_reputation_issue',
        severity: 'critical',
        title: 'Domain Flagged by Google Safe Browsing',
        description: `Your domain is flagged for: ${threat.threatType}`,
        evidence: {
          url: url,
          threatType: threat.threatType,
          platformType: threat.platformType,
          threatEntryType: threat.threatEntryType,
          detectionDate: new Date().toISOString(),
        },
        recommendation: 'URGENT: Request review through Google Search Console and investigate source of threat',
        impact: 'Browsers will show warning pages to visitors. This severely impacts traffic and trust.',
      }
    }

    return null // Domain is clean
  } catch (error) {
    console.error('Safe Browsing API error:', error)
    return null
  }
}

// Threat types from Google Safe Browsing API
enum ThreatType {
  MALWARE = 'MALWARE',
  SOCIAL_ENGINEERING = 'SOCIAL_ENGINEERING',
  UNWANTED_SOFTWARE = 'UNWANTED_SOFTWARE',
  POTENTIALLY_HARMFUL_APPLICATION = 'POTENTIALLY_HARMFUL_APPLICATION',
}
```

---

## Implementation Architecture

### File Structure

```
src/worker/analyzers/
├── ai-prompt-exposure.ts         (NEW)
├── embedding-vector-detection.ts  (NEW)
├── ai-cors-checker.ts             (NEW)
├── output-validation.ts           (NEW)
├── storage-security.ts            (NEW)
├── file-exposure.ts               (NEW)
├── dns-security.ts                (NEW)
├── privacy-trackers.ts            (NEW)
├── form-security.ts               (NEW)
├── domain-reputation.ts           (NEW)
└── advanced-ai-detection-rules.ts (EXTEND)
```

### Integration Points

**1. Main Analyzer Orchestrator:**

Location: `/src/worker/analyzers/index.ts`

```typescript
import { analyzePromptExposure } from './ai-prompt-exposure'
import { analyzeEmbeddingVectors } from './embedding-vector-detection'
import { analyzeAICORS } from './ai-cors-checker'
import { analyzeOutputValidation } from './output-validation'
import { analyzeStorageSecurity } from './storage-security'
import { analyzeFileExposure } from './file-exposure'
import { analyzeDNSSecurity } from './dns-security'
import { analyzePrivacyTrackers } from './privacy-trackers'
import { analyzeFormSecurity } from './form-security'
import { analyzeDomainReputation } from './domain-reputation'

export async function runAllAnalyzers(page: Page, url: string): Promise<Finding[]> {
  const findings: Finding[] = []

  // Priority 1: AI-Specific Analyzers
  findings.push(...await analyzePromptExposure(page))
  findings.push(...await analyzeEmbeddingVectors(page))
  findings.push(...await analyzeAICORS(page, url))

  // Priority 2: Client-Side Security
  findings.push(...await analyzeOutputValidation(page))
  findings.push(...await analyzeStorageSecurity(page))
  findings.push(...await analyzeFileExposure(url))

  // Priority 3: Infrastructure & Reputation
  findings.push(...await analyzeDNSSecurity(url))
  findings.push(...await analyzePrivacyTrackers(page))
  findings.push(...await analyzeFormSecurity(page))
  findings.push(...await analyzeDomainReputation(url))

  return findings
}
```

**2. Error Handling:**

Each analyzer should have independent error handling to prevent one failure from breaking the entire scan:

```typescript
export async function analyzePromptExposure(page: Page): Promise<Finding[]> {
  try {
    // Analysis logic here
    return findings
  } catch (error) {
    console.error('Prompt exposure analyzer failed:', error)
    return [] // Return empty array, don't crash
  }
}
```

**3. Performance Optimization:**

Run analyzers in parallel where possible:

```typescript
export async function runAllAnalyzers(page: Page, url: string): Promise<Finding[]> {
  const [
    promptFindings,
    embeddingFindings,
    corsFindings,
    // ... etc
  ] = await Promise.all([
    analyzePromptExposure(page),
    analyzeEmbeddingVectors(page),
    analyzeAICORS(page, url),
    // ... etc
  ])

  return [
    ...promptFindings,
    ...embeddingFindings,
    ...corsFindings,
    // ... etc
  ]
}
```

---

## Database Schema Changes

**Location:** `/prisma/schema.prisma`

No schema changes required! All new findings use the existing `findings` JSONB field in the `Scan` model.

However, for better querying and analytics, consider adding indexes:

```prisma
model Scan {
  id          String   @id @default(uuid())
  url         String
  domain      String
  status      ScanStatus
  findings    Json     @default("[]")
  riskScore   Int?
  riskLevel   RiskLevel?

  // Add indexes for better query performance
  @@index([domain])
  @@index([riskLevel])
  @@index([status])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Frontend UI Components

### New Sections in Report

**Location:** `/src/app/scan/[id]/page.tsx`

Add new collapsible sections for the new finding categories:

```typescript
<section className="mb-8">
  <h2 className="text-2xl font-bold text-white mb-4">
    🎯 AI-Specific Security Findings
  </h2>

  {aiFindings.length === 0 ? (
    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
      <p className="text-green-300">✓ No AI-specific vulnerabilities detected</p>
    </div>
  ) : (
    <div className="space-y-4">
      {aiFindings.map((finding, index) => (
        <FindingCard key={index} finding={finding} />
      ))}
    </div>
  )}
</section>

<section className="mb-8">
  <h2 className="text-2xl font-bold text-white mb-4">
    🔒 Client-Side Security Issues
  </h2>
  {/* Similar structure */}
</section>

<section className="mb-8">
  <h2 className="text-2xl font-bold text-white mb-4">
    🏗️ Infrastructure & Reputation
  </h2>
  {/* Similar structure */}
</section>
```

### Finding Card Component

Enhance the existing `FindingCard` component to handle new finding types:

```typescript
interface FindingCardProps {
  finding: Finding
}

export function FindingCard({ finding }: FindingCardProps) {
  const severityColors = {
    critical: 'bg-red-500/20 border-red-500',
    high: 'bg-orange-500/20 border-orange-500',
    medium: 'bg-yellow-500/20 border-yellow-500',
    low: 'bg-blue-500/20 border-blue-500',
  }

  const severityIcons = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️',
  }

  return (
    <div className={`border-l-4 rounded-lg p-6 ${severityColors[finding.severity]}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>{severityIcons[finding.severity]}</span>
          {finding.title}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${severityColors[finding.severity]}`}>
          {finding.severity}
        </span>
      </div>

      <p className="text-slate-300 mb-4">{finding.description}</p>

      {finding.evidence && (
        <div className="bg-black/30 rounded p-4 mb-4 font-mono text-sm">
          <pre className="whitespace-pre-wrap text-slate-400">
            {JSON.stringify(finding.evidence, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-2">💡 Recommendation:</h4>
        <p className="text-slate-300 text-sm">{finding.recommendation}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white mb-2">📊 Impact:</h4>
        <p className="text-slate-300 text-sm">{finding.impact}</p>
      </div>
    </div>
  )
}
```

---

## Risk Scoring Impact

Update the risk score calculation to include new finding types:

**Location:** `/src/worker/risk-calculator.ts`

```typescript
const SEVERITY_WEIGHTS = {
  // AI-Specific (highest weight - unique differentiator)
  system_prompt_exposure: 90,
  embedding_vector_exposure: 95,
  cors_misconfiguration_ai_endpoint: 70,
  missing_rate_limiting: 40,

  // Client-Side Security
  unsafe_output_rendering: 70,
  insecure_token_storage: 75,
  package_file_exposure: 50,
  wordpress_detection: 30, // Base score, increases with vulnerabilities

  // Infrastructure & Reputation
  domain_reputation_issue: 100, // Highest priority
  missing_spf: 40,
  missing_dkim: 35,
  missing_dmarc: 35,
  session_recording_detected: 45,
  insecure_form_action: 80,

  // Existing types...
  exposed_api_key: 85,
  missing_security_header: 45,
  insecure_cookie: 55,
}

export function calculateRiskScore(findings: Finding[]): number {
  let score = 0

  for (const finding of findings) {
    const weight = SEVERITY_WEIGHTS[finding.type] || 50
    score += weight
  }

  // Normalize to 0-100 scale
  const normalized = Math.min(100, Math.round(score / 5))

  return normalized
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
```

---

## Testing Strategy

### Unit Tests

Create test files for each new analyzer:

```
src/worker/analyzers/__tests__/
├── ai-prompt-exposure.test.ts
├── embedding-vector-detection.test.ts
├── ai-cors-checker.test.ts
├── output-validation.test.ts
├── storage-security.test.ts
├── file-exposure.test.ts
├── dns-security.test.ts
├── privacy-trackers.test.ts
├── form-security.test.ts
└── domain-reputation.test.ts
```

**Example Test:**

```typescript
import { analyzePromptExposure } from '../ai-prompt-exposure'

describe('AI Prompt Exposure Analyzer', () => {
  it('should detect OpenAI system prompts', async () => {
    const mockPage = createMockPage({
      scripts: `
        const systemPrompt = {
          role: "system",
          content: "You are a helpful assistant that answers questions about products."
        }
      `
    })

    const findings = await analyzePromptExposure(mockPage)

    expect(findings).toHaveLength(1)
    expect(findings[0].type).toBe('system_prompt_exposure')
    expect(findings[0].severity).toBe('critical')
  })

  it('should not flag comments as prompts', async () => {
    const mockPage = createMockPage({
      scripts: `
        // Example: role: "system", content: "This is just a comment"
      `
    })

    const findings = await analyzePromptExposure(mockPage)

    expect(findings).toHaveLength(0)
  })
})
```

### Integration Tests

Test against real websites:

```typescript
const TEST_SITES = [
  { url: 'https://openai.com', expected: { aiFrameworks: ['OpenAI SDK'] } },
  { url: 'https://chat.openai.com', expected: { aiFrameworks: ['OpenAI SDK'] } },
  { url: 'https://wordpress.org', expected: { cms: 'WordPress' } },
  { url: 'https://shopify.com', expected: { cms: 'Shopify' } },
]

for (const site of TEST_SITES) {
  const scan = await runFullScan(site.url)
  // Verify expected findings
}
```

### False Positive Testing

Create a test suite of known clean sites to ensure low false positive rates:

```typescript
const CLEAN_SITES = [
  'https://stripe.com',
  'https://github.com',
  'https://vercel.com',
]

for (const site of CLEAN_SITES) {
  const scan = await runFullScan(site)
  const criticalFindings = scan.findings.filter(f => f.severity === 'critical')

  // Clean sites should have 0 critical findings
  expect(criticalFindings).toHaveLength(0)
}
```

---

## Success Metrics

### Technical Metrics

- **Scan Completion Rate:** > 95% (new analyzers should not break existing scans)
- **False Positive Rate:** < 5% (validate against known clean sites)
- **Average Scan Time:** < 90 seconds (with all new analyzers)
- **Analyzer Success Rate:** > 98% (each analyzer should fail gracefully)

### Business Metrics

- **Findings per Scan:** Target 15-25 findings on average
- **Critical Findings Rate:** 5-10% of scans should have critical findings
- **AI-Specific Finding Rate:** 20-30% of scans targeting AI-heavy sites
- **Lead Conversion Rate:** > 40% email capture rate (vs 35% baseline)

### Quality Metrics

- **Finding Relevance Score:** User feedback on finding usefulness
- **Remediation Clarity:** % of users who understand how to fix findings
- **Technical Credibility:** Developer feedback on accuracy

---

## Implementation Timeline

### Phase 1: Priority 1 - AI-Specific Analyzers (Week 1)

**Day 1-2:**
- ✅ Implement `ai-prompt-exposure.ts`
- ✅ Implement `embedding-vector-detection.ts`
- ✅ Write unit tests

**Day 3-4:**
- ✅ Implement `ai-cors-checker.ts` (with rate limiting check)
- ✅ Extend `advanced-ai-detection-rules.ts` for framework detection
- ✅ Write integration tests

**Day 5:**
- ✅ Frontend UI updates for AI findings section
- ✅ End-to-end testing
- ✅ Deploy to staging

### Phase 2: Priority 2 - Client-Side Security (Week 2)

**Day 1-2:**
- ✅ Implement `output-validation.ts`
- ✅ Implement `storage-security.ts`
- ✅ Write unit tests

**Day 3-4:**
- ✅ Implement `file-exposure.ts`
- ✅ Enhance WordPress/CMS detection
- ✅ Write integration tests

**Day 5:**
- ✅ Frontend UI updates for client-side findings
- ✅ Testing and bug fixes
- ✅ Deploy to staging

### Phase 3: Priority 3 - Infrastructure (Week 3)

**Day 1-2:**
- ✅ Implement `dns-security.ts` (SPF/DKIM/DMARC)
- ✅ Implement `privacy-trackers.ts`
- ✅ Write unit tests

**Day 3-4:**
- ✅ Implement `form-security.ts`
- ✅ Implement `domain-reputation.ts`
- ✅ Write integration tests

**Day 5:**
- ✅ Frontend UI updates for infrastructure findings
- ✅ Full regression testing
- ✅ Deploy to production

---

## Dependencies to Install

```bash
# DNS email security
npm install mailauth

# Google Safe Browsing
npm install safe-browse-url-lookup

# Testing
npm install --save-dev @types/jest jest ts-jest

# (Already installed)
# playwright
# @prisma/client
```

---

## Configuration Required

**Environment Variables** (`.env`):

```bash
# Google Safe Browsing API (optional but recommended)
GOOGLE_SAFE_BROWSING_API_KEY=your_api_key_here

# WPScan API (optional, for WordPress vulnerability database)
WPSCAN_API_KEY=your_api_key_here
```

---

## Risk Assessment & Legal Considerations

### ✅ Safe & Legal (Passive Analysis)

All analyzers in this specification perform **passive, read-only analysis** equivalent to:
- Viewing page source
- Reading publicly accessible files
- Checking DNS records (public information)
- Observing browser behavior
- Testing standard HTTP requests (OPTIONS for CORS)

### ⚠️ Borderline (Handle with Care)

- **CORS Testing:** Sending OPTIONS requests is standard and safe, but avoid sending actual POST requests with payloads
- **File Exposure:** Only check for publicly accessible files (package.json), do not attempt directory traversal
- **Google Safe Browsing:** Use official API, respect rate limits

### ❌ Avoid (Active Testing)

- **Directory Listing:** Do NOT attempt to enumerate directories (/images/, /uploads/)
- **Brute Force:** Do NOT attempt to guess hidden endpoints
- **Exploitation:** Do NOT attempt to exploit any discovered vulnerabilities
- **Rate Limit Testing:** Do NOT send excessive requests to trigger rate limits

---

## Monitoring & Observability

### Sentry Integration

Add error tracking for each analyzer:

```typescript
import * as Sentry from '@sentry/node'

export async function analyzePromptExposure(page: Page): Promise<Finding[]> {
  const transaction = Sentry.startTransaction({
    op: 'analyzer',
    name: 'ai-prompt-exposure',
  })

  try {
    const findings = await performAnalysis(page)
    transaction.setStatus('ok')
    return findings
  } catch (error) {
    transaction.setStatus('internal_error')
    Sentry.captureException(error, {
      tags: {
        analyzer: 'ai-prompt-exposure',
      },
    })
    return []
  } finally {
    transaction.finish()
  }
}
```

### Performance Monitoring

Track analyzer performance:

```typescript
const analyzerMetrics = {
  'ai-prompt-exposure': { avgTime: 0, successRate: 0 },
  'embedding-vector-detection': { avgTime: 0, successRate: 0 },
  // ... etc
}

// Update metrics after each run
analyzerMetrics['ai-prompt-exposure'].avgTime = calculateAverage(times)
analyzerMetrics['ai-prompt-exposure'].successRate = successes / total
```

---

## Appendix: Reference Links

### Research Sources

**AI Security:**
- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- Embedding Security (IronCore Labs): https://ironcorelabs.com/ai-encryption/
- Vector Database Security (Cobalt): https://www.cobalt.io/blog/vector-and-embedding-weaknesses

**Web Security:**
- OWASP Cross-Site Scripting Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- JWT Storage Best Practices: https://www.descope.com/blog/post/developer-guide-jwt-storage
- CORS Security: https://portswigger.net/web-security/cors

**Email Security:**
- Mailauth Library: https://github.com/postalsys/mailauth
- DMARC Guide: https://easydmarc.com/tools

**Privacy:**
- Hotjar GDPR Compliance: https://www.hotjar.com/privacy/gdpr-compliance/
- Session Replay Privacy Concerns: https://arxiv.org/pdf/2309.11253

**CMS Security:**
- WPScan: https://wpscan.com/
- WordPress Vulnerability Database: https://wpscan.com/wordpresses

---

## Appendix: Example Outputs

### Example System Prompt Finding

```json
{
  "type": "system_prompt_exposure",
  "severity": "critical",
  "title": "AI System Prompt Exposed in Client-Side Code",
  "description": "Found AI system instructions in JavaScript code that reveal your chatbot's behavior and constraints",
  "evidence": {
    "prompt": "You are a helpful customer service assistant for TechCorp. Always be polite and professional. Never reveal pricing information. If asked about competitors, redirect to our products...",
    "file": "https://example.com/assets/chatbot-config.js",
    "line": 42,
    "context": "const systemConfig = { role: 'system', content: '...' }",
    "confidence": "high"
  },
  "recommendation": "Move system prompts to server-side code. System instructions should never be visible in client-side JavaScript. Use environment variables and API endpoints to configure AI behavior.",
  "impact": "Your AI's instructions, business logic, and constraints are visible to anyone inspecting your website. Attackers can use this information to craft targeted prompt injection attacks that exploit known constraints."
}
```

### Example Embedding Vector Finding

```json
{
  "type": "embedding_vector_exposure",
  "severity": "critical",
  "title": "AI Embedding Vectors Exposed in Client-Side Code",
  "description": "Found 47 embedding vectors (1536 dimensions each) exposed in JavaScript, likely from OpenAI's text-embedding-ada-002 model",
  "evidence": {
    "vectorCount": 47,
    "dimensions": 1536,
    "file": "https://example.com/assets/knowledge-base.js",
    "sampleVector": "[-0.0123, 0.0456, -0.0789, 0.0321, ...",
    "estimatedProvider": "OpenAI",
    "confidence": "high"
  },
  "recommendation": "URGENT: Remove embedding vectors from client-side code immediately. Vectors should only be stored in your vector database (Pinecone, Weaviate, etc.) and accessed via authenticated API calls. These vectors represent your proprietary knowledge base and can be inverted to extract the original content.",
  "impact": "Your embedding vectors represent your proprietary data in numerical form. Modern inversion techniques can extract the original text from these vectors, potentially exposing confidential documents, customer data, or trade secrets. This is equivalent to publishing your entire RAG knowledge base publicly."
}
```

### Example JWT in localStorage Finding

```json
{
  "type": "insecure_token_storage",
  "severity": "high",
  "title": "JWT Token Stored in localStorage",
  "description": "Found JWT authentication token stored in localStorage under key 'auth_token'",
  "evidence": {
    "storageType": "localStorage",
    "key": "auth_token",
    "valuePreview": "eyJhbGciOiJ...zyxwv",
    "tokenType": "JWT"
  },
  "recommendation": "Store authentication tokens in HttpOnly cookies with Secure and SameSite flags. localStorage is accessible to all JavaScript running on your domain, making tokens vulnerable to XSS attacks. Use a dual-token strategy: short-lived access tokens in memory and refresh tokens in HttpOnly cookies.",
  "impact": "If an attacker exploits an XSS vulnerability on your site, they can steal the JWT token from localStorage and impersonate the user. HttpOnly cookies are not accessible to JavaScript, providing protection against XSS-based token theft."
}
```

---

## Document Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-10 | Initial specification document | Research Team |

---

**END OF SPECIFICATION**

This document is ready for review. Once approved, implementation can begin immediately following the 3-week timeline outlined in the Implementation Timeline section.

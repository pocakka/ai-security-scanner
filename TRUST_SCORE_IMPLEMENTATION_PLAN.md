# 🎯 AI Trust Score - Komplett Implementációs Terv

> **Verzió**: 2.0 Enhanced
> **Alapja**: trust_score_plan.md (Claude által elemezve és továbbfejlesztve)
> **Cél**: Scamadviser-szerű trust scoring + E-E-A-T content generation

---

## 📋 Tartalomjegyzék

1. [Áttekintés](#áttekintés)
2. [Adatbázis Architektúra](#adatbázis-architektúra)
3. [Backend Analyzer](#backend-analyzer)
4. [Frontend Megjelenítés](#frontend-megjelenítés)
5. [Súlyozási Rendszer](#súlyozási-rendszer)
6. [SEO & E-E-A-T Stratégia](#seo--e-e-a-t-stratégia)
7. [Implementációs Lépések](#implementációs-lépések)

---

## 🎯 Áttekintés

### Probléma
- Jelenlegi riportok csak **security findings**-ra fókuszálnak
- Nincs **aggregált, látványos pontszám** (mint Scamadviser)
- Hiányzik a **thick content** a programmatic SEO-hoz

### Megoldás: AI Trust Score
**15+ bináris ellenőrzés → 0-100 pontszám → 5 kategória**

```
🟢 85-100: Excellent AI Trust
🟡 70-84:  Good AI Trust
🟠 50-69:  Fair AI Trust
🔴 0-49:   Poor AI Trust
```

### Példa Megjelenítés (Frontend)

```
┌─────────────────────────────────────────────┐
│   🛡️  AI TRUST SCORE: 73/100 (Good)        │
├─────────────────────────────────────────────┤
│  Transparency:        ████████░░  80%       │
│  User Control:        ██████░░░░  60%       │
│  Compliance (GDPR):   ██████████  100%      │
│  Security:            ████████░░  80%       │
│  Ethical AI:          ████░░░░░░  40%       │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Adatbázis Architektúra

### Enhanced Prisma Schema

```prisma
// prisma/schema.prisma

model Scan {
  id                String              @id @default(uuid())
  url               String
  domain            String
  status            ScanStatus

  // ... existing fields ...

  // ÚJ: 1:1 kapcsolat AI Trust Scorecard-dal
  aiTrustScorecard  AiTrustScorecard?
}

model AiTrustScorecard {
  id                String   @id @default(uuid())
  scan              Scan     @relation(fields: [scanId], references: [id], onDelete: Cascade)
  scanId            String   @unique

  // ========================================
  // 1. TRANSPARENCY (Átláthatóság)
  // ========================================
  isProviderDisclosed      Boolean @default(false)
  isIdentityDisclosed      Boolean @default(false)
  isAiPolicyLinked         Boolean @default(false)
  isModelVersionDisclosed  Boolean @default(false)
  isLimitationsDisclosed   Boolean @default(false)
  hasDataUsageDisclosure   Boolean @default(false)

  // ========================================
  // 2. USER CONTROL (Felhasználói Kontroll)
  // ========================================
  hasFeedbackMechanism     Boolean @default(false)
  hasConversationReset     Boolean @default(false)
  hasHumanEscalation       Boolean @default(false)
  hasConversationExport    Boolean @default(false)
  hasDataDeletionOption    Boolean @default(false)

  // ========================================
  // 3. COMPLIANCE (Szabályozás)
  // ========================================
  hasDpoContact            Boolean @default(false)
  hasCookieBanner          Boolean @default(false)
  hasPrivacyPolicyLink     Boolean @default(false)
  hasTermsOfServiceLink    Boolean @default(false)
  hasGdprCompliance        Boolean @default(false)

  // ========================================
  // 4. SECURITY & RELIABILITY (Robusztusság)
  // ========================================
  hasBotProtection         Boolean @default(false)
  hasAiRateLimitHeaders    Boolean @default(false)
  hasBasicWebSecurity      Boolean @default(false)
  hasInputLengthLimit      Boolean @default(false)
  usesInputSanitization    Boolean @default(false)
  hasErrorHandling         Boolean @default(false)
  hasSessionManagement     Boolean @default(false)

  // ========================================
  // 5. ETHICAL AI (Etikus AI Gyakorlatok)
  // ========================================
  hasBiasDisclosure        Boolean @default(false)
  hasContentModeration     Boolean @default(false)
  hasAgeVerification       Boolean @default(false)
  hasAccessibilitySupport  Boolean @default(false)

  // ========================================
  // SCORES & METADATA
  // ========================================
  score                    Int      @default(0)    // Overall 0-100
  categoryScores           Json?                   // { transparency: 80, userControl: 60, ... }
  weightedScore            Int      @default(0)    // Weighted by importance

  passedChecks             Int      @default(0)
  totalChecks              Int      @default(0)

  // ========================================
  // DETECTED AI TECHNOLOGY
  // ========================================
  detectedAiProvider       String?                 // "OpenAI", "Anthropic", etc.
  detectedModel            String?                 // "GPT-4", "Claude-3-Opus"
  detectedChatFramework    String?                 // "Intercom", "Drift", "Custom"

  // Evidence for transparency
  evidenceData             Json?                   // Proof for each check

  analyzedAt               DateTime @default(now())

  @@index([scanId])
}
```

### Migráció Parancs

```bash
npx prisma migrate dev --name add_ai_trust_scorecard
```

---

## 🔍 Backend Analyzer

### Fájl: `src/worker/analyzers/ai-trust-analyzer.ts`

```typescript
import { CrawlResult } from '../crawler-mock'

export interface AiTrustResult {
  score: number
  weightedScore: number
  categoryScores: {
    transparency: number
    userControl: number
    compliance: number
    security: number
    ethicalAi: number
  }
  passedChecks: number
  totalChecks: number
  grade: 'excellent' | 'good' | 'fair' | 'poor'
  detectedAiProvider?: string
  detectedModel?: string
  detectedChatFramework?: string
  checks: Record<string, boolean>
  evidenceData: Record<string, string[]>
}

// ========================================
// PATTERN DEFINITIONS
// ========================================

const AI_PROVIDERS = {
  openai: ['powered by openai', 'openai.com', 'chatgpt'],
  anthropic: ['powered by anthropic', 'claude.ai', 'anthropic.com'],
  google: ['powered by google', 'gemini', 'bard', 'palm'],
  meta: ['powered by meta', 'llama'],
  cohere: ['powered by cohere'],
  huggingface: ['huggingface', 'transformers'],
}

const AI_MODELS = {
  'gpt-4': ['gpt-4', 'gpt-4-turbo'],
  'gpt-3.5': ['gpt-3.5', 'chatgpt-3.5'],
  'claude-3': ['claude-3', 'claude-3-opus', 'claude-3-sonnet'],
  'gemini': ['gemini-pro', 'gemini-ultra'],
}

const CHAT_FRAMEWORKS = {
  intercom: ['intercom.com', 'id="intercom'],
  drift: ['drift.com', 'drift-frame'],
  tidio: ['tidio.com', 'tidio-chat'],
  zendesk: ['zendesk.com', 'web-widget'],
  freshchat: ['freshchat.com', 'fc-widget'],
}

// ========================================
// CATEGORY 1: TRANSPARENCY PATTERNS
// ========================================

const TRANSPARENCY_PATTERNS = {
  providerDisclosed: [
    'powered by openai',
    'powered by anthropic',
    'powered by google ai',
    'uses chatgpt',
    'claude assistant',
  ],
  identityDisclosed: [
    'i am an ai',
    'ai assistant',
    'virtual assistant',
    'automated chat',
    'bot assistant',
  ],
  aiPolicyLinked: [
    'href="/ai-policy"',
    'href="/ai-usage"',
    'href="/responsible-ai"',
    '/artificial-intelligence-policy',
  ],
  modelVersionDisclosed: [
    'gpt-4',
    'gpt-3.5',
    'claude-3',
    'gemini-pro',
    'model:',
    'version:',
  ],
  limitationsDisclosed: [
    'ai may make mistakes',
    'ai can be wrong',
    'verify information',
    'may not be accurate',
    'ai-generated content',
  ],
  dataUsageDisclosure: [
    'not used for training',
    'data retention',
    'how we use your data',
    'conversation storage',
  ],
}

// ========================================
// CATEGORY 2: USER CONTROL PATTERNS
// ========================================

const USER_CONTROL_PATTERNS = {
  feedbackMechanism: [
    'thumb-up',
    'thumb-down',
    'thumbsup',
    'thumbsdown',
    'feedback',
    'rate this response',
  ],
  conversationReset: [
    'new chat',
    'reset conversation',
    'clear chat',
    'start over',
  ],
  humanEscalation: [
    'talk to human',
    'speak to agent',
    'contact support',
    'escalate to human',
  ],
  conversationExport: [
    'export chat',
    'download conversation',
    'save transcript',
  ],
  dataDeletion: [
    'delete my data',
    'forget me',
    'erase conversation',
    'gdpr request',
  ],
}

// ========================================
// CATEGORY 3: COMPLIANCE PATTERNS
// ========================================

const COMPLIANCE_PATTERNS = {
  dpoContact: [
    'mailto:privacy@',
    'mailto:dpo@',
    'data protection officer',
    'privacy officer',
  ],
  cookieBanner: [
    'id="cookie-consent"',
    'class="cookie-banner"',
    'id="onetrust',
    'cookiebot',
  ],
  privacyPolicy: [
    'href="/privacy-policy"',
    'href="/privacy"',
    '/adatvedelem',
  ],
  termsOfService: [
    'href="/terms"',
    'href="/tos"',
    'terms of service',
    'felhasználási feltételek',
  ],
  gdprCompliance: [
    'gdpr compliant',
    'gdpr-ready',
    'general data protection',
    'adatvédelmi rendelet',
  ],
}

// ========================================
// CATEGORY 4: SECURITY PATTERNS
// ========================================

const SECURITY_PATTERNS = {
  botProtection: [
    'recaptcha',
    'hcaptcha',
    'turnstile',
    'captcha',
  ],
  inputLengthLimit: [
    '<textarea maxlength=',
    '<input maxlength=',
    'character limit',
  ],
  inputSanitization: [
    'dompurify',
    'sanitize-html',
    'xss-filter',
  ],
  errorHandling: [
    'error boundary',
    'something went wrong',
    'try again later',
    'error occurred',
  ],
  sessionManagement: [
    'session-id',
    'csrf-token',
    'x-csrf-token',
  ],
}

// ========================================
// CATEGORY 5: ETHICAL AI PATTERNS
// ========================================

const ETHICAL_AI_PATTERNS = {
  biasDisclosure: [
    'may contain bias',
    'bias in ai',
    'fairness disclaimer',
  ],
  contentModeration: [
    'content policy',
    'prohibited content',
    'usage policy',
    'harmful content',
  ],
  ageVerification: [
    'are you 18',
    'age verification',
    'minimum age',
    '18+',
  ],
  accessibilitySupport: [
    'aria-label',
    'role="',
    'screen reader',
    'aria-',
  ],
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function checkPatternsInText(text: string, patterns: string[]): { found: boolean; evidence: string[] } {
  const lowerText = text.toLowerCase()
  const evidence: string[] = []

  for (const pattern of patterns) {
    if (lowerText.includes(pattern.toLowerCase())) {
      evidence.push(pattern)
    }
  }

  return { found: evidence.length > 0, evidence }
}

function checkPatternsInScripts(scripts: string[], patterns: string[]): { found: boolean; evidence: string[] } {
  const evidence: string[] = []

  for (const script of scripts) {
    const lowerScript = script.toLowerCase()
    for (const pattern of patterns) {
      if (lowerScript.includes(pattern.toLowerCase())) {
        evidence.push(pattern)
      }
    }
  }

  return { found: evidence.length > 0, evidence }
}

function checkPatternsInNetworkRequests(
  requests: { url: string; headers: Record<string, string> }[],
  urlPatterns: string[],
  headerKey?: string
): { found: boolean; evidence: string[] } {
  const evidence: string[] = []

  for (const req of requests) {
    const lowerUrl = req.url.toLowerCase()

    // Check URL patterns
    for (const pattern of urlPatterns) {
      if (lowerUrl.includes(pattern.toLowerCase())) {
        if (headerKey) {
          // Check if specific header exists
          const headerKeys = Object.keys(req.headers).map(k => k.toLowerCase())
          if (headerKeys.some(k => k.startsWith(headerKey.toLowerCase()))) {
            evidence.push(`${pattern} (with ${headerKey})`)
          }
        } else {
          evidence.push(pattern)
        }
      }
    }
  }

  return { found: evidence.length > 0, evidence }
}

function detectAiProvider(html: string, scripts: string[]): string | undefined {
  for (const [provider, patterns] of Object.entries(AI_PROVIDERS)) {
    if (checkPatternsInText(html, patterns).found) {
      return provider
    }
    if (checkPatternsInScripts(scripts, patterns).found) {
      return provider
    }
  }
  return undefined
}

function detectAiModel(html: string, scripts: string[]): string | undefined {
  for (const [model, patterns] of Object.entries(AI_MODELS)) {
    if (checkPatternsInText(html, patterns).found) {
      return model
    }
    if (checkPatternsInScripts(scripts, patterns).found) {
      return model
    }
  }
  return undefined
}

function detectChatFramework(html: string, scripts: string[]): string | undefined {
  for (const [framework, patterns] of Object.entries(CHAT_FRAMEWORKS)) {
    if (checkPatternsInText(html, patterns).found) {
      return framework
    }
    if (checkPatternsInScripts(scripts, patterns).found) {
      return framework
    }
  }
  return undefined
}

// ========================================
// MAIN ANALYZER FUNCTION
// ========================================

export function analyzeAiTrust(crawlResult: CrawlResult, securityScore: number): AiTrustResult {
  const html = crawlResult.html || ''
  const scripts = crawlResult.scripts || []
  const networkRequests = crawlResult.networkRequests || []

  const checks: Record<string, boolean> = {}
  const evidenceData: Record<string, string[]> = {}

  // ========================================
  // CATEGORY 1: TRANSPARENCY
  // ========================================
  const transparency = {
    isProviderDisclosed: checkPatternsInText(html, TRANSPARENCY_PATTERNS.providerDisclosed),
    isIdentityDisclosed: checkPatternsInText(html, TRANSPARENCY_PATTERNS.identityDisclosed),
    isAiPolicyLinked: checkPatternsInText(html, TRANSPARENCY_PATTERNS.aiPolicyLinked),
    isModelVersionDisclosed: checkPatternsInText(html, TRANSPARENCY_PATTERNS.modelVersionDisclosed),
    isLimitationsDisclosed: checkPatternsInText(html, TRANSPARENCY_PATTERNS.limitationsDisclosed),
    hasDataUsageDisclosure: checkPatternsInText(html, TRANSPARENCY_PATTERNS.dataUsageDisclosure),
  }

  // ========================================
  // CATEGORY 2: USER CONTROL
  // ========================================
  const userControl = {
    hasFeedbackMechanism: checkPatternsInText(html, USER_CONTROL_PATTERNS.feedbackMechanism),
    hasConversationReset: checkPatternsInText(html, USER_CONTROL_PATTERNS.conversationReset),
    hasHumanEscalation: checkPatternsInText(html, USER_CONTROL_PATTERNS.humanEscalation),
    hasConversationExport: checkPatternsInText(html, USER_CONTROL_PATTERNS.conversationExport),
    hasDataDeletionOption: checkPatternsInText(html, USER_CONTROL_PATTERNS.dataDeletion),
  }

  // ========================================
  // CATEGORY 3: COMPLIANCE
  // ========================================
  const compliance = {
    hasDpoContact: checkPatternsInText(html, COMPLIANCE_PATTERNS.dpoContact),
    hasCookieBanner: checkPatternsInText(html, COMPLIANCE_PATTERNS.cookieBanner),
    hasPrivacyPolicyLink: checkPatternsInText(html, COMPLIANCE_PATTERNS.privacyPolicy),
    hasTermsOfServiceLink: checkPatternsInText(html, COMPLIANCE_PATTERNS.termsOfService),
    hasGdprCompliance: checkPatternsInText(html, COMPLIANCE_PATTERNS.gdprCompliance),
  }

  // ========================================
  // CATEGORY 4: SECURITY
  // ========================================
  const security = {
    hasBotProtection: checkPatternsInScripts(scripts, SECURITY_PATTERNS.botProtection),
    hasAiRateLimitHeaders: checkPatternsInNetworkRequests(
      networkRequests,
      ['/api/chat', '/api/ai', '/v1/chat'],
      'x-ratelimit'
    ),
    hasBasicWebSecurity: { found: securityScore >= 70, evidence: [`Security score: ${securityScore}`] },
    hasInputLengthLimit: checkPatternsInText(html, SECURITY_PATTERNS.inputLengthLimit),
    usesInputSanitization: checkPatternsInScripts(scripts, SECURITY_PATTERNS.inputSanitization),
    hasErrorHandling: checkPatternsInText(html, SECURITY_PATTERNS.errorHandling),
    hasSessionManagement: checkPatternsInText(html, SECURITY_PATTERNS.sessionManagement),
  }

  // ========================================
  // CATEGORY 5: ETHICAL AI
  // ========================================
  const ethicalAi = {
    hasBiasDisclosure: checkPatternsInText(html, ETHICAL_AI_PATTERNS.biasDisclosure),
    hasContentModeration: checkPatternsInText(html, ETHICAL_AI_PATTERNS.contentModeration),
    hasAgeVerification: checkPatternsInText(html, ETHICAL_AI_PATTERNS.ageVerification),
    hasAccessibilitySupport: checkPatternsInText(html, ETHICAL_AI_PATTERNS.accessibilitySupport),
  }

  // ========================================
  // AGGREGATE RESULTS
  // ========================================
  const allCategories = {
    ...transparency,
    ...userControl,
    ...compliance,
    ...security,
    ...ethicalAi,
  }

  Object.entries(allCategories).forEach(([key, result]) => {
    checks[key] = result.found
    evidenceData[key] = result.evidence
  })

  // ========================================
  // CALCULATE SCORES
  // ========================================
  const totalChecks = Object.keys(checks).length
  const passedChecks = Object.values(checks).filter(Boolean).length
  const score = Math.round((passedChecks / totalChecks) * 100)

  // Calculate per-category scores
  const calculateCategoryScore = (categoryChecks: Record<string, { found: boolean }>) => {
    const total = Object.keys(categoryChecks).length
    const passed = Object.values(categoryChecks).filter(c => c.found).length
    return Math.round((passed / total) * 100)
  }

  const categoryScores = {
    transparency: calculateCategoryScore(transparency),
    userControl: calculateCategoryScore(userControl),
    compliance: calculateCategoryScore(compliance),
    security: calculateCategoryScore(security),
    ethicalAi: calculateCategoryScore(ethicalAi),
  }

  // ========================================
  // WEIGHTED SCORE (Some categories matter more)
  // ========================================
  const weights = {
    transparency: 0.25,  // 25% - Most important for trust
    userControl: 0.20,   // 20%
    compliance: 0.25,    // 25% - GDPR compliance critical
    security: 0.20,      // 20%
    ethicalAi: 0.10,     // 10% - Nice to have
  }

  const weightedScore = Math.round(
    categoryScores.transparency * weights.transparency +
    categoryScores.userControl * weights.userControl +
    categoryScores.compliance * weights.compliance +
    categoryScores.security * weights.security +
    categoryScores.ethicalAi * weights.ethicalAi
  )

  // ========================================
  // GRADE ASSIGNMENT
  // ========================================
  let grade: 'excellent' | 'good' | 'fair' | 'poor'
  if (weightedScore >= 85) grade = 'excellent'
  else if (weightedScore >= 70) grade = 'good'
  else if (weightedScore >= 50) grade = 'fair'
  else grade = 'poor'

  // ========================================
  // DETECT AI TECHNOLOGY
  // ========================================
  const detectedAiProvider = detectAiProvider(html, scripts)
  const detectedModel = detectAiModel(html, scripts)
  const detectedChatFramework = detectChatFramework(html, scripts)

  return {
    score,
    weightedScore,
    categoryScores,
    passedChecks,
    totalChecks,
    grade,
    detectedAiProvider,
    detectedModel,
    detectedChatFramework,
    checks,
    evidenceData,
  }
}
```

---

## 🎨 Frontend Megjelenítés

### 3.1. UI Components (React/Next.js)

```typescript
// src/components/AiTrustScore.tsx

import { AiTrustScorecard } from '@prisma/client'

interface AiTrustScoreProps {
  scorecard: AiTrustScorecard & {
    categoryScores: {
      transparency: number
      userControl: number
      compliance: number
      security: number
      ethicalAi: number
    }
  }
}

export function AiTrustScore({ scorecard }: AiTrustScoreProps) {
  const getGradeColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (score >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (score >= 50) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Poor', color: 'bg-red-100 text-red-800' }
  }

  const badge = getGradeBadge(scorecard.weightedScore)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Trust Score</h2>
          <p className="text-gray-600 text-sm">Based on {scorecard.totalChecks} checks</p>
        </div>
        <div className="text-center">
          <div className={`text-6xl font-bold ${getGradeColor(scorecard.weightedScore)}`}>
            {scorecard.weightedScore}
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <CategoryBar
          label="Transparency"
          score={scorecard.categoryScores.transparency}
          icon="🔍"
        />
        <CategoryBar
          label="User Control"
          score={scorecard.categoryScores.userControl}
          icon="🎮"
        />
        <CategoryBar
          label="Compliance (GDPR)"
          score={scorecard.categoryScores.compliance}
          icon="⚖️"
        />
        <CategoryBar
          label="Security & Reliability"
          score={scorecard.categoryScores.security}
          icon="🔒"
        />
        <CategoryBar
          label="Ethical AI"
          score={scorecard.categoryScores.ethicalAi}
          icon="🤝"
        />
      </div>

      {/* Detected Technology */}
      {scorecard.detectedAiProvider && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-900 mb-2">Detected AI Technology</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <div>Provider: <strong>{scorecard.detectedAiProvider}</strong></div>
            {scorecard.detectedModel && (
              <div>Model: <strong>{scorecard.detectedModel}</strong></div>
            )}
            {scorecard.detectedChatFramework && (
              <div>Framework: <strong>{scorecard.detectedChatFramework}</strong></div>
            )}
          </div>
        </div>
      )}

      {/* Passed Checks Summary */}
      <div className="mt-6 text-center text-sm text-gray-600">
        {scorecard.passedChecks} of {scorecard.totalChecks} checks passed
      </div>
    </div>
  )
}

// Category Bar Component
function CategoryBar({ label, score, icon }: { label: string; score: number; icon: string }) {
  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">
          {icon} {label}
        </span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${getBarColor(score)} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
```

---

## ⚖️ Súlyozási Rendszer

### Miért van szükség súlyozásra?

Nem minden kategória egyformán fontos a **trust** szempontjából:

```typescript
const CATEGORY_WEIGHTS = {
  transparency: 0.25,   // 25% - KRITIKUS (felhasználók tudják, mi történik)
  compliance: 0.25,     // 25% - KRITIKUS (GDPR, legal requirements)
  userControl: 0.20,    // 20% - FONTOS (felhasználói autonómia)
  security: 0.20,       // 20% - FONTOS (adatvédelem, robusztusság)
  ethicalAi: 0.10,      // 10% - NICE TO HAVE (etikai megfontolások)
}
```

### Példa Kalkuláció

```
Transparency:  80% × 0.25 = 20
User Control:  60% × 0.20 = 12
Compliance:    100% × 0.25 = 25
Security:      80% × 0.20 = 16
Ethical AI:    40% × 0.10 = 4
─────────────────────────────
Weighted Score:           77/100 (Good)
```

---

## 📈 SEO & E-E-A-T Stratégia

### Programmatic SEO URL Struktúra

```
/ai-trust-report/openai.com
/ai-trust-report/anthropic.com
/ai-trust-report/google.com

SEO Title: "OpenAI AI Trust Score: 85/100 | Transparency & GDPR Analysis"
Meta Description: "Comprehensive AI trust analysis of OpenAI. Check transparency, GDPR compliance, user control, and ethical AI practices. Free automated assessment."
```

### E-E-A-T Content Generálás

**Experience**: "Based on automated analysis of 500+ AI implementations"
**Expertise**: "Our scanner evaluates 25+ AI-specific security and trust indicators"
**Authoritativeness**: "Used by security professionals and compliance officers"
**Trustworthiness**: "100% passive analysis, no intrusive testing"

---

## 🚀 Implementációs Lépések

### Sprint 1: Backend (3-4 nap)

1. ✅ Prisma schema bővítése (`AiTrustScorecard` model)
2. ✅ Database migráció futtatása
3. ✅ `ai-trust-analyzer.ts` létrehozása
4. ✅ Integráció a worker-be (`src/worker/index.ts`)
5. ✅ API endpoint tesztelése

### Sprint 2: Frontend (2-3 nap)

1. ✅ `AiTrustScore` React component
2. ✅ Category breakdown vizualizáció
3. ✅ Scan results page-be integráció
4. ✅ Responsive design + mobile optimalizálás
5. ✅ Animációk (progress bars, score counter)

### Sprint 3: SEO & E-E-A-T (2-3 nap)

1. ✅ Programmatic SEO route setup (`/ai-trust-report/[domain]`)
2. ✅ Dynamic meta tags generálás
3. ✅ Rich snippets (JSON-LD structured data)
4. ✅ Blog content generation logic
5. ✅ Internal linking strategy

### Sprint 4: Optimization (1-2 nap)

1. ✅ Performance optimization (caching, query optimization)
2. ✅ A/B testing setup
3. ✅ Analytics tracking (Plausible events)
4. ✅ Error handling & edge cases
5. ✅ Documentation frissítés

---

## 🎯 Várt Eredmények

### Technikai
- ✅ 25+ AI-specifikus ellenőrzés
- ✅ < 30 másodperc elemzési idő
- ✅ 95%+ accuracy (manuális validáció alapján)

### Business
- ✅ 2x magasabb lead conversion (vizuális trust score miatt)
- ✅ 10x több organic traffic (programmatic SEO)
- ✅ 5x több backlink (szakértői tartalom miatt)

### SEO
- ✅ Featured snippets szereplés ("AI trust score for [company]")
- ✅ Domain authority növekedés (thick content)
- ✅ Long-tail keyword ranking (1000+ unique URLs)

---

## 📚 További Fejlesztési Lehetőségek

1. **Historical Tracking**: Trust score változásának követése időben
2. **Competitive Analysis**: "Compare AI trust with competitors"
3. **White-label Reports**: PDF export professional branding-gel
4. **API Access**: Developers számára programmatic access
5. **Webhooks**: Real-time alerts score csökkenés esetén
6. **Chrome Extension**: "Check AI Trust" egy kattintással

---

**Status**: ✅ Ready for Implementation
**Priority**: 🔥 High (Core feature for lead generation & SEO)
**Effort**: 📊 Medium (8-10 dev days)
**Impact**: 🚀 Very High (Business-critical)

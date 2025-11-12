/**
 * AI Trust Score Analyzer
 *
 * Scamadviser-style trust scoring for AI implementations.
 * Evaluates 27 checks across 5 categories:
 * 1. Transparency (6 checks)
 * 2. User Control (5 checks)
 * 3. Compliance (5 checks)
 * 4. Security & Reliability (7 checks)
 * 5. Ethical AI (4 checks)
 *
 * Based on: trust_score_plan.md & TRUST_SCORE_IMPLEMENTATION_PLAN.md
 */

import { CrawlResult } from '../crawler-mock'

// ========================================
// TYPES
// ========================================

export interface AiTrustResult {
  score: number // Simple average: 0-100
  weightedScore: number // Weighted by category importance
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

  // Detected AI Technology
  detectedAiProvider?: string
  detectedModel?: string
  detectedChatFramework?: string

  // All 27 checks
  checks: {
    // Transparency
    isProviderDisclosed: boolean
    isIdentityDisclosed: boolean
    isAiPolicyLinked: boolean
    isModelVersionDisclosed: boolean
    isLimitationsDisclosed: boolean
    hasDataUsageDisclosure: boolean

    // User Control
    hasFeedbackMechanism: boolean
    hasConversationReset: boolean
    hasHumanEscalation: boolean
    hasConversationExport: boolean
    hasDataDeletionOption: boolean

    // Compliance
    hasDpoContact: boolean
    hasCookieBanner: boolean
    hasPrivacyPolicyLink: boolean
    hasTermsOfServiceLink: boolean
    hasGdprCompliance: boolean

    // Security & Reliability
    hasBotProtection: boolean
    hasAiRateLimitHeaders: boolean
    hasBasicWebSecurity: boolean
    hasInputLengthLimit: boolean
    usesInputSanitization: boolean
    hasErrorHandling: boolean
    hasSessionManagement: boolean

    // Ethical AI
    hasBiasDisclosure: boolean
    hasContentModeration: boolean
    hasAgeVerification: boolean
    hasAccessibilitySupport: boolean
  }

  // Evidence for transparency (what triggered each check)
  evidenceData: Record<string, string[]>
}

interface PatternCheckResult {
  found: boolean
  evidence: string[]
}

// ========================================
// PATTERN DEFINITIONS
// ========================================

// AI Provider Detection
const AI_PROVIDERS: Record<string, string[]> = {
  'OpenAI': ['powered by openai', 'openai.com', 'chatgpt', 'gpt-'],
  'Anthropic': ['powered by anthropic', 'claude.ai', 'anthropic.com', 'claude'],
  'Google': ['powered by google', 'gemini', 'bard', 'palm', 'google ai'],
  'Meta': ['powered by meta', 'llama'],
  'Cohere': ['powered by cohere', 'cohere.ai'],
  'Hugging Face': ['huggingface', 'transformers.js'],
}

// AI Model Detection
const AI_MODELS: Record<string, string[]> = {
  'GPT-4': ['gpt-4', 'gpt-4-turbo', 'gpt-4o'],
  'GPT-3.5': ['gpt-3.5', 'chatgpt-3.5'],
  'Claude 3': ['claude-3', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  'Gemini': ['gemini-pro', 'gemini-ultra', 'gemini-1.5'],
  'Llama': ['llama-2', 'llama-3', 'llama 2', 'llama 3'],
}

// Chat Framework Detection
const CHAT_FRAMEWORKS: Record<string, string[]> = {
  'Intercom': ['intercom.com', 'id="intercom', 'intercom-messenger'],
  'Drift': ['drift.com', 'drift-frame', 'id="drift'],
  'Tidio': ['tidio.com', 'tidio-chat'],
  'Zendesk': ['zendesk.com', 'web-widget', 'zendesk-widget'],
  'Freshchat': ['freshchat.com', 'fc-widget'],
  'LiveChat': ['livechat.com', 'livechat-widget'],
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
    'built with openai',
    'ai by google',
  ],
  identityDisclosed: [
    'i am an ai',
    'ai assistant',
    'virtual assistant',
    'automated chat',
    'bot assistant',
    'digital assistant',
    'this is a bot',
  ],
  aiPolicyLinked: [
    'href="/ai-policy"',
    'href="/ai-usage"',
    'href="/responsible-ai"',
    '/artificial-intelligence-policy',
    '/ai-guidelines',
  ],
  modelVersionDisclosed: [
    'gpt-4',
    'gpt-3.5',
    'claude-3',
    'gemini-pro',
    'model:',
    'version:',
    'powered by gpt',
  ],
  limitationsDisclosed: [
    'ai may make mistakes',
    'ai can be wrong',
    'verify information',
    'may not be accurate',
    'ai-generated content',
    'double-check',
    'not always accurate',
  ],
  dataUsageDisclosure: [
    'not used for training',
    'data retention',
    'how we use your data',
    'conversation storage',
    'data usage policy',
    'training data',
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
    'helpful',
    'not helpful',
  ],
  conversationReset: [
    'new chat',
    'reset conversation',
    'clear chat',
    'start over',
    'new conversation',
  ],
  humanEscalation: [
    'talk to human',
    'speak to agent',
    'contact support',
    'escalate to human',
    'human representative',
    'speak with person',
  ],
  conversationExport: [
    'export chat',
    'download conversation',
    'save transcript',
    'export transcript',
  ],
  dataDeletion: [
    'delete my data',
    'forget me',
    'erase conversation',
    'gdpr request',
    'delete conversation',
    'remove data',
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
    'dpo contact',
  ],
  cookieBanner: [
    'id="cookie-consent"',
    'class="cookie-banner"',
    'id="onetrust',
    'cookiebot',
    'cookie-notice',
    'accept cookies',
  ],
  privacyPolicy: [
    'href="/privacy-policy"',
    'href="/privacy"',
    '/adatvedelem',
    'privacy policy',
  ],
  termsOfService: [
    'href="/terms"',
    'href="/tos"',
    'terms of service',
    'felhasználási feltételek',
    'terms and conditions',
  ],
  gdprCompliance: [
    'gdpr compliant',
    'gdpr-ready',
    'general data protection',
    'adatvédelmi rendelet',
    'gdpr',
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
    'max length',
  ],
  inputSanitization: [
    'dompurify',
    'sanitize-html',
    'xss-filter',
    'sanitize',
  ],
  errorHandling: [
    'error boundary',
    'something went wrong',
    'try again later',
    'error occurred',
    'please try again',
  ],
  sessionManagement: [
    'session-id',
    'csrf-token',
    'x-csrf-token',
    'sessionid',
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
    'potential bias',
  ],
  contentModeration: [
    'content policy',
    'prohibited content',
    'usage policy',
    'harmful content',
    'content moderation',
  ],
  ageVerification: [
    'are you 18',
    'age verification',
    'minimum age',
    '18+',
    'must be 18',
  ],
  accessibilitySupport: [
    'aria-label',
    'role="',
    'screen reader',
    'aria-',
    'accessibility',
  ],
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if any patterns match in text
 */
function checkPatternsInText(text: string, patterns: string[]): PatternCheckResult {
  const lowerText = text.toLowerCase()
  const evidence: string[] = []

  for (const pattern of patterns) {
    if (lowerText.includes(pattern.toLowerCase())) {
      evidence.push(pattern)
      // Limit evidence to first 3 matches
      if (evidence.length >= 3) break
    }
  }

  return { found: evidence.length > 0, evidence }
}

/**
 * Check if any patterns match in scripts
 */
function checkPatternsInScripts(scripts: string[], patterns: string[]): PatternCheckResult {
  const evidence: string[] = []

  for (const script of scripts) {
    const lowerScript = script.toLowerCase()
    for (const pattern of patterns) {
      if (lowerScript.includes(pattern.toLowerCase())) {
        evidence.push(pattern)
        if (evidence.length >= 3) break
      }
    }
    if (evidence.length >= 3) break
  }

  return { found: evidence.length > 0, evidence }
}

/**
 * Check network requests for patterns and headers
 */
function checkPatternsInNetworkRequests(
  requests: { url: string; headers?: Record<string, string> }[],
  urlPatterns: string[],
  headerKey?: string
): PatternCheckResult {
  const evidence: string[] = []

  for (const req of requests) {
    const lowerUrl = req.url.toLowerCase()

    // Check URL patterns
    for (const pattern of urlPatterns) {
      if (lowerUrl.includes(pattern.toLowerCase())) {
        if (headerKey && req.headers) {
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
    if (evidence.length >= 3) break
  }

  return { found: evidence.length > 0, evidence }
}

/**
 * Detect AI provider from HTML and scripts
 */
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

/**
 * Detect AI model from HTML and scripts
 */
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

/**
 * Detect chat framework
 */
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

/**
 * Calculate category score from checks
 */
function calculateCategoryScore(categoryChecks: Record<string, PatternCheckResult>): number {
  const total = Object.keys(categoryChecks).length
  const passed = Object.values(categoryChecks).filter(c => c.found).length
  return Math.round((passed / total) * 100)
}

// ========================================
// MAIN ANALYZER FUNCTION
// ========================================

/**
 * Analyze AI Trust Score
 *
 * @param crawlResult - Result from crawler
 * @param securityScore - Overall security score from other analyzers
 * @returns AI Trust analysis result
 */
export function analyzeAiTrust(crawlResult: CrawlResult, securityScore: number = 0): AiTrustResult {
  const html = crawlResult.html || ''
  const scripts = crawlResult.scripts || []
  const networkRequests = crawlResult.networkRequests || []

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

  // Store evidence
  Object.entries(transparency).forEach(([key, result]) => {
    evidenceData[key] = result.evidence
  })

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

  Object.entries(userControl).forEach(([key, result]) => {
    evidenceData[key] = result.evidence
  })

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

  Object.entries(compliance).forEach(([key, result]) => {
    evidenceData[key] = result.evidence
  })

  // ========================================
  // CATEGORY 4: SECURITY & RELIABILITY
  // ========================================
  const security = {
    hasBotProtection: checkPatternsInScripts(scripts, SECURITY_PATTERNS.botProtection),
    hasAiRateLimitHeaders: checkPatternsInNetworkRequests(
      networkRequests,
      ['/api/chat', '/api/ai', '/v1/chat', '/chat', '/completions'],
      'x-ratelimit'
    ),
    hasBasicWebSecurity: {
      found: securityScore >= 70,
      evidence: securityScore >= 70 ? [`Security score: ${securityScore}/100`] : []
    },
    hasInputLengthLimit: checkPatternsInText(html, SECURITY_PATTERNS.inputLengthLimit),
    usesInputSanitization: checkPatternsInScripts(scripts, SECURITY_PATTERNS.inputSanitization),
    hasErrorHandling: checkPatternsInText(html, SECURITY_PATTERNS.errorHandling),
    hasSessionManagement: checkPatternsInText(html, SECURITY_PATTERNS.sessionManagement),
  }

  Object.entries(security).forEach(([key, result]) => {
    evidenceData[key] = result.evidence
  })

  // ========================================
  // CATEGORY 5: ETHICAL AI
  // ========================================
  const ethicalAi = {
    hasBiasDisclosure: checkPatternsInText(html, ETHICAL_AI_PATTERNS.biasDisclosure),
    hasContentModeration: checkPatternsInText(html, ETHICAL_AI_PATTERNS.contentModeration),
    hasAgeVerification: checkPatternsInText(html, ETHICAL_AI_PATTERNS.ageVerification),
    hasAccessibilitySupport: checkPatternsInText(html, ETHICAL_AI_PATTERNS.accessibilitySupport),
  }

  Object.entries(ethicalAi).forEach(([key, result]) => {
    evidenceData[key] = result.evidence
  })

  // ========================================
  // AGGREGATE RESULTS
  // ========================================
  const checks = {
    // Transparency
    isProviderDisclosed: transparency.isProviderDisclosed.found,
    isIdentityDisclosed: transparency.isIdentityDisclosed.found,
    isAiPolicyLinked: transparency.isAiPolicyLinked.found,
    isModelVersionDisclosed: transparency.isModelVersionDisclosed.found,
    isLimitationsDisclosed: transparency.isLimitationsDisclosed.found,
    hasDataUsageDisclosure: transparency.hasDataUsageDisclosure.found,

    // User Control
    hasFeedbackMechanism: userControl.hasFeedbackMechanism.found,
    hasConversationReset: userControl.hasConversationReset.found,
    hasHumanEscalation: userControl.hasHumanEscalation.found,
    hasConversationExport: userControl.hasConversationExport.found,
    hasDataDeletionOption: userControl.hasDataDeletionOption.found,

    // Compliance
    hasDpoContact: compliance.hasDpoContact.found,
    hasCookieBanner: compliance.hasCookieBanner.found,
    hasPrivacyPolicyLink: compliance.hasPrivacyPolicyLink.found,
    hasTermsOfServiceLink: compliance.hasTermsOfServiceLink.found,
    hasGdprCompliance: compliance.hasGdprCompliance.found,

    // Security & Reliability
    hasBotProtection: security.hasBotProtection.found,
    hasAiRateLimitHeaders: security.hasAiRateLimitHeaders.found,
    hasBasicWebSecurity: security.hasBasicWebSecurity.found,
    hasInputLengthLimit: security.hasInputLengthLimit.found,
    usesInputSanitization: security.usesInputSanitization.found,
    hasErrorHandling: security.hasErrorHandling.found,
    hasSessionManagement: security.hasSessionManagement.found,

    // Ethical AI
    hasBiasDisclosure: ethicalAi.hasBiasDisclosure.found,
    hasContentModeration: ethicalAi.hasContentModeration.found,
    hasAgeVerification: ethicalAi.hasAgeVerification.found,
    hasAccessibilitySupport: ethicalAi.hasAccessibilitySupport.found,
  }

  // ========================================
  // CALCULATE SCORES
  // ========================================
  const totalChecks = Object.keys(checks).length
  const passedChecks = Object.values(checks).filter(Boolean).length
  const score = Math.round((passedChecks / totalChecks) * 100)

  // Calculate per-category scores
  const categoryScores = {
    transparency: calculateCategoryScore(transparency),
    userControl: calculateCategoryScore(userControl),
    compliance: calculateCategoryScore(compliance),
    security: calculateCategoryScore(security),
    ethicalAi: calculateCategoryScore(ethicalAi),
  }

  // ========================================
  // WEIGHTED SCORE (Category importance)
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

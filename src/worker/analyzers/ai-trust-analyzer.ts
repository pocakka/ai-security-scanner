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

// Enhanced check result with explanation
export interface CheckResult {
  passed: boolean
  relevant: boolean // Is this check relevant for this website?
  evidence: string[]
  explanation: string // Why this check matters
  recommendation: string // How to fix if failed
  weight: number // Importance weight (1-3)
}

export interface AiTrustResult {
  // Overall scoring
  score: number | null // null if no AI detected
  weightedScore: number | null
  categoryScores: {
    transparency: number
    userControl: number
    compliance: number
    security: number
    ethicalAi: number
  }
  passedChecks: number
  totalChecks: number // Only counts RELEVANT checks
  relevantChecks: number // How many checks are applicable
  grade: 'excellent' | 'good' | 'fair' | 'poor' | 'not-applicable'

  // AI Detection Status
  hasAiImplementation: boolean // NEW: Critical prerequisite
  aiConfidenceLevel: 'none' | 'low' | 'medium' | 'high' // NEW: Detection confidence
  detectedAiProvider?: string
  detectedModel?: string
  detectedChatFramework?: string

  // Enhanced checks with full context
  detailedChecks: {
    // Transparency (6 checks)
    isProviderDisclosed: CheckResult
    isIdentityDisclosed: CheckResult
    isAiPolicyLinked: CheckResult
    isModelVersionDisclosed: CheckResult
    isLimitationsDisclosed: CheckResult
    hasDataUsageDisclosure: CheckResult

    // User Control (5 checks)
    hasFeedbackMechanism: CheckResult
    hasConversationReset: CheckResult
    hasHumanEscalation: CheckResult
    hasConversationExport: CheckResult
    hasDataDeletionOption: CheckResult

    // Compliance (5 checks)
    hasDpoContact: CheckResult
    hasCookieBanner: CheckResult
    hasPrivacyPolicyLink: CheckResult
    hasTermsOfServiceLink: CheckResult
    hasGdprCompliance: CheckResult

    // Security & Reliability (7 checks)
    hasBotProtection: CheckResult
    hasAiRateLimitHeaders: CheckResult
    hasBasicWebSecurity: CheckResult
    hasInputLengthLimit: CheckResult
    usesInputSanitization: CheckResult
    hasErrorHandling: CheckResult
    hasSessionManagement: CheckResult

    // Ethical AI (4 checks)
    hasBiasDisclosure: CheckResult
    hasContentModeration: CheckResult
    hasAgeVerification: CheckResult
    hasAccessibilitySupport: CheckResult
  }

  // Legacy format (for backward compatibility)
  checks: {
    isProviderDisclosed: boolean
    isIdentityDisclosed: boolean
    isAiPolicyLinked: boolean
    isModelVersionDisclosed: boolean
    isLimitationsDisclosed: boolean
    hasDataUsageDisclosure: boolean
    hasFeedbackMechanism: boolean
    hasConversationReset: boolean
    hasHumanEscalation: boolean
    hasConversationExport: boolean
    hasDataDeletionOption: boolean
    hasDpoContact: boolean
    hasCookieBanner: boolean
    hasPrivacyPolicyLink: boolean
    hasTermsOfServiceLink: boolean
    hasGdprCompliance: boolean
    hasBotProtection: boolean
    hasAiRateLimitHeaders: boolean
    hasBasicWebSecurity: boolean
    hasInputLengthLimit: boolean
    usesInputSanitization: boolean
    hasErrorHandling: boolean
    hasSessionManagement: boolean
    hasBiasDisclosure: boolean
    hasContentModeration: boolean
    hasAgeVerification: boolean
    hasAccessibilitySupport: boolean
  }

  evidenceData: Record<string, string[]>

  // NEW: Human-readable summary
  summary: {
    message: string
    strengths: string[]
    weaknesses: string[]
    criticalIssues: string[]
  }
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
  'OpenAI': ['powered by openai', 'api.openai.com', 'openai api', 'chatgpt assistant', 'gpt-4', 'gpt-3.5'],
  'Anthropic': ['powered by anthropic', 'claude.ai', 'api.anthropic.com', 'anthropic api', 'claude assistant', 'claude-3'],
  'Google': ['powered by google ai', 'generativelanguage.googleapis.com', 'gemini-pro', 'bard ai', 'palm api', 'google ai studio'],
  'Meta': ['powered by meta ai', 'llama.meta.com', 'llama-2', 'llama-3'],
  'Cohere': ['powered by cohere', 'api.cohere.ai', 'cohere api'],
  'Hugging Face': ['huggingface.co/inference', 'transformers.js', 'huggingface api'],
}

// AI Model Detection (more specific patterns to avoid false positives)
const AI_MODELS: Record<string, string[]> = {
  'GPT-4': ['model":"gpt-4', 'gpt-4-turbo', 'gpt-4o', 'using gpt-4', 'model: gpt-4'],
  'GPT-3.5': ['model":"gpt-3.5', 'gpt-3.5-turbo', 'using gpt-3.5', 'model: gpt-3.5'],
  'Claude 3': ['model":"claude-3', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'using claude-3', 'model: claude-3'],
  'Gemini': ['model":"gemini', 'gemini-pro', 'gemini-ultra', 'gemini-1.5', 'using gemini'],
  'Llama': ['model":"llama', 'llama-2', 'llama-3', 'using llama'],
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
 * ONLY checks technical signals (scripts, meta tags, data attributes)
 * DOES NOT check text content to avoid false positives from FAQs/articles
 */
function detectAiProvider(html: string, scripts: string[]): string | undefined {
  // Check scripts first (most reliable)
  for (const [provider, patterns] of Object.entries(AI_PROVIDERS)) {
    if (checkPatternsInScripts(scripts, patterns).found) {
      return provider
    }
  }

  // Check only technical HTML sections (meta tags, link href, data attributes)
  // Extract technical sections only
  const metaTags = html.match(/<meta[^>]*>/gi) || []
  const linkTags = html.match(/<link[^>]*>/gi) || []
  const dataAttributes = html.match(/data-[a-z-]+="[^"]*"/gi) || []

  const technicalHtml = [
    ...metaTags,
    ...linkTags,
    ...dataAttributes
  ].join(' ')

  for (const [provider, patterns] of Object.entries(AI_PROVIDERS)) {
    if (checkPatternsInText(technicalHtml, patterns).found) {
      return provider
    }
  }

  return undefined
}

/**
 * Detect AI model from HTML and scripts
 * ONLY checks technical signals, NOT text content
 */
function detectAiModel(html: string, scripts: string[]): string | undefined {
  // Check scripts first (most reliable)
  for (const [model, patterns] of Object.entries(AI_MODELS)) {
    if (checkPatternsInScripts(scripts, patterns).found) {
      return model
    }
  }

  // Check only technical HTML sections
  const metaTags = html.match(/<meta[^>]*>/gi) || []
  const linkTags = html.match(/<link[^>]*>/gi) || []
  const dataAttributes = html.match(/data-[a-z-]+="[^"]*"/gi) || []

  const technicalHtml = [
    ...metaTags,
    ...linkTags,
    ...dataAttributes
  ].join(' ')

  for (const [model, patterns] of Object.entries(AI_MODELS)) {
    if (checkPatternsInText(technicalHtml, patterns).found) {
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
 * NEW: Comprehensive AI Detection with Confidence Level
 * Returns both detection status and confidence level based on multiple signals
 */
function detectAiImplementation(html: string, scripts: string[], networkRequests: any[]): {
  hasAi: boolean
  confidenceLevel: 'none' | 'low' | 'medium' | 'high'
  provider?: string
  model?: string
  framework?: string
  signals: string[]
} {
  const signals: string[] = []

  // Check for AI provider
  const provider = detectAiProvider(html, scripts)
  if (provider) {
    signals.push(`Provider detected: ${provider}`)
  }

  // Check for AI model
  const model = detectAiModel(html, scripts)
  if (model) {
    signals.push(`Model detected: ${model}`)
  }

  // Check for chat framework
  const framework = detectChatFramework(html, scripts)
  if (framework) {
    signals.push(`Framework detected: ${framework}`)
  }

  // Check for AI-specific DOM elements (chatbox, assistant UI)
  const hasAiUi = /<div[^>]*(?:chat|assistant|ai-widget|bot)[^>]*>/i.test(html)
  if (hasAiUi) {
    signals.push('AI UI elements detected')
  }

  // Check for AI API endpoints
  const hasAiApi = /\/api\/(?:chat|ai|assistant|completion)/i.test(html)
  if (hasAiApi) {
    signals.push('AI API endpoints detected')
  }

  // Check for AI-specific JavaScript libraries (more specific patterns)
  const hasAiLibraries = scripts.some(script =>
    /(?:api\.openai\.com|api\.anthropic\.com|from ['"]langchain|transformers\.js|openai\/|@anthropic\/)/i.test(script)
  )
  if (hasAiLibraries) {
    signals.push('AI libraries detected in scripts')
  }

  // Calculate confidence level based on number of signals
  // Require at least 2 signals for "medium" confidence to avoid false positives
  let confidenceLevel: 'none' | 'low' | 'medium' | 'high' = 'none'
  const signalCount = signals.length

  if (signalCount === 0) {
    confidenceLevel = 'none'
  } else if (signalCount === 1) {
    confidenceLevel = 'low' // Low confidence = might be false positive
  } else if (signalCount === 2) {
    confidenceLevel = 'medium' // Medium = likely has AI
  } else {
    confidenceLevel = 'high' // High = definitely has AI
  }

  return {
    hasAi: signalCount > 0,
    confidenceLevel,
    provider,
    model,
    framework,
    signals
  }
}

/**
 * Calculate category score from checks
 */
function calculateCategoryScore(categoryChecks: Record<string, PatternCheckResult>): number {
  const total = Object.keys(categoryChecks).length
  const passed = Object.values(categoryChecks).filter(c => c.found).length
  return Math.round((passed / total) * 100)
}

/**
 * NEW: Create "Not Applicable" result when no AI is detected
 */
function createNotApplicableResult(
  aiDetection: ReturnType<typeof detectAiImplementation>,
  securityScore: number
): AiTrustResult {
  // Create empty CheckResult for all checks
  const createEmptyCheck = (explanation: string): CheckResult => ({
    passed: false,
    relevant: false, // Not relevant because no AI implementation
    evidence: [],
    explanation,
    recommendation: 'N/A - No AI implementation detected',
    weight: 1
  })

  const emptyChecks = {
    // Transparency
    isProviderDisclosed: createEmptyCheck('AI provider disclosure is not applicable without AI implementation'),
    isIdentityDisclosed: createEmptyCheck('AI identity disclosure is not applicable without AI implementation'),
    isAiPolicyLinked: createEmptyCheck('AI policy is not applicable without AI implementation'),
    isModelVersionDisclosed: createEmptyCheck('Model version disclosure is not applicable without AI implementation'),
    isLimitationsDisclosed: createEmptyCheck('AI limitations disclosure is not applicable without AI implementation'),
    hasDataUsageDisclosure: createEmptyCheck('AI data usage disclosure is not applicable without AI implementation'),

    // User Control
    hasFeedbackMechanism: createEmptyCheck('AI feedback is not applicable without AI implementation'),
    hasConversationReset: createEmptyCheck('Conversation reset is not applicable without AI chatbot'),
    hasHumanEscalation: createEmptyCheck('Human escalation is not applicable without AI assistant'),
    hasConversationExport: createEmptyCheck('Conversation export is not applicable without AI chatbot'),
    hasDataDeletionOption: createEmptyCheck('AI data deletion is not applicable without AI implementation'),

    // Compliance
    hasDpoContact: createEmptyCheck('DPO contact - general compliance check'),
    hasCookieBanner: createEmptyCheck('Cookie banner - general compliance check'),
    hasPrivacyPolicyLink: createEmptyCheck('Privacy policy - general compliance check'),
    hasTermsOfServiceLink: createEmptyCheck('Terms of service - general compliance check'),
    hasGdprCompliance: createEmptyCheck('GDPR compliance - general compliance check'),

    // Security & Reliability
    hasBotProtection: createEmptyCheck('Bot protection - general security check'),
    hasAiRateLimitHeaders: createEmptyCheck('AI rate limiting is not applicable without AI API'),
    hasBasicWebSecurity: createEmptyCheck('Basic web security - general security check'),
    hasInputLengthLimit: createEmptyCheck('Input length limit is not applicable without AI input'),
    usesInputSanitization: createEmptyCheck('Input sanitization is not applicable without AI input'),
    hasErrorHandling: createEmptyCheck('Error handling - general reliability check'),
    hasSessionManagement: createEmptyCheck('Session management - general security check'),

    // Ethical AI
    hasBiasDisclosure: createEmptyCheck('Bias disclosure is not applicable without AI implementation'),
    hasContentModeration: createEmptyCheck('Content moderation is not applicable without AI-generated content'),
    hasAgeVerification: createEmptyCheck('Age verification - general compliance check'),
    hasAccessibilitySupport: createEmptyCheck('Accessibility support - general UX check'),
  }

  // Legacy format (all false)
  const legacyChecks = {
    isProviderDisclosed: false,
    isIdentityDisclosed: false,
    isAiPolicyLinked: false,
    isModelVersionDisclosed: false,
    isLimitationsDisclosed: false,
    hasDataUsageDisclosure: false,
    hasFeedbackMechanism: false,
    hasConversationReset: false,
    hasHumanEscalation: false,
    hasConversationExport: false,
    hasDataDeletionOption: false,
    hasDpoContact: false,
    hasCookieBanner: false,
    hasPrivacyPolicyLink: false,
    hasTermsOfServiceLink: false,
    hasGdprCompliance: false,
    hasBotProtection: false,
    hasAiRateLimitHeaders: false,
    hasBasicWebSecurity: securityScore > 70,
    hasInputLengthLimit: false,
    usesInputSanitization: false,
    hasErrorHandling: false,
    hasSessionManagement: false,
    hasBiasDisclosure: false,
    hasContentModeration: false,
    hasAgeVerification: false,
    hasAccessibilitySupport: false,
  }

  return {
    score: null, // Not applicable
    weightedScore: null,
    categoryScores: {
      transparency: 0,
      userControl: 0,
      compliance: 0,
      security: 0,
      ethicalAi: 0,
    },
    passedChecks: 0,
    totalChecks: 0,
    relevantChecks: 0,
    grade: 'not-applicable',
    hasAiImplementation: false,
    aiConfidenceLevel: aiDetection.confidenceLevel,
    detectedAiProvider: aiDetection.provider,
    detectedModel: aiDetection.model,
    detectedChatFramework: aiDetection.framework,
    detailedChecks: emptyChecks,
    checks: legacyChecks,
    evidenceData: {
      aiDetectionSignals: aiDetection.signals.length > 0 ? aiDetection.signals : ['No AI implementation signals detected']
    },
    summary: {
      message: aiDetection.confidenceLevel === 'low'
        ? `Low-confidence AI detection (${aiDetection.signals.length} signal). AI Trust Score not calculated due to insufficient evidence of AI implementation.`
        : 'No AI implementation detected. AI Trust Score is not applicable for this website.',
      strengths: [
        'Website does not use AI technology',
        'No AI-specific risks to evaluate'
      ],
      weaknesses: [],
      criticalIssues: []
    }
  }
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
  // STEP 0: AI DETECTION PREREQUISITE (NEW!)
  // ========================================
  const aiDetection = detectAiImplementation(html, scripts, networkRequests)

  // If NO AI detected with reasonable confidence, return N/A score
  // Reject "none" and "low" confidence to avoid false positives
  if (!aiDetection.hasAi || aiDetection.confidenceLevel === 'none' || aiDetection.confidenceLevel === 'low') {
    return createNotApplicableResult(aiDetection, securityScore)
  }

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
  // DETECT AI TECHNOLOGY (use cached from aiDetection)
  // ========================================
  const detectedAiProvider = aiDetection.provider || detectAiProvider(html, scripts)
  const detectedModel = aiDetection.model || detectAiModel(html, scripts)
  const detectedChatFramework = aiDetection.framework || detectChatFramework(html, scripts)

  // ========================================
  // BUILD DETAILED CHECKS (NEW! - for transparency)
  // ========================================
  // TODO: Convert all PatternCheckResult to CheckResult with explanations
  // For now, create simplified versions
  const createCheckResult = (check: PatternCheckResult, explanation: string, recommendation: string, weight: number = 2): CheckResult => ({
    passed: check.found,
    relevant: true, // All checks are relevant if AI is detected
    evidence: check.evidence,
    explanation,
    recommendation,
    weight
  })

  const detailedChecks = {
    // Transparency
    isProviderDisclosed: createCheckResult(transparency.isProviderDisclosed, 'Users should know which AI provider powers the system', 'Add clear disclosure like "Powered by OpenAI" or "Uses Claude AI"', 3),
    isIdentityDisclosed: createCheckResult(transparency.isIdentityDisclosed, 'AI should identify itself as AI, not impersonate humans', 'Add disclaimer like "You are chatting with an AI assistant"', 3),
    isAiPolicyLinked: createCheckResult(transparency.isAiPolicyLinked, 'Specific AI usage policy builds trust', 'Link to AI-specific terms or usage policy', 2),
    isModelVersionDisclosed: createCheckResult(transparency.isModelVersionDisclosed, 'Model version disclosure helps users understand capabilities', 'Disclose model version (e.g., "GPT-4", "Claude 2")', 1),
    isLimitationsDisclosed: createCheckResult(transparency.isLimitationsDisclosed, 'Users should know AI limitations to set proper expectations', 'Add limitations notice (e.g., "AI may make mistakes")', 2),
    hasDataUsageDisclosure: createCheckResult(transparency.hasDataUsageDisclosure, 'Users must know how their data is used for AI training', 'Clearly state if conversations are used for training', 3),

    // User Control
    hasFeedbackMechanism: createCheckResult(userControl.hasFeedbackMechanism, 'Users should be able to provide feedback on AI responses', 'Add thumbs up/down or feedback form', 2),
    hasConversationReset: createCheckResult(userControl.hasConversationReset, 'Users should be able to reset AI conversation context', 'Add "Clear conversation" or "Start over" button', 2),
    hasHumanEscalation: createCheckResult(userControl.hasHumanEscalation, 'Users should be able to escalate to human support', 'Add "Talk to human" or "Contact support" option', 3),
    hasConversationExport: createCheckResult(userControl.hasConversationExport, 'Users should be able to export their conversation data', 'Add "Download conversation" feature', 1),
    hasDataDeletionOption: createCheckResult(userControl.hasDataDeletionOption, 'Users should be able to delete their AI conversation data', 'Add "Delete my data" option per GDPR', 3),

    // Compliance
    hasDpoContact: createCheckResult(compliance.hasDpoContact, 'GDPR requires DPO contact for data protection queries', 'Add Data Protection Officer contact information', 3),
    hasCookieBanner: createCheckResult(compliance.hasCookieBanner, 'EU law requires cookie consent banner', 'Implement GDPR-compliant cookie banner', 3),
    hasPrivacyPolicyLink: createCheckResult(compliance.hasPrivacyPolicyLink, 'Privacy policy is legally required', 'Link to comprehensive privacy policy', 3),
    hasTermsOfServiceLink: createCheckResult(compliance.hasTermsOfServiceLink, 'Terms of service protect both user and provider', 'Link to terms of service', 3),
    hasGdprCompliance: createCheckResult(compliance.hasGdprCompliance, 'GDPR compliance signals responsible data handling', 'Implement full GDPR compliance measures', 3),

    // Security & Reliability
    hasBotProtection: createCheckResult(security.hasBotProtection, 'Bot protection prevents AI abuse and spam', 'Add reCAPTCHA or similar bot protection', 2),
    hasAiRateLimitHeaders: createCheckResult(security.hasAiRateLimitHeaders, 'Rate limiting prevents API abuse', 'Implement rate limiting headers', 2),
    hasBasicWebSecurity: createCheckResult(security.hasBasicWebSecurity, 'Basic web security protects AI interactions', 'Ensure HTTPS, CSP, security headers', 3),
    hasInputLengthLimit: createCheckResult(security.hasInputLengthLimit, 'Input limits prevent prompt injection attacks', 'Implement reasonable input length limits', 2),
    usesInputSanitization: createCheckResult(security.usesInputSanitization, 'Input sanitization prevents injection attacks', 'Sanitize all user inputs before AI processing', 3),
    hasErrorHandling: createCheckResult(security.hasErrorHandling, 'Proper error handling prevents information disclosure', 'Implement graceful error messages', 2),
    hasSessionManagement: createCheckResult(security.hasSessionManagement, 'Session management protects conversation privacy', 'Implement secure session management', 2),

    // Ethical AI
    hasBiasDisclosure: createCheckResult(ethicalAi.hasBiasDisclosure, 'AI bias disclosure builds trust and sets expectations', 'Disclose potential AI biases', 2),
    hasContentModeration: createCheckResult(ethicalAi.hasContentModeration, 'Content moderation prevents harmful AI outputs', 'Implement content filtering and moderation', 3),
    hasAgeVerification: createCheckResult(ethicalAi.hasAgeVerification, 'Age verification protects minors from inappropriate AI content', 'Add age verification for sensitive AI features', 2),
    hasAccessibilitySupport: createCheckResult(ethicalAi.hasAccessibilitySupport, 'Accessibility ensures AI is usable by everyone', 'Implement WCAG accessibility standards', 2),
  }

  // ========================================
  // BUILD SUMMARY (NEW! - human-readable)
  // ========================================
  const strengths: string[] = []
  const weaknesses: string[] = []
  const criticalIssues: string[] = []

  if (categoryScores.transparency >= 70) strengths.push('Good transparency in AI disclosure')
  else if (categoryScores.transparency < 30) weaknesses.push('Poor transparency - users may not know they are interacting with AI')

  if (categoryScores.userControl >= 70) strengths.push('Strong user control mechanisms')
  else if (categoryScores.userControl < 30) criticalIssues.push('Lack of user control over AI interactions')

  if (categoryScores.compliance >= 70) strengths.push('Good GDPR/privacy compliance')
  else if (categoryScores.compliance < 30) criticalIssues.push('Poor compliance - may violate GDPR regulations')

  if (categoryScores.security >= 70) strengths.push('Solid security measures')
  else if (categoryScores.security < 30) criticalIssues.push('Weak security - AI system may be vulnerable to attacks')

  if (categoryScores.ethicalAi >= 70) strengths.push('Strong ethical AI practices')
  else if (categoryScores.ethicalAi < 30) weaknesses.push('Limited ethical AI considerations')

  const summary = {
    message: weightedScore >= 70
      ? `This AI implementation demonstrates good trust practices with a weighted score of ${weightedScore}/100.`
      : weightedScore >= 50
      ? `This AI implementation has moderate trust practices (${weightedScore}/100). Several improvements recommended.`
      : `This AI implementation has significant trust concerns (${weightedScore}/100). Critical improvements needed.`,
    strengths: strengths.length > 0 ? strengths : ['AI implementation detected'],
    weaknesses,
    criticalIssues
  }

  return {
    score,
    weightedScore,
    categoryScores,
    passedChecks,
    totalChecks,
    relevantChecks: totalChecks, // All checks relevant when AI is detected
    grade,
    hasAiImplementation: true, // NEW
    aiConfidenceLevel: aiDetection.confidenceLevel, // NEW
    detectedAiProvider,
    detectedModel,
    detectedChatFramework,
    detailedChecks, // NEW
    checks, // Legacy format
    evidenceData,
    summary, // NEW
  }
}

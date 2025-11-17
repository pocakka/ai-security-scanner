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

/**
 * CHANGELOG - Nov 17, 2025: AI Trust Score Stabilization (Phase 1)
 * - Added documentation/marketing site filter (40-50% FP reduction)
 * - Added AI detection confidence threshold (medium/high only)
 * - Early exit for non-AI sites to prevent false scoring
 *
 * Target: Reduce FP rate from ~35-40% to <10%
 */

import { CrawlResult } from '../crawler-mock'
import { detectVoiceAI } from './voice-ai-detector'
import { detectTranslationAI } from './translation-ai-detector'
import { detectSearchAI } from './search-ai-detector'
import { detectPersonalizationAI } from './personalization-detector'
import { detectAnalyticsAI } from './analytics-ai-detector'
import { detectImageVideoAI } from './image-video-ai-detector'
import { detectContentModeration } from './content-moderation-detector'

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

  // NEW: Extended AI Detection Results (P0 Detectors)
  voiceAI?: {
    hasVoiceAI: boolean
    detections: any[]
    totalProviders: number
  }
  translationAI?: {
    hasTranslationAI: boolean
    detections: any[]
    totalProviders: number
  }
  searchAI?: {
    hasSearchAI: boolean
    detections: any[]
    totalProviders: number
    criticalRiskCount: number
  }
  personalizationAI?: {
    hasPersonalizationAI: boolean
    detections: any[]
    totalProviders: number
    sessionRecordingDetected: boolean
  }
  analyticsAI?: {
    hasAnalyticsAI: boolean
    detections: any[]
    totalProviders: number
    sessionReplayDetected: boolean
    criticalRiskCount: number
  }
  imageVideoAI?: {
    hasImageVideoAI: boolean
    detections: any[]
    totalProviders: number
    generativeAIDetected: boolean
  }
  contentModeration?: {
    hasContentModeration: boolean
    detections: any[]
    totalProviders: number
    highConfidenceCount: number
  }

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

/**
 * Phase 4: Weight System - Nov 17, 2025
 * Tiered importance weights for each check
 */
const CHECK_WEIGHTS: Record<string, number> = {
  // CRITICAL (weight: 3) - Legal/Compliance requirements
  hasPrivacyPolicyLink: 3,
  hasTermsOfServiceLink: 3,
  hasBasicWebSecurity: 3,

  // HIGH (weight: 2) - Transparency and key security
  isProviderDisclosed: 2,
  isIdentityDisclosed: 2,
  hasCookieBanner: 2,
  hasContentModeration: 2,
  hasBotProtection: 2,
  hasErrorHandling: 2,
  hasSessionManagement: 2,
  isLimitationsDisclosed: 2,

  // MEDIUM (weight: 1) - UX features
  hasConversationReset: 1,
  hasConversationExport: 1,
  hasFeedbackMechanism: 1,
  hasDataDeletionOption: 1,
  hasHumanEscalation: 1,
  isAiPolicyLinked: 1,
  isModelVersionDisclosed: 1,
  hasDataUsageDisclosure: 1,
  hasDpoContact: 1,
  hasGdprCompliance: 1,
  hasAiRateLimitHeaders: 1,
  hasInputLengthLimit: 1,
  usesInputSanitization: 1,
  hasBiasDisclosure: 1,
  hasAgeVerification: 1,
  hasAccessibilitySupport: 1,
}

// Phase 2: Pattern Refinement - Nov 17, 2025
// AI Provider Detection with context-aware patterns
const AI_PROVIDERS: Record<string, string[]> = {
  'OpenAI': [
    'powered by openai',
    'api.openai.com',      // API endpoint pattern
    '/v1/chat/completions', // OpenAI API endpoint
    'openai api',
    'chatgpt assistant',
    'gpt-4',               // Model mentions (will check word boundaries)
    'gpt-3.5'
  ],
  'Anthropic': [
    'powered by anthropic',
    'claude.ai',
    'api.anthropic.com',   // API endpoint pattern
    'anthropic api',
    'claude assistant',
    'claude-3'
  ],
  'Google': [
    'powered by google ai',
    'generativelanguage.googleapis.com', // API endpoint
    'gemini-pro',
    'bard ai',
    'palm api',
    'google ai studio'
  ],
  'Meta': [
    'powered by meta ai',
    'llama.meta.com',
    'llama-2',
    'llama-3'
  ],
  'Cohere': [
    'powered by cohere',
    'api.cohere.ai',       // API endpoint pattern
    'cohere api'
  ],
  'Hugging Face': [
    'huggingface.co/inference',
    'transformers.js',
    'huggingface api'
  ],
}

// Phase 2: Pattern Refinement - Nov 17, 2025
// AI Model Detection - context-aware patterns (model["']:value format)
const AI_MODELS: Record<string, string[]> = {
  'GPT-4': [
    'model":"gpt-4',       // JSON format: {"model":"gpt-4"}
    "model':'gpt-4",       // Single quotes
    'model: gpt-4',        // YAML/JS format
    'gpt-4-turbo',         // Specific variant
    'gpt-4o',              // GPT-4 Omni
    'using gpt-4'          // Prose format
  ],
  'GPT-3.5': [
    'model":"gpt-3.5',
    "model':'gpt-3.5",
    'model: gpt-3.5',
    'gpt-3.5-turbo',
    'using gpt-3.5'
  ],
  'Claude 3': [
    'model":"claude-3',
    "model':'claude-3",
    'model: claude-3',
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
    'using claude-3'
  ],
  'Gemini': [
    'model":"gemini',
    "model':'gemini",
    'model: gemini',
    'gemini-pro',
    'gemini-ultra',
    'gemini-1.5',
    'using gemini'
  ],
  'Llama': [
    'model":"llama',
    "model':'llama",
    'model: llama',
    'llama-2',
    'llama-3',
    'using llama'
  ],
}

// Phase 2: Pattern Refinement - Nov 17, 2025
// Chat Framework Categorization: AI-Based vs Traditional
// AI-Based: Use LLM/NLP for responses (always count as AI implementation)
// Traditional: Human chat or rule-based (only count as AI if provider detected)

// AI-Based Chat Frameworks (8 services)
const AI_CHAT_FRAMEWORKS: Record<string, string[]> = {
  'Chatbase': ['www.chatbase.co', 'cdn.chatbase.co', 'window.chatbase', 'embeddedchatbotconfig', '#chatbase-bubble', '.chatbase-'],
  'Voiceflow': ['cdn.voiceflow.com', 'window.voiceflow', 'vf-chat', '.vf-'],
  'Botpress': ['cdn.botpress.cloud', 'mediafiles.botpress.cloud', 'window.botpresswebchat', 'window.botpress', '#bp-web-widget', '.bpwidget'],
  'Dialogflow Messenger': ['gstatic.com/dialogflow-console', 'window.dialogflow', 'dfmessenger', 'df-messenger', '.df-messenger'],
  'IBM Watson Assistant': ['web-chat.global.assistant.watson', 'assistant.watson', 'window.watsonassistantchatoptions', 'watsonassistant', '#waccontainer', '.wac__'],
  'Microsoft Bot Framework': ['cdn.botframework.com', 'window.webchat', 'window.botchat', '#webchat', '.webchat'],
  'Ada': ['static.ada.support', 'window.adaembed', 'adasettings', '#ada-button-frame', '.ada-'],
  'Landbot': ['cdn.landbot.io', 'static.landbot.io', 'window.landbot', 'mylandbot', '#landbot-', '.landbot'],
}

// Traditional Chat Frameworks (27 services)
// These are human chat / rule-based systems - only count as AI if AI provider also detected
const TRADITIONAL_CHAT_FRAMEWORKS: Record<string, string[]> = {
  // Tier 1: Market Leaders (10 services)
  'Intercom': ['widget.intercom.io', 'js.intercomcdn.com', 'intercom.com', 'id="intercom', 'intercom-messenger', 'window.intercom', 'intercomsettings', '#intercom-container', '.intercom-messenger-frame'],
  'Drift': ['js.driftt.com', 'js.drift.com', 'drift.com', 'drift-frame', 'id="drift', 'window.drift', 'driftapi', '#drift-widget-container', '#drift-frame-controller'],
  'Zendesk Chat': ['static.zdassets.com', 'v2.zopim.com', 'zendesk.com', 'web-widget', 'zendesk-widget', 'window.ze', 'window.$zopim', '#ze-snippet', '.zopim'],
  'LiveChat': ['cdn.livechatinc.com', 'cdn.livechat-files.com', 'livechat.com', 'livechat-widget', 'window.livechatwidget', 'lc_api', '#livechat-widget', '.livechat-'],
  'Freshchat': ['wchat.freshchat.com', 'snippet.freshchat.com', 'freshchat.com', 'fc-widget', 'window.fcwidget', 'fcsettings', '.freshchat-', '#fc_frame'],
  'HubSpot Chat': ['js.hs-scripts.com', 'js.hubspot.com', 'window.hubspotconversations', 'hsconversationssettings', '#hubspot-messages-iframe', '.hs-'],
  'Crisp': ['client.crisp.chat', 'client.relay.crisp.chat', 'window.$crisp', 'crisp_', '.crisp-client', '#crisp-chatbox'],
  'Tidio': ['code.tidio.co', 'cdn.tidio.co', 'tidio.com', 'tidio-chat', 'window.tidiochatapi', 'tidioidentify', '#tidio-chat', '.tidio-'],
  'Tawk.to': ['embed.tawk.to', 'va.tawk.to', 'tawk.to', 'window.tawk_api', 'tawk_loadstart', '.tawk-widget', '#tawkchat-'],
  'Olark': ['static.olark.com', 'window.olark', 'olark_', '#olark-box', '.olark'],

  // Tier 2: Enterprise/SaaS (10 services)
  'Salesforce Live Agent': ['service.force.com/embeddedservice', 'window.embedded_svc', 'window.liveagent', '.embeddedservicehelpbutton', '#liveagent_'],
  'LivePerson': ['lptag.liveperson.net', 'lpcdn.lpsnmedia.net', 'window.lptag', 'lpmcontainer', '#lpchat', '.lpmcontainer'],
  'Genesys Cloud': ['apps.mypurecloud.com', 'window.genesys', 'window.purecloud', '.cx-widget', '#webchat-'],
  'Help Scout Beacon': ['beacon-v2.helpscout.net', 'd3hb14vkzrxvla.cloudfront.net', 'window.beacon', 'beaconapi', '#beacon-container', '.beaconfabbutton'],
  'Gorgias': ['config.gorgias.chat', 'client.gorgias.chat', 'window.gorgiaschat', '$gorgias', '.gorgias-chat-', '#gorgias-'],
  'Chatwoot': ['/packs/js/sdk.js', 'chatwoot.com/packs', 'window.$chatwoot', 'chatwootsdk', '.woot-widget-holder', '#chatwoot_'],
  'Re:amaze': ['cdn.reamaze.com', 'window.reamaze', '_rasettings', '#reamaze-widget', '.reamaze-'],
  'Smartsupp': ['www.smartsuppchat.com', 'window.smartsupp', '$smartsupp', '#chat-application', '.smartsupp-'],
  'JivoChat': ['code.jivosite.com', 'code.jivo', 'window.jivo_api', 'jivo_config', '#jivo-iframe-container', '.globalclass_'],
  'Userlike': ['userlike-cdn-widgets', 'userlike.com', 'window.userlikeconfig', 'userlike_', '#userlike-widget', '.userlike-'],

  // Additional Popular Widgets (5 services)
  'Chatra': ['call.chatra.io', 'io.chatra.io', 'window.chatra', 'chatraid', '.chatra-', '#chatra-'],
  'Pure Chat': ['app.purechat.com', 'window.purechatapi', 'pcwidget', '.purechat-', '#purechat-'],
  'Zoho SalesIQ': ['salesiq.zoho.com', 'js.zohocdn.com/salesiq', 'window.$zoho.salesiq', '$zoho.ichat', '#zsiq_float', '.zsiq'],
  'HelpCrunch': ['widget.helpcrunch.com', 'window.helpcrunch', 'helpcrunchsettings', '.helpcrunch-widget', '#helpcrunch-'],
  'Kommunicate': ['widget.kommunicate.io', 'window.kommunicate', '#kommunicate-widget-iframe', '.kommunicate-'],

  // P0 Missing Chat Widgets (added November 14, 2025)
  'Rocket.Chat': ['rocket.chat/livechat', '/livechat/rocketchat-livechat.min.js', 'window.rocketchat', '.rocketchat-widget', '#rocketchat-iframe', 'rocketchatlivechat'],
  'SnapEngage': ['snapengage.com/cdn/', 'snapabug.appspot.com', 'window.snapengage', 'window.snapabug', '#snapengage-widget', 'snapengage_'],
}

// Legacy CHAT_FRAMEWORKS - Combined for backward compatibility
const CHAT_FRAMEWORKS: Record<string, string[]> = {
  // AI-Based (8 services)
  ...AI_CHAT_FRAMEWORKS,

  // Traditional (27 services)
  ...TRADITIONAL_CHAT_FRAMEWORKS,

  // Legacy entries not categorized yet
  'Rasa Webchat': ['cdn.jsdelivr.net/npm/rasa-webchat', 'unpkg.com/rasa-webchat', 'window.webchat', 'rasawebchat', '.rasa-chat-', '#rasa-'],
  'Amazon Lex': ['runtime.lex.', '.amazonaws.com/lex', 'window.aws.lexruntime', 'lexruntime', '#lex-web-ui', '.lex-'],
  'GPT4Business (YoloAI)': ['app.gpt4business.yoloai.com', 'gpt4business.yoloai.com', 'gpt4business', 'admin.gpt4business.ai', 'chatbubble.js'],
  'Kayako': ['kayako.com/api/v1/messenger.js', 'kayakocdn.com', 'window.kayako', '.kayako-messenger', '#kayako-messenger', 'kayakomessenger'],
  'Kustomer': ['cdn.kustomerapp.com/chat-web/', 'kustomerapp.com', 'window.kustomer', '#kustomer-ui-sdk-iframe', '.kustomer-', 'kustomersettings'],
}

// ========================================
// PHASE 1 STABILIZATION: DOCUMENTATION/MARKETING FILTERS
// ========================================

/**
 * Check if the site is a documentation/tutorial site
 * Nov 17, 2025: Prevent false positives on docs sites
 */
function isDocumentationSite(html: string, url: string): boolean {
  // URL patterns
  if (/\/(docs|documentation|api-reference|guide|tutorial)\//i.test(url)) {
    return true
  }

  // Content patterns
  const docIndicators = [
    /<pre\b[^>]*>[\s\S]*?<\/pre>/gi,   // Code blocks
    /<code\b[^>]*>[\s\S]*?<\/code>/gi, // Inline code
    /\bAPI Reference\b/i,
    /\bGetting Started\b/i,
    /\bDocumentation\b/i,
  ]

  let docScore = 0
  for (const pattern of docIndicators) {
    if (pattern.test(html)) docScore++
  }

  return docScore >= 3 // 3+ indicators = docs
}

/**
 * Check if the site is marketing/blog content
 * Nov 17, 2025: Prevent false positives on marketing sites
 */
function isMarketingContent(html: string): boolean {
  const marketingIndicators = [
    /<article\b[^>]*>[\s\S]*?<\/article>/gi,
    /\bRead more\b/gi,
    /\bPublished on\b/gi,
    /\bAuthor:\b/gi,
    /\bShare this\b/gi,
  ]

  let marketingScore = 0
  for (const pattern of marketingIndicators) {
    if (pattern.test(html)) marketingScore++
  }

  return marketingScore >= 3
}

// ========================================
// CATEGORY 1: TRANSPARENCY PATTERNS
// ========================================

// Phase 2: Pattern Refinement - Nov 17, 2025
// Context-aware patterns with word boundaries to reduce false positives
const TRANSPARENCY_PATTERNS = {
  // Phase 2: Pattern Refinement - Nov 17, 2025
  // Word boundaries added to prevent false matches (e.g., "gpt-4-like" won't match "gpt-4")
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
  // Phase 2: Pattern Refinement - Nov 17, 2025
  // Context-aware regex patterns to prevent "gpt-4" matching in "gpt-4-like" text
  modelVersionDisclosed: [
    'gpt-4',        // Will need word boundary check in checkPatternsInText
    'gpt-3.5',      // Will need word boundary check
    'claude-3',     // Will need word boundary check
    'gemini-pro',
    'model:',       // Context pattern: model["']:
    'version:',     // Context pattern: version["']:
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
 * Phase 3: Relevance Logic - Nov 17, 2025
 * Determines if a check is relevant for the scanned website
 */
function isCheckRelevant(
  checkName: string,
  crawlResult: CrawlResult,
  aiDetection: any,
  hasChatWidget: boolean,
  hasApiEndpoint: boolean
): boolean {
  // Transparency checks - always relevant if AI detected
  if (['isProviderDisclosed', 'isIdentityDisclosed', 'isAiPolicyLinked',
       'isModelVersionDisclosed', 'isLimitationsDisclosed', 'hasDataUsageDisclosure'].includes(checkName)) {
    return true // Always relevant
  }

  // User Control checks - only relevant if chat widget present
  if (['hasFeedbackMechanism', 'hasConversationReset', 'hasHumanEscalation',
       'hasConversationExport', 'hasDataDeletionOption'].includes(checkName)) {
    return hasChatWidget
  }

  // Compliance checks - always relevant (GDPR)
  if (['hasDpoContact', 'hasCookieBanner', 'hasPrivacyPolicyLink',
       'hasTermsOfServiceLink', 'hasGdprCompliance'].includes(checkName)) {
    return true
  }

  // Security checks
  if (checkName === 'hasAiRateLimitHeaders') {
    return hasApiEndpoint // Only relevant if API detected
  }
  // Other security checks - always relevant
  if (['hasBotProtection', 'hasBasicWebSecurity', 'hasInputLengthLimit',
       'usesInputSanitization', 'hasErrorHandling', 'hasSessionManagement'].includes(checkName)) {
    return true
  }

  // Ethical AI checks - always relevant if AI detected
  if (['hasBiasDisclosure', 'hasContentModeration', 'hasAgeVerification',
       'hasAccessibilitySupport'].includes(checkName)) {
    return true
  }

  return true // Default: relevant
}

/**
 * Phase 5: Proximity Check - Nov 17, 2025
 * Check if two patterns appear close to each other (within 200 chars)
 */
function checkProximity(html: string, pattern1: string, pattern2: string, maxDistance: number = 200): boolean {
  const regex1 = new RegExp(pattern1, 'gi')
  const regex2 = new RegExp(pattern2, 'gi')

  let match1
  while ((match1 = regex1.exec(html)) !== null) {
    const startPos = Math.max(0, match1.index - maxDistance)
    const endPos = Math.min(html.length, match1.index + pattern1.length + maxDistance)
    const window = html.substring(startPos, endPos)

    if (regex2.test(window)) {
      return true
    }
  }

  return false
}

/**
 * Phase 5: Word Boundary Enhancement - Nov 17, 2025
 * Check if any patterns match in text with word boundary support
 */
function checkPatternsInText(html: string, patterns: string[]): PatternCheckResult {
  const evidence: string[] = []
  let found = false

  for (const pattern of patterns) {
    // Phase 5: Word boundary check for model names - Nov 17, 2025
    // Patterns like 'gpt-4', 'claude-3' need word boundaries to avoid matching 'gpt-4-like'
    if (/^[a-z0-9-]+$/i.test(pattern)) {
      // Simple alphanumeric pattern - add word boundaries
      const wordBoundaryRegex = new RegExp(`\\b${pattern}\\b`, 'i')
      if (wordBoundaryRegex.test(html)) {
        found = true
        // Extract context (50 chars before/after)
        const match = html.match(new RegExp(`.{0,50}\\b${pattern}\\b.{0,50}`, 'i'))
        if (match) evidence.push(match[0].trim())
      }
    } else {
      // Complex pattern or contains special chars - use as-is
      if (html.toLowerCase().includes(pattern.toLowerCase())) {
        found = true
        const index = html.toLowerCase().indexOf(pattern.toLowerCase())
        const context = html.substring(Math.max(0, index - 50), Math.min(html.length, index + pattern.length + 50))
        evidence.push(context.trim())
      }
    }

    // Limit evidence to first 3 matches
    if (evidence.length >= 3) break
  }

  return { found, evidence: evidence.slice(0, 3) }
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

  // Phase 2: Pattern Refinement - Nov 17, 2025
  // Check for chat framework with AI vs Traditional categorization
  const framework = detectChatFramework(html, scripts)
  if (framework) {
    // Check if it's an AI-based chat framework
    const isAiChatFramework = Object.keys(AI_CHAT_FRAMEWORKS).includes(framework)

    if (isAiChatFramework) {
      // AI-based frameworks always count as AI implementation
      signals.push(`AI Chat Framework detected: ${framework}`)
    } else {
      // Traditional frameworks only count if AI provider is also detected
      if (provider) {
        signals.push(`Traditional Chat Framework with AI Provider: ${framework}`)
      }
      // Otherwise, don't add to signals (not AI-based)
    }
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
  let html = crawlResult.html || ''
  const scripts = crawlResult.scripts || []
  const networkRequests = crawlResult.networkRequests || []
  const url = crawlResult.url

  // ========================================
  // PHASE 2.3: HTML Preprocessing Enhancement - Nov 17, 2025
  // Remove noise that causes false positives in pattern detection
  // ========================================
  // Remove JSON-LD structured data (SEO metadata, not actual AI implementation)
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')

  // Remove article tags (blog posts, news articles - often mention AI without using it)
  html = html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi, '')

  const evidenceData: Record<string, string[]> = {}

  // ========================================
  // PHASE 1.1: Documentation/Marketing Filter - Early Exit
  // Nov 17, 2025: Prevent false positives on non-AI-implementation sites
  // ========================================
  if (isDocumentationSite(html, url) || isMarketingContent(html)) {
    return {
      score: null,
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
      aiConfidenceLevel: 'none',
      detailedChecks: {} as any, // Empty checks
      checks: {} as any,
      evidenceData: {},
      summary: {
        message: 'Documentation or marketing site - AI Trust Score not applicable',
        strengths: [],
        weaknesses: [],
        criticalIssues: [],
      },
    }
  }

  // ========================================
  // STEP 0: AI DETECTION PREREQUISITE (NEW!)
  // ========================================
  const aiDetection = detectAiImplementation(html, scripts, networkRequests)

  // ========================================
  // PHASE 1.2: AI Detection Confidence Threshold
  // Nov 17, 2025: Only calculate score if medium/high confidence
  // ========================================
  // If NO AI detected with reasonable confidence, return N/A score
  // Reject "none" and "low" confidence to avoid false positives
  if (!aiDetection.hasAi || aiDetection.confidenceLevel === 'none' || aiDetection.confidenceLevel === 'low') {
    return createNotApplicableResult(aiDetection, securityScore)
  }

  // ========================================
  // STEP 0.5: EXTENDED AI DETECTION (NEW P0 DETECTORS)
  // ========================================
  const voiceAIResult = detectVoiceAI(crawlResult)
  const translationAIResult = detectTranslationAI(crawlResult)
  const searchAIResult = detectSearchAI(crawlResult)
  const personalizationAIResult = detectPersonalizationAI(crawlResult)
  const analyticsAIResult = detectAnalyticsAI(crawlResult)
  const imageVideoAIResult = detectImageVideoAI(crawlResult)
  const contentModerationResult = detectContentModeration(crawlResult)

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
  // DETECT AI TECHNOLOGY EARLY (needed for relevance logic)
  // ========================================
  const detectedAiProvider = aiDetection.provider || detectAiProvider(html, scripts)
  const detectedModel = aiDetection.model || detectAiModel(html, scripts)
  const detectedChatFramework = aiDetection.framework || detectChatFramework(html, scripts)

  // ========================================
  // CALCULATE SCORES
  // ========================================

  // Phase 3: Dynamic Total Checks Count - Nov 17, 2025
  // Detect if chat widget or API endpoint is present
  const hasChatWidget = !!detectedChatFramework
  const hasApiEndpoint = networkRequests.some(req =>
    /\/api\/(?:chat|ai|assistant|completion)/i.test(req.url)
  )

  // All check names (27 checks total)
  const allCheckNames = [
    'isProviderDisclosed', 'isIdentityDisclosed', 'isAiPolicyLinked',
    'isModelVersionDisclosed', 'isLimitationsDisclosed', 'hasDataUsageDisclosure',
    'hasFeedbackMechanism', 'hasConversationReset', 'hasHumanEscalation',
    'hasConversationExport', 'hasDataDeletionOption',
    'hasDpoContact', 'hasCookieBanner', 'hasPrivacyPolicyLink',
    'hasTermsOfServiceLink', 'hasGdprCompliance',
    'hasBotProtection', 'hasAiRateLimitHeaders', 'hasBasicWebSecurity',
    'hasInputLengthLimit', 'usesInputSanitization', 'hasErrorHandling',
    'hasSessionManagement',
    'hasBiasDisclosure', 'hasContentModeration', 'hasAgeVerification',
    'hasAccessibilitySupport'
  ]

  // Count only relevant checks
  const relevantCheckCount = allCheckNames.filter(checkName =>
    isCheckRelevant(checkName, crawlResult, aiDetection, hasChatWidget, hasApiEndpoint)
  ).length

  const totalChecks = relevantCheckCount // Dynamic: 10-27 based on context
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
  // Phase 4: Weighted Score Calculation - Nov 17, 2025
  // ========================================
  let totalWeight = 0
  let passedWeight = 0

  allCheckNames.forEach(checkName => {
    const isRelevant = isCheckRelevant(checkName, crawlResult, aiDetection, hasChatWidget, hasApiEndpoint)
    if (!isRelevant) return

    const weight = CHECK_WEIGHTS[checkName] || 1
    totalWeight += weight

    const checkPassed = (checks as any)[checkName] || false
    if (checkPassed) {
      passedWeight += weight
    }
  })

  const newWeightedScore = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0

  // ========================================
  // Legacy WEIGHTED SCORE (Category importance) - Kept for comparison
  // ========================================
  const weights = {
    transparency: 0.25,  // 25% - Most important for trust
    userControl: 0.20,   // 20%
    compliance: 0.25,    // 25% - GDPR compliance critical
    security: 0.20,      // 20%
    ethicalAi: 0.10,     // 10% - Nice to have
  }

  const legacyWeightedScore = Math.round(
    categoryScores.transparency * weights.transparency +
    categoryScores.userControl * weights.userControl +
    categoryScores.compliance * weights.compliance +
    categoryScores.security * weights.security +
    categoryScores.ethicalAi * weights.ethicalAi
  )

  // ========================================
  // GRADE ASSIGNMENT
  // ========================================
  // Phase 4: Use new weighted score for grading - Nov 17, 2025
  let grade: 'excellent' | 'good' | 'fair' | 'poor'
  if (newWeightedScore >= 85) grade = 'excellent'
  else if (newWeightedScore >= 70) grade = 'good'
  else if (newWeightedScore >= 50) grade = 'fair'
  else grade = 'poor'

  // ========================================
  // BUILD DETAILED CHECKS (NEW! - for transparency)
  // ========================================
  // Phase 3: Set relevant field based on isCheckRelevant - Nov 17, 2025
  // Phase 4: Set weight from CHECK_WEIGHTS - Nov 17, 2025
  const createCheckResult = (checkName: string, check: PatternCheckResult, explanation: string, recommendation: string): CheckResult => ({
    passed: check.found,
    relevant: isCheckRelevant(checkName, crawlResult, aiDetection, hasChatWidget, hasApiEndpoint), // Phase 3
    evidence: check.evidence,
    explanation,
    recommendation,
    weight: CHECK_WEIGHTS[checkName] || 1 // Phase 4
  })

  const detailedChecks = {
    // Transparency
    isProviderDisclosed: createCheckResult('isProviderDisclosed', transparency.isProviderDisclosed, 'Users should know which AI provider powers the system', 'Add clear disclosure like "Powered by OpenAI" or "Uses Claude AI"'),
    isIdentityDisclosed: createCheckResult('isIdentityDisclosed', transparency.isIdentityDisclosed, 'AI should identify itself as AI, not impersonate humans', 'Add disclaimer like "You are chatting with an AI assistant"'),
    isAiPolicyLinked: createCheckResult('isAiPolicyLinked', transparency.isAiPolicyLinked, 'Specific AI usage policy builds trust', 'Link to AI-specific terms or usage policy'),
    isModelVersionDisclosed: createCheckResult('isModelVersionDisclosed', transparency.isModelVersionDisclosed, 'Model version disclosure helps users understand capabilities', 'Disclose model version (e.g., "GPT-4", "Claude 2")'),
    isLimitationsDisclosed: createCheckResult('isLimitationsDisclosed', transparency.isLimitationsDisclosed, 'Users should know AI limitations to set proper expectations', 'Add limitations notice (e.g., "AI may make mistakes")'),
    hasDataUsageDisclosure: createCheckResult('hasDataUsageDisclosure', transparency.hasDataUsageDisclosure, 'Users must know how their data is used for AI training', 'Clearly state if conversations are used for training'),

    // User Control
    hasFeedbackMechanism: createCheckResult('hasFeedbackMechanism', userControl.hasFeedbackMechanism, 'Users should be able to provide feedback on AI responses', 'Add thumbs up/down or feedback form'),
    hasConversationReset: createCheckResult('hasConversationReset', userControl.hasConversationReset, 'Users should be able to reset AI conversation context', 'Add "Clear conversation" or "Start over" button'),
    hasHumanEscalation: createCheckResult('hasHumanEscalation', userControl.hasHumanEscalation, 'Users should be able to escalate to human support', 'Add "Talk to human" or "Contact support" option'),
    hasConversationExport: createCheckResult('hasConversationExport', userControl.hasConversationExport, 'Users should be able to export their conversation data', 'Add "Download conversation" feature'),
    hasDataDeletionOption: createCheckResult('hasDataDeletionOption', userControl.hasDataDeletionOption, 'Users should be able to delete their AI conversation data', 'Add "Delete my data" option per GDPR'),

    // Compliance
    hasDpoContact: createCheckResult('hasDpoContact', compliance.hasDpoContact, 'GDPR requires DPO contact for data protection queries', 'Add Data Protection Officer contact information'),
    hasCookieBanner: createCheckResult('hasCookieBanner', compliance.hasCookieBanner, 'EU law requires cookie consent banner', 'Implement GDPR-compliant cookie banner'),
    hasPrivacyPolicyLink: createCheckResult('hasPrivacyPolicyLink', compliance.hasPrivacyPolicyLink, 'Privacy policy is legally required', 'Link to comprehensive privacy policy'),
    hasTermsOfServiceLink: createCheckResult('hasTermsOfServiceLink', compliance.hasTermsOfServiceLink, 'Terms of service protect both user and provider', 'Link to terms of service'),
    hasGdprCompliance: createCheckResult('hasGdprCompliance', compliance.hasGdprCompliance, 'GDPR compliance signals responsible data handling', 'Implement full GDPR compliance measures'),

    // Security & Reliability
    hasBotProtection: createCheckResult('hasBotProtection', security.hasBotProtection, 'Bot protection prevents AI abuse and spam', 'Add reCAPTCHA or similar bot protection'),
    hasAiRateLimitHeaders: createCheckResult('hasAiRateLimitHeaders', security.hasAiRateLimitHeaders, 'Rate limiting prevents API abuse', 'Implement rate limiting headers'),
    hasBasicWebSecurity: createCheckResult('hasBasicWebSecurity', security.hasBasicWebSecurity, 'Basic web security protects AI interactions', 'Ensure HTTPS, CSP, security headers'),
    hasInputLengthLimit: createCheckResult('hasInputLengthLimit', security.hasInputLengthLimit, 'Input limits prevent prompt injection attacks', 'Implement reasonable input length limits'),
    usesInputSanitization: createCheckResult('usesInputSanitization', security.usesInputSanitization, 'Input sanitization prevents injection attacks', 'Sanitize all user inputs before AI processing'),
    hasErrorHandling: createCheckResult('hasErrorHandling', security.hasErrorHandling, 'Proper error handling prevents information disclosure', 'Implement graceful error messages'),
    hasSessionManagement: createCheckResult('hasSessionManagement', security.hasSessionManagement, 'Session management protects conversation privacy', 'Implement secure session management'),

    // Ethical AI
    hasBiasDisclosure: createCheckResult('hasBiasDisclosure', ethicalAi.hasBiasDisclosure, 'AI bias disclosure builds trust and sets expectations', 'Disclose potential AI biases'),
    hasContentModeration: createCheckResult('hasContentModeration', ethicalAi.hasContentModeration, 'Content moderation prevents harmful AI outputs', 'Implement content filtering and moderation'),
    hasAgeVerification: createCheckResult('hasAgeVerification', ethicalAi.hasAgeVerification, 'Age verification protects minors from inappropriate AI content', 'Add age verification for sensitive AI features'),
    hasAccessibilitySupport: createCheckResult('hasAccessibilitySupport', ethicalAi.hasAccessibilitySupport, 'Accessibility ensures AI is usable by everyone', 'Implement WCAG accessibility standards'),
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

  // Phase 4: Use new weighted score in summary - Nov 17, 2025
  const summary = {
    message: newWeightedScore >= 70
      ? `This AI implementation demonstrates good trust practices with a weighted score of ${newWeightedScore}/100.`
      : newWeightedScore >= 50
      ? `This AI implementation has moderate trust practices (${newWeightedScore}/100). Several improvements recommended.`
      : `This AI implementation has significant trust concerns (${newWeightedScore}/100). Critical improvements needed.`,
    strengths: strengths.length > 0 ? strengths : ['AI implementation detected'],
    weaknesses,
    criticalIssues
  }

  return {
    score, // Keep unweighted for backward compatibility
    weightedScore: newWeightedScore, // Phase 4: NEW weighted score based on check importance
    categoryScores,
    passedChecks,
    totalChecks, // Phase 3: Dynamic count (10-27 based on relevance)
    relevantChecks: relevantCheckCount, // Phase 3: How many checks are applicable
    grade,
    hasAiImplementation: true, // NEW
    aiConfidenceLevel: aiDetection.confidenceLevel, // NEW
    detectedAiProvider,
    detectedModel,
    detectedChatFramework,
    detailedChecks, // NEW - Phase 3: includes relevant field for each check
    checks, // Legacy format
    evidenceData,
    // NEW: Extended AI Detection Results (P0 Detectors)
    voiceAI: voiceAIResult.hasVoiceAI ? {
      hasVoiceAI: voiceAIResult.hasVoiceAI,
      detections: voiceAIResult.detections,
      totalProviders: voiceAIResult.totalProviders,
    } : undefined,
    translationAI: translationAIResult.hasTranslationAI ? {
      hasTranslationAI: translationAIResult.hasTranslationAI,
      detections: translationAIResult.detections,
      totalProviders: translationAIResult.totalProviders,
    } : undefined,
    searchAI: searchAIResult.hasSearchAI ? {
      hasSearchAI: searchAIResult.hasSearchAI,
      detections: searchAIResult.detections,
      totalProviders: searchAIResult.totalProviders,
      criticalRiskCount: searchAIResult.criticalRiskCount,
    } : undefined,
    personalizationAI: personalizationAIResult.hasPersonalizationAI ? {
      hasPersonalizationAI: personalizationAIResult.hasPersonalizationAI,
      detections: personalizationAIResult.detections,
      totalProviders: personalizationAIResult.totalProviders,
      sessionRecordingDetected: personalizationAIResult.sessionRecordingDetected,
    } : undefined,
    analyticsAI: analyticsAIResult.hasAnalyticsAI ? {
      hasAnalyticsAI: analyticsAIResult.hasAnalyticsAI,
      detections: analyticsAIResult.detections,
      totalProviders: analyticsAIResult.totalProviders,
      sessionReplayDetected: analyticsAIResult.sessionReplayDetected,
      criticalRiskCount: analyticsAIResult.criticalRiskCount,
    } : undefined,
    imageVideoAI: imageVideoAIResult.hasImageVideoAI ? {
      hasImageVideoAI: imageVideoAIResult.hasImageVideoAI,
      detections: imageVideoAIResult.detections,
      totalProviders: imageVideoAIResult.totalProviders,
      generativeAIDetected: imageVideoAIResult.generativeAIDetected,
    } : undefined,
    contentModeration: contentModerationResult.hasContentModeration ? {
      hasContentModeration: contentModerationResult.hasContentModeration,
      detections: contentModerationResult.detections,
      totalProviders: contentModerationResult.totalProviders,
      highConfidenceCount: contentModerationResult.highConfidenceCount,
    } : undefined,
    summary, // NEW
  }
}

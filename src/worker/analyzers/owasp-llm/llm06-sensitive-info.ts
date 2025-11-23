/**
 * OWASP LLM06: Sensitive Information Disclosure Analyzer
 *
 * Detects sensitive information leaks in AI applications:
 * 1. Training data exposure (prompts, examples, fine-tuning data)
 * 2. System prompts in client-side code
 * 3. PII (Personally Identifiable Information) in code/comments
 * 4. Internal API endpoints and infrastructure details
 * 5. Model architecture and hyperparameters
 * 6. Business logic and proprietary algorithms
 *
 * Risk Levels:
 * - CRITICAL: API keys, passwords, authentication tokens
 * - HIGH: System prompts, training data, PII, internal endpoints
 * - MEDIUM: Model architecture, hyperparameters, business logic
 * - LOW: Verbose error messages, debug information
 *
 * Passive Detection Only:
 * - Analyzes JavaScript, HTML comments, and inline data
 * - Pattern matching for sensitive data types
 * - Entropy analysis for high-entropy strings (potential secrets)
 * - Context-aware false positive reduction
 */

export interface SensitiveInfoFinding {
  type: 'api-key' | 'system-prompt' | 'training-data' | 'pii' | 'internal-endpoint' | 'model-info' | 'business-logic' | 'debug-info'
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: 'confirmed' | 'high' | 'medium' | 'low' // NEW: Confidence level like Technology Stack
  title: string
  description: string
  evidence: string
  dataType?: string
  redactedValue?: string
  location: string
  impact: string
  recommendation: string
  confidenceReason?: string // NEW: Why this confidence level?
}

export interface SensitiveInfoResult {
  findings: SensitiveInfoFinding[]
  hasAPIKeys: boolean
  hasSystemPrompts: boolean
  hasTrainingData: boolean
  hasPII: boolean
  hasInternalEndpoints: boolean
  hasModelInfo: boolean
  exposedDataTypes: string[]
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
  timeout?: boolean // Optional timeout flag
}

// System prompt patterns (different from LLM01 - focuses on disclosure, not injection)
// FIXED: Added lazy quantifiers (?) to prevent catastrophic backtracking
const SYSTEM_PROMPT_PATTERNS = [
  /systemPrompt\s*[:=]\s*["'`]([^"'`]{100,500}?)["'`]/gi,
  /system:\s*["'`]([^"'`]{100,500}?)["'`]/gi,
  /instructions\s*[:=]\s*["'`]([^"'`]{100,500}?)["'`]/gi,
  /You are (?:a|an) ([^"'.]{20,200}?)\./gi,
  /Act as (?:a|an) ([^"'.]{20,200}?)\./gi,
  /Your role is to ([^"'.]{20,200}?)\./gi,
]

// Training data exposure patterns
// FIXED: Removed catastrophic backtracking patterns with negated character classes + unlimited quantifiers
const TRAINING_DATA_PATTERNS = [
  /trainingData\s*[:=]\s*\[/gi,
  /examples\s*[:=]\s*\[\s*\{/gi, // FIXED: Removed {50,} quantifier
  /fewShot(?:Examples)?\s*[:=]\s*\[/gi,
  /prompt(?:s|Examples)\s*[:=]\s*\[\s*["'{]/gi, // FIXED: Removed {50,} quantifier
  /conversation(?:History|Examples)\s*[:=]\s*\[/gi,
]

// PII patterns (email, phone, SSN, credit card)
const PII_PATTERNS = [
  { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'high' as const },
  { type: 'phone', pattern: /(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g, severity: 'high' as const },
  { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' as const },
  { type: 'credit-card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, severity: 'critical' as const },
  // More restrictive passport pattern - real passports are typically 6-9 chars with specific formats
  // UK: AA123456 (2 letters + 6 digits)
  // US: starts with letter, typically 9 chars
  // This pattern is intentionally conservative to avoid false positives on order numbers
  { type: 'passport', pattern: /\b[A-Z]{2}\d{6,7}\b/g, severity: 'high' as const },
]

// Context patterns that indicate DEMO/EXAMPLE data (reduces confidence)
const DEMO_CONTEXT_PATTERNS = [
  // Chat conversation examples/logs
  /["'](?:thinking|message|response|reply|question|answer|conversation|dialog)["']\s*:\s*["']/i,
  /["'](?:user|assistant|system|bot|human|ai)["']\s*:\s*["']/i,
  /conversationHistory/i,
  /chatLog/i,
  /exampleConversation/i,

  // Order/transaction examples
  /["']order_number["']\s*:/i,
  /["']tracking_?(?:number|id|code)["']\s*:/i,
  /["']transaction_?(?:id|number)["']\s*:/i,
  /["']invoice_?(?:id|number)["']\s*:/i,

  // Test/demo/placeholder markers
  /test[-_]?data/i,
  /demo[-_]?data/i,
  /sample[-_]?data/i,
  /placeholder/i,
  /example/i,
  /mock[-_]?data/i,
  /"Lorem ipsum"/i,

  // Documentation/tutorial context
  /\/\*\s*Example:/i,
  /\/\/\s*Example:/i,
  /["']description["']\s*:\s*["'].*example/i,

  // JSON schemas and type definitions
  /type\s*[:=]\s*["']string["']/i,
  /"properties"\s*:/i,
  /"schema"\s*:/i,
]

// Context patterns to EXCLUDE from PII detection (false positive filters)
const PII_EXCLUSION_CONTEXTS = {
  'credit-card': [
    /fb:app_id/i,           // Facebook App ID (e.g., 1401488693436528)
    /property=["']fb:/i,    // Facebook meta properties
    /google-site-verification/i, // Google verification codes
    /data-client-id/i,      // Client IDs
    /clientId/i,            // Client IDs in JS
    /app_id/i,              // Generic app IDs
    /application_id/i,      // Application IDs
    /version["\s:=]/i,      // Version numbers
    /<line\s+/i,            // SVG line elements (chart coordinates)
    /opacity=["']/i,        // SVG opacity attributes (decimal numbers)
    /stroke=["']/i,         // SVG stroke attributes
    /<path\s+/i,            // SVG path elements
    /<rect\s+/i,            // SVG rect elements
    /<circle\s+/i,          // SVG circle elements
    /<svg\s+/i,             // SVG elements
    /viewBox=/i,            // SVG viewBox attributes
    /transform=/i,          // SVG transform attributes
    /d=["'][M\s\d]/i,       // SVG path data attributes (M command)
    /points=["']/i,         // SVG polygon/polyline points
    /x[12]?=["']\d/i,       // SVG x/x1/x2 coordinates
    /y[12]?=["']\d/i,       // SVG y/y1/y2 coordinates
    /width=["']\d/i,        // SVG width attributes
    /height=["']\d/i,       // SVG height attributes
  ],
  'phone': [
    /\d{13,}/,              // Numbers longer than 13 digits (not phone numbers)
    /\d{3}\d{3}\d{4}\d+/,   // Numbers with 10+ consecutive digits
    /[a-f0-9]{10,}/i,       // Hex strings
    /timestamp/i,           // Timestamp fields
    /id["\s:=]/i,           // ID fields
    /key["\s:=]/i,          // Key fields
  ],
  'email': [
    /example\.com/i,        // Example emails
    /test@/i,               // Test emails
    /noreply@/i,            // No-reply emails (legitimate)
    /support@/i,            // Support emails (legitimate)
    /info@/i,               // Info emails (legitimate)
    /contact@/i,            // Contact emails (legitimate)
  ],
  'passport': [
    // Order numbers, tracking IDs, invoice numbers (NOT passports)
    /order[-_]?(?:number|id|code)/i,
    /tracking[-_]?(?:number|id|code)/i,
    /invoice[-_]?(?:number|id)/i,
    /transaction[-_]?(?:id|number)/i,
    /confirmation[-_]?(?:number|code)/i,
    /reference[-_]?(?:number|code)/i,
    /ticket[-_]?(?:number|id)/i,
    // Common order number prefixes (ORD, EL, TRK, INV, etc.)
    /["'][A-Z]{2,4}\d{4,}/i, // Generic alphanumeric IDs in quotes
  ],
  'ssn': [
    /\d{3}-\d{2}-\d{4}/,    // Exact SSN pattern in demo contexts
    /example/i,
    /sample/i,
    /test/i,
  ],
}

// Internal endpoint patterns
const INTERNAL_ENDPOINT_PATTERNS = [
  /(?:https?:)?\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+):\d+/gi,
  /api\.internal\./gi,
  /\.local:\d+/gi,
  /(?:dev|staging|test)\.(?!public)[a-z0-9-]+\.[a-z]{2,}/gi,
]

// Model information patterns
const MODEL_INFO_PATTERNS = [
  { pattern: /model\s*[:=]\s*["']([^"']+)["']/gi, type: 'model-name' },
  { pattern: /temperature\s*[:=]\s*([\d.]+)/gi, type: 'temperature' },
  { pattern: /max_tokens\s*[:=]\s*(\d+)/gi, type: 'max-tokens' },
  { pattern: /top_p\s*[:=]\s*([\d.]+)/gi, type: 'top-p' },
  { pattern: /(?:gpt-4|gpt-3\.5|claude-[23]|gemini-pro)/gi, type: 'model-identifier' },
]

// Business logic patterns
// FIXED: Added lazy quantifiers and limited greedy quantifiers
const BUSINESS_LOGIC_PATTERNS = [
  /\/\/ TODO: (.*?sensitive.*?)/gi,
  /\/\/ FIXME: (.*?security.*?)/gi,
  /\/\* INTERNAL: (.*?) \*\//gi,
  /pricing\s*[:=]\s*\{[^}]{50,500}?\}/gi, // FIXED: Limited to 500 chars max + lazy
  /algorithm\s*[:=]\s*["']([^"']{20,200}?)["']/gi, // FIXED: Limited to 200 chars + lazy
]

// Debug information patterns
const DEBUG_PATTERNS = [
  /console\.log\([^)]*(?:password|token|key|secret)[^)]*\)/gi,
  /console\.error\([^)]*stack[^)]*\)/gi,
  /debugMode\s*[:=]\s*true/gi,
  /debug:\s*true/gi,
]

/**
 * Determine confidence level based on context analysis
 * Similar to Technology Stack analyzer's "Confirmed" / "High" / "Medium" / "Low"
 */
function determineConfidenceLevel(
  value: string,
  context: string,
  findingType: string
): { confidence: 'confirmed' | 'high' | 'medium' | 'low', reason: string } {

  // Check if this is in a demo/example/test context
  let demoContextMatches = 0
  const matchedDemoPatterns: string[] = []

  for (const pattern of DEMO_CONTEXT_PATTERNS) {
    if (pattern.test(context)) {
      demoContextMatches++
      matchedDemoPatterns.push(pattern.source.substring(0, 30))
    }
  }

  // DEMO/EXAMPLE DATA = LOW confidence
  if (demoContextMatches >= 2) {
    return {
      confidence: 'low',
      reason: `Found in demo/example context (${demoContextMatches} indicators: ${matchedDemoPatterns.slice(0, 2).join(', ')})`
    }
  }

  if (demoContextMatches === 1) {
    return {
      confidence: 'medium',
      reason: `Possible demo/example data (1 indicator: ${matchedDemoPatterns[0]})`
    }
  }

  // CONFIRMED = Multiple verification signals
  if (findingType === 'api-key') {
    // High entropy + specific API key pattern = CONFIRMED
    const entropy = calculateEntropy(value)
    const hasApiKeyPrefix = /^(sk|pk|Bearer|token|key)[-_]/i.test(value)
    const isVeryLong = value.length > 40

    if (entropy > 4.5 && (hasApiKeyPrefix || isVeryLong)) {
      return {
        confidence: 'confirmed',
        reason: `High entropy (${entropy.toFixed(2)}) + API key pattern + length ${value.length}`
      }
    }

    if (entropy > 4.0) {
      return {
        confidence: 'high',
        reason: `High entropy (${entropy.toFixed(2)}), likely cryptographic key`
      }
    }

    return {
      confidence: 'medium',
      reason: `Moderate entropy (${entropy.toFixed(2)}), potential secret`
    }
  }

  // SYSTEM PROMPTS
  if (findingType === 'system-prompt') {
    const hasExplicitMarker = /systemPrompt|system:|instructions:/i.test(context)
    const isLongEnough = value.length > 200
    const hasAIKeywords = /you are|act as|your role|assistant|AI/i.test(value)

    if (hasExplicitMarker && isLongEnough && hasAIKeywords) {
      return {
        confidence: 'confirmed',
        reason: 'Explicit system prompt marker + length + AI keywords'
      }
    }

    if (hasExplicitMarker || (isLongEnough && hasAIKeywords)) {
      return {
        confidence: 'high',
        reason: 'Strong indicators of system prompt'
      }
    }

    return {
      confidence: 'medium',
      reason: 'Possible system prompt, but weak signals'
    }
  }

  // PII
  if (findingType === 'pii') {
    // If value passed all exclusion filters, it's likely real PII
    return {
      confidence: 'high',
      reason: 'Passed all false positive filters, likely real PII'
    }
  }

  // DEFAULT: Medium confidence
  return {
    confidence: 'medium',
    reason: 'Standard detection, no strong confidence signals'
  }
}

export async function analyzeLLM06SensitiveInfo(
  html: string,
  headers: Record<string, string>
): Promise<SensitiveInfoResult> {
  const findings: SensitiveInfoFinding[] = []
  const exposedDataTypes: string[] = []

  let hasAPIKeys = false
  let hasSystemPrompts = false
  let hasTrainingData = false
  let hasPII = false
  let hasInternalEndpoints = false
  let hasModelInfo = false

  // 1. Check for exposed system prompts
  for (const pattern of SYSTEM_PROMPT_PATTERNS) {
    const matches = Array.from(html.matchAll(pattern))

    for (const match of matches) {
      hasSystemPrompts = true
      exposedDataTypes.push('system-prompt')

      const prompt = match[1] || match[0]
      const redacted = prompt.substring(0, 50) + '...'

      // Extract context for confidence determination
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + prompt.length + 200)
      const context = html.substring(contextStart, contextEnd)

      // NEW: Determine confidence level
      const confidenceResult = determineConfidenceLevel(prompt, context, 'system-prompt')

      findings.push({
        type: 'system-prompt',
        severity: 'high',
        confidence: confidenceResult.confidence, // NEW
        title: `Exposed System Prompt in Client Code`,
        description: `System prompt or instructions are exposed in client-side JavaScript. Attackers can read these to understand AI behavior and craft better prompt injection attacks.`,
        evidence: redacted,
        redactedValue: redacted,
        location: 'JavaScript code',
        impact: `Exposing system prompts reveals the AI's persona, limitations, and safety instructions. Attackers can use this knowledge to craft targeted prompt injection attacks that exploit specific weaknesses in the system instructions.`,
        recommendation: `Move all system prompts to server-side code. Only send user-facing prompts to the client. Use environment variables for sensitive prompt templates. Implement prompt obfuscation if client-side AI is required.`,
        confidenceReason: confidenceResult.reason, // NEW
      })
    }
  }

  // 2. Check for training data exposure
  for (const pattern of TRAINING_DATA_PATTERNS) {
    const matches = Array.from(html.matchAll(pattern))

    for (const match of matches) {
      hasTrainingData = true
      exposedDataTypes.push('training-data')

      const snippet = match[0].substring(0, 100) + '...'

      // Extract context
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + match[0].length + 200)
      const context = html.substring(contextStart, contextEnd)

      // NEW: Determine confidence level
      const confidenceResult = determineConfidenceLevel(snippet, context, 'training-data')

      findings.push({
        type: 'training-data',
        severity: 'high',
        confidence: confidenceResult.confidence, // NEW
        title: `Exposed Training Data or Examples`,
        description: `Training data, few-shot examples, or conversation history is exposed in client-side code. This may contain proprietary data, user conversations, or sensitive business information.`,
        evidence: snippet,
        redactedValue: snippet,
        location: 'JavaScript code',
        impact: `Exposed training data can reveal proprietary business logic, user behavior patterns, internal terminology, and potentially sensitive user data used for fine-tuning. Competitors can reverse-engineer your AI's capabilities.`,
        recommendation: `Store training data server-side only. Load examples dynamically via authenticated APIs. Sanitize any client-side examples to remove sensitive information. Use encrypted storage for training datasets.`,
        confidenceReason: confidenceResult.reason, // NEW
      })
    }
  }

  // 3. Check for PII (Personally Identifiable Information)
  for (const piiPattern of PII_PATTERNS) {
    const matches = Array.from(html.matchAll(piiPattern.pattern))

    for (const match of matches) {
      // Extract surrounding context (200 chars before and after match)
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + match[0].length + 200)
      const htmlContext = html.substring(contextStart, contextEnd)

      // Filter out common false positives using context-aware analysis
      if (shouldSkipPII(match[0], piiPattern.type, htmlContext)) continue

      hasPII = true
      exposedDataTypes.push(`pii-${piiPattern.type}`)

      const redacted = redactPII(match[0], piiPattern.type)

      // NEW: Determine confidence level based on context
      const confidenceResult = determineConfidenceLevel(match[0], htmlContext, 'pii')

      findings.push({
        type: 'pii',
        severity: piiPattern.severity,
        confidence: confidenceResult.confidence, // NEW
        title: `Exposed PII: ${piiPattern.type.toUpperCase()}`,
        description: `Personally Identifiable Information (${piiPattern.type}) found in client-side code. This violates privacy regulations (GDPR, CCPA) and exposes user data.`,
        evidence: redacted,
        dataType: piiPattern.type,
        redactedValue: redacted,
        location: 'HTML/JavaScript',
        impact: piiPattern.severity === 'critical'
          ? `Critical PII exposure (${piiPattern.type}) violates GDPR, CCPA, and other privacy laws. Can lead to identity theft, fraud, and legal penalties up to 4% of annual revenue. User trust will be severely damaged.`
          : `PII exposure violates privacy regulations and user trust. ${piiPattern.type} data should never be in client-side code without explicit consent and encryption.`,
        recommendation: `Remove all PII from client-side code immediately. Use server-side processing for user data. Implement data masking/tokenization for any necessary client display. Conduct a privacy impact assessment.`,
        confidenceReason: confidenceResult.reason, // NEW
      })
    }
  }

  // 4. Check for internal endpoints
  for (const pattern of INTERNAL_ENDPOINT_PATTERNS) {
    const matches = Array.from(html.matchAll(pattern))

    for (const match of matches) {
      hasInternalEndpoints = true
      exposedDataTypes.push('internal-endpoint')

      // Extract context
      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + match[0].length + 200)
      const context = html.substring(contextStart, contextEnd)
      const confidenceResult = determineConfidenceLevel(match[0], context, 'internal-endpoint')

      findings.push({
        type: 'internal-endpoint',
        severity: 'high',
        confidence: confidenceResult.confidence,
        title: `Exposed Internal Endpoint`,
        description: `Internal API endpoint, localhost URL, or private IP address found in client code. This exposes your infrastructure architecture to attackers.`,
        evidence: match[0],
        location: 'JavaScript/HTML',
        impact: `Exposed internal endpoints reveal infrastructure details, development/staging environments, and internal services. Attackers can map your network topology, discover hidden APIs, and attempt to access internal systems.`,
        recommendation: `Remove all references to internal endpoints, localhost, and private IPs from client code. Use environment-specific configuration. Implement API gateway patterns to abstract internal services.`,
        confidenceReason: confidenceResult.reason,
      })
    }
  }

  // 5. Check for model information disclosure
  for (const modelPattern of MODEL_INFO_PATTERNS) {
    const matches = Array.from(html.matchAll(modelPattern.pattern))

    for (const match of matches) {
      hasModelInfo = true
      exposedDataTypes.push(`model-${modelPattern.type}`)

      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + match[0].length + 200)
      const context = html.substring(contextStart, contextEnd)
      const confidenceResult = determineConfidenceLevel(match[0], context, 'model-info')

      findings.push({
        type: 'model-info',
        severity: 'medium',
        confidence: confidenceResult.confidence,
        title: `Exposed Model Information: ${modelPattern.type}`,
        description: `AI model details (${modelPattern.type}) are exposed in client-side code. This reveals your AI architecture and configuration to competitors and attackers.`,
        evidence: match[0],
        dataType: modelPattern.type,
        location: 'JavaScript code',
        impact: `Exposing model details like ${modelPattern.type} helps attackers understand your AI's capabilities, cost structure, and potential weaknesses. Competitors can copy your model selection and configuration. Can enable targeted adversarial attacks.`,
        recommendation: `Move model configuration to server-side environment variables. Use generic API abstractions that don't reveal underlying model details. Implement model selection logic server-side only.`,
        confidenceReason: confidenceResult.reason,
      })
    }
  }

  // 6. Check for business logic exposure
  for (const pattern of BUSINESS_LOGIC_PATTERNS) {
    const matches = Array.from(html.matchAll(pattern))

    for (const match of matches) {
      exposedDataTypes.push('business-logic')

      const snippet = match[0].substring(0, 150)

      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + snippet.length + 200)
      const context = html.substring(contextStart, contextEnd)
      const confidenceResult = determineConfidenceLevel(snippet, context, 'business-logic')

      findings.push({
        type: 'business-logic',
        severity: 'medium',
        confidence: confidenceResult.confidence,
        title: `Exposed Business Logic`,
        description: `Business logic, internal comments, or proprietary algorithms found in client-side code. This reveals competitive advantages and internal processes.`,
        evidence: snippet,
        location: 'JavaScript comments/code',
        impact: `Exposed business logic reveals pricing strategies, algorithmic approaches, and internal decision-making processes. Competitors can reverse-engineer your competitive advantages. May also expose security TODOs and known weaknesses.`,
        recommendation: `Remove all internal comments and TODO items from production builds. Minify and obfuscate client-side code. Keep proprietary algorithms server-side. Use build tools to strip development comments.`,
        confidenceReason: confidenceResult.reason,
      })
    }
  }

  // 7. Check for debug information
  for (const pattern of DEBUG_PATTERNS) {
    const matches = Array.from(html.matchAll(pattern))

    for (const match of matches) {
      exposedDataTypes.push('debug-info')

      const matchIndex = match.index || 0
      const contextStart = Math.max(0, matchIndex - 200)
      const contextEnd = Math.min(html.length, matchIndex + match[0].length + 200)
      const context = html.substring(contextStart, contextEnd)
      const confidenceResult = determineConfidenceLevel(match[0], context, 'debug-info')

      findings.push({
        type: 'debug-info',
        severity: 'low',
        confidence: confidenceResult.confidence,
        title: `Debug Information Enabled`,
        description: `Debug code, console logging, or verbose error messages found in production. This can leak sensitive runtime information.`,
        evidence: match[0],
        location: 'JavaScript code',
        impact: `Debug code in production can leak API keys, user data, stack traces, and internal state information through browser console logs. Attackers with browser access can gather reconnaissance data.`,
        recommendation: `Disable debug mode in production. Remove console.log statements. Use proper error handling without exposing stack traces. Implement environment-based logging (only in development).`,
        confidenceReason: confidenceResult.reason,
      })
    }
  }

  // 8. Additional check: Look for high-entropy strings (potential undiscovered secrets)
  const highEntropyStrings = findHighEntropyStrings(html)

  for (const entropyString of highEntropyStrings) {
    // Skip if already detected as API key by other analyzers
    if (findings.some(f => f.evidence.includes(entropyString.value.substring(0, 20)))) {
      continue
    }

    hasAPIKeys = true
    exposedDataTypes.push('high-entropy-secret')

    // Extract context for this high-entropy string (we need to find it again in HTML)
    const stringIndex = html.indexOf(entropyString.value)
    const contextStart = Math.max(0, stringIndex - 200)
    const contextEnd = Math.min(html.length, stringIndex + entropyString.value.length + 200)
    const context = stringIndex >= 0 ? html.substring(contextStart, contextEnd) : ''

    // NEW: Determine confidence level
    const confidenceResult = determineConfidenceLevel(entropyString.value, context, 'api-key')

    findings.push({
      type: 'api-key',
      severity: 'critical',
      confidence: confidenceResult.confidence, // NEW
      title: `Potential Secret: High-Entropy String`,
      description: `Detected high-entropy string (${entropyString.entropy.toFixed(2)} bits) that may be an API key, token, or secret. High entropy indicates randomness typical of cryptographic keys.`,
      evidence: entropyString.value.substring(0, 20) + '***',
      redactedValue: entropyString.value.substring(0, 10) + '***',
      location: 'JavaScript code',
      impact: `High-entropy strings are likely cryptographic keys, API tokens, or secrets. If exposed, attackers can authenticate as your application, access AI services, or compromise user accounts.`,
      recommendation: `Investigate this string immediately. If it's a secret, rotate it and move to environment variables. Use secret scanning tools (git-secrets, trufflehog) to detect leaked credentials.`,
      confidenceReason: confidenceResult.reason, // NEW
    })
  }

  // Calculate overall risk
  let overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'

  if (findings.some(f => f.severity === 'critical') || hasAPIKeys) {
    overallRisk = 'critical'
  } else if (findings.some(f => f.severity === 'high') || hasSystemPrompts || hasPII) {
    overallRisk = 'high'
  } else if (findings.some(f => f.severity === 'medium') || hasModelInfo) {
    overallRisk = 'medium'
  } else if (findings.length > 0) {
    overallRisk = 'low'
  }

  return {
    findings,
    hasAPIKeys,
    hasSystemPrompts,
    hasTrainingData,
    hasPII,
    hasInternalEndpoints,
    hasModelInfo,
    exposedDataTypes: [...new Set(exposedDataTypes)],
    overallRisk,
  }
}

// Helper: Calculate Shannon entropy to detect random strings (API keys, tokens)
function calculateEntropy(str: string): number {
  const len = str.length
  const frequencies: Record<string, number> = {}

  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1
  }

  let entropy = 0
  for (const freq of Object.values(frequencies)) {
    const p = freq / len
    entropy -= p * Math.log2(p)
  }

  return entropy
}

// Helper: Find high-entropy strings (potential secrets)
function findHighEntropyStrings(html: string): Array<{ value: string; entropy: number }> {
  const results: Array<{ value: string; entropy: number }> = []

  // Look for long alphanumeric strings (potential API keys)
  const stringPattern = /["']([a-zA-Z0-9_\-]{32,})["']/g
  let match

  while ((match = stringPattern.exec(html)) !== null) {
    const value = match[1]

    // Skip common patterns (URLs, paths, etc.)
    if (/^https?:\/\//.test(value) || /\//.test(value)) continue
    if (/^[0-9]+$/.test(value)) continue // Pure numbers
    if (/^[a-f0-9]+$/i.test(value) && value.length === 40) continue // Git SHA (common false positive)

    const entropy = calculateEntropy(value)

    // High entropy threshold (typical for random keys)
    if (entropy > 4.5 && value.length >= 32) {
      results.push({ value, entropy })
    }
  }

  return results.slice(0, 5) // Limit to top 5 to avoid spam
}

// Helper: Redact PII for display
function redactPII(value: string, type: string): string {
  switch (type) {
    case 'email':
      return value.replace(/^(.{2})[^@]+/, '$1***')
    case 'phone':
      return value.replace(/\d{3}$/, '***')
    case 'ssn':
      return '***-**-' + value.slice(-4)
    case 'credit-card':
      return '**** **** **** ' + value.slice(-4)
    default:
      return value.substring(0, 4) + '***'
  }
}

// Helper: Skip false positive PII patterns
function shouldSkipPII(value: string, type: string, htmlContext?: string): boolean {
  // Skip example/placeholder values
  if (type === 'email' && /example\.com|test\.com|domain\.com/.test(value)) return true
  if (type === 'phone' && /555-?0{4}|123-?4567/.test(value)) return true
  if (type === 'ssn' && /000-00-0000|123-45-6789/.test(value)) return true

  // Skip version numbers that look like phone numbers
  if (type === 'phone' && /\d\.\d\.\d/.test(value)) return true

  // ========================================
  // EMAIL FALSE POSITIVES (Nov 16, 2025)
  // Fix: Image files with @2x, @3x, @4x (Retina images)
  // ========================================
  if (type === 'email') {
    // 1. Retina image suffixes: filename@2x.jpg, image@3x.png
    if (/@[234]x\.(jpe?g|png|gif|svg|webp|bmp|ico|tiff?)$/i.test(value)) return true

    // 2. Image file extensions anywhere in the "email"
    if (/\.(jpe?g|png|gif|svg|webp|bmp|ico|tiff?|avif|heic)$/i.test(value)) return true

    // 3. Contains path separator / (emails don't have paths)
    if (value.includes('/')) return true

    // 4. Srcset attribute patterns: /path/file@2x.jpg 2x
    if (/@[234]x\b/i.test(value)) return true
  }

  // NEW: Context-aware exclusions using surrounding HTML
  if (htmlContext) {
    const exclusions = PII_EXCLUSION_CONTEXTS[type as keyof typeof PII_EXCLUSION_CONTEXTS]
    if (exclusions) {
      for (const exclusionPattern of exclusions) {
        if (exclusionPattern.test(htmlContext)) {
          return true // Skip this match - it's in an excluded context
        }
      }
    }
  }

  // Additional credit card false positive filters
  if (type === 'credit-card') {
    // Skip if the number doesn't pass Luhn algorithm (basic credit card validation)
    const digitsOnly = value.replace(/\D/g, '')
    if (!passesLuhnCheck(digitsOnly)) return true
  }

  return false
}

// Luhn algorithm for credit card validation (reduces false positives)
function passesLuhnCheck(cardNumber: string): boolean {
  if (!/^\d+$/.test(cardNumber)) return false

  let sum = 0
  let isEven = false

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

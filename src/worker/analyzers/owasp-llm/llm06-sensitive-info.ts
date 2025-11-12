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
  title: string
  description: string
  evidence: string
  dataType?: string
  redactedValue?: string
  location: string
  impact: string
  recommendation: string
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
}

// System prompt patterns (different from LLM01 - focuses on disclosure, not injection)
const SYSTEM_PROMPT_PATTERNS = [
  /systemPrompt\s*[:=]\s*["'`]([^"'`]{100,500})["'`]/gi,
  /system:\s*["'`]([^"'`]{100,500})["'`]/gi,
  /instructions\s*[:=]\s*["'`]([^"'`]{100,500})["'`]/gi,
  /You are (?:a|an) ([^"'.]{20,200})\./gi,
  /Act as (?:a|an) ([^"'.]{20,200})\./gi,
  /Your role is to ([^"'.]{20,200})\./gi,
]

// Training data exposure patterns
const TRAINING_DATA_PATTERNS = [
  /trainingData\s*[:=]\s*\[/gi,
  /examples\s*[:=]\s*\[\s*\{[^}]{50,}/gi,
  /fewShot(?:Examples)?\s*[:=]\s*\[/gi,
  /prompt(?:s|Examples)\s*[:=]\s*\[\s*["'{][^"'}]{50,}/gi,
  /conversation(?:History|Examples)\s*[:=]\s*\[/gi,
]

// PII patterns (email, phone, SSN, credit card)
const PII_PATTERNS = [
  { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'high' as const },
  { type: 'phone', pattern: /(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g, severity: 'high' as const },
  { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: 'critical' as const },
  { type: 'credit-card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, severity: 'critical' as const },
  { type: 'passport', pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, severity: 'high' as const },
]

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
const BUSINESS_LOGIC_PATTERNS = [
  /\/\/ TODO: (.*?sensitive.*?)/gi,
  /\/\/ FIXME: (.*?security.*?)/gi,
  /\/\* INTERNAL: (.*?) \*\//gi,
  /pricing\s*[:=]\s*\{[^}]{50,}\}/gi,
  /algorithm\s*[:=]\s*["']([^"']{20,})["']/gi,
]

// Debug information patterns
const DEBUG_PATTERNS = [
  /console\.log\([^)]*(?:password|token|key|secret)[^)]*\)/gi,
  /console\.error\([^)]*stack[^)]*\)/gi,
  /debugMode\s*[:=]\s*true/gi,
  /debug:\s*true/gi,
]

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
    let match
    pattern.lastIndex = 0

    while ((match = pattern.exec(html)) !== null) {
      hasSystemPrompts = true
      exposedDataTypes.push('system-prompt')

      const prompt = match[1] || match[0]
      const redacted = prompt.substring(0, 50) + '...'

      findings.push({
        type: 'system-prompt',
        severity: 'high',
        title: `Exposed System Prompt in Client Code`,
        description: `System prompt or instructions are exposed in client-side JavaScript. Attackers can read these to understand AI behavior and craft better prompt injection attacks.`,
        evidence: redacted,
        redactedValue: redacted,
        location: 'JavaScript code',
        impact: `Exposing system prompts reveals the AI's persona, limitations, and safety instructions. Attackers can use this knowledge to craft targeted prompt injection attacks that exploit specific weaknesses in the system instructions.`,
        recommendation: `Move all system prompts to server-side code. Only send user-facing prompts to the client. Use environment variables for sensitive prompt templates. Implement prompt obfuscation if client-side AI is required.`,
      })
    }
  }

  // 2. Check for training data exposure
  for (const pattern of TRAINING_DATA_PATTERNS) {
    let match
    pattern.lastIndex = 0

    while ((match = pattern.exec(html)) !== null) {
      hasTrainingData = true
      exposedDataTypes.push('training-data')

      const snippet = match[0].substring(0, 100) + '...'

      findings.push({
        type: 'training-data',
        severity: 'high',
        title: `Exposed Training Data or Examples`,
        description: `Training data, few-shot examples, or conversation history is exposed in client-side code. This may contain proprietary data, user conversations, or sensitive business information.`,
        evidence: snippet,
        redactedValue: snippet,
        location: 'JavaScript code',
        impact: `Exposed training data can reveal proprietary business logic, user behavior patterns, internal terminology, and potentially sensitive user data used for fine-tuning. Competitors can reverse-engineer your AI's capabilities.`,
        recommendation: `Store training data server-side only. Load examples dynamically via authenticated APIs. Sanitize any client-side examples to remove sensitive information. Use encrypted storage for training datasets.`,
      })
    }
  }

  // 3. Check for PII (Personally Identifiable Information)
  for (const piiPattern of PII_PATTERNS) {
    let match
    piiPattern.pattern.lastIndex = 0

    while ((match = piiPattern.pattern.exec(html)) !== null) {
      // Filter out common false positives
      if (shouldSkipPII(match[0], piiPattern.type)) continue

      hasPII = true
      exposedDataTypes.push(`pii-${piiPattern.type}`)

      const redacted = redactPII(match[0], piiPattern.type)

      findings.push({
        type: 'pii',
        severity: piiPattern.severity,
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
      })
    }
  }

  // 4. Check for internal endpoints
  for (const pattern of INTERNAL_ENDPOINT_PATTERNS) {
    let match
    pattern.lastIndex = 0

    while ((match = pattern.exec(html)) !== null) {
      hasInternalEndpoints = true
      exposedDataTypes.push('internal-endpoint')

      findings.push({
        type: 'internal-endpoint',
        severity: 'high',
        title: `Exposed Internal Endpoint`,
        description: `Internal API endpoint, localhost URL, or private IP address found in client code. This exposes your infrastructure architecture to attackers.`,
        evidence: match[0],
        location: 'JavaScript/HTML',
        impact: `Exposed internal endpoints reveal infrastructure details, development/staging environments, and internal services. Attackers can map your network topology, discover hidden APIs, and attempt to access internal systems.`,
        recommendation: `Remove all references to internal endpoints, localhost, and private IPs from client code. Use environment-specific configuration. Implement API gateway patterns to abstract internal services.`,
      })
    }
  }

  // 5. Check for model information disclosure
  for (const modelPattern of MODEL_INFO_PATTERNS) {
    let match
    modelPattern.pattern.lastIndex = 0

    while ((match = modelPattern.pattern.exec(html)) !== null) {
      hasModelInfo = true
      exposedDataTypes.push(`model-${modelPattern.type}`)

      findings.push({
        type: 'model-info',
        severity: 'medium',
        title: `Exposed Model Information: ${modelPattern.type}`,
        description: `AI model details (${modelPattern.type}) are exposed in client-side code. This reveals your AI architecture and configuration to competitors and attackers.`,
        evidence: match[0],
        dataType: modelPattern.type,
        location: 'JavaScript code',
        impact: `Exposing model details like ${modelPattern.type} helps attackers understand your AI's capabilities, cost structure, and potential weaknesses. Competitors can copy your model selection and configuration. Can enable targeted adversarial attacks.`,
        recommendation: `Move model configuration to server-side environment variables. Use generic API abstractions that don't reveal underlying model details. Implement model selection logic server-side only.`,
      })
    }
  }

  // 6. Check for business logic exposure
  for (const pattern of BUSINESS_LOGIC_PATTERNS) {
    let match
    pattern.lastIndex = 0

    while ((match = pattern.exec(html)) !== null) {
      exposedDataTypes.push('business-logic')

      const snippet = match[0].substring(0, 150)

      findings.push({
        type: 'business-logic',
        severity: 'medium',
        title: `Exposed Business Logic`,
        description: `Business logic, internal comments, or proprietary algorithms found in client-side code. This reveals competitive advantages and internal processes.`,
        evidence: snippet,
        location: 'JavaScript comments/code',
        impact: `Exposed business logic reveals pricing strategies, algorithmic approaches, and internal decision-making processes. Competitors can reverse-engineer your competitive advantages. May also expose security TODOs and known weaknesses.`,
        recommendation: `Remove all internal comments and TODO items from production builds. Minify and obfuscate client-side code. Keep proprietary algorithms server-side. Use build tools to strip development comments.`,
      })
    }
  }

  // 7. Check for debug information
  for (const pattern of DEBUG_PATTERNS) {
    let match
    pattern.lastIndex = 0

    while ((match = pattern.exec(html)) !== null) {
      exposedDataTypes.push('debug-info')

      findings.push({
        type: 'debug-info',
        severity: 'low',
        title: `Debug Information Enabled`,
        description: `Debug code, console logging, or verbose error messages found in production. This can leak sensitive runtime information.`,
        evidence: match[0],
        location: 'JavaScript code',
        impact: `Debug code in production can leak API keys, user data, stack traces, and internal state information through browser console logs. Attackers with browser access can gather reconnaissance data.`,
        recommendation: `Disable debug mode in production. Remove console.log statements. Use proper error handling without exposing stack traces. Implement environment-based logging (only in development).`,
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

    findings.push({
      type: 'api-key',
      severity: 'critical',
      title: `Potential Secret: High-Entropy String`,
      description: `Detected high-entropy string (${entropyString.entropy.toFixed(2)} bits) that may be an API key, token, or secret. High entropy indicates randomness typical of cryptographic keys.`,
      evidence: entropyString.value.substring(0, 20) + '***',
      redactedValue: entropyString.value.substring(0, 10) + '***',
      location: 'JavaScript code',
      impact: `High-entropy strings are likely cryptographic keys, API tokens, or secrets. If exposed, attackers can authenticate as your application, access AI services, or compromise user accounts.`,
      recommendation: `Investigate this string immediately. If it's a secret, rotate it and move to environment variables. Use secret scanning tools (git-secrets, trufflehog) to detect leaked credentials.`,
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
function shouldSkipPII(value: string, type: string): boolean {
  // Skip example/placeholder values
  if (type === 'email' && /example\.com|test\.com|domain\.com/.test(value)) return true
  if (type === 'phone' && /555-?0{4}|123-?4567/.test(value)) return true
  if (type === 'ssn' && /000-00-0000|123-45-6789/.test(value)) return true

  // Skip version numbers that look like phone numbers
  if (type === 'phone' && /\d\.\d\.\d/.test(value)) return true

  return false
}

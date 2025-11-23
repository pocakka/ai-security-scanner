/**
 * OWASP LLM01: Prompt Injection Risk Analyzer
 *
 * Detects vulnerabilities where user input can manipulate AI system prompts,
 * potentially causing the AI to ignore safety guidelines or reveal sensitive information.
 *
 * Detection Strategy (Passive Only):
 * 1. System Prompt Leaks - hardcoded prompts in client-side code
 * 2. Risky Prompt Assembly - user input concatenation without sanitization
 * 3. Input Sanitization Analysis - checks if proper input validation exists
 * 4. AI Context Correlation - proximity to AI API calls
 *
 * OWASP Priority: HIGH (Weight: 20/100)
 */

export interface PromptInjectionFinding {
  type: 'system-prompt-leak' | 'risky-prompt-assembly' | 'missing-sanitization' | 'ai-context-risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence: string
  location?: string
  codeSnippet?: string
  impact: string
  recommendation: string
  hasAIContext?: boolean  // Is this near an AI API call?
  hasSanitization?: boolean  // Is input sanitization detected?
}

export interface PromptInjectionResult {
  findings: PromptInjectionFinding[]
  hasSystemPromptLeaks: boolean
  hasRiskyPromptAssembly: boolean
  hasMissingSanitization: boolean
  hasAIContext: boolean
  sanitizationMethods: string[]
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
  aiEndpointsDetected: string[]
}

/**
 * Analyze HTML for prompt injection vulnerabilities
 */
export async function analyzeLLM01PromptInjection(
  html: string,
  responseHeaders: Record<string, string>
): Promise<PromptInjectionResult> {
  const findings: PromptInjectionFinding[] = []

  let hasSystemPromptLeaks = false
  let hasRiskyPromptAssembly = false
  let hasMissingSanitization = false
  let hasAIContext = false

  const sanitizationMethods: string[] = []
  const aiEndpointsDetected: string[] = []

  // Step 1: Detect AI API endpoints (context for correlation)
  const aiEndpoints = detectAIEndpoints(html)
  aiEndpointsDetected.push(...aiEndpoints)
  hasAIContext = aiEndpoints.length > 0

  // Step 2: Detect system prompt leaks
  const systemPromptLeaks = detectSystemPromptLeaks(html)
  for (const leak of systemPromptLeaks) {
    hasSystemPromptLeaks = true

    // Check if this leak is near an AI endpoint (more severe if yes)
    const nearAIEndpoint = aiEndpoints.some(endpoint =>
      html.indexOf(leak.evidence) !== -1 &&
      Math.abs(html.indexOf(leak.evidence) - html.indexOf(endpoint)) < 1000
    )

    findings.push({
      type: 'system-prompt-leak',
      severity: nearAIEndpoint ? 'high' : 'medium',
      title: 'System Prompt Exposed in Client Code',
      description: `AI system prompt detected in client-side JavaScript: "${leak.promptType}". This reveals the AI's instruction set to users, enabling prompt injection attacks.`,
      evidence: leak.evidence,
      codeSnippet: leak.codeSnippet,
      location: leak.location,
      impact: 'Attackers can craft inputs that manipulate the AI to ignore safety guidelines, reveal sensitive data, or perform unauthorized actions. Exposed prompts provide a blueprint for effective attacks.',
      recommendation: 'Move system prompts to server-side code. Never expose AI instructions in client-side JavaScript. Use server-side prompt assembly with proper access controls.',
      hasAIContext: nearAIEndpoint,
    })
  }

  // Step 3: Detect risky prompt assembly patterns
  const riskyAssembly = detectRiskyPromptAssembly(html)
  for (const risk of riskyAssembly) {
    hasRiskyPromptAssembly = true

    findings.push({
      type: 'risky-prompt-assembly',
      severity: risk.hasSanitization ? 'medium' : 'high',
      title: 'Unsanitized User Input in AI Prompts',
      description: `User input is directly concatenated into AI prompts without sanitization: ${risk.pattern}. This allows prompt injection attacks.`,
      evidence: risk.evidence,
      codeSnippet: risk.codeSnippet,
      impact: 'Attackers can inject malicious instructions (e.g., "Ignore previous instructions and...") to manipulate AI behavior, extract sensitive data, or bypass security controls.',
      recommendation: 'Implement input sanitization before prompt assembly. Use parameterized prompts. Add length limits, character filters, and injection pattern detection. Consider using prompt templates with strict variable escaping.',
      hasAIContext: true,
      hasSanitization: risk.hasSanitization,
    })
  }

  // Step 4: Detect sanitization methods (positive signal)
  const sanitization = detectSanitizationMethods(html)
  sanitizationMethods.push(...sanitization.methods)

  // Step 5: Check for missing sanitization (if AI context exists but no sanitization)
  if (hasAIContext && sanitization.methods.length === 0 && !hasRiskyPromptAssembly) {
    hasMissingSanitization = true

    findings.push({
      type: 'missing-sanitization',
      severity: 'medium',
      title: 'AI Integration Without Input Sanitization',
      description: `AI API endpoints detected (${aiEndpointsDetected.join(', ')}) but no input sanitization methods found in client code.`,
      evidence: aiEndpointsDetected.join(', '),
      impact: 'Without input sanitization, users can inject malicious prompts that manipulate AI behavior or extract sensitive information.',
      recommendation: 'Implement server-side input validation and sanitization. Use allowlists for expected input patterns. Add length limits and character filtering. Consider using libraries like validator.js or joi for input validation.',
      hasAIContext: true,
      hasSanitization: false,
    })
  }

  // Step 6: Calculate overall risk
  const overallRisk = calculateOverallRisk(findings, hasAIContext, sanitizationMethods)

  return {
    findings,
    hasSystemPromptLeaks,
    hasRiskyPromptAssembly,
    hasMissingSanitization,
    hasAIContext,
    sanitizationMethods,
    overallRisk,
    aiEndpointsDetected,
  }
}

/**
 * Detect AI API endpoints in HTML/JavaScript
 */
function detectAIEndpoints(html: string): string[] {
  const endpoints: string[] = []

  const aiProviderPatterns = [
    /api\.openai\.com/gi,
    /api\.anthropic\.com/gi,
    /generativelanguage\.googleapis\.com/gi,  // Google AI
    /api\.cohere\.ai/gi,
    /api-inference\.huggingface\.co/gi,
    /api\.ai21\.com/gi,
    /api\.replicate\.com/gi,
    /api\.together\.xyz/gi,
    /api\.mistral\.ai/gi,
    /\/api\/chat/gi,  // Common internal endpoint
    /\/api\/completions/gi,
    /\/api\/ai/gi,
    /\/v1\/chat\/completions/gi,  // OpenAI-compatible
  ]

  for (const pattern of aiProviderPatterns) {
    const matches = html.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (!endpoints.includes(match)) {
          endpoints.push(match)
        }
      })
    }
  }

  return endpoints
}

/**
 * Detect system prompt leaks in client-side code
 */
function detectSystemPromptLeaks(html: string): Array<{
  evidence: string
  codeSnippet: string
  location: string
  promptType: string
}> {
  const leaks: Array<{
    evidence: string
    codeSnippet: string
    location: string
    promptType: string
  }> = []

  // Pattern 1: Variable names that suggest system prompts
  const promptVariablePatterns = [
    { pattern: /(?:const|let|var)\s+(systemPrompt|system_prompt|baseInstructions|base_instructions|aiPersonality|ai_personality|contextTemplate|context_template|instructionSet|instruction_set)\s*=\s*[`'"]([\s\S]{200,1500}?)[`'"]/gi, type: 'Variable Declaration' },
    { pattern: /systemPrompt\s*:\s*[`'"]([\s\S]{200,1500}?)[`'"]/gi, type: 'Object Property' },
    { pattern: /role\s*:\s*['"]system['"],?\s*content\s*:\s*[`'"]([\s\S]{200,1500}?)[`'"]/gi, type: 'OpenAI Message Format' },
  ]

  for (const { pattern, type } of promptVariablePatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const fullMatch = match[0]
      const promptContent = match[1] || match[2] || ''

      // Filter out non-prompts (must contain AI instruction keywords)
      if (containsAIInstructionKeywords(promptContent)) {
        const snippetStart = Math.max(0, match.index - 100)
        const snippetEnd = Math.min(html.length, match.index + fullMatch.length + 100)
        const codeSnippet = html.slice(snippetStart, snippetEnd).trim()

        leaks.push({
          evidence: promptContent.slice(0, 150) + (promptContent.length > 150 ? '...' : ''),
          codeSnippet,
          location: type,
          promptType: type,
        })
      }
    }
  }

  // Pattern 2: Long strings with AI instruction patterns
  const longStringPattern = /[`'"]([^`'"]{200,1500})[`'"]/g
  let match
  while ((match = longStringPattern.exec(html)) !== null) {
    const content = match[1]

    if (containsAIInstructionKeywords(content)) {
      // Already captured by variable patterns? Skip duplicates
      const isDuplicate = leaks.some(leak => leak.evidence.includes(content.slice(0, 100)))
      if (!isDuplicate) {
        const snippetStart = Math.max(0, match.index - 100)
        const snippetEnd = Math.min(html.length, match.index + match[0].length + 100)
        const codeSnippet = html.slice(snippetStart, snippetEnd).trim()

        leaks.push({
          evidence: content.slice(0, 150) + (content.length > 150 ? '...' : ''),
          codeSnippet,
          location: 'String Literal',
          promptType: 'Inline Prompt',
        })
      }
    }
  }

  return leaks
}

/**
 * Check if text contains AI instruction keywords
 */
function containsAIInstructionKeywords(text: string): boolean {
  const instructionKeywords = [
    /you are (?:a|an)/i,
    /act as (?:a|an)/i,
    /your role is/i,
    /never reveal/i,
    /always respond/i,
    /you must/i,
    /you should/i,
    /as an? ai/i,
    /helpful assistant/i,
    /instructions:/i,
    /system:/i,
    /guidelines:/i,
    /do not tell/i,
    /pretend (?:to be|you are)/i,
  ]

  return instructionKeywords.some(keyword => keyword.test(text))
}

/**
 * Detect risky prompt assembly patterns
 */
function detectRiskyPromptAssembly(html: string): Array<{
  pattern: string
  evidence: string
  codeSnippet: string
  hasSanitization: boolean
}> {
  const risks: Array<{
    pattern: string
    evidence: string
    codeSnippet: string
    hasSanitization: boolean
  }> = []

  // Pattern 1: String concatenation with user input
  const concatenationPatterns = [
    /(?:systemPrompt|baseInstructions|prompt)\s*\+\s*(?:userInput|input|message|query|text)/gi,
    /\$\{(?:systemPrompt|baseInstructions)[^}]*\}\s*\$\{(?:userInput|input|message|query|text)[^}]*\}/gi,
    /`[^`]*\$\{[^}]*(?:userInput|input|message|query)[^}]*\}[^`]*`/gi,
  ]

  for (const pattern of concatenationPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const fullMatch = match[0]
      const snippetStart = Math.max(0, match.index - 150)
      const snippetEnd = Math.min(html.length, match.index + fullMatch.length + 150)
      const codeSnippet = html.slice(snippetStart, snippetEnd).trim()

      // Check if sanitization is nearby (within 200 chars before)
      const contextBefore = html.slice(Math.max(0, match.index - 200), match.index)
      const hasSanitization = checkSanitizationInContext(contextBefore)

      risks.push({
        pattern: 'String Concatenation',
        evidence: fullMatch,
        codeSnippet,
        hasSanitization,
      })
    }
  }

  // Pattern 2: Fetch/API calls with unsanitized user data
  const fetchPattern = /fetch\([^)]*(?:openai|anthropic|ai|chat|completions)[^)]*\{[^}]*(?:userInput|input|message|query)[^}]*\}/gi
  let match
  while ((match = fetchPattern.exec(html)) !== null) {
    const fullMatch = match[0]
    const snippetStart = Math.max(0, match.index - 100)
    const snippetEnd = Math.min(html.length, match.index + fullMatch.length + 100)
    const codeSnippet = html.slice(snippetStart, snippetEnd).trim()

    const contextBefore = html.slice(Math.max(0, match.index - 300), match.index)
    const hasSanitization = checkSanitizationInContext(contextBefore)

    risks.push({
      pattern: 'API Call with User Input',
      evidence: fullMatch.slice(0, 100) + '...',
      codeSnippet,
      hasSanitization,
    })
  }

  return risks
}

/**
 * Check if sanitization is present in context
 */
function checkSanitizationInContext(context: string): boolean {
  const sanitizationPatterns = [
    /\.sanitize\(/i,
    /DOMPurify\.sanitize/i,
    /xss-filters/i,
    /validator\.escape/i,
    /\.replace\(/i,  // Basic regex sanitization
    /\.trim\(\)/i,
    /maxLength/i,
  ]

  return sanitizationPatterns.some(pattern => pattern.test(context))
}

/**
 * Detect sanitization methods in code
 */
function detectSanitizationMethods(html: string): {
  methods: string[]
} {
  const methods: string[] = []

  const sanitizationLibraries = [
    { pattern: /DOMPurify\.sanitize/gi, name: 'DOMPurify' },
    { pattern: /sanitize-html/gi, name: 'sanitize-html' },
    { pattern: /xss-filters/gi, name: 'xss-filters' },
    { pattern: /validator\.escape/gi, name: 'validator.js' },
    { pattern: /joi\.validate/gi, name: 'joi' },
    { pattern: /yup\.validate/gi, name: 'yup' },
    { pattern: /zod\.parse/gi, name: 'zod' },
  ]

  for (const { pattern, name } of sanitizationLibraries) {
    if (pattern.test(html)) {
      if (!methods.includes(name)) {
        methods.push(name)
      }
    }
  }

  return { methods }
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(
  findings: PromptInjectionFinding[],
  hasAIContext: boolean,
  sanitizationMethods: string[]
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (findings.length === 0) {
    return 'none'
  }

  // Count severity levels
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const mediumCount = findings.filter(f => f.severity === 'medium').length

  // Critical: Multiple high severity + AI context + no sanitization
  if (criticalCount > 0 || (highCount >= 2 && hasAIContext && sanitizationMethods.length === 0)) {
    return 'critical'
  }

  // High: High severity finding + AI context
  if (highCount > 0 && hasAIContext) {
    return 'high'
  }

  // Medium: Medium severity or high without AI context
  if (mediumCount > 0 || highCount > 0) {
    return 'medium'
  }

  return 'low'
}

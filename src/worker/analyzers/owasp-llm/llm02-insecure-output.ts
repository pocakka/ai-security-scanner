/**
 * OWASP LLM02: Insecure Output Handling Analyzer
 *
 * Detects XSS vectors and unsafe output handling in AI applications.
 * This is a CRITICAL security issue - AI-generated content rendered unsafely can lead to XSS attacks.
 *
 * Detection focuses on:
 * - Dangerous DOM manipulation (innerHTML, dangerouslySetInnerHTML, eval)
 * - Markdown library unsafe configurations
 * - CSP strength correlation (from Security Headers analyzer)
 *
 * OWASP Reference: https://owasp.org/www-project-top-10-for-large-language-model-applications/
 * Priority: CRITICAL (Weight: 25/100 in OWASP scoring)
 */

export interface InsecureOutputFinding {
  type: 'dangerous-dom' | 'markdown-unsafe' | 'eval-usage' | 'csp-weakness' | 'combined-risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence: string
  location?: string
  codeSnippet?: string
  impact: string
  recommendation: string
  cspMitigation?: boolean  // Is CSP strong enough to mitigate this?
  sanitizationDetected?: boolean  // DOMPurify or similar detected?
}

export interface InsecureOutputResult {
  findings: InsecureOutputFinding[]
  hasDangerousDOM: boolean
  hasUnsafeMarkdown: boolean
  hasEvalUsage: boolean
  cspStrength: 'none' | 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
  sanitizationLibraries: string[]
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

// Dangerous DOM manipulation patterns
const DANGEROUS_DOM_PATTERNS = [
  // React patterns
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\{[^}]*__html:\s*([^}]+)\}\}/g,
    framework: 'React',
    severity: 'critical' as const,
    description: 'React dangerouslySetInnerHTML with dynamic content'
  },

  // Vanilla JS innerHTML
  {
    pattern: /\.innerHTML\s*=\s*(?!['"`])([\w.[\]]+|[^;]+)/g,
    framework: 'Vanilla JS',
    severity: 'critical' as const,
    description: 'innerHTML assignment with variable content'
  },

  // outerHTML
  {
    pattern: /\.outerHTML\s*=\s*(?!['"`])([\w.[\]]+|[^;]+)/g,
    framework: 'Vanilla JS',
    severity: 'high' as const,
    description: 'outerHTML assignment with variable content'
  },

  // document.write()
  {
    pattern: /document\.write\s*\(\s*(?!['"`])([\w.[\]]+|[^)]+)\)/g,
    framework: 'Vanilla JS',
    severity: 'high' as const,
    description: 'document.write() with dynamic content'
  },

  // insertAdjacentHTML
  {
    pattern: /\.insertAdjacentHTML\s*\(\s*['"`]\w+['"`]\s*,\s*(?!['"`])([\w.[\]]+|[^)]+)\)/g,
    framework: 'Vanilla JS',
    severity: 'high' as const,
    description: 'insertAdjacentHTML with variable content'
  },

  // Vue v-html directive
  {
    pattern: /v-html\s*=\s*['"`]([^'"`]+)['"`]/g,
    framework: 'Vue.js',
    severity: 'high' as const,
    description: 'Vue v-html directive with dynamic content'
  },

  // Angular [innerHTML]
  {
    pattern: /\[innerHTML\]\s*=\s*['"`]([^'"`]+)['"`]/g,
    framework: 'Angular',
    severity: 'high' as const,
    description: 'Angular innerHTML binding with dynamic content'
  }
]

// Eval and code execution patterns
const EVAL_PATTERNS = [
  {
    pattern: /\beval\s*\(\s*(?!['"`])([\w.[\]]+|[^)]+)\)/g,
    description: 'eval() with dynamic content',
    severity: 'critical' as const
  },
  {
    pattern: /new\s+Function\s*\(\s*(?!['"`])(.*?)\)/g,
    description: 'new Function() with dynamic code',
    severity: 'critical' as const
  },
  {
    pattern: /setTimeout\s*\(\s*(?!function)(?!['"`])([\w.[\]]+|[^,)]+)/g,
    description: 'setTimeout() with string code (not function)',
    severity: 'high' as const
  },
  {
    pattern: /setInterval\s*\(\s*(?!function)(?!['"`])([\w.[\]]+|[^,)]+)/g,
    description: 'setInterval() with string code (not function)',
    severity: 'high' as const
  }
]

// Markdown library patterns and unsafe configurations
const MARKDOWN_PATTERNS = [
  // marked.js unsafe
  {
    pattern: /marked\.setOptions\s*\(\s*\{[^}]*sanitize\s*:\s*false/g,
    library: 'marked.js',
    config: 'sanitize: false',
    severity: 'critical' as const
  },
  {
    pattern: /marked\s*\([^)]*,\s*\{[^}]*sanitize\s*:\s*false/g,
    library: 'marked.js',
    config: 'sanitize: false',
    severity: 'critical' as const
  },

  // react-markdown unsafe
  {
    pattern: /<ReactMarkdown[^>]*skipHtml\s*=\s*\{false\}/g,
    library: 'react-markdown',
    config: 'skipHtml={false}',
    severity: 'high' as const
  },
  {
    pattern: /<ReactMarkdown[^>]*escapeHtml\s*=\s*\{false\}/g,
    library: 'react-markdown',
    config: 'escapeHtml={false}',
    severity: 'high' as const
  },

  // showdown.js unsafe
  {
    pattern: /showdown\.setOption\s*\(\s*['"`]noHeaderId['"`]\s*,\s*false\)/g,
    library: 'showdown.js',
    config: 'noHeaderId: false',
    severity: 'medium' as const
  },

  // markdown-it unsafe
  {
    pattern: /markdownIt\s*\(\s*\{[^}]*html\s*:\s*true/g,
    library: 'markdown-it',
    config: 'html: true',
    severity: 'high' as const
  },

  // remark unsafe
  {
    pattern: /remark\s*\(\s*\{[^}]*sanitize\s*:\s*false/g,
    library: 'remark',
    config: 'sanitize: false',
    severity: 'high' as const
  }
]

// Sanitization library detection (positive signals)
const SANITIZATION_LIBRARIES = [
  'DOMPurify',
  'sanitize-html',
  'xss-filters',
  'js-xss',
  'dompurify',
  'sanitizer'
]

/**
 * Analyze Content Security Policy strength
 */
function analyzeCSPStrength(cspHeader: string): {
  strength: 'none' | 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
  issues: string[]
} {
  if (!cspHeader) {
    return { strength: 'none', issues: ['No CSP header present'] }
  }

  const issues: string[] = []
  const lowerCSP = cspHeader.toLowerCase()

  // Check for dangerous directives
  if (lowerCSP.includes("script-src '*'") || lowerCSP.includes('script-src *')) {
    issues.push("script-src allows all origins ('*')")
    return { strength: 'very-weak', issues }
  }

  if (lowerCSP.includes("'unsafe-inline'") && lowerCSP.includes("'unsafe-eval'")) {
    issues.push("Both 'unsafe-inline' and 'unsafe-eval' present")
    return { strength: 'very-weak', issues }
  }

  if (lowerCSP.includes("'unsafe-inline'")) {
    issues.push("'unsafe-inline' allows inline scripts")
    return { strength: 'weak', issues }
  }

  if (lowerCSP.includes("'unsafe-eval'")) {
    issues.push("'unsafe-eval' allows eval() and similar")
  }

  // Check for strong indicators
  const hasNonce = /nonce-[a-zA-Z0-9+/=]+/.test(cspHeader)
  const hasHash = /sha(256|384|512)-[a-zA-Z0-9+/=]+/.test(cspHeader)
  const hasSelf = lowerCSP.includes("'self'")
  const hasStrictDynamic = lowerCSP.includes("'strict-dynamic'")
  const hasTrustedTypes = lowerCSP.includes('require-trusted-types-for')

  if (hasTrustedTypes && (hasNonce || hasHash) && hasStrictDynamic) {
    return { strength: 'very-strong', issues }
  }

  if ((hasNonce || hasHash) && hasStrictDynamic) {
    return { strength: 'strong', issues }
  }

  if (hasSelf && !lowerCSP.includes("'unsafe-")) {
    return { strength: 'medium', issues }
  }

  return { strength: 'weak', issues }
}

/**
 * Extract code snippet with context
 */
function extractSnippet(html: string, match: string, contextLength: number = 100): string {
  const index = html.indexOf(match)
  if (index === -1) return match

  const start = Math.max(0, index - contextLength)
  const end = Math.min(html.length, index + match.length + contextLength)

  let snippet = html.substring(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < html.length) snippet = snippet + '...'

  return snippet.replace(/\s+/g, ' ').trim()
}

// Helper: Format CSP policy for readable evidence
function formatCSPEvidence(cspHeader: string, maxLength: number = 200): string {
  if (!cspHeader || cspHeader.length === 0) {
    return 'No CSP header present'
  }

  // If CSP is short enough, return as-is
  if (cspHeader.length <= maxLength) {
    return cspHeader
  }

  // Split into directives and show first few
  const directives = cspHeader.split(';').map(d => d.trim()).filter(Boolean)

  if (directives.length === 0) {
    return cspHeader.substring(0, maxLength) + '...'
  }

  // Show first 3-4 directives and count remaining
  const previewCount = 3
  const preview = directives.slice(0, previewCount).join('; ')
  const remaining = directives.length - previewCount

  if (remaining > 0) {
    return `${preview}; ... (${remaining} more directives)`
  }

  return preview
}

export async function analyzeLLM02InsecureOutput(
  html: string,
  responseHeaders: Record<string, string> = {}
): Promise<InsecureOutputResult> {
  const findings: InsecureOutputFinding[] = []
  let hasDangerousDOM = false
  let hasUnsafeMarkdown = false
  let hasEvalUsage = false
  const sanitizationLibraries: string[] = []

  // 1. Analyze CSP strength
  const cspHeader = responseHeaders['content-security-policy'] || responseHeaders['Content-Security-Policy'] || ''
  const cspAnalysis = analyzeCSPStrength(cspHeader)
  const cspStrength = cspAnalysis.strength

  // Report CSP weakness if relevant
  if (cspStrength === 'none' || cspStrength === 'very-weak' || cspStrength === 'weak') {
    findings.push({
      type: 'csp-weakness',
      severity: cspStrength === 'none' ? 'high' : 'medium',
      title: `Content Security Policy: ${cspStrength === 'none' ? 'Missing' : 'Weak'}`,
      description: cspStrength === 'none'
        ? 'No Content-Security-Policy header detected. This leaves the application vulnerable to XSS attacks.'
        : `Weak Content-Security-Policy detected. Issues: ${cspAnalysis.issues.join(', ')}`,
      evidence: formatCSPEvidence(cspHeader, 200),
      impact: 'Without strong CSP, XSS attacks through AI-generated content can execute malicious scripts, steal credentials, and compromise user sessions.',
      recommendation: cspStrength === 'none'
        ? "Implement a strong CSP with 'script-src: self' or nonce-based approach. Consider using 'strict-dynamic' for modern applications."
        : "Strengthen CSP by removing 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts. Consider 'strict-dynamic' and Trusted Types.",
      cspMitigation: false
    })
  }

  // 2. Detect sanitization libraries (positive signal)
  for (const lib of SANITIZATION_LIBRARIES) {
    const regex = new RegExp(lib, 'gi')
    if (regex.test(html)) {
      sanitizationLibraries.push(lib)
    }
  }

  const hasSanitization = sanitizationLibraries.length > 0

  // 3. Check for dangerous DOM manipulation
  for (const domPattern of DANGEROUS_DOM_PATTERNS) {
    const matches = html.matchAll(domPattern.pattern)

    for (const match of matches) {
      hasDangerousDOM = true
      const evidence = match[0]
      const snippet = extractSnippet(html, evidence)

      // Determine actual severity based on mitigations
      let actualSeverity: 'low' | 'medium' | 'high' | 'critical' = domPattern.severity
      const cspMitigates = cspStrength === 'strong' || cspStrength === 'very-strong'

      if (cspMitigates && hasSanitization) {
        // Both CSP and sanitization present - reduce severity significantly
        actualSeverity = domPattern.severity === 'critical' ? 'low' : 'low'
      } else if (cspMitigates) {
        // Only CSP mitigates
        actualSeverity = domPattern.severity === 'critical' ? 'medium' : 'low'
      } else if (hasSanitization) {
        // Only sanitization present
        actualSeverity = domPattern.severity === 'critical' ? 'medium' : 'low'
      }

      findings.push({
        type: 'dangerous-dom',
        severity: actualSeverity,
        title: `${domPattern.framework}: ${domPattern.description}`,
        description: `Detected ${domPattern.framework} pattern that renders dynamic content unsafely. ${cspMitigates ? 'Strong CSP provides mitigation. ' : ''}${hasSanitization ? 'Sanitization library detected. ' : ''}`,
        evidence,
        codeSnippet: snippet,
        impact: actualSeverity === 'critical' || actualSeverity === 'high'
          ? 'CRITICAL: If AI-generated content is rendered through this pattern without sanitization, attackers can inject malicious scripts through prompt injection, leading to XSS attacks, session hijacking, and data theft.'
          : 'LOW-MEDIUM: Pattern detected but mitigated by CSP or sanitization. Still review to ensure proper implementation.',
        recommendation: actualSeverity === 'critical' || actualSeverity === 'high'
          ? `Implement input sanitization using DOMPurify before rendering. Add strong CSP headers. For ${domPattern.framework === 'React' ? 'React, avoid dangerouslySetInnerHTML or sanitize content first.' : 'use textContent instead of innerHTML where possible.'}`
          : 'Continue using current mitigation (CSP/sanitization). Regularly audit and test to ensure protections remain effective.',
        cspMitigation: cspMitigates,
        sanitizationDetected: hasSanitization
      })
    }
  }

  // 4. Check for eval() and code execution
  for (const evalPattern of EVAL_PATTERNS) {
    const matches = html.matchAll(evalPattern.pattern)

    for (const match of matches) {
      hasEvalUsage = true
      const evidence = match[0]
      const snippet = extractSnippet(html, evidence)

      // CSP with 'unsafe-eval' check
      const cspBlocksEval = cspStrength !== 'none' && !cspHeader.includes("'unsafe-eval'")
      const actualSeverity = cspBlocksEval ? 'medium' : evalPattern.severity

      findings.push({
        type: 'eval-usage',
        severity: actualSeverity,
        title: `Code Execution: ${evalPattern.description}`,
        description: `Detected ${evalPattern.description}. ${cspBlocksEval ? 'CSP without unsafe-eval provides mitigation. ' : 'No CSP mitigation detected.'}`,
        evidence,
        codeSnippet: snippet,
        impact: actualSeverity === 'critical'
          ? 'CRITICAL: eval() or similar allows execution of arbitrary code. If AI-generated content reaches this function, attackers can execute any JavaScript code in the user\'s context.'
          : 'MEDIUM: Code execution pattern detected but CSP provides mitigation. Review implementation to ensure CSP is consistently applied.',
        recommendation: actualSeverity === 'critical'
          ? 'Remove eval() and similar functions entirely. Use safe alternatives like JSON.parse() for data, or Function constructors with validated input. Implement strong CSP without unsafe-eval.'
          : 'Continue CSP protection. Consider refactoring to eliminate eval-like patterns for defense in depth.',
        cspMitigation: cspBlocksEval
      })
    }
  }

  // 5. Check for unsafe markdown configurations
  for (const mdPattern of MARKDOWN_PATTERNS) {
    const matches = html.matchAll(mdPattern.pattern)

    for (const match of matches) {
      hasUnsafeMarkdown = true
      const evidence = match[0]
      const snippet = extractSnippet(html, evidence)

      // Markdown unsafe configs are concerning even with CSP
      const cspMitigates = cspStrength === 'strong' || cspStrength === 'very-strong'
      const actualSeverity = cspMitigates ? (mdPattern.severity === 'critical' ? 'high' : 'medium') : mdPattern.severity

      findings.push({
        type: 'markdown-unsafe',
        severity: actualSeverity,
        title: `Unsafe Markdown Configuration: ${mdPattern.library}`,
        description: `Detected ${mdPattern.library} with unsafe configuration: ${mdPattern.config}. This allows HTML in markdown, which can lead to XSS if rendering AI-generated markdown.`,
        evidence,
        codeSnippet: snippet,
        impact: 'AI models often generate markdown responses. With unsafe markdown configurations, attackers can inject malicious HTML/JavaScript through prompt injection, which will be executed when the markdown is rendered.',
        recommendation: `For ${mdPattern.library}, enable sanitization. ${mdPattern.library === 'marked.js' ? 'Set sanitize: true or use DOMPurify after rendering.' : mdPattern.library === 'react-markdown' ? 'Set skipHtml={true} or use rehype-sanitize plugin.' : 'Enable HTML sanitization in library options.'} Always sanitize AI-generated markdown before rendering.`,
        cspMitigation: cspMitigates
      })
    }
  }

  // 6. Create combined risk assessment
  if ((hasDangerousDOM || hasUnsafeMarkdown || hasEvalUsage) && cspStrength === 'none') {
    findings.push({
      type: 'combined-risk',
      severity: 'critical',
      title: 'CRITICAL: Multiple XSS Vectors Without CSP Protection',
      description: `Found ${findings.filter(f => f.type === 'dangerous-dom').length} dangerous DOM patterns, ${findings.filter(f => f.type === 'markdown-unsafe').length} unsafe markdown configs, and ${findings.filter(f => f.type === 'eval-usage').length} eval usages with NO Content Security Policy protection.`,
      evidence: `CSP: ${cspStrength}, Dangerous patterns: ${hasDangerousDOM}, Unsafe markdown: ${hasUnsafeMarkdown}, Eval usage: ${hasEvalUsage}`,
      impact: 'CRITICAL COMBINED RISK: Multiple XSS attack vectors exist without CSP mitigation. AI-generated content can be exploited to inject and execute malicious scripts. This is a severe security vulnerability in AI applications.',
      recommendation: 'URGENT: 1) Implement strong Content-Security-Policy immediately. 2) Add input sanitization with DOMPurify for all AI-generated content. 3) Remove or secure all dangerous DOM patterns. 4) Enable sanitization in markdown libraries. 5) Eliminate eval() usage.',
      cspMitigation: false
    })
  }

  // Determine overall risk
  let overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length
  const mediumCount = findings.filter(f => f.severity === 'medium').length

  if (criticalCount > 0) {
    overallRisk = 'critical'
  } else if (highCount >= 2) {
    overallRisk = 'high'
  } else if (highCount === 1) {
    overallRisk = 'high'
  } else if (mediumCount > 0) {
    overallRisk = 'medium'
  } else if (findings.length > 0) {
    overallRisk = 'low'
  }

  return {
    findings,
    hasDangerousDOM,
    hasUnsafeMarkdown,
    hasEvalUsage,
    cspStrength,
    sanitizationLibraries,
    overallRisk
  }
}

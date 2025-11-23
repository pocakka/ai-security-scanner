/**
 * OWASP LLM08: Excessive Agency Analyzer
 *
 * Detects AI agents with excessive permissions or autonomy that could be exploited
 * through prompt injection to perform unauthorized actions without human oversight.
 *
 * Detection Strategy (Passive Only):
 * 1. Dangerous Function Detection - Shell, file system, database operations
 * 2. Sandbox Analysis - VM isolation, permission systems, rate limiting
 * 3. Auto-Execute Detection - Tools run without human approval
 * 4. Privilege Escalation - User context ignored, admin access unrestricted
 *
 * OWASP Priority: MEDIUM (Weight: 12/100)
 */

export interface ExcessiveAgencyFinding {
  type: 'no-approval' | 'no-sandbox' | 'privilege-escalation' | 'auto-execute' | 'missing-controls'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence: string
  mitigations?: string[]
  impact: string
  recommendation: string
}

export interface ExcessiveAgencyResult {
  findings: ExcessiveAgencyFinding[]
  hasAutoExecute: boolean
  hasSandbox: boolean
  hasApproval: boolean
  hasLogging: boolean
  hasRateLimiting: boolean
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Analyze HTML for excessive agency vulnerabilities
 */
export async function analyzeLLM08ExcessiveAgency(
  html: string,
  responseHeaders: Record<string, string>
): Promise<ExcessiveAgencyResult> {
  const findings: ExcessiveAgencyFinding[] = []

  let hasAutoExecute = false
  let hasSandbox = false
  let hasApproval = false
  let hasLogging = false
  let hasRateLimiting = false

  // Step 1: Detect dangerous functions without controls
  const dangerousFunctions = detectDangerousFunctions(html)

  // Step 2: Detect protective mechanisms
  hasSandbox = detectSandbox(html)
  hasApproval = detectApproval(html)
  hasLogging = detectLogging(html)
  hasRateLimiting = detectRateLimiting(html)

  // Step 3: Detect auto-execute patterns
  const autoExecutePatterns = detectAutoExecute(html)
  if (autoExecutePatterns.length > 0) {
    hasAutoExecute = true

    for (const pattern of autoExecutePatterns) {
      findings.push({
        type: 'auto-execute',
        severity: 'high',
        title: 'Auto-Execute Configuration Detected',
        description: pattern.description,
        evidence: pattern.evidence,
        impact: 'AI agents configured to auto-execute tools without human approval can be manipulated through prompt injection to perform unauthorized actions. Attackers can leverage this to execute malicious commands, modify data, or escalate privileges without oversight.',
        recommendation: 'Disable auto-execute mode. Implement human-in-the-loop approval for all tool executions, especially for write operations, code execution, and system commands. Add confirmation prompts before executing sensitive actions.',
      })
    }
  }

  // Step 4: Analyze each dangerous function for missing controls
  for (const func of dangerousFunctions) {
    const missingControls: string[] = []
    const existingControls: string[] = []

    if (!hasSandbox) missingControls.push('Sandboxing')
    else existingControls.push('Sandboxing')

    if (!hasApproval) missingControls.push('Human Approval')
    else existingControls.push('Human Approval')

    if (!hasLogging) missingControls.push('Audit Logging')
    else existingControls.push('Audit Logging')

    if (!hasRateLimiting) missingControls.push('Rate Limiting')
    else existingControls.push('Rate Limiting')

    // Calculate severity based on missing controls
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (missingControls.length === 4) {
      severity = 'critical' // No controls at all
    } else if (missingControls.length === 3) {
      severity = 'high'
    } else if (missingControls.length === 2) {
      severity = 'medium'
    } else if (missingControls.length === 1) {
      severity = 'low'
    }

    // Only report if controls are missing
    if (missingControls.length > 0) {
      findings.push({
        type: 'missing-controls',
        severity,
        title: `Dangerous Function "${func.name}" Without Adequate Controls`,
        description: `Function "${func.name}" (${func.category}) has insufficient security controls. Missing: ${missingControls.join(', ')}. ${existingControls.length > 0 ? `Present: ${existingControls.join(', ')}.` : ''}`,
        evidence: func.evidence,
        mitigations: existingControls,
        impact: `Without proper controls, AI agents can be manipulated to execute "${func.name}" maliciously. ${
          severity === 'critical'
            ? 'CRITICAL: No security controls detected - this function is completely exposed to prompt injection attacks.'
            : severity === 'high'
            ? 'HIGH RISK: Minimal security controls - exploitation is likely.'
            : 'Security controls are insufficient for this sensitive operation.'
        }`,
        recommendation: `Add missing controls: ${missingControls.map(c => {
          if (c === 'Sandboxing') return 'Implement VM/container isolation (Docker, Firecracker, gVisor)'
          if (c === 'Human Approval') return 'Require explicit user confirmation before execution'
          if (c === 'Audit Logging') return 'Log all executions with user, timestamp, parameters, and results'
          if (c === 'Rate Limiting') return 'Implement rate limits to prevent abuse (e.g., 10 calls/minute)'
          return c
        }).join('; ')}.`,
      })
    }
  }

  // Step 5: Detect privilege escalation patterns
  const privilegeEscalation = detectPrivilegeEscalation(html)
  for (const pattern of privilegeEscalation) {
    findings.push({
      type: 'privilege-escalation',
      severity: 'critical',
      title: 'Privilege Escalation Vulnerability Detected',
      description: pattern.description,
      evidence: pattern.evidence,
      impact: 'AI agents that ignore user context or bypass permission checks can be exploited to perform admin-level actions on behalf of low-privilege users. This enables unauthorized access to sensitive data, system configuration changes, or complete system compromise.',
      recommendation: 'Implement strict role-based access control (RBAC). Always check user permissions before tool execution. Never grant AI agents admin privileges by default. Use principle of least privilege. Add multi-factor authentication for sensitive operations.',
    })
  }

  // Step 6: Detect tool execution without safeguards
  const unsafeExecution = detectUnsafeExecution(html)
  for (const pattern of unsafeExecution) {
    findings.push({
      type: 'no-approval',
      severity: 'high',
      title: 'Tool Execution Without Approval Mechanism',
      description: pattern.description,
      evidence: pattern.evidence,
      impact: 'Tools that execute immediately without user confirmation can be triggered by prompt injection attacks. This bypasses user intent and enables automated exploitation of AI agent capabilities.',
      recommendation: 'Implement confirmation prompts for all tool executions. Display tool name, parameters, and potential impact before execution. Allow users to approve/deny each action. Consider implementing "pause for approval" mode for sensitive operations.',
    })
  }

  // Calculate overall risk
  const overallRisk = calculateOverallRisk(
    findings,
    hasAutoExecute,
    hasSandbox,
    hasApproval,
    hasLogging
  )

  return {
    findings,
    hasAutoExecute,
    hasSandbox,
    hasApproval,
    hasLogging,
    hasRateLimiting,
    overallRisk,
  }
}

/**
 * Detect dangerous functions in code
 */
function detectDangerousFunctions(html: string): Array<{
  name: string
  category: string
  evidence: string
}> {
  const functions: Array<{ name: string; category: string; evidence: string }> = []

  const dangerousPatterns = [
    // Shell/code execution
    { pattern: /\b(executeShell|runShell|exec|spawn|child_process)\s*\(/gi, category: 'Code Execution' },
    { pattern: /\b(runPython|executePython|eval|compile)\s*\(/gi, category: 'Code Execution' },

    // File system operations
    { pattern: /\b(writeFile|fs\.write|createFile|deleteFile|unlink|rm)\s*\(/gi, category: 'File System' },

    // Database operations
    { pattern: /\b(executeSQL|dropTable|truncate|deleteRecord|db\.exec)\s*\(/gi, category: 'Database' },

    // HTTP requests (unlimited)
    { pattern: /\b(makeRequest|fetch|axios|http\.request)\s*\([^)]*(?:user|input|prompt)/gi, category: 'Network' },
  ]

  for (const { pattern, category } of dangerousPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const name = match[1]
      const snippetStart = Math.max(0, match.index - 50)
      const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
      const evidence = html.slice(snippetStart, snippetEnd)

      functions.push({ name, category, evidence })
    }
  }

  return functions
}

/**
 * Detect sandbox mechanisms
 */
function detectSandbox(html: string): boolean {
  const sandboxPatterns = [
    /sandbox|vm\.run|docker|container|isolated|chroot|jail/gi,
    /new\s+VM\(/gi,
    /worker_threads|WebWorker/gi,
  ]

  return sandboxPatterns.some(pattern => pattern.test(html))
}

/**
 * Detect approval mechanisms
 */
function detectApproval(html: string): boolean {
  const approvalPatterns = [
    /requireApproval|getUserConfirmation|confirm\s*\(/gi,
    /await.*approval|human.*loop|manual.*review/gi,
    /\.confirm\(|window\.confirm/gi,
  ]

  return approvalPatterns.some(pattern => pattern.test(html))
}

/**
 * Detect logging mechanisms
 */
function detectLogging(html: string): boolean {
  const loggingPatterns = [
    /auditLog|logger|log\.info|log\.warn|log\.error/gi,
    /\.log\(.*tool|\.log\(.*execute|\.log\(.*action/gi,
  ]

  return loggingPatterns.some(pattern => pattern.test(html))
}

/**
 * Detect rate limiting
 */
function detectRateLimiting(html: string): boolean {
  const rateLimitPatterns = [
    /rateLimit|throttle|debounce|maxCalls|callsPerMinute/gi,
    /Bottleneck|RateLimiter/gi,
  ]

  return rateLimitPatterns.some(pattern => pattern.test(html))
}

/**
 * Detect auto-execute configuration
 */
function detectAutoExecute(html: string): Array<{
  description: string
  evidence: string
}> {
  const patterns: Array<{ description: string; evidence: string }> = []

  // Pattern 1: Auto-execute flags
  const autoExecutePattern = /(?:autoExecute|auto_execute|executeImmediately)\s*:\s*true/gi
  let match
  while ((match = autoExecutePattern.exec(html)) !== null) {
    const snippetStart = Math.max(0, match.index - 100)
    const snippetEnd = Math.min(html.length, match.index + match[0].length + 100)
    const evidence = html.slice(snippetStart, snippetEnd)

    patterns.push({
      description: 'Configuration explicitly enables auto-execution of AI tools without human approval',
      evidence,
    })
  }

  // Pattern 2: Disabled approval flags
  const noApprovalPattern = /(?:requireApproval|require_approval)\s*:\s*false/gi
  while ((match = noApprovalPattern.exec(html)) !== null) {
    const snippetStart = Math.max(0, match.index - 100)
    const snippetEnd = Math.min(html.length, match.index + match[0].length + 100)
    const evidence = html.slice(snippetStart, snippetEnd)

    patterns.push({
      description: 'Configuration disables approval requirements for tool execution',
      evidence,
    })
  }

  return patterns
}

/**
 * Detect privilege escalation patterns
 */
function detectPrivilegeEscalation(html: string): Array<{
  description: string
  evidence: string
}> {
  const patterns: Array<{ description: string; evidence: string }> = []

  // Pattern 1: Always returns true for permission checks
  const alwaysTruePattern = /function\s+\w*(?:canExecute|hasPermission|isAuthorized)\w*\s*\([^)]*\)\s*\{\s*return\s+true/gi
  let match
  while ((match = alwaysTruePattern.exec(html)) !== null) {
    const snippetStart = Math.max(0, match.index - 50)
    const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
    const evidence = html.slice(snippetStart, snippetEnd)

    patterns.push({
      description: 'Permission check function always returns true, bypassing authorization',
      evidence,
    })
  }

  // Pattern 2: Ignores user context
  const noUserCheckPattern = /function\s+\w*execute\w*\s*\([^)]*tool[^)]*\)\s*\{(?![\s\S]{0,200}user)[\s\S]{50,200}\}/gi
  while ((match = noUserCheckPattern.exec(html)) !== null) {
    // Check if 'user' appears in the function body
    const funcBody = match[0]
    if (!/\buser\b/i.test(funcBody)) {
      const snippetStart = Math.max(0, match.index - 50)
      const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
      const evidence = html.slice(snippetStart, snippetEnd)

      patterns.push({
        description: 'Tool execution function does not check user context or permissions',
        evidence,
      })
    }
  }

  return patterns
}

/**
 * Detect unsafe execution patterns
 */
function detectUnsafeExecution(html: string): Array<{
  description: string
  evidence: string
}> {
  const patterns: Array<{ description: string; evidence: string }> = []

  // Pattern: Direct tool execution without checks
  const directExecPattern = /(?:return|await)\s+tools?\[[^\]]+\]\([^)]*\)/gi
  let match
  while ((match = directExecPattern.exec(html)) !== null) {
    // Check if there's no confirmation in surrounding context
    const contextStart = Math.max(0, match.index - 200)
    const contextEnd = Math.min(html.length, match.index + match[0].length + 200)
    const context = html.slice(contextStart, contextEnd)

    if (!/confirm|approval|check|validate|authorize/i.test(context)) {
      patterns.push({
        description: 'Direct tool execution without validation, approval, or permission checks',
        evidence: match[0],
      })
    }
  }

  return patterns
}

/**
 * Calculate overall risk
 */
function calculateOverallRisk(
  findings: ExcessiveAgencyFinding[],
  hasAutoExecute: boolean,
  hasSandbox: boolean,
  hasApproval: boolean,
  hasLogging: boolean
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (findings.length === 0) {
    return 'none'
  }

  // Critical: Auto-execute + No sandbox + No approval
  if (hasAutoExecute && !hasSandbox && !hasApproval) {
    return 'critical'
  }

  // Critical: Privilege escalation detected
  const hasPrivEsc = findings.some(f => f.type === 'privilege-escalation')
  if (hasPrivEsc) {
    return 'critical'
  }

  // High: Multiple critical findings or missing all controls
  const criticalCount = findings.filter(f => f.severity === 'critical').length
  if (criticalCount > 0) {
    return 'critical'
  }

  const highCount = findings.filter(f => f.severity === 'high').length
  if (highCount >= 2 || (highCount >= 1 && !hasSandbox && !hasApproval)) {
    return 'high'
  }

  if (highCount >= 1) {
    return 'high'
  }

  const mediumCount = findings.filter(f => f.severity === 'medium').length
  if (mediumCount >= 3) {
    return 'high'
  }

  if (mediumCount > 0) {
    return 'medium'
  }

  return 'low'
}

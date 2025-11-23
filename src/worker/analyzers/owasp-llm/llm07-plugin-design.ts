/**
 * OWASP LLM07: Insecure Plugin Design Analyzer
 *
 * Detects vulnerable AI plugin/tool definitions that grant excessive permissions
 * or enable dangerous operations (code execution, file system access, etc.)
 *
 * Detection Strategy (Passive Only):
 * 1. Tool Definition Detection - OpenAI, LangChain, custom tool schemas
 * 2. Risk Categorization - CRITICAL/HIGH/MEDIUM/LOW based on capability
 * 3. Plugin Architecture Analysis - Variable names, object structures
 * 4. Dangerous Function Detection - eval, exec, shell, file system access
 *
 * OWASP Priority: HIGH (Weight: 15/100)
 */

export interface PluginDesignFinding {
  type: 'critical-tool' | 'high-risk-tool' | 'medium-risk-tool' | 'insecure-definition'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence: string
  toolName?: string
  riskCategory?: string
  impact: string
  recommendation: string
}

export interface PluginDesignResult {
  findings: PluginDesignFinding[]
  hasCriticalTools: boolean
  hasHighRiskTools: boolean
  detectedTools: string[]
  toolArchitectures: string[]
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

// Risk categorization
const CRITICAL_TOOLS = [
  'execute', 'eval', 'exec', 'shell', 'command', 'run_python', 'run_code',
  'compile', 'spawn', 'child_process', 'subprocess', 'system', 'os_command',
  'bash', 'powershell', 'cmd', 'run_script', 'execute_code'
]

const HIGH_RISK_TOOLS = [
  'write', 'delete', 'remove', 'unlink', 'rm', 'fs_write', 'file_write',
  'create_file', 'modify', 'update_database', 'insert', 'drop', 'truncate',
  'alter_table', 'create_table', 'chmod', 'chown', 'sudo'
]

const MEDIUM_RISK_TOOLS = [
  'read_file', 'query', 'fetch', 'http_request', 'api_call', 'get_data',
  'select', 'find', 'search_database', 'list_files', 'read_database'
]

/**
 * Analyze HTML for insecure plugin/tool definitions
 */
export async function analyzeLLM07PluginDesign(
  html: string,
  responseHeaders: Record<string, string>
): Promise<PluginDesignResult> {
  const findings: PluginDesignFinding[] = []

  let hasCriticalTools = false
  let hasHighRiskTools = false
  const detectedTools: string[] = []
  const toolArchitectures: string[] = []

  // Step 1: Detect OpenAI Function Calling format
  const openAITools = detectOpenAIFunctionCalling(html)
  for (const tool of openAITools) {
    detectedTools.push(tool.name)

    if (!toolArchitectures.includes('OpenAI Function Calling')) {
      toolArchitectures.push('OpenAI Function Calling')
    }

    const riskLevel = categorizeTool(tool.name)

    if (riskLevel === 'critical') {
      hasCriticalTools = true

      findings.push({
        type: 'critical-tool',
        severity: 'critical',
        title: `CRITICAL: Code Execution Tool Definition "${tool.name}"`,
        description: `Detected OpenAI Function Calling tool "${tool.name}" that enables code execution or system command access. This allows the AI to execute arbitrary code, posing extreme security risk.`,
        evidence: tool.evidence,
        toolName: tool.name,
        riskCategory: 'Code Execution',
        impact: 'An attacker manipulating the AI through prompt injection could execute arbitrary code on your servers, access sensitive files, steal credentials, or compromise the entire system. This is a critical remote code execution (RCE) vulnerability.',
        recommendation: 'IMMEDIATE ACTION REQUIRED: Remove code execution tools from AI agents. If absolutely necessary, implement strict sandboxing (containers, VMs), input validation, output sanitization, and human approval for all code execution requests. Consider using read-only tools only.',
      })
    } else if (riskLevel === 'high') {
      hasHighRiskTools = true

      findings.push({
        type: 'high-risk-tool',
        severity: 'high',
        title: `HIGH RISK: Dangerous Tool Definition "${tool.name}"`,
        description: `Detected OpenAI Function Calling tool "${tool.name}" with file system write or database modification capabilities. This enables data manipulation and potential system compromise.`,
        evidence: tool.evidence,
        toolName: tool.name,
        riskCategory: 'Data Manipulation',
        impact: 'AI agents with write access can be manipulated through prompt injection to delete files, modify databases, or corrupt data. This can lead to data loss, unauthorized changes, or system instability.',
        recommendation: 'Implement strict authorization controls. Require human approval for write operations. Use least-privilege principles. Add audit logging for all tool executions. Consider making tools read-only where possible.',
      })
    } else if (riskLevel === 'medium') {
      findings.push({
        type: 'medium-risk-tool',
        severity: 'medium',
        title: `Tool Definition with Data Access: "${tool.name}"`,
        description: `Detected OpenAI Function Calling tool "${tool.name}" with read access to files or databases. While less severe than write access, this still poses privacy risks.`,
        evidence: tool.evidence,
        toolName: tool.name,
        riskCategory: 'Data Access',
        impact: 'AI agents with read access can be manipulated to expose sensitive data through prompt injection. Attackers could extract confidential information, API keys, or user data.',
        recommendation: 'Implement data filtering and redaction. Use role-based access control (RBAC). Add rate limiting. Log all data access attempts for audit purposes.',
      })
    }
  }

  // Step 2: Detect LangChain tools
  const langchainTools = detectLangChainTools(html)
  for (const tool of langchainTools) {
    detectedTools.push(tool.name)

    if (!toolArchitectures.includes('LangChain')) {
      toolArchitectures.push('LangChain')
    }

    const riskLevel = categorizeTool(tool.name)

    if (riskLevel === 'critical') {
      hasCriticalTools = true

      findings.push({
        type: 'critical-tool',
        severity: 'critical',
        title: `CRITICAL: LangChain "${tool.name}" Tool Detected`,
        description: `Detected LangChain tool "${tool.name}" with code execution capabilities. LangChain's ShellTool, PythonREPLTool, and similar tools enable arbitrary code execution.`,
        evidence: tool.evidence,
        toolName: tool.name,
        riskCategory: 'Code Execution',
        impact: 'LangChain tools like ShellTool provide direct shell access. Prompt injection attacks can leverage these tools to execute malicious commands, steal credentials, or compromise the entire server infrastructure.',
        recommendation: 'CRITICAL: Remove ShellTool, PythonREPLTool, and BashTool from LangChain agents. Use custom tools with strict input validation. Implement sandboxing (Docker, VMs). Require human-in-the-loop approval for all actions.',
      })
    }
  }

  // Step 3: Detect custom tool definitions
  const customTools = detectCustomTools(html)
  for (const tool of customTools) {
    detectedTools.push(tool.name)

    if (!toolArchitectures.includes('Custom')) {
      toolArchitectures.push('Custom')
    }

    const riskLevel = categorizeTool(tool.name)

    if (riskLevel === 'critical' || riskLevel === 'high') {
      const severity = riskLevel === 'critical' ? 'critical' : 'high'

      if (riskLevel === 'critical') hasCriticalTools = true
      if (riskLevel === 'high') hasHighRiskTools = true

      findings.push({
        type: riskLevel === 'critical' ? 'critical-tool' : 'high-risk-tool',
        severity,
        title: `${riskLevel.toUpperCase()}: Custom Tool "${tool.name}" with Dangerous Capabilities`,
        description: `Detected custom tool definition "${tool.name}" that implements ${riskLevel} operations. The tool appears to have direct access to sensitive system functions.`,
        evidence: tool.evidence,
        toolName: tool.name,
        riskCategory: tool.category,
        impact: `Custom tools with ${riskLevel} capabilities can be exploited through prompt injection to perform unauthorized operations. This includes potential system compromise, data theft, or service disruption.`,
        recommendation: `Review tool implementation for security vulnerabilities. Add input validation, output sanitization, and access controls. Implement audit logging. Consider refactoring to reduce privileges.`,
      })
    }
  }

  // Step 4: Detect insecure tool definition patterns
  const insecurePatterns = detectInsecurePatterns(html)
  for (const pattern of insecurePatterns) {
    findings.push({
      type: 'insecure-definition',
      severity: 'high',
      title: 'Insecure Tool Definition Pattern Detected',
      description: pattern.description,
      evidence: pattern.evidence,
      impact: 'Insecure tool definition patterns can lead to injection vulnerabilities, privilege escalation, or unintended tool behavior. These patterns make it easier for attackers to exploit the AI system.',
      recommendation: 'Follow secure tool definition best practices: validate all inputs, sanitize outputs, use type checking, implement proper error handling, and document security assumptions.',
    })
  }

  // Calculate overall risk
  const overallRisk = calculateOverallRisk(findings, hasCriticalTools, hasHighRiskTools)

  return {
    findings,
    hasCriticalTools,
    hasHighRiskTools,
    detectedTools,
    toolArchitectures,
    overallRisk,
  }
}

/**
 * Detect OpenAI Function Calling tool definitions
 */
function detectOpenAIFunctionCalling(html: string): Array<{
  name: string
  evidence: string
}> {
  const tools: Array<{ name: string; evidence: string }> = []

  // Pattern: OpenAI function calling structure
  const functionPattern = /\{\s*type\s*:\s*["']function["']\s*,\s*function\s*:\s*\{[^}]*name\s*:\s*["']([^"']+)["'][^}]*\}/gi

  let match
  while ((match = functionPattern.exec(html)) !== null) {
    const name = match[1]
    const snippetStart = Math.max(0, match.index - 50)
    const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
    const evidence = html.slice(snippetStart, snippetEnd)

    tools.push({ name, evidence })
  }

  return tools
}

/**
 * Detect LangChain tool usage
 */
function detectLangChainTools(html: string): Array<{
  name: string
  evidence: string
}> {
  const tools: Array<{ name: string; evidence: string }> = []

  // LangChain tool patterns
  const langchainPatterns = [
    /ShellTool\(\)/gi,
    /PythonREPLTool\(\)/gi,
    /BashTool\(\)/gi,
    /from\s+langchain\.tools\s+import\s+(\w+Tool)/gi,
  ]

  for (const pattern of langchainPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const name = match[1] || match[0]
      const snippetStart = Math.max(0, match.index - 50)
      const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
      const evidence = html.slice(snippetStart, snippetEnd)

      tools.push({ name, evidence })
    }
  }

  return tools
}

/**
 * Detect custom tool definitions
 */
function detectCustomTools(html: string): Array<{
  name: string
  evidence: string
  category: string
}> {
  const tools: Array<{ name: string; evidence: string; category: string }> = []

  // Custom tool object patterns
  const toolObjectPattern = /(?:const|let|var)\s+(tools|availableTools|functions|plugins)\s*=\s*\{([^}]{100,1500})\}/gi

  let match
  while ((match = toolObjectPattern.exec(html)) !== null) {
    const objectContent = match[2]

    // Extract function names from object
    const functionPattern = /(\w+)\s*:\s*(?:async\s+)?\(?/g
    let funcMatch
    while ((funcMatch = functionPattern.exec(objectContent)) !== null) {
      const toolName = funcMatch[1]

      // Check if it contains dangerous operations
      const containsEval = /eval|exec|spawn|child_process/i.test(objectContent)
      const containsFS = /fs\.|writeFile|readFile|unlink/i.test(objectContent)
      const containsDB = /query|execute|drop|truncate/i.test(objectContent)

      const category = containsEval
        ? 'Code Execution'
        : containsFS
        ? 'File System'
        : containsDB
        ? 'Database'
        : 'Unknown'

      const snippetStart = Math.max(0, match.index - 50)
      const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
      const evidence = html.slice(snippetStart, snippetEnd)

      tools.push({ name: toolName, evidence, category })
    }
  }

  return tools
}

/**
 * Detect insecure tool definition patterns
 */
function detectInsecurePatterns(html: string): Array<{
  description: string
  evidence: string
}> {
  const patterns: Array<{ description: string; evidence: string }> = []

  // Pattern 1: Direct eval in tool
  const evalPattern = /(?:const|let|var)\s+\w+\s*=\s*\([^)]*\)\s*=>\s*eval\([^)]+\)/gi
  let match
  while ((match = evalPattern.exec(html)) !== null) {
    const snippetStart = Math.max(0, match.index - 50)
    const snippetEnd = Math.min(html.length, match.index + match[0].length + 50)
    const evidence = html.slice(snippetStart, snippetEnd)

    patterns.push({
      description: 'Tool function directly uses eval() on user input without validation',
      evidence,
    })
  }

  // Pattern 2: Unsanitized template execution
  const templatePattern = /\$\{[^}]*(?:userInput|input|query|prompt)[^}]*\}/gi
  const dangerousContext = /(eval|exec|spawn|child_process)/i

  while ((match = templatePattern.exec(html)) !== null) {
    const contextStart = Math.max(0, match.index - 100)
    const contextEnd = Math.min(html.length, match.index + 100)
    const context = html.slice(contextStart, contextEnd)

    if (dangerousContext.test(context)) {
      patterns.push({
        description: 'User input embedded in dangerous function call via template literal',
        evidence: context,
      })
    }
  }

  return patterns
}

/**
 * Categorize tool risk level
 */
function categorizeTool(toolName: string): 'critical' | 'high' | 'medium' | 'low' {
  const lowerName = toolName.toLowerCase()

  // Check critical
  if (CRITICAL_TOOLS.some(keyword => lowerName.includes(keyword))) {
    return 'critical'
  }

  // Check high risk
  if (HIGH_RISK_TOOLS.some(keyword => lowerName.includes(keyword))) {
    return 'high'
  }

  // Check medium risk
  if (MEDIUM_RISK_TOOLS.some(keyword => lowerName.includes(keyword))) {
    return 'medium'
  }

  return 'low'
}

/**
 * Calculate overall risk
 */
function calculateOverallRisk(
  findings: PluginDesignFinding[],
  hasCriticalTools: boolean,
  hasHighRiskTools: boolean
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (findings.length === 0) {
    return 'none'
  }

  if (hasCriticalTools) {
    return 'critical'
  }

  if (hasHighRiskTools) {
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

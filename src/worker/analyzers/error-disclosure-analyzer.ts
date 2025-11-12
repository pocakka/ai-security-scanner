/**
 * Error Disclosure Analyzer
 *
 * Detects information disclosure through error messages, stack traces, and debug output.
 * This is a critical security issue (OWASP A05:2021 - Security Misconfiguration).
 *
 * Fully passive - analyzes only the HTML content returned by the server.
 */

export interface ErrorDisclosureFinding {
  type: 'stack-trace' | 'database-error' | 'debug-mode' | 'file-path' | 'exception' | 'warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence: string
  framework?: string
  location?: string
  impact: string
  recommendation: string
}

export interface ErrorDisclosureResult {
  findings: ErrorDisclosureFinding[]
  hasStackTraces: boolean
  hasDatabaseErrors: boolean
  hasDebugMode: boolean
  hasFilePathDisclosure: boolean
  detectedFrameworks: string[]
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

// Stack trace patterns by framework
const STACK_TRACE_PATTERNS = [
  // Java/Spring Boot
  {
    pattern: /at\s+(org\.springframework|com\.sun|java\.lang|javax\.|org\.apache)\.[^\s]+/gi,
    framework: 'Java/Spring Boot',
    severity: 'high' as const,
  },
  {
    pattern: /java\.(lang|io|util)\.\w+Exception:/gi,
    framework: 'Java',
    severity: 'high' as const,
  },

  // Python/Django/Flask
  {
    pattern: /Traceback\s*\(most recent call last\):/gi,
    framework: 'Python',
    severity: 'high' as const,
  },
  {
    pattern: /File\s+"\/[^"]+\.py",\s+line\s+\d+/gi,
    framework: 'Python',
    severity: 'high' as const,
  },
  {
    pattern: /django\.(core|db|views)\.\w+/gi,
    framework: 'Django',
    severity: 'high' as const,
  },

  // PHP
  {
    pattern: /(Fatal error|Warning|Notice|Parse error):\s+[^\n]+\s+in\s+\/[^\s]+\s+on line\s+\d+/gi,
    framework: 'PHP',
    severity: 'critical' as const,
  },
  {
    pattern: /Call Stack:[\s\S]*?#\d+\s+\/[^\s]+/gi,
    framework: 'PHP',
    severity: 'high' as const,
  },

  // Node.js/Express
  {
    pattern: /Error:\s+[^\n]+\n\s+at\s+(Function|Module|Object)\.[^\s]+/gi,
    framework: 'Node.js',
    severity: 'high' as const,
  },
  {
    pattern: /at\s+[^\s]+\s+\([^\)]*\.js:\d+:\d+\)/gi,
    framework: 'Node.js/JavaScript',
    severity: 'high' as const,
  },

  // .NET/ASP.NET
  {
    pattern: /System\.(Exception|NullReferenceException|ArgumentException):/gi,
    framework: '.NET',
    severity: 'high' as const,
  },
  {
    pattern: /at\s+Microsoft\.[^\s]+/gi,
    framework: 'ASP.NET',
    severity: 'high' as const,
  },
  {
    pattern: /Server Error in '\/[^']*' Application/gi,
    framework: 'ASP.NET',
    severity: 'critical' as const,
  },

  // Ruby/Rails
  {
    pattern: /(RuntimeError|StandardError|ArgumentError):[\s\S]*?from\s+\/[^\s]+\.rb:\d+/gi,
    framework: 'Ruby/Rails',
    severity: 'high' as const,
  },
]

// Database error patterns
const DATABASE_ERROR_PATTERNS = [
  // SQL Syntax Errors
  {
    pattern: /You have an error in your SQL syntax/gi,
    type: 'MySQL Syntax Error',
    severity: 'critical' as const,
  },
  {
    pattern: /mysql_(connect|query|fetch|error)/gi,
    type: 'MySQL Function Exposure',
    severity: 'high' as const,
  },
  {
    pattern: /PostgreSQL.*?ERROR:/gi,
    type: 'PostgreSQL Error',
    severity: 'high' as const,
  },
  {
    pattern: /ORA-\d+:/gi,
    type: 'Oracle Database Error',
    severity: 'high' as const,
  },
  {
    pattern: /SQLSTATE\[\w+\]:/gi,
    type: 'SQL State Error',
    severity: 'high' as const,
  },
  {
    pattern: /Microsoft SQL Server.*?error/gi,
    type: 'SQL Server Error',
    severity: 'high' as const,
  },

  // SQL Query Exposure
  {
    pattern: /(SELECT|INSERT INTO|UPDATE|DELETE FROM)\s+[^<>]+\s+(FROM|WHERE|SET)/gi,
    type: 'SQL Query Disclosure',
    severity: 'critical' as const,
  },

  // Connection Strings
  {
    pattern: /(Server|Data Source|Initial Catalog|User ID|Password)\s*=\s*[^;]+/gi,
    type: 'Database Connection String',
    severity: 'critical' as const,
  },
  {
    pattern: /(mongodb|postgres|mysql):\/\/[^\s<>"]+/gi,
    type: 'Database URI Disclosure',
    severity: 'critical' as const,
  },
]

// Debug mode indicators
const DEBUG_MODE_PATTERNS = [
  {
    pattern: /DEBUG\s*=\s*True/gi,
    framework: 'Django',
    severity: 'medium' as const,
  },
  {
    pattern: /APP_DEBUG\s*=\s*true/gi,
    framework: 'Laravel',
    severity: 'medium' as const,
  },
  {
    pattern: /development mode/gi,
    framework: 'Generic',
    severity: 'medium' as const,
  },
  {
    pattern: /ENVIRONMENT\s*=\s*(dev|development|debug)/gi,
    framework: 'Generic',
    severity: 'medium' as const,
  },
  {
    pattern: /NODE_ENV\s*=\s*development/gi,
    framework: 'Node.js',
    severity: 'medium' as const,
  },
]

// File path disclosure patterns
const FILE_PATH_PATTERNS = [
  {
    pattern: /\/var\/www\/[^\s<>"]+/gi,
    type: 'Linux Web Root',
  },
  {
    pattern: /\/home\/[^\s<>"]+/gi,
    type: 'Linux Home Directory',
  },
  {
    pattern: /C:\\[^\s<>"]+/gi,
    type: 'Windows Path',
  },
  {
    pattern: /\/usr\/(local|bin|lib)\/[^\s<>"]+/gi,
    type: 'Linux System Path',
  },
  {
    pattern: /\/opt\/[^\s<>"]+/gi,
    type: 'Linux Optional Path',
  },
  {
    pattern: /\/app\/[^\s<>"]+/gi,
    type: 'Application Path',
  },
]

// Generic exception patterns
const EXCEPTION_PATTERNS = [
  /Exception in thread/gi,
  /Uncaught exception/gi,
  /Unhandled exception/gi,
  /Critical error/gi,
  /Application error/gi,
]

export async function analyzeErrorDisclosure(
  html: string,
  responseHeaders: Record<string, string> = {}
): Promise<ErrorDisclosureResult> {
  const findings: ErrorDisclosureFinding[] = []
  const detectedFrameworks = new Set<string>()
  let hasStackTraces = false
  let hasDatabaseErrors = false
  let hasDebugMode = false
  let hasFilePathDisclosure = false

  // Remove HTML comments and script tags for cleaner analysis
  const cleanHtml = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // 1. Check for stack traces
  for (const stackPattern of STACK_TRACE_PATTERNS) {
    const matches = cleanHtml.match(stackPattern.pattern)
    if (matches && matches.length > 0) {
      hasStackTraces = true
      detectedFrameworks.add(stackPattern.framework)

      // Take first match as evidence (truncate if too long)
      const evidence = matches[0].length > 200
        ? matches[0].substring(0, 200) + '...'
        : matches[0]

      findings.push({
        type: 'stack-trace',
        severity: stackPattern.severity,
        title: `${stackPattern.framework} Stack Trace Exposed`,
        description: `The application is exposing ${stackPattern.framework} stack traces in the HTTP response. This reveals internal implementation details and file paths.`,
        evidence,
        framework: stackPattern.framework,
        impact: 'Attackers can learn about the internal structure, file paths, framework versions, and potentially vulnerable code paths. This information aids in targeted attacks.',
        recommendation: 'Disable debug mode in production. Configure proper error handling to show generic error pages to users while logging detailed errors server-side only.',
      })
    }
  }

  // 2. Check for database errors
  for (const dbPattern of DATABASE_ERROR_PATTERNS) {
    const matches = cleanHtml.match(dbPattern.pattern)
    if (matches && matches.length > 0) {
      hasDatabaseErrors = true

      const evidence = matches[0].length > 200
        ? matches[0].substring(0, 200) + '...'
        : matches[0]

      findings.push({
        type: 'database-error',
        severity: dbPattern.severity,
        title: `Database Error Disclosure: ${dbPattern.type}`,
        description: `The application is exposing database error messages (${dbPattern.type}) in the HTTP response.`,
        evidence,
        impact: dbPattern.severity === 'critical'
          ? 'Critical: Exposed SQL queries or connection strings can reveal database structure, credentials, or enable SQL injection attacks.'
          : 'Database errors reveal database type, version, schema information, and query structure that can be exploited.',
        recommendation: 'Configure database error handling to log errors server-side only. Never expose SQL queries, connection strings, or detailed database errors to users.',
      })
    }
  }

  // 3. Check for debug mode indicators
  for (const debugPattern of DEBUG_MODE_PATTERNS) {
    const matches = cleanHtml.match(debugPattern.pattern)
    if (matches && matches.length > 0) {
      hasDebugMode = true
      detectedFrameworks.add(debugPattern.framework)

      findings.push({
        type: 'debug-mode',
        severity: debugPattern.severity,
        title: `Debug Mode Enabled: ${debugPattern.framework}`,
        description: `The application appears to be running in debug/development mode. This configuration is visible in the HTTP response.`,
        evidence: matches[0],
        framework: debugPattern.framework,
        impact: 'Debug mode typically exposes sensitive information including stack traces, variable values, configuration details, and may disable security features.',
        recommendation: 'Set DEBUG=False or equivalent in production environment. Use environment-specific configuration files.',
      })
    }
  }

  // 4. Check for file path disclosure
  for (const pathPattern of FILE_PATH_PATTERNS) {
    const matches = cleanHtml.match(pathPattern.pattern)
    if (matches && matches.length > 0) {
      hasFilePathDisclosure = true

      // Deduplicate similar paths
      const uniquePaths = [...new Set(matches.slice(0, 3))] // Max 3 examples

      findings.push({
        type: 'file-path',
        severity: 'medium',
        title: `File Path Disclosure: ${pathPattern.type}`,
        description: `Server file system paths (${pathPattern.type}) are exposed in the HTTP response.`,
        evidence: uniquePaths.join('\n'),
        impact: 'File paths reveal server directory structure, usernames, application locations, and framework details that help attackers map the system.',
        recommendation: 'Configure error handlers to sanitize file paths from error messages. Use relative paths in logs and ensure error pages don\'t include server paths.',
      })
    }
  }

  // 5. Check for generic exceptions
  for (const exceptionPattern of EXCEPTION_PATTERNS) {
    const matches = cleanHtml.match(exceptionPattern)
    if (matches && matches.length > 0 && findings.length < 10) { // Avoid too many findings
      findings.push({
        type: 'exception',
        severity: 'medium',
        title: 'Unhandled Exception Exposed',
        description: 'The application is exposing unhandled exception messages to users.',
        evidence: matches[0],
        impact: 'Exception messages may reveal application logic, validation rules, or internal state information.',
        recommendation: 'Implement global exception handlers that show user-friendly error pages while logging detailed exceptions server-side.',
      })
    }
  }

  // Determine overall risk level
  let riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'
  if (findings.length === 0) {
    riskLevel = 'none'
  } else {
    const criticalCount = findings.filter(f => f.severity === 'critical').length
    const highCount = findings.filter(f => f.severity === 'high').length

    if (criticalCount > 0) riskLevel = 'critical'
    else if (highCount >= 2) riskLevel = 'critical'
    else if (highCount === 1) riskLevel = 'high'
    else if (findings.some(f => f.severity === 'medium')) riskLevel = 'medium'
    else riskLevel = 'low'
  }

  return {
    findings,
    hasStackTraces,
    hasDatabaseErrors,
    hasDebugMode,
    hasFilePathDisclosure,
    detectedFrameworks: Array.from(detectedFrameworks),
    riskLevel,
  }
}

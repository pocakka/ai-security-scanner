/**
 * Passive API Discovery Analyzer
 *
 * Discovers API endpoints, authentication tokens, and security issues through PASSIVE analysis
 * of client-side code (HTML, JavaScript) WITHOUT making active requests or attacks.
 *
 * CRITICAL Security Checks:
 * - JWT tokens in localStorage/sessionStorage/cookies
 * - API keys exposed in client code
 * - SQL error messages (database info disclosure)
 * - Stack traces (reveals file paths and code structure)
 * - Debug mode indicators (exposes internal data)
 * - API endpoint discovery (REST, GraphQL)
 * - Authentication patterns
 *
 * All detection is PASSIVE - we only analyze what the server already sent to us.
 */

export interface PassiveAPIDiscoveryResult {
  findings: Finding[]
  discoveredAPIs: DiscoveredAPI[]
  exposedTokens: ExposedToken[]
  sqlErrors: SQLError[]
  stackTraces: StackTrace[]
  debugIndicators: DebugIndicator[]
  hasJWT: boolean
  hasAPIKeys: boolean
  hasSQLErrors: boolean
  hasStackTraces: boolean
  hasDebugMode: boolean
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export interface Finding {
  type: string
  category: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
  codeSnippet?: string
}

export interface DiscoveredAPI {
  url: string
  method?: string
  type: 'REST' | 'GraphQL' | 'WebSocket' | 'Unknown'
  authentication?: string[] // Auth headers detected
  isExternal: boolean
}

export interface ExposedToken {
  type: 'JWT' | 'API_KEY' | 'Bearer' | 'Session' | 'OAuth' | 'Unknown'
  location: 'localStorage' | 'sessionStorage' | 'cookie' | 'inline' | 'script'
  pattern: string
  evidence: string
  entropy?: number // Randomness score (high entropy = likely real token)
}

export interface SQLError {
  error: string
  database: string // MySQL, PostgreSQL, MSSQL, etc.
  evidence: string
  revealsSchema: boolean
}

export interface StackTrace {
  framework: string // Node.js, Python, Java, .NET, etc.
  filePaths: string[]
  evidence: string
  revealsInternals: boolean
}

export interface DebugIndicator {
  type: 'console' | 'debugger' | 'sourceMaps' | 'devMode' | 'verboseLogging'
  evidence: string
  severity: 'low' | 'medium' | 'high'
}

/**
 * JWT Pattern Detection
 * JWT format: header.payload.signature (3 base64url-encoded parts separated by dots)
 */
const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g

/**
 * API Key Patterns
 * Common formats: sk_test_..., pk_live_..., AIza..., etc.
 */
const API_KEY_PATTERNS = [
  { name: 'Stripe Secret Key', regex: /sk_(test|live)_[A-Za-z0-9]{24,}/g, severity: 'critical' as const },
  { name: 'Stripe Publishable Key', regex: /pk_(test|live)_[A-Za-z0-9]{24,}/g, severity: 'medium' as const },
  { name: 'Google API Key', regex: /AIza[A-Za-z0-9_-]{35}/g, severity: 'high' as const },
  { name: 'AWS Access Key', regex: /AKIA[A-Z0-9]{16}/g, severity: 'critical' as const },
  { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9]{36,}/g, severity: 'critical' as const },
  { name: 'OpenAI API Key', regex: /sk-[A-Za-z0-9]{48}/g, severity: 'critical' as const },
  { name: 'Anthropic API Key', regex: /sk-ant-api03-[A-Za-z0-9_-]{95,}/g, severity: 'critical' as const },
  { name: 'SendGrid API Key', regex: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g, severity: 'critical' as const },
  { name: 'Twilio API Key', regex: /SK[a-f0-9]{32}/g, severity: 'critical' as const },
  { name: 'Generic API Key', regex: /api[_-]?key[_-]?=["']?([A-Za-z0-9_-]{20,})["']?/gi, severity: 'high' as const },
]

/**
 * SQL Error Patterns
 * Common database error messages that reveal internal information
 */
const SQL_ERROR_PATTERNS = [
  { db: 'MySQL', regex: /mysql_fetch_|mysql_num_rows|mysql_query|You have an error in your SQL syntax/gi },
  { db: 'PostgreSQL', regex: /pg_query|pg_exec|PostgreSQL.*ERROR|ERROR:.*syntax error/gi },
  { db: 'MSSQL', regex: /Microsoft SQL Server|ODBC SQL Server Driver|SQLServer JDBC Driver|Unclosed quotation mark/gi },
  { db: 'Oracle', regex: /ORA-\d{5}|Oracle error|ORACLE.*Driver/gi },
  { db: 'SQLite', regex: /SQLite\/JDBCDriver|sqlite3\.OperationalError|SQLITE_ERROR/gi },
  { db: 'MongoDB', regex: /MongoError|MongoDB.*error|mongo::.*Exception/gi },
]

/**
 * Stack Trace Patterns
 * Framework-specific error traces that reveal file paths
 */
const STACK_TRACE_PATTERNS = [
  { framework: 'Node.js', regex: /at\s+[\w.$]+\s+\([^)]*\.js:\d+:\d+\)|at\s+[^(]+\([^)]*node_modules[^)]*\)/gi },
  { framework: 'Python', regex: /File "([^"]+\.py)", line \d+|Traceback \(most recent call last\)/gi },
  { framework: 'Java', regex: /at\s+[\w.$]+\([^)]*\.java:\d+\)|Exception in thread|java\.lang\./gi },
  { framework: '.NET', regex: /at\s+[\w.]+\([^)]*\.cs:\d+\)|System\..*Exception|Microsoft\.AspNetCore/gi },
  { framework: 'PHP', regex: /Fatal error:|Warning:|Notice:.*in.*on line \d+|Stack trace:/gi },
  { framework: 'Ruby', regex: /from\s+[^:]+:\d+:in\s+`|.*\.rb:\d+:in\s+`/gi },
]

/**
 * API Endpoint Discovery Patterns
 */
const API_ENDPOINT_PATTERNS = [
  // REST endpoints
  /["'](https?:\/\/[^"'\s]+\/api\/[^"'\s]+)["']/gi,
  /["'](\/api\/[^"'\s]+)["']/gi,

  // GraphQL endpoints
  /["'](https?:\/\/[^"'\s]+\/graphql[^"'\s]*)["']/gi,
  /["'](\/graphql[^"'\s]*)["']/gi,

  // Common API patterns
  /fetch\s*\(\s*["']([^"']+)["']/gi,
  /axios\.[get|post|put|delete]+\s*\(\s*["']([^"']+)["']/gi,
  /\$\.ajax\s*\(\s*{[^}]*url\s*:\s*["']([^"']+)["']/gi,
]

/**
 * Debug Mode Indicators
 */
const DEBUG_INDICATORS = [
  { type: 'console' as const, pattern: /console\.(log|debug|info|warn|error|trace)\(/gi, severity: 'low' as const },
  { type: 'debugger' as const, pattern: /debugger;/gi, severity: 'medium' as const },
  { type: 'sourceMaps' as const, pattern: /\/\/# sourceMappingURL=/gi, severity: 'high' as const },
  { type: 'devMode' as const, pattern: /NODE_ENV.*development|DEBUG.*=.*true|REACT_APP_DEBUG/gi, severity: 'high' as const },
  { type: 'verboseLogging' as const, pattern: /VERBOSE|TRACE.*=.*true|LOG_LEVEL.*debug/gi, severity: 'medium' as const },
]

/**
 * Calculate entropy (randomness) of a string
 * High entropy = likely a real token/secret
 */
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

/**
 * Extract domain from URL for comparison
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/**
 * Passive API Discovery Analyzer
 */
export async function analyzePassiveAPIDiscovery(
  html: string,
  currentUrl: string
): Promise<PassiveAPIDiscoveryResult> {
  const findings: Finding[] = []
  const discoveredAPIs: DiscoveredAPI[] = []
  const exposedTokens: ExposedToken[] = []
  const sqlErrors: SQLError[] = []
  const stackTraces: StackTrace[] = []
  const debugIndicators: DebugIndicator[] = []

  const currentDomain = getDomain(currentUrl)

  // Timeout protection: limit analysis to 10 seconds
  const MAX_ANALYSIS_TIME = 10000 // 10 seconds
  const startTime = Date.now()

  const checkTimeout = () => {
    if (Date.now() - startTime > MAX_ANALYSIS_TIME) {
      throw new Error('Passive API Discovery timeout')
    }
  }

  // Limit HTML size to prevent catastrophic backtracking
  const MAX_HTML_SIZE = 5000000 // 5MB
  if (html.length > MAX_HTML_SIZE) {
    html = html.substring(0, MAX_HTML_SIZE)
  }

  // 1. JWT Token Detection
  const jwtMatches = html.match(JWT_REGEX) || []
  for (const jwt of jwtMatches) {
    // Basic validation: JWT should be at least 100 chars and have high entropy
    if (jwt.length > 100 && calculateEntropy(jwt) > 4.5) {
      const location = html.includes(`localStorage.setItem`) || html.includes(`localStorage.getItem`) ? 'localStorage' :
                       html.includes(`sessionStorage.setItem`) || html.includes(`sessionStorage.getItem`) ? 'sessionStorage' :
                       html.includes(`document.cookie`) ? 'cookie' : 'inline'

      exposedTokens.push({
        type: 'JWT',
        location,
        pattern: jwt.substring(0, 50) + '...',
        evidence: jwt.substring(0, 100) + '...',
        entropy: calculateEntropy(jwt)
      })

      findings.push({
        type: 'passive-api-jwt',
        category: 'passive-api-discovery',
        severity: location === 'inline' ? 'critical' : 'high',
        title: `JWT Token Exposed in ${location}`,
        description: `A JSON Web Token (JWT) was found ${location === 'inline' ? 'hardcoded in the page HTML' : `stored in browser ${location}`}. JWT tokens are used for authentication and should never be exposed in client-side code.`,
        impact: location === 'inline'
          ? 'CRITICAL: Hardcoded JWT in HTML is immediately visible to all users and attackers. Anyone can copy this token and impersonate the authenticated user, access protected APIs, steal data, or perform unauthorized actions. This token may grant full access to the application.'
          : `HIGH: JWT in ${location} can be stolen through XSS attacks. Attackers can inject JavaScript to read ${location} and send the token to their server. This allows session hijacking, account takeover, and unauthorized API access. ${location === 'localStorage' ? 'localStorage persists across sessions and has no expiration, making the risk permanent until manually cleared.' : 'sessionStorage is cleared when the tab closes but is still vulnerable during the session.'}`,
        recommendation: location === 'inline'
          ? 'IMMEDIATELY remove hardcoded JWT from HTML. Never include authentication tokens in static content. Use secure HTTP-only cookies for session management instead. Rotate the exposed token immediately as it is now compromised.'
          : `Use HTTP-only cookies for JWT storage instead of ${location}. HTTP-only cookies cannot be accessed by JavaScript, preventing XSS attacks from stealing tokens. Implement proper Content Security Policy (CSP) to mitigate XSS risks. Consider short-lived tokens with refresh token rotation.`,
        evidence: `JWT pattern: ${jwt.substring(0, 50)}...`,
        codeSnippet: html.substring(Math.max(0, html.indexOf(jwt) - 100), html.indexOf(jwt) + jwt.length + 100)
      })
    }
  }

  // 2. API Key Detection
  checkTimeout()
  for (const pattern of API_KEY_PATTERNS) {
    const matches = html.match(pattern.regex) || []
    if (matches.length > 100) break // Prevent too many matches
    for (const match of matches) {
      if (calculateEntropy(match) > 3.5) { // Likely a real key
        exposedTokens.push({
          type: 'API_KEY',
          location: 'inline',
          pattern: pattern.name,
          evidence: match.substring(0, 30) + '...',
          entropy: calculateEntropy(match)
        })

        findings.push({
          type: 'passive-api-key',
          category: 'passive-api-discovery',
          severity: pattern.severity,
          title: `${pattern.name} Exposed in Client Code`,
          description: `A ${pattern.name} was found embedded in the HTML or JavaScript code. API keys grant access to external services and should NEVER be exposed in client-side code.`,
          impact: pattern.severity === 'critical'
            ? `CRITICAL: This API key grants access to ${pattern.name.split(' ')[0]} services. Attackers can copy this key and make unlimited API calls under your account, potentially causing massive financial damage through usage charges, data theft from the service, or abuse of the service for malicious purposes (spam, fraud, etc.). The key is immediately compromised and visible to anyone viewing the page source.`
            : `HIGH: Exposed ${pattern.name} can be used by attackers to access the associated service. This may result in unauthorized usage charges, quota exhaustion, data access, or service abuse. Public API keys should only be used for services explicitly designed for client-side use (like Google Maps, Stripe publishable keys).`,
          recommendation: pattern.severity === 'critical'
            ? `IMMEDIATELY revoke this API key from your ${pattern.name.split(' ')[0]} dashboard. Move API calls to server-side code where keys can be stored securely as environment variables. Never commit API keys to version control. Use key restrictions and rate limiting when available. Generate a new key and keep it server-side only.`
            : `Move API calls to server-side code where possible. If client-side API access is required, use the service's client-side SDK with restricted keys. Enable domain restrictions, API restrictions, and rate limiting on your API key. Monitor API usage for suspicious activity.`,
          evidence: `${pattern.name}: ${match.substring(0, 30)}...`,
          codeSnippet: html.substring(Math.max(0, html.indexOf(match) - 100), html.indexOf(match) + match.length + 100)
        })
      }
    }
  }

  // 3. SQL Error Detection
  checkTimeout()
  for (const sqlPattern of SQL_ERROR_PATTERNS) {
    const matches = html.match(sqlPattern.regex) || []
    if (matches.length > 50) break // Limit matches
    if (matches.length > 0 && matches[0]) {
      const evidence = matches[0]
      const evidenceIndex = html.indexOf(evidence)
      const revealsSchema = evidenceIndex >= 0 ? /table|column|database|schema|query|SELECT|INSERT|UPDATE|DELETE/i.test(html.substring(evidenceIndex, evidenceIndex + 500)) : false

      sqlErrors.push({
        error: evidence,
        database: sqlPattern.db,
        evidence: evidence.substring(0, 200),
        revealsSchema
      })

      findings.push({
        type: 'passive-api-sql-error',
        category: 'passive-api-discovery',
        severity: revealsSchema ? 'high' : 'medium',
        title: `${sqlPattern.db} Error Message Exposed`,
        description: `A ${sqlPattern.db} database error message is visible in the page content. Database errors should never be displayed to users as they reveal internal system information.`,
        impact: revealsSchema
          ? `HIGH: This SQL error reveals database schema information including table names, column names, or query structure. Attackers can use this information to craft SQL injection attacks, understand the database structure, identify vulnerable entry points, and extract sensitive data. Error messages often contain exact SQL queries that failed, giving attackers a blueprint for exploitation.`
          : `MEDIUM: Database error messages confirm which database system is being used (${sqlPattern.db}), aiding attackers in reconnaissance. Even without schema details, knowing the database type helps attackers select appropriate attack techniques and exploit known vulnerabilities specific to ${sqlPattern.db}.`,
        recommendation: `Disable detailed error messages in production. Configure ${sqlPattern.db} to log errors server-side only, not to client responses. Implement generic error pages that don't reveal technical details. Use try-catch blocks to handle database errors gracefully without exposing internals. Enable error logging to a secure location for debugging.`,
        evidence: evidence.substring(0, 200),
        codeSnippet: evidenceIndex >= 0 ? html.substring(Math.max(0, evidenceIndex - 100), evidenceIndex + evidence.length + 200) : evidence
      })
    }
  }

  // 4. Stack Trace Detection
  checkTimeout()
  for (const tracePattern of STACK_TRACE_PATTERNS) {
    const matches = html.match(tracePattern.regex) || []
    if (matches.length > 0) {
      const evidence = matches.slice(0, 5).join('\n') // First 5 lines of stack trace
      const filePaths = matches
        .map(line => {
          const pathMatch = line.match(/([\/\\][\w\/\\.-]+\.(js|py|java|cs|php|rb))/i)
          return pathMatch ? pathMatch[1] : null
        })
        .filter((p): p is string => p !== null)
        .slice(0, 10) // Max 10 paths

      const revealsInternals = filePaths.length > 0 || /node_modules|vendor|lib|src|app|controllers|models/i.test(evidence)

      stackTraces.push({
        framework: tracePattern.framework,
        filePaths,
        evidence: evidence.substring(0, 500),
        revealsInternals
      })

      findings.push({
        type: 'passive-api-stack-trace',
        category: 'passive-api-discovery',
        severity: 'high',
        title: `${tracePattern.framework} Stack Trace Exposed`,
        description: `A full ${tracePattern.framework} stack trace is visible in the page. Stack traces reveal internal file paths, code structure, and application architecture.`,
        impact: `HIGH: Stack traces expose critical internal information: file system paths (${filePaths.length} paths found), directory structure, framework versions, library dependencies, function names, and code execution flow. Attackers use this to map the application architecture, identify vulnerable code locations, find outdated dependencies with known CVEs, and craft targeted attacks. File paths like ${filePaths[0] || 'project directories'} reveal project structure and naming conventions.`,
        recommendation: `Disable stack trace output in production ${tracePattern.framework} applications. Configure error handling to show generic error pages to users while logging detailed errors server-side only. Set NODE_ENV=production (Node.js), DEBUG=False (Python/Django), <customErrors mode="On"> (.NET), or equivalent for ${tracePattern.framework}. Use error monitoring services (Sentry, Bugsnag) to capture errors without exposing them to users.`,
        evidence: evidence.substring(0, 300),
        codeSnippet: evidence.substring(0, 500)
      })
    }
  }

  // 5. API Endpoint Discovery
  checkTimeout()
  const discoveredEndpoints = new Set<string>()
  for (const pattern of API_ENDPOINT_PATTERNS) {
    // Use matchAll instead of exec to avoid infinite loops
    const matches = html.matchAll(pattern)
    let matchCount = 0
    const MAX_ENDPOINT_MATCHES = 100 // Limit to prevent excessive processing

    for (const match of matches) {
      if (matchCount++ > MAX_ENDPOINT_MATCHES) break

      const endpoint = match[1]
      if (!discoveredEndpoints.has(endpoint) && endpoint.length > 5) {
        discoveredEndpoints.add(endpoint)

        const isExternal = endpoint.startsWith('http') && !endpoint.includes(currentDomain)
        const type = endpoint.includes('/graphql') ? 'GraphQL' as const :
                     endpoint.includes('ws://') || endpoint.includes('wss://') ? 'WebSocket' as const :
                     endpoint.includes('/api/') ? 'REST' as const : 'Unknown' as const

        discoveredAPIs.push({
          url: endpoint,
          type,
          isExternal
        })
      }
    }
  }

  // Add finding for discovered APIs (informational)
  if (discoveredAPIs.length > 0) {
    const externalAPIs = discoveredAPIs.filter(api => api.isExternal)
    const internalAPIs = discoveredAPIs.filter(api => !api.isExternal)

    if (internalAPIs.length > 0) {
      findings.push({
        type: 'passive-api-endpoints',
        category: 'passive-api-discovery',
        severity: 'info',
        title: `${internalAPIs.length} API Endpoints Discovered`,
        description: `Passive analysis discovered ${internalAPIs.length} internal API endpoints in client-side code. This provides a map of the application's API surface.`,
        impact: `Informational: API endpoints visible in client code are intentionally public, but the full list helps attackers understand the API structure, identify unprotected endpoints, test for authorization bypasses, and find API-specific vulnerabilities. Comprehensive API mapping is the first step in API security testing.`,
        recommendation: `Ensure all API endpoints require proper authentication and authorization. Implement rate limiting on all APIs. Use API gateways for centralized security. Test each endpoint for IDOR, broken access control, and injection vulnerabilities. Document which endpoints are meant to be public vs. authenticated.`,
        evidence: `Endpoints: ${internalAPIs.slice(0, 5).map(api => api.url).join(', ')}${internalAPIs.length > 5 ? '...' : ''}`
      })
    }

    if (externalAPIs.length > 0) {
      findings.push({
        type: 'passive-api-external',
        category: 'passive-api-discovery',
        severity: 'low',
        title: `${externalAPIs.length} External API Calls Detected`,
        description: `The application makes calls to ${externalAPIs.length} external APIs/services.`,
        impact: `Low: External API dependencies introduce third-party security risks. If external APIs are compromised, your application may be affected. Some external APIs may collect user data or track behavior.`,
        recommendation: `Review all external API dependencies. Ensure APIs use HTTPS. Verify third-party privacy policies comply with GDPR/CCPA. Consider SRI (Subresource Integrity) for CDN resources. Monitor external API security advisories.`,
        evidence: `External APIs: ${externalAPIs.slice(0, 3).map(api => api.url).join(', ')}${externalAPIs.length > 3 ? '...' : ''}`
      })
    }
  }

  // 6. Debug Mode Indicators
  checkTimeout()
  for (const debugPattern of DEBUG_INDICATORS) {
    const matches = html.match(debugPattern.pattern) || []
    if (matches.length > 0 && matches[0]) {
      debugIndicators.push({
        type: debugPattern.type,
        evidence: matches[0],
        severity: debugPattern.severity
      })

      if (debugPattern.type !== 'console' || matches.length > 10) { // Only flag excessive console usage
        findings.push({
          type: 'passive-api-debug',
          category: 'passive-api-discovery',
          severity: debugPattern.severity,
          title: debugPattern.type === 'console' ? `Excessive Console Logging (${matches.length} calls)` :
                 debugPattern.type === 'debugger' ? 'Debugger Statements in Production' :
                 debugPattern.type === 'sourceMaps' ? 'Source Maps Enabled in Production' :
                 debugPattern.type === 'devMode' ? 'Development Mode Enabled' :
                 'Verbose Logging Enabled',
          description: debugPattern.type === 'console' ? `Found ${matches.length} console.log/debug/error calls in production code. Console logs can leak sensitive information.` :
                      debugPattern.type === 'debugger' ? `JavaScript debugger statements found in production. These cause browser breakpoints and expose code.` :
                      debugPattern.type === 'sourceMaps' ? `Source maps are enabled, exposing original TypeScript/JSX source code.` :
                      debugPattern.type === 'devMode' ? `Development mode is enabled in production build.` :
                      `Verbose logging is enabled, potentially logging sensitive data.`,
          impact: debugPattern.severity === 'high'
            ? `HIGH: ${debugPattern.type === 'sourceMaps' ? 'Source maps reveal your complete original source code including comments, variable names, file structure, and business logic. Attackers can reverse-engineer the entire application.' : 'Development mode exposes debugging information, verbose errors, and development-only features that should not be in production.'}`
            : `MEDIUM: Debug code in production can leak sensitive information like user data, API keys, internal state, or business logic through console logs or debugging tools.`,
          recommendation: debugPattern.type === 'console' ? `Remove or disable console.log statements in production builds. Use build tools (webpack, Vite) to strip console calls. Implement proper logging service (Sentry, LogRocket) for production error tracking.` :
                         debugPattern.type === 'debugger' ? `Remove all debugger statements before deployment. Configure linters (ESLint) to prevent debugger in production code.` :
                         debugPattern.type === 'sourceMaps' ? `Disable source maps in production builds. Set devtool: false in webpack or build.sourcemap: false in Vite. Upload source maps to error tracking services privately instead of serving them publicly.` :
                         `Set NODE_ENV=production and disable development mode. Configure proper production builds with optimizations enabled.`,
          evidence: `${debugPattern.type}: ${matches.length} occurrences`
        })
      }
    }
  }

  // Determine overall risk level
  const hasJWT = exposedTokens.some(t => t.type === 'JWT')
  const hasAPIKeys = exposedTokens.some(t => t.type === 'API_KEY')
  const hasSQLErrors = sqlErrors.length > 0
  const hasStackTraces = stackTraces.length > 0
  const hasDebugMode = debugIndicators.some(d => d.severity === 'high')

  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const highCount = findings.filter(f => f.severity === 'high').length

  const riskLevel = criticalCount > 0 ? 'critical' :
                    highCount > 2 || (hasAPIKeys && hasSQLErrors) ? 'high' :
                    highCount > 0 || (hasJWT || hasSQLErrors || hasStackTraces) ? 'medium' :
                    findings.length > 0 ? 'low' : 'none'

  return {
    findings,
    discoveredAPIs,
    exposedTokens,
    sqlErrors,
    stackTraces,
    debugIndicators,
    hasJWT,
    hasAPIKeys,
    hasSQLErrors,
    hasStackTraces,
    hasDebugMode,
    riskLevel
  }
}

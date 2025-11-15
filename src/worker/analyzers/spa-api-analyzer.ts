/**
 * SPA & API Detection Analyzer
 *
 * Detects Single Page Applications (SPAs) and analyzes their API communication patterns.
 * This analyzer identifies modern web architectures and potential API security issues.
 *
 * Fully passive - analyzes network requests captured during page load.
 */

export interface ApiEndpoint {
  url: string
  method: string
  type: 'REST' | 'GraphQL' | 'WebSocket' | 'SSE' | 'Unknown'
  hasAuthentication: boolean
  authType?: 'Bearer' | 'API-Key' | 'Basic' | 'Cookie' | 'Custom'
  responseType?: string
  statusCode?: number
  hasCORS: boolean
}

export interface SpaApiFinding {
  type: 'spa-detection' | 'api-endpoint' | 'websocket' | 'unprotected-api' | 'api-pattern' | 'cors-issue'
  severity: 'info' | 'low' | 'medium' | 'high'
  title: string
  description: string
  evidence: string
  impact: string
  recommendation: string
}

export interface SpaApiResult {
  findings: SpaApiFinding[]
  isSPA: boolean
  detectedFramework?: string
  frameworkVersion?: string
  apiEndpoints: ApiEndpoint[]
  webSocketConnections: string[]
  hasUnprotectedEndpoints: boolean
  hasAuthentication: boolean
  riskLevel: 'none' | 'low' | 'medium' | 'high'
}

// SPA Framework detection patterns
const SPA_FRAMEWORK_PATTERNS = [
  {
    name: 'React',
    patterns: [
      /__REACT_/,
      /_reactRoot/,
      /react-dom/,
      /data-reactroot/i,
      /data-reactid/i,
    ],
    versionPattern: /"react":\s*"([^"]+)"/,
  },
  {
    name: 'Vue.js',
    patterns: [
      /__VUE__/,
      /data-v-[a-f0-9]+/,
      /vue\.js/,
      /vue\.runtime/,
    ],
    versionPattern: /"vue":\s*"([^"]+)"/,
  },
  {
    name: 'Angular',
    patterns: [
      /ng-version/,
      /_nghost-/,
      /_ngcontent-/,
      /angular\.js/,
      /@angular\//,
    ],
    versionPattern: /ng-version="([^"]+)"/,
  },
  {
    name: 'Svelte',
    patterns: [
      /svelte-[a-z0-9]+/,
      /class="svelte-/,
      /__svelte/,
    ],
    versionPattern: /"svelte":\s*"([^"]+)"/,
  },
  {
    name: 'Next.js',
    patterns: [
      /__NEXT_DATA__/,
      /_next\/static/,
      /next\.js/,
    ],
    versionPattern: /"next":\s*"([^"]+)"/,
  },
  {
    name: 'Nuxt.js',
    patterns: [
      /__NUXT__/,
      /_nuxt\//,
    ],
    versionPattern: /"nuxt":\s*"([^"]+)"/,
  },
]

// API endpoint patterns
const API_PATTERNS = [
  // REST patterns
  { pattern: /\/api\/v?\d+\//i, type: 'REST' as const },
  { pattern: /\/rest\/v?\d+\//i, type: 'REST' as const },
  { pattern: /\/api\/(users|posts|products|items|data)/i, type: 'REST' as const },

  // GraphQL
  { pattern: /\/graphql/i, type: 'GraphQL' as const },
  { pattern: /\/gql/i, type: 'GraphQL' as const },

  // WebSocket
  { pattern: /^wss?:\/\//i, type: 'WebSocket' as const },

  // Server-Sent Events
  { pattern: /\/events/i, type: 'SSE' as const },
  { pattern: /\/stream/i, type: 'SSE' as const },
]

// Authentication header patterns
const AUTH_PATTERNS = [
  { pattern: /^Bearer\s+/i, type: 'Bearer' as const },
  { pattern: /^Basic\s+/i, type: 'Basic' as const },
  { pattern: /^Token\s+/i, type: 'API-Key' as const },
  { pattern: /^ApiKey\s+/i, type: 'API-Key' as const },
]

export async function analyzeSpaApi(
  html: string,
  jsFiles: string[] = [],
  networkRequests: Array<{
    url: string
    method: string
    headers: Record<string, string>
    statusCode?: number
    resourceType?: string
  }> = []
): Promise<SpaApiResult> {
  const findings: SpaApiFinding[] = []
  const apiEndpoints: ApiEndpoint[] = []
  const webSocketConnections: string[] = []
  let isSPA = false
  let detectedFramework: string | undefined
  let frameworkVersion: string | undefined
  let hasUnprotectedEndpoints = false
  let hasAuthentication = false

  // 1. Detect SPA Framework
  for (const framework of SPA_FRAMEWORK_PATTERNS) {
    let detected = false

    // Check HTML patterns
    for (const pattern of framework.patterns) {
      if (pattern.test(html)) {
        detected = true
        break
      }
    }

    // Check JS files
    if (!detected) {
      for (const jsContent of jsFiles) {
        for (const pattern of framework.patterns) {
          if (pattern.test(jsContent)) {
            detected = true
            break
          }
        }
        if (detected) break
      }
    }

    if (detected) {
      isSPA = true
      detectedFramework = framework.name

      // Try to extract version
      const versionMatch = html.match(framework.versionPattern) ||
                          jsFiles.join('').match(framework.versionPattern)
      if (versionMatch) {
        frameworkVersion = versionMatch[1]
      }

      findings.push({
        type: 'spa-detection',
        severity: 'info',
        title: `${framework.name} Single Page Application Detected`,
        description: `The website is built using ${framework.name}${frameworkVersion ? ` version ${frameworkVersion}` : ''}. This indicates a modern SPA architecture with client-side routing and API-driven data fetching.`,
        evidence: `Framework: ${framework.name}${frameworkVersion ? ` v${frameworkVersion}` : ''}`,
        impact: 'SPAs typically rely heavily on APIs for data. Security depends on proper API authentication, authorization, and CORS configuration.',
        recommendation: 'Ensure all API endpoints require authentication, implement rate limiting, validate CORS policies, and use HTTPS for all API communications.',
      })

      break // Only detect one framework
    }
  }

  // 2. Analyze network requests for API endpoints
  for (const request of networkRequests) {
    // Skip static resources
    if (request.resourceType && ['image', 'stylesheet', 'font', 'media'].includes(request.resourceType)) {
      continue
    }

    // Check if this is an API endpoint
    let isApiEndpoint = false
    let apiType: 'REST' | 'GraphQL' | 'WebSocket' | 'SSE' | 'Unknown' = 'Unknown'

    for (const apiPattern of API_PATTERNS) {
      if (apiPattern.pattern.test(request.url)) {
        isApiEndpoint = true
        apiType = apiPattern.type
        break
      }
    }

    // Check for JSON requests/responses (likely API)
    const contentType = request.headers['content-type'] || request.headers['Content-Type'] || ''
    if (contentType.includes('application/json')) {
      isApiEndpoint = true
      if (apiType === 'Unknown') apiType = 'REST'
    }

    // Check for GraphQL in request body (if available)
    if (request.url.includes('graphql') || contentType.includes('application/graphql')) {
      isApiEndpoint = true
      apiType = 'GraphQL'
    }

    if (isApiEndpoint) {
      // Check for authentication
      const authHeader = request.headers['authorization'] || request.headers['Authorization']
      let hasAuth = false
      let authType: 'Bearer' | 'API-Key' | 'Basic' | 'Cookie' | 'Custom' | undefined

      if (authHeader) {
        hasAuth = true
        hasAuthentication = true

        for (const authPattern of AUTH_PATTERNS) {
          if (authPattern.pattern.test(authHeader)) {
            authType = authPattern.type
            break
          }
        }

        if (!authType) authType = 'Custom'
      }

      // Check for cookie-based auth
      const cookieHeader = request.headers['cookie'] || request.headers['Cookie']
      if (cookieHeader && (cookieHeader.includes('token') || cookieHeader.includes('session') || cookieHeader.includes('auth'))) {
        hasAuth = true
        hasAuthentication = true
        authType = 'Cookie'
      }

      // Check for API key in URL (bad practice!)
      if (request.url.match(/[?&](api_?key|token|access_?token)=/i)) {
        hasAuth = true
        hasAuthentication = true
        authType = 'API-Key'

        findings.push({
          type: 'api-pattern',
          severity: 'high',
          title: 'API Key in URL Query Parameter',
          description: `An API endpoint includes authentication credentials in the URL query string: ${request.url}`,
          evidence: `URL: ${request.url.substring(0, 100)}...`,
          impact: 'API keys in URLs are logged in browser history, server logs, and referrer headers. This can lead to credential theft.',
          recommendation: 'Move authentication to HTTP headers (Authorization: Bearer token). Never include credentials in URLs.',
        })
      }

      // Check CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'Access-Control-Allow-Origin',
      ]
      const hasCORS = corsHeaders.some(h => request.headers[h])

      const endpoint: ApiEndpoint = {
        url: request.url,
        method: request.method,
        type: apiType,
        hasAuthentication: hasAuth,
        authType,
        statusCode: request.statusCode,
        responseType: contentType,
        hasCORS,
      }

      apiEndpoints.push(endpoint)

      // Flag unprotected endpoints
      if (!hasAuth && apiType !== 'Unknown') {
        hasUnprotectedEndpoints = true

        findings.push({
          type: 'unprotected-api',
          severity: request.method === 'GET' ? 'medium' : 'high',
          title: `Unprotected ${apiType} API Endpoint`,
          description: `The ${request.method} ${apiType} endpoint does not appear to have authentication: ${request.url}`,
          evidence: `${request.method} ${request.url}\nNo Authorization header detected`,
          impact: request.method === 'GET'
            ? 'Unauthenticated read access may expose sensitive data or enable enumeration attacks.'
            : 'Unauthenticated write access allows attackers to modify data without authorization.',
          recommendation: 'Implement authentication for all API endpoints. Use OAuth 2.0, JWT tokens, or API keys with proper validation. Ensure POST/PUT/DELETE endpoints require authentication.',
        })
      }

      // Create informational finding for each API endpoint
      if (findings.filter(f => f.type === 'api-endpoint').length < 5) { // Limit to 5 examples
        findings.push({
          type: 'api-endpoint',
          severity: 'info',
          title: `${apiType} API Endpoint Detected`,
          description: `Discovered ${apiType} endpoint: ${request.method} ${request.url}`,
          evidence: `${request.method} ${request.url}\nAuthentication: ${hasAuth ? `Yes (${authType})` : 'No'}\nStatus: ${request.statusCode || 'Unknown'}`,
          impact: 'API endpoints are the primary attack surface for SPAs. Proper security configuration is critical.',
          recommendation: hasAuth
            ? 'Verify that authentication tokens are properly validated server-side and have appropriate expiration times.'
            : 'Add authentication to this endpoint if it handles sensitive data or operations.',
        })
      }
    }
  }

  // 3. Detect WebSocket connections
  const wsPattern = /new\s+WebSocket\s*\(\s*['"`]([^'"`]+)['"`]/gi
  let wsMatch
  for (const wsMatch of html.matchAll(wsPattern)) {
    webSocketConnections.push(wsMatch[1])

    findings.push({
      type: 'websocket',
      severity: 'info',
      title: 'WebSocket Connection Detected',
      description: `The application uses WebSocket for real-time communication: ${wsMatch[1]}`,
      evidence: `WebSocket URL: ${wsMatch[1]}`,
      impact: 'WebSocket connections bypass standard HTTP security controls. They require separate authentication and input validation.',
      recommendation: 'Implement authentication for WebSocket connections (e.g., token-based auth on connection handshake). Validate all messages. Use WSS (WebSocket Secure) protocol.',
    })
  }

  // Check JS files for WebSocket
  for (const jsContent of jsFiles) {
    const jsWsMatches = jsContent.match(wsPattern)
    if (jsWsMatches) {
      for (const match of jsWsMatches) {
        const urlMatch = match.match(/['"`]([^'"`]+)['"`]/)
        if (urlMatch && !webSocketConnections.includes(urlMatch[1])) {
          webSocketConnections.push(urlMatch[1])
        }
      }
    }
  }

  // 4. Detect common API patterns in HTML/JS
  const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi
  const apiCalls: string[] = []

  let fetchMatch
  for (const fetchMatch of html.matchAll(fetchPattern)) {
    const url = fetchMatch[1]
    if (url.startsWith('/api') || url.includes('/api/') || url.startsWith('http')) {
      apiCalls.push(url)
    }
  }

  if (apiCalls.length > 0 && !isSPA) {
    // Even without SPA framework detection, if we see API calls, likely modern webapp
    findings.push({
      type: 'api-pattern',
      severity: 'info',
      title: 'Modern API-Driven Architecture Detected',
      description: `The application uses fetch() or AJAX for API communication, indicating a modern client-side architecture. Found ${apiCalls.length} API call(s) in client code.`,
      evidence: `Example API calls:\n${apiCalls.slice(0, 3).join('\n')}`,
      impact: 'API-driven architectures require robust API security including authentication, rate limiting, and input validation.',
      recommendation: 'Ensure all API endpoints implement proper authentication, authorization, rate limiting, and input validation. Use HTTPS for all API calls.',
    })
  }

  // Determine risk level
  let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none'
  if (findings.length === 0) {
    riskLevel = 'none'
  } else {
    const highCount = findings.filter(f => f.severity === 'high').length
    const mediumCount = findings.filter(f => f.severity === 'medium').length

    if (highCount > 0 || hasUnprotectedEndpoints) riskLevel = 'high'
    else if (mediumCount > 0) riskLevel = 'medium'
    else riskLevel = 'low'
  }

  return {
    findings,
    isSPA,
    detectedFramework,
    frameworkVersion,
    apiEndpoints,
    webSocketConnections,
    hasUnprotectedEndpoints,
    hasAuthentication,
    riskLevel,
  }
}

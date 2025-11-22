import { CrawlResult } from '../crawler-mock'

export interface AdminDiscoveryFinding {
  type: 'admin-panel' | 'api-documentation' | 'graphql-introspection' | 'graphql-endpoint' | 'login-form' | 'possible-admin'
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  url?: string
  status?: number
  redirectsTo?: string
  format?: string
  typesCount?: number
  passwordFields?: number
  formActions?: string[]
  indicator?: string
  foundIn?: string
  impact: string
  recommendation: string
}

export interface AdminDiscoveryResult {
  findings: AdminDiscoveryFinding[]
  hasAdminPanel: boolean
  hasLoginForm: boolean
  adminUrls: string[]
  loginForms: number
}

/**
 * Enhanced Admin Discovery Analyzer
 *
 * Implements comprehensive admin panel, API documentation, and GraphQL endpoint discovery
 * Based on IMPLEMENTATION_1_VERY_EASY.md section 3
 *
 * Features:
 * - Common admin path checking (HEAD requests with redirect: manual)
 * - Custom admin detection via HTML analysis
 * - API documentation discovery (Swagger, OpenAPI)
 * - GraphQL introspection checking
 * - Login form detection
 *
 * Timeout: 5 seconds max for entire analyzer
 */
export async function analyzeAdminDiscovery(crawlResult: CrawlResult): Promise<AdminDiscoveryResult> {
  const findings: AdminDiscoveryFinding[] = []
  const baseUrl = new URL(crawlResult.url)
  const adminUrls: string[] = []
  let hasAdminPanel = false
  let hasLoginForm = false
  let loginFormCount = 0

  // Overall timeout: 5 seconds
  const startTime = Date.now()
  const TIMEOUT_MS = 5000

  const isTimeout = () => Date.now() - startTime > TIMEOUT_MS

  try {
    // ===== 3.5 Login Form Detection (FIRST - instant, no network) =====
    if (crawlResult.html) {
      console.log('[AdminDiscovery] Detecting login forms in HTML...')

      const html = crawlResult.html

      // Detect password input fields
      const passwordInputs = html.match(/<input[^>]*type=["']password["'][^>]*>/gi) || []

      if (passwordInputs.length > 0) {
        hasLoginForm = true
        loginFormCount = passwordInputs.length

        // Extract form actions using matchAll to prevent infinite loops
        const formActions: string[] = []
        const formRegex = /<form[^>]*action=["']([^"']+)["'][^>]*>/gi
        const formMatches = html.matchAll(formRegex)

        for (const formMatch of formMatches) {
          const action = formMatch[1]
          if (action && !action.startsWith('#')) {
            formActions.push(action)
          }
        }

        findings.push({
          type: 'login-form',
          severity: 'info',
          title: 'Login form detected',
          passwordFields: passwordInputs.length,
          formActions: formActions.slice(0, 3), // Limit to 3
          impact: 'Login forms are targets for credential stuffing and brute force attacks',
          recommendation: 'Implement rate limiting, CAPTCHA after failed attempts, and account lockout policies.'
        })
      }
    }

    // ===== 3.2 Custom Admin Detection (SECOND - instant, no network) =====
    if (crawlResult.html) {
      console.log('[AdminDiscovery] Analyzing HTML for custom admin indicators...')

      const customAdminIndicators = [
        'Login', 'Sign In', 'Admin Login', 'Dashboard',
        'Control Panel', 'Administration', 'Backend'
      ]

      const html = crawlResult.html
      const titleMatch = html.match(/<title>([^<]+)<\/title>/)
      const title = titleMatch ? titleMatch[1] : ''

      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
      const h1 = h1Match ? h1Match[1] : ''

      for (const indicator of customAdminIndicators) {
        if (title.includes(indicator) || h1.includes(indicator)) {
          findings.push({
            type: 'possible-admin',
            severity: 'info',
            title: 'Possible admin interface',
            indicator: indicator,
            foundIn: title.includes(indicator) ? 'title' : 'h1',
            impact: 'Page contains admin-related keywords',
            recommendation: 'Review page to confirm if this is an administrative interface.'
          })
          break // Only report once
        }
      }
    }

    // ===== 3.1 Common Admin Paths (THIRD - network requests) =====
    const adminPaths = [
      // CMS specific
      '/admin', '/administrator', '/wp-admin', '/wp-login.php',
      '/user/login', '/admin/login', '/manager',
      // Database
      '/phpmyadmin', '/phpMyAdmin', '/pma', '/adminer',
      '/mysql', '/myadmin', '/sqlmanager',
      // Hosting panels
      '/cpanel', '/webmail', '/panel', '/hosting',
      '/plesk', '/directadmin',
      // Application specific
      '/dashboard', '/console', '/portal', '/backend',
      '/backoffice', '/adminpanel', '/sysadmin',
      '/adminarea', '/administratorlogin', '/admin_area',
      // API documentation
      '/api/docs', '/api-docs', '/swagger', '/swagger-ui',
      '/graphql', '/playground', '/graphiql',
      '/api/v1/docs', '/redoc', '/rapidoc',
      // Dev/staging
      '/dev', '/staging', '/test', '/demo',
      '/backup', '/old', '/new', '/temp'
    ]

    console.log('[AdminDiscovery] Checking common admin paths...')

    for (const path of adminPaths) {
      if (isTimeout()) {
        console.log('[AdminDiscovery] Timeout reached, stopping admin path checks')
        break
      }

      const adminUrl = new URL(path, baseUrl).href

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 1000) // 1s per request

        const response = await fetch(adminUrl, {
          method: 'HEAD',
          redirect: 'manual', // Don't follow redirects
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)'
          }
        })

        clearTimeout(timeout)

        // Get redirect location from response headers if present
        const redirectLocation = response.headers.get('location') || null

        // ========================================
        // VULNERABILITY DETECTION (Nov 16, 2025)
        // ONLY 200 OK = real vulnerability!
        // 301/302/404 = NOT a vulnerability
        // 401/403 = auth-protected (still a finding, lower severity)
        // ========================================

        // ONLY report if admin panel is ACTUALLY accessible
        // 200 = Direct access (CRITICAL)
        // 401/403 = Auth-protected (HIGH - panel exists but protected)
        if (response.status === 200 || response.status === 401 || response.status === 403) {
          hasAdminPanel = true
          adminUrls.push(adminUrl)

          // Determine severity based on status and path
          let severity: 'low' | 'medium' | 'high' = 'medium'
          if (response.status === 200) {
            severity = 'high' // Open admin panel
          } else if (path.includes('phpmyadmin') || path.includes('mysql') || path.includes('adminer')) {
            severity = 'high' // Database management
          }

          findings.push({
            type: 'admin-panel',
            severity,
            title: `Admin panel found: ${path}`,
            url: adminUrl,
            status: response.status,
            impact: response.status === 200
              ? 'Administrative interface exposed without authentication'
              : 'Admin panel accessible, protected by authentication',
            recommendation: response.status === 200
              ? 'IMMEDIATELY restrict admin access by IP or VPN. Require authentication.'
              : 'Restrict admin access by IP or VPN. Implement 2FA and rate limiting.'
          })

          // Limit to 5 findings to avoid spam
          if (adminUrls.length >= 5) break
        }

        // ❌ REMOVED: 301/302 redirect check - too many false positives
        // 301/302 can mean: page moved, not found, redirect to homepage, etc.
        // NOT a vulnerability unless we can confirm it's actually an admin panel

        // ONLY 200 (open) or 401/403 (auth-protected) = real finding
      } catch (error) {
        // Network errors ignored (expected for most paths)
      }
    }

    // ===== 3.3 API Documentation Discovery (FOURTH - network requests) =====
    if (!isTimeout()) {
      console.log('[AdminDiscovery] Checking for API documentation...')

      const apiDocPaths = [
        '/swagger.json', '/swagger.yaml',
        '/openapi.json', '/openapi.yaml',
        '/api-docs.json', '/api/swagger.json',
        '/v1/swagger.json', '/v2/swagger.json',
        '/api/docs', '/api/documentation',
        '/.well-known/openapi.json'
      ]

      for (const path of apiDocPaths) {
        if (isTimeout()) break

        const docUrl = new URL(path, baseUrl).href

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 1000)

          const response = await fetch(docUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)'
            }
          })

          clearTimeout(timeout)

          if (response.ok) {
            const contentType = response.headers.get('content-type') || ''

            if (contentType.includes('json') || contentType.includes('yaml')) {
              findings.push({
                type: 'api-documentation',
                severity: 'medium',
                title: 'API documentation exposed',
                url: docUrl,
                format: contentType,
                impact: 'All API endpoints are enumerable by attackers',
                recommendation: 'Require authentication for API documentation or move to internal network only.'
              })
              break // Only report first finding
            }
          }
        } catch (error) {
          // Network errors ignored
        }
      }
    }

    // ===== 3.4 GraphQL Endpoint Discovery (FIFTH - network requests) =====
    if (!isTimeout()) {
      console.log('[AdminDiscovery] Checking for GraphQL endpoints...')

      const graphqlPaths = ['/graphql', '/api/graphql', '/v1/graphql', '/graphiql']

      for (const path of graphqlPaths) {
        if (isTimeout()) break

        const graphqlUrl = new URL(path, baseUrl).href

        // Try introspection query
        const introspectionQuery = {
          query: `{ __schema { types { name } } }`
        }

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 1500)

          const response = await fetch(graphqlUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)'
            },
            body: JSON.stringify(introspectionQuery),
            signal: controller.signal
          })

          clearTimeout(timeout)

          if (response.ok) {
            const data = await response.json()

            if (data.data && data.data.__schema) {
              // Introspection is enabled!
              findings.push({
                type: 'graphql-introspection',
                severity: 'high',
                title: 'GraphQL introspection enabled',
                url: graphqlUrl,
                typesCount: data.data.__schema.types.length,
                impact: 'Complete API schema exposed - attackers can enumerate all queries and mutations',
                recommendation: 'Disable introspection in production: set introspection: false in Apollo Server or equivalent.'
              })
              break
            }
          }
        } catch (error) {
          // Try GET method as fallback
          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 1000)

            const getResponse = await fetch(`${graphqlUrl}?query={__typename}`, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)'
              }
            })

            clearTimeout(timeout)

            if (getResponse.ok) {
              findings.push({
                type: 'graphql-endpoint',
                severity: 'medium',
                title: 'GraphQL endpoint found',
                url: graphqlUrl,
                impact: 'GraphQL endpoint exposed - may allow complex queries',
                recommendation: 'Review GraphQL security: disable introspection, implement query depth limiting, and add authentication.'
              })
              break
            }
          } catch (getError) {
            // Ignore - endpoint doesn't exist
          }
        }
      }
    }

  } catch (error) {
    console.error('[AdminDiscovery] Error during analysis:', error)
    // Continue with partial results
  }

  return {
    findings,
    hasAdminPanel,
    hasLoginForm,
    adminUrls,
    loginForms: loginFormCount
  }
}

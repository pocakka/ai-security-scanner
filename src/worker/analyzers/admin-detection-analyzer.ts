import { CrawlResult } from '../crawler-mock'

export interface AdminDetectionFinding {
  type: 'admin-panel' | 'login-form' | 'authentication' | 'management-interface'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  evidence?: string | string[]
  location?: string
  impact?: string
  recommendation: string
  metadata?: {
    paths?: string[]
    formAction?: string
    inputFields?: string[]
  }
}

export interface AdminDetectionResult {
  findings: AdminDetectionFinding[]
  hasAdminPanel: boolean
  hasLoginForm: boolean
  score: number
  summary: {
    adminPanels: number
    loginForms: number
    authEndpoints: number
  }
}

/**
 * Detects admin panels, login forms, and management interfaces
 */
export async function analyzeAdminDetection(crawlResult: CrawlResult): Promise<AdminDetectionResult> {
  const findings: AdminDetectionFinding[] = []
  const baseUrl = new URL(crawlResult.url)

  let hasAdminPanel = false
  let hasLoginForm = false
  let adminPanels = 0
  let loginForms = 0
  let authEndpoints = 0

  // 1. Check for common admin panel URLs
  const adminPaths = [
    '/admin',
    '/administrator',
    '/wp-admin',
    '/wp-login.php',
    '/admin.php',
    '/login',
    '/signin',
    '/dashboard',
    '/panel',
    '/cpanel',
    '/manager',
    '/management',
    '/backend',
    '/backoffice',
    '/control',
    '/controlpanel',
    '/adminpanel',
    '/admin-panel',
    '/webmaster',
    '/moderator',
    '/user/login',
    '/users/sign_in',
    '/auth/login',
    '/account/login',
    '/admin/login',
    '/admin/index',
    '/phpmyadmin',
    '/pma',
    '/mysql',
    '/myadmin',
    '/sqlmanager'
  ]

  console.log('[AdminDetection] Checking admin panel URLs...')

  for (const path of adminPaths) {
    try {
      const adminUrl = new URL(path, baseUrl).href
      const response = await fetch(adminUrl, {
        method: 'HEAD',
        redirect: 'manual', // Don't follow redirects
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)'
        }
      })

      // Check if admin panel exists (200, 301, 302, 401, 403 all indicate it exists)
      if (response.ok || [301, 302, 401, 403].includes(response.status)) {
        hasAdminPanel = true
        adminPanels++

        const severity = path.includes('phpmyadmin') || path.includes('mysql') ? 'high' : 'medium'

        findings.push({
          type: 'admin-panel',
          severity,
          title: `Admin panel detected at ${path}`,
          description: `Administrative interface found (HTTP ${response.status})`,
          evidence: adminUrl,
          location: path,
          impact: severity === 'high'
            ? 'Database management interface exposed, critical risk'
            : 'Admin panel exposed to public internet, vulnerable to brute force attacks',
          recommendation: severity === 'high'
            ? 'IMMEDIATELY restrict database management access to specific IPs only'
            : 'Implement IP whitelisting, 2FA, and rate limiting for admin access',
          metadata: {
            paths: [path]
          }
        })

        // Don't check too many to avoid being blocked
        if (adminPanels >= 3) break
      }
    } catch (error) {
      // Ignore fetch errors
    }
  }

  // 2. Check for login forms in HTML content
  if (crawlResult.html) {
    console.log('[AdminDetection] Analyzing HTML for login forms...')

    // Check for login forms
    const loginFormPatterns = [
      /<form[^>]*action=["'][^"']*login[^"']*["'][^>]*>/gi,
      /<form[^>]*action=["'][^"']*signin[^"']*["'][^>]*>/gi,
      /<form[^>]*action=["'][^"']*auth[^"']*["'][^>]*>/gi,
      /<form[^>]*id=["']loginForm["'][^>]*>/gi,
      /<form[^>]*class=["'][^"']*login[^"']*["'][^>]*>/gi
    ]

    for (const pattern of loginFormPatterns) {
      const matches = crawlResult.html.match(pattern)
      if (matches && matches.length > 0) {
        hasLoginForm = true
        loginForms++

        // Extract form action
        const actionMatch = matches[0].match(/action=["']([^"']+)["']/)
        const formAction = actionMatch ? actionMatch[1] : 'unknown'

        findings.push({
          type: 'login-form',
          severity: 'medium',
          title: 'Login form detected on main page',
          description: 'Authentication form found in HTML',
          evidence: matches[0].substring(0, 100) + '...',
          impact: 'Login forms are targets for credential stuffing and brute force attacks',
          recommendation: 'Implement CAPTCHA, rate limiting, and account lockout policies',
          metadata: {
            formAction: formAction
          }
        })
        break
      }
    }

    // Check for password input fields
    const passwordInputs = crawlResult.html.match(/<input[^>]*type=["']password["'][^>]*>/gi)
    if (passwordInputs && passwordInputs.length > 0 && !hasLoginForm) {
      hasLoginForm = true
      loginForms++

      findings.push({
        type: 'login-form',
        severity: 'low',
        title: 'Password input field detected',
        description: `Found ${passwordInputs.length} password input field(s)`,
        evidence: passwordInputs[0],
        impact: 'Password fields indicate authentication functionality',
        recommendation: 'Ensure proper security measures for authentication',
        metadata: {
          inputFields: ['password']
        }
      })
    }

    // Check for authentication keywords
    const authKeywords = [
      'Sign in',
      'Sign In',
      'Log in',
      'Log In',
      'Login',
      'Username',
      'Password',
      'Remember me',
      'Forgot password',
      'Create account',
      'Register'
    ]

    const foundKeywords = authKeywords.filter(keyword =>
      crawlResult.html.includes(keyword)
    )

    if (foundKeywords.length >= 3 && !hasLoginForm) {
      hasLoginForm = true
      findings.push({
        type: 'authentication',
        severity: 'low',
        title: 'Authentication interface indicators',
        description: `Found authentication-related keywords: ${foundKeywords.join(', ')}`,
        evidence: foundKeywords,
        impact: 'Public authentication interface detected',
        recommendation: 'Review authentication security measures'
      })
    }

    // Check for specific CMS admin interfaces
    const cmsPatterns = {
      'WordPress': /wp-login\.php|wp-admin/i,
      'Joomla': /administrator\/index\.php/i,
      'Drupal': /user\/login|admin\/config/i,
      'Magento': /admin|adminhtml/i,
      'PrestaShop': /admin\d+|adminps/i
    }

    for (const [cms, pattern] of Object.entries(cmsPatterns)) {
      if (pattern.test(crawlResult.html)) {
        findings.push({
          type: 'admin-panel',
          severity: 'medium',
          title: `${cms} admin interface detected`,
          description: `${cms} CMS administrative interface found`,
          evidence: `${cms} patterns in HTML`,
          impact: 'CMS admin panels are common targets for attacks',
          recommendation: `Secure ${cms} admin: change default URLs, add 2FA, restrict IP access`,
          metadata: {
            paths: cms === 'WordPress' ? ['/wp-admin', '/wp-login.php'] : [`/admin`]
          }
        })
        hasAdminPanel = true
        adminPanels++
        break
      }
    }
  }

  // 3. Check for API authentication endpoints
  if (crawlResult.networkRequests) {
    const authEndpointPatterns = [
      /\/api\/auth/i,
      /\/api\/login/i,
      /\/api\/signin/i,
      /\/api\/token/i,
      /\/oauth/i,
      /\/authenticate/i
    ]

    for (const request of crawlResult.networkRequests) {
      for (const pattern of authEndpointPatterns) {
        if (pattern.test(request.url)) {
          authEndpoints++
          findings.push({
            type: 'authentication',
            severity: 'low',
            title: 'API authentication endpoint detected',
            description: `Authentication API found: ${request.url}`,
            evidence: request.url,
            impact: 'API endpoints may be vulnerable to automated attacks',
            recommendation: 'Implement rate limiting and monitoring for API authentication',
            metadata: {
              paths: [new URL(request.url).pathname]
            }
          })
          break
        }
      }
    }
  }

  // Calculate score
  let score = 100

  findings.forEach(finding => {
    switch (finding.severity) {
      case 'critical':
        score -= 40
        break
      case 'high':
        score -= 25
        break
      case 'medium':
        score -= 15
        break
      case 'low':
        score -= 5
        break
    }
  })

  score = Math.max(0, score)

  return {
    findings,
    hasAdminPanel,
    hasLoginForm,
    score,
    summary: {
      adminPanels,
      loginForms,
      authEndpoints
    }
  }
}
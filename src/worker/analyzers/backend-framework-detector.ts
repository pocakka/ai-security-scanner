/**
 * Backend Framework Detector
 *
 * Detects server-side frameworks (PHP, Django, Flask, Express.js, Ruby on Rails, ASP.NET, Laravel)
 * and identifies security misconfigurations like debug mode, version disclosure, and outdated versions.
 *
 * CRITICAL DETECTIONS:
 * - Django debug mode (DEBUG = True)
 * - Flask Werkzeug debugger (REMOTE CODE EXECUTION)
 * - Laravel Ignition debug page (full config exposure)
 * - PHP error display (file paths, database info)
 *
 * @category backend-framework
 */

interface SecurityIssue {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
}

interface BackendFramework {
  name: string
  detected: boolean
  version?: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  securityIssues: SecurityIssue[]
}

export interface BackendFrameworkResult {
  detectedFrameworks: BackendFramework[]
  findings: Array<{
    type: string
    category: string
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    impact: string
    recommendation: string
    evidence?: string
  }>
  hasFramework: boolean
  primaryFramework?: string
}

interface DetectionPattern {
  type: 'header' | 'cookie' | 'html'
  match: RegExp
  confidence: 'low' | 'medium' | 'high'
}

interface SecurityCheck {
  name: string
  check: (version?: string, headers?: Record<string, string>, html?: string) => SecurityIssue | null
}

interface FrameworkDefinition {
  name: string
  patterns: DetectionPattern[]
  versionRegex?: RegExp
  securityChecks: SecurityCheck[]
}

const BACKEND_FRAMEWORKS: FrameworkDefinition[] = [
  // ==================== PHP ====================
  {
    name: 'PHP',
    patterns: [
      {
        type: 'header',
        match: /X-Powered-By:\s*PHP/i,
        confidence: 'high',
      },
      {
        type: 'header',
        match: /Server:.*PHP/i,
        confidence: 'medium',
      },
      {
        type: 'cookie',
        match: /PHPSESSID/i,
        confidence: 'high',
      },
      {
        type: 'html',
        match: /\.php(\?|"|'|$)/i,
        confidence: 'medium',
      },
    ],
    versionRegex: /PHP[\/\s](\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'php_version_disclosure',
        check: (version?: string, headers?: Record<string, string>) => {
          if (version) {
            return {
              severity: 'low',
              title: 'PHP Version Disclosure',
              description: `PHP version ${version} is exposed in response headers.`,
              impact: 'Attackers can identify the exact PHP version and search for known vulnerabilities (CVEs) specific to this version. Version disclosure aids in reconnaissance and targeted attacks.',
              recommendation: 'Disable PHP version disclosure by adding "expose_php = Off" in php.ini. Remove or modify the X-Powered-By header in web server configuration.',
              evidence: version,
            }
          }
          return null
        },
      },
      {
        name: 'php_outdated',
        check: (version?: string) => {
          if (!version) return null
          const [major, minor] = version.split('.').map(Number)
          // PHP < 8.0 is outdated (as of 2025)
          if (major < 8) {
            return {
              severity: 'high',
              title: 'Outdated PHP Version',
              description: `PHP ${version} is outdated and may contain known security vulnerabilities.`,
              impact: 'Outdated PHP versions have known CVEs (Common Vulnerabilities and Exposures) that attackers can exploit. PHP 7.x reached end-of-life and no longer receives security updates.',
              recommendation: `Upgrade to PHP 8.2 or higher. Review migration guide at https://www.php.net/migration82. Test thoroughly before production deployment.`,
              evidence: version,
            }
          }
          // PHP 8.0-8.1 - recommend upgrade
          if (major === 8 && minor < 2) {
            return {
              severity: 'medium',
              title: 'PHP Version Should Be Updated',
              description: `PHP ${version} should be updated to the latest stable version.`,
              impact: 'While still receiving security updates, newer PHP versions (8.2+) include performance improvements and additional security features.',
              recommendation: `Consider upgrading to PHP 8.2 or higher for improved security and performance.`,
              evidence: version,
            }
          }
          return null
        },
      },
      {
        name: 'php_display_errors',
        check: (version?: string, headers?: Record<string, string>, html?: string) => {
          // Check for PHP error messages in HTML
          if (html && /PHP (Warning|Notice|Error|Fatal error):/i.test(html)) {
            return {
              severity: 'high',
              title: 'PHP Error Display Enabled',
              description: 'PHP error messages are displayed in responses, revealing sensitive information.',
              impact: 'Exposed PHP errors reveal file paths, database structure, function names, and application logic. This information helps attackers map the application architecture and identify vulnerabilities.',
              recommendation: 'Set "display_errors = Off" and "log_errors = On" in php.ini. Implement custom error pages for production. Log errors to secure files instead of displaying them.',
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Django ====================
  {
    name: 'Django',
    patterns: [
      {
        type: 'cookie',
        match: /csrftoken/i,
        confidence: 'high',
      },
      {
        type: 'cookie',
        match: /sessionid/i,
        confidence: 'medium',
      },
      {
        type: 'html',
        match: /csrfmiddlewaretoken/i,
        confidence: 'high',
      },
      {
        type: 'html',
        match: /django/i,
        confidence: 'low',
      },
    ],
    versionRegex: /Django[\/\s](\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'django_debug_mode',
        check: (version?: string, headers?: Record<string, string>, html?: string) => {
          // Check for Django debug mode indicators
          if (html && /DEBUG\s*=\s*True/i.test(html)) {
            return {
              severity: 'critical',
              title: 'Django Debug Mode Enabled',
              description: 'Django is running in DEBUG mode in production environment.',
              impact: 'DEBUG mode exposes extensive system information including: all settings (SECRET_KEY, database credentials), full stack traces, SQL queries, file paths, installed apps, middleware, and environment variables. This is a CRITICAL security vulnerability.',
              recommendation: 'Set DEBUG = False in settings.py for production. Use environment variables for configuration. Implement proper logging and error handling. Never deploy with DEBUG = True.',
            }
          }
          // Check for Django debug toolbar
          if (html && /django-debug-toolbar|djDebug/i.test(html)) {
            return {
              severity: 'critical',
              title: 'Django Debug Toolbar Enabled in Production',
              description: 'Django Debug Toolbar is active in production, exposing sensitive debug information.',
              impact: 'The debug toolbar reveals all SQL queries, template context, cache operations, signals, and application settings. Attackers can extract database schema, query patterns, and sensitive configuration.',
              recommendation: 'Remove django-debug-toolbar from INSTALLED_APPS in production settings. Use conditional installation based on DEBUG flag.',
            }
          }
          return null
        },
      },
      {
        name: 'django_version_disclosure',
        check: (version?: string) => {
          if (version) {
            return {
              severity: 'low',
              title: 'Django Version Disclosure',
              description: `Django version ${version} is exposed.`,
              impact: 'Django version disclosure helps attackers identify known vulnerabilities specific to this version.',
              recommendation: 'While Django version detection is difficult to prevent entirely, ensure you are running the latest security updates.',
              evidence: version,
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Flask ====================
  {
    name: 'Flask',
    patterns: [
      {
        type: 'header',
        match: /Server:.*Werkzeug/i,
        confidence: 'high',
      },
      {
        type: 'cookie',
        match: /session=/i,
        confidence: 'medium',
      },
      {
        type: 'html',
        match: /flask/i,
        confidence: 'low',
      },
    ],
    versionRegex: /Werkzeug[\/\s](\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'flask_werkzeug_debugger',
        check: (version?: string, headers?: Record<string, string>, html?: string) => {
          // Check for Werkzeug debugger
          if (html && /Werkzeug Debugger|debugger__title|__debugger__|PIN:/i.test(html)) {
            return {
              severity: 'critical',
              title: 'Flask Werkzeug Debugger Exposed',
              description: 'Werkzeug interactive debugger is enabled in production.',
              impact: 'The Werkzeug debugger allows REMOTE CODE EXECUTION. Attackers can execute arbitrary Python code on the server, read files, access environment variables, dump memory, and completely compromise the application. This is one of the most critical Flask vulnerabilities.',
              recommendation: 'IMMEDIATELY disable debug mode by setting app.debug = False or FLASK_DEBUG=0. Never run Flask with debug=True in production. Use proper WSGI server (Gunicorn, uWSGI) instead of Flask development server.',
            }
          }
          // Check for Flask debug mode
          if (html && /app\.run\(debug=True\)|FLASK_DEBUG=1/i.test(html)) {
            return {
              severity: 'critical',
              title: 'Flask Debug Mode Enabled',
              description: 'Flask is running in debug mode in production.',
              impact: 'Debug mode enables auto-reloader, interactive debugger, and detailed error pages revealing source code, file paths, and application structure.',
              recommendation: 'Set FLASK_DEBUG=0 and app.debug=False. Use production WSGI server.',
            }
          }
          return null
        },
      },
      {
        name: 'flask_dev_server',
        check: (version?: string, headers?: Record<string, string>) => {
          if (headers && /Werkzeug/i.test(headers['server'] || '')) {
            return {
              severity: 'high',
              title: 'Flask Development Server in Production',
              description: 'Application is running on Flask development server (Werkzeug).',
              impact: 'Flask development server is not designed for production use. It lacks security features, proper concurrency handling, and performance optimizations. It is vulnerable to DoS attacks.',
              recommendation: 'Deploy with production WSGI server: Gunicorn (gunicorn app:app), uWSGI, or Waitress. Use reverse proxy (Nginx, Apache) in front of WSGI server.',
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Express.js ====================
  {
    name: 'Express.js',
    patterns: [
      {
        type: 'header',
        match: /X-Powered-By:.*Express/i,
        confidence: 'high',
      },
      {
        type: 'cookie',
        match: /connect\.sid/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Express[\/\s](\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'express_powered_by',
        check: (version?: string, headers?: Record<string, string>) => {
          if (headers && /X-Powered-By.*Express/i.test(headers['x-powered-by'] || '')) {
            return {
              severity: 'low',
              title: 'Express.js X-Powered-By Header Disclosed',
              description: 'Express.js version is exposed via X-Powered-By header.',
              impact: 'Framework disclosure helps attackers identify the technology stack and search for framework-specific vulnerabilities.',
              recommendation: 'Disable X-Powered-By header with app.disable("x-powered-by") or use helmet.js middleware: app.use(helmet.hidePoweredBy()).',
              evidence: headers['x-powered-by'],
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Ruby on Rails ====================
  {
    name: 'Ruby on Rails',
    patterns: [
      {
        type: 'cookie',
        match: /_session_id|_.*_session/i,
        confidence: 'medium',
      },
      {
        type: 'html',
        match: /csrf-token/i,
        confidence: 'medium',
      },
      {
        type: 'html',
        match: /rails-ujs|data-turbolinks/i,
        confidence: 'high',
      },
      {
        type: 'header',
        match: /X-Request-Id/i,
        confidence: 'low',
      },
    ],
    versionRegex: /Rails[\/\s](\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'rails_version_disclosure',
        check: (version?: string) => {
          if (version) {
            return {
              severity: 'medium',
              title: 'Ruby on Rails Version Disclosure',
              description: `Rails version ${version} is exposed.`,
              impact: 'Rails version disclosure enables targeted attacks against known vulnerabilities in specific versions.',
              recommendation: 'Keep Rails updated to latest security patches. Monitor Rails security mailing list.',
              evidence: version,
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== ASP.NET ====================
  {
    name: 'ASP.NET',
    patterns: [
      {
        type: 'header',
        match: /X-AspNet-Version/i,
        confidence: 'high',
      },
      {
        type: 'header',
        match: /X-Powered-By:.*ASP\.NET/i,
        confidence: 'high',
      },
      {
        type: 'cookie',
        match: /ASP\.NET_SessionId/i,
        confidence: 'high',
      },
      {
        type: 'html',
        match: /__VIEWSTATE/i,
        confidence: 'high',
      },
    ],
    versionRegex: /X-AspNet-Version:\s*(\d+\.\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'aspnet_version_disclosure',
        check: (version?: string, headers?: Record<string, string>) => {
          if (headers && headers['x-aspnet-version']) {
            return {
              severity: 'medium',
              title: 'ASP.NET Version Disclosure',
              description: 'ASP.NET version is exposed via X-AspNet-Version header.',
              impact: 'Version disclosure reveals the exact .NET framework version, helping attackers identify known vulnerabilities and exploits.',
              recommendation: 'Remove X-AspNet-Version header by adding <httpRuntime enableVersionHeader="false" /> in Web.config. Also remove X-Powered-By header.',
              evidence: headers['x-aspnet-version'],
            }
          }
          return null
        },
      },
      {
        name: 'viewstate_encryption',
        check: (version?: string, headers?: Record<string, string>, html?: string) => {
          if (html && /__VIEWSTATE/i.test(html)) {
            return {
              severity: 'medium',
              title: 'ASP.NET ViewState Detected',
              description: 'ViewState is present in HTML responses.',
              impact: 'If ViewState is not encrypted or MAC-protected, attackers can tamper with application state, inject malicious data, or extract sensitive information.',
              recommendation: 'Ensure ViewState encryption is enabled: <pages enableViewStateMac="true" viewStateEncryptionMode="Always" /> in Web.config. Use machineKey validation.',
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Laravel ====================
  {
    name: 'Laravel',
    patterns: [
      {
        type: 'cookie',
        match: /laravel_session/i,
        confidence: 'high',
      },
      {
        type: 'cookie',
        match: /XSRF-TOKEN/i,
        confidence: 'medium',
      },
      {
        type: 'html',
        match: /laravel/i,
        confidence: 'low',
      },
    ],
    versionRegex: /Laravel[\/\s]v?(\d+\.\d+)/i,
    securityChecks: [
      {
        name: 'laravel_debug_mode',
        check: (version?: string, headers?: Record<string, string>, html?: string) => {
          // Check for Laravel debug mode (Ignition error page)
          if (html && /Ignition|Laravel\s*\n\s*Ignition|flare/i.test(html)) {
            return {
              severity: 'critical',
              title: 'Laravel Debug Mode Enabled (Ignition)',
              description: 'Laravel Ignition debug page is exposed in production.',
              impact: 'Ignition debug page reveals: full stack traces, environment variables, database queries, configuration values, file paths, and application secrets. APP_KEY and database credentials may be exposed.',
              recommendation: 'Set APP_DEBUG=false in .env file. Ensure APP_ENV=production. Remove Ignition from production dependencies or disable via config/ignition.php.',
            }
          }
          // Check for APP_DEBUG=true in HTML
          if (html && /APP_DEBUG.*true/i.test(html)) {
            return {
              severity: 'critical',
              title: 'Laravel APP_DEBUG Enabled',
              description: 'Laravel is running with APP_DEBUG=true in production.',
              impact: 'Debug mode exposes sensitive application details, database credentials, and internal logic.',
              recommendation: 'Set APP_DEBUG=false in .env file immediately.',
            }
          }
          return null
        },
      },
      {
        name: 'laravel_app_key',
        check: (version?: string, headers?: Record<string, string>, html?: string) => {
          // Check for exposed APP_KEY in HTML/JS (should NEVER happen but worth checking)
          if (html && /APP_KEY|application\.key/i.test(html)) {
            const keyMatch = html.match(/APP_KEY\s*=\s*['"]?([^'">\s]+)/i)
            if (keyMatch && keyMatch[1] && keyMatch[1].startsWith('base64:')) {
              return {
                severity: 'critical',
                title: 'Laravel APP_KEY Exposed',
                description: 'Laravel application encryption key (APP_KEY) is exposed in client-side code.',
                impact: 'The APP_KEY is used for encrypting sessions, cookies, and sensitive data. With the APP_KEY, attackers can decrypt session data, forge session cookies, and gain unauthorized access to user accounts.',
                recommendation: 'IMMEDIATELY rotate APP_KEY (php artisan key:generate). Invalidate all user sessions. Never expose APP_KEY in HTML/JavaScript. Review code for how this leaked.',
                evidence: 'APP_KEY found in HTML',
              }
            }
          }
          return null
        },
      },
    ],
  },
]

export async function analyzeBackendFramework(
  html: string,
  headers: Record<string, string>,
  cookies: any[]
): Promise<BackendFrameworkResult> {
  const detectedFrameworks: BackendFramework[] = []
  const findings: BackendFrameworkResult['findings'] = []

  // Normalize headers for case-insensitive matching
  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key]
  })

  // Check each framework
  for (const framework of BACKEND_FRAMEWORKS) {
    const evidence: string[] = []
    let detected = false
    let confidence: 'low' | 'medium' | 'high' = 'low'
    let version: string | undefined

    // Check patterns
    for (const pattern of framework.patterns) {
      let matchFound = false

      switch (pattern.type) {
        case 'header':
          for (const [headerName, headerValue] of Object.entries(normalizedHeaders)) {
            const combined = `${headerName}: ${headerValue}`
            if (pattern.match.test(combined)) {
              evidence.push(`Header: ${headerName}`)
              matchFound = true
              detected = true
              if (pattern.confidence === 'high') confidence = 'high'
              else if (pattern.confidence === 'medium' && confidence !== 'high') confidence = 'medium'
            }
          }
          break

        case 'cookie':
          for (const cookie of cookies) {
            if (pattern.match.test(cookie.name || '')) {
              evidence.push(`Cookie: ${cookie.name}`)
              matchFound = true
              detected = true
              if (pattern.confidence === 'high') confidence = 'high'
              else if (pattern.confidence === 'medium' && confidence !== 'high') confidence = 'medium'
            }
          }
          break

        case 'html':
          if (pattern.match.test(html)) {
            evidence.push('HTML content')
            matchFound = true
            detected = true
            // HTML matches are generally lower confidence unless specified
            if (pattern.confidence === 'high') confidence = 'high'
          }
          break
      }

      // Try to extract version
      if (matchFound && framework.versionRegex && !version) {
        const headerString = Object.entries(normalizedHeaders)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
        const versionMatch =
          headerString.match(framework.versionRegex) ||
          html.match(framework.versionRegex)

        if (versionMatch && versionMatch[1]) {
          version = versionMatch[1]
          evidence.push(`Version: ${version}`)
        }
      }
    }

    if (detected) {
      // Run security checks
      const securityIssues: SecurityIssue[] = []

      for (const securityCheck of framework.securityChecks || []) {
        const issue = securityCheck.check(version, normalizedHeaders, html)
        if (issue) {
          securityIssues.push(issue)
          findings.push({
            type: `backend-framework-${securityCheck.name}`,
            category: 'backend-framework',
            ...issue,
          })
        }
      }

      detectedFrameworks.push({
        name: framework.name,
        detected: true,
        version,
        confidence,
        evidence,
        securityIssues,
      })
    }
  }

  // Determine primary framework (highest confidence)
  let primaryFramework: string | undefined
  if (detectedFrameworks.length > 0) {
    const sorted = [...detectedFrameworks].sort((a, b) => {
      const confMap = { high: 3, medium: 2, low: 1 }
      return confMap[b.confidence] - confMap[a.confidence]
    })
    primaryFramework = sorted[0].name
  }

  return {
    detectedFrameworks,
    findings,
    hasFramework: detectedFrameworks.length > 0,
    primaryFramework,
  }
}

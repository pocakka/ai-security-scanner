# Complete Development Specification
## New Security Analyzers Implementation
**Sprint #10-12 - All Features**
**Date:** 2025-11-15

---

## Table of Contents

1. [Backend Framework Detector](#1-backend-framework-detector)
2. [Web Server Security Analyzer](#2-web-server-security-analyzer)
3. [Frontend Framework Security](#3-frontend-framework-security)
4. [JavaScript Library CVE Mapping](#4-javascript-library-cve-mapping)
5. [Passive API Discovery](#5-passive-api-discovery)
6. [Integration Guide](#6-integration-guide)
7. [Testing Strategy](#7-testing-strategy)

---

## 1. Backend Framework Detector

### 1.1 Overview

**File:** `src/worker/analyzers/backend-framework-detector.ts`

**Purpose:** Detect server-side frameworks (PHP, Django, Flask, Express.js, Ruby on Rails, ASP.NET, Laravel) and identify security misconfigurations like debug mode, version disclosure, and outdated versions.

**Report Category:**
```typescript
'backend-framework': {
  icon: '⚙️',
  title: 'Backend Framework Security',
  description: 'Server-side framework detection and security checks',
  explanation: 'Backend frameworks (PHP, Django, Flask, Express, Rails, ASP.NET) power server-side logic. Debug modes expose sensitive system information, outdated versions contain known vulnerabilities, and version disclosure helps attackers craft targeted exploits.',
}
```

---

### 1.2 Detection Patterns

```typescript
// src/worker/analyzers/backend-framework-detector.ts

interface BackendFramework {
  name: string
  detected: boolean
  version?: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  securityIssues: SecurityIssue[]
}

interface SecurityIssue {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
}

const BACKEND_FRAMEWORKS = [
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
              severity: 'low' as const,
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
              severity: 'high' as const,
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
              severity: 'medium' as const,
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
              severity: 'high' as const,
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
              severity: 'critical' as const,
              title: 'Django Debug Mode Enabled',
              description: 'Django is running in DEBUG mode in production environment.',
              impact: 'DEBUG mode exposes extensive system information including: all settings (SECRET_KEY, database credentials), full stack traces, SQL queries, file paths, installed apps, middleware, and environment variables. This is a CRITICAL security vulnerability.',
              recommendation: 'Set DEBUG = False in settings.py for production. Use environment variables for configuration. Implement proper logging and error handling. Never deploy with DEBUG = True.',
            }
          }
          // Check for Django debug toolbar
          if (html && /django-debug-toolbar|djDebug/i.test(html)) {
            return {
              severity: 'critical' as const,
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
              severity: 'low' as const,
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
              severity: 'critical' as const,
              title: 'Flask Werkzeug Debugger Exposed',
              description: 'Werkzeug interactive debugger is enabled in production.',
              impact: 'The Werkzeug debugger allows REMOTE CODE EXECUTION. Attackers can execute arbitrary Python code on the server, read files, access environment variables, dump memory, and completely compromise the application. This is one of the most critical Flask vulnerabilities.',
              recommendation: 'IMMEDIATELY disable debug mode by setting app.debug = False or FLASK_DEBUG=0. Never run Flask with debug=True in production. Use proper WSGI server (Gunicorn, uWSGI) instead of Flask development server.',
            }
          }
          // Check for Flask debug mode
          if (html && /app\.run\(debug=True\)|FLASK_DEBUG=1/i.test(html)) {
            return {
              severity: 'critical' as const,
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
              severity: 'high' as const,
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
              severity: 'low' as const,
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
              severity: 'medium' as const,
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
              severity: 'medium' as const,
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
            // Check if ViewState appears to be encrypted (should start with encrypted base64, not plain)
            const viewStateMatch = html.match(/__VIEWSTATE.*?value="([^"]+)"/i)
            if (viewStateMatch && viewStateMatch[1]) {
              // Unencrypted ViewState typically decodes to readable XML
              // This is a simplified check - in production would need base64 decode + analysis
              return {
                severity: 'medium' as const,
                title: 'ASP.NET ViewState Detected',
                description: 'ViewState is present in HTML responses.',
                impact: 'If ViewState is not encrypted or MAC-protected, attackers can tamper with application state, inject malicious data, or extract sensitive information.',
                recommendation: 'Ensure ViewState encryption is enabled: <pages enableViewStateMac="true" viewStateEncryptionMode="Always" /> in Web.config. Use machineKey validation.',
              }
            }
          }
          return null
        },
      },
    ],
  },
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
              severity: 'critical' as const,
              title: 'Laravel Debug Mode Enabled (Ignition)',
              description: 'Laravel Ignition debug page is exposed in production.',
              impact: 'Ignition debug page reveals: full stack traces, environment variables, database queries, configuration values, file paths, and application secrets. APP_KEY and database credentials may be exposed.',
              recommendation: 'Set APP_DEBUG=false in .env file. Ensure APP_ENV=production. Remove Ignition from production dependencies or disable via config/ignition.php.',
            }
          }
          // Check for APP_DEBUG=true in HTML
          if (html && /APP_DEBUG.*true/i.test(html)) {
            return {
              severity: 'critical' as const,
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
                severity: 'critical' as const,
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
```

---

### 1.3 Implementation

```typescript
// src/worker/analyzers/backend-framework-detector.ts

export interface BackendFrameworkResult {
  detectedFrameworks: BackendFramework[]
  findings: SecurityIssue[]
  hasFramework: boolean
  primaryFramework?: string
}

export async function analyzeBackendFramework(
  html: string,
  headers: Record<string, string>,
  cookies: any[]
): Promise<BackendFrameworkResult> {
  const detectedFrameworks: BackendFramework[] = []
  const findings: SecurityIssue[] = []

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
          findings.push(issue)
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
```

---

## 2. Web Server Security Analyzer

### 2.1 Overview

**File:** `src/worker/analyzers/web-server-security-analyzer.ts`

**Purpose:** Detect web server (Nginx, Apache, IIS, LiteSpeed, Caddy) and analyze version disclosure, outdated versions, and security configurations.

**Report Category:**
```typescript
'web-server': {
  icon: '🖥️',
  title: 'Web Server Security',
  description: 'Web server configuration and version analysis',
  explanation: 'Web servers (Nginx, Apache, IIS) are the first line of defense. Exposed versions reveal exploitable CVEs, disclosed modules show attack surface, and outdated servers contain known security flaws. Server tokens should be hidden in production.',
}
```

---

### 2.2 Detection Patterns

```typescript
// src/worker/analyzers/web-server-security-analyzer.ts

interface WebServer {
  name: string
  detected: boolean
  version?: string
  modules?: string[]
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  securityIssues: SecurityIssue[]
}

const WEB_SERVERS = [
  {
    name: 'Nginx',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*nginx/i,
        confidence: 'high',
      },
    ],
    versionRegex: /nginx\/(\d+\.\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'nginx_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low' as const,
              title: 'Nginx Version Disclosure',
              description: `Nginx version ${version} is exposed in Server header.`,
              impact: 'Server version disclosure helps attackers identify specific vulnerabilities (CVEs) for this Nginx version. This information aids in reconnaissance and targeted attacks.',
              recommendation: 'Hide Nginx version by adding "server_tokens off;" in nginx.conf http block. This will display only "nginx" without version number.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
      {
        name: 'nginx_outdated',
        check: (version?: string) => {
          if (!version) return null
          const [major, minor] = version.split('.').map(Number)
          // Nginx < 1.20 is outdated (as of 2025)
          if (major < 1 || (major === 1 && minor < 20)) {
            return {
              severity: 'high' as const,
              title: 'Outdated Nginx Version',
              description: `Nginx ${version} is outdated and may contain known vulnerabilities.`,
              impact: 'Outdated Nginx versions have known CVEs that attackers can exploit. Security patches are not available for old versions. Known vulnerabilities include request smuggling, buffer overflows, and DoS attacks.',
              recommendation: `Upgrade to Nginx 1.24+ (stable) or 1.25+ (mainline). Review changelog for breaking changes. Test in staging before production deployment.`,
              evidence: version,
            }
          }
          // Nginx 1.20-1.23 - recommend upgrade
          if (major === 1 && minor >= 20 && minor < 24) {
            return {
              severity: 'medium' as const,
              title: 'Nginx Version Should Be Updated',
              description: `Nginx ${version} should be updated to the latest stable version.`,
              impact: 'While still receiving security updates, newer Nginx versions include performance improvements and additional security features.',
              recommendation: `Consider upgrading to Nginx 1.24+ for latest security patches and features.`,
              evidence: version,
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'Apache',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*Apache/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Apache\/(\d+\.\d+\.?\d*)/i,
    modulesRegex: /\(([^)]+)\)/g, // Extract modules from "Apache/2.4.41 (Ubuntu) OpenSSL/1.1.1"
    securityChecks: [
      {
        name: 'apache_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low' as const,
              title: 'Apache Version Disclosure',
              description: `Apache version ${version} is exposed in Server header.`,
              impact: 'Apache version disclosure enables attackers to search for version-specific CVEs and known exploits.',
              recommendation: 'Hide Apache version by setting "ServerTokens Prod" and "ServerSignature Off" in apache2.conf or httpd.conf. This will display only "Apache" without version.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
      {
        name: 'apache_module_disclosure',
        check: (version?: string, serverHeader?: string, modules?: string[]) => {
          if (modules && modules.length > 0) {
            return {
              severity: 'medium' as const,
              title: 'Apache Modules Disclosed',
              description: `Apache modules/OS information is exposed: ${modules.join(', ')}`,
              impact: 'Module and OS disclosure reveals the attack surface. Attackers can identify vulnerable modules (e.g., mod_php, OpenSSL versions) and target specific exploits.',
              recommendation: 'Set "ServerTokens Prod" to hide module information. Review exposed modules for known vulnerabilities.',
              evidence: modules.join(', '),
            }
          }
          return null
        },
      },
      {
        name: 'apache_outdated',
        check: (version?: string) => {
          if (!version) return null
          const [major, minor] = version.split('.').map(Number)
          // Apache < 2.4 is very outdated
          if (major < 2 || (major === 2 && minor < 4)) {
            return {
              severity: 'high' as const,
              title: 'Severely Outdated Apache Version',
              description: `Apache ${version} is severely outdated (Apache 2.4 released in 2012).`,
              impact: 'Apache 2.2 and older contain numerous known CVEs and are no longer supported. Critical vulnerabilities include remote code execution, privilege escalation, and DoS.',
              recommendation: `Upgrade to Apache 2.4.58+ immediately. Review migration guide at https://httpd.apache.org/docs/2.4/upgrading.html`,
              evidence: version,
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'IIS',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*Microsoft-IIS/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Microsoft-IIS\/(\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'iis_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'medium' as const,
              title: 'IIS Version Disclosure',
              description: `Microsoft IIS version ${version} is exposed in Server header.`,
              impact: 'IIS version disclosure reveals the Windows Server version and enables targeted attacks against known IIS vulnerabilities.',
              recommendation: 'Remove Server header using URL Rewrite module or custom HTTP headers. Add <requestFiltering removeServerHeader="true" /> in web.config.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'LiteSpeed',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*LiteSpeed/i,
        confidence: 'high',
      },
    ],
    versionRegex: /LiteSpeed\/(\d+\.\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'litespeed_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low' as const,
              title: 'LiteSpeed Version Disclosure',
              description: `LiteSpeed version ${version} is exposed.`,
              impact: 'Version disclosure helps attackers identify vulnerabilities specific to this LiteSpeed version.',
              recommendation: 'Hide server signature in LiteSpeed Web Admin Console: Server > General > Server Signature > Hide.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'Caddy',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*Caddy/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Caddy\/v?(\d+\.\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'caddy_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low' as const,
              title: 'Caddy Version Disclosure',
              description: `Caddy version ${version} is exposed.`,
              impact: 'Version disclosure aids in identifying known vulnerabilities.',
              recommendation: 'Hide server header in Caddyfile: "header / { -Server }" or disable server tokens.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
    ],
  },
]
```

---

### 2.3 Implementation

```typescript
export interface WebServerResult {
  detectedServers: WebServer[]
  findings: SecurityIssue[]
  hasServer: boolean
  primaryServer?: string
}

export async function analyzeWebServer(
  headers: Record<string, string>
): Promise<WebServerResult> {
  const detectedServers: WebServer[] = []
  const findings: SecurityIssue[] = []

  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key]
  })

  const serverHeader = normalizedHeaders['server'] || ''

  for (const server of WEB_SERVERS) {
    const evidence: string[] = []
    let detected = false
    let confidence: 'low' | 'medium' | 'high' = 'low'
    let version: string | undefined
    let modules: string[] = []

    // Check patterns
    for (const pattern of server.patterns) {
      if (pattern.type === 'header' && pattern.match.test(serverHeader)) {
        evidence.push(`Server header: ${serverHeader}`)
        detected = true
        confidence = pattern.confidence
      }
    }

    if (detected) {
      // Extract version
      if (server.versionRegex) {
        const versionMatch = serverHeader.match(server.versionRegex)
        if (versionMatch && versionMatch[1]) {
          version = versionMatch[1]
          evidence.push(`Version: ${version}`)
        }
      }

      // Extract modules (Apache)
      if (server.modulesRegex) {
        const moduleMatches = [...serverHeader.matchAll(server.modulesRegex)]
        modules = moduleMatches.map(match => match[1]).filter(m => m && m !== version)
        if (modules.length > 0) {
          evidence.push(`Modules: ${modules.join(', ')}`)
        }
      }

      // Run security checks
      const securityIssues: SecurityIssue[] = []

      for (const securityCheck of server.securityChecks || []) {
        const issue = securityCheck.check(version, serverHeader, modules)
        if (issue) {
          securityIssues.push(issue)
          findings.push(issue)
        }
      }

      detectedServers.push({
        name: server.name,
        detected: true,
        version,
        modules: modules.length > 0 ? modules : undefined,
        confidence,
        evidence,
        securityIssues,
      })
    }
  }

  let primaryServer: string | undefined
  if (detectedServers.length > 0) {
    primaryServer = detectedServers[0].name
  }

  return {
    detectedServers,
    findings,
    hasServer: detectedServers.length > 0,
    primaryServer,
  }
}
```

---

## 3. Frontend Framework Security

### 3.1 Overview

**Enhancement to existing:** `src/worker/analyzers/tech-stack-analyzer.ts`

**Purpose:** Detect React, Vue, Angular, Svelte, Alpine.js and check for dev mode, DevTools, source maps exposure.

**Integration:** Extend existing `framework` category in tech stack

---

### 3.2 Enhanced Patterns

```typescript
// Addition to tech-detection-rules.ts or new frontend-framework-detector.ts

const FRONTEND_FRAMEWORKS_SECURITY = [
  {
    name: 'React',
    detection: {
      patterns: [
        { type: 'script', match: /react.*\.js/i },
        { type: 'html', match: /data-reactroot|__REACT_/i },
        { type: 'js-global', match: /window\.React/i },
      ],
      version: /react@(\d+\.\d+\.\d+)|React\.version\s*=\s*['"](\d+\.\d+\.\d+)['"]/i,
    },
    securityChecks: [
      {
        name: 'react_devtools',
        check: (html: string, scripts: string[]) => {
          const allScripts = scripts.join('\n')
          if (
            /__REACT_DEVTOOLS_GLOBAL_HOOK__/i.test(html) ||
            /__REACT_DEVTOOLS_GLOBAL_HOOK__/i.test(allScripts)
          ) {
            return {
              severity: 'medium' as const,
              title: 'React DevTools Detected in Production',
              description: 'React DevTools hooks are present in production build.',
              impact: 'DevTools allow inspection of component state, props, and hooks in browser. Attackers can view sensitive data flow, component logic, and application structure. This reveals business logic and potential security flaws.',
              recommendation: 'Ensure production builds use "react-scripts build" or Next.js production mode. Set NODE_ENV=production. Remove DevTools extension detector or build with production React.',
            }
          }
          return null
        },
      },
      {
        name: 'react_sourcemaps',
        check: (html: string, scripts: string[]) => {
          for (const scriptUrl of scripts) {
            if (/\.js\.map$/i.test(scriptUrl)) {
              return {
                severity: 'medium' as const,
                title: 'React Source Maps Exposed',
                description: 'JavaScript source maps (.js.map files) are accessible in production.',
                impact: 'Source maps expose your original React source code, including comments, variable names, business logic, API endpoints, and internal implementation. Attackers can reverse-engineer the entire application.',
                recommendation: 'Disable source maps in production: Set "GENERATE_SOURCEMAP=false" for Create React App, or "productionSourceMap: false" in Next.js config.',
              }
            }
          }
          return null
        },
      },
      {
        name: 'react_dev_bundle',
        check: (html: string, scripts: string[]) => {
          for (const scriptUrl of scripts) {
            if (/react.*\.development\./i.test(scriptUrl)) {
              return {
                severity: 'high' as const,
                title: 'React Development Bundle in Production',
                description: 'React development build is used in production environment.',
                impact: 'Development builds are larger, slower, and include debugging code with detailed error messages that reveal application internals. This degrades performance and exposes internal logic.',
                recommendation: 'Use production build: "npm run build" for CRA, "next build" for Next.js. Ensure NODE_ENV=production.',
              }
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'Vue.js',
    detection: {
      patterns: [
        { type: 'script', match: /vue.*\.js/i },
        { type: 'html', match: /v-cloak|v-if|v-for|v-bind/i },
        { type: 'js-global', match: /window\.Vue/i },
      ],
      version: /vue@(\d+\.\d+\.\d+)|Vue\.version\s*=\s*['"](\d+\.\d+\.\d+)['"]/i,
    },
    securityChecks: [
      {
        name: 'vue_devtools',
        check: (html: string, scripts: string[]) => {
          const allScripts = scripts.join('\n')
          if (
            /__VUE_DEVTOOLS_GLOBAL_HOOK__/i.test(html) ||
            /__VUE_DEVTOOLS_GLOBAL_HOOK__/i.test(allScripts) ||
            /devtools:\s*true/i.test(allScripts)
          ) {
            return {
              severity: 'medium' as const,
              title: 'Vue DevTools Enabled in Production',
              description: 'Vue DevTools are active in production build.',
              impact: 'Vue DevTools expose component data, Vuex store state, router information, and events. Attackers can inspect sensitive application state and user data.',
              recommendation: 'Set "productionTip: false" and ensure production build mode. Use "npm run build" for Vite/Vue CLI. Check vue.config.js for development-only settings.',
            }
          }
          return null
        },
      },
      {
        name: 'vue_dev_mode',
        check: (html: string, scripts: string[]) => {
          const allScripts = scripts.join('\n')
          if (/Vue\.config\.devtools\s*=\s*true/i.test(allScripts)) {
            return {
              severity: 'high' as const,
              title: 'Vue Development Mode Active',
              description: 'Vue is running in development mode in production.',
              impact: 'Development mode includes debugging features, performance monitoring, and detailed warnings that reveal application internals.',
              recommendation: 'Remove "Vue.config.devtools = true" from code. Use production build commands.',
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'Angular',
    detection: {
      patterns: [
        { type: 'script', match: /angular.*\.js|@angular/i },
        { type: 'html', match: /ng-version|_nghost|_ngcontent/i },
        { type: 'js-global', match: /window\.ng/i },
      ],
      version: /ng-version="(\d+\.\d+\.\d+)"/i,
    },
    securityChecks: [
      {
        name: 'angular_version_disclosure',
        check: (html: string) => {
          const versionMatch = html.match(/ng-version="(\d+\.\d+\.\d+)"/i)
          if (versionMatch && versionMatch[1]) {
            return {
              severity: 'low' as const,
              title: 'Angular Version Disclosure',
              description: `Angular version ${versionMatch[1]} is exposed in HTML attributes.`,
              impact: 'Angular version disclosure helps attackers identify known vulnerabilities in specific versions.',
              recommendation: 'While ng-version is difficult to completely remove, ensure you are running the latest Angular version with security patches.',
              evidence: versionMatch[1],
            }
          }
          return null
        },
      },
      {
        name: 'angular_sourcemaps',
        check: (html: string, scripts: string[]) => {
          for (const scriptUrl of scripts) {
            if (/\.js\.map$/i.test(scriptUrl)) {
              return {
                severity: 'medium' as const,
                title: 'Angular Source Maps Exposed',
                description: 'TypeScript source maps are accessible in production.',
                impact: 'Source maps reveal original TypeScript code, component logic, services, and internal implementation details.',
                recommendation: 'Disable source maps in production: Set "sourceMap: false" in angular.json production configuration.',
              }
            }
          }
          return null
        },
      },
    ],
  },
  {
    name: 'Next.js',
    detection: {
      patterns: [
        { type: 'script', match: /_next\/static/i },
        { type: 'html', match: /__NEXT_DATA__|next-route/i },
      ],
      version: /"next":"(\d+\.\d+\.\d+)"/i,
    },
    securityChecks: [
      {
        name: 'nextjs_dev_mode',
        check: (html: string) => {
          if (/__NEXT_DATA__.*"nextExport":\s*false.*"dev":\s*true/is.test(html)) {
            return {
              severity: 'critical' as const,
              title: 'Next.js Running in Development Mode',
              description: 'Next.js is running in development mode in production.',
              impact: 'Development mode exposes detailed error pages, hot reload, and unoptimized code. This severely impacts performance and security.',
              recommendation: 'Build for production: "next build && next start" or deploy on Vercel. Ensure NODE_ENV=production.',
            }
          }
          return null
        },
      },
    ],
  },
]
```

---

### 3.3 Integration

```typescript
// Extend analyzeSecurityIssues function in worker.ts to include frontend framework checks

const frontendSecurityResults = await analyzeFrontendFrameworkSecurity(
  crawlResult.html,
  crawlResult.scripts || []
)

// Add findings to appropriate category
```

---

## 4. JavaScript Library CVE Mapping

### 4.1 Overview

**Enhancement to existing:** `src/worker/analyzers/js-libraries-analyzer.ts`

**Purpose:** Add CVE vulnerability mapping for detected JavaScript libraries (jQuery, Lodash, Moment.js, etc.)

---

### 4.2 CVE Database

```typescript
// Addition to js-libraries-analyzer.ts

interface LibraryCVE {
  cveId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedVersions: string // e.g., "< 3.0.0"
  description: string
  impact: string
  fix: string
  references: string[]
}

const LIBRARY_CVE_DATABASE: Record<string, LibraryCVE[]> = {
  'jQuery': [
    {
      cveId: 'CVE-2020-11023',
      severity: 'medium',
      affectedVersions: '< 3.5.0',
      description: 'Passing HTML containing <option> elements to manipulation methods could result in untrusted code execution.',
      impact: 'Cross-site scripting (XSS) vulnerability allows attackers to inject malicious scripts via HTML manipulation methods (.html(), .append(), etc.). Affects applications that insert user-controlled HTML.',
      fix: 'Upgrade to jQuery 3.5.0 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2020-11023',
        'https://blog.jquery.com/2020/04/10/jquery-3-5-0-released/',
      ],
    },
    {
      cveId: 'CVE-2020-11022',
      severity: 'medium',
      affectedVersions: '< 3.5.0',
      description: 'Passing HTML from untrusted sources to jQuery manipulation methods may execute untrusted code.',
      impact: 'XSS vulnerability in jQuery.htmlPrefilter allows execution of scripts from untrusted HTML. Affects .html(), .append(), .prepend(), .after(), .before(), and other DOM manipulation methods.',
      fix: 'Upgrade to jQuery 3.5.0 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2020-11022',
        'https://github.com/jquery/jquery/security/advisories/GHSA-gxr4-xjj5-5px2',
      ],
    },
    {
      cveId: 'CVE-2019-11358',
      severity: 'medium',
      affectedVersions: '< 3.4.0',
      description: 'jQuery.extend prototype pollution vulnerability.',
      impact: 'Prototype pollution allows attackers to inject properties into Object.prototype, potentially leading to denial of service, property injection, or remote code execution in Node.js environments.',
      fix: 'Upgrade to jQuery 3.4.0 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2019-11358',
        'https://snyk.io/vuln/SNYK-JS-JQUERY-174006',
      ],
    },
    {
      cveId: 'CVE-2015-9251',
      severity: 'medium',
      affectedVersions: '< 3.0.0',
      description: 'XSS vulnerability in jQuery.text() method.',
      impact: 'Cross-site scripting vulnerability when using jQuery.text() with untrusted input in IE8.',
      fix: 'Upgrade to jQuery 3.0.0 or higher, or ensure IE8 is not supported',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2015-9251',
      ],
    },
  ],
  'Lodash': [
    {
      cveId: 'CVE-2021-23337',
      severity: 'high',
      affectedVersions: '< 4.17.21',
      description: 'Command injection via template function.',
      impact: 'The template function can be used to execute arbitrary JavaScript code, leading to remote code execution if user input is passed to template compilation.',
      fix: 'Upgrade to Lodash 4.17.21 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2021-23337',
        'https://github.com/lodash/lodash/pull/5065',
      ],
    },
    {
      cveId: 'CVE-2020-28500',
      severity: 'medium',
      affectedVersions: '< 4.17.21',
      description: 'ReDoS (Regular Expression Denial of Service) in toNumber and trim functions.',
      impact: 'Specially crafted strings can cause excessive computation time, leading to denial of service.',
      fix: 'Upgrade to Lodash 4.17.21 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2020-28500',
      ],
    },
    {
      cveId: 'CVE-2019-10744',
      severity: 'critical',
      affectedVersions: '< 4.17.12',
      description: 'Prototype pollution in defaultsDeep, merge, and mergeWith functions.',
      impact: 'CRITICAL: Prototype pollution allows attackers to modify Object.prototype, leading to property injection attacks, denial of service, or remote code execution in Node.js. Can bypass security controls and manipulate application behavior.',
      fix: 'Upgrade to Lodash 4.17.12 or higher immediately',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2019-10744',
        'https://snyk.io/vuln/SNYK-JS-LODASH-450202',
      ],
    },
    {
      cveId: 'CVE-2018-16487',
      severity: 'high',
      affectedVersions: '< 4.17.11',
      description: 'Prototype pollution in merge, mergeWith, and defaultsDeep.',
      impact: 'Prototype pollution vulnerability allowing modification of object properties and potential security bypass.',
      fix: 'Upgrade to Lodash 4.17.11 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2018-16487',
      ],
    },
  ],
  'Moment.js': [
    {
      cveId: 'DEPRECATED',
      severity: 'medium',
      affectedVersions: '*',
      description: 'Moment.js is officially in maintenance mode (no new features) and the team recommends using alternatives.',
      impact: 'While not a security vulnerability, using deprecated libraries means missing out on modern features, optimizations, and potential security improvements in actively maintained alternatives. Moment.js is large (67KB) and has performance issues with immutability.',
      fix: 'Migrate to modern alternatives: Luxon (successor by Moment team), date-fns (modular, tree-shakeable), Day.js (Moment.js API compatible, 2KB)',
      references: [
        'https://momentjs.com/docs/#/-project-status/',
        'https://github.com/you-dont-need/You-Dont-Need-Momentjs',
      ],
    },
  ],
  'Axios': [
    {
      cveId: 'CVE-2023-45857',
      severity: 'medium',
      affectedVersions: '< 1.6.0',
      description: 'Inefficient Regular Expression Complexity (ReDoS) vulnerability.',
      impact: 'Specially crafted input to form serialization can cause excessive CPU usage, leading to denial of service.',
      fix: 'Upgrade to Axios 1.6.0 or higher',
      references: [
        'https://nvd.nist.gov/vuln/detail/CVE-2023-45857',
      ],
    },
  ],
}

// Deprecation warnings
const DEPRECATED_LIBRARIES: Record<string, {
  reason: string
  alternatives: string[]
  severity: 'low' | 'medium'
}> = {
  'Moment.js': {
    reason: 'Moment.js is in maintenance mode. The team recommends using alternatives for new projects.',
    alternatives: ['Luxon (by Moment.js team)', 'date-fns (modular)', 'Day.js (lightweight, compatible API)'],
    severity: 'medium',
  },
  'jQuery': {
    reason: 'For modern browsers, native DOM APIs and modern frameworks (React, Vue) are recommended over jQuery for new projects.',
    alternatives: ['Native DOM APIs', 'Modern frameworks (React, Vue, Svelte)'],
    severity: 'low',
  },
}
```

---

### 4.3 Version Comparison Logic

```typescript
// Helper function to compare versions
function isVersionAffected(currentVersion: string, affectedRange: string): boolean {
  // Parse affected range (e.g., "< 3.5.0", ">= 1.0.0, < 2.0.0")
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  // Simple version comparison for "< X.Y.Z"
  if (affectedRange.startsWith('<')) {
    const [targetMajor, targetMinor, targetPatch] = affectedRange
      .replace('<', '')
      .trim()
      .split('.')
      .map(Number)

    if (major < targetMajor) return true
    if (major === targetMajor && minor < targetMinor) return true
    if (major === targetMajor && minor === targetMinor && patch < targetPatch) return true
    return false
  }

  // Add more complex range parsing if needed (>=, <=, etc.)
  return false
}

// Enhanced library analyzer
export function analyzeLibrariesWithCVE(
  detectedLibraries: DetectedLibrary[]
): Finding[] {
  const findings: Finding[] = []

  for (const library of detectedLibraries) {
    // Check for CVEs
    const cves = LIBRARY_CVE_DATABASE[library.name] || []
    for (const cve of cves) {
      if (library.version && isVersionAffected(library.version, cve.affectedVersions)) {
        findings.push({
          type: `library-cve-${cve.cveId.toLowerCase()}`,
          category: 'library',
          severity: cve.severity,
          title: `${library.name} Vulnerability: ${cve.cveId}`,
          description: `${library.name} ${library.version} is affected by ${cve.cveId}: ${cve.description}`,
          impact: cve.impact,
          recommendation: cve.fix,
          evidence: `Library: ${library.name} ${library.version}, CVE: ${cve.cveId}`,
        })
      }
    }

    // Check for deprecation
    const deprecation = DEPRECATED_LIBRARIES[library.name]
    if (deprecation) {
      findings.push({
        type: `library-deprecated-${library.name.toLowerCase().replace(/\./g, '-')}`,
        category: 'library',
        severity: deprecation.severity,
        title: `Deprecated Library: ${library.name}`,
        description: `${library.name} is deprecated or in maintenance mode. ${deprecation.reason}`,
        impact: 'Using deprecated libraries means missing out on modern features, security improvements, and performance optimizations. Maintenance-mode libraries may stop receiving security updates.',
        recommendation: `Consider migrating to modern alternatives: ${deprecation.alternatives.join(', ')}.`,
        evidence: library.version || 'Version unknown',
      })
    }
  }

  return findings
}
```

---

## 5. Passive API Discovery

### 5.1 Overview

**File:** `src/worker/analyzers/passive-api-discovery-analyzer.ts`

**Purpose:** Discover API endpoints from JavaScript, detect insecure authentication patterns, and identify vulnerability indicators WITHOUT performing active attacks.

**Report Category:**
```typescript
'api-security': {
  icon: '🔌',
  title: 'API Security & Exposure',
  description: 'API endpoints, authentication patterns, and vulnerability indicators',
  explanation: 'Modern web apps rely heavily on APIs. This analyzer discovers API endpoints from JavaScript, detects insecure auth patterns (JWT in localStorage, API keys in client code), and identifies vulnerability indicators like SQL errors, stack traces, and debug mode without performing active attacks.',
}
```

---

### 5.2 Implementation

```typescript
// src/worker/analyzers/passive-api-discovery-analyzer.ts

interface APIEndpoint {
  url: string
  method?: string
  source: 'javascript' | 'html' | 'network'
}

interface VulnerabilityIndicator {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string
}

export interface PassiveAPIResult {
  endpoints: APIEndpoint[]
  authPatterns: Finding[]
  vulnerabilityIndicators: Finding[]
  findings: Finding[]
}

export async function analyzePassiveAPI(
  html: string,
  scripts: string[],
  headers: Record<string, string>
): Promise<PassiveAPIResult> {
  const endpoints: APIEndpoint[] = []
  const authPatterns: Finding[] = []
  const vulnerabilityIndicators: Finding[] = []
  const findings: Finding[] = []

  // 1. Extract API endpoints from JavaScript
  const allScripts = scripts.join('\n') + '\n' + html

  // Common API endpoint patterns
  const apiPatterns = [
    /(?:fetch|axios|http)[\s\(]['"]([^'"]+\/api\/[^'"]+)['"]/gi,
    /url:\s*['"]([^'"]+\/api\/[^'"]+)['"]/gi,
    /endpoint:\s*['"]([^'"]+)['"]/gi,
    /['"]https?:\/\/[^'"]+\/api\/[^'"]+['"]/gi,
  ]

  for (const pattern of apiPatterns) {
    const matches = [...allScripts.matchAll(pattern)]
    for (const match of matches) {
      const url = match[1] || match[0].replace(/['"]/g, '')
      if (url && /^https?:\/\/|^\/api\//i.test(url)) {
        endpoints.push({
          url,
          source: 'javascript',
        })
      }
    }
  }

  // 2. JWT in localStorage detection
  if (/localStorage\.setItem\s*\(\s*['"][^'"]*token[^'"]*['"]/i.test(allScripts)) {
    authPatterns.push({
      type: 'jwt-localstorage',
      category: 'api-security',
      severity: 'medium',
      title: 'JWT Tokens Stored in localStorage',
      description: 'Authentication tokens are stored in browser localStorage, making them vulnerable to XSS attacks.',
      impact: 'If an XSS vulnerability exists anywhere on the site, attackers can steal authentication tokens from localStorage using JavaScript. Unlike httpOnly cookies, localStorage is fully accessible to scripts. Stolen tokens can be used to impersonate users.',
      recommendation: 'Store JWTs in httpOnly cookies instead of localStorage. Cookies with httpOnly flag cannot be accessed by JavaScript, providing protection against XSS token theft. Configure cookies with: httpOnly=true, secure=true, sameSite=strict.',
      evidence: 'localStorage.setItem() calls with token-related keys detected in JavaScript',
    })
  }

  // 3. sessionStorage token detection
  if (/sessionStorage\.setItem\s*\(\s*['"][^'"]*token[^'"]*['"]/i.test(allScripts)) {
    authPatterns.push({
      type: 'session-storage-token',
      category: 'api-security',
      severity: 'medium',
      title: 'Tokens Stored in sessionStorage',
      description: 'Authentication tokens stored in sessionStorage are vulnerable to XSS.',
      impact: 'Similar to localStorage, sessionStorage is fully accessible to JavaScript. XSS attacks can steal tokens from sessionStorage.',
      recommendation: 'Use httpOnly cookies for sensitive authentication tokens.',
      evidence: 'sessionStorage.setItem() with token keys detected',
    })
  }

  // 4. API keys in client-side code
  const apiKeyPatterns = [
    /['"]?api[_-]?key['"]?\s*[:=]\s*['"]([a-zA-Z0-9_-]{20,})['"]/gi,
    /['"]?apikey['"]?\s*[:=]\s*['"]([a-zA-Z0-9_-]{20,})['"]/gi,
    /Authorization:\s*['"]Bearer\s+([a-zA-Z0-9_-]{20,})['"]/gi,
  ]

  for (const pattern of apiKeyPatterns) {
    const matches = [...allScripts.matchAll(pattern)]
    for (const match of matches) {
      authPatterns.push({
        type: 'api-key-client-side',
        category: 'api-security',
        severity: 'critical',
        title: 'API Key Exposed in Client-Side Code',
        description: 'API key found in JavaScript code accessible to anyone visiting the website.',
        impact: 'CRITICAL: Exposed API keys can be stolen and used to make unauthorized API requests, access paid services, exhaust rate limits, or access sensitive data. Client-side API keys cannot be kept secret.',
        recommendation: 'NEVER include API keys in client-side code. Move API calls to server-side (backend proxy). Use environment variables and server-side rendering for API authentication. Implement proper API key rotation if keys were exposed.',
        evidence: `API key pattern found: ${match[0].substring(0, 50)}...`,
      })
    }
  }

  // 5. Basic auth in URLs
  if (/https?:\/\/[^:]+:[^@]+@/i.test(html + allScripts)) {
    authPatterns.push({
      type: 'basic-auth-url',
      category: 'api-security',
      severity: 'high',
      title: 'Credentials Found in URLs',
      description: 'Username and password detected in URL format (http://user:pass@example.com).',
      impact: 'Credentials in URLs are logged in browser history, server access logs, referrer headers, and proxy logs. This exposes sensitive credentials to multiple parties and systems.',
      recommendation: 'Remove credentials from URLs. Use proper authentication headers (Authorization: Basic/Bearer). Implement OAuth or session-based authentication.',
      evidence: 'URL with embedded credentials detected',
    })
  }

  // 6. SQL error message disclosure
  const sqlErrorPatterns = [
    /SQL syntax.*MySQL/i,
    /Warning.*mysql_/i,
    /Warning.*mysqli/i,
    /PostgreSQL.*ERROR/i,
    /pg_query/i,
    /ORA-\d{5}/i,
    /Microsoft SQL/i,
    /SQLSTATE\[\d+\]/i,
    /sqlite3\./i,
  ]

  for (const pattern of sqlErrorPatterns) {
    if (pattern.test(html)) {
      const match = html.match(pattern)
      vulnerabilityIndicators.push({
        type: 'sql-error-disclosure',
        category: 'api-security',
        severity: 'high',
        title: 'SQL Error Messages Disclosed',
        description: 'Database error messages are exposed in HTML responses.',
        impact: 'SQL errors reveal database type (MySQL, PostgreSQL, SQL Server), table names, column names, query structure, and file paths. This information helps attackers craft SQL injection attacks and map database schema.',
        recommendation: 'Disable detailed error messages in production. Configure database drivers to suppress errors. Implement custom error pages. Log errors server-side instead of displaying them.',
        evidence: match ? match[0].substring(0, 100) : 'SQL error pattern detected',
      })
      break
    }
  }

  // 7. Stack trace disclosure
  const stackTracePatterns = [
    /at\s+[^\s]+\s+\([^)]+:\d+:\d+\)/i, // JavaScript stack trace
    /Traceback.*File ".*", line \d+/is, // Python traceback
    /Exception in.*\nat\s+/is, // Java exception
    /Fatal error:.*in\s+\/.*on line \d+/i, // PHP fatal error
  ]

  for (const pattern of stackTracePatterns) {
    if (pattern.test(html)) {
      const match = html.match(pattern)
      vulnerabilityIndicators.push({
        type: 'stack-trace-disclosure',
        category: 'api-security',
        severity: 'medium',
        title: 'Stack Traces Exposed in Error Pages',
        description: 'Detailed stack traces are visible in error responses.',
        impact: 'Stack traces reveal file paths, function names, library versions, code structure, and internal implementation details. This helps attackers map application architecture and identify vulnerable code paths.',
        recommendation: 'Disable stack trace display in production. Show generic error messages to users. Log detailed errors server-side. Implement custom error handling middleware.',
        evidence: match ? match[0].substring(0, 150) : 'Stack trace detected',
      })
      break
    }
  }

  // 8. Directory listing enabled
  if (/Index of \/|Directory Listing|<title>Index of|Parent Directory/i.test(html)) {
    vulnerabilityIndicators.push({
      type: 'directory-listing',
      category: 'api-security',
      severity: 'medium',
      title: 'Directory Listing Enabled',
      description: 'Web server is configured to display directory contents when no index file is present.',
      impact: 'Directory listing exposes file and folder structure, revealing backup files, configuration files, source code, and sensitive data. Attackers can browse directories to find vulnerable or sensitive files.',
      recommendation: 'Disable directory listing in web server configuration. For Apache: "Options -Indexes" in .htaccess. For Nginx: "autoindex off;" in server config. Ensure index.html/index.php exists in all directories.',
    })
  }

  // 9. Debug mode indicators
  const debugPatterns = [
    /DEBUG\s*=\s*True/i,
    /RAILS_ENV\s*=\s*development/i,
    /NODE_ENV\s*=\s*development/i,
    /APP_DEBUG\s*=\s*true/i,
    /FLASK_DEBUG\s*=\s*1/i,
  ]

  for (const pattern of debugPatterns) {
    if (pattern.test(html)) {
      const match = html.match(pattern)
      vulnerabilityIndicators.push({
        type: 'debug-mode-indicator',
        category: 'api-security',
        severity: 'critical',
        title: 'Debug Mode Enabled in Production',
        description: 'Application is running in debug/development mode.',
        impact: 'CRITICAL: Debug mode exposes extensive system information including environment variables, configuration settings, database credentials, API keys, full stack traces, source code paths, and internal application logic. This is one of the most severe misconfigurations.',
        recommendation: 'IMMEDIATELY disable debug mode. Set DEBUG=False (Django), APP_DEBUG=false (Laravel), NODE_ENV=production (Node.js), RAILS_ENV=production (Rails), FLASK_DEBUG=0 (Flask). Review all exposed information for sensitive data leaks.',
        evidence: match ? match[0] : 'Debug mode indicator detected',
      })
      break
    }
  }

  // Combine all findings
  findings.push(...authPatterns, ...vulnerabilityIndicators)

  return {
    endpoints,
    authPatterns,
    vulnerabilityIndicators,
    findings,
  }
}
```

---

## 6. Integration Guide

### 6.1 Worker Integration

**File:** `src/worker/worker.ts`

```typescript
// Import new analyzers
import { analyzeBackendFramework } from './analyzers/backend-framework-detector'
import { analyzeWebServer } from './analyzers/web-server-security-analyzer'
import { analyzeFrontendFrameworkSecurity } from './analyzers/frontend-framework-detector'
import { analyzeLibrariesWithCVE } from './analyzers/js-libraries-analyzer'
import { analyzePassiveAPI } from './analyzers/passive-api-discovery-analyzer'

// In the main scan processing function, add new analyzer calls:

// 1. Backend Framework Detection
const backendFrameworkResult = await analyzeBackendFramework(
  crawlResult.html,
  crawlResult.responseHeaders || {},
  crawlResult.cookies || []
)
if (backendFrameworkResult.findings.length > 0) {
  allFindings.push(...backendFrameworkResult.findings)
}

// 2. Web Server Security
const webServerResult = await analyzeWebServer(
  crawlResult.responseHeaders || {}
)
if (webServerResult.findings.length > 0) {
  allFindings.push(...webServerResult.findings)
}

// 3. Frontend Framework Security (enhance existing tech stack)
const frontendSecurityResult = await analyzeFrontendFrameworkSecurity(
  crawlResult.html,
  crawlResult.scripts || []
)
if (frontendSecurityResult.findings.length > 0) {
  allFindings.push(...frontendSecurityResult.findings)
}

// 4. JS Library CVE Mapping (enhance existing library analyzer)
const libraryResult = analyzeJSLibraries(crawlResult) // Existing
const libraryCVEFindings = analyzeLibrariesWithCVE(libraryResult.detected)
if (libraryCVEFindings.length > 0) {
  allFindings.push(...libraryCVEFindings)
}

// 5. Passive API Discovery
const apiSecurityResult = await analyzePassiveAPI(
  crawlResult.html,
  crawlResult.scripts || [],
  crawlResult.responseHeaders || {}
)
if (apiSecurityResult.findings.length > 0) {
  allFindings.push(...apiSecurityResult.findings)
}
```

---

### 6.2 Report Page Integration

**File:** `src/app/scan/[id]/page.tsx`

Add new category metadata to `CATEGORY_META`:

```typescript
const CATEGORY_META = {
  // ... existing categories ...

  'backend-framework': {
    icon: '⚙️',
    title: 'Backend Framework Security',
    description: 'Server-side framework detection and security checks',
    explanation: 'Backend frameworks (PHP, Django, Flask, Express, Rails, ASP.NET) power server-side logic. Debug modes expose sensitive system information, outdated versions contain known vulnerabilities, and version disclosure helps attackers craft targeted exploits.',
  },

  'web-server': {
    icon: '🖥️',
    title: 'Web Server Security',
    description: 'Web server configuration and version analysis',
    explanation: 'Web servers (Nginx, Apache, IIS) are the first line of defense. Exposed versions reveal exploitable CVEs, disclosed modules show attack surface, and outdated servers contain known security flaws. Server tokens should be hidden in production.',
  },

  'api-security': {
    icon: '🔌',
    title: 'API Security & Exposure',
    description: 'API endpoints, authentication patterns, and vulnerability indicators',
    explanation: 'Modern web apps rely heavily on APIs. This analyzer discovers API endpoints from JavaScript, detects insecure auth patterns (JWT in localStorage, API keys in client code), and identifies vulnerability indicators like SQL errors, stack traces, and debug mode without performing active attacks.',
  },

  // ... rest of categories ...
}
```

Update category order to include new categories:

```typescript
const categoryOrder = [
  'owasp-llm01', 'owasp-llm02', 'owasp-llm05', 'owasp-llm06', 'owasp-llm07', 'owasp-llm08',
  'backend-framework', // NEW
  'web-server', // NEW
  'api-security', // NEW
  'reconnaissance', 'admin', 'port', 'client', 'ssl', 'cors', 'dns', 'cookie',
  'security', 'library', 'compliance', 'waf', 'mfa', 'rate-limit', 'graphql',
  'error-disclosure', 'spa-api'
]
```

---

## 7. Testing Strategy

### 7.1 Test URLs

Create test URLs that trigger each detector:

```bash
# Backend Framework Tests
# PHP with version disclosure
https://example.com/phpinfo.php

# Django debug mode (if accessible)
https://django-site.com/nonexistent-page

# Flask Werkzeug debugger (requires debug mode)
# Test locally with Flask app in debug mode

# Web Server Tests
# Nginx version disclosure
curl -I https://nginx-site.com

# Apache with modules
curl -I https://apache-site.com

# Frontend Framework Tests
# React with DevTools
# Check production sites with React DevTools extension

# Source maps
https://react-site.com/_next/static/chunks/main.js.map

# API Security Tests
# Check your own site's JavaScript for:
# - localStorage.setItem('token', ...)
# - API keys in code
# - fetch('/api/...') calls
```

### 7.2 Unit Tests

```typescript
// tests/analyzers/backend-framework-detector.test.ts

import { analyzeBackendFramework } from '@/worker/analyzers/backend-framework-detector'

describe('Backend Framework Detector', () => {
  test('detects PHP with version', async () => {
    const result = await analyzeBackendFramework(
      '<html></html>',
      { 'x-powered-by': 'PHP/7.4.0', 'server': 'Apache' },
      [{ name: 'PHPSESSID', value: 'abc123' }]
    )

    expect(result.detectedFrameworks.length).toBeGreaterThan(0)
    expect(result.detectedFrameworks[0].name).toBe('PHP')
    expect(result.detectedFrameworks[0].version).toBe('7.4.0')
    expect(result.findings.length).toBeGreaterThan(0) // Should detect outdated version
  })

  test('detects Django debug mode', async () => {
    const html = '<html>DEBUG = True</html>'
    const result = await analyzeBackendFramework(html, {}, [])

    const debugFinding = result.findings.find(f => f.severity === 'critical')
    expect(debugFinding).toBeDefined()
    expect(debugFinding?.title).toContain('Debug Mode')
  })

  test('detects Flask Werkzeug debugger', async () => {
    const html = '<div class="debugger__title">Werkzeug Debugger</div>'
    const result = await analyzeBackendFramework(
      html,
      { 'server': 'Werkzeug/2.0.0 Python/3.9.0' },
      []
    )

    const critical = result.findings.find(f => f.severity === 'critical')
    expect(critical).toBeDefined()
    expect(critical?.title).toContain('Werkzeug Debugger')
  })
})

// Similar tests for other analyzers...
```

### 7.3 Integration Test

```typescript
// tests/integration/new-analyzers.test.ts

describe('New Analyzers Integration', () => {
  test('scans a site and generates findings from all new analyzers', async () => {
    const scanResult = await runFullScan('https://test-site.com')

    // Check that new categories exist
    expect(scanResult.findings.some(f => f.category === 'backend-framework')).toBe(true)
    expect(scanResult.findings.some(f => f.category === 'web-server')).toBe(true)
    expect(scanResult.findings.some(f => f.category === 'api-security')).toBe(true)

    // Check that library CVEs are detected
    const jqueryCVE = scanResult.findings.find(f => f.type.includes('cve'))
    if (jqueryCVE) {
      expect(jqueryCVE.title).toContain('CVE')
    }
  })
})
```

---

## 8. Implementation Checklist

### Sprint #10 - Backend & Server (Week 1)

- [ ] Create `backend-framework-detector.ts`
  - [ ] Implement detection patterns (PHP, Django, Flask, Express, Rails, ASP.NET, Laravel)
  - [ ] Implement security checks (debug mode, version disclosure, outdated versions)
  - [ ] Add unit tests
- [ ] Create `web-server-security-analyzer.ts`
  - [ ] Implement detection patterns (Nginx, Apache, IIS, LiteSpeed, Caddy)
  - [ ] Implement security checks (version disclosure, outdated versions, module disclosure)
  - [ ] Add unit tests
- [ ] Integrate into `worker.ts`
- [ ] Add category metadata to `page.tsx`
- [ ] Test with real websites
- [ ] Commit Sprint #10

### Sprint #11 - Frontend & Libraries (Week 2)

- [ ] Create `frontend-framework-detector.ts` or extend `tech-stack-analyzer.ts`
  - [ ] Implement React DevTools detection
  - [ ] Implement Vue dev mode detection
  - [ ] Implement Angular source maps check
  - [ ] Implement Next.js dev mode check
  - [ ] Add unit tests
- [ ] Extend `js-libraries-analyzer.ts`
  - [ ] Add CVE database (jQuery, Lodash, Axios, Moment.js)
  - [ ] Implement version comparison logic
  - [ ] Add deprecation warnings
  - [ ] Add unit tests
- [ ] Integrate into `worker.ts`
- [ ] Test with real websites
- [ ] Commit Sprint #11

### Sprint #12 - API Security (Week 3)

- [ ] Create `passive-api-discovery-analyzer.ts`
  - [ ] Implement API endpoint extraction from JavaScript
  - [ ] Implement JWT in localStorage detection
  - [ ] Implement API key detection
  - [ ] Implement SQL error detection
  - [ ] Implement stack trace detection
  - [ ] Implement directory listing detection
  - [ ] Implement debug mode detection
  - [ ] Add unit tests
- [ ] Integrate into `worker.ts`
- [ ] Add `api-security` category to report page
- [ ] Test with real websites
- [ ] Commit Sprint #12

### Final Integration

- [ ] Run full integration test suite
- [ ] Test report page rendering with all new categories
- [ ] Update PROGRESS.md
- [ ] Create demo screenshots
- [ ] Document any edge cases or limitations

---

## 9. Success Metrics

After implementation, we should see:

1. **Backend Framework Detection:**
   - 7 frameworks detected (PHP, Django, Flask, Express, Rails, ASP.NET, Laravel)
   - Debug mode findings flagged as CRITICAL
   - Version disclosure findings

2. **Web Server Security:**
   - 5 servers detected (Nginx, Apache, IIS, LiteSpeed, Caddy)
   - Outdated version detection (HIGH severity)
   - Server token disclosure (LOW-MEDIUM severity)

3. **Frontend Framework Security:**
   - DevTools detection for React, Vue
   - Source maps exposure
   - Development mode detection

4. **Library CVE Mapping:**
   - jQuery CVEs (4 CVEs covering < 3.5.0)
   - Lodash CVEs (4 CVEs covering < 4.17.21)
   - Moment.js deprecation warning
   - Axios CVE

5. **API Security:**
   - JWT in localStorage detection
   - API key exposure (CRITICAL)
   - SQL error messages
   - Stack trace disclosure
   - Debug mode indicators (CRITICAL)

---

**READY TO IMPLEMENT! 🚀**

This spec covers ALL features from IMPLEMENTATION_PRIORITY.md with complete code examples, security checks, and integration steps.

Let me know when you're ready to start implementing!

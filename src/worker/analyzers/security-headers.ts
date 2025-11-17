import { CrawlResult } from '../crawler-mock'

export interface SecurityHeadersResult {
  present: string[]
  missing: string[]
  findings: HeaderFinding[]
}

export interface HeaderFinding {
  header: string
  status: 'present' | 'missing' | 'weak'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
}

const SECURITY_HEADERS = {
  'content-security-policy': {
    severity: 'high' as const,
    description: 'Content Security Policy (CSP) missing',
    recommendation: 'Implement CSP to prevent XSS attacks. Critical for AI applications that render user-generated content.',
  },
  'x-frame-options': {
    severity: 'medium' as const,
    description: 'X-Frame-Options header missing',
    recommendation: 'Add X-Frame-Options to prevent clickjacking attacks.',
  },
  'strict-transport-security': {
    severity: 'high' as const,
    description: 'HTTP Strict Transport Security (HSTS) missing',
    recommendation: 'Enable HSTS to enforce HTTPS connections.',
  },
  'x-content-type-options': {
    severity: 'medium' as const,
    description: 'X-Content-Type-Options header missing',
    recommendation: 'Add "nosniff" to prevent MIME type sniffing.',
  },
  'referrer-policy': {
    severity: 'low' as const,
    description: 'Referrer-Policy header missing',
    recommendation: 'Set Referrer-Policy to control information leakage.',
  },
  'permissions-policy': {
    severity: 'low' as const,
    description: 'Permissions-Policy header missing',
    recommendation: 'Configure Permissions-Policy to control browser features.',
  },
}

export function analyzeSecurityHeaders(crawlResult: CrawlResult): SecurityHeadersResult {
  const result: SecurityHeadersResult = {
    present: [],
    missing: [],
    findings: [],
  }

  // Normalize headers (lowercase keys)
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(crawlResult.responseHeaders || {})) {
    headers[key.toLowerCase()] = value
  }

  // Check each security header
  for (const [headerName, config] of Object.entries(SECURITY_HEADERS)) {
    if (headers[headerName]) {
      result.present.push(headerName)

      // Additional checks for weak configurations
      const value = headers[headerName].toLowerCase()

      // Check CSP
      if (headerName === 'content-security-policy') {
        if (value.includes('unsafe-inline') || value.includes('unsafe-eval')) {
          result.findings.push({
            header: headerName,
            status: 'weak',
            severity: 'medium',
            description: 'CSP contains unsafe directives (unsafe-inline or unsafe-eval)',
            recommendation: 'Remove unsafe directives and use nonces or hashes instead.',
          })
        }
      }

      // Check HSTS
      if (headerName === 'strict-transport-security') {
        const maxAge = value.match(/max-age=(\d+)/)?.[1]
        if (maxAge && parseInt(maxAge) < 31536000) {
          result.findings.push({
            header: headerName,
            status: 'weak',
            severity: 'low',
            description: 'HSTS max-age is less than 1 year',
            recommendation: 'Increase max-age to at least 31536000 (1 year).',
          })
        }
      }

    } else {
      result.missing.push(headerName)
      result.findings.push({
        header: headerName,
        status: 'missing',
        severity: config.severity,
        description: config.description,
        recommendation: config.recommendation,
      })
    }
  }

  // Check for server information disclosure headers
  checkServerInformationHeaders(headers, result, crawlResult)

  return result
}

/**
 * Check for headers that expose server information
 */
function checkServerInformationHeaders(
  headers: Record<string, string>,
  result: SecurityHeadersResult,
  crawlResult: CrawlResult
): void {
  // 1. Server header - exposes web server and version
  const serverHeader = headers['server']
  if (serverHeader) {
    // Parse version info: nginx/1.18.0, Apache/2.4.41
    const versionMatch = serverHeader.match(/([^\/\s]+)(?:\/?([\d.]+))?/)
    if (versionMatch) {
      const serverName = versionMatch[1]
      const version = versionMatch[2]

      result.findings.push({
        header: 'server',
        status: 'present',
        severity: version ? 'medium' : 'low',
        description: version
          ? `Server version exposed: ${serverName}/${version}`
          : `Server software exposed: ${serverName}`,
        recommendation: version
          ? 'Hide server version in production. Version-specific exploits can be targeted.'
          : 'Consider hiding server software information for additional security.'
      })
    }
  }

  // 2. X-Powered-By - exposes technology stack
  const poweredBy = headers['x-powered-by']
  if (poweredBy) {
    result.findings.push({
      header: 'x-powered-by',
      status: 'present',
      severity: 'low',
      description: `Technology stack exposed: ${poweredBy}`,
      recommendation: 'Remove X-Powered-By header to hide technology stack. Attackers can target known framework vulnerabilities.'
    })
  }

  // 3. X-AspNet-Version - exposes ASP.NET version
  const aspNetVersion = headers['x-aspnet-version']
  if (aspNetVersion) {
    result.findings.push({
      header: 'x-aspnet-version',
      status: 'present',
      severity: 'medium',
      description: `ASP.NET version exposed: ${aspNetVersion}`,
      recommendation: 'Remove X-AspNet-Version header. .NET version-specific vulnerabilities can be exploited.'
    })
  }

  // 4. X-AspNetMvc-Version - exposes ASP.NET MVC version
  const aspNetMvcVersion = headers['x-aspnetmvc-version']
  if (aspNetMvcVersion) {
    result.findings.push({
      header: 'x-aspnetmvc-version',
      status: 'present',
      severity: 'low',
      description: `ASP.NET MVC version exposed: ${aspNetMvcVersion}`,
      recommendation: 'Remove X-AspNetMvc-Version header to hide framework version.'
    })
  }

  // 5. X-Generator - exposes CMS/generator
  const xGenerator = headers['x-generator']
  if (xGenerator) {
    result.findings.push({
      header: 'x-generator',
      status: 'present',
      severity: 'low',
      description: `CMS/Generator exposed: ${xGenerator}`,
      recommendation: 'Remove X-Generator header. CMS-specific vulnerabilities can be targeted.'
    })
  }

  // 6. Check meta generator tag in HTML
  if (crawlResult.html) {
    const metaGeneratorMatch = crawlResult.html.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i)
    if (metaGeneratorMatch) {
      const generator = metaGeneratorMatch[1]
      result.findings.push({
        header: 'meta-generator',
        status: 'present',
        severity: 'low',
        description: `CMS/Generator exposed in HTML: ${generator}`,
        recommendation: 'Remove generator meta tag. CMS-specific vulnerabilities can be targeted.'
      })
    }
  }

  // 7. Via header - exposes proxy/CDN information
  // Nov 17, 2025: Reduced FP - Via header is normal for CDNs (Cloudflare, Akamai, etc.)
  const viaHeader = headers['via']
  if (viaHeader) {
    // Only flag if it contains internal/private information
    const containsPrivateInfo = viaHeader.match(/\b(internal|private|local|dev|staging|test)\b/i)
    if (containsPrivateInfo) {
      result.findings.push({
        header: 'via',
        status: 'present',
        severity: 'low',
        description: `Internal proxy information exposed: ${viaHeader}`,
        recommendation: 'Via header contains internal naming. Consider sanitizing in production.'
      })
    }
    // Don't flag normal CDN Via headers (e.g., "1.1 cloudflare", "1.1 varnish")
  }

  // 8. X-Runtime - exposes application runtime
  const xRuntime = headers['x-runtime']
  if (xRuntime) {
    result.findings.push({
      header: 'x-runtime',
      status: 'present',
      severity: 'low',
      description: `Application runtime exposed: ${xRuntime}`,
      recommendation: 'Remove X-Runtime header in production. Can be used for timing attacks.'
    })
  }

  // 9. X-Version - generic version header
  const xVersion = headers['x-version']
  if (xVersion) {
    result.findings.push({
      header: 'x-version',
      status: 'present',
      severity: 'low',
      description: `Version information exposed: ${xVersion}`,
      recommendation: 'Remove X-Version header to hide version information.'
    })
  }

  // 10. X-Powered-By-Plesk - Plesk panel
  const pleskHeader = headers['x-powered-by-plesk']
  if (pleskHeader) {
    result.findings.push({
      header: 'x-powered-by-plesk',
      status: 'present',
      severity: 'medium',
      description: 'Plesk control panel detected',
      recommendation: 'Hide Plesk headers. Control panels are high-value targets for attackers.'
    })
  }
}

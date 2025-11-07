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
  for (const [key, value] of Object.entries(crawlResult.responseHeaders)) {
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

  return result
}

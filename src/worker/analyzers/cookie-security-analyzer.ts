import { CrawlResult } from '../crawler-mock'

export interface CookieSecurityResult {
  totalCookies: number
  secureCookies: number
  insecureCookies: number
  findings: CookieFinding[]
  thirdPartyCookies: ThirdPartyCookie[]
  score: number // 0-100
}

export interface CookieFinding {
  cookieName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  issue: string
  description: string
  recommendation: string
}

export interface ThirdPartyCookie {
  name: string
  domain: string
  purpose: string // analytics, advertising, social, unknown
}

/**
 * Analyze cookie security configuration
 *
 * Checks:
 * - Secure flag presence
 * - HttpOnly flag presence
 * - SameSite attribute
 * - Third-party cookies inventory
 * - Cookie expiration
 */
export function analyzeCookieSecurity(crawlResult: CrawlResult): CookieSecurityResult {
  const result: CookieSecurityResult = {
    totalCookies: 0,
    secureCookies: 0,
    insecureCookies: 0,
    findings: [],
    thirdPartyCookies: [],
    score: 100,
  }

  // Get cookies from crawl result
  const cookies = crawlResult.cookies || []
  result.totalCookies = cookies.length

  if (cookies.length === 0) {
    // No cookies found - not necessarily bad
    return result
  }

  const siteURL = new URL(crawlResult.finalUrl)
  const siteDomain = siteURL.hostname
  let scoreDeduction = 0

  for (const cookie of cookies) {
    const cookieDomain = cookie.domain || ''
    const isThirdParty = !cookieDomain.includes(siteDomain) && !siteDomain.includes(cookieDomain)

    // Check 1: Secure flag
    if (!cookie.secure) {
      result.insecureCookies++

      result.findings.push({
        cookieName: cookie.name,
        severity: siteURL.protocol === 'https:' ? 'high' : 'medium',
        issue: 'Missing Secure flag',
        description: 'Cookie can be transmitted over unencrypted HTTP connection',
        recommendation: 'Set Secure flag to ensure cookies are only sent over HTTPS.',
      })

      scoreDeduction += 5
    } else {
      result.secureCookies++
    }

    // Check 2: HttpOnly flag
    if (!cookie.httpOnly && isSensitiveCookie(cookie.name)) {
      result.findings.push({
        cookieName: cookie.name,
        severity: 'high',
        issue: 'Missing HttpOnly flag on sensitive cookie',
        description: 'Cookie is accessible via JavaScript, vulnerable to XSS attacks',
        recommendation: 'Set HttpOnly flag to prevent client-side JavaScript access.',
      })

      scoreDeduction += 10
    }

    // Check 3: SameSite attribute
    if (!cookie.sameSite || cookie.sameSite === 'None') {
      result.findings.push({
        cookieName: cookie.name,
        severity: 'medium',
        issue: 'Missing or weak SameSite attribute',
        description: cookie.sameSite === 'None'
          ? 'SameSite=None allows cross-site requests, vulnerable to CSRF'
          : 'No SameSite attribute set, browser defaults may not protect against CSRF',
        recommendation: 'Set SameSite=Strict or SameSite=Lax to prevent CSRF attacks.',
      })

      scoreDeduction += 3
    }

    // Check 4: Session cookie with long expiry
    if (isSessionCookie(cookie.name) && cookie.expires) {
      const expiryDate = new Date(cookie.expires)
      const now = new Date()
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry > 365) {
        result.findings.push({
          cookieName: cookie.name,
          severity: 'low',
          issue: 'Long session cookie expiry',
          description: `Session cookie expires in ${daysUntilExpiry} days`,
          recommendation: 'Use shorter session timeouts (e.g., 1-30 days) to reduce attack window.',
        })

        scoreDeduction += 2
      }
    }

    // Track third-party cookies
    if (isThirdParty) {
      result.thirdPartyCookies.push({
        name: cookie.name,
        domain: cookieDomain,
        purpose: identifyCookiePurpose(cookie.name, cookieDomain),
      })
    }
  }

  // Add finding for excessive third-party cookies
  if (result.thirdPartyCookies.length > 5) {
    const tracking = result.thirdPartyCookies.filter(c => c.purpose === 'advertising').length
    const analytics = result.thirdPartyCookies.filter(c => c.purpose === 'analytics').length

    result.findings.push({
      cookieName: 'Third-party cookies',
      severity: 'medium',
      issue: `${result.thirdPartyCookies.length} third-party cookies detected`,
      description: `Found ${tracking} advertising and ${analytics} analytics cookies`,
      recommendation: 'Review third-party cookie usage for GDPR/privacy compliance. Consider reducing tracking.',
    })

    scoreDeduction += Math.min(15, result.thirdPartyCookies.length)
  }

  result.score = Math.max(0, 100 - scoreDeduction)

  return result
}

/**
 * Check if cookie name suggests it's a sensitive cookie
 */
function isSensitiveCookie(name: string): boolean {
  const sensitivePrefixes = [
    'session',
    'auth',
    'token',
    'jwt',
    'csrf',
    'xsrf',
    'sid',
    'sessionid',
    'user',
    'login',
    '__host-',
    '__secure-',
  ]

  const lowerName = name.toLowerCase()
  return sensitivePrefixes.some(prefix => lowerName.includes(prefix))
}

/**
 * Check if cookie is a session cookie
 */
function isSessionCookie(name: string): boolean {
  const sessionPrefixes = ['session', 'sid', 'sessionid', 'phpsessid', 'jsessionid', 'aspsessionid']
  const lowerName = name.toLowerCase()
  return sessionPrefixes.some(prefix => lowerName.includes(prefix))
}

/**
 * Identify likely purpose of cookie based on name and domain
 */
function identifyCookiePurpose(name: string, domain: string): string {
  const lowerName = name.toLowerCase()
  const lowerDomain = domain.toLowerCase()

  // Analytics
  if (
    lowerDomain.includes('google-analytics') ||
    lowerDomain.includes('googletagmanager') ||
    lowerName.startsWith('_ga') ||
    lowerName.startsWith('_gid') ||
    lowerDomain.includes('hotjar') ||
    lowerDomain.includes('mixpanel') ||
    lowerDomain.includes('amplitude')
  ) {
    return 'analytics'
  }

  // Advertising
  if (
    lowerDomain.includes('doubleclick') ||
    lowerDomain.includes('facebook') ||
    lowerDomain.includes('linkedin') ||
    lowerDomain.includes('twitter') ||
    lowerDomain.includes('ads') ||
    lowerName.includes('_fbp') ||
    lowerName.includes('_gcl')
  ) {
    return 'advertising'
  }

  // Social media
  if (
    lowerDomain.includes('facebook') ||
    lowerDomain.includes('twitter') ||
    lowerDomain.includes('linkedin') ||
    lowerDomain.includes('instagram')
  ) {
    return 'social'
  }

  return 'unknown'
}

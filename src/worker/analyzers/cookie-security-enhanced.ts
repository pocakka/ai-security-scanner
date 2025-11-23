/**
 * Enhanced Cookie Security Analysis Functions
 *
 * Advanced cookie security checks including:
 * - Cookie prefix validation (__Secure-, __Host-)
 * - Domain scope analysis
 * - Path restrictions
 * - Expiry analysis
 * - Session fixation detection
 * - Cookie size optimization
 * - Cookie poisoning detection
 */

import { CookieFinding } from './cookie-security-analyzer'
import { CookieData } from '../crawler-mock'

// Use CookieData type but handle expires as number
export type Cookie = CookieData

export interface EnhancedCookieFinding extends CookieFinding {
  category: 'prefix' | 'domain' | 'path' | 'expiry' | 'session' | 'size' | 'poisoning'
  metadata?: any
}

/**
 * 1. Cookie Prefix Validation
 * Checks __Secure- and __Host- prefixes compliance
 */
export function analyzeCookiePrefixes(cookies: Cookie[], currentDomain: string): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []

  for (const cookie of cookies) {
    // Check __Secure- prefix requirements
    if (cookie.name.startsWith('__Secure-')) {
      if (!cookie.secure) {
        findings.push({
          cookieName: cookie.name,
          category: 'prefix',
          severity: 'high',
          issue: '__Secure- prefix violation',
          description: `Cookie "${cookie.name}" has __Secure- prefix but missing Secure flag. Browsers will reject this cookie.`,
          recommendation: 'Add Secure flag to the cookie or remove the __Secure- prefix.',
          metadata: { prefixType: '__Secure-', violation: 'missing_secure_flag' }
        })
      }
    }

    // Check __Host- prefix requirements (strictest)
    if (cookie.name.startsWith('__Host-')) {
      const violations = []

      if (!cookie.secure) violations.push('Missing Secure flag')
      if (cookie.domain) violations.push('Has Domain attribute (must be omitted)')
      if (cookie.path !== '/') violations.push(`Path is "${cookie.path}" (must be "/")`)

      if (violations.length > 0) {
        findings.push({
          cookieName: cookie.name,
          category: 'prefix',
          severity: 'high',
          issue: '__Host- prefix violations',
          description: `Cookie "${cookie.name}" violates __Host- requirements: ${violations.join(', ')}`,
          recommendation: 'Fix all __Host- requirements: Secure=true, no Domain, Path=/',
          metadata: { prefixType: '__Host-', violations }
        })
      }
    }

    // Suggest using prefixes for sensitive cookies
    const sensitiveCookiePatterns = ['session', 'auth', 'token', 'csrf', 'sid', 'jwt']
    const isSensitive = sensitiveCookiePatterns.some(pattern =>
      cookie.name.toLowerCase().includes(pattern)
    )

    if (isSensitive && !cookie.name.startsWith('__')) {
      findings.push({
        cookieName: cookie.name,
        category: 'prefix',
        severity: 'low',
        issue: 'Consider using cookie prefix',
        description: `Sensitive cookie "${cookie.name}" could benefit from __Secure- or __Host- prefix for additional security.`,
        recommendation: 'Use __Host- prefix for maximum security (requires Secure, Path=/, no Domain) or __Secure- prefix (requires Secure only).',
        metadata: { suggestion: true }
      })
    }
  }

  return findings
}

/**
 * 2. Cookie Domain Scope Analysis
 * Checks for overly broad domain settings
 */
export function analyzeCookieDomainScope(cookies: Cookie[], currentDomain: string): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []

  for (const cookie of cookies) {
    if (!cookie.domain) continue

    const domainParts = cookie.domain.replace(/^\./, '').split('.')
    const currentParts = currentDomain.split('.')

    // Check if cookie domain is too broad (e.g., .com, .net)
    if (domainParts.length <= 2 && !cookie.domain.includes('localhost')) {
      findings.push({
        cookieName: cookie.name,
        category: 'domain',
        severity: 'high',
        issue: 'Cookie domain too broad',
        description: `Cookie "${cookie.name}" has overly broad domain "${cookie.domain}" which shares it across all subdomains.`,
        recommendation: 'Use a more specific domain or omit the domain attribute to restrict to current subdomain.',
        metadata: { domain: cookie.domain, domainParts: domainParts.length }
      })
    }

    // Check if cookie is set for parent domain (starts with .)
    if (cookie.domain.startsWith('.')) {
      findings.push({
        cookieName: cookie.name,
        category: 'domain',
        severity: 'medium',
        issue: 'Cookie set for parent domain',
        description: `Cookie "${cookie.name}" is shared across all subdomains of ${cookie.domain}`,
        recommendation: 'Consider if subdomain sharing is necessary. If not, use specific subdomain.',
        metadata: { parentDomain: true, domain: cookie.domain }
      })
    }

    // Check for cross-subdomain leakage risk
    if (cookie.name.includes('admin') || cookie.name.includes('internal')) {
      if (cookie.domain && cookie.domain.startsWith('.')) {
        findings.push({
          cookieName: cookie.name,
          category: 'domain',
          severity: 'high',
          issue: 'Administrative cookie shared across subdomains',
          description: `Administrative cookie "${cookie.name}" is accessible from all subdomains, increasing attack surface.`,
          recommendation: 'Restrict administrative cookies to specific subdomain only.',
          metadata: { adminCookie: true, sharedDomain: cookie.domain }
        })
      }
    }
  }

  return findings
}

/**
 * 3. Cookie Path Restrictions
 * Analyzes path specificity for security
 */
export function analyzeCookiePaths(cookies: Cookie[]): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []

  for (const cookie of cookies) {
    const path = cookie.path || '/'

    // Check if administrative cookies have broad paths
    if (cookie.name.toLowerCase().includes('admin') ||
        cookie.name.toLowerCase().includes('cms') ||
        cookie.name.toLowerCase().includes('dashboard')) {

      if (path === '/') {
        findings.push({
          cookieName: cookie.name,
          category: 'path',
          severity: 'medium',
          issue: 'Admin cookie accessible site-wide',
          description: `Administrative cookie "${cookie.name}" is sent with all requests to the site.`,
          recommendation: 'Restrict to /admin or specific administrative path to reduce exposure.',
          metadata: { currentPath: path, suggestedPath: '/admin' }
        })
      }
    }

    // Check API cookies
    if (cookie.name.toLowerCase().includes('api') ||
        cookie.name.toLowerCase().includes('key')) {

      if (path === '/') {
        findings.push({
          cookieName: cookie.name,
          category: 'path',
          severity: 'medium',
          issue: 'API cookie with broad path',
          description: `API-related cookie "${cookie.name}" is sent with all requests.`,
          recommendation: 'Restrict to /api or specific API path.',
          metadata: { currentPath: path, suggestedPath: '/api' }
        })
      }
    }

    // Positive finding: well-scoped cookies
    if (path !== '/' && path !== '') {
      // This is good practice, note it as a positive
      if (cookie.secure && cookie.httpOnly) {
        findings.push({
          cookieName: cookie.name,
          category: 'path',
          severity: 'low',
          issue: 'Good: Path-restricted cookie',
          description: `Cookie "${cookie.name}" is properly restricted to path "${path}"`,
          recommendation: 'No action needed - this is good security practice.',
          metadata: { goodPractice: true, path }
        })
      }
    }
  }

  return findings
}

/**
 * 4. Cookie Expiry Analysis
 * Checks expiration settings and session vs persistent cookies
 */
export function analyzeCookieExpiry(cookies: Cookie[]): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []
  const now = Date.now()

  for (const cookie of cookies) {
    // Check session cookies that should be persistent
    if (!cookie.expires) {
      if (cookie.name.toLowerCase().includes('remember') ||
          cookie.name.toLowerCase().includes('persist')) {
        findings.push({
          cookieName: cookie.name,
          category: 'expiry',
          severity: 'medium',
          issue: 'Persistent cookie is session-only',
          description: `Cookie "${cookie.name}" appears to be for persistence but expires with session.`,
          recommendation: 'Set appropriate expiry for remember-me functionality.',
          metadata: { isSession: true }
        })
      }
    }

    // Check for already expired cookies
    if (cookie.expires) {
      const expiresTime = new Date(cookie.expires).getTime()
      if (expiresTime < now) {
        findings.push({
          cookieName: cookie.name,
          category: 'expiry',
          severity: 'low',
          issue: 'Cookie already expired',
          description: `Cookie "${cookie.name}" has already expired and should be removed.`,
          recommendation: 'Remove expired cookies from being set.',
          metadata: { expired: true, expiryDate: cookie.expires }
        })
      }
    }

    // Check sensitive cookies with long expiry
    const sensitiveCookiePatterns = ['session', 'auth', 'token', 'csrf']
    const isSensitive = sensitiveCookiePatterns.some(pattern =>
      cookie.name.toLowerCase().includes(pattern)
    )

    if (isSensitive && cookie.expires) {
      const expiresTime = cookie.expires * 1000 // Convert seconds to milliseconds
      const now = Date.now()
      const hoursUntilExpiry = Math.floor((expiresTime - now) / (1000 * 60 * 60))

      if (hoursUntilExpiry > 24) { // More than 24 hours
        findings.push({
          cookieName: cookie.name,
          category: 'expiry',
          severity: 'medium',
          issue: 'Sensitive cookie with long expiry',
          description: `Sensitive cookie "${cookie.name}" expires in ${hoursUntilExpiry} hours.`,
          recommendation: 'Use shorter expiry (max 24 hours) for sensitive session cookies.',
          metadata: { expiryHours: hoursUntilExpiry, sensitive: true }
        })
      }
    }
  }

  return findings
}

/**
 * 5. Session Fixation Detection
 * Detects potential session fixation vulnerabilities
 */
export function detectSessionFixation(cookies: Cookie[], html: string): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []

  // Find session cookies
  const sessionCookies = cookies.filter(c =>
    c.name.toLowerCase().includes('session') ||
    c.name.toLowerCase().includes('sid') ||
    c.name.toLowerCase().includes('jsessionid') ||
    c.name.toLowerCase().includes('phpsessid') ||
    c.name.toLowerCase().includes('asp.net_sessionid')
  )

  for (const sessionCookie of sessionCookies) {
    // Check if session ID appears in URL (major risk)
    const sessionPattern = new RegExp(`[?&]${sessionCookie.name}=([^&]+)`, 'i')
    if (sessionPattern.test(html)) {
      findings.push({
        cookieName: sessionCookie.name,
        category: 'session',
        severity: 'critical',
        issue: 'Session ID in URL',
        description: `Session cookie "${sessionCookie.name}" appears in URLs, enabling session fixation attacks.`,
        recommendation: 'Never pass session IDs in URLs. Use cookies with Secure and HttpOnly flags.',
        metadata: { inUrl: true }
      })
    }

    // Check for missing security flags on session cookies
    if (!sessionCookie.secure || !sessionCookie.httpOnly) {
      const missingFlags = []
      if (!sessionCookie.secure) missingFlags.push('Secure')
      if (!sessionCookie.httpOnly) missingFlags.push('HttpOnly')

      findings.push({
        cookieName: sessionCookie.name,
        category: 'session',
        severity: 'high',
        issue: 'Session cookie missing security flags',
        description: `Session cookie "${sessionCookie.name}" missing flags: ${missingFlags.join(', ')}`,
        recommendation: 'Add all security flags to session cookies: Secure, HttpOnly, SameSite=Strict',
        metadata: { missingFlags }
      })
    }

    // Check for predictable session IDs (low entropy)
    if (sessionCookie.value) {
      const entropy = calculateEntropy(sessionCookie.value)
      if (entropy < 4.0) { // Less than 4 bits per character is concerning
        findings.push({
          cookieName: sessionCookie.name,
          category: 'session',
          severity: 'high',
          issue: 'Low entropy session ID',
          description: `Session cookie "${sessionCookie.name}" has low randomness, may be predictable.`,
          recommendation: 'Use cryptographically secure random number generator for session IDs.',
          metadata: { entropy: entropy.toFixed(2) }
        })
      }
    }

    // Check for session cookies without SameSite
    if (!sessionCookie.sameSite || sessionCookie.sameSite === 'None') {
      findings.push({
        cookieName: sessionCookie.name,
        category: 'session',
        severity: 'medium',
        issue: 'Session cookie without CSRF protection',
        description: `Session cookie "${sessionCookie.name}" lacks SameSite attribute or set to None.`,
        recommendation: 'Set SameSite=Lax or SameSite=Strict for CSRF protection.',
        metadata: { sameSite: sessionCookie.sameSite || 'not set' }
      })
    }
  }

  // Check for login forms without session regeneration indicators
  if (html.toLowerCase().includes('login') || html.toLowerCase().includes('sign in')) {
    const hasSessionRegeneration = html.includes('regenerate') ||
                                   html.includes('new_session') ||
                                   html.includes('session_regenerate')

    if (!hasSessionRegeneration && sessionCookies.length > 0) {
      findings.push({
        cookieName: 'N/A',
        category: 'session',
        severity: 'medium',
        issue: 'No session regeneration detected',
        description: 'Login page found but no indication of session regeneration after login.',
        recommendation: 'Regenerate session ID after successful authentication to prevent fixation.',
        metadata: { loginPageDetected: true }
      })
    }
  }

  return findings
}

/**
 * 6. Cookie Size Optimization
 * Checks for oversized cookies
 */
export function analyzeCookieSize(cookies: Cookie[]): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []
  const MAX_COOKIE_SIZE = 4096 // 4KB browser limit
  const MAX_TOTAL_SIZE = 8192 // Reasonable total limit

  let totalSize = 0

  for (const cookie of cookies) {
    const cookieSize = cookie.name.length + (cookie.value?.length || 0)
    totalSize += cookieSize

    // Individual cookie too large
    if (cookieSize > MAX_COOKIE_SIZE) {
      findings.push({
        cookieName: cookie.name,
        category: 'size',
        severity: 'high',
        issue: 'Cookie exceeds 4KB limit',
        description: `Cookie "${cookie.name}" is ${cookieSize} bytes, exceeding browser limit.`,
        recommendation: 'Store data server-side and use a session identifier instead.',
        metadata: { size: cookieSize, limit: MAX_COOKIE_SIZE }
      })
    } else if (cookieSize > 2048) {
      findings.push({
        cookieName: cookie.name,
        category: 'size',
        severity: 'medium',
        issue: 'Large cookie size',
        description: `Cookie "${cookie.name}" is ${cookieSize} bytes (over 2KB).`,
        recommendation: 'Consider reducing cookie data or using server-side storage.',
        metadata: { size: cookieSize }
      })
    }

    // Check for base64 encoded data (inefficient)
    if (cookie.value && /^[A-Za-z0-9+/]+=*$/.test(cookie.value) && cookie.value.length > 100) {
      findings.push({
        cookieName: cookie.name,
        category: 'size',
        severity: 'low',
        issue: 'Cookie contains base64 data',
        description: `Cookie "${cookie.name}" appears to contain base64 encoded data.`,
        recommendation: 'Consider server-side storage for large data instead of cookies.',
        metadata: { base64Detected: true }
      })
    }
  }

  // Check total cookie size
  if (totalSize > MAX_TOTAL_SIZE) {
    findings.push({
      cookieName: 'N/A',
      category: 'size',
      severity: 'high',
      issue: 'Total cookie size too large',
      description: `Total size of all cookies is ${totalSize} bytes, may cause request failures.`,
      recommendation: 'Reduce number of cookies or move data to server-side storage.',
      metadata: { totalSize, cookieCount: cookies.length }
    })
  }

  return findings
}

/**
 * 7. Cookie Poisoning Detection
 * Detects suspicious cookie patterns
 */
export function detectCookiePoisoning(cookies: Cookie[]): EnhancedCookieFinding[] {
  const findings: EnhancedCookieFinding[] = []

  // Group cookies by prefix to detect pollution
  const cookieGroups: Record<string, Cookie[]> = {}

  for (const cookie of cookies) {
    const prefix = cookie.name.split(/[_-]/)[0]
    if (!cookieGroups[prefix]) cookieGroups[prefix] = []
    cookieGroups[prefix].push(cookie)
  }

  // Check for suspicious duplicate patterns
  for (const [prefix, group] of Object.entries(cookieGroups)) {
    if (group.length > 5 && prefix.length > 2) {
      findings.push({
        cookieName: prefix + '*',
        category: 'poisoning',
        severity: 'medium',
        issue: 'Multiple cookies with same prefix',
        description: `${group.length} cookies found with prefix "${prefix}", possible cookie pollution.`,
        recommendation: 'Investigate duplicate cookies and implement proper cookie management.',
        metadata: {
          prefix,
          count: group.length,
          cookies: group.map(c => c.name)
        }
      })
    }
  }

  // Check for injection attempts in cookie values
  const injectionPatterns = [
    { pattern: /<script/i, type: 'XSS' },
    { pattern: /javascript:/i, type: 'JavaScript' },
    { pattern: /%3Cscript/i, type: 'Encoded XSS' },
    { pattern: /\' OR \'1\'=\'1/i, type: 'SQL Injection' },
    { pattern: /\.\.\//g, type: 'Path Traversal' }
  ]

  for (const cookie of cookies) {
    if (!cookie.value) continue

    for (const { pattern, type } of injectionPatterns) {
      if (pattern.test(cookie.value)) {
        findings.push({
          cookieName: cookie.name,
          category: 'poisoning',
          severity: 'high',
          issue: `${type} attempt in cookie`,
          description: `Cookie "${cookie.name}" contains potential ${type} payload.`,
          recommendation: 'Sanitize and validate all cookie values. Investigate potential attack.',
          metadata: { injectionType: type, sample: cookie.value.substring(0, 50) }
        })
      }
    }
  }

  return findings
}

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0

  const frequencies: Record<string, number> = {}
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1
  }

  let entropy = 0
  const len = str.length
  for (const char in frequencies) {
    const p = frequencies[char] / len
    entropy -= p * Math.log2(p)
  }

  return entropy
}

/**
 * Main enhanced cookie analysis function
 */
export function analyzeEnhancedCookieSecurity(
  cookies: Cookie[],
  currentDomain: string,
  html: string
): EnhancedCookieFinding[] {
  const allFindings: EnhancedCookieFinding[] = []

  // Run all enhanced analyses
  allFindings.push(...analyzeCookiePrefixes(cookies, currentDomain))
  allFindings.push(...analyzeCookieDomainScope(cookies, currentDomain))
  allFindings.push(...analyzeCookiePaths(cookies))
  allFindings.push(...analyzeCookieExpiry(cookies))
  allFindings.push(...detectSessionFixation(cookies, html))
  allFindings.push(...analyzeCookieSize(cookies))
  allFindings.push(...detectCookiePoisoning(cookies))

  return allFindings
}
/**
 * Rate Limiting & Bot Protection Analyzer
 *
 * Detects rate limiting implementations and bot protection mechanisms.
 *
 * Checks for:
 * - Rate limit headers (X-RateLimit-*, RateLimit-*, Retry-After)
 * - Bot protection (reCAPTCHA, hCaptcha, Cloudflare Turnstile)
 * - DDoS protection indicators
 * - API throttling mechanisms
 *
 * ALL CHECKS ARE PASSIVE - analyzing headers, HTML, and JavaScript only
 */

interface RateLimitFinding {
  type: string
  severity: 'info' | 'low' | 'medium' | 'high'
  title: string
  category: string
  provider?: string
  evidence?: string
  headers?: Record<string, string>
  recommendation?: string
  impact?: string
}

export interface RateLimitResult {
  findings: RateLimitFinding[]
  hasRateLimit: boolean
  hasBotProtection: boolean
  botProtectionProviders: string[]
  rateLimitHeaders: Record<string, string>
}

export async function analyzeRateLimiting(
  headers: Record<string, string>,
  html: string
): Promise<RateLimitResult> {
  const findings: RateLimitFinding[] = []
  const rateLimitHeaders: Record<string, string> = {}
  const botProtectionProviders: string[] = []

  // Normalize headers
  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key]
  })

  // Check for rate limit headers
  const rateLimitDetected = checkRateLimitHeaders(normalizedHeaders, rateLimitHeaders, findings)

  // Check for bot protection
  const botProtection = detectBotProtection(html)
  botProtection.forEach(provider => {
    botProtectionProviders.push(provider.name)
    findings.push({
      type: 'bot-protection',
      severity: 'info',
      title: `Bot Protection: ${provider.name}`,
      category: 'rate-limit',
      provider: provider.name,
      evidence: provider.evidence,
    })
  })

  // Recommendations
  if (!rateLimitDetected) {
    findings.push({
      type: 'rate-limit-missing',
      severity: 'medium',
      title: 'No Rate Limiting Detected',
      category: 'rate-limit',
      impact: 'API abuse and brute-force attacks may be possible',
      recommendation: 'Implement rate limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining) to prevent abuse',
    })
  }

  if (botProtectionProviders.length === 0) {
    findings.push({
      type: 'bot-protection-missing',
      severity: 'low',
      title: 'No Bot Protection Detected',
      category: 'rate-limit',
      impact: 'Automated attacks and scraping may be easier',
      recommendation: 'Consider implementing reCAPTCHA, hCaptcha, or Cloudflare Turnstile for forms and sensitive endpoints',
    })
  }

  return {
    findings,
    hasRateLimit: rateLimitDetected,
    hasBotProtection: botProtectionProviders.length > 0,
    botProtectionProviders,
    rateLimitHeaders,
  }
}

/**
 * Check for Rate Limit Headers
 */
function checkRateLimitHeaders(
  headers: Record<string, string>,
  rateLimitHeaders: Record<string, string>,
  findings: RateLimitFinding[]
): boolean {
  let detected = false

  // Standard rate limit headers
  const rateLimitPatterns = [
    { key: 'x-ratelimit-limit', name: 'X-RateLimit-Limit' },
    { key: 'x-ratelimit-remaining', name: 'X-RateLimit-Remaining' },
    { key: 'x-ratelimit-reset', name: 'X-RateLimit-Reset' },
    { key: 'ratelimit-limit', name: 'RateLimit-Limit' },
    { key: 'ratelimit-remaining', name: 'RateLimit-Remaining' },
    { key: 'ratelimit-reset', name: 'RateLimit-Reset' },
    { key: 'retry-after', name: 'Retry-After' },
    { key: 'x-rate-limit', name: 'X-Rate-Limit' },
  ]

  for (const pattern of rateLimitPatterns) {
    if (headers[pattern.key]) {
      rateLimitHeaders[pattern.name] = headers[pattern.key]
      detected = true
    }
  }

  if (detected) {
    const headerList = Object.keys(rateLimitHeaders).join(', ')
    findings.push({
      type: 'rate-limit-headers',
      severity: 'info',
      title: 'Rate Limiting Headers Detected',
      category: 'rate-limit',
      evidence: headerList,
      headers: rateLimitHeaders,
    })
  }

  return detected
}

/**
 * Detect Bot Protection
 */
function detectBotProtection(html: string): Array<{ name: string; evidence: string }> {
  const providers: Array<{ name: string; evidence: string }> = []
  const lowerHTML = html.toLowerCase()

  // reCAPTCHA
  if (
    lowerHTML.includes('recaptcha') ||
    lowerHTML.includes('google.com/recaptcha') ||
    html.includes('grecaptcha')
  ) {
    providers.push({ name: 'reCAPTCHA', evidence: 'Google reCAPTCHA script detected' })
  }

  // hCaptcha
  if (lowerHTML.includes('hcaptcha') || lowerHTML.includes('hcaptcha.com')) {
    providers.push({ name: 'hCaptcha', evidence: 'hCaptcha script detected' })
  }

  // Cloudflare Turnstile
  if (lowerHTML.includes('turnstile') || lowerHTML.includes('cf-turnstile')) {
    providers.push({ name: 'Cloudflare Turnstile', evidence: 'Cloudflare Turnstile detected' })
  }

  // Cloudflare Bot Management
  if (lowerHTML.includes('__cf_bm') || lowerHTML.includes('cf_clearance')) {
    providers.push({ name: 'Cloudflare Bot Management', evidence: 'Cloudflare bot management cookies detected' })
  }

  // Imperva Bot Protection
  if (lowerHTML.includes('incapsula') || lowerHTML.includes('imperva')) {
    providers.push({ name: 'Imperva Bot Protection', evidence: 'Imperva/Incapsula bot protection detected' })
  }

  // DataDome
  if (lowerHTML.includes('datadome')) {
    providers.push({ name: 'DataDome', evidence: 'DataDome bot protection detected' })
  }

  // PerimeterX
  if (lowerHTML.includes('perimeterx') || lowerHTML.includes('_px')) {
    providers.push({ name: 'PerimeterX', evidence: 'PerimeterX bot protection detected' })
  }

  // Akamai Bot Manager
  if (lowerHTML.includes('akamai bot manager') || lowerHTML.includes('akam_bmsc')) {
    providers.push({ name: 'Akamai Bot Manager', evidence: 'Akamai bot management detected' })
  }

  return providers
}

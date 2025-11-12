/**
 * WAF Detection Analyzer
 *
 * Detects Web Application Firewalls (WAF) and their configurations.
 * WAFs protect web applications from common attacks like:
 * - SQL injection
 * - Cross-site scripting (XSS)
 * - DDoS attacks
 * - Bot traffic
 *
 * Supported WAFs:
 * - Cloudflare
 * - AWS WAF
 * - Akamai
 * - Imperva (Incapsula)
 * - F5 BIG-IP ASM
 * - ModSecurity
 * - Sucuri
 * - StackPath
 * - Fastly
 * - Barracuda
 *
 * ALL CHECKS ARE PASSIVE - analyzing response headers and cookies only
 */

interface WAFDetection {
  provider: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  features?: string[]
}

interface WAFFinding {
  type: string
  severity: 'info' | 'low' | 'medium' | 'high'
  title: string
  category: string
  provider?: string
  confidence?: string
  evidence?: string
  features?: string[]
  recommendation?: string
  impact?: string
}

export interface WAFResult {
  findings: WAFFinding[]
  detectedWAFs: WAFDetection[]
  hasWAF: boolean
  primaryWAF?: string
}

export async function analyzeWAFDetection(
  headers: Record<string, string>,
  cookies: any[],
  html: string
): Promise<WAFResult> {
  const findings: WAFFinding[] = []
  const detectedWAFs: WAFDetection[] = []

  // Normalize headers to lowercase for case-insensitive matching
  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key]
  })

  // Check for Cloudflare
  const cloudflare = detectCloudflare(normalizedHeaders, cookies)
  if (cloudflare) {
    detectedWAFs.push(cloudflare)
    findings.push({
      type: 'waf-cloudflare',
      severity: 'info',
      title: 'Cloudflare WAF Detected',
      category: 'waf',
      provider: 'Cloudflare',
      confidence: cloudflare.confidence,
      evidence: cloudflare.evidence.join(', '),
      features: cloudflare.features,
    })
  }

  // Check for AWS WAF
  const awsWAF = detectAWSWAF(normalizedHeaders)
  if (awsWAF) {
    detectedWAFs.push(awsWAF)
    findings.push({
      type: 'waf-aws',
      severity: 'info',
      title: 'AWS WAF Detected',
      category: 'waf',
      provider: 'AWS WAF',
      confidence: awsWAF.confidence,
      evidence: awsWAF.evidence.join(', '),
    })
  }

  // Check for Akamai
  const akamai = detectAkamai(normalizedHeaders, cookies)
  if (akamai) {
    detectedWAFs.push(akamai)
    findings.push({
      type: 'waf-akamai',
      severity: 'info',
      title: 'Akamai WAF Detected',
      category: 'waf',
      provider: 'Akamai',
      confidence: akamai.confidence,
      evidence: akamai.evidence.join(', '),
    })
  }

  // Check for Imperva (Incapsula)
  const imperva = detectImperva(normalizedHeaders, cookies)
  if (imperva) {
    detectedWAFs.push(imperva)
    findings.push({
      type: 'waf-imperva',
      severity: 'info',
      title: 'Imperva (Incapsula) WAF Detected',
      category: 'waf',
      provider: 'Imperva',
      confidence: imperva.confidence,
      evidence: imperva.evidence.join(', '),
    })
  }

  // Check for F5 BIG-IP
  const f5 = detectF5(normalizedHeaders, cookies)
  if (f5) {
    detectedWAFs.push(f5)
    findings.push({
      type: 'waf-f5',
      severity: 'info',
      title: 'F5 BIG-IP ASM Detected',
      category: 'waf',
      provider: 'F5 BIG-IP',
      confidence: f5.confidence,
      evidence: f5.evidence.join(', '),
    })
  }

  // Check for ModSecurity
  const modsec = detectModSecurity(normalizedHeaders)
  if (modsec) {
    detectedWAFs.push(modsec)
    findings.push({
      type: 'waf-modsecurity',
      severity: 'info',
      title: 'ModSecurity Detected',
      category: 'waf',
      provider: 'ModSecurity',
      confidence: modsec.confidence,
      evidence: modsec.evidence.join(', '),
    })
  }

  // Check for Sucuri
  const sucuri = detectSucuri(normalizedHeaders, html)
  if (sucuri) {
    detectedWAFs.push(sucuri)
    findings.push({
      type: 'waf-sucuri',
      severity: 'info',
      title: 'Sucuri WAF Detected',
      category: 'waf',
      provider: 'Sucuri',
      confidence: sucuri.confidence,
      evidence: sucuri.evidence.join(', '),
    })
  }

  // Check for StackPath (formerly MaxCDN)
  const stackpath = detectStackPath(normalizedHeaders)
  if (stackpath) {
    detectedWAFs.push(stackpath)
    findings.push({
      type: 'waf-stackpath',
      severity: 'info',
      title: 'StackPath WAF Detected',
      category: 'waf',
      provider: 'StackPath',
      confidence: stackpath.confidence,
      evidence: stackpath.evidence.join(', '),
    })
  }

  // Check for Fastly
  const fastly = detectFastly(normalizedHeaders)
  if (fastly) {
    detectedWAFs.push(fastly)
    findings.push({
      type: 'waf-fastly',
      severity: 'info',
      title: 'Fastly WAF Detected',
      category: 'waf',
      provider: 'Fastly',
      confidence: fastly.confidence,
      evidence: fastly.evidence.join(', '),
    })
  }

  // Check for Barracuda
  const barracuda = detectBarracuda(normalizedHeaders, cookies)
  if (barracuda) {
    detectedWAFs.push(barracuda)
    findings.push({
      type: 'waf-barracuda',
      severity: 'info',
      title: 'Barracuda WAF Detected',
      category: 'waf',
      provider: 'Barracuda',
      confidence: barracuda.confidence,
      evidence: barracuda.evidence.join(', '),
    })
  }

  // If no WAF detected, add recommendation
  if (detectedWAFs.length === 0) {
    findings.push({
      type: 'waf-not-detected',
      severity: 'medium',
      title: 'No Web Application Firewall Detected',
      category: 'waf',
      impact: 'Website may be vulnerable to common web attacks',
      recommendation: 'Consider implementing a WAF like Cloudflare, AWS WAF, or Akamai to protect against SQL injection, XSS, and DDoS attacks',
    })
  }

  // Determine primary WAF (highest confidence)
  let primaryWAF: string | undefined
  if (detectedWAFs.length > 0) {
    const sorted = [...detectedWAFs].sort((a, b) => {
      const confMap = { high: 3, medium: 2, low: 1 }
      return confMap[b.confidence] - confMap[a.confidence]
    })
    primaryWAF = sorted[0].provider
  }

  return {
    findings,
    detectedWAFs,
    hasWAF: detectedWAFs.length > 0,
    primaryWAF,
  }
}

/**
 * Cloudflare Detection
 */
function detectCloudflare(
  headers: Record<string, string>,
  cookies: any[]
): WAFDetection | null {
  const evidence: string[] = []
  const features: string[] = []

  // Check for Cloudflare headers
  if (headers['cf-ray']) {
    evidence.push('CF-Ray header present')
  }
  if (headers['cf-cache-status']) {
    evidence.push(`CF-Cache-Status: ${headers['cf-cache-status']}`)
    features.push('CDN Caching')
  }
  if (headers['cf-request-id']) {
    evidence.push('CF-Request-ID header present')
  }
  if (headers['server']?.toLowerCase().includes('cloudflare')) {
    evidence.push(`Server: ${headers['server']}`)
  }

  // Check for Cloudflare cookies
  const cfCookies = cookies.filter(c =>
    c.name?.startsWith('__cf') ||
    c.name === '__cfduid' ||
    c.name === 'cf_clearance'
  )
  if (cfCookies.length > 0) {
    evidence.push(`Cloudflare cookies: ${cfCookies.map(c => c.name).join(', ')}`)
    if (cfCookies.some(c => c.name === 'cf_clearance')) {
      features.push('Bot Management')
    }
  }

  // Check for specific Cloudflare features
  if (headers['cf-mitigated']) {
    evidence.push('CF-Mitigated header (DDoS protection active)')
    features.push('DDoS Protection')
  }

  if (evidence.length === 0) return null

  return {
    provider: 'Cloudflare',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
    features: features.length > 0 ? features : ['WAF Protection', 'CDN'],
  }
}

/**
 * AWS WAF Detection
 */
function detectAWSWAF(headers: Record<string, string>): WAFDetection | null {
  const evidence: string[] = []

  if (headers['x-amzn-requestid']) {
    evidence.push('X-Amzn-RequestId header present')
  }
  if (headers['x-amzn-trace-id']) {
    evidence.push('X-Amzn-Trace-Id header present')
  }
  if (headers['x-amz-cf-id']) {
    evidence.push('X-Amz-Cf-Id header (CloudFront distribution)')
  }
  if (headers['x-amz-cf-pop']) {
    evidence.push(`X-Amz-Cf-Pop: ${headers['x-amz-cf-pop']}`)
  }

  // AWS WAF specific headers
  if (headers['x-amzn-waf-action']) {
    evidence.push(`X-Amzn-Waf-Action: ${headers['x-amzn-waf-action']}`)
  }

  if (evidence.length === 0) return null

  return {
    provider: 'AWS WAF',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * Akamai Detection
 */
function detectAkamai(
  headers: Record<string, string>,
  cookies: any[]
): WAFDetection | null {
  const evidence: string[] = []

  // Akamai headers
  if (headers['x-akamai-request-id']) {
    evidence.push('X-Akamai-Request-ID header present')
  }
  if (headers['x-akamai-session-info']) {
    evidence.push('X-Akamai-Session-Info header present')
  }
  if (headers['akamai-origin-hop']) {
    evidence.push('Akamai-Origin-Hop header present')
  }
  if (headers['server-timing']?.includes('ak_p')) {
    evidence.push('Server-Timing contains Akamai markers')
  }

  // Akamai cookies
  const akamaiCookies = cookies.filter(c =>
    c.name?.startsWith('ak_') ||
    c.name === 'akamai-user-id'
  )
  if (akamaiCookies.length > 0) {
    evidence.push(`Akamai cookies: ${akamaiCookies.map(c => c.name).join(', ')}`)
  }

  if (evidence.length === 0) return null

  return {
    provider: 'Akamai',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * Imperva (Incapsula) Detection
 */
function detectImperva(
  headers: Record<string, string>,
  cookies: any[]
): WAFDetection | null {
  const evidence: string[] = []

  // Imperva headers
  if (headers['x-cdn']?.toLowerCase().includes('incapsula')) {
    evidence.push(`X-CDN: ${headers['x-cdn']}`)
  }
  if (headers['x-iinfo']) {
    evidence.push('X-Iinfo header (Imperva/Incapsula)')
  }

  // Imperva cookies
  const impervaCookies = cookies.filter(c =>
    c.name?.startsWith('incap_') ||
    c.name?.startsWith('visid_incap_') ||
    c.name === 'incap_ses_'
  )
  if (impervaCookies.length > 0) {
    evidence.push(`Imperva cookies: ${impervaCookies.map(c => c.name).join(', ')}`)
  }

  if (evidence.length === 0) return null

  return {
    provider: 'Imperva (Incapsula)',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * F5 BIG-IP Detection
 */
function detectF5(
  headers: Record<string, string>,
  cookies: any[]
): WAFDetection | null {
  const evidence: string[] = []

  // F5 headers
  if (headers['x-wa-info']) {
    evidence.push('X-WA-Info header (F5 WebAccelerator)')
  }

  // F5 cookies
  const f5Cookies = cookies.filter(c =>
    c.name?.startsWith('BIG') ||
    c.name?.startsWith('TS') ||
    c.name === 'F5_ST' ||
    c.name === 'F5_HT_shrinked'
  )
  if (f5Cookies.length > 0) {
    evidence.push(`F5 cookies: ${f5Cookies.map(c => c.name).join(', ')}`)
  }

  if (evidence.length === 0) return null

  return {
    provider: 'F5 BIG-IP',
    confidence: evidence.length >= 2 ? 'high' : 'low',
    evidence,
  }
}

/**
 * ModSecurity Detection
 */
function detectModSecurity(headers: Record<string, string>): WAFDetection | null {
  const evidence: string[] = []

  if (headers['server']?.toLowerCase().includes('mod_security')) {
    evidence.push(`Server: ${headers['server']}`)
  }
  if (headers['x-mod-security']) {
    evidence.push('X-Mod-Security header present')
  }

  if (evidence.length === 0) return null

  return {
    provider: 'ModSecurity',
    confidence: 'medium',
    evidence,
  }
}

/**
 * Sucuri Detection
 */
function detectSucuri(
  headers: Record<string, string>,
  html: string
): WAFDetection | null {
  const evidence: string[] = []

  // Sucuri headers
  if (headers['x-sucuri-id']) {
    evidence.push('X-Sucuri-ID header present')
  }
  if (headers['x-sucuri-cache']) {
    evidence.push(`X-Sucuri-Cache: ${headers['x-sucuri-cache']}`)
  }
  if (headers['server']?.toLowerCase().includes('sucuri')) {
    evidence.push(`Server: ${headers['server']}`)
  }

  // Check HTML for Sucuri references
  if (html.toLowerCase().includes('sucuri')) {
    evidence.push('Sucuri references in HTML')
  }

  if (evidence.length === 0) return null

  return {
    provider: 'Sucuri',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * StackPath Detection
 */
function detectStackPath(headers: Record<string, string>): WAFDetection | null {
  const evidence: string[] = []

  if (headers['x-sp-cache']) {
    evidence.push(`X-SP-Cache: ${headers['x-sp-cache']}`)
  }
  if (headers['x-stackpath-shield']) {
    evidence.push('X-StackPath-Shield header present')
  }
  if (headers['server']?.toLowerCase().includes('stackpath')) {
    evidence.push(`Server: ${headers['server']}`)
  }

  if (evidence.length === 0) return null

  return {
    provider: 'StackPath',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * Fastly Detection
 */
function detectFastly(headers: Record<string, string>): WAFDetection | null {
  const evidence: string[] = []

  if (headers['x-served-by']?.includes('cache')) {
    evidence.push(`X-Served-By: ${headers['x-served-by']}`)
  }
  if (headers['fastly-debug-digest']) {
    evidence.push('Fastly-Debug-Digest header present')
  }
  if (headers['x-cache']?.toLowerCase().includes('fastly')) {
    evidence.push(`X-Cache: ${headers['x-cache']}`)
  }
  if (headers['x-fastly-request-id']) {
    evidence.push('X-Fastly-Request-ID header present')
  }

  if (evidence.length === 0) return null

  return {
    provider: 'Fastly',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * Barracuda Detection
 */
function detectBarracuda(
  headers: Record<string, string>,
  cookies: any[]
): WAFDetection | null {
  const evidence: string[] = []

  // Barracuda headers
  if (headers['x-barracuda-url']) {
    evidence.push('X-Barracuda-URL header present')
  }

  // Barracuda cookies
  const barracudaCookies = cookies.filter(c =>
    c.name?.startsWith('barra') ||
    c.name?.includes('barracuda')
  )
  if (barracudaCookies.length > 0) {
    evidence.push(`Barracuda cookies: ${barracudaCookies.map(c => c.name).join(', ')}`)
  }

  if (evidence.length === 0) return null

  return {
    provider: 'Barracuda',
    confidence: evidence.length >= 2 ? 'high' : 'low',
    evidence,
  }
}

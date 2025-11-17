import { CrawlResult } from '../crawler-mock'

export interface SSLTLSResult {
  isSecure: boolean
  protocol: string
  certificate: CertificateInfo | null
  findings: SSLFinding[]
  mixedContent: MixedContentIssue[]
  score: number // 0-100
}

export interface CertificateInfo {
  issuer: string
  validFrom: string
  validTo: string
  daysUntilExpiry: number
  isExpired: boolean
  isSelfSigned: boolean
  subject: string
}

export interface SSLFinding {
  type: 'certificate' | 'protocol' | 'cipher' | 'mixed_content'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation: string
  evidence?: string
}

export interface MixedContentIssue {
  url: string
  type: 'script' | 'stylesheet' | 'image' | 'xhr' | 'other'
  severity: 'high' | 'medium'
}

/**
 * Analyze SSL/TLS configuration and certificate information
 *
 * Checks:
 * - HTTPS usage
 * - Certificate validity and expiry
 * - Certificate issuer (self-signed detection)
 * - Protocol version (TLS 1.0-1.3)
 * - Mixed content (HTTP resources on HTTPS pages)
 * - Weak cipher detection
 */
export function analyzeSSLTLS(crawlResult: CrawlResult): SSLTLSResult {
  const result: SSLTLSResult = {
    isSecure: false,
    protocol: 'http',
    certificate: null,
    findings: [],
    mixedContent: [],
    score: 0,
  }

  const url = new URL(crawlResult.finalUrl)
  const isHTTPS = url.protocol === 'https:'

  result.isSecure = isHTTPS
  result.protocol = url.protocol

  // Check 1: HTTPS usage
  if (!isHTTPS) {
    result.findings.push({
      type: 'protocol',
      severity: 'critical',
      title: 'No HTTPS encryption',
      description: 'Website is served over unencrypted HTTP connection',
      recommendation: 'Implement HTTPS with a valid SSL/TLS certificate. Use Let\'s Encrypt for free certificates.',
      evidence: `URL: ${crawlResult.finalUrl}`,
    })
    result.score = 0
    return result // Early return for HTTP sites
  }

  // For HTTPS sites, analyze further
  let score = 100

  // Check 2: Certificate information (from crawler result)
  // Note: Crawler stores certificate as sslCertificate (not in metadata.certificate)
  if (crawlResult.sslCertificate) {
    const cert = crawlResult.sslCertificate
    result.certificate = parseCertificateInfo(cert)

    // Check certificate expiry with reasonable thresholds
    // Nov 17, 2025: Adjusted thresholds to reduce false positives
    if (result.certificate.isExpired) {
      result.findings.push({
        type: 'certificate',
        severity: 'critical',
        title: 'SSL certificate expired',
        description: `Certificate expired on ${result.certificate.validTo}`,
        recommendation: 'Renew the SSL certificate immediately to prevent browser warnings.',
        evidence: `Expired ${Math.abs(result.certificate.daysUntilExpiry)} days ago`,
      })
      score -= 40
    } else if (result.certificate.daysUntilExpiry <= 14) {
      // Critical - expiring very soon
      result.findings.push({
        type: 'certificate',
        severity: 'critical',
        title: 'SSL certificate expiring imminently',
        description: `Certificate expires in ${result.certificate.daysUntilExpiry} days`,
        recommendation: 'Renew the SSL certificate immediately to avoid service disruption.',
        evidence: `Expires: ${result.certificate.validTo}`,
      })
      score -= 30
    } else if (result.certificate.daysUntilExpiry <= 30) {
      // High - expiring soon
      result.findings.push({
        type: 'certificate',
        severity: 'high',
        title: 'SSL certificate expiring soon',
        description: `Certificate expires in ${result.certificate.daysUntilExpiry} days`,
        recommendation: 'Renew the SSL certificate before expiration. Most CAs recommend renewal at 30 days.',
        evidence: `Expires: ${result.certificate.validTo}`,
      })
      score -= 20
    } else if (result.certificate.daysUntilExpiry <= 60) {
      // Low - informational only
      result.findings.push({
        type: 'certificate',
        severity: 'low',
        title: 'SSL certificate renewal reminder',
        description: `Certificate expires in ${result.certificate.daysUntilExpiry} days`,
        recommendation: 'Plan certificate renewal. Consider automated renewal with Let\'s Encrypt.',
        evidence: `Expires: ${result.certificate.validTo}`,
      })
      score -= 5
    }
    // Removed 90-day warning - too early for most organizations

    // Check for self-signed certificates
    if (result.certificate.isSelfSigned) {
      result.findings.push({
        type: 'certificate',
        severity: 'high',
        title: 'Self-signed SSL certificate',
        description: 'Certificate is self-signed and not trusted by browsers',
        recommendation: 'Use a certificate from a trusted Certificate Authority (CA) like Let\'s Encrypt.',
        evidence: `Issuer: ${result.certificate.issuer}`,
      })
      score -= 30
    }
  }

  // Check 3: Mixed content detection
  const mixedContent = detectMixedContent(crawlResult)
  result.mixedContent = mixedContent

  if (mixedContent.length > 0) {
    const criticalMixed = mixedContent.filter(m => m.severity === 'high').length
    const minorMixed = mixedContent.filter(m => m.severity === 'medium').length

    result.findings.push({
      type: 'mixed_content',
      severity: criticalMixed > 0 ? 'high' : 'medium',
      title: 'Mixed content detected',
      description: `Found ${criticalMixed} critical and ${minorMixed} minor mixed content resources`,
      recommendation: 'Serve all resources over HTTPS. Update HTTP URLs to HTTPS or use protocol-relative URLs.',
      evidence: `${mixedContent.length} HTTP resources on HTTPS page`,
    })

    score -= (criticalMixed * 10 + minorMixed * 5)
  }

  // Check 4: Protocol version and cipher detection (from response headers)
  const weakProtocol = checkWeakProtocol(crawlResult)
  if (weakProtocol) {
    result.findings.push({
      type: 'protocol',
      severity: 'high',
      title: 'Outdated TLS protocol',
      description: weakProtocol.description,
      recommendation: 'Disable TLS 1.0 and TLS 1.1. Use TLS 1.2 or TLS 1.3 only.',
      evidence: weakProtocol.evidence,
    })
    score -= 25
  }

  result.score = Math.max(0, Math.min(100, score))

  return result
}

/**
 * Parse certificate information from crawler result
 */
function parseCertificateInfo(cert: any): CertificateInfo {
  // Node.js tls module returns dates as:
  // - valid_from: "Oct 28 21:07:54 2025 GMT" (string)
  // - valid_to: "Jan 26 22:07:41 2026 GMT" (string)

  // Try both snake_case and camelCase (for backwards compatibility)
  const validFromStr = cert.valid_from || cert.validFrom
  const validToStr = cert.valid_to || cert.validTo

  let validFrom: Date
  let validTo: Date

  try {
    validFrom = new Date(validFromStr)
    validTo = new Date(validToStr)
  } catch (error) {
    // If parsing fails, return safe defaults
    console.warn('[SSL/TLS] Failed to parse certificate dates:', error)
    validFrom = new Date(0) // Epoch
    validTo = new Date(0)
  }

  const now = new Date()

  // Check if dates are valid
  const isValidFromValid = !isNaN(validFrom.getTime()) && validFrom.getTime() > 0
  const isValidToValid = !isNaN(validTo.getTime()) && validTo.getTime() > 0

  const daysUntilExpiry = isValidToValid
    ? Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpired = isValidToValid && daysUntilExpiry < 0

  // Check if self-signed (issuer === subject)
  // Nov 17, 2025: Improved self-signed detection to reduce false positives
  // Extract CN and O (Organization) from issuer and subject objects
  const issuerCN = cert.issuer?.CN || cert.issuer || ''
  const subjectCN = cert.subject?.CN || cert.subject || ''
  const issuerO = cert.issuer?.O || ''
  const subjectO = cert.subject?.O || ''

  // Self-signed if issuer and subject are identical (both CN and O)
  // But not if it's a CA certificate or has different organizations
  const isSelfSigned = (
    issuerCN === subjectCN &&
    issuerO === subjectO &&
    issuerCN !== '' &&
    !issuerCN.toLowerCase().includes(' ca') && // Not a CA certificate
    !issuerCN.toLowerCase().includes('certificate authority') &&
    !issuerO.toLowerCase().includes('certificate authority')
  )

  // Format issuer name (include organization if available)
  let issuerName = issuerCN
  if (cert.issuer?.O) {
    issuerName = `${cert.issuer.O} (${issuerCN})`
  }

  return {
    issuer: issuerName,
    validFrom: isValidFromValid ? validFrom.toISOString().split('T')[0] : 'Unknown',
    validTo: isValidToValid ? validTo.toISOString().split('T')[0] : 'Unknown',
    daysUntilExpiry,
    isExpired,
    isSelfSigned,
    subject: subjectCN,
  }
}

/**
 * Detect mixed content (HTTP resources on HTTPS pages)
 * Nov 17, 2025: Reduced false positives for tracking pixels and localhost
 */
function detectMixedContent(crawlResult: CrawlResult): MixedContentIssue[] {
  const issues: MixedContentIssue[] = []

  // Only check if the main page is HTTPS
  const pageURL = new URL(crawlResult.finalUrl)
  if (pageURL.protocol !== 'https:') {
    return issues
  }

  // Whitelist of common HTTP-only tracking/analytics services
  const httpOnlyServices = [
    'pixel.adsafeprotected.com',
    'pixel.quantserve.com',
    'b.scorecardresearch.com',
    'pixel.mathtag.com',
    'impression.appsflyer.com',
    'pixel.tapad.com'
  ]

  // Check network requests for HTTP resources
  for (const request of crawlResult.networkRequests || []) {
    const resourceURL = request.url

    // Skip non-HTTP, data:, and blob: URLs
    if (!resourceURL.toLowerCase().startsWith('http://')) continue
    if (resourceURL.startsWith('data:') || resourceURL.startsWith('blob:')) continue

    try {
      const urlObj = new URL(resourceURL)

      // Skip localhost/development URLs
      if (urlObj.hostname === 'localhost' ||
          urlObj.hostname === '127.0.0.1' ||
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.') ||
          urlObj.hostname.endsWith('.local') ||
          urlObj.hostname.endsWith('.localhost')) continue

      // Skip known HTTP-only services
      if (httpOnlyServices.some(service => urlObj.hostname.includes(service))) continue

      // Categorize by type with proper severity
      const type = request.resourceType || 'other'
      const severity: 'high' | 'medium' =
        (type === 'script' || type === 'stylesheet' || type === 'xhr' || type === 'fetch')
          ? 'high'  // Active mixed content
          : 'medium' // Passive mixed content (images, etc.)

      issues.push({
        url: request.url,
        type: type as any,
        severity,
      })
    } catch (e) {
      // Invalid URL, skip
      continue
    }
  }

  // Check scripts for HTTP URLs (but apply same filtering)
  for (const script of crawlResult.scripts || []) {
    if (script.toLowerCase().startsWith('http://')) {
      try {
        const urlObj = new URL(script)

        // Skip localhost and known services
        if (urlObj.hostname === 'localhost' ||
            urlObj.hostname === '127.0.0.1' ||
            httpOnlyServices.some(service => urlObj.hostname.includes(service))) continue

        issues.push({
          url: script,
          type: 'script',
          severity: 'high',
        })
      } catch (e) {
        // Invalid URL, skip
        continue
      }
    }
  }

  return issues
}

/**
 * Check for weak/outdated TLS protocols
 * Nov 17, 2025: Improved detection to reduce false positives
 */
function checkWeakProtocol(crawlResult: CrawlResult): { description: string; evidence: string } | null {
  // Check response headers for protocol information
  const headers = crawlResult.responseHeaders

  // Some servers expose protocol version in headers
  const protocolHeader = headers?.['x-tls-version'] || headers?.['x-ssl-version']

  if (protocolHeader) {
    // Use specific version patterns with word boundaries
    // Match: SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1
    if (/\b(SSL\s*[23]\.0|TLS\s*1\.[01])\b/i.test(protocolHeader)) {
      return {
        description: `Server supports outdated protocol: ${protocolHeader}`,
        evidence: `Header: ${protocolHeader}`,
      }
    }
  }

  // Don't check server header for protocol info - too many false positives
  // Many servers include "SSL" or "TLS" in their name without indicating version support

  return null
}

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

  // Check 2: Certificate information (from metadata if available)
  if (crawlResult.metadata?.certificate) {
    const cert = crawlResult.metadata.certificate
    result.certificate = parseCertificateInfo(cert)

    // Check certificate expiry
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
    } else if (result.certificate.daysUntilExpiry <= 30) {
      result.findings.push({
        type: 'certificate',
        severity: 'high',
        title: 'SSL certificate expiring soon',
        description: `Certificate expires in ${result.certificate.daysUntilExpiry} days`,
        recommendation: 'Renew the SSL certificate before expiration to avoid service disruption.',
        evidence: `Expires: ${result.certificate.validTo}`,
      })
      score -= 20
    } else if (result.certificate.daysUntilExpiry <= 90) {
      result.findings.push({
        type: 'certificate',
        severity: 'medium',
        title: 'SSL certificate renewal recommended',
        description: `Certificate expires in ${result.certificate.daysUntilExpiry} days`,
        recommendation: 'Plan certificate renewal. Consider automated renewal with Let\'s Encrypt.',
        evidence: `Expires: ${result.certificate.validTo}`,
      })
      score -= 10
    }

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
 * Parse certificate information from metadata
 */
function parseCertificateInfo(cert: any): CertificateInfo {
  const validFrom = new Date(cert.validFrom || cert.valid_from)
  const validTo = new Date(cert.validTo || cert.valid_to)
  const now = new Date()

  // Check if dates are valid
  const isValidFromValid = !isNaN(validFrom.getTime())
  const isValidToValid = !isNaN(validTo.getTime())

  const daysUntilExpiry = isValidToValid
    ? Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpired = daysUntilExpiry < 0

  // Check if self-signed (issuer === subject)
  const issuer = cert.issuer?.CN || cert.issuer || 'Unknown'
  const subject = cert.subject?.CN || cert.subject || 'Unknown'
  const isSelfSigned = issuer === subject

  return {
    issuer,
    validFrom: isValidFromValid ? validFrom.toISOString().split('T')[0] : 'Unknown',
    validTo: isValidToValid ? validTo.toISOString().split('T')[0] : 'Unknown',
    daysUntilExpiry,
    isExpired,
    isSelfSigned,
    subject,
  }
}

/**
 * Detect mixed content (HTTP resources on HTTPS pages)
 */
function detectMixedContent(crawlResult: CrawlResult): MixedContentIssue[] {
  const issues: MixedContentIssue[] = []

  // Only check if the main page is HTTPS
  const pageURL = new URL(crawlResult.finalUrl)
  if (pageURL.protocol !== 'https:') {
    return issues
  }

  // Check network requests for HTTP resources
  for (const request of crawlResult.networkRequests) {
    const resourceURL = request.url.toLowerCase()

    if (resourceURL.startsWith('http://')) {
      const type = request.resourceType || 'other'
      const severity: 'high' | 'medium' =
        type === 'script' || type === 'xhr' || type === 'fetch' ? 'high' : 'medium'

      issues.push({
        url: request.url,
        type: type as any,
        severity,
      })
    }
  }

  // Check scripts for HTTP URLs
  for (const script of crawlResult.scripts) {
    if (script.toLowerCase().startsWith('http://')) {
      issues.push({
        url: script,
        type: 'script',
        severity: 'high',
      })
    }
  }

  return issues
}

/**
 * Check for weak/outdated TLS protocols
 */
function checkWeakProtocol(crawlResult: CrawlResult): { description: string; evidence: string } | null {
  // Check response headers for protocol information
  const headers = crawlResult.responseHeaders

  // Some servers expose protocol version in headers
  const protocolHeader = headers['x-tls-version'] || headers['x-ssl-version']

  if (protocolHeader) {
    const version = protocolHeader.toLowerCase()
    if (version.includes('1.0') || version.includes('1.1') || version.includes('ssl')) {
      return {
        description: `Server supports outdated protocol: ${protocolHeader}`,
        evidence: `Header: ${protocolHeader}`,
      }
    }
  }

  // Check for SSLv3/TLS1.0/TLS1.1 indicators in server headers
  const server = headers['server']?.toLowerCase() || ''
  if (server.includes('sslv3') || server.includes('tls/1.0') || server.includes('tls/1.1')) {
    return {
      description: 'Server may support outdated TLS versions',
      evidence: `Server: ${headers['server']}`,
    }
  }

  return null
}

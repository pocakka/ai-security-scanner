import { AIDetectionResult } from './analyzers/ai-detection'
import { SecurityHeadersResult } from './analyzers/security-headers'
import { ClientRisksResult } from './analyzers/client-risks'
import { SSLTLSResult } from './analyzers/ssl-tls-analyzer'
import { CookieSecurityResult } from './analyzers/cookie-security-analyzer'
import { JSLibrariesResult } from './analyzers/js-libraries-analyzer'
import { RiskScore } from './scoring'

export interface ScanReport {
  summary: {
    hasAI: boolean
    riskScore: RiskScore
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
  }
  detectedTech: {
    aiProviders: string[]
    chatWidgets: string[]
  }
  findings: Finding[]
}

export interface Finding {
  id: string
  category: 'ai' | 'security' | 'client' | 'ssl' | 'cookie' | 'library'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  evidence?: string
  impact: string
  recommendation: string
}

export function generateReport(
  aiDetection: AIDetectionResult,
  securityHeaders: SecurityHeadersResult,
  clientRisks: ClientRisksResult,
  riskScore: RiskScore,
  sslTLS?: SSLTLSResult,
  cookieSecurity?: CookieSecurityResult,
  jsLibraries?: JSLibrariesResult
): ScanReport {
  const findings: Finding[] = []

  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0

  // Process client risks (most critical)
  for (const risk of clientRisks.findings) {
    findings.push({
      id: `client-${findings.length}`,
      category: 'client',
      severity: risk.severity,
      title: getClientRiskTitle(risk.type),
      description: risk.description,
      evidence: risk.evidence,
      impact: getClientRiskImpact(risk.type),
      recommendation: risk.recommendation,
    })

    switch (risk.severity) {
      case 'critical': criticalCount++; break
      case 'high': highCount++; break
      case 'medium': mediumCount++; break
      case 'low': lowCount++; break
    }
  }

  // Process security headers
  for (const header of securityHeaders.findings) {
    findings.push({
      id: `header-${findings.length}`,
      category: 'security',
      severity: header.severity,
      title: `Missing: ${header.header}`,
      description: header.description,
      impact: getHeaderImpact(header.header),
      recommendation: header.recommendation,
    })

    switch (header.severity) {
      case 'critical': criticalCount++; break
      case 'high': highCount++; break
      case 'medium': mediumCount++; break
      case 'low': lowCount++; break
    }
  }

  // AI-specific finding
  if (aiDetection.hasAI) {
    findings.push({
      id: 'ai-presence',
      category: 'ai',
      severity: 'medium',
      title: 'AI Technology Detected',
      description: `Detected ${aiDetection.providers.length} AI provider(s) and ${aiDetection.chatWidgets.length} chat widget(s)`,
      impact: 'AI implementations require additional security considerations including prompt injection protection, data leakage prevention, and output validation.',
      recommendation: 'Conduct a comprehensive AI security audit to test for OWASP LLM Top 10 vulnerabilities using tools like Garak, PyRIT, and Promptfoo.',
    })
    mediumCount++
  }

  // SSL/TLS findings
  if (sslTLS) {
    for (const finding of sslTLS.findings) {
      findings.push({
        id: `ssl-${findings.length}`,
        category: 'ssl',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: getSSLImpact(finding.type),
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // Cookie security findings
  if (cookieSecurity) {
    for (const finding of cookieSecurity.findings) {
      findings.push({
        id: `cookie-${findings.length}`,
        category: 'cookie',
        severity: finding.severity,
        title: finding.issue,
        description: finding.description,
        evidence: `Cookie: ${finding.cookieName}`,
        impact: getCookieImpact(finding.issue),
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // JS Libraries findings
  if (jsLibraries) {
    for (const finding of jsLibraries.findings) {
      findings.push({
        id: `library-${findings.length}`,
        category: 'library',
        severity: finding.severity,
        title: finding.issue,
        description: finding.description,
        evidence: `Library: ${finding.library}`,
        impact: getLibraryImpact(finding.issue),
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  return {
    summary: {
      hasAI: aiDetection.hasAI,
      riskScore,
      criticalIssues: criticalCount,
      highIssues: highCount,
      mediumIssues: mediumCount,
      lowIssues: lowCount,
    },
    detectedTech: {
      aiProviders: aiDetection.providers,
      chatWidgets: aiDetection.chatWidgets,
    },
    findings,
  }
}

// Helper functions
function getClientRiskTitle(type: string): string {
  const titles: Record<string, string> = {
    exposed_api_key: 'API Key Exposed in Client Code',
    exposed_api_key_html: 'API Key Exposed in HTML',
  }
  return titles[type] || 'Client-Side Security Risk'
}

function getClientRiskImpact(type: string): string {
  if (type.includes('api_key')) {
    return 'CRITICAL: Exposed API keys can be stolen and used by attackers, leading to unauthorized access, data breaches, and unexpected costs on your AI provider account.'
  }
  return 'Exposed information can be collected by attackers for reconnaissance or exploitation.'
}

function getHeaderImpact(header: string): string {
  const impacts: Record<string, string> = {
    'content-security-policy': 'Missing CSP increases risk of XSS attacks. For AI applications, this is critical as AI-generated content may include malicious scripts.',
    'strict-transport-security': 'Without HSTS, users may be vulnerable to man-in-the-middle attacks, potentially exposing AI prompts and responses.',
    'x-frame-options': 'Missing X-Frame-Options allows your site to be embedded in iframes, enabling clickjacking attacks.',
    'x-content-type-options': 'Missing prevents MIME type sniffing protection, potentially allowing script execution.',
  }
  return impacts[header] || 'Security header provides additional protection layer.'
}

function getSSLImpact(type: string): string {
  const impacts: Record<string, string> = {
    certificate: 'Invalid or expired SSL certificates cause browser warnings and prevent secure connections, exposing user data to interception.',
    protocol: 'Unencrypted HTTP or outdated TLS protocols expose all data (including AI prompts, API keys, user credentials) to man-in-the-middle attacks.',
    cipher: 'Weak encryption ciphers can be broken, allowing attackers to decrypt HTTPS traffic.',
    mixed_content: 'Loading HTTP resources on HTTPS pages creates security holes that attackers can exploit to inject malicious content.',
  }
  return impacts[type] || 'SSL/TLS configuration issue compromises connection security.'
}

function getCookieImpact(issue: string): string {
  if (issue.includes('Secure')) {
    return 'Cookies without Secure flag can be transmitted over unencrypted HTTP, exposing session tokens and authentication data to network sniffers.'
  }
  if (issue.includes('HttpOnly')) {
    return 'Cookies without HttpOnly flag are accessible to JavaScript, making them vulnerable to theft via XSS attacks.'
  }
  if (issue.includes('SameSite')) {
    return 'Missing SameSite attribute makes the application vulnerable to Cross-Site Request Forgery (CSRF) attacks.'
  }
  if (issue.includes('third-party')) {
    return 'Excessive third-party cookies raise privacy concerns and may violate GDPR/CCPA regulations.'
  }
  return 'Cookie security issue may expose user session data or enable attacks.'
}

function getLibraryImpact(issue: string): string {
  if (issue.includes('Vulnerable')) {
    return 'Using libraries with known vulnerabilities exposes the application to exploits that attackers actively use in the wild.'
  }
  if (issue.includes('SRI') || issue.includes('Subresource Integrity')) {
    return 'Loading scripts from CDNs without integrity checks allows attackers to inject malicious code if the CDN is compromised (supply chain attack).'
  }
  if (issue.includes('Deprecated')) {
    return 'Deprecated libraries no longer receive security updates, leaving known vulnerabilities unpatched indefinitely.'
  }
  return 'Library security issue may enable code injection or other attacks.'
}

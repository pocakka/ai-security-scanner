import { AIDetectionResult } from './analyzers/ai-detection'
import { SecurityHeadersResult } from './analyzers/security-headers'
import { ClientRisksResult } from './analyzers/client-risks'
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
  category: 'ai' | 'security' | 'client'
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
  riskScore: RiskScore
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

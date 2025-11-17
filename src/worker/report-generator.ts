import { AIDetectionResult } from './analyzers/ai-detection'
import { SecurityHeadersResult } from './analyzers/security-headers'
import { ClientRisksResult } from './analyzers/client-risks'
import { SSLTLSResult } from './analyzers/ssl-tls-analyzer'
import { CookieSecurityResult } from './analyzers/cookie-security-analyzer'
import { JSLibrariesResult } from './analyzers/js-libraries-analyzer'
import { TechStackResult } from './analyzers/tech-stack-analyzer'
import { ReconnaissanceResult } from './analyzers/reconnaissance-analyzer'
import { AdminDetectionResult } from './analyzers/admin-detection-analyzer'
import { AdminDiscoveryResult } from './analyzers/admin-discovery-analyzer'
import { CORSResult, CORSFinding } from './analyzers/cors-analyzer'
import { DNSSecurityResult } from './analyzers/dns-security-analyzer'
import { PortScanResult } from './analyzers/port-scanner-analyzer'
import { ComplianceResult } from './analyzers/compliance-analyzer'
import { WAFResult } from './analyzers/waf-detection-analyzer'
import { MFAResult } from './analyzers/mfa-detection-analyzer'
import { RateLimitResult } from './analyzers/rate-limiting-analyzer'
import { GraphQLResult } from './analyzers/graphql-analyzer'
import { ErrorDisclosureResult } from './analyzers/error-disclosure-analyzer'
import { SpaApiResult } from './analyzers/spa-api-analyzer'
import { PromptInjectionResult } from './analyzers/owasp-llm/llm01-prompt-injection'
import { InsecureOutputResult } from './analyzers/owasp-llm/llm02-insecure-output'
import { SupplyChainResult } from './analyzers/owasp-llm/llm05-supply-chain'
import { SensitiveInfoResult } from './analyzers/owasp-llm/llm06-sensitive-info'
import { PluginDesignResult } from './analyzers/owasp-llm/llm07-plugin-design'
import { ExcessiveAgencyResult } from './analyzers/owasp-llm/llm08-excessive-agency'
import { BackendFrameworkResult } from './analyzers/backend-framework-detector'
import { WebServerResult } from './analyzers/web-server-security-analyzer'
import { FrontendFrameworkResult } from './analyzers/frontend-framework-security-analyzer'
import { PassiveAPIDiscoveryResult } from './analyzers/passive-api-discovery-analyzer'
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
  techStack?: TechStackResult
  sslTLS?: SSLTLSResult // Add SSL/TLS result for frontend display
  cookieSecurity?: CookieSecurityResult // Add cookie security for frontend
  jsLibraries?: JSLibrariesResult // Add JS libraries for frontend
  reconnaissance?: ReconnaissanceResult // Add reconnaissance for frontend
  adminDiscovery?: AdminDiscoveryResult // Add admin discovery for frontend
  corsAnalysis?: CORSResult // Add CORS analysis for frontend
  dnsAnalysis?: DNSSecurityResult // Add DNS analysis for frontend
  portScan?: PortScanResult // Add port scan for frontend
  compliance?: ComplianceResult // Add compliance analysis for frontend
  wafDetection?: WAFResult // Add WAF detection for frontend
  mfaDetection?: MFAResult // Add MFA detection for frontend
  rateLimiting?: RateLimitResult // Add rate limiting for frontend
  graphqlSecurity?: GraphQLResult // Add GraphQL security for frontend
  errorDisclosure?: ErrorDisclosureResult // Add error disclosure for frontend
  spaApi?: SpaApiResult // Add SPA/API detection for frontend
  llm01PromptInjection?: PromptInjectionResult // Add LLM01 for frontend
  llm02InsecureOutput?: InsecureOutputResult // Add LLM02 for frontend
  llm05SupplyChain?: SupplyChainResult // Add LLM05 for frontend
  llm06SensitiveInfo?: SensitiveInfoResult // Add LLM06 for frontend
  llm07PluginDesign?: PluginDesignResult // Add LLM07 for frontend
  llm08ExcessiveAgency?: ExcessiveAgencyResult // Add LLM08 for frontend
  backendFramework?: BackendFrameworkResult // Add backend framework security for frontend
  webServer?: WebServerResult // Add web server security for frontend
  frontendFramework?: FrontendFrameworkResult // Add frontend framework security for frontend
  passiveAPI?: PassiveAPIDiscoveryResult // Add passive API discovery for frontend
  scoreBreakdown?: any // Optional score breakdown
  findings: Finding[]
}

export interface Finding {
  id: string
  category: 'ai' | 'security' | 'client' | 'ssl' | 'cookie' | 'library' | 'reconnaissance' | 'admin' | 'cors' | 'dns' | 'port' | 'compliance' | 'waf' | 'mfa' | 'rate-limit' | 'graphql' | 'error-disclosure' | 'spa-api' | 'owasp-llm01' | 'owasp-llm02' | 'owasp-llm05' | 'owasp-llm06' | 'owasp-llm07' | 'owasp-llm08' | 'backend-framework' | 'web-server' | 'frontend-framework' | 'api-security'
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info'
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
  jsLibraries?: JSLibrariesResult,
  techStack?: TechStackResult,
  reconnaissance?: ReconnaissanceResult,
  adminDetection?: AdminDetectionResult,
  adminDiscovery?: AdminDiscoveryResult,
  corsAnalysis?: CORSResult & { bypassPatterns?: CORSFinding[] },
  dnsAnalysis?: DNSSecurityResult,
  portScan?: PortScanResult,
  compliance?: ComplianceResult,
  wafDetection?: WAFResult,
  mfaDetection?: MFAResult,
  rateLimiting?: RateLimitResult,
  graphqlSecurity?: GraphQLResult,
  errorDisclosure?: ErrorDisclosureResult,
  spaApi?: SpaApiResult,
  llm01PromptInjection?: PromptInjectionResult,
  llm02InsecureOutput?: InsecureOutputResult,
  llm05SupplyChain?: SupplyChainResult,
  llm06SensitiveInfo?: SensitiveInfoResult,
  llm07PluginDesign?: PluginDesignResult,
  llm08ExcessiveAgency?: ExcessiveAgencyResult,
  backendFramework?: BackendFrameworkResult,
  webServer?: WebServerResult,
  frontendFramework?: FrontendFrameworkResult,
  passiveAPI?: PassiveAPIDiscoveryResult
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

  // Reconnaissance findings
  if (reconnaissance) {
    for (const finding of reconnaissance.findings) {
      findings.push({
        id: `recon-${findings.length}`,
        category: 'reconnaissance',
        severity: finding.severity,
        title: finding.title,
        description: finding.description || '',
        evidence: Array.isArray(finding.evidence) ? finding.evidence.join(', ') : finding.evidence,
        impact: finding.impact || 'Information disclosure may aid attackers in reconnaissance',
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // Admin Detection findings
  if (adminDetection) {
    for (const finding of adminDetection.findings) {
      findings.push({
        id: `admin-${findings.length}`,
        category: 'admin',
        severity: finding.severity,
        title: finding.title,
        description: finding.description || '',
        evidence: Array.isArray(finding.evidence) ? finding.evidence.join(', ') : finding.evidence,
        impact: finding.impact || 'Admin interfaces are prime targets for attacks',
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // Admin Discovery findings (enhanced analyzer)
  if (adminDiscovery) {
    for (const finding of adminDiscovery.findings) {
      // Skip info findings unless they're important
      if (finding.severity === 'info' && !finding.title.includes('Good')) {
        // Only skip generic info findings, keep important ones
      }

      findings.push({
        id: `admin-discovery-${findings.length}`,
        category: 'admin',
        severity: finding.severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.description || `${finding.type} detected`,
        evidence: finding.url || finding.indicator || (finding.formActions ? finding.formActions.join(', ') : undefined),
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else if (finding.severity === 'low') lowCount++
      // info findings don't count toward totals
    }
  }

  // CORS findings
  if (corsAnalysis) {
    // Add main CORS findings
    for (const finding of corsAnalysis.findings) {
      // Skip info findings unless they're important
      if (finding.severity === 'info' && !finding.title.includes('Good')) {
        continue
      }

      findings.push({
        id: `cors-${findings.length}`,
        category: 'cors',
        severity: finding.severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.description || '',
        evidence: finding.details ? JSON.stringify(finding.details) : undefined,
        impact: finding.impact || 'Cross-origin resource sharing misconfiguration',
        recommendation: finding.recommendation || 'Review CORS configuration',
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else if (finding.severity === 'low') lowCount++
    }

    // Add CORS bypass pattern findings
    if (corsAnalysis.bypassPatterns) {
      for (const finding of corsAnalysis.bypassPatterns) {
        findings.push({
          id: `cors-bypass-${findings.length}`,
          category: 'cors',
          severity: finding.severity as 'low' | 'medium' | 'high' | 'critical',
          title: finding.title,
          description: finding.description || '',
          impact: finding.impact || 'Potential CORS bypass technique detected',
          recommendation: finding.recommendation || 'Review and secure cross-origin communication',
        })

        if (finding.severity === 'critical') criticalCount++
        else if (finding.severity === 'high') highCount++
        else if (finding.severity === 'medium') mediumCount++
        else if (finding.severity === 'low') lowCount++
      }
    }
  }

  // Port Scanner findings
  if (portScan) {
    for (const finding of portScan.findings) {
      findings.push({
        id: `port-${findings.length}`,
        category: 'port',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence || (finding.port ? `Port ${finding.port}` : undefined),
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else if (finding.severity === 'low') lowCount++
    }
  }

  // DNS Security findings
  if (dnsAnalysis) {
    for (const finding of dnsAnalysis.findings) {
      // Skip info findings unless they're important
      if (finding.severity === 'info' && !finding.title.includes('configured')) {
        continue
      }

      findings.push({
        id: `dns-${findings.length}`,
        category: 'dns',
        severity: finding.severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.description || '',
        evidence: finding.details ? JSON.stringify(finding.details) : undefined,
        impact: finding.impact || 'DNS security issue detected',
        recommendation: finding.recommendation || 'Review DNS configuration',
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else if (finding.severity === 'low') lowCount++
    }
  }

  // Compliance findings (GDPR, CCPA, PCI DSS, HIPAA)
  if (compliance) {
    for (const finding of compliance.findings) {
      // Convert info severity to match Finding interface
      const severity = finding.severity === 'info' ? 'low' : finding.severity

      findings.push({
        id: `compliance-${findings.length}`,
        category: 'compliance',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.details || finding.evidence || '',
        evidence: finding.evidence || finding.indicator,
        impact: finding.impact || 'Compliance consideration',
        recommendation: finding.recommendation || 'Review compliance requirements',
      })

      // Count severity (treat 'info' as low for statistics)
      if (severity === 'critical') criticalCount++
      else if (severity === 'high') highCount++
      else if (severity === 'medium') mediumCount++
      else if (severity === 'low') lowCount++
    }
  }

  // WAF Detection findings
  if (wafDetection) {
    for (const finding of wafDetection.findings) {
      // Convert info severity to match Finding interface
      const severity = finding.severity === 'info' ? 'low' : finding.severity

      findings.push({
        id: `waf-${findings.length}`,
        category: 'waf',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.evidence || finding.provider || '',
        evidence: finding.evidence,
        impact: finding.impact || 'WAF security consideration',
        recommendation: finding.recommendation || 'Review WAF configuration',
      })

      // WAF findings are never critical (info/low/medium/high only)
      if (severity === 'high') highCount++
      else if (severity === 'medium') mediumCount++
      else lowCount++ // info → low
    }
  }

  // MFA Detection findings
  if (mfaDetection) {
    for (const finding of mfaDetection.findings) {
      const severity = finding.severity === 'info' ? 'low' : finding.severity

      findings.push({
        id: `mfa-${findings.length}`,
        category: 'mfa',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.evidence || finding.method || '',
        evidence: finding.evidence,
        impact: finding.impact || 'MFA security consideration',
        recommendation: finding.recommendation || 'Review MFA implementation',
      })

      if (severity === 'high') highCount++
      else if (severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // Rate Limiting findings
  if (rateLimiting) {
    for (const finding of rateLimiting.findings) {
      const severity = finding.severity === 'info' ? 'low' : finding.severity

      findings.push({
        id: `ratelimit-${findings.length}`,
        category: 'rate-limit',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.evidence || finding.provider || '',
        evidence: finding.evidence,
        impact: finding.impact || 'Rate limiting consideration',
        recommendation: finding.recommendation || 'Review rate limiting configuration',
      })

      if (severity === 'high') highCount++
      else if (severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // GraphQL Security findings
  if (graphqlSecurity) {
    for (const finding of graphqlSecurity.findings) {
      const severity = finding.severity === 'info' ? 'low' : finding.severity

      findings.push({
        id: `graphql-${findings.length}`,
        category: 'graphql',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.evidence || finding.endpoint || '',
        evidence: finding.evidence,
        impact: finding.impact || 'GraphQL security consideration',
        recommendation: finding.recommendation || 'Review GraphQL security',
      })

      if (severity === 'high') highCount++
      else if (severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // Error Disclosure findings
  if (errorDisclosure) {
    for (const finding of errorDisclosure.findings) {
      findings.push({
        id: `error-${findings.length}`,
        category: 'error-disclosure',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // SPA/API Detection findings
  if (spaApi) {
    for (const finding of spaApi.findings) {
      const severity = finding.severity === 'info' ? 'low' : finding.severity

      findings.push({
        id: `spa-api-${findings.length}`,
        category: 'spa-api',
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (severity === 'high') highCount++
      else if (severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM01 - Prompt Injection Risk findings (HIGH PRIORITY)
  if (llm01PromptInjection) {
    for (const finding of llm01PromptInjection.findings) {
      findings.push({
        id: `owasp-llm01-${findings.length}`,
        category: 'owasp-llm01',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence || finding.codeSnippet,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM02 - Insecure Output Handling findings (CRITICAL PRIORITY)
  if (llm02InsecureOutput) {
    for (const finding of llm02InsecureOutput.findings) {
      findings.push({
        id: `owasp-llm02-${findings.length}`,
        category: 'owasp-llm02',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence || finding.codeSnippet,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM07 - Insecure Plugin Design findings (MEDIUM PRIORITY)
  if (llm07PluginDesign) {
    for (const finding of llm07PluginDesign.findings) {
      findings.push({
        id: `owasp-llm07-${findings.length}`,
        category: 'owasp-llm07',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM05 - Supply Chain Vulnerabilities findings (HIGH PRIORITY)
  if (llm05SupplyChain) {
    for (const finding of llm05SupplyChain.findings) {
      findings.push({
        id: `owasp-llm05-${findings.length}`,
        category: 'owasp-llm05',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM06 - Sensitive Information Disclosure findings (CRITICAL PRIORITY)
  if (llm06SensitiveInfo) {
    for (const finding of llm06SensitiveInfo.findings) {
      findings.push({
        id: `owasp-llm06-${findings.length}`,
        category: 'owasp-llm06',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM07 - Insecure Plugin Design findings (MEDIUM PRIORITY)
  if (llm07PluginDesign) {
    for (const finding of llm07PluginDesign.findings) {
      findings.push({
        id: `owasp-llm07-${findings.length}`,
        category: 'owasp-llm07',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // OWASP LLM08 - Excessive Agency findings (MEDIUM PRIORITY)
  if (llm08ExcessiveAgency) {
    for (const finding of llm08ExcessiveAgency.findings) {
      findings.push({
        id: `owasp-llm08-${findings.length}`,
        category: 'owasp-llm08',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // ⭐ NEW: Backend Framework Security findings
  if (backendFramework) {
    for (const finding of backendFramework.findings) {
      findings.push({
        id: `backend-framework-${findings.length}`,
        category: 'backend-framework',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // ⭐ NEW: Web Server Security findings
  if (webServer) {
    for (const finding of webServer.findings) {
      findings.push({
        id: `web-server-${findings.length}`,
        category: 'web-server',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // ⭐ NEW: Frontend Framework Security findings
  if (frontendFramework) {
    for (const finding of frontendFramework.findings) {
      findings.push({
        id: `frontend-framework-${findings.length}`,
        category: 'frontend-framework',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
      })

      if (finding.severity === 'critical') criticalCount++
      else if (finding.severity === 'high') highCount++
      else if (finding.severity === 'medium') mediumCount++
      else lowCount++
    }
  }

  // ⭐ NEW: Passive API Discovery findings
  if (passiveAPI) {
    for (const finding of passiveAPI.findings) {
      findings.push({
        id: `api-security-${findings.length}`,
        category: 'api-security',
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        impact: finding.impact,
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
    techStack,
    sslTLS, // Pass SSL/TLS result to frontend
    cookieSecurity, // Pass cookie security result to frontend
    jsLibraries, // Pass JS libraries result to frontend
    reconnaissance, // Pass reconnaissance result to frontend
    adminDiscovery, // Pass admin discovery result to frontend
    corsAnalysis, // Pass CORS analysis result to frontend
    dnsAnalysis, // Pass DNS analysis result to frontend
    portScan, // Pass port scan result to frontend
    compliance, // Pass compliance analysis result to frontend
    wafDetection, // Pass WAF detection result to frontend
    mfaDetection, // Pass MFA detection result to frontend
    rateLimiting, // Pass rate limiting result to frontend
    graphqlSecurity, // Pass GraphQL security result to frontend
    errorDisclosure, // Pass error disclosure result to frontend
    spaApi, // Pass SPA/API detection result to frontend
    llm01PromptInjection, // Pass LLM01 Prompt Injection Risk result to frontend
    llm02InsecureOutput, // Pass LLM02 Insecure Output Handling result to frontend
    llm05SupplyChain, // Pass LLM05 Supply Chain Vulnerabilities result to frontend
    llm06SensitiveInfo, // Pass LLM06 Sensitive Information Disclosure result to frontend
    llm07PluginDesign, // Pass LLM07 Insecure Plugin Design result to frontend
    llm08ExcessiveAgency, // Pass LLM08 Excessive Agency result to frontend
    backendFramework, // Pass Backend Framework Security result to frontend
    webServer, // Pass Web Server Security result to frontend
    frontendFramework, // Pass Frontend Framework Security result to frontend
    passiveAPI, // Pass Passive API Discovery result to frontend
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

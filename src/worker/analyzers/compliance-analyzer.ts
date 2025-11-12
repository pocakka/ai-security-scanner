/**
 * Compliance Analyzer
 *
 * Analyzes website compliance with major privacy and security regulations:
 * - GDPR (General Data Protection Regulation)
 * - CCPA (California Consumer Privacy Act)
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - HIPAA (Health Insurance Portability and Accountability Act)
 * - SOC 2 (Service Organization Control 2)
 * - ISO 27001 (Information Security Management)
 *
 * ALL CHECKS ARE PASSIVE - analyzing publicly visible content only
 */

interface ComplianceFinding {
  type: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  category: string
  indicator?: string
  found?: boolean
  score?: number
  percentage?: number
  missing?: string[]
  impact?: string
  recommendation?: string
  evidence?: string
  details?: string
}

interface ComplianceIndicators {
  privacyPolicy: boolean
  cookieConsent: boolean
  dataController: boolean
  dpoContact: boolean
  dataRights: boolean
  legalBasis: boolean
  dataRetention: boolean
  cookiePolicy: boolean
  termsOfService: boolean
  ageVerification: boolean
  breachNotification: boolean
  dataPortability: boolean
  rightToErasure: boolean
  consentManagement: boolean
}

export interface ComplianceResult {
  findings: ComplianceFinding[]
  gdprScore: number
  ccpaScore: number
  pciDssIndicators: string[]
  hipaaIndicators: string[]
  overallCompliance: 'low' | 'partial' | 'good' | 'excellent'
}

export async function analyzeCompliance(
  html: string,
  cookies: any[],
  headers: Record<string, string>
): Promise<ComplianceResult> {
  const findings: ComplianceFinding[] = []

  // GDPR Compliance Analysis
  const gdprFindings = analyzeGDPR(html, cookies, headers)
  findings.push(...gdprFindings.findings)

  // CCPA Compliance Analysis
  const ccpaFindings = analyzeCCPA(html)
  findings.push(...ccpaFindings.findings)

  // PCI DSS Indicators
  const pciFindings = analyzePCIDSS(html, headers)
  findings.push(...pciFindings.findings)

  // HIPAA Indicators
  const hipaaFindings = analyzeHIPAA(html)
  findings.push(...hipaaFindings.findings)

  // SOC 2 Indicators
  const soc2Findings = analyzeSOC2(html)
  findings.push(...soc2Findings.findings)

  // ISO 27001 Indicators
  const isoFindings = analyzeISO27001(html)
  findings.push(...isoFindings.findings)

  // Additional Privacy Features
  const privacyFindings = analyzePrivacyFeatures(html, cookies)
  findings.push(...privacyFindings.findings)

  return {
    findings,
    gdprScore: gdprFindings.score,
    ccpaScore: ccpaFindings.score,
    pciDssIndicators: pciFindings.indicators,
    hipaaIndicators: hipaaFindings.indicators,
    overallCompliance: calculateOverallCompliance(findings),
  }
}

/**
 * GDPR Compliance Analysis
 */
function analyzeGDPR(
  html: string,
  cookies: any[],
  headers: Record<string, string>
): { findings: ComplianceFinding[]; score: number } {
  const findings: ComplianceFinding[] = []
  const indicators: ComplianceIndicators = {
    privacyPolicy: false,
    cookieConsent: false,
    dataController: false,
    dpoContact: false,
    dataRights: false,
    legalBasis: false,
    dataRetention: false,
    cookiePolicy: false,
    termsOfService: false,
    ageVerification: false,
    breachNotification: false,
    dataPortability: false,
    rightToErasure: false,
    consentManagement: false,
  }

  // Privacy Policy Detection
  const privacyPatterns = [
    /privacy[- ]?policy/i,
    /data[- ]?protection/i,
    /datenschutz/i,
    /politique[- ]?de[- ]?confidentialité/i,
    /política[- ]?de[- ]?privacidad/i,
  ]

  for (const pattern of privacyPatterns) {
    if (pattern.test(html)) {
      indicators.privacyPolicy = true
      findings.push({
        type: 'gdpr-privacy-policy',
        severity: 'info',
        title: 'Privacy Policy Found',
        category: 'compliance',
        found: true,
        evidence: 'Privacy policy link detected in page',
      })
      break
    }
  }

  if (!indicators.privacyPolicy) {
    findings.push({
      type: 'gdpr-privacy-policy-missing',
      severity: 'high',
      title: 'No Privacy Policy Detected',
      category: 'compliance',
      found: false,
      impact: 'GDPR Article 13 requires transparent privacy information',
      recommendation: 'Implement a comprehensive privacy policy',
    })
  }

  // Cookie Consent Banner
  const cookieConsentPatterns = [
    'cookie consent',
    'accept cookies',
    'we use cookies',
    'cookie policy',
    'cookie preferences',
    'manage cookies',
    'cookie banner',
    'cookie notice',
  ]

  let cookieConsentFound = false
  for (const pattern of cookieConsentPatterns) {
    if (html.toLowerCase().includes(pattern)) {
      cookieConsentFound = true
      indicators.cookieConsent = true
      break
    }
  }

  if (cookieConsentFound) {
    findings.push({
      type: 'gdpr-cookie-consent',
      severity: 'info',
      title: 'Cookie Consent Mechanism Detected',
      category: 'compliance',
      found: true,
      details: 'Cookie consent banner or notice present',
    })
  } else {
    // Check if cookies are being used
    if (cookies.length > 0) {
      findings.push({
        type: 'gdpr-cookie-consent-missing',
        severity: 'high',
        title: 'Cookies Used Without Consent Banner',
        category: 'compliance',
        found: false,
        impact: 'GDPR requires user consent before non-essential cookies',
        recommendation: 'Implement cookie consent management',
        evidence: `${cookies.length} cookies detected`,
      })
    }
  }

  // Data Controller Information
  const controllerPatterns = [
    /data[- ]?controller/i,
    /responsible[- ]?party/i,
    /verantwortlicher/i,
    /responsable[- ]?del[- ]?tratamiento/i,
  ]

  for (const pattern of controllerPatterns) {
    if (pattern.test(html)) {
      indicators.dataController = true
      findings.push({
        type: 'gdpr-data-controller',
        severity: 'info',
        title: 'Data Controller Information Found',
        category: 'compliance',
        found: true,
      })
      break
    }
  }

  // DPO (Data Protection Officer) Contact
  const dpoPatterns = [
    /data[- ]?protection[- ]?officer/i,
    /dpo@/i,
    /privacy@/i,
    /datenschutzbeauftragter/i,
    /délégué[- ]?à[- ]?la[- ]?protection/i,
  ]

  for (const pattern of dpoPatterns) {
    if (pattern.test(html)) {
      indicators.dpoContact = true

      // Try to extract email
      const emailMatch = html.match(
        /(?:dpo|privacy|datenschutz)@[a-z0-9.-]+\.[a-z]+/i
      )

      findings.push({
        type: 'gdpr-dpo-contact',
        severity: 'info',
        title: 'DPO Contact Information Found',
        category: 'compliance',
        found: true,
        evidence: emailMatch ? emailMatch[0] : 'DPO mentioned',
      })
      break
    }
  }

  // Data Subject Rights
  const rightsPatterns = [
    'right to access',
    'right to erasure',
    'right to rectification',
    'right to portability',
    'right to object',
    'right to restrict',
    'delete my data',
    'export my data',
    'correct my data',
    'data subject rights',
  ]

  let rightsFound = false
  const foundRights: string[] = []
  for (const pattern of rightsPatterns) {
    if (html.toLowerCase().includes(pattern)) {
      rightsFound = true
      foundRights.push(pattern)
    }
  }

  if (rightsFound) {
    indicators.dataRights = true
    findings.push({
      type: 'gdpr-data-rights',
      severity: 'info',
      title: 'Data Subject Rights Mentioned',
      category: 'compliance',
      found: true,
      evidence: `Found: ${foundRights.slice(0, 3).join(', ')}`,
    })
  }

  // Legal Basis for Processing
  const legalBasisPatterns = [
    'legitimate interest',
    'legal basis',
    'lawful basis',
    'consent',
    'contractual necessity',
    'legal obligation',
    'vital interests',
    'public interest',
  ]

  for (const pattern of legalBasisPatterns) {
    if (html.toLowerCase().includes(pattern)) {
      indicators.legalBasis = true
      findings.push({
        type: 'gdpr-legal-basis',
        severity: 'info',
        title: 'Legal Basis for Processing Mentioned',
        category: 'compliance',
        found: true,
        evidence: `"${pattern}" found`,
      })
      break
    }
  }

  // Data Retention Policy
  const retentionPatterns = [
    /data[- ]?retention/i,
    /how[- ]?long.*keep.*data/i,
    /storage[- ]?period/i,
    /retention[- ]?period/i,
  ]

  for (const pattern of retentionPatterns) {
    if (pattern.test(html)) {
      indicators.dataRetention = true
      findings.push({
        type: 'gdpr-data-retention',
        severity: 'info',
        title: 'Data Retention Policy Mentioned',
        category: 'compliance',
        found: true,
      })
      break
    }
  }

  // Cookie Policy
  if (html.toLowerCase().includes('cookie policy')) {
    indicators.cookiePolicy = true
    findings.push({
      type: 'gdpr-cookie-policy',
      severity: 'info',
      title: 'Cookie Policy Found',
      category: 'compliance',
      found: true,
    })
  }

  // Calculate GDPR Score
  const totalIndicators = Object.keys(indicators).length
  const foundIndicators = Object.values(indicators).filter((v) => v).length
  const percentage = Math.round((foundIndicators / totalIndicators) * 100)

  // Overall GDPR Assessment
  if (percentage >= 70) {
    findings.push({
      type: 'gdpr-compliance-good',
      severity: 'info',
      title: 'Good GDPR Compliance Indicators',
      category: 'compliance',
      score: foundIndicators,
      percentage,
      details: `${foundIndicators}/${totalIndicators} indicators found`,
    })
  } else if (percentage >= 40) {
    findings.push({
      type: 'gdpr-compliance-partial',
      severity: 'medium',
      title: 'Partial GDPR Compliance',
      category: 'compliance',
      score: foundIndicators,
      percentage,
      missing: Object.entries(indicators)
        .filter(([k, v]) => !v)
        .map(([k]) => k),
      recommendation: 'Review GDPR requirements and add missing elements',
    })
  } else {
    findings.push({
      type: 'gdpr-compliance-low',
      severity: 'high',
      title: 'Low GDPR Compliance Indicators',
      category: 'compliance',
      score: foundIndicators,
      percentage,
      impact: 'Potential GDPR violation risk',
      recommendation: 'Implement comprehensive GDPR compliance measures',
    })
  }

  return { findings, score: percentage }
}

/**
 * CCPA Compliance Analysis
 */
function analyzeCCPA(html: string): {
  findings: ComplianceFinding[]
  score: number
} {
  const findings: ComplianceFinding[] = []
  let score = 0

  // "Do Not Sell My Personal Information"
  const doNotSellPatterns = [
    /do not sell.*personal information/i,
    /do not sell.*data/i,
    /opt[- ]?out.*sale/i,
    /ccpa.*opt[- ]?out/i,
  ]

  for (const pattern of doNotSellPatterns) {
    if (pattern.test(html)) {
      score += 30
      findings.push({
        type: 'ccpa-do-not-sell',
        severity: 'info',
        title: 'CCPA "Do Not Sell" Link Found',
        category: 'compliance',
        found: true,
        evidence: 'CCPA opt-out mechanism present',
      })
      break
    }
  }

  // California Privacy Rights
  if (
    html.toLowerCase().includes('california') &&
    (html.toLowerCase().includes('privacy rights') ||
      html.toLowerCase().includes('consumer rights'))
  ) {
    score += 25
    findings.push({
      type: 'ccpa-privacy-rights',
      severity: 'info',
      title: 'California Privacy Rights Mentioned',
      category: 'compliance',
      found: true,
    })
  }

  // CCPA-specific disclosures
  if (html.toLowerCase().includes('ccpa')) {
    score += 20
    findings.push({
      type: 'ccpa-disclosure',
      severity: 'info',
      title: 'CCPA Referenced in Privacy Policy',
      category: 'compliance',
      found: true,
    })
  }

  // Categories of Personal Information
  if (
    html.toLowerCase().includes('categories of personal information') ||
    html.toLowerCase().includes('categories of data')
  ) {
    score += 15
    findings.push({
      type: 'ccpa-data-categories',
      severity: 'info',
      title: 'Data Categories Disclosed',
      category: 'compliance',
      found: true,
    })
  }

  // Right to Know
  if (html.toLowerCase().includes('right to know')) {
    score += 10
    findings.push({
      type: 'ccpa-right-to-know',
      severity: 'info',
      title: 'CCPA Right to Know Mentioned',
      category: 'compliance',
      found: true,
    })
  }

  // Overall CCPA Score
  if (score >= 60) {
    findings.push({
      type: 'ccpa-compliance-good',
      severity: 'info',
      title: 'Good CCPA Compliance Indicators',
      category: 'compliance',
      score,
      percentage: score,
    })
  } else if (score >= 30) {
    findings.push({
      type: 'ccpa-compliance-partial',
      severity: 'medium',
      title: 'Partial CCPA Compliance',
      category: 'compliance',
      score,
      percentage: score,
      recommendation: 'Add CCPA-specific disclosures for California users',
    })
  } else if (score > 0) {
    findings.push({
      type: 'ccpa-compliance-low',
      severity: 'low',
      title: 'Limited CCPA Compliance',
      category: 'compliance',
      score,
      percentage: score,
    })
  }

  return { findings, score }
}

/**
 * PCI DSS Indicators Analysis
 */
function analyzePCIDSS(
  html: string,
  headers: Record<string, string>
): { findings: ComplianceFinding[]; indicators: string[] } {
  const findings: ComplianceFinding[] = []
  const indicators: string[] = []

  // Payment form detection
  const hasPaymentForm =
    html.toLowerCase().includes('credit card') ||
    html.toLowerCase().includes('card number') ||
    html.includes('type="cc-') ||
    html.includes('autocomplete="cc-')

  if (hasPaymentForm) {
    // Check for HTTPS
    if (headers['strict-transport-security']) {
      indicators.push('HTTPS enforced with HSTS')
      findings.push({
        type: 'pci-https',
        severity: 'info',
        title: 'Secure Transport for Payment Data',
        category: 'compliance',
        found: true,
        evidence: 'HSTS header present',
      })
    } else {
      findings.push({
        type: 'pci-https-missing',
        severity: 'critical',
        title: 'Payment Form Without HSTS',
        category: 'compliance',
        found: false,
        impact: 'Card data may be transmitted insecurely',
        recommendation: 'Implement HSTS header',
      })
    }

    // Check for CSP
    if (headers['content-security-policy']) {
      indicators.push('Content Security Policy implemented')
      findings.push({
        type: 'pci-csp',
        severity: 'info',
        title: 'Content Security Policy Protects Payment Form',
        category: 'compliance',
        found: true,
      })
    }

    // Check for payment processor indicators
    const processors = [
      'stripe',
      'paypal',
      'square',
      'braintree',
      'authorize.net',
      'adyen',
    ]
    for (const processor of processors) {
      if (html.toLowerCase().includes(processor)) {
        indicators.push(`Using ${processor} payment processor`)
        findings.push({
          type: 'pci-processor',
          severity: 'info',
          title: `Payment Processor: ${processor}`,
          category: 'compliance',
          found: true,
          evidence: `${processor} integration detected`,
        })
        break
      }
    }
  }

  // PCI DSS mention
  if (html.toLowerCase().includes('pci dss') || html.toLowerCase().includes('pci compliant')) {
    indicators.push('PCI DSS mentioned')
    findings.push({
      type: 'pci-mention',
      severity: 'info',
      title: 'PCI DSS Compliance Claimed',
      category: 'compliance',
      found: true,
    })
  }

  return { findings, indicators }
}

/**
 * HIPAA Indicators Analysis
 */
function analyzeHIPAA(html: string): {
  findings: ComplianceFinding[]
  indicators: string[] } {
  const findings: ComplianceFinding[] = []
  const indicators: string[] = []

  // HIPAA mention
  if (html.toLowerCase().includes('hipaa')) {
    indicators.push('HIPAA mentioned')
    findings.push({
      type: 'hipaa-mention',
      severity: 'info',
      title: 'HIPAA Compliance Mentioned',
      category: 'compliance',
      found: true,
    })
  }

  // Health-related indicators
  const healthPatterns = [
    'protected health information',
    'phi',
    'electronic health records',
    'ehr',
    'medical records',
    'patient data',
    'health data privacy',
  ]

  for (const pattern of healthPatterns) {
    if (html.toLowerCase().includes(pattern)) {
      indicators.push(`Health data: ${pattern}`)
      findings.push({
        type: 'hipaa-health-data',
        severity: 'info',
        title: 'Health Data References Found',
        category: 'compliance',
        found: true,
        evidence: `"${pattern}" mentioned`,
      })
      break
    }
  }

  // Business Associate Agreement
  if (html.toLowerCase().includes('business associate agreement') ||
      html.toLowerCase().includes('baa')) {
    indicators.push('Business Associate Agreement mentioned')
    findings.push({
      type: 'hipaa-baa',
      severity: 'info',
      title: 'Business Associate Agreement Referenced',
      category: 'compliance',
      found: true,
    })
  }

  return { findings, indicators }
}

/**
 * SOC 2 Indicators Analysis
 */
function analyzeSOC2(html: string): { findings: ComplianceFinding[] } {
  const findings: ComplianceFinding[] = []

  if (html.toLowerCase().includes('soc 2') || html.toLowerCase().includes('soc2')) {
    findings.push({
      type: 'soc2-mention',
      severity: 'info',
      title: 'SOC 2 Compliance Mentioned',
      category: 'compliance',
      found: true,
      details: 'SOC 2 certification referenced',
    })
  }

  // Security program indicators
  const securityPatterns = [
    'information security policy',
    'security program',
    'security controls',
    'risk management',
    'incident response',
  ]

  for (const pattern of securityPatterns) {
    if (html.toLowerCase().includes(pattern)) {
      findings.push({
        type: 'soc2-security-program',
        severity: 'info',
        title: 'Security Program Indicators',
        category: 'compliance',
        found: true,
        evidence: `"${pattern}" mentioned`,
      })
      break
    }
  }

  return { findings }
}

/**
 * ISO 27001 Indicators Analysis
 */
function analyzeISO27001(html: string): { findings: ComplianceFinding[] } {
  const findings: ComplianceFinding[] = []

  if (html.toLowerCase().includes('iso 27001') || html.toLowerCase().includes('iso27001')) {
    findings.push({
      type: 'iso27001-mention',
      severity: 'info',
      title: 'ISO 27001 Certification Mentioned',
      category: 'compliance',
      found: true,
      details: 'ISO 27001 information security standard referenced',
    })
  }

  // ISMS (Information Security Management System)
  if (html.toLowerCase().includes('isms') ||
      html.toLowerCase().includes('information security management')) {
    findings.push({
      type: 'iso27001-isms',
      severity: 'info',
      title: 'Information Security Management System',
      category: 'compliance',
      found: true,
    })
  }

  return { findings }
}

/**
 * Additional Privacy Features
 */
function analyzePrivacyFeatures(
  html: string,
  cookies: any[]
): { findings: ComplianceFinding[] } {
  const findings: ComplianceFinding[] = []

  // Terms of Service
  if (html.toLowerCase().includes('terms of service') ||
      html.toLowerCase().includes('terms and conditions')) {
    findings.push({
      type: 'privacy-terms',
      severity: 'info',
      title: 'Terms of Service Found',
      category: 'compliance',
      found: true,
    })
  }

  // Age Verification
  const agePatterns = ['18 years', 'age verification', 'parental consent', 'coppa']
  for (const pattern of agePatterns) {
    if (html.toLowerCase().includes(pattern)) {
      findings.push({
        type: 'privacy-age-verification',
        severity: 'info',
        title: 'Age Verification Mentioned',
        category: 'compliance',
        found: true,
        evidence: `"${pattern}" found`,
      })
      break
    }
  }

  // Consent Management Platform (CMP)
  const cmpPatterns = [
    'onetrust',
    'cookiebot',
    'trustarc',
    'cookiepro',
    'didomi',
    'quantcast',
  ]
  for (const cmp of cmpPatterns) {
    if (html.toLowerCase().includes(cmp)) {
      findings.push({
        type: 'privacy-cmp',
        severity: 'info',
        title: 'Consent Management Platform Detected',
        category: 'compliance',
        found: true,
        evidence: `${cmp} integration found`,
      })
      break
    }
  }

  // Third-party data sharing disclosure
  if (html.toLowerCase().includes('third party') &&
      html.toLowerCase().includes('share')) {
    findings.push({
      type: 'privacy-third-party-disclosure',
      severity: 'info',
      title: 'Third-Party Data Sharing Disclosed',
      category: 'compliance',
      found: true,
    })
  }

  return { findings }
}

/**
 * Calculate Overall Compliance Level
 */
function calculateOverallCompliance(
  findings: ComplianceFinding[]
): 'low' | 'partial' | 'good' | 'excellent' {
  const infoCount = findings.filter((f) => f.severity === 'info' && f.found).length
  const highSeverityCount = findings.filter(
    (f) => (f.severity === 'high' || f.severity === 'critical') && !f.found
  ).length

  if (highSeverityCount > 3) return 'low'
  if (infoCount >= 15) return 'excellent'
  if (infoCount >= 10) return 'good'
  if (infoCount >= 5) return 'partial'
  return 'low'
}

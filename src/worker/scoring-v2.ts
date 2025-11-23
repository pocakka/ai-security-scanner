/**
 * Professional Security Risk Scoring System v2.0
 *
 * Based on industry standards:
 * - CVSS 3.1 (Common Vulnerability Scoring System)
 * - OWASP Risk Rating Methodology
 * - NIST Cybersecurity Framework
 * - CIS Controls
 *
 * Key improvements over v1:
 * 1. Category-based weighted scoring (not all findings are equal)
 * 2. Transparent score breakdown for glass-box auditing
 * 3. Realistic risk levels based on actual exploitability
 * 4. Diminishing returns (10 low findings != 1 critical)
 * 5. Positive scoring for good security practices
 */

export interface ScoringBreakdown {
  // Category scores (0-100 each)
  categories: {
    criticalInfrastructure: CategoryScore  // SSL, DNS, core security
    authentication: CategoryScore           // Cookies, sessions, auth
    dataProtection: CategoryScore          // Headers, CSP, data leakage
    codeQuality: CategoryScore             // Libraries, dependencies
    aiSecurity: CategoryScore              // OWASP LLM Top 10
    compliance: CategoryScore              // GDPR, privacy, policies
  }

  // Final calculated score
  overallScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  grade: string // A+ to F

  // Detailed explanation for transparency
  penalties: ScoringPenalty[]
  bonuses: ScoringBonus[]

  // Risk summary
  summary: {
    totalFindings: number
    criticalFindings: number
    highFindings: number
    mediumFindings: number
    lowFindings: number
    passedChecks: number
    failedChecks: number
  }
}

export interface CategoryScore {
  score: number // 0-100
  weight: number // How much this category matters (0-1)
  findings: number // Number of findings in this category
  impact: number // Weighted impact on overall score
  description: string
  applicable: boolean // Whether this category applies to this scan (e.g., AI category only if AI detected)
}

export interface ScoringPenalty {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  points: number
  rationale: string
}

export interface ScoringBonus {
  category: string
  description: string
  points: number
  rationale: string
}

export interface Finding {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  impact?: string
  recommendation?: string
}

/**
 * Category weights based on industry risk assessment
 * Total must sum to 1.0
 */
const CATEGORY_WEIGHTS = {
  criticalInfrastructure: 0.30, // SSL, DNS, network security (highest impact)
  authentication: 0.25,          // Session management, cookies (direct attack vector)
  dataProtection: 0.20,          // Headers, CSP, data leakage (data breach risk)
  codeQuality: 0.10,             // Dependencies, libraries (supply chain)
  aiSecurity: 0.10,              // AI-specific risks (emerging threat)
  compliance: 0.05,              // Privacy, policies (regulatory risk)
}

/**
 * Severity-based point deductions
 * Based on CVSS 3.1 severity ratings:
 * - Critical: 9.0-10.0 (Base Score)
 * - High: 7.0-8.9
 * - Medium: 4.0-6.9
 * - Low: 0.1-3.9
 */
const SEVERITY_POINTS = {
  critical: {
    first: 35,      // First critical finding
    additional: 20, // Diminishing returns on subsequent findings
    cap: 100        // Max penalty from critical findings
  },
  high: {
    first: 20,
    additional: 10,
    cap: 60
  },
  medium: {
    first: 10,
    additional: 4,
    cap: 40
  },
  low: {
    first: 3,
    additional: 1,
    cap: 15
  }
}

/**
 * Map finding categories to scoring categories
 */
function mapFindingCategory(category: string): keyof typeof CATEGORY_WEIGHTS {
  const mapping: Record<string, keyof typeof CATEGORY_WEIGHTS> = {
    // Critical Infrastructure
    'ssl': 'criticalInfrastructure',
    'dns': 'criticalInfrastructure',
    'port': 'criticalInfrastructure',
    'waf': 'criticalInfrastructure',
    'cors': 'criticalInfrastructure',

    // Authentication
    'cookie': 'authentication',
    'mfa': 'authentication',
    'admin': 'authentication',
    'rate-limit': 'authentication',

    // Data Protection
    'security': 'dataProtection',
    'client': 'dataProtection',
    'reconnaissance': 'dataProtection',
    'error-disclosure': 'dataProtection',

    // Code Quality
    'library': 'codeQuality',
    'spa-api': 'codeQuality',
    'graphql': 'codeQuality',

    // AI Security
    'ai': 'aiSecurity',
    'owasp-llm01': 'aiSecurity',
    'owasp-llm02': 'aiSecurity',
    'owasp-llm05': 'aiSecurity',
    'owasp-llm06': 'aiSecurity',
    'owasp-llm07': 'aiSecurity',
    'owasp-llm08': 'aiSecurity',

    // Compliance
    'compliance': 'compliance',
  }

  return mapping[category] || 'dataProtection'
}

/**
 * Calculate category score with diminishing returns
 */
function calculateCategoryPenalty(
  findings: Finding[],
  category: keyof typeof CATEGORY_WEIGHTS
): { penalty: number, details: ScoringPenalty[] } {
  const categoryFindings = findings.filter(f => mapFindingCategory(f.category) === category)

  let totalPenalty = 0
  const details: ScoringPenalty[] = []

  // Group by severity
  const bySeverity = {
    critical: categoryFindings.filter(f => f.severity === 'critical'),
    high: categoryFindings.filter(f => f.severity === 'high'),
    medium: categoryFindings.filter(f => f.severity === 'medium'),
    low: categoryFindings.filter(f => f.severity === 'low'),
  }

  // Calculate penalties with diminishing returns
  for (const [severity, findingsOfSeverity] of Object.entries(bySeverity)) {
    const sev = severity as keyof typeof SEVERITY_POINTS
    const config = SEVERITY_POINTS[sev]

    let severityPenalty = 0

    findingsOfSeverity.forEach((finding, index) => {
      const points = index === 0 ? config.first : config.additional
      severityPenalty += points

      details.push({
        category,
        severity: sev,
        description: finding.title,
        points,
        rationale: index === 0
          ? `First ${severity} finding in ${category}`
          : `Additional ${severity} finding (diminishing returns)`
      })
    })

    // Cap penalty per severity
    severityPenalty = Math.min(severityPenalty, config.cap)
    totalPenalty += severityPenalty
  }

  return { penalty: Math.min(totalPenalty, 100), details }
}

/**
 * Award bonus points for good security practices
 */
function calculateSecurityBonuses(
  findings: Finding[],
  metadata: any
): { bonus: number, details: ScoringBonus[] } {
  const bonuses: ScoringBonus[] = []
  let totalBonus = 0

  // Bonus: HTTPS enabled
  if (metadata?.sslCertificate) {
    bonuses.push({
      category: 'criticalInfrastructure',
      description: 'HTTPS enabled with valid certificate',
      points: 5,
      rationale: 'Transport layer encryption protects data in transit'
    })
    totalBonus += 5
  }

  // Bonus: Strong CSP
  const hasStrongCSP = findings.every(f =>
    !(f.category === 'security' && f.title.includes('Content-Security-Policy'))
  )
  if (hasStrongCSP) {
    bonuses.push({
      category: 'dataProtection',
      description: 'Content Security Policy implemented',
      points: 5,
      rationale: 'CSP prevents XSS and code injection attacks'
    })
    totalBonus += 5
  }

  // Bonus: Secure cookies
  const hasSecureCookies = findings.filter(f =>
    f.category === 'cookie' && f.severity === 'high'
  ).length === 0
  if (hasSecureCookies) {
    bonuses.push({
      category: 'authentication',
      description: 'Secure cookie configuration',
      points: 3,
      rationale: 'Cookies protected with HttpOnly, Secure, SameSite flags'
    })
    totalBonus += 3
  }

  // Bonus: No exposed secrets
  const hasNoExposedSecrets = findings.filter(f =>
    f.category === 'client' && f.severity === 'critical'
  ).length === 0
  if (hasNoExposedSecrets) {
    bonuses.push({
      category: 'dataProtection',
      description: 'No exposed API keys or secrets',
      points: 10,
      rationale: 'Credentials properly secured, not exposed in client-side code'
    })
    totalBonus += 10
  }

  // Bonus: DNS security (DNSSEC, SPF, DMARC)
  const hasDnsSecurity = findings.filter(f =>
    f.category === 'dns' && f.severity === 'high'
  ).length === 0
  if (hasDnsSecurity) {
    bonuses.push({
      category: 'criticalInfrastructure',
      description: 'DNS security features enabled',
      points: 5,
      rationale: 'DNSSEC, SPF, DKIM, DMARC protect against domain spoofing'
    })
    totalBonus += 5
  }

  return { bonus: Math.min(totalBonus, 25), details: bonuses } // Cap at +25
}

/**
 * Calculate overall security score with transparent breakdown
 */
export function calculateSecurityScore(
  findings: Finding[],
  metadata?: any
): ScoringBreakdown {
  // Detect if AI is present (check for AI-related findings or metadata)
  const hasAI = metadata?.hasAI ||
    findings.some(f => f.category === 'ai' || f.category.startsWith('owasp-llm'))

  // Initialize category scores
  const categoryScores: ScoringBreakdown['categories'] = {
    criticalInfrastructure: {
      score: 100,
      weight: CATEGORY_WEIGHTS.criticalInfrastructure,
      findings: 0,
      impact: 0,
      description: 'SSL/TLS, DNS, Network Security',
      applicable: true
    },
    authentication: {
      score: 100,
      weight: CATEGORY_WEIGHTS.authentication,
      findings: 0,
      impact: 0,
      description: 'Session Management, Cookies, Login Security',
      applicable: true
    },
    dataProtection: {
      score: 100,
      weight: CATEGORY_WEIGHTS.dataProtection,
      findings: 0,
      impact: 0,
      description: 'Security Headers, CSP, Data Leakage Prevention',
      applicable: true
    },
    codeQuality: {
      score: 100,
      weight: CATEGORY_WEIGHTS.codeQuality,
      findings: 0,
      impact: 0,
      description: 'Dependencies, Libraries, Supply Chain Security',
      applicable: true
    },
    aiSecurity: {
      score: 100,
      weight: CATEGORY_WEIGHTS.aiSecurity,
      findings: 0,
      impact: 0,
      description: 'OWASP LLM Top 10, AI-Specific Risks',
      applicable: hasAI // Only applicable if AI detected
    },
    compliance: {
      score: 100,
      weight: CATEGORY_WEIGHTS.compliance,
      findings: 0,
      impact: 0,
      description: 'Privacy Policies, GDPR, Regulatory Compliance',
      applicable: true
    },
  }

  // Calculate total weight of applicable categories
  const applicableWeight = Object.values(categoryScores)
    .filter(cat => cat.applicable)
    .reduce((sum, cat) => sum + cat.weight, 0)

  // Normalize weights so applicable categories sum to 1.0
  // Example: If AI is N/A (10%), remaining 90% is redistributed proportionally
  for (const category of Object.values(categoryScores)) {
    if (category.applicable) {
      category.weight = category.weight / applicableWeight
    } else {
      category.weight = 0
    }
  }

  // Calculate penalties for each category
  const allPenalties: ScoringPenalty[] = []

  for (const category of Object.keys(categoryScores) as Array<keyof typeof categoryScores>) {
    const { penalty, details } = calculateCategoryPenalty(findings, category)

    categoryScores[category].score = Math.max(0, 100 - penalty)
    categoryScores[category].findings = findings.filter(f =>
      mapFindingCategory(f.category) === category
    ).length

    allPenalties.push(...details)
  }

  // Calculate bonuses
  const { bonus, details: bonusDetails } = calculateSecurityBonuses(findings, metadata)

  // Calculate weighted overall score (only from applicable categories)
  let overallScore = 0
  for (const [category, data] of Object.entries(categoryScores)) {
    if (data.applicable) {
      const impact = data.score * data.weight
      data.impact = impact
      overallScore += impact
    } else {
      data.impact = 0 // N/A categories don't contribute
    }
  }

  // Apply bonus (up to +25 points)
  overallScore = Math.min(100, overallScore + bonus)

  // Determine risk level (based on CVSS severity ratings)
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  if (overallScore >= 80) riskLevel = 'LOW'       // Score 80-100 = Low Risk
  else if (overallScore >= 60) riskLevel = 'MEDIUM' // Score 60-79 = Medium Risk
  else if (overallScore >= 40) riskLevel = 'HIGH'   // Score 40-59 = High Risk
  else riskLevel = 'CRITICAL'                       // Score 0-39 = Critical Risk

  // Determine letter grade
  let grade: string
  if (overallScore >= 97) grade = 'A+'
  else if (overallScore >= 93) grade = 'A'
  else if (overallScore >= 90) grade = 'A-'
  else if (overallScore >= 87) grade = 'B+'
  else if (overallScore >= 83) grade = 'B'
  else if (overallScore >= 80) grade = 'B-'
  else if (overallScore >= 77) grade = 'C+'
  else if (overallScore >= 73) grade = 'C'
  else if (overallScore >= 70) grade = 'C-'
  else if (overallScore >= 67) grade = 'D+'
  else if (overallScore >= 63) grade = 'D'
  else if (overallScore >= 60) grade = 'D-'
  else grade = 'F'

  // Generate summary
  const summary = {
    totalFindings: findings.length,
    criticalFindings: findings.filter(f => f.severity === 'critical').length,
    highFindings: findings.filter(f => f.severity === 'high').length,
    mediumFindings: findings.filter(f => f.severity === 'medium').length,
    lowFindings: findings.filter(f => f.severity === 'low').length,
    passedChecks: bonusDetails.length,
    failedChecks: findings.length,
  }

  return {
    categories: categoryScores,
    overallScore: Math.round(overallScore),
    riskLevel,
    grade,
    penalties: allPenalties,
    bonuses: bonusDetails,
    summary,
  }
}

/**
 * Legacy compatibility function
 * Maps v2 scoring to v1 RiskScore format
 */
export interface RiskScore {
  score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  grade: string
}

export function calculateRiskScore(findings: Finding[], metadata?: any): RiskScore {
  const breakdown = calculateSecurityScore(findings, metadata)

  return {
    score: breakdown.overallScore,
    level: breakdown.riskLevel,
    grade: breakdown.grade,
  }
}

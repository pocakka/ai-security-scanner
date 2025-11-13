/**
 * Professional Security Scoring System v3.0
 *
 * INTUITIVE SCALE: 100 = Perfect Security, 0 = Critical Failure
 * "Higher is Better" - easy to understand for clients
 *
 * Based on industry standards:
 * - OWASP Risk Rating Methodology v4.0
 * - CVSS 3.1 (Common Vulnerability Scoring System)
 * - NIST Cybersecurity Framework 2.0
 * - CIS Controls v8
 *
 * Key Design Principles:
 * 1. Start at 100 points (perfect security)
 * 2. Deduct points for findings (transparent penalties)
 * 3. Category-based weighted scoring (SSL > JS libraries)
 * 4. Diminishing returns (10 low ≠ 1 critical)
 * 5. Clear grade system (A+ to F)
 */

// ==================== TYPE DEFINITIONS ====================

export interface Finding {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  impact?: string
  recommendation?: string
}

export interface ScoringBreakdown {
  // Overall score (0-100, higher is better)
  overallScore: number  // Weighted average of all categories
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  grade: string // A+ to F

  // Category scores (0-100 each)
  categories: {
    criticalInfrastructure: CategoryScore  // SSL, DNS, hosting (30%)
    authentication: CategoryScore           // Sessions, cookies, auth (25%)
    dataProtection: CategoryScore          // Headers, CSP, leaks (20%)
    aiSecurity: CategoryScore              // OWASP LLM Top 10 (15%)
    codeQuality: CategoryScore             // Libraries, dependencies (10%)
  }

  // Transparency: show exactly what was deducted
  penalties: ScoringPenalty[]
  bonuses: ScoringBonus[]

  // Summary statistics
  summary: {
    totalFindings: number
    criticalFindings: number
    highFindings: number
    mediumFindings: number
    lowFindings: number
    infoFindings: number
  }
}

export interface CategoryScore {
  score: number          // 0-100 (starts at 100, deductions applied)
  weight: number         // 0.0-1.0 (percentage of overall score)
  findings: number       // Count of findings in this category
  pointsDeducted: number // Total points lost in this category
  description: string    // Human-readable category name
  applicable: boolean    // Is this category relevant? (e.g., AI only if detected)
}

export interface ScoringPenalty {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  finding: string
  points: number         // Points deducted (negative number)
  rationale: string      // Why this penalty was applied
}

export interface ScoringBonus {
  category: string
  practice: string       // What good practice was detected
  points: number         // Points added (positive number)
  rationale: string      // Why this bonus was given
}

// ==================== SCORING CONFIGURATION ====================

/**
 * Category Weights (must sum to 1.0)
 * Based on OWASP Risk Rating and industry impact analysis
 */
const CATEGORY_WEIGHTS = {
  criticalInfrastructure: 0.30, // SSL, DNS, hosting (highest business impact)
  authentication: 0.25,          // Sessions, auth (direct attack vector)
  dataProtection: 0.20,          // Headers, CSP (data breach risk)
  aiSecurity: 0.15,              // OWASP LLM (emerging threat)
  codeQuality: 0.10,             // Libraries (supply chain risk)
}

/**
 * Penalty Points per Severity Level
 * UPDATED: Stricter penalties to reflect real-world security impact
 * Based on CVSS 3.1 severity ratings with diminishing returns
 *
 * First finding = full impact
 * Additional findings = reduced impact (prevents score collapse)
 */
const PENALTY_POINTS = {
  critical: {
    first: 25,      // First critical finding: -25 points (was 10)
    additional: 15,  // Each additional: -15 points (was 7)
    cap: 60,        // Maximum total deduction per category (was 40)
  },
  high: {
    first: 12,       // First high finding: -12 points (was 6)
    additional: 8,  // Each additional: -8 points (was 4)
    cap: 50,        // Maximum total deduction per category (was 30)
  },
  medium: {
    first: 6,       // First medium finding: -6 points (was 3)
    additional: 4,  // Each additional: -4 points (was 2)
    cap: 30,        // Maximum total deduction per category (was 20)
  },
  low: {
    first: 2,       // First low finding: -2 points (was 1)
    additional: 1, // Each additional: -1 point (was 0.5)
    cap: 15,        // Maximum total deduction per category (was 10)
  },
  info: {
    first: 0,       // Info findings don't deduct points
    additional: 0,
    cap: 0,
  },
}

/**
 * Bonus Points for Good Security Practices
 * UPDATED: Reduced bonuses to balance with stricter penalties
 * Rewards proactive security measures
 */
const BONUS_POINTS = {
  httpsEnabled: 2,           // SSL/TLS properly configured (was 5)
  strongCSP: 3,              // Content-Security-Policy with nonce/hash (was 5)
  hstsEnabled: 2,            // HTTP Strict Transport Security (was 3)
  noSecretsExposed: 5,       // No API keys or credentials found (was 10)
  dnssecEnabled: 2,          // DNSSEC validation active (was 5)
  noObsoleteLibraries: 2,    // All JS libraries up-to-date (was 3)
  secureCookies: 2,          // All cookies have Secure + HttpOnly (was 3)
  spfDkimDmarc: 2,           // Email security configured (was 3)
}

// Maximum bonus points (prevent gaming the system)
// UPDATED: Reduced from 25 to 12 for more realistic scoring
const MAX_BONUS_POINTS = 12

/**
 * Risk Level Thresholds
 * Aligned with industry-standard risk matrices
 */
const RISK_THRESHOLDS = {
  LOW: 70,        // 70-100: Low risk (green)
  MEDIUM: 50,     // 50-69: Medium risk (yellow)
  HIGH: 30,       // 30-49: High risk (orange)
  CRITICAL: 0,    // 0-29: Critical risk (red)
}

/**
 * Grade System (A+ to F)
 * Familiar grading scale for non-technical stakeholders
 */
const GRADE_THRESHOLDS = [
  { score: 95, grade: 'A+' },
  { score: 90, grade: 'A' },
  { score: 85, grade: 'A-' },
  { score: 80, grade: 'B+' },
  { score: 75, grade: 'B' },
  { score: 70, grade: 'B-' },
  { score: 65, grade: 'C+' },
  { score: 60, grade: 'C' },
  { score: 55, grade: 'C-' },
  { score: 50, grade: 'D+' },
  { score: 45, grade: 'D' },
  { score: 40, grade: 'D-' },
  { score: 0, grade: 'F' },
]

// ==================== CATEGORY MAPPING ====================

/**
 * Map finding categories to scoring categories
 * Some findings affect multiple categories
 */
function mapFindingToCategory(finding: Finding): keyof typeof CATEGORY_WEIGHTS {
  const cat = finding.category.toLowerCase()

  // Critical Infrastructure: SSL, DNS, hosting, network
  if (cat.includes('ssl') || cat.includes('tls') || cat.includes('certificate') ||
      cat.includes('dns') || cat.includes('hosting') || cat.includes('network') ||
      cat.includes('infrastructure')) {
    return 'criticalInfrastructure'
  }

  // Authentication: Sessions, cookies, auth, access control
  if (cat.includes('auth') || cat.includes('cookie') || cat.includes('session') ||
      cat.includes('login') || cat.includes('credential')) {
    return 'authentication'
  }

  // Data Protection: Headers, CSP, XSS, data leaks, secrets
  if (cat.includes('header') || cat.includes('csp') || cat.includes('xss') ||
      cat.includes('leak') || cat.includes('secret') || cat.includes('api-key') ||
      cat.includes('cors') || cat.includes('data-protection')) {
    return 'dataProtection'
  }

  // AI Security: OWASP LLM Top 10
  if (cat.includes('ai') || cat.includes('llm') || cat.includes('owasp-llm')) {
    return 'aiSecurity'
  }

  // Code Quality: Libraries, dependencies, code issues
  if (cat.includes('library') || cat.includes('librarie') || cat.includes('dependency') ||
      cat.includes('code') || cat.includes('tech')) {
    return 'codeQuality'
  }

  // Default: Data Protection (most findings fit here)
  return 'dataProtection'
}

// ==================== SCORING CALCULATION ====================

/**
 * Main scoring function
 * Calculates transparent, weighted security score
 */
export function calculateSecurityScore(
  findings: Finding[],
  metadata?: {
    hasAI?: boolean
    sslCertificate?: any
  }
): ScoringBreakdown {
  // Step 1: Initialize category scores (all start at 100)
  const categoryScores: ScoringBreakdown['categories'] = {
    criticalInfrastructure: {
      score: 100,
      weight: CATEGORY_WEIGHTS.criticalInfrastructure,
      findings: 0,
      pointsDeducted: 0,
      description: 'Critical Infrastructure',
      applicable: true,
    },
    authentication: {
      score: 100,
      weight: CATEGORY_WEIGHTS.authentication,
      findings: 0,
      pointsDeducted: 0,
      description: 'Authentication & Sessions',
      applicable: true,
    },
    dataProtection: {
      score: 100,
      weight: CATEGORY_WEIGHTS.dataProtection,
      findings: 0,
      pointsDeducted: 0,
      description: 'Data Protection',
      applicable: true,
    },
    aiSecurity: {
      score: 100,
      weight: CATEGORY_WEIGHTS.aiSecurity,
      findings: 0,
      pointsDeducted: 0,
      description: 'AI Security',
      applicable: metadata?.hasAI || false, // Only applicable if AI detected
    },
    codeQuality: {
      score: 100,
      weight: CATEGORY_WEIGHTS.codeQuality,
      findings: 0,
      pointsDeducted: 0,
      description: 'Code Quality',
      applicable: true,
    },
  }

  // Step 2: Apply N/A category weight redistribution
  // If AI is not present, redistribute its weight to other categories
  if (!categoryScores.aiSecurity.applicable) {
    const applicableCategories = Object.values(categoryScores).filter(c => c.applicable)
    const totalApplicableWeight = applicableCategories.reduce((sum, c) => sum + c.weight, 0)

    // Normalize weights so they sum to 1.0
    for (const key in categoryScores) {
      const cat = categoryScores[key as keyof typeof categoryScores]
      if (cat.applicable) {
        cat.weight = cat.weight / totalApplicableWeight
      } else {
        cat.weight = 0
      }
    }
  }

  // Step 3: Group findings by category and severity
  const findingsByCategory: Record<string, Record<string, number>> = {}

  for (const key in categoryScores) {
    findingsByCategory[key] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
  }

  for (const finding of findings) {
    const category = mapFindingToCategory(finding)
    const severity = finding.severity
    findingsByCategory[category][severity]++
  }

  // Step 4: Calculate penalties with diminishing returns
  const penalties: ScoringPenalty[] = []

  for (const key in categoryScores) {
    const categoryKey = key as keyof typeof categoryScores
    const category = categoryScores[categoryKey]
    const findingsInCategory = findingsByCategory[key]
    let totalDeduction = 0

    // Process each severity level
    for (const severity of ['critical', 'high', 'medium', 'low', 'info'] as const) {
      const count = findingsInCategory[severity]
      if (count === 0) continue

      const penaltyConfig = PENALTY_POINTS[severity]
      let categoryDeduction = 0

      // First finding gets full penalty
      if (count >= 1) {
        categoryDeduction += penaltyConfig.first
        penalties.push({
          category: category.description,
          severity,
          finding: `${severity} severity finding`,
          points: -penaltyConfig.first,
          rationale: `First ${severity} finding in ${category.description}`,
        })
      }

      // Additional findings get reduced penalty
      if (count > 1) {
        const additionalDeduction = (count - 1) * penaltyConfig.additional
        categoryDeduction += additionalDeduction
        penalties.push({
          category: category.description,
          severity,
          finding: `${count - 1} additional ${severity} findings`,
          points: -additionalDeduction,
          rationale: `Diminishing returns for multiple ${severity} findings`,
        })
      }

      // Apply cap to prevent category score going below 0
      categoryDeduction = Math.min(categoryDeduction, penaltyConfig.cap)
      totalDeduction += categoryDeduction
    }

    // Apply total deduction to category score
    category.pointsDeducted = totalDeduction
    category.score = Math.max(0, 100 - totalDeduction)
    category.findings = Object.values(findingsInCategory).reduce((sum, count) => sum + count, 0)
  }

  // Step 5: Calculate bonuses for good practices
  const bonuses: ScoringBonus[] = []
  let totalBonusPoints = 0

  // Bonus: HTTPS enabled
  if (metadata?.sslCertificate) {
    bonuses.push({
      category: 'Critical Infrastructure',
      practice: 'HTTPS/TLS enabled',
      points: BONUS_POINTS.httpsEnabled,
      rationale: 'SSL/TLS certificate properly configured',
    })
    totalBonusPoints += BONUS_POINTS.httpsEnabled
  }

  // Bonus: No exposed secrets (API keys, credentials)
  const hasSecretFindings = findings.some(f =>
    f.category.includes('api-key') || f.category.includes('secret') || f.category.includes('client-risks')
  )
  if (!hasSecretFindings) {
    bonuses.push({
      category: 'Data Protection',
      practice: 'No exposed secrets',
      points: BONUS_POINTS.noSecretsExposed,
      rationale: 'No API keys or credentials found in client-side code',
    })
    totalBonusPoints += BONUS_POINTS.noSecretsExposed
  }

  // Bonus: DNSSEC enabled
  const hasDNSSECFinding = findings.some(f =>
    f.category.includes('dns') && f.title.toLowerCase().includes('dnssec') && f.severity !== 'critical' && f.severity !== 'high'
  )
  // If no critical/high DNS findings about missing DNSSEC, assume it's enabled
  if (!hasDNSSECFinding && findings.some(f => f.category.includes('dns'))) {
    bonuses.push({
      category: 'Critical Infrastructure',
      practice: 'DNSSEC enabled',
      points: BONUS_POINTS.dnssecEnabled,
      rationale: 'DNS Security Extensions (DNSSEC) validation active',
    })
    totalBonusPoints += BONUS_POINTS.dnssecEnabled
  }

  // Bonus: HSTS enabled
  const hasHSTSMissing = findings.some(f =>
    (f.category.includes('header') || f.category.includes('security-headers')) &&
    f.title.toLowerCase().includes('hsts') &&
    (f.severity === 'high' || f.severity === 'medium')
  )
  if (!hasHSTSMissing) {
    bonuses.push({
      category: 'Data Protection',
      practice: 'HSTS enabled',
      points: BONUS_POINTS.hstsEnabled,
      rationale: 'HTTP Strict Transport Security header properly configured',
    })
    totalBonusPoints += BONUS_POINTS.hstsEnabled
  }

  // Bonus: Strong CSP (Content Security Policy)
  const hasWeakCSP = findings.some(f =>
    (f.category.includes('header') || f.category.includes('security-headers') || f.category.includes('csp')) &&
    (f.title.toLowerCase().includes('content-security-policy') || f.title.toLowerCase().includes('csp')) &&
    (f.severity === 'high' || f.severity === 'critical')
  )
  if (!hasWeakCSP && !findings.some(f => f.category.includes('csp') && f.severity === 'medium')) {
    bonuses.push({
      category: 'Data Protection',
      practice: 'Strong CSP',
      points: BONUS_POINTS.strongCSP,
      rationale: 'Content-Security-Policy with nonce/hash or strict directives',
    })
    totalBonusPoints += BONUS_POINTS.strongCSP
  }

  // Bonus: Secure cookies (all have Secure + HttpOnly)
  const hasInsecureCookies = findings.some(f =>
    f.category.includes('cookie') && (f.severity === 'high' || f.severity === 'medium')
  )
  if (!hasInsecureCookies && findings.some(f => f.category.includes('cookie'))) {
    bonuses.push({
      category: 'Authentication',
      practice: 'Secure cookies',
      points: BONUS_POINTS.secureCookies,
      rationale: 'All cookies have Secure and HttpOnly flags',
    })
    totalBonusPoints += BONUS_POINTS.secureCookies
  }

  // Bonus: No obsolete libraries
  const hasObsoleteLibraries = findings.some(f =>
    (f.category.includes('library') || f.category.includes('js-libraries')) &&
    (f.severity === 'high' || f.severity === 'critical')
  )
  if (!hasObsoleteLibraries && findings.some(f => f.category.includes('library'))) {
    bonuses.push({
      category: 'Code Quality',
      practice: 'No obsolete libraries',
      points: BONUS_POINTS.noObsoleteLibraries,
      rationale: 'All JavaScript libraries are up-to-date',
    })
    totalBonusPoints += BONUS_POINTS.noObsoleteLibraries
  }

  // Bonus: Email security (SPF + DKIM + DMARC)
  const hasEmailSecurityIssues = findings.some(f =>
    f.category.includes('dns') &&
    (f.title.toLowerCase().includes('spf') || f.title.toLowerCase().includes('dkim') || f.title.toLowerCase().includes('dmarc')) &&
    (f.severity === 'high' || f.severity === 'medium')
  )
  if (!hasEmailSecurityIssues && findings.some(f => f.category.includes('dns'))) {
    bonuses.push({
      category: 'Critical Infrastructure',
      practice: 'Email security configured',
      points: BONUS_POINTS.spfDkimDmarc,
      rationale: 'SPF, DKIM, and DMARC records properly configured',
    })
    totalBonusPoints += BONUS_POINTS.spfDkimDmarc
  }

  // Apply bonus cap
  totalBonusPoints = Math.min(totalBonusPoints, MAX_BONUS_POINTS)

  // Step 6: Calculate overall weighted score
  let weightedScore = 0
  for (const key in categoryScores) {
    const category = categoryScores[key as keyof typeof categoryScores]
    if (category.applicable) {
      weightedScore += category.score * category.weight
    }
  }

  // Add bonus points (but cap at 100)
  const overallScore = Math.min(100, Math.round(weightedScore + totalBonusPoints))

  // Step 7: Determine risk level and grade
  const riskLevel =
    overallScore >= RISK_THRESHOLDS.LOW ? 'LOW' :
    overallScore >= RISK_THRESHOLDS.MEDIUM ? 'MEDIUM' :
    overallScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' : 'CRITICAL'

  const grade = GRADE_THRESHOLDS.find(t => overallScore >= t.score)?.grade || 'F'

  // Step 8: Generate summary
  const summary = {
    totalFindings: findings.length,
    criticalFindings: findings.filter(f => f.severity === 'critical').length,
    highFindings: findings.filter(f => f.severity === 'high').length,
    mediumFindings: findings.filter(f => f.severity === 'medium').length,
    lowFindings: findings.filter(f => f.severity === 'low').length,
    infoFindings: findings.filter(f => f.severity === 'info').length,
  }

  return {
    overallScore,
    riskLevel,
    grade,
    categories: categoryScores,
    penalties,
    bonuses,
    summary,
  }
}

/**
 * Helper: Calculate what score is needed to reach next grade
 */
export function calculateScoreToNextGrade(currentScore: number): {
  nextGrade: string
  pointsNeeded: number
  currentGrade: string
} {
  const currentGrade = GRADE_THRESHOLDS.find(t => currentScore >= t.score)?.grade || 'F'
  const nextThreshold = GRADE_THRESHOLDS.find(t => t.score > currentScore)

  if (!nextThreshold) {
    return {
      currentGrade,
      nextGrade: 'A+',
      pointsNeeded: 0, // Already at max
    }
  }

  return {
    currentGrade,
    nextGrade: nextThreshold.grade,
    pointsNeeded: nextThreshold.score - currentScore,
  }
}

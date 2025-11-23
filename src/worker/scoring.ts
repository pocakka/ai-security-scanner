import { AIDetectionResult } from './analyzers/ai-detection'
import { SecurityHeadersResult } from './analyzers/security-headers'
import { ClientRisksResult } from './analyzers/client-risks'
import { SSLTLSResult } from './analyzers/ssl-tls-analyzer'
import { CookieSecurityResult } from './analyzers/cookie-security-analyzer'
import { JSLibrariesResult } from './analyzers/js-libraries-analyzer'

export interface RiskScore {
  score: number // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  grade: string // A+ to F
}

export function calculateRiskScore(
  aiDetection: AIDetectionResult,
  securityHeaders: SecurityHeadersResult,
  clientRisks: ClientRisksResult,
  sslTLS?: SSLTLSResult,
  cookieSecurity?: CookieSecurityResult,
  jsLibraries?: JSLibrariesResult
): RiskScore {
  let totalPenalty = 0

  // Client-side risks (MOST CRITICAL)
  for (const finding of clientRisks.findings) {
    switch (finding.severity) {
      case 'critical':
        totalPenalty += 40
        break
      case 'high':
        totalPenalty += 25
        break
      case 'medium':
        totalPenalty += 15
        break
      case 'low':
        totalPenalty += 5
        break
    }
  }

  // Security headers penalties
  for (const finding of securityHeaders.findings) {
    if (finding.status === 'missing') {
      switch (finding.severity) {
        case 'critical':
          totalPenalty += 20
          break
        case 'high':
          totalPenalty += 15
          break
        case 'medium':
          totalPenalty += 10
          break
        case 'low':
          totalPenalty += 5
          break
      }
    } else if (finding.status === 'weak') {
      totalPenalty += 5
    }
  }

  // AI-specific penalty if AI detected but security is weak
  if (aiDetection.hasAI && securityHeaders.missing.includes('content-security-policy')) {
    totalPenalty += 10 // Extra penalty for AI without CSP
  }

  // SSL/TLS penalties
  if (sslTLS) {
    // Invert SSL score to penalty (100 score = 0 penalty, 0 score = 40 penalty)
    const sslPenalty = Math.floor((100 - sslTLS.score) * 0.4)
    totalPenalty += sslPenalty
  }

  // Cookie security penalties
  if (cookieSecurity) {
    // Invert cookie score to penalty
    const cookiePenalty = Math.floor((100 - cookieSecurity.score) * 0.2)
    totalPenalty += cookiePenalty
  }

  // JS Libraries penalties
  if (jsLibraries) {
    // Invert JS libraries score to penalty
    const jsPenalty = Math.floor((100 - jsLibraries.score) * 0.3)
    totalPenalty += jsPenalty
  }

  // Calculate final score
  const score = Math.max(0, Math.min(100, 100 - totalPenalty))

  // Determine risk level
  let level: RiskScore['level']
  if (score >= 80) level = 'LOW'
  else if (score >= 60) level = 'MEDIUM'
  else if (score >= 40) level = 'HIGH'
  else level = 'CRITICAL'

  // Determine grade
  let grade: string
  if (score >= 95) grade = 'A+'
  else if (score >= 90) grade = 'A'
  else if (score >= 85) grade = 'A-'
  else if (score >= 80) grade = 'B+'
  else if (score >= 75) grade = 'B'
  else if (score >= 70) grade = 'B-'
  else if (score >= 65) grade = 'C+'
  else if (score >= 60) grade = 'C'
  else if (score >= 55) grade = 'C-'
  else if (score >= 50) grade = 'D'
  else grade = 'F'

  return { score, level, grade }
}

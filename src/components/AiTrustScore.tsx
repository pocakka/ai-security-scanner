/**
 * AI Trust Score Component
 *
 * Displays Scamadviser-style trust score for AI implementations
 * Shows 5 category breakdown with visual progress bars
 */

'use client'

interface CategoryScores {
  transparency: number
  userControl: number
  compliance: number
  security: number
  ethicalAi: number
}

interface Summary {
  message: string
  strengths: string[]
  weaknesses: string[]
  criticalIssues: string[]
}

interface AiTrustScoreProps {
  score: number // Simple average 0-100
  weightedScore: number // Weighted by importance
  categoryScores: CategoryScores
  passedChecks: number
  totalChecks: number
  detectedAiProvider?: string | null
  detectedModel?: string | null
  detectedChatFramework?: string | null
  hasAiImplementation?: boolean // NEW: Is AI actually detected?
  aiConfidenceLevel?: string // NEW: Confidence level
  summary?: Summary | null // NEW: Human-readable summary
}

export function AiTrustScore({
  score,
  weightedScore,
  categoryScores,
  passedChecks,
  totalChecks,
  detectedAiProvider,
  detectedModel,
  detectedChatFramework,
  hasAiImplementation = false,
  aiConfidenceLevel = 'none',
  summary,
}: AiTrustScoreProps) {
  // If NO AI implementation detected, show a simple info card
  if (!hasAiImplementation || aiConfidenceLevel === 'none' || aiConfidenceLevel === 'low') {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-slate-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">No AI Implementation Detected</h3>
            <p className="text-slate-300 text-sm mb-3">
              {summary?.message || 'This website does not appear to use AI technology. AI Trust Score is not applicable.'}
            </p>
            {aiConfidenceLevel === 'low' && (
              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mb-3">
                <p className="text-yellow-200 text-xs">
                  ⚠️ Low-confidence detection: Found 1 potential AI signal, but insufficient evidence to confirm AI usage.
                </p>
              </div>
            )}
            {summary?.strengths && summary.strengths.length > 0 && (
              <div className="mt-3">
                <ul className="space-y-1">
                  {summary.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Grade calculation
  const getGrade = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 85) return {
      label: 'Excellent',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20 text-green-300 border-green-400/30'
    }
    if (score >= 70) return {
      label: 'Good',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    }
    if (score >= 50) return {
      label: 'Fair',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
    }
    return {
      label: 'Poor',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20 text-red-300 border-red-400/30'
    }
  }

  const grade = getGrade(weightedScore)

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Trust Score</h2>
          <p className="text-sm text-slate-400 mt-1">
            Based on {totalChecks} automated checks
          </p>
        </div>
        <div className="text-center">
          <div className={`text-6xl font-bold ${grade.color} mb-2`}>
            {weightedScore}
          </div>
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${grade.bgColor}`}>
            {grade.label}
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4 mb-6">
        <CategoryBar
          label="Transparency"
          score={categoryScores.transparency}
          icon="🔍"
          description="AI provider disclosure, limitations, data usage"
        />
        <CategoryBar
          label="User Control"
          score={categoryScores.userControl}
          icon="🎮"
          description="Feedback mechanisms, reset options, human escalation"
        />
        <CategoryBar
          label="Compliance (GDPR)"
          score={categoryScores.compliance}
          icon="⚖️"
          description="Privacy policy, cookie banner, DPO contact"
        />
        <CategoryBar
          label="Security & Reliability"
          score={categoryScores.security}
          icon="🔒"
          description="Bot protection, rate limiting, input validation"
        />
        <CategoryBar
          label="Ethical AI"
          score={categoryScores.ethicalAi}
          icon="🤝"
          description="Bias disclosure, content moderation, accessibility"
        />
      </div>

      {/* Detected Technology */}
      {(detectedAiProvider || detectedModel || detectedChatFramework) && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-200 mb-2 flex items-center gap-2">
            <span>🤖</span>
            Detected AI Technology
          </h3>
          <div className="space-y-1 text-sm text-blue-300">
            {detectedAiProvider && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Provider:</span>
                <span className="px-2 py-0.5 bg-blue-500/20 rounded">{detectedAiProvider}</span>
              </div>
            )}
            {detectedModel && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Model:</span>
                <span className="px-2 py-0.5 bg-blue-500/20 rounded">{detectedModel}</span>
              </div>
            )}
            {detectedChatFramework && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Framework:</span>
                <span className="px-2 py-0.5 bg-blue-500/20 rounded">{detectedChatFramework}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
        <div className="text-slate-400">
          <span className="font-semibold text-white">{passedChecks}</span> of{' '}
          <span className="font-semibold text-white">{totalChecks}</span> checks passed
        </div>
        <div className="text-slate-500">
          Weighted score emphasizes transparency & compliance
        </div>
      </div>
    </div>
  )
}

// Category Bar Component
interface CategoryBarProps {
  label: string
  score: number
  icon: string
  description: string
}

function CategoryBar({ label, score, icon, description }: CategoryBarProps) {
  const getBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-400'
    if (score >= 60) return 'bg-blue-400'
    if (score >= 40) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  const getTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-300'
    if (score >= 60) return 'text-blue-300'
    if (score >= 40) return 'text-yellow-300'
    return 'text-red-300'
  }

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <span className="text-sm font-medium text-white">{label}</span>
            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
              {description}
            </p>
          </div>
        </div>
        <span className={`text-sm font-bold ${getTextColor(score)} min-w-[45px] text-right`}>
          {score}%
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${getBarColor(score)} h-2.5 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

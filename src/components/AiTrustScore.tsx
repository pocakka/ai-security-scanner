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

interface AiTrustScoreProps {
  score: number // Simple average 0-100
  weightedScore: number // Weighted by importance
  categoryScores: CategoryScores
  passedChecks: number
  totalChecks: number
  detectedAiProvider?: string | null
  detectedModel?: string | null
  detectedChatFramework?: string | null
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
}: AiTrustScoreProps) {
  // Grade calculation
  const getGrade = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 85) return {
      label: 'Excellent',
      color: 'text-green-600',
      bgColor: 'bg-green-100 text-green-800 border-green-300'
    }
    if (score >= 70) return {
      label: 'Good',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 text-blue-800 border-blue-300'
    }
    if (score >= 50) return {
      label: 'Fair',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }
    return {
      label: 'Poor',
      color: 'text-red-600',
      bgColor: 'bg-red-100 text-red-800 border-red-300'
    }
  }

  const grade = getGrade(weightedScore)

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Trust Score</h2>
          <p className="text-sm text-gray-600 mt-1">
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
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
            <span>🤖</span>
            Detected AI Technology
          </h3>
          <div className="space-y-1 text-sm text-blue-700">
            {detectedAiProvider && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Provider:</span>
                <span className="px-2 py-0.5 bg-blue-100 rounded">{detectedAiProvider}</span>
              </div>
            )}
            {detectedModel && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Model:</span>
                <span className="px-2 py-0.5 bg-blue-100 rounded">{detectedModel}</span>
              </div>
            )}
            {detectedChatFramework && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Framework:</span>
                <span className="px-2 py-0.5 bg-blue-100 rounded">{detectedChatFramework}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          <span className="font-semibold text-gray-900">{passedChecks}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalChecks}</span> checks passed
        </div>
        <div className="text-gray-500">
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
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-700'
    if (score >= 60) return 'text-blue-700'
    if (score >= 40) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <span className="text-sm font-medium text-gray-800">{label}</span>
            <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
              {description}
            </p>
          </div>
        </div>
        <span className={`text-sm font-bold ${getTextColor(score)} min-w-[45px] text-right`}>
          {score}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${getBarColor(score)} h-2.5 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

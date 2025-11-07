'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Scan {
  id: string
  url: string
  status: string
  riskScore?: number
  riskLevel?: string
  findings?: any
  detectedTech?: any
  completedAt?: string
}

export default function ScanResultPage() {
  const params = useParams()
  const scanId = params.id as string

  const [scan, setScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchScan()
    // Poll every 2 seconds if not completed
    const interval = setInterval(() => {
      if (scan?.status !== 'COMPLETED' && scan?.status !== 'FAILED') {
        fetchScan()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [scanId, scan?.status])

  const fetchScan = async () => {
    try {
      const response = await fetch(`/api/scan/${scanId}`)
      if (!response.ok) throw new Error('Failed to fetch scan')

      const data = await response.json()
      setScan(data)

      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!scan || scan.status === 'PENDING' || scan.status === 'SCANNING') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow p-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Scanning {scan?.url || 'website'}...</h2>
            <p className="text-gray-600">
              {scan?.status === 'PENDING' && 'Scan queued, starting soon...'}
              {scan?.status === 'SCANNING' && 'Analyzing security...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (scan.status === 'FAILED') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-bold mb-2">Scan Failed</h2>
            <p className="text-red-600">Please try again with a different URL.</p>
          </div>
        </div>
      </div>
    )
  }

  // COMPLETED
  const { summary, detectedTech, findings } = scan.findings || {}

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← New Scan
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Security Report
          </h1>
          <p className="text-gray-600">{scan.url}</p>
        </div>

        {/* Risk Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-6xl font-bold text-gray-900">
                  {summary?.riskScore?.score || 0}
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-700">
                    Grade {summary?.riskScore?.grade}
                  </div>
                  <RiskBadge level={summary?.riskScore?.level} />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Security Score (higher is better)
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Issues Found</p>
              <div className="flex gap-4 mt-2">
                <IssueCount label="Critical" count={summary?.criticalIssues || 0} color="red" />
                <IssueCount label="High" count={summary?.highIssues || 0} color="orange" />
                <IssueCount label="Medium" count={summary?.mediumIssues || 0} color="yellow" />
                <IssueCount label="Low" count={summary?.lowIssues || 0} color="blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Detected Tech */}
        {summary?.hasAI && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">🤖 Detected AI Technologies</h2>
            <div className="space-y-3">
              {detectedTech?.aiProviders?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">AI Providers:</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedTech.aiProviders.map((provider: string) => (
                      <span key={provider} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detectedTech?.chatWidgets?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Chat Widgets:</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedTech.chatWidgets.map((widget: string) => (
                      <span key={widget} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                        {widget}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Findings */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🔍 Security Findings</h2>
          {findings?.length === 0 ? (
            <p className="text-gray-600">No issues found. Great job!</p>
          ) : (
            <div className="space-y-4">
              {findings?.map((finding: any, index: number) => (
                <FindingCard key={index} finding={finding} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Want a Deeper Security Audit?</h2>
          <p className="text-blue-100 mb-6">
            This automated scan provides valuable insights, but cannot detect all AI-specific vulnerabilities
            like prompt injection, jailbreaking, or data leakage.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Request Manual Audit ($2,000+)
          </button>
        </div>

      </div>
    </div>
  )
}

// Helper Components
function RiskBadge({ level }: { level?: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[level || 'LOW']}`}>
      {level} RISK
    </span>
  )
}

function IssueCount({ label, count, color }: { label: string, count: number, color: string }) {
  const colors: Record<string, string> = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
  }

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${colors[color]}`}>{count}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  )
}

function FindingCard({ finding }: { finding: any }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50',
  }

  const severityIcons: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  }

  return (
    <div className={`border-l-4 rounded p-4 ${severityColors[finding.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{severityIcons[finding.severity]}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{finding.title}</h3>
            <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-semibold uppercase">
              {finding.severity}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{finding.description}</p>

          {finding.evidence && (
            <div className="bg-gray-100 rounded p-2 mb-2">
              <p className="text-xs text-gray-600 font-mono">{finding.evidence}</p>
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-semibold">
              View Recommendation →
            </summary>
            <div className="mt-2 pl-4 border-l-2 border-blue-300">
              <p className="text-gray-700">{finding.recommendation}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

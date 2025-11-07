'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, XCircle, Mail, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react'

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

  // Lead capture modal
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadName, setLeadName] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

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
      const wasNotCompleted = scan?.status !== 'COMPLETED'
      setScan(data)

      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setLoading(false)
        // Show lead modal when scan just completed
        if (wasNotCompleted && data.status === 'COMPLETED') {
          setTimeout(() => setShowLeadModal(true), 2000) // Show after 2 seconds
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLeadSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          email: leadEmail,
          name: leadName,
        }),
      })

      if (!response.ok) throw new Error('Failed to save lead')

      setLeadSubmitted(true)
      setTimeout(() => {
        setShowLeadModal(false)
      }, 2000)
    } catch (err) {
      console.error('Lead submission error:', err)
    } finally {
      setLeadSubmitting(false)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-12">
            <div className="w-20 h-20 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold mb-3 text-white">Scanning {scan?.url || 'website'}...</h2>
            <p className="text-slate-300 text-lg">
              {scan?.status === 'PENDING' && '⏳ Scan queued, starting soon...'}
              {scan?.status === 'SCANNING' && '🔍 Analyzing security vulnerabilities...'}
            </p>
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                New Scan
              </a>
              <div className="w-px h-6 bg-white/20"></div>
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold text-white">Security Report</span>
            </div>
            <a href="/admin" className="text-sm text-slate-400 hover:text-slate-300">
              View All Scans
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* URL Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
            <span className="text-sm text-slate-400">Scanned:</span>
            <span className="text-sm font-semibold text-white">{scan.url}</span>
          </div>
        </div>

        {/* Risk Score Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-baseline gap-4 mb-3 justify-center md:justify-start">
                <div className="text-7xl font-bold text-white">
                  {summary?.riskScore?.score || 0}
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-300">
                    {summary?.riskScore?.grade}
                  </div>
                  <RiskBadge level={summary?.riskScore?.level} />
                </div>
              </div>
              <p className="text-slate-400 flex items-center gap-2 justify-center md:justify-start">
                <TrendingUp className="w-4 h-4" />
                Security Score (higher is better)
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-slate-400 mb-3">Security Issues Found</p>
              <div className="grid grid-cols-4 gap-4">
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
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              🤖 Detected AI Technologies
            </h2>
            <div className="space-y-4">
              {detectedTech?.aiProviders?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">AI Providers:</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedTech.aiProviders.map((provider: string) => (
                      <span key={provider} className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg text-sm font-semibold">
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detectedTech?.chatWidgets?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Chat Widgets:</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedTech.chatWidgets.map((widget: string) => (
                      <span key={widget} className="px-4 py-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-lg text-sm font-semibold">
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
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Security Findings
          </h2>
          {findings?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-slate-300 text-lg">No issues found. Great job!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {findings?.map((finding: any, index: number) => (
                <FindingCard key={index} finding={finding} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 border border-blue-400/30 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Want a Deeper Security Audit?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto text-lg">
            This automated scan provides valuable insights, but cannot detect all AI-specific vulnerabilities
            like prompt injection, jailbreaking, or data leakage.
          </p>
          <button
            onClick={() => setShowLeadModal(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
          >
            Request Manual Audit ($2,000+)
          </button>
        </div>

      </div>

      {/* Lead Capture Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowLeadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {!leadSubmitted ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Get Your Full Security Report
                  </h3>
                  <p className="text-slate-400">
                    Enter your email to receive a detailed PDF report and consultation options
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="john@company.com"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {leadSubmitting ? 'Sending...' : 'Get Full Report'}
                  </button>
                </form>

                <p className="text-xs text-slate-500 text-center mt-4">
                  We respect your privacy. No spam, ever.
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-slate-400">
                  Check your inbox for the full security report.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Components
function RiskBadge({ level }: { level?: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-green-500/20 border border-green-400/30 text-green-300',
    MEDIUM: 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-300',
    HIGH: 'bg-orange-500/20 border border-orange-400/30 text-orange-300',
    CRITICAL: 'bg-red-500/20 border border-red-400/30 text-red-300',
  }

  return (
    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${colors[level || 'LOW']}`}>
      {level} RISK
    </span>
  )
}

function IssueCount({ label, count, color }: { label: string, count: number, color: string }) {
  const colors: Record<string, string> = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  }

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${colors[color]}`}>{count}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}

function FindingCard({ finding }: { finding: any }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-blue-500/50 bg-blue-500/10',
  }

  const severityIcons: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  }

  return (
    <div className={`border-l-4 rounded-lg p-4 backdrop-blur-sm ${severityColors[finding.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{severityIcons[finding.severity]}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white">{finding.title}</h3>
            <span className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs font-bold uppercase text-slate-300">
              {finding.severity}
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{finding.description}</p>

          {finding.evidence && (
            <div className="bg-black/20 rounded-lg p-3 mb-3 border border-white/10">
              <p className="text-xs text-slate-400 font-mono">{finding.evidence}</p>
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-1">
              View Recommendation <ArrowRight className="w-3 h-3" />
            </summary>
            <div className="mt-3 pl-4 border-l-2 border-blue-400/50 bg-white/5 rounded p-3">
              <p className="text-slate-300">{finding.recommendation}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

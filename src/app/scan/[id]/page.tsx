'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, XCircle, Mail, ArrowLeft, ArrowRight, TrendingUp, Download, Lock, Cookie, Code, Globe } from 'lucide-react'

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

// Kategória meta-adatok (icon, magyar cím, leírás)
const CATEGORY_META = {
  ai: {
    icon: '🤖',
    title: 'Mesterséges Intelligencia',
    description: 'AI technológiák használata az oldalon',
    explanation: 'Itt láthatod, hogy milyen AI szolgáltatásokat használ a weboldal. Ezek lehetnek chatbotok, nyelvmodellek vagy egyéb AI funkciók.',
  },
  security: {
    icon: '🛡️',
    title: 'Biztonsági Fejlécek',
    description: 'HTTP biztonsági beállítások',
    explanation: 'A böngésző számára küldött biztonsági utasítások. Ezek védik az oldalt támadások ellen, mint például XSS vagy clickjacking.',
  },
  client: {
    icon: '🔑',
    title: 'Kliens-oldali Kockázatok',
    description: 'Érzékeny adatok a kódban',
    explanation: 'Az oldal forráskódjában talált érzékeny információk, például API kulcsok vagy jelszavak, amiket támadók is láthatnak.',
  },
  ssl: {
    icon: '🔒',
    title: 'SSL/TLS Titkosítás',
    description: 'HTTPS kapcsolat biztonsága',
    explanation: 'A weboldal és a böngésző között titkosított kapcsolat. Hibás tanúsítvány azt jelenti, hogy a kapcsolat nem biztonságos.',
  },
  cookie: {
    icon: '🍪',
    title: 'Süti Biztonság',
    description: 'Cookie-k védelmi szintje',
    explanation: 'A sütik (cookies) tárolják a belépési adataid. Ha nincsenek megfelelően védve, támadók ellophatják őket.',
  },
  library: {
    icon: '📚',
    title: 'JavaScript Könyvtárak',
    description: 'Harmadik fél kódok',
    explanation: 'Az oldalon használt külső JavaScript library-k. Elavult verziók ismert sebezhetőségeket tartalmazhatnak.',
  },
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

  if (loading || !scan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
          <p className="text-white text-lg font-semibold">Scanning website security...</p>
          <p className="text-slate-400 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (scan.status === 'FAILED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Scan Failed</h2>
          <p className="text-slate-300 mb-6">Please try again with a different URL.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </a>
        </div>
      </div>
    )
  }

  // Parse findings
  const findings = scan.findings ? JSON.parse(scan.findings) : []
  const detectedTech = scan.detectedTech ? JSON.parse(scan.detectedTech) : {}
  const summary = {
    hasAI: detectedTech?.aiProviders?.length > 0 || detectedTech?.chatWidgets?.length > 0,
    riskScore: {
      score: scan.riskScore || 0,
      level: scan.riskLevel || 'UNKNOWN',
      grade: calculateGrade(scan.riskScore || 0),
    },
    criticalIssues: findings.filter((f: any) => f.severity === 'critical').length,
    highIssues: findings.filter((f: any) => f.severity === 'high').length,
    mediumIssues: findings.filter((f: any) => f.severity === 'medium').length,
    lowIssues: findings.filter((f: any) => f.severity === 'low').length,
  }

  // Group findings by category
  const findingsByCategory = findings.reduce((acc: any, finding: any) => {
    const cat = finding.category || 'security'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(finding)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Új Vizsgálat
              </a>
              <div className="w-px h-6 bg-white/20"></div>
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold text-white">Biztonsági Riport</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={`/api/scan/${scanId}/pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                download
              >
                <Download className="w-4 h-4" />
                PDF Letöltés
              </a>
              <a href="/admin" className="text-sm text-slate-400 hover:text-slate-300">
                Összes Vizsgálat
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* URL Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
            <span className="text-sm text-slate-400">Vizsgált oldal:</span>
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
                Biztonsági Pontszám (magasabb = jobb)
              </p>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-slate-400 mb-3">Talált Biztonsági Problémák</p>
              <div className="grid grid-cols-4 gap-4">
                <IssueCount label="Kritikus" count={summary?.criticalIssues || 0} color="red" />
                <IssueCount label="Magas" count={summary?.highIssues || 0} color="orange" />
                <IssueCount label="Közepes" count={summary?.mediumIssues || 0} color="yellow" />
                <IssueCount label="Alacsony" count={summary?.lowIssues || 0} color="blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Detected Tech */}
        {summary?.hasAI && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              🤖 Észlelt AI Technológiák
            </h2>
            <div className="space-y-4">
              {detectedTech?.aiProviders?.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">AI Szolgáltatók:</p>
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
                  <p className="text-sm text-slate-400 mb-2">Chat Widget-ek:</p>
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

        {/* Findings by Category */}
        <div className="space-y-6">
          {Object.keys(findingsByCategory).length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-12 text-center">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Remek Munka!</h3>
              <p className="text-slate-300 text-lg">Nem találtunk biztonsági problémákat ezen a weboldalon.</p>
            </div>
          ) : (
            Object.entries(findingsByCategory).map(([category, categoryFindings]: [string, any]) => {
              const meta = CATEGORY_META[category as keyof typeof CATEGORY_META] || CATEGORY_META.security

              return (
                <div key={category} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
                  {/* Category Header */}
                  <div className="mb-6 pb-4 border-b border-white/20">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{meta.icon}</div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">{meta.title}</h2>
                        <p className="text-sm text-slate-400 mb-2">{meta.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">{categoryFindings.length}</div>
                        <div className="text-xs text-slate-400">probléma</div>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                      <p className="text-sm text-blue-200">
                        <strong>Mit jelent ez?</strong> {meta.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Findings List */}
                  <div className="space-y-4">
                    {categoryFindings.map((finding: any, index: number) => (
                      <FindingCard key={index} finding={finding} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 border border-blue-400/30 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Szeretnél Mélyebb Biztonsági Auditot?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto text-lg">
            Ez az automatikus vizsgálat hasznos betekintést nyújt, de nem tud minden AI-specifikus sebezhetőséget
            feltárni, mint például prompt injection, jailbreaking vagy adatszivárgás.
          </p>
          <button
            onClick={() => setShowLeadModal(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
          >
            Manuális Audit Kérése (500.000 Ft-tól)
          </button>
        </div>

      </div>

      {/* Lead Capture Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowLeadModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {!leadSubmitted ? (
              <>
                <div className="mb-6">
                  <Mail className="w-12 h-12 text-blue-400 mb-3" />
                  <h2 className="text-2xl font-bold text-white mb-2">Kérj Szakértői Auditot</h2>
                  <p className="text-slate-400">
                    Hagyd meg az elérhetőséged és szakértőink felvesznek veled a kapcsolatot a részletekért.
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Név
                    </label>
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Teljes neved"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email cím
                    </label>
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="pelda@email.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leadSubmitting ? 'Küldés...' : 'Kapcsolatfelvétel Kérése'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Köszönjük!</h3>
                <p className="text-slate-300">
                  Hamarosan felvesszük veled a kapcsolatot a részletekkel.
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

  const labels: Record<string, string> = {
    LOW: 'ALACSONY KOCKÁZAT',
    MEDIUM: 'KÖZEPES KOCKÁZAT',
    HIGH: 'MAGAS KOCKÁZAT',
    CRITICAL: 'KRITIKUS KOCKÁZAT',
  }

  return (
    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${colors[level || 'LOW']}`}>
      {labels[level || 'LOW']}
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

  const severityLabels: Record<string, string> = {
    critical: 'KRITIKUS',
    high: 'MAGAS',
    medium: 'KÖZEPES',
    low: 'ALACSONY',
  }

  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border-l-4 rounded-lg p-5 backdrop-blur-sm ${severityColors[finding.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{severityIcons[finding.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-white text-lg">{finding.title}</h3>
            <span className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs font-bold uppercase text-slate-300">
              {severityLabels[finding.severity]}
            </span>
          </div>

          <p className="text-sm text-slate-300 mb-3 leading-relaxed">{finding.description}</p>

          {finding.evidence && (
            <div className="bg-black/30 rounded-lg p-3 mb-3 border border-white/10">
              <p className="text-xs text-slate-400 mb-1 font-semibold">Bizonyíték:</p>
              <p className="text-xs text-slate-300 font-mono break-all">{finding.evidence}</p>
            </div>
          )}

          {/* Security Risk Explanation */}
          {finding.impact && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-200 mb-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Miért probléma ez?
              </p>
              <p className="text-sm text-red-100 leading-relaxed">{finding.impact}</p>
            </div>
          )}

          {/* Recommendation (Collapsible) */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Megoldás elrejtése' : 'Megoldás megtekintése'}
            <ArrowRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          {expanded && (
            <div className="mt-3 pl-4 border-l-2 border-green-400/50 bg-green-500/10 rounded-r p-3">
              <p className="text-xs text-green-200 mb-1 font-semibold">Javasolt Megoldás:</p>
              <p className="text-sm text-green-100 leading-relaxed">{finding.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function calculateGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

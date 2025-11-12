'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, XCircle, Mail, ArrowLeft, ArrowRight, TrendingUp, Download, Lock, Cookie, Code, Globe, RefreshCw, Lightbulb, Search } from 'lucide-react'
import AdminDebugBar from './AdminDebugBar'
import { getRandomSecurityTip } from '@/data/ai-security-tips'
import { AiTrustScore } from '@/components/AiTrustScore'

interface Scan {
  id: string
  url: string
  status: string
  riskScore?: number
  riskLevel?: string
  findings?: any
  detectedTech?: any
  metadata?: any // Already parsed by API
  completedAt?: string
  aiTrustScorecard?: any // AI Trust Score data
}

interface KnowledgeBaseEntry {
  findingKey: string
  category: string
  severity: string
  title: string
  explanation: string
  impact: string
  solution: string
  technicalDetails?: string
  references: string[]
}

// Category metadata (icon, title, description)
const CATEGORY_META = {
  ai: {
    icon: '🤖',
    title: 'Artificial Intelligence',
    description: 'AI technologies detected on this site',
    explanation: 'Shows which AI services this website uses, including chatbots, language models, and other AI-powered features.',
  },
  security: {
    icon: '🛡️',
    title: 'Security Headers',
    description: 'HTTP security configurations',
    explanation: 'Security instructions sent to your browser. These protect against attacks like XSS, clickjacking, and code injection.',
  },
  client: {
    icon: '🔑',
    title: 'Client-Side Risks',
    description: 'Sensitive data in source code',
    explanation: 'Sensitive information found in the page source code, such as API keys or passwords, that attackers can easily access.',
  },
  ssl: {
    icon: '🔒',
    title: 'SSL/TLS Encryption',
    description: 'HTTPS connection security',
    explanation: 'Encrypted connection between the website and your browser. Invalid certificates mean the connection is not secure.',
  },
  cookie: {
    icon: '🍪',
    title: 'Cookie Security',
    description: 'Cookie protection level',
    explanation: 'Cookies store your login data and session information. If not properly protected, attackers can steal them.',
  },
  library: {
    icon: '📚',
    title: 'JavaScript Libraries',
    description: 'Third-party code dependencies',
    explanation: 'External JavaScript libraries used on this site. Outdated versions may contain known security vulnerabilities.',
  },
  reconnaissance: {
    icon: '🔍',
    title: 'Information Disclosure',
    description: 'Exposed files and directories',
    explanation: 'Sensitive files, directories, and configuration that should not be publicly accessible. These can provide attackers with valuable information about the system.',
  },
  admin: {
    icon: '⚠️',
    title: 'Admin & Authentication',
    description: 'Administrative interfaces and login forms',
    explanation: 'Admin panels and login forms are primary targets for attackers. These interfaces should be protected with strong authentication, rate limiting, and IP restrictions.',
  },
  cors: {
    icon: '🌐',
    title: 'Cross-Origin Resource Sharing (CORS)',
    description: 'CORS configuration and cross-origin security',
    explanation: 'CORS misconfigurations can allow unauthorized cross-origin access to sensitive data and APIs. Properly configured CORS prevents data theft across domains.',
  },
  dns: {
    icon: '🌍',
    title: 'DNS & Email Security',
    description: 'Domain name system and email authentication',
    explanation: 'DNS security features like DNSSEC, SPF, DKIM, and DMARC protect against domain spoofing, email forgery, and DNS poisoning attacks. CAA records control which certificate authorities can issue SSL certificates.',
  },
  port: {
    icon: '🔌',
    title: 'Network Ports & Services',
    description: 'Exposed network services and database interfaces',
    explanation: 'Open network ports can expose databases, development servers, and management interfaces to the internet. Critical services like MySQL, PostgreSQL, Redis should never be publicly accessible.',
  },
  compliance: {
    icon: '📋',
    title: 'Privacy & Compliance',
    description: 'GDPR, CCPA, PCI DSS, HIPAA compliance indicators',
    explanation: 'Privacy regulations like GDPR and CCPA require websites to protect user data, provide transparency, and obtain consent. PCI DSS governs payment card security, while HIPAA protects health information. This analysis checks for compliance indicators like privacy policies, cookie consent, and data protection measures.',
  },
  waf: {
    icon: '🛡️',
    title: 'Web Application Firewall',
    description: 'WAF protection and CDN security features',
    explanation: 'Web Application Firewalls (WAF) protect against common web attacks like SQL injection, XSS, and DDoS. Popular providers include Cloudflare, AWS WAF, Akamai, Imperva, and F5. WAFs filter malicious traffic before it reaches your application.',
  },
  mfa: {
    icon: '🔐',
    title: 'Multi-Factor Authentication',
    description: 'MFA and 2FA implementation methods',
    explanation: 'Multi-Factor Authentication adds an extra layer of security beyond passwords. Methods include OAuth (Google, Facebook), SAML (enterprise SSO), WebAuthn (hardware keys, biometrics), TOTP (authenticator apps), SMS, and push notifications. MFA significantly reduces account takeover risk.',
  },
  'rate-limit': {
    icon: '⏱️',
    title: 'Rate Limiting & Bot Protection',
    description: 'API rate limits and bot detection mechanisms',
    explanation: 'Rate limiting prevents API abuse and brute-force attacks by restricting request frequency. Bot protection (reCAPTCHA, hCaptcha, Cloudflare Turnstile) blocks automated attacks and scraping. Together they protect against DDoS and credential stuffing.',
  },
  graphql: {
    icon: '🔮',
    title: 'GraphQL Security',
    description: 'GraphQL endpoint security configuration',
    explanation: 'GraphQL APIs require special security considerations. Exposed introspection reveals your entire schema to attackers. GraphQL Playground and GraphiQL should be disabled in production. Query depth limiting and cost analysis prevent DoS attacks.',
  },
  'error-disclosure': {
    icon: '❌',
    title: 'Error & Debug Information Disclosure',
    description: 'Stack traces, database errors, and debug mode indicators',
    explanation: 'Exposed error messages reveal critical information about your application\'s internals: framework versions, file paths, database structure, and SQL queries. Stack traces help attackers map your system architecture. Database errors may expose connection strings or sensitive data. Debug mode shows variable values and configuration. This information significantly aids targeted attacks.',
  },
  'spa-api': {
    icon: '⚡',
    title: 'SPA & API Architecture',
    description: 'Single Page Application framework and API endpoints',
    explanation: 'Modern SPAs (React, Vue, Angular, Next.js) rely heavily on APIs for data. This analyzer identifies your SPA framework, discovers API endpoints, and checks for security issues like unprotected endpoints, API keys in URLs, or missing authentication. WebSocket connections are also analyzed for proper security implementation.',
  },
  'owasp-llm01': {
    icon: '💉',
    title: 'OWASP LLM01: Prompt Injection Risk',
    description: 'Manipulation of AI system prompts via user input',
    explanation: 'Prompt injection allows attackers to manipulate AI behavior by crafting malicious inputs that override system instructions. This analyzer detects exposed system prompts in client code, risky prompt assembly patterns (user input concatenation), and missing input sanitization near AI endpoints. When system prompts are visible or user input is directly concatenated without validation, attackers can inject commands like "Ignore previous instructions and..." to extract sensitive data, bypass safety controls, or manipulate AI responses.',
  },
  'owasp-llm02': {
    icon: '🚨',
    title: 'OWASP LLM02: Insecure Output Handling',
    description: 'XSS vulnerabilities in AI-generated content',
    explanation: 'AI-generated output can contain malicious scripts (XSS attacks) if rendered without proper sanitization. This analyzer detects dangerous DOM manipulation patterns (innerHTML, dangerouslySetInnerHTML, eval), unsafe markdown configurations, and weak Content Security Policies. When AI output is directly injected into HTML without sanitization and CSP protection, attackers can execute malicious code in user browsers, steal sessions, or hijack accounts.',
  },
}

export default function ScanResultPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const scanId = params.id as string

  // Check if full report mode is enabled
  const isFullReport = searchParams.get('report') === 'full_report'

  const [scan, setScan] = useState<Scan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Knowledge base for E-E-A-T content
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([])

  // Lead capture modal
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadName, setLeadName] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  // Regenerate report
  const [regenerating, setRegenerating] = useState(false)

  // Random security tip for loading screen (client-side only to avoid hydration mismatch)
  const [securityTip, setSecurityTip] = useState<string>('')

  // New scan form
  const [newScanUrl, setNewScanUrl] = useState('')
  const [newScanLoading, setNewScanLoading] = useState(false)

  useEffect(() => {
    // Set random tip only on client-side to avoid hydration error
    setSecurityTip(getRandomSecurityTip())

    // Fetch knowledge base once on mount
    fetchKnowledgeBase()

    fetchScan()
    // Poll every 2 seconds if not completed
    const interval = setInterval(() => {
      if (scan?.status !== 'COMPLETED' && scan?.status !== 'FAILED') {
        fetchScan()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [scanId, scan?.status])

  const fetchKnowledgeBase = async () => {
    try {
      const response = await fetch('/api/knowledge-base')
      if (response.ok) {
        const data = await response.json()
        setKnowledgeBase(data)
      }
    } catch (error) {
      console.error('Failed to fetch knowledge base:', error)
    }
  }

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

  const handleRegenerateReport = async () => {
    if (!scan?.url || regenerating) return

    setRegenerating(true)
    try {
      // Create a new scan with the same URL
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scan.url }),
      })

      if (!response.ok) throw new Error('Failed to create new scan')

      const data = await response.json()
      // Redirect to the new scan page
      window.location.href = `/scan/${data.scanId}`
    } catch (err) {
      console.error('Regenerate error:', err)
      alert('Failed to regenerate report. Please try again.')
      setRegenerating(false)
    }
  }

  const handleNewScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScanUrl || newScanLoading) return

    setNewScanLoading(true)
    try {
      // Create a new scan with the provided URL
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newScanUrl }),
      })

      if (!response.ok) throw new Error('Failed to create new scan')

      const data = await response.json()
      // Navigate to the new scan page
      router.push(`/scan/${data.scanId}`)
    } catch (err) {
      console.error('New scan error:', err)
      alert('Failed to create new scan. Please try again.')
      setNewScanLoading(false)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-6"></div>
          <p className="text-white text-xl font-semibold mb-2">Scanning website security...</p>
          {scan?.url && (
            <p className="text-blue-300 text-sm font-mono mb-4 break-all">{scan.url}</p>
          )}
          <p className="text-slate-400 text-sm mb-8">This may take a few moments</p>

          {/* Random AI Security Tip - only show after client-side hydration */}
          {securityTip && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="text-blue-300 text-sm font-semibold mb-2">Security Tip</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{securityTip}</p>
                </div>
              </div>
            </div>
          )}
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

  // Parse report structure (findings is actually a full ScanReport object)
  const report = scan.findings || { summary: {}, detectedTech: {}, findings: [] }
  const findings = report.findings || []
  const detectedTech = report.detectedTech || scan.detectedTech || {}
  const summary = report.summary || {
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

  // Separate AI findings from other categories (for prioritized display)
  const aiFindings = findingsByCategory['ai'] || []

  // Define logical order for security categories (OWASP LLM categories prioritized at top)
  const categoryOrder = ['owasp-llm01', 'owasp-llm02', 'reconnaissance', 'admin', 'port', 'client', 'ssl', 'cors', 'dns', 'cookie', 'security', 'library', 'compliance', 'waf', 'mfa', 'rate-limit', 'graphql', 'error-disclosure', 'spa-api']

  // In full report mode, show ALL categories even if no findings
  // In normal mode, only show categories with findings
  const nonAICategories = isFullReport
    ? categoryOrder.filter(cat => cat !== 'ai')
    : categoryOrder.filter(cat => findingsByCategory[cat] && cat !== 'ai')

  // Extract domain from URL for elegant title
  const getDomainTitle = (url: string): string => {
    try {
      const urlObj = new URL(url)
      // Remove 'www.' if present and capitalize first letter
      const domain = urlObj.hostname.replace(/^www\./, '')
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    } catch {
      return 'Website'
    }
  }

  const domainTitle = getDomainTitle(scan.url)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Admin Debug Bar - only visible to logged-in admins */}
      <AdminDebugBar metadata={scan.metadata} />

      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">
                  {domainTitle} <span className="text-blue-300">Safety Report</span>
                </h1>
              </div>
              <div className="flex items-center gap-3 ml-11">
                <a
                  href="/"
                  className="text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-1 text-sm"
                >
                  <ArrowLeft className="w-3 h-3" />
                  New Scan
                </a>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-sm font-mono">{scan.url}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRegenerateReport}
                disabled={regenerating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                title="Run a fresh scan with the latest detection rules"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate Report'}
              </button>
              <a
                href={`/api/scan/${scanId}/pdf`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                download
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              <a href="/aiq_belepes_mrd/dashboard" className="text-sm text-slate-400 hover:text-slate-300">
                View All Scans
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* New Scan Form */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <form onSubmit={handleNewScan} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="url"
                value={newScanUrl}
                onChange={(e) => setNewScanUrl(e.target.value)}
                placeholder="Enter a new URL to scan (e.g., https://example.com)"
                className="w-full px-5 py-3 pl-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                required
                disabled={newScanLoading}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            <button
              type="submit"
              disabled={newScanLoading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
            >
              {newScanLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Start New Scan
                </>
              )}
            </button>
          </form>
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

        {/* AI Trust Score - NEW! */}
        {scan.aiTrustScorecard && (
          <div className="mb-8">
            <AiTrustScore
              score={scan.aiTrustScorecard.score}
              weightedScore={scan.aiTrustScorecard.weightedScore}
              categoryScores={scan.aiTrustScorecard.categoryScores}
              passedChecks={scan.aiTrustScorecard.passedChecks}
              totalChecks={scan.aiTrustScorecard.totalChecks}
              detectedAiProvider={scan.aiTrustScorecard.detectedAiProvider}
              detectedModel={scan.aiTrustScorecard.detectedModel}
              detectedChatFramework={scan.aiTrustScorecard.detectedChatFramework}
            />
          </div>
        )}

        {/* AI Detection Section - PRIORITIZED FIRST */}
        {(summary?.hasAI || aiFindings.length > 0) && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-8">
            {/* AI Section Header */}
            <div className="mb-6 pb-4 border-b border-white/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-4xl">🤖</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">Artificial Intelligence Detection</h2>
                  <p className="text-sm text-slate-400 mb-2">AI technologies and security analysis</p>
                </div>
                {aiFindings.length > 0 && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{aiFindings.length}</div>
                    <div className="text-xs text-slate-400">findings</div>
                  </div>
                )}
              </div>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  <strong>What does this mean?</strong> This shows AI services detected on the website, including chatbots, language models, and AI-powered features. AI implementations require additional security considerations including prompt injection protection, data leakage prevention, and output validation.
                </p>
              </div>
            </div>

            {/* Detected AI Technologies */}
            {(detectedTech?.aiProviders?.length > 0 || detectedTech?.chatWidgets?.length > 0) && (
              <div className="mb-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Detected Technologies</h3>
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
            )}

            {/* AI Security Findings */}
            {aiFindings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-t border-white/20 pt-4">Security Findings</h3>
                {aiFindings.map((finding: any, index: number) => (
                  <FindingCard key={index} finding={finding} knowledgeBase={knowledgeBase} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Technology Stack */}
        {report?.techStack && report.techStack.totalCount > 0 && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6 mb-8">
            <div className="mb-6 pb-4 border-b border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-8 h-8 text-blue-400" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">Technology Stack</h2>
                  <p className="text-sm text-slate-400">Detected technologies and services used on this website</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{report.techStack.totalCount}</div>
                  <div className="text-xs text-slate-400">technologies</div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  <strong>What does this mean?</strong> This shows all the technologies, frameworks, and third-party services detected on the website, including CMS platforms, analytics tools, CDNs, and more.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CMS */}
              {report.techStack.categories.cms.length > 0 && (
                <TechCategory
                  title="CMS"
                  icon="📝"
                  color="purple"
                  technologies={report.techStack.categories.cms}
                />
              )}

              {/* E-commerce */}
              {report.techStack.categories.ecommerce.length > 0 && (
                <TechCategory
                  title="E-commerce"
                  icon="🛒"
                  color="green"
                  technologies={report.techStack.categories.ecommerce}
                />
              )}

              {/* Analytics */}
              {report.techStack.categories.analytics.length > 0 && (
                <TechCategory
                  title="Analytics"
                  icon="📊"
                  color="blue"
                  technologies={report.techStack.categories.analytics}
                />
              )}

              {/* Ads */}
              {report.techStack.categories.ads.length > 0 && (
                <TechCategory
                  title="Advertising"
                  icon="📢"
                  color="yellow"
                  technologies={report.techStack.categories.ads}
                />
              )}

              {/* CDN */}
              {report.techStack.categories.cdn.length > 0 && (
                <TechCategory
                  title="CDN"
                  icon="🌐"
                  color="cyan"
                  technologies={report.techStack.categories.cdn}
                />
              )}

              {/* Social */}
              {report.techStack.categories.social.length > 0 && (
                <TechCategory
                  title="Social Media"
                  icon="👥"
                  color="pink"
                  technologies={report.techStack.categories.social}
                />
              )}

              {/* Frameworks */}
              {report.techStack.categories.framework.length > 0 && (
                <TechCategory
                  title="Frameworks"
                  icon="⚛️"
                  color="indigo"
                  technologies={report.techStack.categories.framework}
                />
              )}

              {/* Hosting */}
              {report.techStack.categories.hosting.length > 0 && (
                <TechCategory
                  title="Hosting"
                  icon="☁️"
                  color="slate"
                  technologies={report.techStack.categories.hosting}
                />
              )}
            </div>
          </div>
        )}

        {/* Other Findings by Category (excluding AI which is shown above) */}
        <div className="space-y-6">
          {nonAICategories.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-12 text-center">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Great Job!</h3>
              <p className="text-slate-300 text-lg">No additional security issues found on this website.</p>
            </div>
          ) : (
            nonAICategories.map((category: string) => {
              const categoryFindings = findingsByCategory[category] || []
              const meta = CATEGORY_META[category as keyof typeof CATEGORY_META] || CATEGORY_META.security
              const hasFindings = categoryFindings.length > 0

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
                        <div className={`text-3xl font-bold ${hasFindings ? 'text-white' : 'text-green-400'}`}>
                          {hasFindings ? categoryFindings.length : '✓'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {hasFindings ? 'issues' : 'passed'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
                      <p className="text-sm text-blue-200">
                        <strong>What does this mean?</strong> {meta.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Findings List */}
                  <div className="space-y-4">
                    {hasFindings ? (
                      categoryFindings.map((finding: any, index: number) => (
                        <FindingCard key={index} finding={finding} knowledgeBase={knowledgeBase} />
                      ))
                    ) : (
                      <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-green-200 font-semibold">No issues found in this category</p>
                        <p className="text-green-300/70 text-sm mt-1">All checks passed successfully</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 border border-blue-400/30 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Want a Deeper Security Audit?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto text-lg">
            This automated scan provides valuable insights, but cannot detect all AI-specific vulnerabilities
            like prompt injection, jailbreaking, or data leakage.
          </p>
          <button
            onClick={() => setShowLeadModal(true)}
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
          >
            Request Manual Audit (Starting at $2,000)
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
                  <h2 className="text-2xl font-bold text-white mb-2">Request Expert Audit</h2>
                  <p className="text-slate-400">
                    Leave your contact info and our security experts will reach out with details.
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leadSubmitting ? 'Sending...' : 'Request Contact'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-slate-300">
                  We'll reach out to you shortly with more details.
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
    LOW: 'LOW RISK',
    MEDIUM: 'MEDIUM RISK',
    HIGH: 'HIGH RISK',
    CRITICAL: 'CRITICAL RISK',
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

/**
 * Map finding title to knowledge base findingKey
 *
 * Pairing Logic Documentation:
 * - Security headers: "Missing: Content-Security-Policy" → "missing-content-security-policy"
 * - SSL/TLS: Exact title match → kebab-case key
 * - Cookies: "Cookie missing HttpOnly flag" → "cookie-missing-httponly"
 * - AI: "AI Technology Detected" → "ai-technology-detected"
 * - Client risks: "Exposed API Key" → "exposed-api-key"
 */
function findKnowledgeBaseEntry(finding: any, knowledgeBase: KnowledgeBaseEntry[]): KnowledgeBaseEntry | null {
  const title = finding.title.toLowerCase()

  // Security headers: "Missing: X-Frame-Options" → "missing-x-frame-options"
  if (title.startsWith('missing:')) {
    const headerName = title.replace('missing:', '').trim()
    const key = `missing-${headerName.replace(/[^a-z0-9]+/g, '-')}`
    return knowledgeBase.find(kb => kb.findingKey === key) || null
  }

  // SSL/TLS: Direct title mapping
  const sslMapping: Record<string, string> = {
    'no https encryption': 'no-https-encryption',
    'ssl certificate expired': 'ssl-certificate-expired',
    'ssl certificate expiring soon': 'ssl-certificate-expiring-soon',
    'ssl certificate renewal recommended': 'ssl-certificate-renewal-recommended',
    'self-signed ssl certificate': 'self-signed-ssl-certificate',
  }
  if (sslMapping[title]) {
    return knowledgeBase.find(kb => kb.findingKey === sslMapping[title]) || null
  }

  // Cookie security
  if (title.includes('cookie') && title.includes('httponly')) {
    return knowledgeBase.find(kb => kb.findingKey === 'cookie-missing-httponly') || null
  }
  if (title.includes('cookie') && title.includes('secure')) {
    return knowledgeBase.find(kb => kb.findingKey === 'cookie-missing-secure') || null
  }
  if (title.includes('cookie') && title.includes('samesite')) {
    return knowledgeBase.find(kb => kb.findingKey === 'cookie-missing-samesite') || null
  }

  // JavaScript libraries
  if (title.includes('cdn') && title.includes('integrity')) {
    return knowledgeBase.find(kb => kb.findingKey === 'cdn-missing-sri') || null
  }
  if (title.includes('subresource integrity')) {
    return knowledgeBase.find(kb => kb.findingKey === 'cdn-missing-sri') || null
  }
  if (title.includes('deprecated library')) {
    return knowledgeBase.find(kb => kb.findingKey === 'deprecated-library') || null
  }
  if (title.includes('vulnerable version')) {
    return knowledgeBase.find(kb => kb.findingKey === 'vulnerable-library-version') || null
  }

  // SSL/TLS additional
  if (title.includes('mixed content')) {
    return knowledgeBase.find(kb => kb.findingKey === 'mixed-content-detected') || null
  }

  // AI detection
  if (title.includes('ai technology detected')) {
    return knowledgeBase.find(kb => kb.findingKey === 'ai-technology-detected') || null
  }

  // Client risks: API keys
  if (title.includes('exposed') && title.includes('api key')) {
    return knowledgeBase.find(kb => kb.findingKey === 'exposed-api-key') || null
  }

  return null
}

function FindingCard({ finding, knowledgeBase }: { finding: any; knowledgeBase: KnowledgeBaseEntry[] }) {
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
    critical: 'CRITICAL RISK',
    high: 'HIGH RISK',
    medium: 'MEDIUM RISK',
    low: 'LOW RISK',
  }

  const [expanded, setExpanded] = useState(false)

  // Try to find E-E-A-T content from knowledge base
  const kbEntry = findKnowledgeBaseEntry(finding, knowledgeBase)

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
              <p className="text-xs text-slate-400 mb-1 font-semibold">Evidence:</p>
              <p className="text-xs text-slate-300 font-mono break-all">{finding.evidence}</p>
            </div>
          )}

          {/* Security Risk Explanation */}
          {finding.impact && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-red-200 mb-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Why is this a problem?
              </p>
              <p className="text-sm text-red-100 leading-relaxed">{finding.impact}</p>
            </div>
          )}

          {/* E-E-A-T Content (Collapsible) - Professional explanations from knowledge base */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-300 hover:text-blue-200 font-semibold flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Hide details' : 'How to fix this'}
            <ArrowRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {kbEntry ? (
                // Professional E-E-A-T content from knowledge base
                <>
                  {/* What is this issue? */}
                  <div className="pl-4 border-l-2 border-blue-400/50 bg-blue-500/10 rounded-r p-3">
                    <p className="text-xs text-blue-200 mb-2 font-semibold">What is this issue?</p>
                    <p className="text-sm text-blue-100 leading-relaxed">{kbEntry.explanation}</p>
                  </div>

                  {/* Why is this dangerous? (Impact) */}
                  <div className="pl-4 border-l-2 border-orange-400/50 bg-orange-500/10 rounded-r p-3">
                    <p className="text-xs text-orange-200 mb-2 font-semibold">Why is this dangerous?</p>
                    <p className="text-sm text-orange-100 leading-relaxed">{kbEntry.impact}</p>
                  </div>

                  {/* How to fix it (Solution) */}
                  <div className="pl-4 border-l-2 border-green-400/50 bg-green-500/10 rounded-r p-3">
                    <p className="text-xs text-green-200 mb-2 font-semibold">How to fix it:</p>
                    <p className="text-sm text-green-100 leading-relaxed">{kbEntry.solution}</p>
                  </div>

                  {/* Technical details (optional) */}
                  {kbEntry.technicalDetails && (
                    <div className="pl-4 border-l-2 border-purple-400/50 bg-purple-500/10 rounded-r p-3">
                      <p className="text-xs text-purple-200 mb-2 font-semibold">Technical Details:</p>
                      <p className="text-sm text-purple-100 leading-relaxed">{kbEntry.technicalDetails}</p>
                    </div>
                  )}

                  {/* References */}
                  {kbEntry.references && kbEntry.references.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-400/50 bg-slate-500/10 rounded-r p-3">
                      <p className="text-xs text-slate-200 mb-2 font-semibold">Learn more:</p>
                      <ul className="space-y-1">
                        {kbEntry.references.map((ref, idx) => (
                          <li key={idx}>
                            <a
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-300 hover:text-blue-200 underline break-all"
                            >
                              {ref}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                // Fallback to original recommendation if no KB entry found
                <div className="pl-4 border-l-2 border-green-400/50 bg-green-500/10 rounded-r p-3">
                  <p className="text-xs text-green-200 mb-2 font-semibold">Recommended Solution:</p>
                  <p className="text-sm text-green-100 leading-relaxed">{finding.recommendation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TechCategory({
  title,
  icon,
  color,
  technologies
}: {
  title: string
  icon: string
  color: string
  technologies: Array<{
    name: string
    version?: string
    confidence: string
    description?: string
    website?: string
    evidence?: string
  }>
}) {
  const colorClasses: Record<string, { border: string, bg: string, text: string }> = {
    purple: { border: 'border-purple-400/30', bg: 'bg-purple-500/10', text: 'text-purple-300' },
    green: { border: 'border-green-400/30', bg: 'bg-green-500/10', text: 'text-green-300' },
    blue: { border: 'border-blue-400/30', bg: 'bg-blue-500/10', text: 'text-blue-300' },
    yellow: { border: 'border-yellow-400/30', bg: 'bg-yellow-500/10', text: 'text-yellow-300' },
    cyan: { border: 'border-cyan-400/30', bg: 'bg-cyan-500/10', text: 'text-cyan-300' },
    pink: { border: 'border-pink-400/30', bg: 'bg-pink-500/10', text: 'text-pink-300' },
    indigo: { border: 'border-indigo-400/30', bg: 'bg-indigo-500/10', text: 'text-indigo-300' },
    slate: { border: 'border-slate-400/30', bg: 'bg-slate-500/10', text: 'text-slate-300' },
  }

  const colors = colorClasses[color] || colorClasses.blue

  const confidenceColors: Record<string, string> = {
    high: 'bg-green-500/20 text-green-300 border border-green-400/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30',
    low: 'bg-slate-500/20 text-slate-400 border border-slate-400/30',
  }

  const confidenceLabels: Record<string, string> = {
    high: 'Confirmed',
    medium: 'Likely',
    low: 'Possible',
  }

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className={`font-semibold ${colors.text} text-lg`}>{title}</h3>
        <span className="ml-auto text-xs text-slate-400">{technologies.length}</span>
      </div>
      <div className="space-y-2">
        {technologies.map((tech, idx) => (
          <div key={idx} className="bg-black/20 rounded-lg p-3 border border-white/10">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                {tech.website ? (
                  <a
                    href={tech.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white hover:text-blue-300 transition-colors text-sm"
                  >
                    {tech.name}
                  </a>
                ) : (
                  <span className="font-semibold text-white text-sm">{tech.name}</span>
                )}
                {tech.version && (
                  <span className="ml-2 text-xs text-slate-400 font-mono">v{tech.version}</span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${confidenceColors[tech.confidence]}`} title={`Detection confidence: ${tech.confidence}`}>
                ✓ {confidenceLabels[tech.confidence]}
              </span>
            </div>
            {tech.evidence && (
              <div className="bg-blue-500/10 border border-blue-400/20 rounded px-2 py-1 mt-2">
                <p className="text-xs text-blue-200 font-mono break-all">{tech.evidence}</p>
              </div>
            )}
            {tech.description && !tech.evidence && (
              <p className="text-xs text-slate-400 mt-1">{tech.description}</p>
            )}
          </div>
        ))}
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

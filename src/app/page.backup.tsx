'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Zap, Lock, AlertTriangle, CheckCircle, FileText } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    const authToken = localStorage.getItem('admin_auth')
    setIsLoggedIn(authToken === 'authenticated')
  }, [])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Use the user-friendly message from domain validation if available
        const errorMessage = data.message || data.error || 'Failed to start scan'
        throw new Error(errorMessage)
      }

      // Redirect to results page
      router.push(`/scan/${data.scanId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-32">
          {/* Header */}
          <div className="flex justify-between items-center mb-20">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold text-white">AI Security Scanner</span>
            </div>
            <a
              href={isLoggedIn ? "/aiq_belepes_mrd/dashboard" : "/all-scans"}
              className="text-sm text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View All Scans
            </a>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-400/20 rounded-full">
              <span className="text-blue-300 text-sm font-medium">Free AI Security Assessment</span>
            </div>

            <h1 className="text-6xl font-bold mb-6 text-white leading-tight">
              Is Your AI Implementation
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Putting You at Risk?
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
              Get an instant security audit of your AI-powered website. We scan for vulnerabilities,
              exposed API keys, and compliance with OWASP LLM Top 10 standards.
            </p>

            {/* Scan Form */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
                <form onSubmit={handleScan} className="space-y-4">
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://your-website.com"
                      className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border-0 rounded-xl text-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 px-8 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Start Free Security Scan
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
                    <p className="text-red-200">{error}</p>
                  </div>
                )}

                <p className="text-sm text-slate-400 mt-4">
                  ⚡ Results in seconds • No credit card required • 100% free
                </p>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Risk Detection</h3>
              <p className="text-slate-400 text-sm">
                Identify AI providers, exposed API keys, and potential prompt injection vulnerabilities
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Security Headers</h3>
              <p className="text-slate-400 text-sm">
                Check CSP, HSTS, and other critical security headers protecting your AI applications
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">OWASP LLM Top 10</h3>
              <p className="text-slate-400 text-sm">
                Comprehensive audit against the latest AI security standards and best practices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-slate-900/50 border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Passive Scanning Only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No Server Access Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Privacy Focused</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Results</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

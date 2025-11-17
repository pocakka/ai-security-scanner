import { Shield, Zap, Lock, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import { ScanForm } from '@/components/ScanForm'
import { AdminLink } from '@/components/AdminLink'
import type { Metadata } from 'next'

// Page-specific SEO metadata
export const metadata: Metadata = {
  title: 'AI Security Scanner - Free OWASP LLM Vulnerability Detection',
  description: 'Free AI security scanner for detecting OWASP LLM Top 10 vulnerabilities, AI implementation risks, and security misconfigurations. Scan any website in seconds.',
  openGraph: {
    title: 'AI Security Scanner - Free OWASP LLM Vulnerability Detection',
    description: 'Scan websites for AI security risks and OWASP LLM vulnerabilities',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Admin Link (Client Component) */}
      <AdminLink />

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
              href="/all-scans"
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

            {/* Scan Form (Client Component) */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
              <ScanForm />
              <p className="mt-4 text-sm text-slate-400">
                Free · No signup required · Results in seconds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Comprehensive Security Analysis
            </h2>
            <p className="text-slate-300 text-lg">
              We check for the most critical AI and web security vulnerabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-12 h-12 text-blue-400" />}
              title="OWASP LLM Top 10"
              description="Detect vulnerabilities specific to Large Language Model implementations, including prompt injection and data leakage risks."
            />
            <FeatureCard
              icon={<Lock className="w-12 h-12 text-cyan-400" />}
              title="Security Headers"
              description="Comprehensive analysis of HTTP security headers, SSL/TLS configuration, and cookie security settings."
            />
            <FeatureCard
              icon={<AlertTriangle className="w-12 h-12 text-yellow-400" />}
              title="Exposed Secrets"
              description="Scan for exposed API keys, credentials, and sensitive data that could compromise your AI systems."
            />
            <FeatureCard
              icon={<Zap className="w-12 h-12 text-purple-400" />}
              title="AI Detection"
              description="Automatically identify AI implementations and chatbots on your website for targeted security assessment."
            />
            <FeatureCard
              icon={<CheckCircle className="w-12 h-12 text-green-400" />}
              title="Compliance Check"
              description="Verify GDPR, CCPA, and PCI-DSS compliance indicators to ensure regulatory requirements are met."
            />
            <FeatureCard
              icon={<FileText className="w-12 h-12 text-orange-400" />}
              title="Detailed Reports"
              description="Get actionable PDF reports with prioritized recommendations and remediation guidance."
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-20 bg-gradient-to-br from-blue-900/30 to-purple-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatCard number="47" label="Security Analyzers" />
            <StatCard number="10K+" label="Websites Scanned" />
            <StatCard number="100%" label="Free & Open Source" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your AI?
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Start your free security scan now. No credit card required.
          </p>
          <div className="max-w-2xl mx-auto">
            <ScanForm />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-white font-semibold">AI Security Scanner</span>
            </div>
            <div className="flex gap-6 text-slate-400 text-sm">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 AI Security Scanner. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

// Server Component - Feature Card
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}

// Server Component - Stat Card
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
      <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
        {number}
      </div>
      <div className="text-slate-300 text-lg">{label}</div>
    </div>
  )
}

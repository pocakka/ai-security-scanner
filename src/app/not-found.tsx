import { Shield, Home, FileText, Search, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ScanForm } from '@/components/ScanForm'
import type { Metadata } from 'next'

// Page-specific SEO metadata
export const metadata: Metadata = {
  title: '404 - Page Not Found | AI Security Scanner',
  description: 'The page you are looking for could not be found. Try a new security scan or browse our existing reports.',
  robots: 'noindex,follow',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-20">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white">AI Security Scanner</span>
          </Link>
          <div className="flex gap-4">
            <Link
              href="/"
              className="text-sm text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/all-scans"
              className="text-sm text-blue-300 hover:text-blue-200 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              View All Scans
            </Link>
          </div>
        </div>

        {/* 404 Content */}
        <div className="text-center mb-16">
          {/* Error Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full"></div>
              <AlertCircle className="relative w-24 h-24 text-blue-400" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-8xl font-bold mb-4 text-white">404</h1>
          <h2 className="text-3xl font-semibold mb-4 text-blue-200">Page Not Found</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12">
            Oops! The page you're looking for doesn't exist or has been moved.
            Don't worry, you can still run a security scan or browse our existing reports.
          </p>

          {/* Helpful Actions */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-6">
              What would you like to do?
            </h3>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link
                href="/"
                className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all"
              >
                <Home className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-white font-medium">Go Home</div>
                <div className="text-gray-400 text-sm">Back to main page</div>
              </Link>

              <Link
                href="/all-scans"
                className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all"
              >
                <FileText className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-white font-medium">Browse Scans</div>
                <div className="text-gray-400 text-sm">View recent reports</div>
              </Link>

              <a
                href="#scan-form"
                className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-all"
              >
                <Search className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-white font-medium">New Scan</div>
                <div className="text-gray-400 text-sm">Start fresh analysis</div>
              </a>
            </div>

            {/* Scan Form */}
            <div id="scan-form" className="border-t border-white/10 pt-8">
              <h4 className="text-lg font-medium text-white mb-4">
                Or start a new security scan right now:
              </h4>
              <ScanForm />
            </div>
          </div>

          {/* Popular Scans */}
          <div className="mt-16">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Popular Recent Scans</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {['google.com', 'github.com', 'openai.com', 'anthropic.com'].map((domain) => (
                <Link
                  key={domain}
                  href={`/all-scans?search=${domain}`}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 hover:text-white transition-all"
                >
                  {domain}
                </Link>
              ))}
            </div>
          </div>

          {/* Error Details (if available) */}
          {typeof window !== 'undefined' && window.location.pathname && (
            <div className="mt-12 text-sm text-gray-500">
              Requested path: <code className="text-gray-400">{window.location.pathname}</code>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
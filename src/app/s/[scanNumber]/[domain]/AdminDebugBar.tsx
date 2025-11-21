'use client'

import { useEffect, useState } from 'react'
import { Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface PerformanceData {
  timings: {
    crawl: number
    aiDetection: number
    securityHeaders: number
    clientRisks: number
    sslTLS: number
    cookieSecurity: number
    jsLibraries: number
    techStack: number
    totalAnalyzers: number
    riskScore: number
    reportGeneration: number
    total: number
  }
  timestamp: string
  crawlerBreakdown?: Record<string, number> // NEW: detailed crawler timing
  analyzerBreakdown: Record<string, number>
}

interface AdminDebugBarProps {
  metadata: any // Already parsed by API
}

export default function AdminDebugBar({ metadata }: AdminDebugBarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [perfData, setPerfData] = useState<PerformanceData | null>(null)

  useEffect(() => {
    // Check if user is logged in as admin
    const authToken = localStorage.getItem('admin_auth')
    setIsLoggedIn(authToken === 'authenticated')

    // Set performance data directly (already parsed by API)
    if (metadata && typeof metadata === 'object') {
      setPerfData(metadata)
    }
  }, [metadata])

  // Only show to logged-in admins
  if (!isLoggedIn || !perfData) {
    return null
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getTimeColor = (ms: number) => {
    if (ms < 100) return 'text-green-400'
    if (ms < 500) return 'text-yellow-400'
    if (ms < 1000) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-md border-b border-purple-500/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-300" />
              <span className="text-white font-semibold">Admin Performance Monitor</span>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-purple-200">Total:</span>
                <span className={`font-mono font-bold ${getTimeColor(perfData.timings.total)}`}>
                  {formatTime(perfData.timings.total)}
                </span>
              </div>
              <div className="w-px h-4 bg-purple-400/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-purple-200">Crawl:</span>
                <span className={`font-mono font-bold ${getTimeColor(perfData.timings.crawl)}`}>
                  {formatTime(perfData.timings.crawl)}
                </span>
              </div>
              <div className="w-px h-4 bg-purple-400/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-purple-200">Analysis:</span>
                <span className={`font-mono font-bold ${getTimeColor(perfData.timings.totalAnalyzers)}`}>
                  {formatTime(perfData.timings.totalAnalyzers)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg transition-colors"
          >
            <span className="text-sm">Details</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-purple-500/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Crawl Phase with Breakdown */}
              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="text-purple-200 text-xs font-medium mb-2">Website Crawl</div>
                <div className={`text-2xl font-mono font-bold ${getTimeColor(perfData.timings.crawl)}`}>
                  {formatTime(perfData.timings.crawl)}
                </div>
                {perfData.crawlerBreakdown && (
                  <div className="mt-2 pt-2 border-t border-purple-400/20 space-y-0.5">
                    {perfData.crawlerBreakdown.browserInit !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-300">Browser:</span>
                        <span className={`font-mono ${getTimeColor(perfData.crawlerBreakdown.browserInit)}`}>
                          {formatTime(perfData.crawlerBreakdown.browserInit)}
                        </span>
                      </div>
                    )}
                    {perfData.crawlerBreakdown.navigation !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-300">Navigate:</span>
                        <span className={`font-mono ${getTimeColor(perfData.crawlerBreakdown.navigation)}`}>
                          {formatTime(perfData.crawlerBreakdown.navigation)}
                        </span>
                      </div>
                    )}
                    {perfData.crawlerBreakdown.pageLoad !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-300">Page Load:</span>
                        <span className={`font-mono ${getTimeColor(perfData.crawlerBreakdown.pageLoad)}`}>
                          {formatTime(perfData.crawlerBreakdown.pageLoad)}
                        </span>
                      </div>
                    )}
                    {perfData.crawlerBreakdown.dataCollection !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-300">Data Collect:</span>
                        <span className={`font-mono ${getTimeColor(perfData.crawlerBreakdown.dataCollection)}`}>
                          {formatTime(perfData.crawlerBreakdown.dataCollection)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Analyzers */}
              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="text-purple-200 text-xs font-medium mb-1">Analyzers</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">AI Detection:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.aiDetection)}`}>
                      {formatTime(perfData.timings.aiDetection)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Headers:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.securityHeaders)}`}>
                      {formatTime(perfData.timings.securityHeaders)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Tech Stack:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.techStack)}`}>
                      {formatTime(perfData.timings.techStack)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Cookies:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.cookieSecurity)}`}>
                      {formatTime(perfData.timings.cookieSecurity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* More Analyzers */}
              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="text-purple-200 text-xs font-medium mb-1">More Analysis</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Client Risks:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.clientRisks)}`}>
                      {formatTime(perfData.timings.clientRisks)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">SSL/TLS:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.sslTLS)}`}>
                      {formatTime(perfData.timings.sslTLS)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">JS Libraries:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.jsLibraries)}`}>
                      {formatTime(perfData.timings.jsLibraries)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Generation */}
              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="text-purple-200 text-xs font-medium mb-2">Report Generation</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Risk Score:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.riskScore)}`}>
                      {formatTime(perfData.timings.riskScore)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-300">Report Gen:</span>
                    <span className={`font-mono ${getTimeColor(perfData.timings.reportGeneration)}`}>
                      {formatTime(perfData.timings.reportGeneration)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-purple-400/20">
                    <span className="text-purple-200 font-semibold">Total:</span>
                    <span className={`font-mono font-bold ${getTimeColor(perfData.timings.total)}`}>
                      {formatTime(perfData.timings.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="mt-3 text-center text-xs text-purple-300">
              Scan completed: {new Date(perfData.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

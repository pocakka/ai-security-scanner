'use client'

import { useEffect, useState } from 'react'

interface WorkerInfo {
  slot: number
  pid: number
  startTime: number
  runtime: number
  status: 'active' | 'stale'
  currentUrl?: string
  currentScanId?: string
}

interface WorkerStatus {
  maxWorkers: number
  activeWorkers: number
  staleWorkers: number
  availableSlots: number
  workers: WorkerInfo[]
  queue: {
    pending: number
    processing: number
    completedLastHour: number
    failedLastHour: number
  }
  timestamp: number
}

export default function WorkerStatusPanel() {
  const [status, setStatus] = useState<WorkerStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/workers/status')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError('Failed to load worker status')
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const formatRuntime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return minutes + 'm ' + (seconds % 60) + 's'
    }
    return seconds + 's'
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
        <div className="text-slate-400">Loading worker status...</div>
      </div>
    )
  }

  const utilizationPercent = Math.round((status.activeWorkers / status.maxWorkers) * 100)

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Worker Pool Status</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400">
            {status.activeWorkers}/{status.maxWorkers} active
          </div>
          <div className={'w-3 h-3 rounded-full ' + (status.activeWorkers > 0 ? 'bg-green-400' : 'bg-gray-400')}></div>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Pool Utilization</span>
          <span>{utilizationPercent}%</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={'h-full transition-all duration-500 ' + (utilizationPercent >= 80 ? 'bg-red-500' : utilizationPercent >= 50 ? 'bg-yellow-500' : 'bg-green-500')}
            style={{ width: utilizationPercent + '%' }}
          ></div>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="text-orange-400 text-xs font-medium mb-1">Pending</div>
          <div className="text-2xl font-bold text-white">{status.queue.pending}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="text-blue-400 text-xs font-medium mb-1">Processing</div>
          <div className="text-2xl font-bold text-white">{status.queue.processing}</div>
        </div>
      </div>

      {/* Active Workers */}
      {status.workers.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Active Workers</div>
          <div className="space-y-2">
            {status.workers.map((worker) => (
              <div key={worker.slot} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Worker #{worker.slot}</span>
                    <span className={'text-xs px-2 py-0.5 rounded-full ' + (worker.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                      {worker.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{formatRuntime(worker.runtime)}</span>
                </div>
                {worker.currentUrl ? (
                  <a
                    href={'/scan/' + worker.currentScanId}
                    className="text-sm text-blue-400 hover:text-blue-300 truncate block"
                    title={worker.currentUrl}
                  >
                    {worker.currentUrl}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500 italic">idle</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {status.workers.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-4">
          No active workers
        </div>
      )}
    </div>
  )
}

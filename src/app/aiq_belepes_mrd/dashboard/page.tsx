'use client'

import { useEffect, useState } from 'react'

interface WorkerInfo {
  slot: number
  pid: number
  startTime: number
  runtime: number
  status: 'active' | 'stale'
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
  scans: {
    pending: number
    scanning: number
    completedLastHour: number
    failedLastHour: number
  }
  timestamp: number
}

export default function WorkerDashboard() {
  const [status, setStatus] = useState<WorkerStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null)
  const [isTriggering, setIsTriggering] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/workers/status')
      if (!response.ok) {
        throw new Error('Failed to fetch worker status')
      }
      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const triggerWorkers = async () => {
    setIsTriggering(true)
    setTriggerMessage(null)
    try {
      const response = await fetch('/api/workers/trigger', {
        method: 'POST',
      })
      const data = await response.json()
      setTriggerMessage(data.message || data.error)
      fetchStatus()
    } catch (err) {
      setTriggerMessage(err instanceof Error ? err.message : 'Failed to trigger workers')
    } finally {
      setIsTriggering(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  const formatRuntime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      const m = minutes - (hours * 60)
      const s = seconds - (minutes * 60)
      return hours + 'h ' + m + 'm ' + s + 's'
    } else if (minutes > 0) {
      const s = seconds - (minutes * 60)
      return minutes + 'm ' + s + 's'
    } else {
      return seconds + 's'
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/20 backdrop-blur-lg border border-red-500/30 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const utilizationPercent = Math.round((status.activeWorkers / status.maxWorkers) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Worker Pool Dashboard</h1>
          <p className="text-slate-400">Real-time monitoring and control</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Worker Pool Utilization</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-400 text-sm font-medium mb-1">Active Workers</div>
              <div className="text-3xl font-bold text-white">{status.activeWorkers}</div>
              <div className="text-slate-400 text-xs">/ {status.maxWorkers} max</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
              <div className="text-green-400 text-sm font-medium mb-1">Available Slots</div>
              <div className="text-3xl font-bold text-white">{status.availableSlots}</div>
              <div className="text-slate-400 text-xs">{utilizationPercent}% utilized</div>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4">
              <div className="text-yellow-400 text-sm font-medium mb-1">Stale Workers</div>
              <div className="text-3xl font-bold text-white">{status.staleWorkers}</div>
              <div className="text-slate-400 text-xs">Need cleanup</div>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4">
              <div className="text-purple-400 text-sm font-medium mb-1">Pool Capacity</div>
              <div className="text-3xl font-bold text-white">{status.maxWorkers}</div>
              <div className="text-slate-400 text-xs">MAX_WORKERS</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Pool Utilization</span>
              <span>{utilizationPercent}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
              <div
                className={'h-full transition-all duration-500 ' + (utilizationPercent >= 90 ? 'bg-red-500' : utilizationPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500')}
                style={{ width: utilizationPercent + '%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Active Workers</h2>
          {status.workers.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No active workers</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 font-medium pb-3 px-4">Slot</th>
                    <th className="text-left text-slate-400 font-medium pb-3 px-4">PID</th>
                    <th className="text-left text-slate-400 font-medium pb-3 px-4">Status</th>
                    <th className="text-left text-slate-400 font-medium pb-3 px-4">Runtime</th>
                    <th className="text-left text-slate-400 font-medium pb-3 px-4">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {status.workers.map((worker) => (
                    <tr key={worker.slot} className="border-b border-white/5">
                      <td className="py-3 px-4">
                        <span className="text-white font-mono">Worker #{worker.slot}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-mono">{worker.pid}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (worker.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30')}>
                          {worker.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300">{formatRuntime(worker.runtime)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 text-sm">
                          {new Date(worker.startTime).toLocaleTimeString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Job Queue Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4">
              <div className="text-orange-400 text-sm font-medium mb-1">Pending Jobs</div>
              <div className="text-3xl font-bold text-white">{status.queue.pending}</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-400 text-sm font-medium mb-1">Processing</div>
              <div className="text-3xl font-bold text-white">{status.queue.processing}</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
              <div className="text-green-400 text-sm font-medium mb-1">Completed (1h)</div>
              <div className="text-3xl font-bold text-white">{status.queue.completedLastHour}</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
              <div className="text-red-400 text-sm font-medium mb-1">Failed (1h)</div>
              <div className="text-3xl font-bold text-white">{status.queue.failedLastHour}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Scan Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4">
              <div className="text-orange-400 text-sm font-medium mb-1">Pending Scans</div>
              <div className="text-3xl font-bold text-white">{status.scans.pending}</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
              <div className="text-blue-400 text-sm font-medium mb-1">Scanning</div>
              <div className="text-3xl font-bold text-white">{status.scans.scanning}</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
              <div className="text-green-400 text-sm font-medium mb-1">Completed (1h)</div>
              <div className="text-3xl font-bold text-white">{status.scans.completedLastHour}</div>
            </div>
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
              <div className="text-red-400 text-sm font-medium mb-1">Failed (1h)</div>
              <div className="text-3xl font-bold text-white">{status.scans.failedLastHour}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Manual Worker Control</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <button
              onClick={triggerWorkers}
              disabled={isTriggering || status.queue.pending === 0}
              className={(isTriggering || status.queue.pending === 0 ? 'bg-slate-600/50 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600') + ' px-6 py-3 rounded-xl font-medium transition-all'}
            >
              {isTriggering ? 'Triggering...' : 'Trigger Pending Jobs'}
            </button>
            <div className="text-slate-400 text-sm">
              {status.queue.pending === 0 ? (
                <span className="text-green-400">No pending jobs to process</span>
              ) : (
                <span>
                  Click to spawn a worker for {status.queue.pending} pending job{status.queue.pending > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {triggerMessage && (
            <div className="mt-4 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm">{triggerMessage}</p>
            </div>
          )}
        </div>

        <div className="text-center text-slate-400 text-sm">
          Last updated: {new Date(status.timestamp).toLocaleTimeString()} (auto-refresh every 2s)
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminTabsWithDelete from './AdminTabsWithDelete'
import WorkerStatusPanel from './WorkerStatusPanel'

interface Scan {
  id: string
  url: string
  domain: string | null
  status: string
  riskScore: number | null
  riskLevel: string | null
  createdAt: Date
}

interface Lead {
  id: string
  email: string
  name: string | null
  company: string | null
  lifecycleStage: string
  createdAt: Date
  scan: {
    id: string
    domain: string | null
    url: string
    riskScore: number | null
    riskLevel: string | null
  }
}

export default function ProtectedAdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [scans, setScans] = useState<Scan[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('admin_auth')
    if (authToken !== 'authenticated') {
      router.push('/aiq_belepes_mrd')
      return
    }

    setIsAuthenticated(true)
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/data')
      if (!response.ok) throw new Error('Failed to load data')
      const data = await response.json()

      setScans(data.scans)
      setLeads(data.leads)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    router.push('/')
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Calculate statistics
  const totalScans = scans.length
  const completedScans = scans.filter(s => s.status === 'COMPLETED').length
  const totalLeads = leads.length
  const avgRiskScore = scans
    .filter(s => s.riskScore !== null)
    .reduce((sum, s) => sum + (s.riskScore || 0), 0) / (completedScans || 1)

  const criticalScans = scans.filter(s => s.riskLevel === 'CRITICAL').length
  const highScans = scans.filter(s => s.riskLevel === 'HIGH').length

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Monitor scans, manage leads, and track metrics</p>
          </div>
          <div className="flex gap-4">
            <a
              href="/aiq_belepes_mrd/dashboard/settings"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              ⚙️ Settings
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
            >
              ← Back to Home
            </a>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2">Total Scans</div>
            <div className="text-4xl font-bold text-white mb-1">{totalScans}</div>
            <div className="text-sm text-green-400">{completedScans} completed</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2">Total Leads</div>
            <div className="text-4xl font-bold text-white mb-1">{totalLeads}</div>
            <div className="text-sm text-blue-400">{((totalLeads / totalScans) * 100 || 0).toFixed(1)}% conversion</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2">Avg Risk Score</div>
            <div className="text-4xl font-bold text-white mb-1">{avgRiskScore.toFixed(0)}/100</div>
            <div className="text-sm text-yellow-400">Across all scans</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium mb-2">High Risk Sites</div>
            <div className="text-4xl font-bold text-white mb-1">{criticalScans + highScans}</div>
            <div className="text-sm text-red-400">{criticalScans} critical</div>
          </div>
        </div>

        {/* Worker Status Panel */}
        <div className="mb-8">
          <WorkerStatusPanel />
        </div>

        {/* Tabs Component */}
        <AdminTabsWithDelete scans={scans} leads={leads} onDataChange={loadData} />
      </div>
    </main>
  )
}

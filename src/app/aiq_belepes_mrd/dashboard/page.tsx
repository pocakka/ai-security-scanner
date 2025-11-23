'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminTabsWithDelete from './AdminTabsWithDelete'
import WorkerStatusPanel from './WorkerStatusPanel'

interface Scan {
  id: string
  scanNumber?: number
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
    scanNumber?: number
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(200)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [totalPages, setTotalPages] = useState(1)
  const [totalScansCount, setTotalScansCount] = useState(0)
  const [totalLeadsCount, setTotalLeadsCount] = useState(0)

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('admin_auth')
    if (authToken !== 'authenticated') {
      router.push('/aiq_belepes_mrd')
      return
    }

    setIsAuthenticated(true)
    loadData(currentPage, itemsPerPage, statusFilter)
  }, [router, currentPage, itemsPerPage, statusFilter])

  const loadData = async (page: number = 1, limit: number = 200, status: string = 'ALL') => {
    try {
      setLoading(true)
      const statusParam = status !== 'ALL' ? `&status=${status}` : ''
      const response = await fetch(`/api/admin/data?page=${page}&limit=${limit}${statusParam}`)
      if (!response.ok) throw new Error('Failed to load data')
      const data = await response.json()

      setScans(data.scans)
      setLeads(data.leads)

      if (data.pagination) {
        setTotalPages(data.pagination.totalPages)
        setTotalScansCount(data.pagination.totalScans)
        setTotalLeadsCount(data.pagination.totalLeads)
      }
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

  // Calculate statistics (use total counts instead of current page)
  const totalScans = totalScansCount || scans.length
  const completedScans = scans.filter(s => s.status === 'COMPLETED').length
  const totalLeads = totalLeadsCount || leads.length
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

        {/* Status Filter Tabs */}
        <div className="mb-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter('ALL')
                setCurrentPage(1)
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All Scans
            </button>
            <button
              onClick={() => {
                setStatusFilter('COMPLETED')
                setCurrentPage(1)
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              ✓ Completed
            </button>
            <button
              onClick={() => {
                setStatusFilter('FAILED')
                setCurrentPage(1)
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'FAILED'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              ✗ Failed
            </button>
            <button
              onClick={() => {
                setStatusFilter('SCANNING')
                setCurrentPage(1)
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'SCANNING'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              ⟳ Scanning
            </button>
            <button
              onClick={() => {
                setStatusFilter('PENDING')
                setCurrentPage(1)
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              ⏸ Pending
            </button>
          </div>
        </div>

        {/* Tabs Component */}
        <AdminTabsWithDelete scans={scans} leads={leads} onDataChange={() => loadData(currentPage, itemsPerPage, statusFilter)} />

        {/* Pagination */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
          <div className="text-white text-sm">
            Showing page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
            {' '}(Total: <span className="font-bold">{totalScansCount}</span> scans, <span className="font-bold">{totalLeadsCount}</span> leads)
          </div>

          <div className="flex items-center gap-2">
            {/* Items per page selector */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-lg"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="200">200 per page</option>
            </select>

            {/* Page navigation */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              ⏮️ First
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              ⬅️ Prev
            </button>

            {/* Page number input */}
            <div className="flex items-center gap-2">
              <span className="text-white">Page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Math.min(Math.max(1, Number(e.target.value)), totalPages)
                  setCurrentPage(page)
                }}
                className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center backdrop-blur-lg"
              />
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Next ➡️
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Last ⏭️
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

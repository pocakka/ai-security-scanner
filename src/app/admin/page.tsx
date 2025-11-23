import { prisma } from '@/lib/db'
import AdminTabs from './AdminTabs'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Fetch scans
  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Fetch leads with scan data
  const leads = await prisma.lead.findMany({
    include: {
      scan: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

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
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            ← Back to Home
          </a>
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

        {/* Tabs Component */}
        <AdminTabs scans={scans} leads={leads} />
      </div>
    </main>
  )
}

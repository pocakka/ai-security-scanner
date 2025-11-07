import { prisma } from '@/lib/db'

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

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
          <div className="border-b border-white/10">
            <div className="flex">
              <button className="px-6 py-4 text-white font-semibold border-b-2 border-blue-500 bg-white/5">
                Scans ({totalScans})
              </button>
              <button className="px-6 py-4 text-slate-400 font-semibold hover:text-white transition-colors">
                Leads ({totalLeads})
              </button>
            </div>
          </div>

          {/* Scans Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No scans yet. Create one from the home page!
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">
                        <div className="font-medium">{scan.domain || 'N/A'}</div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">{scan.url}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          scan.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                          scan.status === 'FAILED' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
                          scan.status === 'SCANNING' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                          'bg-slate-500/20 text-slate-300 border border-slate-400/30'
                        }`}>
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {scan.riskScore !== null ? (
                          <span className="text-white font-semibold">{scan.riskScore}/100</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {scan.riskLevel ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            scan.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                            scan.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                            scan.riskLevel === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {scan.riskLevel}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={`/scan/${scan.id}`}
                          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leads Section */}
        {leads.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Leads</h2>
            <div className="space-y-3">
              {leads.slice(0, 10).map((lead) => (
                <div key={lead.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{lead.name}</div>
                      <div className="text-sm text-slate-400">{lead.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">
                        {lead.scan?.domain || 'Unknown site'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

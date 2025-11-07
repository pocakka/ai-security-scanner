'use client'

import { useState } from 'react'

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

interface AdminTabsProps {
  scans: Scan[]
  leads: Lead[]
}

export default function AdminTabs({ scans, leads }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<'scans' | 'leads'>('scans')

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
      {/* Tab Headers */}
      <div className="border-b border-white/10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('scans')}
            className={`px-6 py-4 font-semibold transition-colors ${
              activeTab === 'scans'
                ? 'text-white border-b-2 border-blue-500 bg-white/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scans ({scans.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-6 py-4 font-semibold transition-colors ${
              activeTab === 'leads'
                ? 'text-white border-b-2 border-blue-500 bg-white/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Leads ({leads.length})
          </button>
        </div>
      </div>

      {/* Scans Table */}
      {activeTab === 'scans' && (
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
      )}

      {/* Leads Table */}
      {activeTab === 'leads' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Scanned Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Stage
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
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No leads yet. Leads are captured when users download scan reports.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {lead.name || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {lead.company || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-white">{lead.scan.domain || 'N/A'}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">
                        {lead.scan.url}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {lead.scan.riskScore !== null ? (
                        <span className={`font-semibold ${
                          lead.scan.riskScore >= 70 ? 'text-green-400' :
                          lead.scan.riskScore >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {lead.scan.riskScore}/100
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        lead.lifecycleStage === 'CUSTOMER' ? 'bg-green-500/20 text-green-300' :
                        lead.lifecycleStage === 'SQL' ? 'bg-blue-500/20 text-blue-300' :
                        lead.lifecycleStage === 'MQL' ? 'bg-purple-500/20 text-purple-300' :
                        lead.lifecycleStage === 'LEAD' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {lead.lifecycleStage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={`/scan/${lead.scan.id}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        View Scan →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'

// Format date with time consistently for server and client
function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// Helper function to convert domain to slug: reddit.com -> reddit-com
function domainToSlug(domain: string): string {
  return domain.replace(/\./g, '-')
}

// Helper function to generate SEO-friendly URL
function getSeoUrl(scan: { domain: string | null; scanNumber?: number; id: string }): string {
  if (scan.domain && scan.scanNumber) {
    const domainSlug = domainToSlug(scan.domain)
    return `/s/${domainSlug}/${scan.scanNumber}`
  }
  // Fallback to UUID URL if scanNumber not available
  return `/scan/${scan.id}`
}

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

interface AdminTabsWithDeleteProps {
  scans: Scan[]
  leads: Lead[]
  onDataChange: () => void
}

export default function AdminTabsWithDelete({ scans, leads, onDataChange }: AdminTabsWithDeleteProps) {
  const [activeTab, setActiveTab] = useState<'scans' | 'leads'>('scans')
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set())
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState<Set<string>>(new Set())

  // Toggle individual scan selection
  const toggleScanSelection = (scanId: string) => {
    const newSelected = new Set(selectedScans)
    if (newSelected.has(scanId)) {
      newSelected.delete(scanId)
    } else {
      newSelected.add(scanId)
    }
    setSelectedScans(newSelected)
  }

  // Toggle all scans
  const toggleAllScans = () => {
    if (selectedScans.size === scans.length) {
      setSelectedScans(new Set())
    } else {
      setSelectedScans(new Set(scans.map(s => s.id)))
    }
  }

  // Toggle individual lead selection
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  // Toggle all leads
  const toggleAllLeads = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)))
    }
  }

  // Delete single scan
  const deleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to delete this scan?')) return

    try {
      setDeleting(true)
      const response = await fetch('/api/admin/delete-scan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanIds: [scanId] }),
      })

      if (!response.ok) throw new Error('Failed to delete scan')

      onDataChange()
    } catch (error) {
      console.error('Error deleting scan:', error)
      alert('Failed to delete scan')
    } finally {
      setDeleting(false)
    }
  }

  // Delete selected scans
  const deleteSelectedScans = async () => {
    if (selectedScans.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedScans.size} scan(s)?`)) return

    try {
      setDeleting(true)
      const response = await fetch('/api/admin/delete-scan', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanIds: Array.from(selectedScans) }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Delete failed:', data)
        throw new Error(data.error || 'Failed to delete scans')
      }

      console.log('Successfully deleted:', data)
      setSelectedScans(new Set())
      await onDataChange()
    } catch (error) {
      console.error('Error deleting scans:', error)
      alert(`Failed to delete scans: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
    }
  }

  // Delete single lead
  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      setDeleting(true)
      const response = await fetch('/api/admin/delete-lead', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [leadId] }),
      })

      if (!response.ok) throw new Error('Failed to delete lead')

      onDataChange()
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  // Retry FAILED scan
  const retryScan = async (scanId: string, scanUrl: string) => {
    try {
      const newRetrying = new Set(retrying)
      newRetrying.add(scanId)
      setRetrying(newRetrying)

      // Create new scan with same URL
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrl }),
      })

      if (!response.ok) throw new Error('Failed to retry scan')

      const data = await response.json()
      alert(`Scan queued successfully! New scan ID: ${data.scanId}`)

      onDataChange()
    } catch (error) {
      console.error('Error retrying scan:', error)
      alert('Failed to retry scan')
    } finally {
      const newRetrying = new Set(retrying)
      newRetrying.delete(scanId)
      setRetrying(newRetrying)
    }
  }

  // Delete selected leads
  const deleteSelectedLeads = async () => {
    if (selectedLeads.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedLeads.size} lead(s)?`)) return

    try {
      setDeleting(true)
      const response = await fetch('/api/admin/delete-lead', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: Array.from(selectedLeads) }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Delete failed:', data)
        throw new Error(data.error || 'Failed to delete leads')
      }

      console.log('Successfully deleted:', data)
      setSelectedLeads(new Set())
      await onDataChange()
    } catch (error) {
      console.error('Error deleting leads:', error)
      alert(`Failed to delete leads: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
      {/* Tab Headers */}
      <div className="border-b border-white/10">
        <div className="flex items-center justify-between">
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

          {/* Bulk Delete Buttons */}
          {activeTab === 'scans' && selectedScans.size > 0 && (
            <div className="px-6 py-3">
              <button
                onClick={deleteSelectedScans}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedScans.size} Selected
              </button>
            </div>
          )}

          {activeTab === 'leads' && selectedLeads.size > 0 && (
            <div className="px-6 py-3">
              <button
                onClick={deleteSelectedLeads}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedLeads.size} Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scans Table */}
      {activeTab === 'scans' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedScans.size === scans.length && scans.length > 0}
                    onChange={toggleAllScans}
                    className="w-4 h-4 rounded border-slate-400 text-blue-500 focus:ring-blue-500"
                  />
                </th>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No scans yet. Create one from the home page!
                  </td>
                </tr>
              ) : (
                scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedScans.has(scan.id)}
                        onChange={() => toggleScanSelection(scan.id)}
                        className="w-4 h-4 rounded border-slate-400 text-blue-500 focus:ring-blue-500"
                      />
                    </td>
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
                      {formatDate(scan.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <a
                          href={getSeoUrl(scan)}
                          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                          View
                        </a>
                        {scan.status === 'FAILED' && (
                          <button
                            onClick={() => retryScan(scan.id, scan.url)}
                            disabled={retrying.has(scan.id)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Retry scan"
                          >
                            <RefreshCw className={`w-4 h-4 ${retrying.has(scan.id) ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteScan(scan.id)}
                          disabled={deleting}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete scan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === leads.length && leads.length > 0}
                    onChange={toggleAllLeads}
                    className="w-4 h-4 rounded border-slate-400 text-blue-500 focus:ring-blue-500"
                  />
                </th>
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
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No leads yet. Leads are captured when users download scan reports.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="w-4 h-4 rounded border-slate-400 text-blue-500 focus:ring-blue-500"
                      />
                    </td>
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
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <a
                          href={getSeoUrl(lead.scan)}
                          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                          View Scan
                        </a>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deleting}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

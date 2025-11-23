'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, ArrowLeft, Twitter, Facebook, Linkedin, Instagram, Youtube, Github, Mail, Building, Globe, Image, CheckCircle } from 'lucide-react'

interface SiteSettings {
  // Social Media
  twitterHandle?: string
  facebookUrl?: string
  linkedinUrl?: string
  instagramHandle?: string
  youtubeUrl?: string
  githubUrl?: string

  // SEO & Branding
  siteName: string
  siteDescription?: string
  siteUrl?: string
  ogImageUrl?: string
  faviconUrl?: string

  // Contact & Business
  supportEmail?: string
  salesEmail?: string
  companyName?: string
  companyAddress?: string

  // Feature Flags
  enableTwitterCards: boolean
  enableOgTags: boolean
  enableAnalytics: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('admin_auth')
    if (authToken !== 'authenticated') {
      router.push('/aiq_belepes_mrd')
      return
    }

    setIsAuthenticated(true)
    loadSettings()
  }, [router])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to load settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof SiteSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load settings</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Site Settings</h1>
            <p className="text-slate-400">Configure social media, SEO, and business information</p>
          </div>
          <button
            onClick={() => router.push('/aiq_belepes_mrd/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Social Media Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Social Media Handles</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Twitter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Twitter className="w-4 h-4 text-blue-400" />
                  Twitter Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    value={settings.twitterHandle || ''}
                    onChange={(e) => updateField('twitterHandle', e.target.value)}
                    placeholder="yourusername"
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Instagram className="w-4 h-4 text-pink-400" />
                  Instagram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    value={settings.instagramHandle || ''}
                    onChange={(e) => updateField('instagramHandle', e.target.value)}
                    placeholder="yourusername"
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Facebook */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Facebook className="w-4 h-4 text-blue-500" />
                  Facebook Page URL
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl || ''}
                  onChange={(e) => updateField('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn Company URL
                </label>
                <input
                  type="url"
                  value={settings.linkedinUrl || ''}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={settings.youtubeUrl || ''}
                  onChange={(e) => updateField('youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Github className="w-4 h-4 text-slate-300" />
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={settings.githubUrl || ''}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  placeholder="https://github.com/yourorg/repo"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SEO & Branding Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">SEO & Branding</h2>
            </div>

            <div className="space-y-4">
              {/* Site Name */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  placeholder="AI Security Scanner"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Site Description */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">
                  Default Meta Description
                </label>
                <textarea
                  value={settings.siteDescription || ''}
                  onChange={(e) => updateField('siteDescription', e.target.value)}
                  placeholder="Free AI security scanner for websites..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Site URL */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">
                  Production Site URL
                </label>
                <input
                  type="url"
                  value={settings.siteUrl || ''}
                  onChange={(e) => updateField('siteUrl', e.target.value)}
                  placeholder="https://aisecurityscanner.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* OG Image URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Image className="w-4 h-4" />
                  Default Open Graph Image URL
                </label>
                <input
                  type="url"
                  value={settings.ogImageUrl || ''}
                  onChange={(e) => updateField('ogImageUrl', e.target.value)}
                  placeholder="https://aisecurityscanner.com/og-image.png"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Recommended size: 1200×630px</p>
              </div>
            </div>
          </div>

          {/* Contact & Business Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Contact & Business</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Support Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Mail className="w-4 h-4" />
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={(e) => updateField('supportEmail', e.target.value)}
                  placeholder="support@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sales Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Mail className="w-4 h-4" />
                  Sales Email
                </label>
                <input
                  type="email"
                  value={settings.salesEmail || ''}
                  onChange={(e) => updateField('salesEmail', e.target.value)}
                  placeholder="sales@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName || ''}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Your Company Inc."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company Address */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">
                  Company Address
                </label>
                <input
                  type="text"
                  value={settings.companyAddress || ''}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  placeholder="123 Main St, City, Country"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Feature Flags Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Feature Toggles</h2>

            <div className="space-y-4">
              {/* Enable Twitter Cards */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableTwitterCards}
                  onChange={(e) => updateField('enableTwitterCards', e.target.checked)}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white font-semibold">Enable Twitter Card Meta Tags</p>
                  <p className="text-sm text-slate-400">Add Twitter-specific meta tags (requires Twitter handle)</p>
                </div>
              </label>

              {/* Enable OG Tags */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableOgTags}
                  onChange={(e) => updateField('enableOgTags', e.target.checked)}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white font-semibold">Enable Open Graph Meta Tags</p>
                  <p className="text-sm text-slate-400">For Facebook, LinkedIn social sharing</p>
                </div>
              </label>

              {/* Enable Analytics */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAnalytics}
                  onChange={(e) => updateField('enableAnalytics', e.target.checked)}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="text-white font-semibold">Enable Analytics</p>
                  <p className="text-sm text-slate-400">Google Analytics integration (coming soon)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            {saved && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Settings saved successfully!</span>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors shadow-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

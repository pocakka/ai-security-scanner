import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ===== ENHANCED INTERFACES =====

interface ScanData {
  id: string
  url: string
  domain: string
  riskScore: number
  riskLevel: string
  findings: {
    summary: {
      hasAI: boolean
      riskScore: {
        score: number
        level: string
        grade: string
      }
      criticalIssues: number
      highIssues: number
      mediumIssues: number
      lowIssues: number
    }
    detectedTech: {
      aiProviders: string[]
      chatWidgets: string[]
    }
    techStack?: {
      detected: Technology[]
      categories: Record<string, Technology[]>
      totalCount: number
    }
    findings: Array<Finding>
    compliance?: ComplianceResult
    llm01PromptInjection?: { overallRisk: string; findings: any[] }
    llm02InsecureOutput?: { overallRisk: string; findings: any[] }
    llm05SupplyChain?: { overallRisk: string; findings: any[] }
    llm06SensitiveInfo?: { overallRisk: string; findings: any[] }
    llm07PluginDesign?: { overallRisk: string; findings: any[] }
    llm08ExcessiveAgency?: { overallRisk: string; findings: any[] }
  }
  aiTrustScorecard?: AiTrustScorecard
  metadata?: ScanMetadata
  createdAt: string
  completedAt: string
}

interface Finding {
  id: string
  category: string
  severity: string
  title: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
}

interface Technology {
  name: string
  category: string
  confidence: string
  description?: string
  website?: string
  version?: string
  evidence?: string
}

interface AiTrustScorecard {
  score: number
  weightedScore: number
  categoryScores: Record<string, number>
  passedChecks: number
  totalChecks: number
  detectedAiProvider?: string
  detectedModel?: string
  detectedChatFramework?: string
  hasAiImplementation: boolean
  aiConfidenceLevel?: string
  summary?: string
}

interface ComplianceResult {
  gdprScore: number
  ccpaScore: number
  pciDssIndicators: string[]
  hipaaIndicators: string[]
  overallCompliance: string
  findings: any[]
}

interface ScanMetadata {
  scanDuration?: number
  analyzersRun?: number
  crawlerUsed?: string
}

// ===== COLOR CONSTANTS =====

const COLORS = {
  // Brand colors
  primary: { r: 30, g: 64, b: 175 },      // Blue-800
  secondary: { r: 6, g: 182, b: 212 },    // Cyan-500

  // Severity colors
  critical: { r: 220, g: 38, b: 38 },     // Red-600
  high: { r: 234, g: 88, b: 12 },         // Orange-600
  medium: { r: 202, g: 138, b: 4 },       // Yellow-600
  low: { r: 37, g: 99, b: 235 },          // Blue-600
  info: { r: 100, g: 116, b: 139 },       // Slate-500

  // UI colors
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  slate50: { r: 248, g: 250, b: 252 },
  slate100: { r: 241, g: 245, b: 249 },
  slate200: { r: 226, g: 232, b: 240 },
  slate300: { r: 203, g: 213, b: 225 },
  slate400: { r: 148, g: 163, b: 184 },
  slate500: { r: 100, g: 116, b: 139 },
  slate600: { r: 71, g: 85, b: 105 },
  slate700: { r: 51, g: 65, b: 85 },
  slate800: { r: 30, g: 41, b: 59 },
  slate900: { r: 15, g: 23, b: 42 },

  // Success/Pass
  green500: { r: 34, g: 197, b: 94 },
  green600: { r: 22, g: 163, b: 74 },

  // Background gradients
  gradientStart: { r: 15, g: 23, b: 42 },   // Slate-900
  gradientMid: { r: 30, g: 64, b: 175 },    // Blue-800
  gradientEnd: { r: 59, g: 130, b: 246 },   // Blue-500
}

// ===== HELPER FUNCTIONS =====

function setColor(doc: jsPDF, color: { r: number; g: number; b: number }) {
  doc.setTextColor(color.r, color.g, color.b)
  doc.setDrawColor(color.r, color.g, color.b)
  doc.setFillColor(color.r, color.g, color.b)
}

function getSeverityColor(severity: string): { r: number; g: number; b: number } {
  switch (severity.toLowerCase()) {
    case 'critical': return COLORS.critical
    case 'high': return COLORS.high
    case 'medium': return COLORS.medium
    case 'low': return COLORS.low
    default: return COLORS.info
  }
}

function getRiskColor(score: number): { r: number; g: number; b: number } {
  if (score >= 80) return COLORS.green500
  if (score >= 60) return COLORS.medium
  if (score >= 40) return COLORS.high
  return COLORS.critical
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
      result = result?.[key]
      if (result === undefined || result === null) return defaultValue
    }
    return result as T
  } catch {
    return defaultValue
  }
}

// ===== DRAWING HELPERS =====

function drawGradientHeader(doc: jsPDF, height: number = 20) {
  const pageWidth = doc.internal.pageSize.getWidth()
  for (let i = 0; i < height; i++) {
    const ratio = i / height
    const r = Math.floor(COLORS.gradientStart.r + ratio * (COLORS.gradientMid.r - COLORS.gradientStart.r))
    const g = Math.floor(COLORS.gradientStart.g + ratio * (COLORS.gradientMid.g - COLORS.gradientStart.g))
    const b = Math.floor(COLORS.gradientStart.b + ratio * (COLORS.gradientMid.b - COLORS.gradientStart.b))
    doc.setFillColor(r, g, b)
    doc.rect(0, i, pageWidth, 1, 'F')
  }
}

function drawProgressBar(
  doc: jsPDF,
  value: number,
  max: number,
  x: number,
  y: number,
  width: number,
  height: number = 4,
  color: { r: number; g: number; b: number }
) {
  // Background
  setColor(doc, COLORS.slate200)
  doc.roundedRect(x, y, width, height, 2, 2, 'F')

  // Progress
  const progressWidth = (value / max) * width
  if (progressWidth > 0) {
    setColor(doc, color)
    doc.roundedRect(x, y, Math.min(progressWidth, width), height, 2, 2, 'F')
  }
}

function drawSimpleBarChart(
  doc: jsPDF,
  data: Array<{ label: string; value: number; color: { r: number; g: number; b: number } }>,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barSpacing = 2
  const barWidth = (width - (data.length - 1) * barSpacing) / data.length

  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * height
    const barX = x + index * (barWidth + barSpacing)
    const barY = y + height - barHeight

    // Draw bar
    setColor(doc, item.color)
    doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F')

    // Draw value on top
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate700)
    doc.text(item.value.toString(), barX + barWidth / 2, barY - 2, { align: 'center' })
  })
}

// ===== PAGE GENERATORS =====

/**
 * PAGE 1: Professional Cover Page
 */
function generateCoverPage(doc: jsPDF, scan: ScanData) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Gradient background
  for (let i = 0; i < 80; i++) {
    const ratio = i / 80
    const r = Math.floor(15 + ratio * 15)
    const g = Math.floor(23 + ratio * 41)
    const b = Math.floor(42 + ratio * 133)
    doc.setFillColor(r, g, b)
    doc.rect(0, i, pageWidth, 1, 'F')
  }

  // Shield icon
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.5)
  doc.line(pageWidth / 2 - 8, 25, pageWidth / 2, 20)
  doc.line(pageWidth / 2 + 8, 25, pageWidth / 2, 20)
  doc.line(pageWidth / 2 - 8, 25, pageWidth / 2 - 8, 35)
  doc.line(pageWidth / 2 + 8, 25, pageWidth / 2 + 8, 35)
  doc.line(pageWidth / 2 - 8, 35, pageWidth / 2, 40)
  doc.line(pageWidth / 2 + 8, 35, pageWidth / 2, 40)
  doc.setLineWidth(1.5)
  doc.line(pageWidth / 2 - 4, 30, pageWidth / 2 - 1, 33)
  doc.line(pageWidth / 2 - 1, 33, pageWidth / 2 + 5, 27)

  // Title
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('AI SECURITY', pageWidth / 2, 55, { align: 'center' })
  doc.text('SCAN REPORT', pageWidth / 2, 65, { align: 'center' })

  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(219, 234, 254)
  doc.text('Comprehensive Security Analysis & Risk Assessment', pageWidth / 2, 75, { align: 'center' })

  // Target info box
  let yPos = 95
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.roundedRect(20, yPos, pageWidth - 40, 50, 4, 4, 'FD')

  yPos += 10
  doc.setFontSize(10)
  setColor(doc, COLORS.slate500)
  doc.setFont('helvetica', 'normal')
  doc.text('SCANNED TARGET', pageWidth / 2, yPos, { align: 'center' })

  yPos += 8
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  const displayUrl = truncateText(scan.domain || scan.url, 50)
  doc.text(displayUrl, pageWidth / 2, yPos, { align: 'center' })

  yPos += 12
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate500)

  const scanDate = new Date(scan.completedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  doc.text('Scan Date:', 30, yPos)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate600)
  doc.text(scanDate, 30, yPos + 5)

  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate500)
  doc.text('Report ID:', pageWidth - 30, yPos, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate600)
  doc.text(scan.id.substring(0, 8).toUpperCase(), pageWidth - 30, yPos + 5, { align: 'right' })

  // Executive Summary Box
  yPos = 160
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('EXECUTIVE SUMMARY', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10

  // Large score circle
  const centerX = pageWidth / 2
  const centerY = yPos + 30
  const radius = 25

  const scoreColor = getRiskColor(scan.riskScore)

  doc.setFillColor(241, 245, 249)
  doc.circle(centerX, centerY, radius, 'F')

  doc.setDrawColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.setLineWidth(6)
  doc.circle(centerX, centerY, radius - 3, 'S')

  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  setColor(doc, scoreColor)
  doc.text(`${scan.riskScore}`, centerX, centerY + 4, { align: 'center' })

  doc.setFontSize(10)
  setColor(doc, COLORS.slate500)
  doc.text('/100', centerX, centerY + 12, { align: 'center' })
  doc.text('SECURITY SCORE', centerX, centerY - 32, { align: 'center' })

  // Grade and risk badges
  yPos = centerY + radius + 12
  const riskBgColor = scoreColor

  doc.setFillColor(riskBgColor.r, riskBgColor.g, riskBgColor.b)
  doc.roundedRect(centerX - 45, yPos, 40, 12, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`GRADE ${scan.findings.summary.riskScore.grade}`, centerX - 25, yPos + 8, { align: 'center' })

  doc.setFillColor(riskBgColor.r, riskBgColor.g, riskBgColor.b)
  doc.roundedRect(centerX + 5, yPos, 40, 12, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(scan.riskLevel.toUpperCase(), centerX + 25, yPos + 8, { align: 'center' })

  // Issues breakdown
  yPos = 235
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('ISSUES BREAKDOWN', pageWidth / 2, yPos, { align: 'center' })

  yPos += 5
  const cardWidth = (pageWidth - 50) / 4
  const cardSpacing = 2
  const issues = [
    { label: 'CRITICAL', count: scan.findings.summary.criticalIssues, color: COLORS.critical, bg: { r: 254, g: 242, b: 242 } },
    { label: 'HIGH', count: scan.findings.summary.highIssues, color: COLORS.high, bg: { r: 255, g: 247, b: 237 } },
    { label: 'MEDIUM', count: scan.findings.summary.mediumIssues, color: COLORS.medium, bg: { r: 254, g: 252, b: 232 } },
    { label: 'LOW', count: scan.findings.summary.lowIssues, color: COLORS.low, bg: { r: 239, g: 246, b: 255 } }
  ]

  issues.forEach((issue, index) => {
    const xPos = 25 + (index * (cardWidth + cardSpacing))

    doc.setFillColor(issue.bg.r, issue.bg.g, issue.bg.b)
    doc.setDrawColor(issue.color.r, issue.color.g, issue.color.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(xPos, yPos, cardWidth, 28, 3, 3, 'FD')

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    setColor(doc, issue.color)
    doc.text(issue.count.toString(), xPos + (cardWidth / 2), yPos + 14, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    setColor(doc, issue.color)
    doc.text(issue.label, xPos + (cardWidth / 2), yPos + 22, { align: 'center' })
  })

  // AI detection notice - moved to new page if present
  if (scan.findings.summary.hasAI) {
    doc.addPage()

    // Gradient background for AI notice page
    for (let i = 0; i < 60; i++) {
      const ratio = i / 60
      const r = Math.floor(15 + ratio * 15)
      const g = Math.floor(23 + ratio * 41)
      const b = Math.floor(42 + ratio * 133)
      doc.setFillColor(r, g, b)
      doc.rect(0, i, pageWidth, 1, 'F')
    }

    yPos = 80

    // Large AI badge
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(1)
    doc.roundedRect(pageWidth / 2 - 60, yPos, 120, 80, 8, 8, 'FD')

    yPos += 25
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.primary)
    doc.text('[AI] TECHNOLOGIES', pageWidth / 2, yPos, { align: 'center' })

    yPos += 10
    doc.setFontSize(18)
    doc.text('DETECTED', pageWidth / 2, yPos, { align: 'center' })

    yPos += 20
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate700)
    doc.text('This website implements AI features', pageWidth / 2, yPos, { align: 'center' })

    yPos += 25

    // List detected AI
    const aiProviders = scan.findings.detectedTech.aiProviders || []
    const chatWidgets = scan.findings.detectedTech.chatWidgets || []
    const allAI = [...aiProviders, ...chatWidgets]

    if (allAI.length > 0) {
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)

      const boxHeight = Math.min(60, 15 + allAI.length * 8)
      doc.roundedRect(30, yPos, pageWidth - 60, boxHeight, 4, 4, 'FD')

      yPos += 12
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      setColor(doc, COLORS.slate800)
      doc.text('Detected AI Technologies:', pageWidth / 2, yPos, { align: 'center' })

      yPos += 10
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      setColor(doc, COLORS.slate700)

      allAI.slice(0, 5).forEach((tech) => {
        doc.text(`• ${tech}`, pageWidth / 2, yPos, { align: 'center' })
        yPos += 6
      })

      if (allAI.length > 5) {
        doc.setFont('helvetica', 'italic')
        setColor(doc, COLORS.slate500)
        doc.text(`... and ${allAI.length - 5} more`, pageWidth / 2, yPos, { align: 'center' })
      }
    }

    yPos += 20
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate600)
    doc.text('See "AI Trust Score Analysis" section for detailed security assessment', pageWidth / 2, yPos, { align: 'center' })
  }
}

/**
 * PAGE 2: Table of Contents
 */
function generateTableOfContents(doc: jsPDF, scan: ScanData): Record<string, number> {
  doc.addPage()
  const pageWidth = doc.internal.pageSize.getWidth()

  drawGradientHeader(doc, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('TABLE OF CONTENTS', 15, 13)

  let yPos = 35
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Report Navigation', 15, yPos)

  yPos += 10

  // TOC entries with page numbers (we'll track these)
  const pageNumbers: Record<string, number> = {
    toc: 2,
    executive: 3,
    aiTrust: 4,
    techStack: 5,
    findings: 6
  }

  const tocEntries = [
    { title: '1. Executive Summary', page: pageNumbers.executive, description: 'High-level security assessment overview' },
    { title: '2. AI Trust Score Analysis', page: pageNumbers.aiTrust, description: scan.findings.summary.hasAI ? 'AI security evaluation' : '(Not applicable - no AI detected)' },
    { title: '3. Technology Stack Overview', page: pageNumbers.techStack, description: 'Detected technologies and frameworks' },
    { title: '4. Security Findings', page: pageNumbers.findings, description: 'Detailed vulnerability analysis' },
  ]

  doc.setFontSize(10)
  tocEntries.forEach((entry) => {
    yPos += 12

    // Entry box
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.roundedRect(15, yPos, pageWidth - 30, 15, 2, 2, 'FD')

    // Title
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.primary)
    doc.text(entry.title, 20, yPos + 6)

    // Page number
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate500)
    doc.text(`Page ${entry.page}`, pageWidth - 20, yPos + 6, { align: 'right' })

    // Description
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, COLORS.slate500)
    doc.text(entry.description, 20, yPos + 11)

    doc.setFontSize(10)
  })

  return pageNumbers
}

/**
 * PAGE 3: Executive Summary
 */
function generateExecutiveSummary(doc: jsPDF, scan: ScanData) {
  doc.addPage()
  const pageWidth = doc.internal.pageSize.getWidth()

  drawGradientHeader(doc, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('EXECUTIVE SUMMARY', 15, 13)

  let yPos = 35
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Overview & Key Metrics', 15, yPos)

  yPos += 10

  // Metadata box
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'FD')

  yPos += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate600)

  const scanDate = new Date(scan.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const scanDuration = safeGet(scan, 'metadata.scanDuration', 0)
  const analyzersRun = safeGet(scan, 'metadata.analyzersRun', 47)

  doc.text(`Target: ${scan.url}`, 20, yPos)
  yPos += 5
  doc.text(`Scan Date: ${scanDate}`, 20, yPos)
  yPos += 5
  doc.text(`Analysis Duration: ${scanDuration > 0 ? scanDuration + 's' : 'N/A'} | Analyzers Run: ${analyzersRun}`, 20, yPos)

  yPos += 15

  // Overall Risk Assessment
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Overall Risk Assessment', 15, yPos)

  yPos += 8

  const scoreColor = getRiskColor(scan.riskScore)
  doc.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.setDrawColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPos, 60, 30, 3, 3, 'FD')

  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`${scan.riskScore}`, 45, yPos + 15, { align: 'center' })
  doc.setFontSize(10)
  doc.text('SECURITY SCORE', 45, yPos + 23, { align: 'center' })

  // Grade and Risk Level
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(80, yPos, 55, 30, 3, 3, 'FD')

  doc.setFontSize(10)
  setColor(doc, COLORS.slate600)
  doc.text('GRADE', 107, yPos + 10, { align: 'center' })
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  setColor(doc, scoreColor)
  doc.text(scan.findings.summary.riskScore.grade, 107, yPos + 22, { align: 'center' })

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(140, yPos, 55, 30, 3, 3, 'FD')

  doc.setFontSize(10)
  setColor(doc, COLORS.slate600)
  doc.text('RISK LEVEL', 167, yPos + 10, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, scoreColor)
  doc.text(scan.riskLevel, 167, yPos + 22, { align: 'center' })

  yPos += 40

  // Key Findings
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Key Findings', 15, yPos)

  yPos += 8

  const findings = scan.findings.findings || []
  const totalIssues = findings.length

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate700)

  if (scan.findings.summary.hasAI) {
    doc.text('• [AI] AI Integration Detected', 20, yPos)
    yPos += 5
  }
  doc.text(`• [CRITICAL] ${scan.findings.summary.criticalIssues} Critical Issues`, 20, yPos)
  yPos += 5
  doc.text(`• [HIGH] ${scan.findings.summary.highIssues} High Priority Issues`, 20, yPos)
  yPos += 5
  doc.text(`• [MEDIUM] ${scan.findings.summary.mediumIssues} Medium Priority Issues`, 20, yPos)
  yPos += 5
  doc.text(`• [LOW] ${scan.findings.summary.lowIssues} Low Priority Issues`, 20, yPos)
  yPos += 5
  doc.text(`• Total Findings: ${totalIssues}`, 20, yPos)

  yPos += 12

  // Severity Distribution (simple bar chart)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Severity Distribution', 15, yPos)

  yPos += 8

  const chartData = [
    { label: 'Critical', value: scan.findings.summary.criticalIssues, color: COLORS.critical },
    { label: 'High', value: scan.findings.summary.highIssues, color: COLORS.high },
    { label: 'Medium', value: scan.findings.summary.mediumIssues, color: COLORS.medium },
    { label: 'Low', value: scan.findings.summary.lowIssues, color: COLORS.low },
  ]

  drawSimpleBarChart(doc, chartData, 20, yPos, pageWidth - 40, 40)

  yPos += 50

  // Top 3 Recommendations
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Top 3 Critical Recommendations', 15, yPos)

  yPos += 8

  const highSeverityFindings = findings
    .filter(f => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 3)

  if (highSeverityFindings.length > 0) {
    highSeverityFindings.forEach((finding, index) => {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      setColor(doc, getSeverityColor(finding.severity))
      doc.text(`${index + 1}. ${truncateText(finding.title, 70)}`, 20, yPos)
      yPos += 6
    })
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.green600)
    doc.text('[PASS] No critical or high severity issues found!', 20, yPos)
    yPos += 6
  }

  yPos += 5

  // Compliance Status (if available)
  if (scan.findings.compliance) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate800)
    doc.text('Compliance Status', 15, yPos)

    yPos += 8

    doc.setFillColor(255, 250, 240)
    doc.setDrawColor(251, 191, 36)
    doc.setLineWidth(0.3)
    doc.roundedRect(15, yPos, pageWidth - 30, 20, 3, 3, 'FD')

    yPos += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate700)

    doc.text(`[WARN] GDPR Compliance: ${scan.findings.compliance.gdprScore}% (${scan.findings.compliance.overallCompliance.toUpperCase()})`, 20, yPos)
    yPos += 5
    doc.text(`[INFO] CCPA: ${scan.findings.compliance.ccpaScore}%`, 20, yPos)
    yPos += 5
    doc.text(`[INFO] PCI-DSS: ${scan.findings.compliance.pciDssIndicators.length} indicators found`, 20, yPos)
  }
}

/**
 * PAGE 4: AI Trust Score Analysis
 */
function generateAiTrustPage(doc: jsPDF, scan: ScanData) {
  doc.addPage()
  const pageWidth = doc.internal.pageSize.getWidth()

  drawGradientHeader(doc, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('AI TRUST SCORE ANALYSIS', 15, 13)

  let yPos = 35

  // Check if AI is detected
  if (!scan.findings.summary.hasAI && !scan.aiTrustScorecard) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate800)
    doc.text('No AI Technologies Detected', 15, yPos)

    yPos += 15

    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPos, pageWidth - 30, 60, 4, 4, 'FD')

    yPos += 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.green600)
    doc.text('[PASS] NO AI TECHNOLOGIES DETECTED', pageWidth / 2, yPos, { align: 'center' })

    yPos += 12
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate600)
    doc.text('Our scan found no indicators of:', pageWidth / 2, yPos, { align: 'center' })

    yPos += 8
    doc.setFontSize(9)
    doc.text('- AI chatbots or virtual assistants', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.text('- LLM API integrations (OpenAI, Anthropic, etc.)', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.text('- Machine learning endpoints', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.text('- AI-powered recommendation engines', pageWidth / 2, yPos, { align: 'center' })

    yPos += 12
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    setColor(doc, COLORS.slate500)
    doc.text('This section is not applicable for this website.', pageWidth / 2, yPos, { align: 'center' })
    doc.text('Proceed to Technology Stack (next page).', pageWidth / 2, yPos + 5, { align: 'center' })

    return
  }

  // AI IS DETECTED - Show full analysis
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('AI Security Assessment', 15, yPos)

  yPos += 10

  // AI Detection Box
  doc.setFillColor(239, 246, 255)
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'FD')

  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.primary)
  doc.text('[AI] IMPLEMENTATION DETECTED', 20, yPos)

  yPos += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate700)

  const aiProviders = scan.findings.detectedTech.aiProviders || []
  const chatWidgets = scan.findings.detectedTech.chatWidgets || []
  const allAI = [...aiProviders, ...chatWidgets]

  if (allAI.length > 0) {
    doc.text(`Provider(s): ${allAI.slice(0, 3).join(', ')}${allAI.length > 3 ? '...' : ''}`, 20, yPos)
  }

  if (scan.aiTrustScorecard?.detectedAiProvider) {
    yPos += 5
    doc.text(`Detection: ${scan.aiTrustScorecard.detectedAiProvider}`, 20, yPos)
  }

  yPos += 15

  // AI Trust Score (if available)
  if (scan.aiTrustScorecard) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate800)
    doc.text('AI Trust Score', 15, yPos)

    yPos += 8

    const aiScore = scan.aiTrustScorecard.score || 0
    const aiScoreColor = getRiskColor(aiScore)

    // Score box
    doc.setFillColor(aiScoreColor.r, aiScoreColor.g, aiScoreColor.b)
    doc.setDrawColor(aiScoreColor.r, aiScoreColor.g, aiScoreColor.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPos, 80, 35, 3, 3, 'FD')

    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${aiScore}`, 55, yPos + 18, { align: 'center' })
    doc.setFontSize(10)
    doc.text('/100', 55, yPos + 26, { align: 'center' })
    doc.setFontSize(8)
    doc.text('AI TRUST SCORE', 55, yPos + 32, { align: 'center' })

    // Weighted Score
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(100, yPos, 50, 35, 3, 3, 'FD')

    doc.setFontSize(10)
    setColor(doc, COLORS.slate600)
    doc.text('Weighted', 125, yPos + 12, { align: 'center' })
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    setColor(doc, aiScoreColor)
    doc.text(`${scan.aiTrustScorecard.weightedScore || aiScore}`, 125, yPos + 25, { align: 'center' })

    // Checks Passed
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(155, yPos, 40, 35, 3, 3, 'FD')

    doc.setFontSize(10)
    setColor(doc, COLORS.slate600)
    doc.text('Checks', 175, yPos + 12, { align: 'center' })
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.green600)
    doc.text(`${scan.aiTrustScorecard.passedChecks}/${scan.aiTrustScorecard.totalChecks}`, 175, yPos + 25, { align: 'center' })

    yPos += 45

    // Category Scores (if available)
    if (scan.aiTrustScorecard.categoryScores) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      setColor(doc, COLORS.slate800)
      doc.text('Category Breakdown', 15, yPos)

      yPos += 8

      const categories = Object.entries(scan.aiTrustScorecard.categoryScores).slice(0, 5)

      categories.forEach(([category, score]) => {
        const categoryColor = getRiskColor(score as number)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        setColor(doc, COLORS.slate700)
        doc.text(`${category}:`, 20, yPos)

        drawProgressBar(doc, score as number, 100, 80, yPos - 3, 100, 5, categoryColor)

        doc.setFont('helvetica', 'bold')
        setColor(doc, categoryColor)
        doc.text(`${score}/100`, 185, yPos, { align: 'right' })

        yPos += 8
      })
    }

    yPos += 5

    // Summary (if available)
    if (scan.aiTrustScorecard.summary) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      setColor(doc, COLORS.slate800)
      doc.text('Analysis Summary', 15, yPos)

      yPos += 8

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'FD')

      yPos += 8
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      setColor(doc, COLORS.slate700)

      const summaryLines = doc.splitTextToSize(scan.aiTrustScorecard.summary, pageWidth - 40)
      doc.text(summaryLines, 20, yPos)
    }
  }

  // OWASP LLM Status (compact)
  yPos += 45

  if (yPos > 240) {
    doc.addPage()
    drawGradientHeader(doc, 20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('AI TRUST SCORE (CONTINUED)', 15, 13)
    yPos = 35
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('OWASP LLM Top 10 Status', 15, yPos)

  yPos += 8

  const llmChecks = [
    { name: 'LLM01: Prompt Injection', risk: scan.findings.llm01PromptInjection?.overallRisk || 'none' },
    { name: 'LLM02: Insecure Output', risk: scan.findings.llm02InsecureOutput?.overallRisk || 'none' },
    { name: 'LLM05: Supply Chain', risk: scan.findings.llm05SupplyChain?.overallRisk || 'none' },
    { name: 'LLM06: Sensitive Info', risk: scan.findings.llm06SensitiveInfo?.overallRisk || 'none' },
    { name: 'LLM07: Plugin Design', risk: scan.findings.llm07PluginDesign?.overallRisk || 'none' },
    { name: 'LLM08: Excessive Agency', risk: scan.findings.llm08ExcessiveAgency?.overallRisk || 'none' },
  ]

  llmChecks.forEach((check) => {
    const isPassed = check.risk === 'none' || check.risk === 'low'
    const icon = isPassed ? '[PASS]' : '[WARN]'
    const statusColor = isPassed ? COLORS.green600 : COLORS.high

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, statusColor)
    doc.text(`${icon} ${check.name}`, 20, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text(check.risk.toUpperCase(), 120, yPos)

    yPos += 6
  })

  const allPassed = llmChecks.every(c => c.risk === 'none' || c.risk === 'low')

  if (allPassed) {
    yPos += 5
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPos, pageWidth - 30, 12, 3, 3, 'FD')

    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.green600)
    doc.text('[SUCCESS] All OWASP LLM security checks passed!', pageWidth / 2, yPos, { align: 'center' })
  }
}

/**
 * PAGE 5: Technology Stack Overview
 */
function generateTechStackPage(doc: jsPDF, scan: ScanData) {
  doc.addPage()
  const pageWidth = doc.internal.pageSize.getWidth()

  drawGradientHeader(doc, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('TECHNOLOGY STACK', 15, 13)

  let yPos = 35

  const techStack = scan.findings.techStack

  if (!techStack || techStack.totalCount === 0) {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate800)
    doc.text('No Technologies Detected', 15, yPos)

    yPos += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate600)
    doc.text('No specific technologies or frameworks were detected during the scan.', 20, yPos)

    return
  }

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Detected Technologies', 15, yPos)

  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate600)
  doc.text(`Total technologies detected: ${techStack.totalCount}`, 15, yPos)

  yPos += 12

  // Technology categories
  const categoryIcons: Record<string, string> = {
    cms: '[CMS]',
    ecommerce: '[SHOP]',
    analytics: '[ANALYTICS]',
    ads: '[ADS]',
    cdn: '[CDN]',
    social: '[SOCIAL]',
    framework: '[FRAMEWORK]',
    hosting: '[HOSTING]'
  }

  const categoryColors: Record<string, { r: number; g: number; b: number }> = {
    cms: { r: 147, g: 51, b: 234 },
    ecommerce: { r: 34, g: 197, b: 94 },
    analytics: { r: 59, g: 130, b: 246 },
    ads: { r: 234, g: 179, b: 8 },
    cdn: { r: 6, g: 182, b: 212 },
    social: { r: 236, g: 72, b: 153 },
    framework: { r: 99, g: 102, b: 241 },
    hosting: { r: 100, g: 116, b: 139 }
  }

  Object.entries(techStack.categories).forEach(([category, technologies]) => {
    if (!technologies || technologies.length === 0) return

    const icon = categoryIcons[category] || '[TECH]'
    const color = categoryColors[category] || COLORS.primary

    // Category header
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    setColor(doc, color)
    doc.text(`${icon} ${category.toUpperCase()}`, 15, yPos)

    doc.setFontSize(8)
    setColor(doc, COLORS.slate500)
    doc.text(`(${technologies.length})`, 80, yPos)

    yPos += 7

    // Technology list
    technologies.slice(0, 5).forEach((tech) => {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      setColor(doc, COLORS.slate800)
      doc.text(`• ${tech.name}`, 20, yPos)

      if (tech.version) {
        doc.setFont('helvetica', 'normal')
        setColor(doc, COLORS.slate500)
        doc.text(`v${tech.version}`, 100, yPos)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      setColor(doc, COLORS.slate600)

      const confidence = tech.confidence === 'high' ? '[HIGH]' : tech.confidence === 'medium' ? '[MEDIUM]' : '[LOW]'
      doc.text(confidence, pageWidth - 30, yPos, { align: 'right' })

      yPos += 5

      if (tech.description) {
        doc.setFontSize(7)
        setColor(doc, COLORS.slate500)
        const descLines = doc.splitTextToSize(tech.description, 150)
        doc.text(descLines, 25, yPos)
        yPos += descLines.length * 3
      }

      yPos += 2

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        drawGradientHeader(doc, 20)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text('TECHNOLOGY STACK (CONTINUED)', 15, 13)
        yPos = 35
      }
    })

    if (technologies.length > 5) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      setColor(doc, COLORS.slate400)
      doc.text(`... and ${technologies.length - 5} more`, 20, yPos)
      yPos += 5
    }

    yPos += 8
  })
}

/**
 * PAGE 6+: Detailed Findings
 */
function generateDetailedFindings(doc: jsPDF, scan: ScanData) {
  doc.addPage()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  drawGradientHeader(doc, 20)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('SECURITY FINDINGS', 15, 13)

  let yPos = 35
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  setColor(doc, COLORS.slate800)
  doc.text('Detailed Analysis', 15, yPos)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  setColor(doc, COLORS.slate500)
  doc.text('Complete list of security issues discovered during the scan', 15, yPos + 6)

  yPos += 18

  const findings = scan.findings.findings || []

  if (findings.length === 0) {
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPos, pageWidth - 30, 40, 4, 4, 'FD')

    yPos += 20
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.green600)
    doc.text('[SUCCESS] No Security Issues Found!', pageWidth / 2, yPos, { align: 'center' })

    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('All security checks passed successfully.', pageWidth / 2, yPos, { align: 'center' })

    return
  }

  // Group findings by severity
  const criticalFindings = findings.filter(f => f.severity === 'critical')
  const highFindings = findings.filter(f => f.severity === 'high')
  const mediumFindings = findings.filter(f => f.severity === 'medium')
  const lowFindings = findings.filter(f => f.severity === 'low')

  const groupedFindings = [
    ...criticalFindings,
    ...highFindings,
    ...mediumFindings,
    ...lowFindings
  ]

  groupedFindings.forEach((finding, index) => {
    const severityColor = getSeverityColor(finding.severity)

    const descLines = doc.splitTextToSize(finding.description, pageWidth - 50)
    const recLines = doc.splitTextToSize(finding.recommendation, pageWidth - 60)
    const cardHeight = Math.max(45, 25 + (descLines.length * 3) + (recLines.length * 3))

    if (yPos > pageHeight - cardHeight - 10) {
      doc.addPage()
      drawGradientHeader(doc, 20)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('SECURITY FINDINGS (CONTINUED)', 15, 13)
      yPos = 30
    }

    // Shadow (subtle)
    doc.setFillColor(0, 0, 0)
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 0.03 }))
    doc.roundedRect(16, yPos + 1, pageWidth - 32, cardHeight, 4, 4, 'F')
    // @ts-ignore
    doc.setGState(new doc.GState({ opacity: 1.0 }))

    // Card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPos, pageWidth - 30, cardHeight, 4, 4, 'FD')

    // Left severity bar
    doc.setFillColor(severityColor.r, severityColor.g, severityColor.b)
    doc.roundedRect(15, yPos, 4, cardHeight, 4, 4, 'F')

    // Finding number badge
    doc.setFillColor(248, 250, 252)
    doc.circle(27, yPos + 8, 4, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate500)
    doc.text(`${index + 1}`, 27, yPos + 10, { align: 'center' })

    // Title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.slate800)
    const titleText = truncateText(finding.title, 60)
    doc.text(titleText, 35, yPos + 10)

    // Severity badge
    doc.setFillColor(severityColor.r, severityColor.g, severityColor.b)
    doc.roundedRect(pageWidth - 42, yPos + 5, 27, 9, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(finding.severity.toUpperCase(), pageWidth - 28.5, yPos + 10.5, { align: 'center' })

    // Description
    let currentY = yPos + 18
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate600)
    doc.text(descLines, 22, currentY)
    currentY += descLines.length * 3.5 + 3

    // Evidence (if exists)
    if (finding.evidence) {
      doc.setFillColor(0, 0, 0)
      // @ts-ignore
      doc.setGState(new doc.GState({ opacity: 0.05 }))
      doc.roundedRect(22, currentY, pageWidth - 44, 8, 2, 2, 'F')
      // @ts-ignore
      doc.setGState(new doc.GState({ opacity: 1.0 }))

      doc.setFontSize(7)
      setColor(doc, COLORS.slate500)
      doc.text('Evidence:', 24, currentY + 3)

      doc.setFont('courier', 'normal')
      doc.setFontSize(7)
      setColor(doc, COLORS.slate700)
      const evidenceText = truncateText(finding.evidence, 100)
      doc.text(evidenceText, 24, currentY + 6)
      doc.setFont('helvetica', 'normal')

      currentY += 11
    }

    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(22, currentY, pageWidth - 22, currentY)
    currentY += 3

    // Recommendation
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.green600)
    doc.text('[FIX] RECOMMENDED ACTION', 22, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    setColor(doc, COLORS.slate600)
    doc.text(recLines, 22, currentY)

    yPos += cardHeight + 6
  })
}

/**
 * Add professional footer to all pages
 */
function addFooters(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Footer separator line
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(0, pageHeight - 15, pageWidth, pageHeight - 15)

    // Footer background
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')

    // Left - Branding
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    setColor(doc, COLORS.primary)
    doc.text('AI SECURITY SCANNER', 15, pageHeight - 8)

    // Center - Confidential notice
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor(doc, COLORS.slate500)
    doc.text('Confidential Security Report', pageWidth / 2, pageHeight - 8, { align: 'center' })

    // Right - Page number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(doc, COLORS.slate500)
    doc.text(`Page ${i}/${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' })
  }
}

// ===== MAIN EXPORT FUNCTION =====

export function generatePDFReport(scan: ScanData): jsPDF {
  try {
    const doc = new jsPDF()

    // PAGE 1: Cover Page
    generateCoverPage(doc, scan)

    // PAGE 2: Table of Contents
    generateTableOfContents(doc, scan)

    // PAGE 3: Executive Summary
    generateExecutiveSummary(doc, scan)

    // PAGE 4: AI Trust Score (if applicable)
    generateAiTrustPage(doc, scan)

    // PAGE 5: Technology Stack
    generateTechStackPage(doc, scan)

    // PAGE 6+: Detailed Findings
    generateDetailedFindings(doc, scan)

    // Add footers to all pages
    addFooters(doc)

    return doc
  } catch (error) {
    console.error('PDF generation error:', error)

    // Fallback: create simple error PDF
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PDF Generation Error', 20, 30)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('An error occurred while generating the PDF report.', 20, 45)
    doc.text('Please contact support if this issue persists.', 20, 55)

    doc.setFontSize(10)
    doc.setFont('courier', 'normal')
    doc.text(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 20, 70)

    return doc
  }
}

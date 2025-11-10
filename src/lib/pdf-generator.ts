import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    findings: Array<{
      id: string
      category: string
      severity: string
      title: string
      description: string
      impact: string
      recommendation: string
    }>
  }
  createdAt: string
  completedAt: string
}

export function generatePDFReport(scan: ScanData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 0

  // ===== PAGE 1: COVER PAGE WITH MODERN DESIGN =====

  // Gradient background (multiple layers for smooth gradient effect)
  for (let i = 0; i < 80; i++) {
    const ratio = i / 80
    const r = Math.floor(15 + ratio * 15)  // 15 -> 30
    const g = Math.floor(23 + ratio * 41)  // 23 -> 64
    const b = Math.floor(42 + ratio * 133) // 42 -> 175
    doc.setFillColor(r, g, b)
    doc.rect(0, i, pageWidth, 1, 'F')
  }

  // Modern shield icon with geometric design
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.5)
  // Shield outline
  doc.line(pageWidth / 2 - 8, 25, pageWidth / 2, 20)
  doc.line(pageWidth / 2 + 8, 25, pageWidth / 2, 20)
  doc.line(pageWidth / 2 - 8, 25, pageWidth / 2 - 8, 35)
  doc.line(pageWidth / 2 + 8, 25, pageWidth / 2 + 8, 35)
  doc.line(pageWidth / 2 - 8, 35, pageWidth / 2, 40)
  doc.line(pageWidth / 2 + 8, 35, pageWidth / 2, 40)
  // Checkmark inside shield
  doc.setLineWidth(1.5)
  doc.line(pageWidth / 2 - 4, 30, pageWidth / 2 - 1, 33)
  doc.line(pageWidth / 2 - 1, 33, pageWidth / 2 + 5, 27)

  // Main title - centered and large
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('AI SECURITY', pageWidth / 2, 55, { align: 'center' })
  doc.text('SCAN REPORT', pageWidth / 2, 65, { align: 'center' })

  // Subtitle
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(219, 234, 254) // Blue-100
  doc.text('Comprehensive Security Analysis & Risk Assessment', pageWidth / 2, 75, { align: 'center' })

  // White content box on cover page - elevated design
  yPosition = 95
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240) // Slate-200
  doc.setLineWidth(0.5)
  doc.roundedRect(20, yPosition, pageWidth - 40, 50, 4, 4, 'FD')

  // Scan target information
  yPosition += 10
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139) // Slate-500
  doc.setFont('helvetica', 'normal')
  doc.text('SCANNED TARGET', pageWidth / 2, yPosition, { align: 'center' })

  yPosition += 8
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59) // Slate-800
  const displayUrl = scan.domain || scan.url
  // Truncate if too long
  const maxUrlLength = 50
  const truncatedUrl = displayUrl.length > maxUrlLength
    ? displayUrl.substring(0, maxUrlLength) + '...'
    : displayUrl
  doc.text(truncatedUrl, pageWidth / 2, yPosition, { align: 'center' })

  // Scan metadata in two columns
  yPosition += 12
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)

  const scanDate = new Date(scan.completedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  doc.text('Scan Date:', 30, yPosition)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text(scanDate, 30, yPosition + 5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Report ID:', pageWidth - 30, yPosition, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105)
  doc.text(scan.id.substring(0, 8).toUpperCase(), pageWidth - 30, yPosition + 5, { align: 'right' })

  // ===== EXECUTIVE SUMMARY BOX - LARGE RISK SCORE =====
  yPosition = 160
  const scoreColor = getScoreColor(scan.riskScore)
  const riskBgColor = getRiskBackgroundColor(scan.riskLevel)

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('EXECUTIVE SUMMARY', pageWidth / 2, yPosition, { align: 'center' })

  yPosition += 10

  // Large circular score visualization
  const centerX = pageWidth / 2
  const centerY = yPosition + 30
  const radius = 25

  // Outer circle - gray background
  doc.setFillColor(241, 245, 249) // Slate-100
  doc.circle(centerX, centerY, radius, 'F')

  // Score arc (simulate with colored circle if score is high)
  doc.setDrawColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.setLineWidth(6)
  doc.circle(centerX, centerY, radius - 3, 'S')

  // Score number in center - VERY LARGE
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.text(`${scan.riskScore}`, centerX, centerY + 4, { align: 'center' })

  // "/100" below score
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('/100', centerX, centerY + 12, { align: 'center' })

  // Security Score label above - perfect position
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('SECURITY SCORE', centerX, centerY - 32, { align: 'center' })

  // Grade and Risk Level badges below circle
  yPosition = centerY + radius + 12

  // Grade badge
  doc.setFillColor(riskBgColor.r, riskBgColor.g, riskBgColor.b)
  doc.roundedRect(centerX - 45, yPosition, 40, 12, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`GRADE ${scan.findings.summary.riskScore.grade}`, centerX - 25, yPosition + 8, { align: 'center' })

  // Risk level badge
  doc.setFillColor(riskBgColor.r, riskBgColor.g, riskBgColor.b)
  doc.roundedRect(centerX + 5, yPosition, 40, 12, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(scan.riskLevel.toUpperCase(), centerX + 25, yPosition + 8, { align: 'center' })

  // Issues Summary - Modern card grid at bottom of cover
  yPosition = 235
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('ISSUES BREAKDOWN', pageWidth / 2, yPosition, { align: 'center' })

  yPosition += 5
  const cardWidth = (pageWidth - 50) / 4
  const cardSpacing = 2
  const issues = [
    { label: 'CRITICAL', count: scan.findings.summary.criticalIssues, color: { r: 239, g: 68, b: 68 }, bg: { r: 254, g: 242, b: 242 } },
    { label: 'HIGH', count: scan.findings.summary.highIssues, color: { r: 249, g: 115, b: 22 }, bg: { r: 255, g: 247, b: 237 } },
    { label: 'MEDIUM', count: scan.findings.summary.mediumIssues, color: { r: 234, g: 179, b: 8 }, bg: { r: 254, g: 252, b: 232 } },
    { label: 'LOW', count: scan.findings.summary.lowIssues, color: { r: 59, g: 130, b: 246 }, bg: { r: 239, g: 246, b: 255 } }
  ]

  issues.forEach((issue, index) => {
    const xPos = 25 + (index * (cardWidth + cardSpacing))

    // Card background with subtle border
    doc.setFillColor(issue.bg.r, issue.bg.g, issue.bg.b)
    doc.setDrawColor(issue.color.r, issue.color.g, issue.color.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(xPos, yPosition, cardWidth, 28, 3, 3, 'FD')

    // Count - large and colored
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(issue.color.r, issue.color.g, issue.color.b)
    doc.text(issue.count.toString(), xPos + (cardWidth / 2), yPosition + 14, { align: 'center' })

    // Label - uppercase for consistency
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(issue.color.r, issue.color.g, issue.color.b)
    doc.text(issue.label, xPos + (cardWidth / 2), yPosition + 22, { align: 'center' })
  })

  // AI Technologies Notice at bottom
  if (scan.findings.summary.hasAI) {
    yPosition = 272
    doc.setFillColor(239, 246, 255) // Blue-50
    doc.setDrawColor(147, 197, 253) // Blue-300
    doc.setLineWidth(0.5)
    doc.roundedRect(25, yPosition, pageWidth - 50, 18, 3, 3, 'FD')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175) // Blue-800
    doc.text('AI TECHNOLOGIES DETECTED', pageWidth / 2, yPosition + 6, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(59, 130, 246) // Blue-500

    if (scan.findings.detectedTech.aiProviders.length > 0) {
      doc.text(`Providers: ${scan.findings.detectedTech.aiProviders.slice(0, 3).join(', ')}${scan.findings.detectedTech.aiProviders.length > 3 ? '...' : ''}`, pageWidth / 2, yPosition + 11, { align: 'center' })
    }

    if (scan.findings.detectedTech.chatWidgets.length > 0) {
      doc.text(`Widgets: ${scan.findings.detectedTech.chatWidgets.slice(0, 3).join(', ')}${scan.findings.detectedTech.chatWidgets.length > 3 ? '...' : ''}`, pageWidth / 2, yPosition + 15, { align: 'center' })
    }
  }

  // ===== PAGE 2+: FINDINGS DETAILS WITH MODERN DESIGN =====
  doc.addPage()
  yPosition = 20

  // Modern page header with gradient
  for (let i = 0; i < 20; i++) {
    const ratio = i / 20
    const r = Math.floor(30 + ratio * 14)   // 30 -> 44
    const g = Math.floor(64 + ratio * 51)   // 64 -> 115
    const b = Math.floor(175 + ratio * 71)  // 175 -> 246
    doc.setFillColor(r, g, b)
    doc.rect(0, i, pageWidth, 1, 'F')
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('SECURITY FINDINGS', 15, 13)

  yPosition = 30
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Detailed Analysis', 15, yPosition)

  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Complete list of security issues discovered during the scan', 15, yPosition + 6)

  yPosition += 18

  // Findings with modern card design
  scan.findings.findings.forEach((finding, index) => {
    // Calculate dynamic card height based on content
    const descLines = doc.splitTextToSize(finding.description, pageWidth - 50)
    const recLines = doc.splitTextToSize(finding.recommendation, pageWidth - 60)
    const cardHeight = Math.max(45, 25 + (descLines.length * 3) + (recLines.length * 3))

    if (yPosition > pageHeight - cardHeight - 10) {
      doc.addPage()

      // Modern page header on continuation
      for (let i = 0; i < 20; i++) {
        const ratio = i / 20
        const r = Math.floor(30 + ratio * 14)
        const g = Math.floor(64 + ratio * 51)
        const b = Math.floor(175 + ratio * 71)
        doc.setFillColor(r, g, b)
        doc.rect(0, i, pageWidth, 1, 'F')
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('SECURITY FINDINGS (CONTINUED)', 15, 13)

      yPosition = 30
    }

    const severityColor = getSeverityColor(finding.severity)

    // Modern card with shadow effect (simulated with layered rectangles)
    doc.setFillColor(0, 0, 0)
    doc.setGState(new doc.GState({ opacity: 0.03 }))
    doc.roundedRect(16, yPosition + 1, pageWidth - 32, cardHeight, 4, 4, 'F')
    doc.setGState(new doc.GState({ opacity: 1.0 }))

    // Main card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240) // Slate-200
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPosition, pageWidth - 30, cardHeight, 4, 4, 'FD')

    // Colored left accent bar
    doc.setFillColor(severityColor.border.r, severityColor.border.g, severityColor.border.b)
    doc.roundedRect(15, yPosition, 4, cardHeight, 4, 4, 'F')

    // Finding number badge
    doc.setFillColor(248, 250, 252) // Slate-50
    doc.circle(27, yPosition + 8, 4, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text(`${index + 1}`, 27, yPosition + 10, { align: 'center' })

    // Finding title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    const titleText = finding.title.length > 60 ? finding.title.substring(0, 60) + '...' : finding.title
    doc.text(titleText, 35, yPosition + 10)

    // Severity badge - top right
    doc.setFillColor(severityColor.badge.r, severityColor.badge.g, severityColor.badge.b)
    doc.roundedRect(pageWidth - 42, yPosition + 5, 27, 9, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(finding.severity.toUpperCase(), pageWidth - 28.5, yPosition + 10.5, { align: 'center' })

    // Description section
    let currentY = yPosition + 18
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(descLines, 22, currentY)
    currentY += descLines.length * 3.5 + 3

    // Divider line
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(22, currentY, pageWidth - 22, currentY)
    currentY += 3

    // Recommendation section with icon
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74) // Green-600
    doc.text('✓ RECOMMENDED ACTION', 22, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(recLines, 22, currentY)

    yPosition += cardHeight + 6
  })

  // Professional footer on all pages
  const totalPages = doc.getNumberOfPages()
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Footer with subtle top border
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(0, pageHeight - 15, pageWidth, pageHeight - 15)

    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')

    // Left side - branding
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('AI SECURITY SCANNER', 15, pageHeight - 8)

    // Center - confidential notice
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('Confidential Security Report', pageWidth / 2, pageHeight - 8, { align: 'center' })

    // Right side - page number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Page ${i}/${totalPages}`,
      pageWidth - 15,
      pageHeight - 8,
      { align: 'right' }
    )
  }

  return doc
}

function getScoreColor(score: number): { r: number; g: number; b: number } {
  if (score >= 80) return { r: 34, g: 197, b: 94 } // Green-500
  if (score >= 60) return { r: 234, g: 179, b: 8 } // Yellow-500
  if (score >= 40) return { r: 249, g: 115, b: 22 } // Orange-500
  return { r: 239, g: 68, b: 68 } // Red-500
}

function getRiskBackgroundColor(level: string): { r: number; g: number; b: number } {
  switch (level.toUpperCase()) {
    case 'LOW':
      return { r: 34, g: 197, b: 94 } // Green-500
    case 'MEDIUM':
      return { r: 234, g: 179, b: 8 } // Yellow-500
    case 'HIGH':
      return { r: 249, g: 115, b: 22 } // Orange-500
    case 'CRITICAL':
      return { r: 239, g: 68, b: 68 } // Red-500
    default:
      return { r: 100, g: 116, b: 139 } // Slate-500
  }
}

function getSeverityColor(severity: string): {
  bg: { r: number; g: number; b: number }
  border: { r: number; g: number; b: number }
  badge: { r: number; g: number; b: number }
} {
  switch (severity.toLowerCase()) {
    case 'critical':
      return {
        bg: { r: 254, g: 242, b: 242 }, // Red-50
        border: { r: 239, g: 68, b: 68 }, // Red-500
        badge: { r: 220, g: 38, b: 38 }   // Red-600
      }
    case 'high':
      return {
        bg: { r: 255, g: 247, b: 237 }, // Orange-50
        border: { r: 249, g: 115, b: 22 }, // Orange-500
        badge: { r: 234, g: 88, b: 12 }    // Orange-600
      }
    case 'medium':
      return {
        bg: { r: 254, g: 252, b: 232 }, // Yellow-50
        border: { r: 234, g: 179, b: 8 }, // Yellow-500
        badge: { r: 202, g: 138, b: 4 }   // Yellow-600
      }
    case 'low':
      return {
        bg: { r: 239, g: 246, b: 255 }, // Blue-50
        border: { r: 59, g: 130, b: 246 }, // Blue-500
        badge: { r: 37, g: 99, b: 235 }    // Blue-600
      }
    default:
      return {
        bg: { r: 248, g: 250, b: 252 }, // Slate-50
        border: { r: 148, g: 163, b: 184 }, // Slate-400
        badge: { r: 100, g: 116, b: 139 }   // Slate-500
      }
  }
}

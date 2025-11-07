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

  // ===== PAGE 1: HEADER & SUMMARY =====

  // Blue gradient header background (simulated with rectangles)
  doc.setFillColor(30, 64, 175) // Blue-800
  doc.rect(0, 0, pageWidth, 50, 'F')
  doc.setFillColor(59, 130, 246) // Blue-500
  doc.rect(0, 40, pageWidth, 15, 'F')

  // Shield icon simulation (simple square)
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(255, 255, 255)
  doc.roundedRect(15, 15, 12, 12, 2, 2, 'FD')

  // Header text
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('AI Security Scan Report', 32, 25)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(219, 234, 254) // Blue-100
  doc.text('Comprehensive Security Analysis', 32, 33)

  // Scan info box
  yPosition = 60
  doc.setFillColor(248, 250, 252) // Slate-50
  doc.roundedRect(15, yPosition, pageWidth - 30, 20, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139) // Slate-500
  doc.text('Scanned URL:', 20, yPosition + 8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59) // Slate-800
  doc.text(scan.domain || scan.url, 20, yPosition + 14)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  const scanDate = new Date(scan.completedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  doc.text(`Scan Date: ${scanDate}`, pageWidth - 20, yPosition + 14, { align: 'right' })

  // Risk Score Card - Large and prominent
  yPosition = 90
  const scoreColor = getScoreColor(scan.riskScore)
  const riskBgColor = getRiskBackgroundColor(scan.riskLevel)

  // Main score box with colored border
  doc.setDrawColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.setLineWidth(2)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(15, yPosition, pageWidth - 30, 45, 5, 5, 'FD')

  // Score number - LARGE
  doc.setFontSize(60)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.text(`${scan.riskScore}`, 50, yPosition + 32)

  doc.setFontSize(18)
  doc.setTextColor(100, 116, 139)
  doc.text('/100', 85, yPosition + 32)

  // Grade badge
  doc.setFillColor(riskBgColor.r, riskBgColor.g, riskBgColor.b)
  doc.roundedRect(110, yPosition + 15, 35, 14, 3, 3, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`Grade ${scan.findings.summary.riskScore.grade}`, 127.5, yPosition + 24, { align: 'center' })

  // Risk level badge
  doc.setFillColor(riskBgColor.r, riskBgColor.g, riskBgColor.b)
  doc.roundedRect(150, yPosition + 15, 35, 14, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(scan.riskLevel, 167.5, yPosition + 24, { align: 'center' })

  // "Security Score" label
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Security Score', 50, yPosition + 10)

  // Issues Summary - Modern card grid
  yPosition = 145
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Security Issues Detected', 15, yPosition)

  yPosition += 8
  const cardWidth = (pageWidth - 40) / 4
  const issues = [
    { label: 'Critical', count: scan.findings.summary.criticalIssues, color: { r: 239, g: 68, b: 68 } },
    { label: 'High', count: scan.findings.summary.highIssues, color: { r: 249, g: 115, b: 22 } },
    { label: 'Medium', count: scan.findings.summary.mediumIssues, color: { r: 234, g: 179, b: 8 } },
    { label: 'Low', count: scan.findings.summary.lowIssues, color: { r: 59, g: 130, b: 246 } }
  ]

  issues.forEach((issue, index) => {
    const xPos = 15 + (index * cardWidth)

    // Card background
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(xPos, yPosition, cardWidth - 3, 25, 3, 3, 'F')

    // Count - large and colored
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(issue.color.r, issue.color.g, issue.color.b)
    doc.text(issue.count.toString(), xPos + (cardWidth / 2) - 1.5, yPosition + 15, { align: 'center' })

    // Label
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(issue.label, xPos + (cardWidth / 2) - 1.5, yPosition + 21, { align: 'center' })
  })

  // AI Technologies Detected
  yPosition = 180
  if (scan.findings.summary.hasAI) {
    doc.setFillColor(239, 246, 255) // Blue-50
    doc.roundedRect(15, yPosition, pageWidth - 30, 30, 3, 3, 'F')

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175) // Blue-800
    doc.text('🤖 AI Technologies Detected', 20, yPosition + 10)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(59, 130, 246) // Blue-500

    if (scan.findings.detectedTech.aiProviders.length > 0) {
      doc.text(`AI Providers: ${scan.findings.detectedTech.aiProviders.join(', ')}`, 20, yPosition + 18)
    }

    if (scan.findings.detectedTech.chatWidgets.length > 0) {
      doc.text(`Chat Widgets: ${scan.findings.detectedTech.chatWidgets.join(', ')}`, 20, yPosition + 24)
    }

    yPosition += 35
  }

  // ===== PAGE 2+: FINDINGS DETAILS =====
  doc.addPage()
  yPosition = 20

  // Page header
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, pageWidth, 15, 'F')
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Security Findings Details', 15, 10)

  yPosition = 25
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Detailed Security Analysis', 15, yPosition)
  yPosition += 12

  // Findings with colored cards
  scan.findings.findings.forEach((finding, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage()

      // Page header on new page
      doc.setFillColor(30, 64, 175)
      doc.rect(0, 0, pageWidth, 15, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('Security Findings Details (continued)', 15, 10)

      yPosition = 25
    }

    const severityColor = getSeverityColor(finding.severity)

    // Finding card with colored left border
    doc.setDrawColor(severityColor.border.r, severityColor.border.g, severityColor.border.b)
    doc.setLineWidth(3)
    doc.line(15, yPosition, 15, yPosition + 35)

    doc.setFillColor(severityColor.bg.r, severityColor.bg.g, severityColor.bg.b)
    doc.roundedRect(17, yPosition, pageWidth - 32, 35, 3, 3, 'F')

    // Finding number and title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(`${index + 1}. ${finding.title}`, 22, yPosition + 8)

    // Severity badge
    doc.setFillColor(severityColor.badge.r, severityColor.badge.g, severityColor.badge.b)
    doc.roundedRect(pageWidth - 45, yPosition + 3, 28, 8, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(finding.severity.toUpperCase(), pageWidth - 31, yPosition + 8, { align: 'center' })

    // Description
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105) // Slate-600
    const descLines = doc.splitTextToSize(finding.description, pageWidth - 50)
    doc.text(descLines, 22, yPosition + 15)

    // Recommendation label
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('→ Recommendation:', 22, yPosition + 25)

    // Recommendation text
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    const recLines = doc.splitTextToSize(finding.recommendation, pageWidth - 60)
    doc.text(recLines, 27, yPosition + 30)

    yPosition += 40
  })

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Footer background
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(
      'Generated by AI Security Scanner',
      15,
      pageHeight - 7
    )
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 15,
      pageHeight - 7,
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

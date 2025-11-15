import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        aiTrustScorecard: true, // Include AI Trust Scorecard (1:1 relation)
      },
    })

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const response = {
      ...scan,
      detectedTech: scan.detectedTech ? JSON.parse(scan.detectedTech) : null,
      findings: scan.findings ? JSON.parse(scan.findings) : null,
      metadata: scan.metadata ? JSON.parse(scan.metadata) : null,

      // Parse AI Trust Scorecard JSON fields
      aiTrustScorecard: scan.aiTrustScorecard ? {
        ...scan.aiTrustScorecard,
        categoryScores: scan.aiTrustScorecard.categoryScores
          ? JSON.parse(scan.aiTrustScorecard.categoryScores)
          : null,
        evidenceData: scan.aiTrustScorecard.evidenceData
          ? JSON.parse(scan.aiTrustScorecard.evidenceData)
          : null,
        detailedChecks: scan.aiTrustScorecard.detailedChecks
          ? JSON.parse(scan.aiTrustScorecard.detailedChecks)
          : null,
        summary: scan.aiTrustScorecard.summary
          ? JSON.parse(scan.aiTrustScorecard.summary)
          : null,
      } : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Scan fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete scan (cascade will delete related records)
    await prisma.scan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Scan deleted successfully' })
  } catch (error) {
    console.error('Scan delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scan' },
      { status: 500 }
    )
  }
}

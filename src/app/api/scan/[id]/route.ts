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

    // PostgreSQL returns JSONB as objects, no parsing needed
    // SQLite returned strings, so check if already parsed
    const response = {
      ...scan,
      detectedTech: typeof scan.detectedTech === 'string' ? JSON.parse(scan.detectedTech) : scan.detectedTech,
      findings: typeof scan.findings === 'string' ? JSON.parse(scan.findings) : scan.findings,
      metadata: typeof scan.metadata === 'string' ? JSON.parse(scan.metadata) : scan.metadata,

      // AI Trust Scorecard JSON fields
      aiTrustScorecard: scan.aiTrustScorecard ? {
        ...scan.aiTrustScorecard,
        categoryScores: typeof scan.aiTrustScorecard.categoryScores === 'string'
          ? JSON.parse(scan.aiTrustScorecard.categoryScores)
          : scan.aiTrustScorecard.categoryScores,
        evidenceData: typeof scan.aiTrustScorecard.evidenceData === 'string'
          ? JSON.parse(scan.aiTrustScorecard.evidenceData)
          : scan.aiTrustScorecard.evidenceData,
        detailedChecks: typeof scan.aiTrustScorecard.detailedChecks === 'string'
          ? JSON.parse(scan.aiTrustScorecard.detailedChecks)
          : scan.aiTrustScorecard.detailedChecks,
        summary: typeof scan.aiTrustScorecard.summary === 'string'
          ? JSON.parse(scan.aiTrustScorecard.summary)
          : scan.aiTrustScorecard.summary,
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

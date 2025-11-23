import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/s/:scanNumber/:domain-slug
 *
 * Fetches FULL scan data by scanNumber (primary key) with optional domain slug validation
 * This is the PRIMARY API endpoint - consistent with the /s/ frontend route
 *
 * Example: /api/s/342/reddit-com
 * - Uses scanNumber as PRIMARY KEY (unambiguous)
 * - Domain slug is optional validation (SEO-friendly)
 * - Returns COMPLETE scan data (findings, metadata, AI Trust Scorecard, etc.)
 *
 * Returns:
 * - 200: Full scan data (same as /api/scan/[uuid])
 * - 301: Redirect if slug is wrong but scanNumber exists
 * - 404: Scan not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanNumber: string; domain: string }> }
) {
  try {
    const { scanNumber, domain: domainSlug } = await params
    const scanNumberInt = parseInt(scanNumber, 10)

    if (isNaN(scanNumberInt)) {
      return NextResponse.json(
        { error: 'Invalid scan number' },
        { status: 400 }
      )
    }

    // Lookup scan by scanNumber (PRIMARY KEY - unambiguous)
    const scan = await prisma.scan.findFirst({
      where: {
        scanNumber: scanNumberInt,
      },
      include: {
        aiTrustScorecard: true,
      },
    })

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    // Validate domain slug (optional - for SEO/validation)
    // Convert domain to slug: "oikos-international.org" -> "oikos-international-org"
    const expectedSlug = scan.domain?.toLowerCase().replace(/\./g, '-') || ''

    // If slug doesn't match, return 301 redirect to correct URL
    if (scan.domain && domainSlug !== expectedSlug) {
      const correctUrl = `/s/${scanNumberInt}/${expectedSlug}`
      return NextResponse.redirect(new URL(correctUrl, request.url), 301)
    }

    // Return FULL scan data (same as /api/scan/[id])
    // PostgreSQL returns JSONB as objects, no parsing needed
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
    console.error('Error fetching scan by scanNumber/domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

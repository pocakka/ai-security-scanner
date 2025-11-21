import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/s/:scanNumber/:domain-slug
 *
 * Fetches a scan by scanNumber (primary key) with optional domain slug validation
 *
 * Example: /api/s/342/reddit-com
 * - Uses scanNumber as PRIMARY KEY (unambiguous)
 * - Domain slug is optional validation (SEO-friendly)
 * - No conversion needed - just lowercase domain as-is
 *
 * Returns:
 * - 200: { id: "uuid", scanNumber: 342, domain: "reddit.com", ... }
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
    const expectedSlug = scan.domain.toLowerCase().replace(/\./g, '-')

    // If slug doesn't match, return 301 redirect to correct URL
    if (domainSlug !== expectedSlug) {
      const correctUrl = `/s/${scanNumberInt}/${expectedSlug}`
      return NextResponse.redirect(new URL(correctUrl, request.url), 301)
    }

    // Return scan data (minimal - just need the UUID for redirect)
    return NextResponse.json({
      id: scan.id,
      scanNumber: scan.scanNumber,
      domain: scan.domain,
      url: scan.url,
    })
  } catch (error) {
    console.error('Error fetching scan by scanNumber/domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

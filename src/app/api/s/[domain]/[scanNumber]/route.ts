import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/s/:domain/:scanNumber
 *
 * Fetches a scan by domain and scanNumber (SEO-friendly lookup)
 *
 * Example: /api/s/reddit-com/342
 * - Converts slug to domain: reddit-com -> reddit.com
 * - Looks up scan by domain + scanNumber
 *
 * Returns:
 * - 200: { id: "uuid", scanNumber: 342, domain: "reddit.com", ... }
 * - 404: Scan not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string; scanNumber: string }> }
) {
  try {
    const { domain: domainSlug, scanNumber } = await params
    const scanNumberInt = parseInt(scanNumber, 10)

    if (isNaN(scanNumberInt)) {
      return NextResponse.json(
        { error: 'Invalid scan number' },
        { status: 400 }
      )
    }

    // Convert domain slug back to domain: reddit-com -> reddit.com
    const domain = domainSlug.replace(/-/g, '.')

    // Lookup scan by domain + scanNumber
    const scan = await prisma.scan.findFirst({
      where: {
        domain: domain,
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

    // Return scan data (minimal - just need the UUID for redirect)
    return NextResponse.json({
      id: scan.id,
      scanNumber: scan.scanNumber,
      domain: scan.domain,
      url: scan.url,
    })
  } catch (error) {
    console.error('Error fetching scan by domain/scanNumber:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

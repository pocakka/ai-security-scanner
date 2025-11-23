import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/scan/by-domain/:domain/:scanNumber
 *
 * Fetches a scan by domain and scanNumber (SEO-friendly lookup)
 *
 * Example: /api/scan/by-domain/openai.com/342
 *
 * Returns:
 * - 200: { id: "uuid", scanNumber: 342, domain: "openai.com", ... }
 * - 404: Scan not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string; scanNumber: string }> }
) {
  try {
    const { domain, scanNumber } = await params
    const scanNumberInt = parseInt(scanNumber, 10)

    if (isNaN(scanNumberInt)) {
      return NextResponse.json(
        { error: 'Invalid scan number' },
        { status: 400 }
      )
    }

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

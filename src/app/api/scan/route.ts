import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const ScanRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = ScanRequestSchema.parse(body)

    // Normalize URL
    const urlObj = new URL(url)
    const normalizedUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
    const domain = urlObj.hostname

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        url: normalizedUrl,
        domain,
        status: 'PENDING',
      },
    })

    // TODO: Queue the scan job (later)
    console.log('[API] Scan created:', scan.id)

    return NextResponse.json(
      { scanId: scan.id, message: 'Scan queued successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Scan creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test GET endpoint
export async function GET() {
  try {
    const scans = await prisma.scan.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ scans })
  } catch (error) {
    console.error('Scan fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

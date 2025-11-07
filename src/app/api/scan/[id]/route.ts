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

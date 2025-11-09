import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Fetch scans
    const scans = await prisma.scan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Fetch leads with scan data
    const leads = await prisma.lead.findMany({
      include: {
        scan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ scans, leads }, { status: 200 })
  } catch (error) {
    console.error('[Admin Data] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    )
  }
}

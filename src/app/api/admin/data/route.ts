import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Get pagination params from URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '200')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Build where clause for status filter
    const whereClause = status && status !== 'ALL' ? { status } : {}

    // Get total counts for pagination
    const [totalScans, totalLeads] = await Promise.all([
      prisma.scan.count({ where: whereClause }),
      prisma.lead.count()
    ])

    // Fetch scans with pagination and optional status filter
    const scans = await prisma.scan.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Fetch leads with scan data
    const leads = await prisma.lead.findMany({
      include: {
        scan: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return NextResponse.json({
      scans,
      leads,
      pagination: {
        page,
        limit,
        totalScans,
        totalLeads,
        totalPages: Math.ceil(Math.max(totalScans, totalLeads) / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('[Admin Data] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    )
  }
}

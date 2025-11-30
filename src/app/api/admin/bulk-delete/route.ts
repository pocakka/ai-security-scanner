import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { status } = await request.json()

    if (!status || !['PENDING', 'FAILED', 'SCANNING'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, FAILED, or SCANNING' },
        { status: 400 }
      )
    }

    // Delete from Job table first (has FK to Scan)
    const jobsDeleted = await prisma.job.deleteMany({
      where: {
        status: status === 'SCANNING' ? 'PROCESSING' : status,
      },
    })

    // Delete from Scan table
    const scansDeleted = await prisma.scan.deleteMany({
      where: {
        status: status,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${scansDeleted.count} ${status} scans and ${jobsDeleted.count} jobs`,
      scansDeleted: scansDeleted.count,
      jobsDeleted: jobsDeleted.count,
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    )
  }
}

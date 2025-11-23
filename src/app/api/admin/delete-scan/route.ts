import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(request: Request) {
  try {
    const { scanIds } = await request.json()

    if (!scanIds || !Array.isArray(scanIds) || scanIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid scan IDs' },
        { status: 400 }
      )
    }

    // Delete scans (cascade will handle related records)
    await prisma.scan.deleteMany({
      where: {
        id: {
          in: scanIds,
        },
      },
    })

    return NextResponse.json(
      { success: true, deleted: scanIds.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Delete Scan] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scans' },
      { status: 500 }
    )
  }
}

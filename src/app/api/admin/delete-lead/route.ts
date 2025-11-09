import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(request: Request) {
  try {
    const { leadIds } = await request.json()

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lead IDs' },
        { status: 400 }
      )
    }

    // Delete leads
    await prisma.lead.deleteMany({
      where: {
        id: {
          in: leadIds,
        },
      },
    })

    return NextResponse.json(
      { success: true, deleted: leadIds.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Admin Delete Lead] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete leads' },
      { status: 500 }
    )
  }
}

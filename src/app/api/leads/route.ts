import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const leadSchema = z.object({
  scanId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scanId, email, name } = leadSchema.parse(body)

    // Check if scan exists
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    })

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        scanId,
        email,
        name,
        status: 'NEW',
      },
    })

    console.log('✅ Lead captured:', { id: lead.id, email: lead.email, name: lead.name })

    return NextResponse.json({
      success: true,
      leadId: lead.id,
    })
  } catch (error) {
    console.error('❌ Lead capture error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET all leads (for admin)
export async function GET(request: NextRequest) {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        scan: {
          select: {
            url: true,
            riskScore: true,
            riskLevel: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('❌ Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

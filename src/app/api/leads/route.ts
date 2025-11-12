import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { sendLeadCaptureEmail } from '@/lib/email-service'

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
        lifecycleStage: 'LEAD',
        source: 'organic',
      },
    })

    console.log('✅ Lead captured:', { id: lead.id, email: lead.email, name: lead.name })

    // Send email notification (localhost: saves to file)
    if (scan.status === 'COMPLETED' && scan.findings) {
      try {
        const findings = JSON.parse(scan.findings)
        await sendLeadCaptureEmail({
          leadName: name,
          leadEmail: email,
          scanId,
          scanUrl: scan.url,
          domain: scan.domain || new URL(scan.url).hostname,
          riskScore: findings.summary?.riskScore?.score || 0,
          riskLevel: findings.summary?.riskScore?.level || 'UNKNOWN',
          grade: findings.summary?.riskScore?.grade || 'N/A',
          criticalIssues: findings.summary?.criticalIssues || 0,
          highIssues: findings.summary?.highIssues || 0,
        })
      } catch (emailError) {
        console.error('⚠️  Email send failed (non-fatal):', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
    })
  } catch (error) {
    console.error('❌ Lead capture error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
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

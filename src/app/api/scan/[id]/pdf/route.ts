import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePDFReport } from '@/lib/pdf-generator'

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

    if (scan.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Scan not completed yet' },
        { status: 400 }
      )
    }

    // No need to parse - PostgreSQL JSONB fields are already objects
    const scanData = {
      ...scan,
      detectedTech: scan.detectedTech || null,
      findings: scan.findings || null,
      metadata: scan.metadata || null,
    }

    // Generate PDF
    const pdf = generatePDFReport(scanData as any)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="security-report-${scan.domain || 'scan'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

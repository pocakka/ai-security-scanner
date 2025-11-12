import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { jobQueue } from '@/lib/queue-sqlite'
import { z } from 'zod'
import { spawn } from 'child_process'
import path from 'path'

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

    // Queue the scan job in SQLite
    await jobQueue.add('scan', {
      scanId: scan.id,
      url: normalizedUrl,
    })
    console.log('[API] Scan created and queued:', scan.id)

    // Auto-spawn worker for every scan
    const workerPath = path.join(process.cwd(), 'src', 'worker', 'index-sqlite.ts')
    const worker = spawn('npx', ['tsx', workerPath], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore', // Don't pipe output to avoid blocking
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV,
      },
    })

    worker.unref()
    console.log('[API] ✅ Worker spawned for scan:', scan.id)

    return NextResponse.json(
      { scanId: scan.id, message: 'Scan queued successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
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

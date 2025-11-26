import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

/**
 * DIRECT MODE API - 2016 style, no queue, no workers!
 *
 * Fire and forget - spawns standalone process immediately
 * No DNS validation, no queue, just direct processing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = body.url

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log(`[DIRECT API] 🚀 Spawning processor for ${url}`)

    // Spawn detached process (fire & forget)
    const processorPath = path.join(process.cwd(), 'src', 'worker', 'direct-processor.ts')

    const child = spawn('npx', ['tsx', processorPath, url], {
      detached: true,      // Run independently
      stdio: 'ignore',     // Don't wait for output
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner'
      }
    })

    // Unref to allow parent to exit
    child.unref()

    console.log(`[DIRECT API] ✅ Spawned PID ${child.pid} for ${url}`)

    // Immediate response (don't wait!)
    return NextResponse.json({
      message: 'Scan started in direct mode',
      url,
      pid: child.pid,
      mode: 'direct',
      timestamp: new Date().toISOString()
    }, { status: 202 }) // 202 = Accepted

  } catch (error) {
    console.error('[DIRECT API] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    )
  }
}
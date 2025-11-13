import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { prisma } from '@/lib/db'

/**
 * Trigger Worker API
 *
 * Manually spawns a worker to process PENDING jobs
 * Useful when auto-spawn fails or workers exit prematurely
 */
export async function POST(request: NextRequest) {
  try {
    // Check if there are pending jobs
    const pendingJobs = await prisma.job.count({
      where: { status: 'PENDING' },
    })

    if (pendingJobs === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No pending jobs to process',
          pendingJobs: 0,
        },
        { status: 200 }
      )
    }

    // Spawn a new worker
    const workerPath = path.join(process.cwd(), 'src', 'worker', 'index-sqlite.ts')
    const worker = spawn('npx', ['tsx', workerPath], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        USE_REAL_CRAWLER: 'true',
        NODE_ENV: process.env.NODE_ENV,
      },
    })

    worker.unref()

    console.log(`[API] ✅ Worker manually triggered for ${pendingJobs} pending jobs`)

    return NextResponse.json(
      {
        success: true,
        message: `Worker spawned to process ${pendingJobs} pending jobs`,
        pendingJobs,
        workerPid: worker.pid,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error triggering worker:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger worker',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

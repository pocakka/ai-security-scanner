import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const WORKER_POOL_DIR = '/tmp/ai-scanner-workers'
const MAX_CONCURRENT_WORKERS = parseInt(process.env.MAX_WORKERS || '5', 10)
const MAX_WORKER_RUNTIME = 5 * 60 * 1000 // 5 minutes

interface WorkerInfo {
  slot: number
  pid: number
  startTime: number
  runtime: number
  status: 'active' | 'stale'
}

/**
 * Worker Status API
 *
 * Returns current worker pool status and job queue statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get active workers
    const workers: WorkerInfo[] = []

    if (fs.existsSync(WORKER_POOL_DIR)) {
      const files = fs.readdirSync(WORKER_POOL_DIR)

      for (const file of files) {
        if (!file.startsWith('worker-') || !file.endsWith('.lock')) continue

        const slot = parseInt(file.match(/worker-(\d+)\.lock/)?.[1] || '0')
        const lockFile = path.join(WORKER_POOL_DIR, file)
        const pidFile = path.join(WORKER_POOL_DIR, `worker-${slot}.pid`)

        try {
          const lockTime = parseInt(fs.readFileSync(lockFile, 'utf-8'))
          const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'))
          const runtime = Date.now() - lockTime
          const isStale = runtime > MAX_WORKER_RUNTIME

          workers.push({
            slot,
            pid,
            startTime: lockTime,
            runtime,
            status: isStale ? 'stale' : 'active',
          })
        } catch (error) {
          // Skip invalid lock files
          continue
        }
      }
    }

    // Get job statistics
    const [pendingJobs, processingJobs, completedJobs, failedJobs] = await Promise.all([
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.job.count({ where: { status: 'PROCESSING' } }),
      prisma.job.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last 1 hour
        },
      }),
      prisma.job.count({
        where: {
          status: 'FAILED',
          updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last 1 hour
        },
      }),
    ])

    // Get scan statistics
    const [pendingScans, scanningScans, completedScans, failedScans] = await Promise.all([
      prisma.scan.count({ where: { status: 'PENDING' } }),
      prisma.scan.count({ where: { status: 'SCANNING' } }),
      prisma.scan.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
      prisma.scan.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ])

    return NextResponse.json({
      maxWorkers: MAX_CONCURRENT_WORKERS,
      activeWorkers: workers.filter(w => w.status === 'active').length,
      staleWorkers: workers.filter(w => w.status === 'stale').length,
      availableSlots: MAX_CONCURRENT_WORKERS - workers.filter(w => w.status === 'active').length,
      workers: workers.sort((a, b) => a.slot - b.slot),
      queue: {
        pending: pendingJobs,
        processing: processingJobs,
        completedLastHour: completedJobs,
        failedLastHour: failedJobs,
      },
      scans: {
        pending: pendingScans,
        scanning: scanningScans,
        completedLastHour: completedScans,
        failedLastHour: failedScans,
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[API] Error getting worker status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get worker status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

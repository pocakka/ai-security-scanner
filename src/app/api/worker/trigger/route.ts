/**
 * Worker Trigger API Endpoint
 *
 * Manual worker restart for admin dashboard
 * Spawns a new worker process to process pending scans
 */

import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Check for pending scans
    const pendingCount = await prisma.scan.count({
      where: {
        status: 'PENDING',
      },
    })

    const scanningCount = await prisma.scan.count({
      where: {
        status: 'SCANNING',
      },
    })

    // If no pending scans, return early
    if (pendingCount === 0 && scanningCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No pending scans to process',
        stats: {
          pending: pendingCount,
          scanning: scanningCount,
        },
      })
    }

    // Calculate how many workers to spawn
    // Max 5 concurrent workers (worker pool limit), minus already scanning
    const MAX_WORKERS = 5
    const workersToSpawn = Math.min(pendingCount, MAX_WORKERS - scanningCount, MAX_WORKERS)

    if (workersToSpawn <= 0) {
      return NextResponse.json({
        success: false,
        message: `Worker pool full (${scanningCount} scans already scanning, max ${MAX_WORKERS})`,
        stats: {
          pending: pendingCount,
          scanning: scanningCount,
        },
      })
    }

    // Spawn multiple worker processes to process ALL pending scans
    const workerPids: number[] = []
    for (let i = 0; i < workersToSpawn; i++) {
      const workerProcess = spawn('npm', ['run', 'worker'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          USE_REAL_CRAWLER: 'true',
        },
        detached: true,
        stdio: 'ignore',
      })

      // Detach process so it runs independently
      workerProcess.unref()

      if (workerProcess.pid) {
        workerPids.push(workerProcess.pid)
      }

      // Small delay between spawns to avoid race conditions
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    console.log(`[WorkerTrigger] ✅ Spawned ${workerPids.length} workers: ${workerPids.join(', ')}`)
    console.log(`[WorkerTrigger] 📊 Pending: ${pendingCount}, Scanning: ${scanningCount}`)

    return NextResponse.json({
      success: true,
      message: `Started ${workerPids.length} worker(s) to process ${pendingCount} pending scan(s).`,
      stats: {
        pending: pendingCount,
        scanning: scanningCount,
        workersSpawned: workerPids.length,
        workerPids,
      },
    })
  } catch (error) {
    console.error('[WorkerTrigger] ❌ Error starting worker:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start worker',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check worker status
export async function GET(request: Request) {
  try {
    const stats = await prisma.scan.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      stats: {
        pending: statusCounts['PENDING'] || 0,
        scanning: statusCounts['SCANNING'] || 0,
        completed: statusCounts['COMPLETED'] || 0,
        failed: statusCounts['FAILED'] || 0,
      },
    })
  } catch (error) {
    console.error('[WorkerTrigger] ❌ Error getting stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get worker stats',
      },
      { status: 500 }
    )
  }
}

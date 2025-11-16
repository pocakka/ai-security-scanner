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

    // Spawn worker process
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

    console.log(`[WorkerTrigger] ✅ Worker spawned with PID: ${workerProcess.pid}`)
    console.log(`[WorkerTrigger] 📊 Pending: ${pendingCount}, Scanning: ${scanningCount}`)

    return NextResponse.json({
      success: true,
      message: `Worker started successfully. Processing ${pendingCount} pending scan(s).`,
      stats: {
        pending: pendingCount,
        scanning: scanningCount,
        workerPid: workerProcess.pid,
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

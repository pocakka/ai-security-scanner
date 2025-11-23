/**
 * SQLite-based Job Queue
 *
 * Persistent queue using SQLite database (via Prisma)
 * Replaces in-memory queue for proper process isolation
 */

import { prisma } from './db'

export interface ScanJobData {
  scanId: string
  url: string
}

export class SQLiteQueue {
  /**
   * Add a new job to the queue
   */
  async add(type: string, data: any): Promise<string> {
    const job = await prisma.job.create({
      data: {
        type,
        data: JSON.stringify(data),
        status: 'PENDING',
      },
    })

    console.log(`[Queue] Job ${job.id} added to SQLite queue (type: ${type})`)

    return job.id
  }

  /**
   * Get next pending job (for worker processing)
   */
  async getNext(): Promise<{ id: string; type: string; data: any } | null> {
    // Find oldest pending job
    const job = await prisma.job.findFirst({
      where: {
        status: 'PENDING',
        attempts: {
          lt: prisma.job.fields.maxAttempts, // attempts < maxAttempts
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (!job) {
      return null
    }

    // Mark as processing
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attempts: {
          increment: 1,
        },
      },
    })

    return {
      id: job.id,
      type: job.type,
      data: JSON.parse(job.data),
    }
  }

  /**
   * Mark job as completed
   */
  async complete(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    console.log(`[Queue] Job ${jobId} marked as COMPLETED`)
  }

  /**
   * Mark job as failed
   */
  async fail(jobId: string, error: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) return

    // If max attempts reached, mark as FAILED
    // Otherwise, back to PENDING for retry
    const status = job.attempts >= job.maxAttempts ? 'FAILED' : 'PENDING'

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        error,
        ...(status === 'FAILED' && { completedAt: new Date() }),
      },
    })

    console.log(`[Queue] Job ${jobId} marked as ${status} (${error})`)
  }

  /**
   * Clean up old completed/failed jobs (optional maintenance)
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.job.deleteMany({
      where: {
        status: {
          in: ['COMPLETED', 'FAILED'],
        },
        completedAt: {
          lt: cutoffDate,
        },
      },
    })

    if (result.count > 0) {
      console.log(`[Queue] Cleaned up ${result.count} old jobs`)
    }

    return result.count
  }
}

// Singleton instance
export const jobQueue = new SQLiteQueue()

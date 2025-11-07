// Simple in-memory queue for local development (no Redis needed)

interface Job<T> {
  id: string
  data: T
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface ScanJobData {
  scanId: string
  url: string
}

class SimpleQueue<T> {
  private jobs: Map<string, Job<T>> = new Map()
  private processorFn: ((data: T) => Promise<void>) | null = null

  async add(id: string, data: T): Promise<void> {
    this.jobs.set(id, {
      id,
      data,
      status: 'pending',
    })

    console.log(`[Queue] Job ${id} added to queue`)

    // Auto-process immediately (in-process for local dev)
    if (this.processorFn) {
      setTimeout(() => this.processNext(), 100)
    }
  }

  process(fn: (data: T) => Promise<void>): void {
    this.processorFn = fn
    console.log('[Queue] Processor registered')
  }

  private async processNext(): Promise<void> {
    // Find next pending job
    const pendingJob = Array.from(this.jobs.values()).find(
      (job) => job.status === 'pending'
    )

    if (!pendingJob || !this.processorFn) {
      return
    }

    // Mark as processing
    pendingJob.status = 'processing'
    console.log(`[Queue] Processing job ${pendingJob.id}`)

    try {
      await this.processorFn(pendingJob.data)
      pendingJob.status = 'completed'
      console.log(`[Queue] Job ${pendingJob.id} completed`)
    } catch (error) {
      pendingJob.status = 'failed'
      pendingJob.error = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Queue] Job ${pendingJob.id} failed:`, error)
    }

    // Process next job
    setTimeout(() => this.processNext(), 100)
  }

  getJob(id: string): Job<T> | undefined {
    return this.jobs.get(id)
  }

  getAllJobs(): Job<T>[] {
    return Array.from(this.jobs.values())
  }
}

// Global queue instance
export const scanQueue = new SimpleQueue<ScanJobData>()

// Helper function to add scan to queue
export async function queueScan(scanId: string, url: string): Promise<void> {
  await scanQueue.add(scanId, { scanId, url })
}

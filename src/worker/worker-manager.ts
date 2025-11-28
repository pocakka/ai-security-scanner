/**
 * Worker Manager - Worker Pool with configurable concurrency
 *
 * Supports multiple concurrent workers for parallel scan processing
 */

import fs from 'fs'
import path from 'path'

// Configuration: Max concurrent workers (configurable via env var)
const MAX_CONCURRENT_WORKERS = parseInt(process.env.MAX_WORKERS || '40', 10) // Default: 40 workers (optimized for i9 24-core)
const WORKER_POOL_DIR = '/tmp/ai-scanner-workers'
const MAX_WORKER_RUNTIME = 5 * 60 * 1000 // 5 minutes max runtime per job

// Ensure worker pool directory exists
if (!fs.existsSync(WORKER_POOL_DIR)) {
  fs.mkdirSync(WORKER_POOL_DIR, { recursive: true })
}

export class WorkerManager {
  private static instance: WorkerManager
  private isRunning = false
  private startTime: number
  private jobTimeout: NodeJS.Timeout | null = null
  private workerSlot: number | null = null // Which slot this worker is using

  private constructor() {
    this.startTime = Date.now()
    this.setupCleanupHandlers()
  }

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager()
    }
    return WorkerManager.instance
  }

  /**
   * Get count of active workers
   */
  private getActiveWorkerCount(): number {
    try {
      const files = fs.readdirSync(WORKER_POOL_DIR)
      let activeCount = 0

      for (const file of files) {
        if (!file.startsWith('worker-') || !file.endsWith('.pid')) continue

        const pidFile = path.join(WORKER_POOL_DIR, file)
        const lockFile = pidFile.replace('.pid', '.lock')

        // Check if lock file exists and is fresh
        if (fs.existsSync(lockFile)) {
          const lockData = fs.readFileSync(lockFile, 'utf-8')
          const lockTime = parseInt(lockData)
          const now = Date.now()

          // If lock is fresh (< 5 minutes), count as active
          if (now - lockTime < MAX_WORKER_RUNTIME) {
            activeCount++
          } else {
            // Stale lock, clean it up
            this.cleanupSlot(parseInt(file.match(/worker-(\d+)\.pid/)?.[1] || '0'))
          }
        }
      }

      return activeCount
    } catch (error) {
      console.error('[WorkerManager] Error counting active workers:', error)
      return 0
    }
  }

  /**
   * Check if a process is still running
   */
  private isProcessAlive(pid: number): boolean {
    try {
      // Sending signal 0 checks if process exists without killing it
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }

  /**
   * Find available worker slot (1-MAX_CONCURRENT_WORKERS)
   */
  private findAvailableSlot(): number | null {
    for (let slot = 1; slot <= MAX_CONCURRENT_WORKERS; slot++) {
      const pidFile = path.join(WORKER_POOL_DIR, `worker-${slot}.pid`)
      const lockFile = path.join(WORKER_POOL_DIR, `worker-${slot}.lock`)

      // Check if slot is free (no lock file)
      if (!fs.existsSync(lockFile)) {
        return slot
      }

      // Check if the process that owns this slot is still alive
      if (fs.existsSync(pidFile)) {
        try {
          const storedPid = parseInt(fs.readFileSync(pidFile, 'utf-8'))
          if (!this.isProcessAlive(storedPid)) {
            // Process is dead, clean up and use this slot
            console.log(`[WorkerManager] Slot ${slot} has dead PID ${storedPid}, reclaiming...`)
            this.cleanupSlot(slot)
            return slot
          }
        } catch {
          // Error reading PID file, clean up and use slot
          this.cleanupSlot(slot)
          return slot
        }
      }

      // Check if lock is stale (>5 minutes old)
      try {
        const lockData = fs.readFileSync(lockFile, 'utf-8')
        const lockTime = parseInt(lockData)
        const now = Date.now()

        if (now - lockTime > MAX_WORKER_RUNTIME) {
          // Stale lock, clean it up and use this slot
          console.log(`[WorkerManager] Slot ${slot} lock expired, reclaiming...`)
          this.cleanupSlot(slot)
          return slot
        }
      } catch {
        // Error reading lock, assume slot is available
        return slot
      }
    }

    return null // No available slots
  }

  /**
   * Check if we can start a new worker
   */
  async checkExistingWorker(): Promise<boolean> {
    try {
      const activeCount = this.getActiveWorkerCount()
      console.log(`[WorkerManager] Active workers: ${activeCount}/${MAX_CONCURRENT_WORKERS}`)

      if (activeCount >= MAX_CONCURRENT_WORKERS) {
        console.log('[WorkerManager] Worker pool is full, cannot start new worker')
        return true // Pool is full
      }

      return false // Can start new worker
    } catch (error) {
      console.error('[WorkerManager] Error checking existing workers:', error)
      return false
    }
  }

  /**
   * Start worker with lock
   */
  async start(): Promise<boolean> {
    // Check if pool is full
    if (await this.checkExistingWorker()) {
      console.log('[WorkerManager] Worker pool is full - exiting')
      process.exit(0)
    }

    try {
      // Find available slot
      const slot = this.findAvailableSlot()
      if (slot === null) {
        console.log('[WorkerManager] No available worker slots - exiting')
        process.exit(0)
      }

      this.workerSlot = slot

      const pidFile = path.join(WORKER_POOL_DIR, `worker-${slot}.pid`)
      const lockFile = path.join(WORKER_POOL_DIR, `worker-${slot}.lock`)

      // Create lock file with timestamp
      fs.writeFileSync(lockFile, Date.now().toString())

      // Save PID
      fs.writeFileSync(pidFile, process.pid.toString())

      this.isRunning = true
      console.log(`[WorkerManager] Worker #${slot} started with PID ${process.pid} (${this.getActiveWorkerCount()}/${MAX_CONCURRENT_WORKERS} active)`)

      // Set maximum runtime timeout
      this.jobTimeout = setTimeout(() => {
        console.log('[WorkerManager] Maximum runtime exceeded, shutting down...')
        this.shutdown()
      }, MAX_WORKER_RUNTIME)

      return true
    } catch (error) {
      console.error('[WorkerManager] Failed to start worker:', error)
      return false
    }
  }

  /**
   * Clean up specific worker slot
   */
  private cleanupSlot(slot: number): void {
    try {
      const pidFile = path.join(WORKER_POOL_DIR, `worker-${slot}.pid`)
      const lockFile = path.join(WORKER_POOL_DIR, `worker-${slot}.lock`)

      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile)
      }
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile)
      }
    } catch (error) {
      console.error(`[WorkerManager] Error cleaning up slot ${slot}:`, error)
    }
  }

  /**
   * Clean up lock and PID files for this worker
   */
  cleanup(): void {
    try {
      if (this.workerSlot !== null) {
        this.cleanupSlot(this.workerSlot)
        console.log(`[WorkerManager] Cleanup completed for worker #${this.workerSlot}`)
      }
    } catch (error) {
      console.error('[WorkerManager] Cleanup error:', error)
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[WorkerManager] Shutting down worker...')

    if (this.jobTimeout) {
      clearTimeout(this.jobTimeout)
    }

    this.isRunning = false
    this.cleanup()

    // Give time for any pending operations
    setTimeout(() => {
      process.exit(0)
    }, 1000)
  }

  /**
   * Setup signal handlers for cleanup
   */
  private setupCleanupHandlers(): void {
    // Handle process termination
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT']

    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`[WorkerManager] Received ${signal}, shutting down...`)
        await this.shutdown()
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('[WorkerManager] Uncaught exception:', error)
      this.shutdown()
    })

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[WorkerManager] Unhandled rejection:', reason)
      this.shutdown()
    })

    // Clean up on normal exit
    process.on('exit', () => {
      this.cleanup()
    })
  }

  /**
   * Mark job as complete and check if should continue
   */
  jobComplete(): void {
    const runtime = Date.now() - this.startTime
    console.log(`[WorkerManager] Job completed in ${runtime}ms`)

    // Reset timeout for next job
    if (this.jobTimeout) {
      clearTimeout(this.jobTimeout)
      this.jobTimeout = setTimeout(() => {
        console.log('[WorkerManager] No new jobs for 5 minutes, shutting down...')
        this.shutdown()
      }, MAX_WORKER_RUNTIME)
    }
  }

  /**
   * Refresh lock timestamp to show we're alive
   * Called after each job to prevent watchdog from killing us
   */
  refreshLock(): void {
    if (this.workerSlot === null) return

    try {
      const lockFile = path.join(WORKER_POOL_DIR, `worker-${this.workerSlot}.lock`)
      fs.writeFileSync(lockFile, Date.now().toString())
    } catch (error) {
      // Ignore errors - not critical
    }
  }

  /**
   * Check if worker should continue running
   */
  shouldContinue(): boolean {
    return this.isRunning
  }
}

export default WorkerManager
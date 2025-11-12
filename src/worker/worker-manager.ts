/**
 * Worker Manager - Prevents multiple workers and handles automatic cleanup
 */

import fs from 'fs'
import path from 'path'

const PID_FILE = '/tmp/ai-scanner-worker.pid'
const LOCK_FILE = '/tmp/ai-scanner-worker.lock'
const MAX_WORKER_RUNTIME = 5 * 60 * 1000 // 5 minutes max runtime per job

export class WorkerManager {
  private static instance: WorkerManager
  private isRunning = false
  private startTime: number
  private jobTimeout: NodeJS.Timeout | null = null

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
   * Check if another worker is already running
   */
  async checkExistingWorker(): Promise<boolean> {
    try {
      // Check lock file
      if (fs.existsSync(LOCK_FILE)) {
        const lockData = fs.readFileSync(LOCK_FILE, 'utf-8')
        const lockTime = parseInt(lockData)
        const now = Date.now()

        // If lock is older than 5 minutes, it's probably stale
        if (now - lockTime > MAX_WORKER_RUNTIME) {
          console.log('[WorkerManager] Stale lock detected, removing...')
          this.cleanup()
          return false
        }

        console.log('[WorkerManager] Another worker is already running')
        return true
      }

      // Check PID file
      if (fs.existsSync(PID_FILE)) {
        const pid = fs.readFileSync(PID_FILE, 'utf-8').trim()
        try {
          // Check if process is still running
          process.kill(parseInt(pid), 0)
          console.log(`[WorkerManager] Worker with PID ${pid} is already running`)
          return true
        } catch {
          // Process not running, clean up
          console.log(`[WorkerManager] Previous worker (PID ${pid}) not running, cleaning up`)
          this.cleanup()
          return false
        }
      }

      return false
    } catch (error) {
      console.error('[WorkerManager] Error checking existing worker:', error)
      return false
    }
  }

  /**
   * Start worker with lock
   */
  async start(): Promise<boolean> {
    // Check if another worker is running
    if (await this.checkExistingWorker()) {
      console.log('[WorkerManager] Exiting - another worker is active')
      process.exit(0)
    }

    try {
      // Create lock file
      fs.writeFileSync(LOCK_FILE, Date.now().toString())

      // Save PID
      fs.writeFileSync(PID_FILE, process.pid.toString())

      this.isRunning = true
      console.log(`[WorkerManager] Worker started with PID ${process.pid}`)

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
   * Clean up lock and PID files
   */
  cleanup(): void {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE)
      }
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE)
      }
      console.log('[WorkerManager] Cleanup completed')
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
   * Check if worker should continue running
   */
  shouldContinue(): boolean {
    return this.isRunning
  }
}

export default WorkerManager
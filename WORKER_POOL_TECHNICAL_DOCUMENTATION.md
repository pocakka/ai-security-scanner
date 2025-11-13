# Worker Pool - Technical Documentation

**Author:** AI Security Scanner Team
**Date:** 2025-11-13
**Version:** 1.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Issues](#current-issues)
3. [How Workers Are Spawned](#how-workers-are-spawned)
4. [Job Queue System](#job-queue-system)
5. [Worker Lifecycle](#worker-lifecycle)
6. [Lock Mechanism](#lock-mechanism)
7. [Problems & Solutions](#problems--solutions)
8. [Monitoring Dashboard](#monitoring-dashboard)
9. [Configuration](#configuration)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│                                                               │
│  POST /api/scan → Creates scan record + Job in SQLite       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTE (route.ts)                    │
│                                                               │
│  1. Validates domain                                         │
│  2. Creates Scan record (status: PENDING)                   │
│  3. Creates Job record in queue                             │
│  4. AUTO-SPAWNS Worker (spawn('npx tsx worker'))  ← PROBLÉMÁS│
│                                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  WORKER MANAGER                              │
│                                                               │
│  Slot-based locking: /tmp/ai-scanner-workers/               │
│    - worker-1.lock / worker-1.pid                           │
│    - worker-2.lock / worker-2.pid                           │
│    - worker-3.lock / worker-3.pid                           │
│    - worker-4.lock / worker-4.pid                           │
│    - worker-5.lock / worker-5.pid                           │
│                                                               │
│  MAX_WORKERS=5 (default, configurable)                      │
│                                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  WORKER PROCESS                              │
│                                                               │
│  1. Checks worker pool capacity                             │
│  2. Finds available slot (1-5)                              │
│  3. Creates lock file                                       │
│  4. Polls SQLite Job table                                  │
│  5. Processes 1 job                                         │
│  6. Updates Scan status to COMPLETED/FAILED                 │
│  7. Checks for more jobs → If none: exits after 5min       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Issues

### ❌ ISSUE #1: Auto-spawn csak 1 worker-t indít

**Problem:**
```typescript
// src/app/api/scan/route.ts (line 61-73)
const worker = spawn('npx', ['tsx', workerPath], {
  cwd: process.cwd(),
  detached: true,
  stdio: 'ignore', // ← OUTPUT ELVESZIK!
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV },
})

worker.unref()
console.log('[API] ✅ Worker spawned for scan:', scan.id)
```

**Probléma:**
1. **Minden scan-hez ÚJ worker-t próbál indítani**
2. De ha már fut 1+ worker → új worker: "Worker pool is full - exiting"
3. **PENDING scanok nem indulnak el**, mert senki nem kezeli őket

**Miért történik:**
- Az API **nem látja a futó workereket**
- Minden scan-hez dumbán próbál újat indítani
- A worker induláskor látja hogy pool tele van → exit(0)

---

### ❌ ISSUE #2: PENDING scanok nem indulnak automatikusan

**Observed behavior:**
```
Scan #1 → Worker #1 indul → SCANNING → COMPLETED ✅
Scan #2 → Worker #2 indul → "Pool full" → exit(0) ❌
Scan #3 → Worker #3 indul → "Pool full" → exit(0) ❌
Scan #4 → Worker #4 indul → "Pool full" → exit(0) ❌
Scan #5 → Worker #5 indul → "Pool full" → exit(0) ❌
```

**Eredmény:**
- Scan #1: COMPLETED (worker #1 feldolgozta)
- Scan #2-5: **PENDING** (nincs worker rájuk!)

**Kézi fix működik:**
```bash
npm run worker
# Ez elindít egy új worker-t, ami végignézi a PENDING job-okat
```

---

### ❌ ISSUE #3: Worker lifecycle nem optimális

**Current behavior:**
```typescript
// Worker lifecycle:
1. Start
2. Check if pool is full → IF YES: exit(0) ← ROSSZ!
3. Find available slot
4. Poll for 1 job
5. Process job
6. Poll again → IF NO JOBS: wait 5min → exit
```

**Probléma:**
- Ha pool tele van → worker azonnal kilép
- **NEM várja meg amíg felszabadul egy slot!**
- Ez pazarlás, mert a worker már elindult (költséges művelet)

**Kellene:**
```typescript
1. Start
2. WAIT for available slot (max 30s timeout)
3. Acquire slot
4. Process jobs in loop
5. Release slot
6. Exit
```

---

## How Workers Are Spawned

### Method 1: Auto-spawn (API route)

**Location:** `src/app/api/scan/route.ts` (line 61-74)

```typescript
// EVERY scan creation triggers this
const workerPath = path.join(process.cwd(), 'src', 'worker', 'index-sqlite.ts')
const worker = spawn('npx', ['tsx', workerPath], {
  cwd: process.cwd(),
  detached: true,
  stdio: 'ignore', // ← Nem látjuk a log-okat!
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV,
  },
})

worker.unref()
console.log('[API] ✅ Worker spawned for scan:', scan.id)
```

**Problems:**
1. **Dumb spawning** - nem ellenőrzi hány worker fut már
2. **stdio: 'ignore'** - nem látjuk a worker output-ot
3. **Nincs monitoring** - nem tudjuk hány worker fut aktívan

---

### Method 2: Manual spawn

```bash
# Development
npm run worker

# Production
MAX_WORKERS=10 npm run worker

# With real crawler
USE_REAL_CRAWLER=true npm run worker
```

**This works perfectly!** Miért?
- Látjuk a console output-ot
- Tudunk debuggolni
- De nem skálázódik automatikusan

---

## Job Queue System

### Database Schema

```sql
-- Job table (SQLite)
CREATE TABLE Job (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'scan'
  status TEXT NOT NULL,         -- 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  payload TEXT,                 -- JSON: { scanId, url }
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_status ON Job(status);
CREATE INDEX idx_job_created ON Job(createdAt);
```

### Queue Operations

**Add job:**
```typescript
// src/lib/queue-sqlite.ts
await jobQueue.add('scan', {
  scanId: scan.id,
  url: normalizedUrl,
})
```

**Get next job:**
```typescript
const job = await prisma.job.findFirst({
  where: { status: 'PENDING' },
  orderBy: { createdAt: 'asc' },
})
```

**Mark as processing:**
```typescript
await prisma.job.update({
  where: { id: job.id },
  data: { status: 'PROCESSING' },
})
```

**Complete job:**
```typescript
await prisma.job.update({
  where: { id: job.id },
  data: { status: 'COMPLETED' },
})
```

---

## Worker Lifecycle

### Startup Sequence

```typescript
// src/worker/index-sqlite.ts (simplified)

async function main() {
  const workerManager = WorkerManager.getInstance()

  // 1. CHECK POOL CAPACITY
  const poolFull = await workerManager.checkExistingWorker()
  if (poolFull) {
    console.log('[WorkerManager] Worker pool is full - exiting')
    process.exit(0) // ← PROBLÉMÁS!
  }

  // 2. ACQUIRE SLOT
  await workerManager.start() // Creates lock file

  // 3. POLL FOR JOBS
  while (workerManager.shouldContinue()) {
    const pendingJobs = await prisma.job.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    })

    if (pendingJobs.length === 0) {
      console.log('[Worker] 💤 No jobs found, worker shutting down...')
      break
    }

    // 4. PROCESS JOB
    for (const job of pendingJobs) {
      await processScanJob(job.payload)
    }
  }

  // 5. CLEANUP
  await workerManager.shutdown()
}
```

---

## Lock Mechanism

### Slot-based Locking

**Directory structure:**
```
/tmp/ai-scanner-workers/
  ├── worker-1.pid   # PID of worker #1
  ├── worker-1.lock  # Timestamp when locked
  ├── worker-2.pid
  ├── worker-2.lock
  ├── worker-3.pid
  ├── worker-3.lock
  ├── worker-4.pid
  ├── worker-4.lock
  ├── worker-5.pid
  └── worker-5.lock
```

### Lock File Format

**worker-N.lock:**
```
1731524789123
```
(Timestamp in milliseconds)

**worker-N.pid:**
```
12345
```
(Process ID)

### Lock Acquisition

```typescript
// src/worker/worker-manager.ts

private findAvailableSlot(): number | null {
  for (let slot = 1; slot <= MAX_CONCURRENT_WORKERS; slot++) {
    const lockFile = path.join(WORKER_POOL_DIR, `worker-${slot}.lock`)

    // Check if slot is free
    if (!fs.existsSync(lockFile)) {
      return slot
    }

    // Check if lock is stale (> 5 minutes)
    const lockData = fs.readFileSync(lockFile, 'utf-8')
    const lockTime = parseInt(lockData)
    const now = Date.now()

    if (now - lockTime > MAX_WORKER_RUNTIME) {
      // Stale lock, clean it up
      this.cleanupSlot(slot)
      return slot
    }
  }

  return null // No available slots
}
```

### Stale Lock Detection

**When is a lock considered stale?**
- Lock file timestamp > 5 minutes old
- Process with PID in worker-N.pid is not running

**Auto-cleanup:**
```typescript
if (now - lockTime > MAX_WORKER_RUNTIME) {
  // Remove stale lock files
  fs.unlinkSync(lockFile)
  fs.unlinkSync(pidFile)
  return slot // Now available
}
```

---

## Problems & Solutions

### ❌ Problem 1: PENDING jobs don't auto-start

**Root cause:**
- Auto-spawned workers exit immediately if pool is full
- No worker picks up PENDING jobs

**Solution A: Persistent Worker Pool (RECOMMENDED)**
```typescript
// Start N workers at server startup, keep them running

// src/server.ts (new file)
import { spawn } from 'child_process'

const MAX_WORKERS = parseInt(process.env.MAX_WORKERS || '5', 10)

export function startWorkerPool() {
  console.log(`[Server] Starting ${MAX_WORKERS} persistent workers...`)

  for (let i = 1; i <= MAX_WORKERS; i++) {
    const worker = spawn('npx', ['tsx', 'src/worker/index-sqlite.ts'], {
      cwd: process.cwd(),
      detached: false, // Keep attached to server
      stdio: 'inherit', // Show logs!
      env: {
        ...process.env,
        MAX_WORKERS: MAX_WORKERS.toString(),
        USE_REAL_CRAWLER: 'true',
      },
    })

    worker.on('exit', (code) => {
      console.log(`[Server] Worker #${i} exited (code ${code}), restarting...`)
      // Auto-restart dead workers
      setTimeout(() => startWorkerPool(), 5000)
    })
  }
}

// In next.config.js or server startup:
if (process.env.NODE_ENV === 'production') {
  startWorkerPool()
}
```

**Solution B: Smart Auto-spawn**
```typescript
// src/app/api/scan/route.ts

// Only spawn if active workers < MAX_WORKERS
const activeWorkerCount = getActiveWorkerCount()

if (activeWorkerCount < MAX_WORKERS) {
  // Spawn new worker
  spawn('npx', ['tsx', workerPath], { ... })
} else {
  console.log('[API] Worker pool at capacity, job will be picked up by existing workers')
}
```

**Solution C: Worker Wait Queue**
```typescript
// Worker waits for available slot instead of exiting

async function main() {
  const workerManager = WorkerManager.getInstance()

  // WAIT for slot (max 30s)
  const acquired = await workerManager.waitForSlot(30000)

  if (!acquired) {
    console.log('[Worker] Timeout waiting for slot, exiting')
    process.exit(0)
  }

  // Process jobs...
}
```

---

### ❌ Problem 2: Can't monitor active workers

**Solution: Worker Status API**

```typescript
// src/app/api/workers/status/route.ts (NEW)

import { WorkerManager } from '@/worker/worker-manager'

export async function GET() {
  const status = WorkerManager.getPoolStatus()

  return Response.json({
    maxWorkers: status.maxWorkers,
    activeWorkers: status.activeWorkers,
    availableSlots: status.availableSlots,
    workers: status.workers.map(w => ({
      slot: w.slot,
      pid: w.pid,
      startTime: w.startTime,
      runtime: Date.now() - w.startTime,
      currentJob: w.currentJob,
    })),
    pendingJobs: await getPendingJobCount(),
    processingJobs: await getProcessingJobCount(),
  })
}
```

**Dashboard integration:**
```typescript
// http://localhost:3000/aiq_belepes_mrd/dashboard

const WorkerMonitor = () => {
  const { data, mutate } = useSWR('/api/workers/status', fetcher, {
    refreshInterval: 2000, // Poll every 2s
  })

  return (
    <Card>
      <h2>Worker Pool Status</h2>
      <div>Active: {data.activeWorkers}/{data.maxWorkers}</div>
      <div>Pending Jobs: {data.pendingJobs}</div>

      <table>
        <thead>
          <tr>
            <th>Slot</th>
            <th>PID</th>
            <th>Runtime</th>
            <th>Current Job</th>
          </tr>
        </thead>
        <tbody>
          {data.workers.map(w => (
            <tr key={w.slot}>
              <td>#{w.slot}</td>
              <td>{w.pid}</td>
              <td>{formatDuration(w.runtime)}</td>
              <td>{w.currentJob || 'Idle'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
```

---

### ❌ Problem 3: stdio: 'ignore' hides worker logs

**Solution: Log to file + API endpoint**

```typescript
// Auto-spawn with logging
const logFile = `/tmp/worker-${Date.now()}.log`
const worker = spawn('npx', ['tsx', workerPath], {
  cwd: process.cwd(),
  detached: true,
  stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
})

console.log(`[API] Worker spawned, logs: ${logFile}`)
```

**Log viewer API:**
```typescript
// GET /api/workers/logs?slot=1

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slot = searchParams.get('slot')

  const logFile = `/tmp/worker-${slot}.log`
  const logs = fs.readFileSync(logFile, 'utf-8').split('\n').slice(-100)

  return Response.json({ logs })
}
```

---

## Monitoring Dashboard

### Worker Pool Dashboard

**URL:** `http://localhost:3000/aiq_belepes_mrd/dashboard`

**Features:**
1. **Worker Status Table**
   - Slot #
   - PID
   - Status (Active/Idle)
   - Runtime
   - Current Job

2. **Queue Status**
   - Pending jobs
   - Processing jobs
   - Completed (last 1h)
   - Failed (last 1h)

3. **Real-time Logs**
   - Worker console output
   - Last 100 lines per worker
   - Auto-refresh every 2s

4. **Controls**
   - Kill worker button
   - Restart worker button
   - Clear stale locks button
   - Trigger pending jobs button ← **MEGOLDÁS!**

### Implementation

```typescript
// src/app/aiq_belepes_mrd/dashboard/page.tsx (NEW)

'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

export default function WorkerDashboard() {
  const { data: status, mutate } = useSWR('/api/workers/status', fetcher, {
    refreshInterval: 2000,
  })

  const triggerPendingJobs = async () => {
    // Manually spawn a worker to pick up PENDING jobs
    await fetch('/api/workers/trigger', { method: 'POST' })
    mutate()
  }

  return (
    <div className="p-8">
      <h1>Worker Pool Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 my-4">
        <Card>
          <h3>Active Workers</h3>
          <div className="text-4xl">{status?.activeWorkers}/{status?.maxWorkers}</div>
        </Card>

        <Card>
          <h3>Pending Jobs</h3>
          <div className="text-4xl">{status?.pendingJobs}</div>
        </Card>

        <Card>
          <h3>Processing</h3>
          <div className="text-4xl">{status?.processingJobs}</div>
        </Card>
      </div>

      <button onClick={triggerPendingJobs} className="btn-primary">
        🚀 Trigger Pending Jobs
      </button>

      <WorkerTable workers={status?.workers} />
      <WorkerLogs />
    </div>
  )
}
```

---

## Configuration

### Environment Variables

```bash
# Max concurrent workers (default: 5)
MAX_WORKERS=10

# Use real Playwright crawler (default: false)
USE_REAL_CRAWLER=true

# Worker runtime limit (default: 5 minutes)
MAX_WORKER_RUNTIME=300000

# Worker pool directory (default: /tmp/ai-scanner-workers)
WORKER_POOL_DIR=/var/run/ai-scanner
```

### Production Recommendations

**Railway / Fly.io:**
```bash
MAX_WORKERS=10
USE_REAL_CRAWLER=true
NODE_ENV=production
```

**Local Development:**
```bash
MAX_WORKERS=2
USE_REAL_CRAWLER=false  # Use mock crawler
NODE_ENV=development
```

**Heavy Load:**
```bash
MAX_WORKERS=20
USE_REAL_CRAWLER=true
```

---

## Next Steps (Priority Order)

### 🔴 CRITICAL - Fix PENDING jobs not starting

**Option 1: Persistent Worker Pool (BEST)**
- Start N workers at server startup
- Workers run continuously
- Auto-restart on crash
- **Estimated time:** 30 minutes

**Option 2: Trigger API endpoint**
- Button in dashboard: "Trigger Pending Jobs"
- POST /api/workers/trigger → spawns worker
- **Estimated time:** 15 minutes

### 🟡 HIGH - Worker monitoring dashboard

- Real-time worker status
- Job queue visualization
- Worker logs viewer
- **Estimated time:** 1 hour

### 🟢 MEDIUM - Optimize worker lifecycle

- Workers wait for slot instead of exiting
- Graceful shutdown
- Health checks
- **Estimated time:** 45 minutes

---

## Summary

**Current State:**
✅ Worker Pool architecture implemented
✅ Slot-based locking works
✅ MAX_WORKERS configurable
❌ Auto-spawn creates too many workers
❌ PENDING jobs don't auto-start
❌ No monitoring dashboard

**Immediate Fix:**
```bash
# When you see PENDING jobs, manually trigger:
npm run worker

# OR add to dashboard:
POST /api/workers/trigger
```

**Long-term Solution:**
- Persistent worker pool (start at server boot)
- Monitoring dashboard
- Auto-restart on crash

---

**End of Technical Documentation**

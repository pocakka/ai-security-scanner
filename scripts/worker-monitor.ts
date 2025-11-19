#!/usr/bin/env tsx
/**
 * Worker Monitor - Tracks and enforces 1-minute timeout for all scans
 * - Monitors each domain with its worker PID
 * - Kills worker and deletes scan if exceeds 1 minute
 * - Cleans up memory and resources
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configuration
const CHECK_INTERVAL = 10000; // Check every 10 seconds
const MAX_SCAN_TIME = 60000; // 1 minute timeout
const WORKER_TRACKING = new Map<string, { workerId: string, startTime: number, url: string }>();

interface ActiveScan {
  id: string;
  url: string;
  status: string;
  createdAt: Date;
  workerId?: string;
}

/**
 * Kill a worker process and all its children
 */
async function killWorker(workerId: string): Promise<void> {
  try {
    // Kill the worker process and all children
    await execAsync(`pkill -TERM -P ${workerId} 2>/dev/null || true`);
    await execAsync(`kill -9 ${workerId} 2>/dev/null || true`);
    console.log(`  ⚡ Killed worker ${workerId}`);
  } catch (error) {
    // Process might already be dead
    console.log(`  ⚠️ Worker ${workerId} already terminated`);
  }
}

/**
 * Clean up scan from database completely
 */
async function deleteScan(scanId: string): Promise<void> {
  try {
    // Delete related data first (only the models that exist in new schema)
    await prisma.lead.deleteMany({ where: { scanId } });
    await prisma.aiTrustScorecard.deleteMany({ where: { scanId } });

    // Finally delete the scan itself
    await prisma.scan.delete({ where: { id: scanId } });

    console.log(`  🗑️ Deleted scan ${scanId} from database`);
  } catch (error) {
    console.error(`  ❌ Failed to delete scan ${scanId}:`, error);
  }
}

/**
 * Monitor active scans and enforce timeout
 */
async function monitorScans() {
  console.log(`\n[${new Date().toISOString()}] 🔍 Checking active scans...`);

  try {
    // Get all SCANNING scans
    const activeScans = await prisma.scan.findMany({
      where: { status: 'SCANNING' },
      select: {
        id: true,
        url: true,
        status: true,
        createdAt: true,
        workerId: true
      }
    }) as ActiveScan[];

    const now = Date.now();
    console.log(`  📊 Found ${activeScans.length} active scans`);

    for (const scan of activeScans) {
      const scanAge = now - scan.createdAt.getTime();
      const ageSeconds = Math.round(scanAge / 1000);

      // Check if scan exceeded timeout
      if (scanAge > MAX_SCAN_TIME) {
        console.log(`\n  🚨 TIMEOUT: ${scan.url}`);
        console.log(`     Age: ${ageSeconds}s (max: ${MAX_SCAN_TIME/1000}s)`);
        console.log(`     Scan ID: ${scan.id}`);

        // Kill worker if we have the PID
        if (scan.workerId) {
          await killWorker(scan.workerId);
        }

        // Delete the scan completely
        await deleteScan(scan.id);

        // Remove from tracking
        WORKER_TRACKING.delete(scan.id);

        console.log(`  ✅ Cleaned up timeout scan: ${scan.url}`);
      } else {
        console.log(`  ⏱️ Active: ${scan.url} (${ageSeconds}s / ${MAX_SCAN_TIME/1000}s)`);
      }
    }

    // Also check for orphaned PENDING scans (older than 5 minutes)
    const orphanedPending = await prisma.scan.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(now - 5 * 60000) // 5 minutes old
        }
      },
      select: { id: true, url: true }
    });

    if (orphanedPending.length > 0) {
      console.log(`\n  🧹 Found ${orphanedPending.length} orphaned PENDING scans`);
      for (const scan of orphanedPending) {
        await deleteScan(scan.id);
        console.log(`  🗑️ Deleted orphaned: ${scan.url}`);
      }
    }

  } catch (error) {
    console.error('❌ Monitor error:', error);
  }
}

/**
 * Clean up all background processes on exit
 */
async function cleanup() {
  console.log('\n🛑 Shutting down worker monitor...');

  // Kill all tracked workers
  for (const [scanId, data] of WORKER_TRACKING) {
    console.log(`  Killing worker ${data.workerId} for ${data.url}`);
    await killWorker(data.workerId);
  }

  await prisma.$disconnect();
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main monitoring loop
async function main() {
  console.log('🚀 Worker Monitor Started');
  console.log(`  ⏱️ Timeout: ${MAX_SCAN_TIME/1000} seconds`);
  console.log(`  🔄 Check interval: ${CHECK_INTERVAL/1000} seconds`);
  console.log('  Press Ctrl+C to stop\n');

  // Initial check
  await monitorScans();

  // Set up periodic monitoring
  setInterval(monitorScans, CHECK_INTERVAL);
}

// Start the monitor
main().catch(console.error);
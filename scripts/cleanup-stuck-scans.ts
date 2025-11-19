#!/usr/bin/env tsx
/**
 * Cleanup Stuck SCANNING Scans
 *
 * This script finds scans that are stuck in SCANNING status for more than 2 minutes
 * and resets them to PENDING so the worker can retry them.
 *
 * Run manually: npx tsx scripts/cleanup-stuck-scans.ts
 * Or as cron job every 5 minutes: Add to crontab
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const STUCK_THRESHOLD_MINUTES = 2

async function cleanupStuckScans() {
  try {
    console.log(`[Cleanup] 🔍 Looking for SCANNING scans older than ${STUCK_THRESHOLD_MINUTES} minutes...`)

    // Find stuck scans
    const stuckScans = await prisma.scan.findMany({
      where: {
        status: 'SCANNING',
        createdAt: {
          lt: new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000)
        }
      },
      select: {
        id: true,
        url: true,
        createdAt: true
      }
    })

    if (stuckScans.length === 0) {
      console.log('[Cleanup] ✅ No stuck scans found')
      return
    }

    console.log(`[Cleanup] 🚨 Found ${stuckScans.length} stuck scans:`)
    stuckScans.forEach(scan => {
      const ageMinutes = Math.floor((Date.now() - scan.createdAt.getTime()) / 1000 / 60)
      console.log(`  - ${scan.url} (stuck for ${ageMinutes} minutes)`)
    })

    // Reset to PENDING
    const result = await prisma.scan.updateMany({
      where: {
        id: {
          in: stuckScans.map(s => s.id)
        }
      },
      data: {
        status: 'PENDING'
      }
    })

    console.log(`[Cleanup] ✅ Reset ${result.count} scans to PENDING`)
    console.log('[Cleanup] 💡 Worker will retry these scans automatically')

  } catch (error) {
    console.error('[Cleanup] ❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupStuckScans()

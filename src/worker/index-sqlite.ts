/**
 * SQLite Queue Worker
 *
 * Polls the Job table for pending jobs and processes them
 */

import { prisma } from '../lib/db'
import { jobQueue } from '../lib/queue-sqlite'
import { MockCrawler } from './crawler-mock'
import { CrawlerAdapter } from '../lib/crawler-adapter'
import { analyzeAIDetection } from './analyzers/ai-detection'
import { analyzeSecurityHeaders } from './analyzers/security-headers'
import { analyzeClientRisks } from './analyzers/client-risks'
import { analyzeSSLTLS } from './analyzers/ssl-tls-analyzer'
import { analyzeCookieSecurity } from './analyzers/cookie-security-analyzer'
import { analyzeJSLibraries } from './analyzers/js-libraries-analyzer'
import { analyzeTechStack } from './analyzers/tech-stack-analyzer'
import { calculateRiskScore } from './scoring'
import { generateReport } from './report-generator'

// Choose crawler based on environment variable
const USE_REAL_CRAWLER = process.env.USE_REAL_CRAWLER === 'true'
const crawler = USE_REAL_CRAWLER ? new CrawlerAdapter() : new MockCrawler()

console.log(`[Worker] Using ${USE_REAL_CRAWLER ? 'REAL Playwright' : 'MOCK'} crawler`)
console.log('[Worker] ✅ SQLite Queue Worker started')

async function processScanJob(data: { scanId: string; url: string }) {
  const { scanId, url } = data

  console.log(`[Worker] Processing scan ${scanId} for ${url}`)

  try {
    // Update status to scanning
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'SCANNING',
        startedAt: new Date(),
      },
    })

    // Step 1: Crawl the website
    console.log(`[Worker] Crawling ${url}...`)
    const crawlResult = await crawler.crawl(url)
    console.log(`[Worker] Crawl completed in ${crawlResult.loadTime}ms`)

    // Step 2: Run all analyzers
    console.log(`[Worker] Running analyzers...`)
    const aiDetection = analyzeAIDetection(crawlResult)
    const securityHeaders = analyzeSecurityHeaders(crawlResult)
    const clientRisks = analyzeClientRisks(crawlResult)
    const sslTLS = analyzeSSLTLS(crawlResult)
    const cookieSecurity = analyzeCookieSecurity(crawlResult)
    const jsLibraries = analyzeJSLibraries(crawlResult)
    const techStack = analyzeTechStack(crawlResult)

    console.log(`[Worker] ✓ AI detected: ${aiDetection.hasAI}`)
    console.log(`[Worker] ✓ Providers: ${aiDetection.providers.join(', ') || 'none'}`)
    console.log(`[Worker] ✓ API keys found: ${clientRisks.apiKeysFound.length}`)
    console.log(`[Worker] ✓ Missing headers: ${securityHeaders.missing.length}`)
    console.log(`[Worker] ✓ SSL/TLS score: ${sslTLS.score}/100`)
    console.log(`[Worker] ✓ Cookies: ${cookieSecurity.totalCookies} (${cookieSecurity.insecureCookies} insecure)`)
    console.log(`[Worker] ✓ JS Libraries: ${jsLibraries.detected.length} (${jsLibraries.vulnerable.length} vulnerable)`)
    console.log(`[Worker] ✓ Tech Stack: ${techStack.totalCount} technologies detected`)
    console.log(`[Worker]   - CMS: ${techStack.categories.cms.length}`)
    console.log(`[Worker]   - Analytics: ${techStack.categories.analytics.length}`)
    console.log(`[Worker]   - Ads: ${techStack.categories.ads.length}`)
    console.log(`[Worker]   - CDN: ${techStack.categories.cdn.length}`)
    console.log(`[Worker]   - Social: ${techStack.categories.social.length}`)

    // Step 3: Calculate risk score
    console.log(`[Worker] Calculating risk score...`)
    const riskScore = calculateRiskScore(
      aiDetection,
      securityHeaders,
      clientRisks,
      sslTLS,
      cookieSecurity,
      jsLibraries
    )

    // Step 4: Generate report
    console.log(`[Worker] Generating report...`)
    const report = generateReport(
      aiDetection,
      securityHeaders,
      clientRisks,
      riskScore,
      sslTLS,
      cookieSecurity,
      jsLibraries,
      techStack
    )

    // Step 5: Save results
    console.log(`[Worker] Saving results...`)
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        riskScore: riskScore.score,
        riskLevel: riskScore.level,
        detectedTech: JSON.stringify(report.detectedTech),
        findings: JSON.stringify(report),
        completedAt: new Date(),
      },
    })

    console.log(`[Worker] ✅ Scan ${scanId} completed successfully`)
    console.log(`[Worker] Risk Score: ${riskScore.score}/100 (${riskScore.grade} - ${riskScore.level})`)

    return { success: true, scanId, riskScore: riskScore.score }

  } catch (error) {
    console.error(`[Worker] ❌ Error processing scan ${scanId}:`, error)

    // Update status to failed
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        metadata: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        completedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Main worker function - processes ONE job then exits
 * This ensures each scan runs with fresh code (no caching issues)
 */
async function processOneJob() {
  console.log('[Worker] 🔍 Checking for pending jobs...')

  try {
    // Get next pending job from SQLite queue
    const job = await jobQueue.getNext()

    if (job) {
      console.log(`[Worker] 🎯 Found job ${job.id} (type: ${job.type})`)

      try {
        if (job.type === 'scan') {
          await processScanJob(job.data)
          await jobQueue.complete(job.id)
          console.log(`[Worker] ✅ Job completed successfully, worker shutting down...`)
        } else {
          console.log(`[Worker] ⚠️  Unknown job type: ${job.type}`)
          await jobQueue.fail(job.id, `Unknown job type: ${job.type}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await jobQueue.fail(job.id, errorMessage)
        console.log(`[Worker] ❌ Job failed, worker shutting down...`)
      }

      // Close browser and exit after processing one job
      await crawler.close()
      process.exit(0)
    } else {
      console.log('[Worker] 💤 No jobs found, worker shutting down...')
      await crawler.close()
      process.exit(0)
    }
  } catch (error) {
    console.error('[Worker] ❌ Error checking for jobs:', error)
    await crawler.close()
    process.exit(1)
  }
}

// Always use one-shot mode: process one job then exit
// This ensures workers are short-lived and don't accumulate
processOneJob()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down...')
  await crawler.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...')
  await crawler.close()
  process.exit(0)
})

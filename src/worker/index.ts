import { prisma } from '../lib/db'
import { scanQueue, ScanJobData } from '../lib/queue-mock'
import { MockCrawler } from './crawler-mock'
import { CrawlerAdapter } from '../lib/crawler-adapter'
import { analyzeAIDetection } from './analyzers/ai-detection'
import { analyzeSecurityHeaders } from './analyzers/security-headers'
import { analyzeClientRisks } from './analyzers/client-risks'
import { calculateRiskScore } from './scoring'
import { generateReport } from './report-generator'

// Choose crawler based on environment variable
const USE_REAL_CRAWLER = process.env.USE_REAL_CRAWLER === 'true'
const crawler = USE_REAL_CRAWLER ? new CrawlerAdapter() : new MockCrawler()

console.log(`[Worker] Using ${USE_REAL_CRAWLER ? 'REAL Playwright' : 'MOCK'} crawler`)

async function processScan(data: ScanJobData) {
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

    console.log(`[Worker] AI detected: ${aiDetection.hasAI}`)
    console.log(`[Worker] Providers: ${aiDetection.providers.join(', ') || 'none'}`)
    console.log(`[Worker] API keys found: ${clientRisks.apiKeysFound.length}`)
    console.log(`[Worker] Missing headers: ${securityHeaders.missing.length}`)

    // Step 3: Calculate risk score
    console.log(`[Worker] Calculating risk score...`)
    const riskScore = calculateRiskScore(
      aiDetection,
      securityHeaders,
      clientRisks
    )

    // Step 4: Generate report
    console.log(`[Worker] Generating report...`)
    const report = generateReport(
      aiDetection,
      securityHeaders,
      clientRisks,
      riskScore
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

// Register worker processor
console.log('[Worker] Registering processor...')
scanQueue.process(async (data) => {
  await processScan(data)
})

console.log('[Worker] ✅ Worker started and waiting for jobs...')

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down...')
  await crawler.close()
  process.exit(0)
})

// Keep process alive
setInterval(() => {
  // This keeps the worker process running
}, 1000)

// Worker initialization - auto-imports in Next.js API routes
import { prisma } from '../lib/db'
import { scanQueue } from '../lib/queue-mock'
import { MockCrawler } from './crawler-mock'
import { analyzeAIDetection } from './analyzers/ai-detection'
import { analyzeSecurityHeaders } from './analyzers/security-headers'
import { analyzeClientRisks } from './analyzers/client-risks'
import { calculateRiskScore } from './scoring'
import { generateReport } from './report-generator'

const crawler = new MockCrawler()

async function processScan(data: { scanId: string; url: string }) {
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

    // Step 1: Crawl
    const crawlResult = await crawler.crawl(url)

    // Step 2: Analyze
    const aiDetection = analyzeAIDetection(crawlResult)
    const securityHeaders = analyzeSecurityHeaders(crawlResult)
    const clientRisks = analyzeClientRisks(crawlResult)

    // Step 3: Score
    const riskScore = calculateRiskScore(aiDetection, securityHeaders, clientRisks)

    // Step 4: Report
    const report = generateReport(aiDetection, securityHeaders, clientRisks, riskScore)

    // Step 5: Save
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

    console.log(`[Worker] ✅ Scan ${scanId} completed - Score: ${riskScore.score}/100 (${riskScore.grade})`)

  } catch (error) {
    console.error(`[Worker] ❌ Error:`, error)
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        completedAt: new Date(),
      },
    })
  }
}

// Register processor
scanQueue.process(processScan)

console.log('[Worker] ✅ Worker processor registered')

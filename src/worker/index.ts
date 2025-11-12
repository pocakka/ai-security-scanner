import { prisma } from '../lib/db'
import { scanQueue, ScanJobData } from '../lib/queue-mock'
import { MockCrawler } from './crawler-mock'
import { CrawlerAdapter } from '../lib/crawler-adapter'
import { analyzeAIDetection } from './analyzers/ai-detection'
import { analyzeSecurityHeaders } from './analyzers/security-headers'
import { analyzeClientRisks } from './analyzers/client-risks'
import { analyzeSSLTLS } from './analyzers/ssl-tls-analyzer'
import { analyzeCookieSecurity } from './analyzers/cookie-security-analyzer'
import { analyzeJSLibraries } from './analyzers/js-libraries-analyzer'
import { analyzeAiTrust } from './analyzers/ai-trust-analyzer'
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
    const sslTLS = analyzeSSLTLS(crawlResult)
    const cookieSecurity = analyzeCookieSecurity(crawlResult)
    const jsLibraries = analyzeJSLibraries(crawlResult)

    console.log(`[Worker] AI detected: ${aiDetection.hasAI}`)
    console.log(`[Worker] Providers: ${aiDetection.providers.join(', ') || 'none'}`)
    console.log(`[Worker] API keys found: ${clientRisks.apiKeysFound.length}`)
    console.log(`[Worker] Missing headers: ${securityHeaders.missing.length}`)
    console.log(`[Worker] SSL/TLS score: ${sslTLS.score}/100`)
    console.log(`[Worker] Cookies: ${cookieSecurity.totalCookies} (${cookieSecurity.insecureCookies} insecure)`)
    console.log(`[Worker] JS Libraries: ${jsLibraries.detected.length} (${jsLibraries.vulnerable.length} vulnerable)`)

    // Step 2.5: Analyze AI Trust Score (NEW!)
    console.log(`[Worker] Analyzing AI Trust Score...`)
    const aiTrustResult = analyzeAiTrust(crawlResult, sslTLS.score)
    console.log(`[Worker] AI Trust Score: ${aiTrustResult.weightedScore}/100 (${aiTrustResult.grade})`)
    console.log(`[Worker] Trust checks: ${aiTrustResult.passedChecks}/${aiTrustResult.totalChecks} passed`)
    if (aiTrustResult.detectedAiProvider) {
      console.log(`[Worker] Detected AI Provider: ${aiTrustResult.detectedAiProvider}`)
    }

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
      jsLibraries
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

    // Step 5.5: Save AI Trust Scorecard (NEW!)
    console.log(`[Worker] Saving AI Trust Scorecard...`)
    await prisma.aiTrustScorecard.create({
      data: {
        scanId: scanId,

        // Transparency
        isProviderDisclosed: aiTrustResult.checks.isProviderDisclosed,
        isIdentityDisclosed: aiTrustResult.checks.isIdentityDisclosed,
        isAiPolicyLinked: aiTrustResult.checks.isAiPolicyLinked,
        isModelVersionDisclosed: aiTrustResult.checks.isModelVersionDisclosed,
        isLimitationsDisclosed: aiTrustResult.checks.isLimitationsDisclosed,
        hasDataUsageDisclosure: aiTrustResult.checks.hasDataUsageDisclosure,

        // User Control
        hasFeedbackMechanism: aiTrustResult.checks.hasFeedbackMechanism,
        hasConversationReset: aiTrustResult.checks.hasConversationReset,
        hasHumanEscalation: aiTrustResult.checks.hasHumanEscalation,
        hasConversationExport: aiTrustResult.checks.hasConversationExport,
        hasDataDeletionOption: aiTrustResult.checks.hasDataDeletionOption,

        // Compliance
        hasDpoContact: aiTrustResult.checks.hasDpoContact,
        hasCookieBanner: aiTrustResult.checks.hasCookieBanner,
        hasPrivacyPolicyLink: aiTrustResult.checks.hasPrivacyPolicyLink,
        hasTermsOfServiceLink: aiTrustResult.checks.hasTermsOfServiceLink,
        hasGdprCompliance: aiTrustResult.checks.hasGdprCompliance,

        // Security & Reliability
        hasBotProtection: aiTrustResult.checks.hasBotProtection,
        hasAiRateLimitHeaders: aiTrustResult.checks.hasAiRateLimitHeaders,
        hasBasicWebSecurity: aiTrustResult.checks.hasBasicWebSecurity,
        hasInputLengthLimit: aiTrustResult.checks.hasInputLengthLimit,
        usesInputSanitization: aiTrustResult.checks.usesInputSanitization,
        hasErrorHandling: aiTrustResult.checks.hasErrorHandling,
        hasSessionManagement: aiTrustResult.checks.hasSessionManagement,

        // Ethical AI
        hasBiasDisclosure: aiTrustResult.checks.hasBiasDisclosure,
        hasContentModeration: aiTrustResult.checks.hasContentModeration,
        hasAgeVerification: aiTrustResult.checks.hasAgeVerification,
        hasAccessibilitySupport: aiTrustResult.checks.hasAccessibilitySupport,

        // Scores (handle null values when no AI detected)
        score: aiTrustResult.score ?? 0,
        weightedScore: aiTrustResult.weightedScore ?? 0,
        categoryScores: JSON.stringify(aiTrustResult.categoryScores),
        passedChecks: aiTrustResult.passedChecks,
        totalChecks: aiTrustResult.totalChecks,
        relevantChecks: aiTrustResult.relevantChecks || 0, // NEW

        // AI Detection Status (NEW)
        hasAiImplementation: aiTrustResult.hasAiImplementation || false,
        aiConfidenceLevel: aiTrustResult.aiConfidenceLevel || 'none',

        // Detected AI Technology
        detectedAiProvider: aiTrustResult.detectedAiProvider,
        detectedModel: aiTrustResult.detectedModel,
        detectedChatFramework: aiTrustResult.detectedChatFramework,

        // Evidence
        evidenceData: JSON.stringify(aiTrustResult.evidenceData),

        // NEW: Detailed checks and summary
        detailedChecks: JSON.stringify(aiTrustResult.detailedChecks || {}),
        summary: JSON.stringify(aiTrustResult.summary || {}),
      },
    })
    console.log(`[Worker] ✅ AI Trust Scorecard saved`)

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

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
import { analyzeAiTrust } from './analyzers/ai-trust-analyzer'
import { analyzeReconnaissance } from './analyzers/reconnaissance-analyzer'
import { analyzeAdminDetection } from './analyzers/admin-detection-analyzer'
import { analyzeCORS, checkCORSBypassPatterns } from './analyzers/cors-analyzer'
import { analyzeDNSSecurity } from './analyzers/dns-security-analyzer'
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

  // Performance timing tracking
  const timings: Record<string, number> = {}
  const startTime = Date.now()

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
    const crawlStart = Date.now()
    const crawlResult = await crawler.crawl(url)
    timings.crawl = Date.now() - crawlStart
    console.log(`[Worker] Crawl completed in ${timings.crawl}ms`)

    // Step 2: Run all analyzers
    console.log(`[Worker] Running analyzers...`)
    const analyzerStart = Date.now()

    const aiDetectionStart = Date.now()
    const aiDetection = analyzeAIDetection(crawlResult)
    timings.aiDetection = Date.now() - aiDetectionStart

    const securityHeadersStart = Date.now()
    const securityHeaders = analyzeSecurityHeaders(crawlResult)
    timings.securityHeaders = Date.now() - securityHeadersStart

    const clientRisksStart = Date.now()
    const clientRisks = analyzeClientRisks(crawlResult)
    timings.clientRisks = Date.now() - clientRisksStart

    const sslTLSStart = Date.now()
    const sslTLS = analyzeSSLTLS(crawlResult)
    timings.sslTLS = Date.now() - sslTLSStart

    const cookieSecurityStart = Date.now()
    const cookieSecurity = analyzeCookieSecurity(crawlResult)
    timings.cookieSecurity = Date.now() - cookieSecurityStart

    const jsLibrariesStart = Date.now()
    const jsLibraries = analyzeJSLibraries(crawlResult)
    timings.jsLibraries = Date.now() - jsLibrariesStart

    const techStackStart = Date.now()
    const techStack = analyzeTechStack(crawlResult)
    timings.techStack = Date.now() - techStackStart

    // NEW: Reconnaissance analyzer
    const reconnaissanceStart = Date.now()
    const reconnaissance = await analyzeReconnaissance(crawlResult)
    timings.reconnaissance = Date.now() - reconnaissanceStart

    // NEW: Admin Detection analyzer
    const adminDetectionStart = Date.now()
    const adminDetection = await analyzeAdminDetection(crawlResult)
    timings.adminDetection = Date.now() - adminDetectionStart

    // NEW: CORS analyzer
    const corsStart = Date.now()
    const corsAnalysis = analyzeCORS(crawlResult)
    const corsBypassPatterns = checkCORSBypassPatterns(crawlResult)
    timings.cors = Date.now() - corsStart

    // NEW: DNS Security analyzer
    const dnsStart = Date.now()
    const dnsAnalysis = await analyzeDNSSecurity(crawlResult)
    timings.dns = Date.now() - dnsStart

    timings.totalAnalyzers = Date.now() - analyzerStart

    console.log(`[Worker] ✓ AI detected: ${aiDetection.hasAI}`)
    console.log(`[Worker] ✓ Providers: ${aiDetection.providers.join(', ') || 'none'}`)
    console.log(`[Worker] ✓ API keys found: ${clientRisks.apiKeysFound.length}`)
    console.log(`[Worker] ✓ Missing headers: ${securityHeaders.missing.length}`)
    console.log(`[Worker] ✓ SSL/TLS score: ${sslTLS.score}/100`)
    console.log(`[Worker] ✓ Cookies: ${cookieSecurity.totalCookies} (${cookieSecurity.insecureCookies} insecure)`)
    console.log(`[Worker] ✓ JS Libraries: ${jsLibraries.detected.length} (${jsLibraries.vulnerable.length} vulnerable)`)
    console.log(`[Worker] ✓ Tech Stack: ${techStack.totalCount} technologies detected`)
    console.log(`[Worker] ✓ Reconnaissance: ${reconnaissance.findings.length} findings (${reconnaissance.summary.criticalExposures} critical)`)
    console.log(`[Worker] ✓ Admin Detection: ${adminDetection.hasAdminPanel ? 'Admin panel found' : 'No admin panel'}, ${adminDetection.hasLoginForm ? 'Login form found' : 'No login form'}`)
    console.log(`[Worker] ✓ CORS: ${corsAnalysis.findings.length} findings (wildcard: ${corsAnalysis.hasWildcardOrigin}, credentials: ${corsAnalysis.allowsCredentials})`)
    console.log(`[Worker] ✓ DNS Security: ${dnsAnalysis.findings.length} findings (DNSSEC: ${dnsAnalysis.hasDNSSEC}, SPF: ${dnsAnalysis.hasSPF}, DKIM: ${dnsAnalysis.hasDKIM}, DMARC: ${dnsAnalysis.hasDMARC})`)
    console.log(`[Worker]   - CMS: ${techStack.categories.cms.length}`)
    console.log(`[Worker]   - Analytics: ${techStack.categories.analytics.length}`)
    console.log(`[Worker]   - Ads: ${techStack.categories.ads.length}`)
    console.log(`[Worker]   - CDN: ${techStack.categories.cdn.length}`)
    console.log(`[Worker]   - Social: ${techStack.categories.social.length}`)

    // Step 2.5: Analyze AI Trust Score (NEW!)
    console.log(`[Worker] Analyzing AI Trust Score...`)
    const aiTrustStart = Date.now()
    const aiTrustResult = analyzeAiTrust(crawlResult, sslTLS.score)
    timings.aiTrust = Date.now() - aiTrustStart
    console.log(`[Worker] ✓ AI Trust Score: ${aiTrustResult.weightedScore}/100 (${aiTrustResult.grade})`)
    console.log(`[Worker]   - Trust checks: ${aiTrustResult.passedChecks}/${aiTrustResult.totalChecks} passed`)
    if (aiTrustResult.detectedAiProvider) {
      console.log(`[Worker]   - Detected AI Provider: ${aiTrustResult.detectedAiProvider}`)
    }

    // Step 3: Calculate risk score
    console.log(`[Worker] Calculating risk score...`)
    const riskScoreStart = Date.now()
    const riskScore = calculateRiskScore(
      aiDetection,
      securityHeaders,
      clientRisks,
      sslTLS,
      cookieSecurity,
      jsLibraries
    )
    timings.riskScore = Date.now() - riskScoreStart

    // Step 4: Generate report
    console.log(`[Worker] Generating report...`)
    const reportStart = Date.now()
    const report = generateReport(
      aiDetection,
      securityHeaders,
      clientRisks,
      riskScore,
      sslTLS,
      cookieSecurity,
      jsLibraries,
      techStack,
      reconnaissance,
      adminDetection,
      { ...corsAnalysis, bypassPatterns: corsBypassPatterns }, // Combine CORS results
      dnsAnalysis
    )
    timings.reportGeneration = Date.now() - reportStart

    // Calculate total time
    timings.total = Date.now() - startTime

    // Add performance data to metadata
    const performanceData = {
      timings,
      timestamp: new Date().toISOString(),
      crawlerBreakdown: crawlResult.timingBreakdown || {}, // NEW: detailed crawler timing
      analyzerBreakdown: {
        aiDetection: timings.aiDetection,
        securityHeaders: timings.securityHeaders,
        clientRisks: timings.clientRisks,
        sslTLS: timings.sslTLS,
        cookieSecurity: timings.cookieSecurity,
        jsLibraries: timings.jsLibraries,
        techStack: timings.techStack,
        aiTrust: timings.aiTrust,
        reconnaissance: timings.reconnaissance,
        adminDetection: timings.adminDetection,
        cors: timings.cors,
      }
    }

    console.log(`[Worker] 📊 Performance Summary:`)
    console.log(`[Worker]   Crawl: ${timings.crawl}ms`)
    if (crawlResult.timingBreakdown) {
      console.log(`[Worker]     └─ Browser Init: ${crawlResult.timingBreakdown.browserInit}ms`)
      console.log(`[Worker]     └─ Navigation: ${crawlResult.timingBreakdown.navigation}ms`)
      console.log(`[Worker]     └─ Page Load: ${crawlResult.timingBreakdown.pageLoad}ms`)
      console.log(`[Worker]     └─ Data Collection: ${crawlResult.timingBreakdown.dataCollection}ms`)
    }
    console.log(`[Worker]   Analyzers: ${timings.totalAnalyzers}ms`)
    console.log(`[Worker]   Risk Score: ${timings.riskScore}ms`)
    console.log(`[Worker]   Report Gen: ${timings.reportGeneration}ms`)
    console.log(`[Worker]   TOTAL: ${timings.total}ms`)

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
        metadata: JSON.stringify(performanceData),
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

        // Scores
        score: aiTrustResult.score,
        weightedScore: aiTrustResult.weightedScore,
        categoryScores: JSON.stringify(aiTrustResult.categoryScores),
        passedChecks: aiTrustResult.passedChecks,
        totalChecks: aiTrustResult.totalChecks,

        // Detected AI Technology
        detectedAiProvider: aiTrustResult.detectedAiProvider,
        detectedModel: aiTrustResult.detectedModel,
        detectedChatFramework: aiTrustResult.detectedChatFramework,

        // Evidence
        evidenceData: JSON.stringify(aiTrustResult.evidenceData || {}),
      },
    })
    console.log(`[Worker] ✅ AI Trust Scorecard saved`)

    console.log(`[Worker] ✅ Scan ${scanId} completed successfully`)
    console.log(`[Worker] Risk Score: ${riskScore.score}/100 (${riskScore.grade} - ${riskScore.level})`)
    console.log(`[Worker] AI Trust Score: ${aiTrustResult.weightedScore}/100 (${aiTrustResult.grade})`)

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

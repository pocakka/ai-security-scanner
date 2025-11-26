/**
 * Hybrid Worker - Intelligently routes between Fast PHP scanner and Playwright
 *
 * - User-initiated scans: Always use Playwright (deep scan)
 * - Batch scans: Use PHP fast scanner (95%) or Playwright (5%) based on domain
 *
 * All TypeScript analyzers work unchanged with both scanners
 */

import { prisma } from '../lib/db'
import { jobQueue } from '../lib/queue-sqlite'
import { CrawlerAdapter } from '../lib/crawler-adapter'
import { WorkerManager } from './worker-manager'
import {
  runFastScanner,
  transformToCrawlerResult,
  decideScanType,
} from './fast-scanner-wrapper'

// Import all analyzers (unchanged - work with both scanners)
import { analyzeSecurityHeaders } from './analyzers/security-headers'
import { analyzeClientRisks } from './analyzers/client-risks'
import { analyzeSSLTLS } from './analyzers/ssl-tls-analyzer'
import { analyzeCookieSecurity } from './analyzers/cookie-security-analyzer'
import { analyzeJSLibraries } from './analyzers/js-libraries-analyzer'
import { analyzeTechStack } from './analyzers/tech-stack-analyzer'
import { analyzeAiTrust } from './analyzers/ai-trust-analyzer'
import { analyzeReconnaissance } from './analyzers/reconnaissance-analyzer'
import { analyzeAdminDetection } from './analyzers/admin-detection-analyzer'
import { analyzeAdminDiscovery } from './analyzers/admin-discovery-analyzer'
import { analyzeCORS } from './analyzers/cors-analyzer'
import { analyzeDNSSecurity } from './analyzers/dns-security-analyzer'
import { analyzePortScan } from './analyzers/port-scanner-analyzer'
import { analyzeCompliance } from './analyzers/compliance-analyzer'
import { analyzeWAFDetection } from './analyzers/waf-detection-analyzer'
import { analyzeMFADetection } from './analyzers/mfa-detection-analyzer'
import { analyzeRateLimiting } from './analyzers/rate-limiting-analyzer'
import { analyzeGraphQL } from './analyzers/graphql-analyzer'
import { analyzeErrorDisclosure } from './analyzers/error-disclosure-analyzer'
import { analyzeSpaApi } from './analyzers/spa-api-analyzer'
import { analyzeLLM01PromptInjection } from './analyzers/owasp-llm/llm01-prompt-injection'
import { analyzeLLM02InsecureOutput } from './analyzers/owasp-llm/llm02-insecure-output'
import { analyzeLLM05SupplyChain } from './analyzers/owasp-llm/llm05-supply-chain'
import { analyzeLLM06SensitiveInfo } from './analyzers/owasp-llm/llm06-sensitive-info'
import { analyzeLLM07PluginDesign } from './analyzers/owasp-llm/llm07-plugin-design'
import { analyzeLLM08ExcessiveAgency } from './analyzers/owasp-llm/llm08-excessive-agency'
import { analyzeBackendFramework } from './analyzers/backend-framework-detector'
import { analyzeWebServer } from './analyzers/web-server-security-analyzer'
import { analyzeFrontendFramework } from './analyzers/frontend-framework-security-analyzer'
import { analyzePassiveAPIDiscovery } from './analyzers/passive-api-discovery-analyzer'
import { calculateSecurityScore } from './scoring-v3'
import { generateReport } from './report-generator'

// Initialize worker manager
const workerManager = WorkerManager.getInstance()

// Playwright crawler instance (for deep scans)
const playwrightCrawler = new CrawlerAdapter()

/**
 * Timeout wrapper for analyzers
 */
async function runWithTimeout<T>(
  analyzerFn: () => Promise<T>,
  timeoutMs: number,
  analyzerName: string,
  defaultValue: T
): Promise<T> {
  try {
    const result = await Promise.race([
      analyzerFn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`[Worker] ⏰ ${analyzerName} ${errorMsg} - using default`)
    return defaultValue
  }
}

/**
 * Process scan job with hybrid routing
 */
async function processScanJob(data: { scanId: string; url: string; isBatchScan?: boolean }) {
  const { scanId, url, isBatchScan = true } = data

  console.log(`[Hybrid Worker] Processing scan ${scanId} for ${url}`)

  const timings: Record<string, number> = {}
  const startTime = Date.now()

  try {
    // Extract domain
    const domain = new URL(url).hostname

    // Decide: Fast (PHP) or Deep (Playwright) scan?
    const scanDecision = decideScanType(domain, isBatchScan)
    const { scanType, workerType, reason } = scanDecision

    console.log(
      `[Hybrid Worker] Scan decision: ${scanType} (${workerType}) - Reason: ${reason}`
    )

    // Update status to scanning
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'SCANNING',
        startedAt: new Date(),
        workerId: process.pid.toString(),
        scanType, // Store scan type in database
        workerType, // Store worker type in database
      },
    })

    let crawlResult: any
    let crawlTime = 0

    // ══════════════════════════════════════════════════════════════
    // FAST LANE: PHP curl scanner (0.5-1s)
    // ══════════════════════════════════════════════════════════════
    if (scanType === 'FAST') {
      console.log(`[Hybrid Worker] 🚀 Using FAST scanner (PHP curl)`)
      const fastStartTime = Date.now()

      try {
        const scanResult = await runFastScanner(url)

        if (!scanResult.success) {
          throw new Error(scanResult.error || 'Fast scanner failed')
        }

        // Transform to CrawlerResult format (EXACT match with Playwright output)
        crawlResult = transformToCrawlerResult(scanResult, url)
        crawlTime = Date.now() - fastStartTime

        console.log(`[Hybrid Worker] ✅ Fast scan completed in ${crawlTime}ms`)
      } catch (error: any) {
        // If fast scanner fails, fall back to Playwright
        console.log(
          `[Hybrid Worker] ⚠️  Fast scanner failed: ${error.message} - falling back to Playwright`
        )

        const playwrightStartTime = Date.now()
        crawlResult = await playwrightCrawler.crawl(url)
        crawlTime = Date.now() - playwrightStartTime

        // Update scan type to DEEP (fallback)
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            scanType: 'DEEP',
            workerType: 'PLAYWRIGHT',
          },
        })
      }
    }
    // ══════════════════════════════════════════════════════════════
    // DEEP LANE: Playwright browser (8-15s)
    // ══════════════════════════════════════════════════════════════
    else {
      console.log(`[Hybrid Worker] 🎭 Using DEEP scanner (Playwright)`)
      const playwrightStartTime = Date.now()
      crawlResult = await playwrightCrawler.crawl(url)
      crawlTime = Date.now() - playwrightStartTime
      console.log(`[Hybrid Worker] ✅ Deep scan completed in ${crawlTime}ms`)
    }

    timings.crawl = crawlTime

    // ══════════════════════════════════════════════════════════════
    // Run all TypeScript analyzers (IDENTICAL for both scanners)
    // ══════════════════════════════════════════════════════════════
    console.log(`[Hybrid Worker] Running analyzers...`)
    const analyzerStartTime = Date.now()

    // Extract page data from crawlResult (direct properties, not methods)
    const html = crawlResult.html
    const pageUrl = crawlResult.finalUrl || crawlResult.url

    // Run all analyzers with timeout protection
    const [
      securityHeaders,
      clientRisks,
      sslTls,
      cookieSecurity,
      jsLibraries,
      techStack,
      aiTrust,
      reconnaissance,
      adminDetection,
      adminDiscovery,
      cors,
      dnsSecurity,
      portScan,
      compliance,
      wafDetection,
      mfaDetection,
      rateLimiting,
      graphql,
      errorDisclosure,
      spaApi,
      llm01,
      llm02,
      llm05,
      llm06,
      llm07,
      llm08,
      backendFramework,
      webServer,
      frontendFramework,
      passiveApi,
    ] = await Promise.all([
      runWithTimeout(
        () => analyzeSecurityHeaders(crawlResult),
        5000,
        'SecurityHeaders',
        { findings: [], score: 100 }
      ),
      runWithTimeout(() => analyzeClientRisks(html), 5000, 'ClientRisks', { findings: [] }),
      runWithTimeout(
        () => analyzeSSLTLS(pageUrl),
        10000,
        'SSL/TLS',
        { findings: [], score: 100 }
      ),
      runWithTimeout(
        () => analyzeCookieSecurity(crawlResult),
        5000,
        'CookieSecurity',
        { findings: [], score: 100 }
      ),
      runWithTimeout(
        () => analyzeJSLibraries(crawlResult),
        8000,
        'JSLibraries',
        { detected: [], vulnerable: [], findings: [], sriMissing: [], score: 100 }
      ),
      runWithTimeout(
        () => analyzeTechStack(crawlResult),
        8000,
        'TechStack',
        { detected: [], categories: { cms: [], analytics: [], ads: [], cdn: [], social: [], ecommerce: [], framework: [], hosting: [] }, totalCount: 0 }
      ),
      runWithTimeout(
        () => analyzeAiTrust(crawlResult),
        10000,
        'AiTrust',
        { score: 0, findings: [], confidence: 'none' }
      ),
      runWithTimeout(
        () => analyzeReconnaissance(pageUrl, crawlResult),
        12000,
        'Reconnaissance',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeAdminDetection(crawlResult),
        8000,
        'AdminDetection',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeAdminDiscovery(pageUrl, domain),
        15000,
        'AdminDiscovery',
        { findings: [] }
      ),
      runWithTimeout(() => analyzeCORS(pageUrl), 8000, 'CORS', { findings: [], score: 100 }),
      runWithTimeout(
        () => analyzeDNSSecurity(domain),
        10000,
        'DNSSecurity',
        { findings: [], score: 100 }
      ),
      runWithTimeout(
        () => analyzePortScan(domain),
        20000,
        'PortScan',
        { findings: [], openPorts: [] }
      ),
      runWithTimeout(
        () => analyzeCompliance(crawlResult),
        8000,
        'Compliance',
        { findings: [], score: 100 }
      ),
      runWithTimeout(
        () => analyzeWAFDetection(pageUrl),
        8000,
        'WAFDetection',
        { findings: [], wafDetected: false }
      ),
      runWithTimeout(
        () => analyzeMFADetection(html),
        5000,
        'MFADetection',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeRateLimiting(pageUrl),
        10000,
        'RateLimiting',
        { findings: [], score: 100 }
      ),
      runWithTimeout(() => analyzeGraphQL(pageUrl), 8000, 'GraphQL', { findings: [] }),
      runWithTimeout(
        () => analyzeErrorDisclosure(crawlResult),
        5000,
        'ErrorDisclosure',
        { findings: [] }
      ),
      runWithTimeout(() => analyzeSpaApi(crawlResult), 8000, 'SpaApi', { findings: [] }),
      runWithTimeout(
        () => analyzeLLM01PromptInjection(html, pageUrl),
        8000,
        'LLM01',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeLLM02InsecureOutput(html),
        5000,
        'LLM02',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeLLM05SupplyChain(crawlResult),
        8000,
        'LLM05',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeLLM06SensitiveInfo(html, pageUrl),
        8000,
        'LLM06',
        { findings: [] }
      ),
      runWithTimeout(() => analyzeLLM07PluginDesign(html), 5000, 'LLM07', { findings: [] }),
      runWithTimeout(
        () => analyzeLLM08ExcessiveAgency(html),
        5000,
        'LLM08',
        { findings: [] }
      ),
      runWithTimeout(
        () => analyzeBackendFramework(html, crawlResult.responseHeaders || {}, crawlResult.cookies || []),
        5000,
        'BackendFramework',
        { findings: [], detectedFrameworks: [] }
      ),
      runWithTimeout(
        () => analyzeWebServer(crawlResult),
        5000,
        'WebServer',
        { findings: [], score: 100 }
      ),
      runWithTimeout(
        () => analyzeFrontendFramework(html, crawlResult.scripts || []),
        8000,
        'FrontendFramework',
        { findings: [], detectedFrameworks: [] }
      ),
      runWithTimeout(
        () => analyzePassiveAPIDiscovery(html, pageUrl),
        8000,
        'PassiveAPI',
        { findings: [], discoveredEndpoints: [] }
      ),
    ])

    timings.analyzers = Date.now() - analyzerStartTime

    // Calculate security score
    const scoreStartTime = Date.now()
    const securityScore = calculateSecurityScore({
      securityHeaders,
      sslTls,
      cookieSecurity,
      cors,
      dnsSecurity,
      compliance,
      rateLimiting,
      webServer,
    })
    timings.scoring = Date.now() - scoreStartTime

    // Generate report
    const reportStartTime = Date.now()
    const report = generateReport({
      url: pageUrl,
      domain,
      securityScore,
      aiTrustScore: aiTrust.score,
      scanType, // Include scan type in report
      workerType, // Include worker type in report
      timings,
      securityHeaders,
      clientRisks,
      sslTls,
      cookieSecurity,
      jsLibraries,
      techStack,
      aiTrust,
      reconnaissance,
      adminDetection,
      adminDiscovery,
      cors,
      dnsSecurity,
      portScan,
      compliance,
      wafDetection,
      mfaDetection,
      rateLimiting,
      graphql,
      errorDisclosure,
      spaApi,
      owaspLlm01: llm01,
      owaspLlm02: llm02,
      owaspLlm05: llm05,
      owaspLlm06: llm06,
      owaspLlm07: llm07,
      owaspLlm08: llm08,
      backendFramework,
      webServer,
      frontendFramework,
      passiveApi,
    })
    timings.reporting = Date.now() - reportStartTime

    // Total time
    const totalTime = Date.now() - startTime
    timings.total = totalTime

    // Update database with results
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        riskScore: securityScore.overall,
        ...report,
        scanDuration: totalTime, // Store total duration
      },
    })

    console.log(
      `[Hybrid Worker] ✅ Scan ${scanId} completed in ${totalTime}ms (${scanType} via ${workerType})`
    )
    console.log(`[Hybrid Worker] Timings:`, timings)
  } catch (error) {
    console.error(`[Hybrid Worker] ❌ Scan ${scanId} failed:`, error)

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
}

/**
 * Main worker loop
 */
async function startWorker() {
  console.log('[Hybrid Worker] Starting...')

  while (true) {
    try {
      // Poll for next job
      const job = await jobQueue.getNext()

      if (job) {
        await processScanJob(job.data)
        await jobQueue.markComplete(job.id)
      } else {
        // No jobs available - wait before next poll
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error('[Hybrid Worker] Error in main loop:', error)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

// Start worker if run directly
if (require.main === module) {
  startWorker().catch((error) => {
    console.error('[Hybrid Worker] Fatal error:', error)
    process.exit(1)
  })
}

export { processScanJob, startWorker }

#!/usr/bin/env tsx
/**
 * DIRECT PROCESSOR - 2016 style standalone process
 *
 * Runs independently, no queue, no PM2 worker
 * Contains ALL 31 analyzers - NO FUNCTIONALITY LOSS!
 */

import { prisma } from '../lib/db'
import { CrawlerAdapter } from '../lib/crawler-adapter'
import { transformToCrawlerResult } from './fast-scanner-wrapper'

// Import ALL 31 analyzers (SAME AS WORKER!)
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
import { analyzeCORS, checkCORSBypassPatterns } from './analyzers/cors-analyzer'
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

// PHP Fast Scanner for speed
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

// Get URL from command line
const url = process.argv[2]

if (!url) {
  console.error('❌ URL required as argument')
  process.exit(1)
}

const startTime = Date.now()
console.log(`
════════════════════════════════════════════════════════════════════
🚀 DIRECT PROCESSOR STARTED
════════════════════════════════════════════════════════════════════
URL: ${url}
PID: ${process.pid}
Time: ${new Date().toISOString()}
Mode: DIRECT (no queue, no workers)
Analyzers: ALL 31 ACTIVE
════════════════════════════════════════════════════════════════════
`)

async function runDirectScan() {
  let scanId: string | null = null
  const timings: Record<string, number> = {}

  try {
    // 1. Create scan record
    console.log('📝 Creating scan record...')
    const scan = await prisma.scan.create({
      data: {
        url,
        domain: new URL(url).hostname,
        status: 'SCANNING',
        startedAt: new Date(),
        workerId: `direct-${process.pid}`,
        scanType: 'FAST' // Default to fast scanner
      }
    })
    scanId = scan.id
    console.log(`✅ Scan ID: ${scanId}`)

    // 2. Try PHP Fast Scanner first (95% of sites)
    console.log('🚀 Starting FAST crawler (PHP curl)...')
    let crawlResult: any = null
    const crawlStart = Date.now()

    try {
      const phpCommand = `php /home/aiq/Asztal/10_M_USD/ai-security-scanner/workers/fast-scanner/scanner.php "${url}"`
      const { stdout } = await execAsync(phpCommand, {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024 // 10MB
      })

      const scanResult = JSON.parse(stdout)
      if (scanResult.success) {
        crawlResult = transformToCrawlerResult(scanResult, url)
        console.log(`✅ PHP curl scanner success in ${Date.now() - crawlStart}ms`)
      } else {
        throw new Error(`PHP scanner failed: ${scanResult.error || 'Unknown error'}`)
      }
    } catch (error) {
      // NO PLAYWRIGHT FALLBACK - just fail fast!
      console.error(`❌ PHP scanner error: ${error}`)
      throw new Error(`Scanner failed: ${error}`);
    }
    timings.crawl = Date.now() - crawlStart

    // Ensure html is string (fix for analyzers)
    if (!crawlResult.html || typeof crawlResult.html !== 'string') {
      crawlResult.html = crawlResult.html?.toString() || ''
    }

    // 3. Run ALL 31 analyzers
    console.log('🔬 Running 31 analyzers...')
    const analyzerStart = Date.now()

    // Run analyzers (SAME ORDER AS WORKER!)
    const securityHeaders = analyzeSecurityHeaders(crawlResult)
    const clientRisks = analyzeClientRisks(crawlResult)
    const sslTLS = analyzeSSLTLS(crawlResult)
    const cookieSecurity = analyzeCookieSecurity(crawlResult)
    const jsLibraries = analyzeJSLibraries(crawlResult)
    const techStack = analyzeTechStack(crawlResult)

    // With timeout protection
    const reconnaissance = await runWithTimeout(
      () => analyzeReconnaissance(crawlResult),
      5000, 'Reconnaissance'
    )
    const adminDetection = await runWithTimeout(
      () => analyzeAdminDetection(crawlResult),
      5000, 'AdminDetection'
    )
    const adminDiscovery = await runWithTimeout(
      () => analyzeAdminDiscovery(crawlResult),
      5000, 'AdminDiscovery'
    )

    const corsAnalysis = analyzeCORS(crawlResult)
    const corsBypassPatterns = checkCORSBypassPatterns(crawlResult)

    const portScan = await runWithTimeout(
      () => analyzePortScan(crawlResult),
      5000, 'PortScan'
    )
    const dnsSecurity = await runWithTimeout(
      () => analyzeDNSSecurity(crawlResult),
      10000, 'DNSSecurity'
    )

    const compliance = analyzeCompliance(crawlResult)
    const wafDetection = analyzeWAFDetection(crawlResult)
    const mfaDetection = analyzeMFADetection(crawlResult)
    const rateLimiting = await analyzeRateLimiting(crawlResult.responseHeaders || {}, crawlResult.html)
    const graphQL = await analyzeGraphQL(crawlResult)
    const errorDisclosure = analyzeErrorDisclosure(crawlResult)
    const spaApi = analyzeSpaApi(crawlResult)

    // OWASP LLM analyzers
    const llm01 = analyzeLLM01PromptInjection(crawlResult)
    const llm02 = analyzeLLM02InsecureOutput(crawlResult)
    const llm05 = analyzeLLM05SupplyChain(crawlResult)
    const llm06 = await runWithTimeout(
      () => analyzeLLM06SensitiveInfo(crawlResult),
      10000, 'LLM06'
    )
    const llm07 = analyzeLLM07PluginDesign(crawlResult)
    const llm08 = analyzeLLM08ExcessiveAgency(crawlResult)

    const backendFramework = analyzeBackendFramework(crawlResult)
    const webServer = analyzeWebServer(crawlResult)
    const frontendFramework = analyzeFrontendFramework(crawlResult)
    const passiveAPI = analyzePassiveAPIDiscovery(crawlResult)

    // AI Trust Score
    const aiTrustScore = await analyzeAiTrust(crawlResult)

    timings.analyzers = Date.now() - analyzerStart
    console.log(`✅ All 31 analyzers complete in ${timings.analyzers}ms`)

    // 4. Generate report and score
    console.log('📊 Calculating score...')
    const report = generateReport(
      securityHeaders,
      clientRisks,
      sslTLS,
      cookieSecurity,
      jsLibraries,
      techStack,
      reconnaissance,
      adminDetection,
      corsAnalysis,
      dnsSecurity,
      portScan,
      compliance,
      wafDetection,
      mfaDetection,
      rateLimiting,
      graphQL,
      errorDisclosure,
      spaApi,
      llm01,
      llm02,
      llm05,
      llm06,
      llm07,
      llm08,
      aiTrustScore
    )

    const { score, riskLevel } = calculateSecurityScore(report)

    // 5. Save to database
    console.log('💾 Saving to database...')
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        riskScore: score,
        riskLevel,
        findings: report,
        detectedTech: techStack,
        metadata: {
          timings,
          processInfo: {
            pid: process.pid,
            mode: 'direct',
            analyzersRun: 31
          }
        },
        scanDuration: Date.now() - startTime,

        // AI specific fields
        hasAI: aiTrustScore.hasAI,
        aiTrustScore,

        // OWASP LLM findings
        owaspLlm01: llm01,
        owaspLlm02: llm02,
        owaspLlm05: llm05,
        owaspLlm06: llm06,
        owaspLlm07: llm07,
        owaspLlm08: llm08,

        // Other analyzers
        securityHeaders,
        clientRisks,
        sslAnalysis: sslTLS,
        cookieSecurity,
        jsLibraries,
        corsAnalysis,
        adminDiscovery,
        reconnaissance,
        dnsSecurity,
        portScan,
        compliance,
        wafDetection,
        mfaDetection,
        rateLimiting,
        graphQL,
        errorDisclosure,
        spaApiEndpoints: spaApi,
        backendFramework,
        webServer,
        frontendFramework,
        passiveAPIDiscovery: passiveAPI
      }
    })

    const totalTime = Date.now() - startTime
    console.log(`
════════════════════════════════════════════════════════════════════
✅ SCAN COMPLETE!
════════════════════════════════════════════════════════════════════
Scan ID: ${scanId}
URL: ${url}
Score: ${score}/100
Risk: ${riskLevel}
Total time: ${totalTime}ms
Crawl: ${timings.crawl}ms
Analyzers: ${timings.analyzers}ms
════════════════════════════════════════════════════════════════════
`)

  } catch (error) {
    console.error(`❌ SCAN FAILED: ${error}`)

    if (scanId) {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        }
      })
    }

    process.exit(1)
  }

  process.exit(0)
}

// Timeout wrapper
async function runWithTimeout(fn: () => Promise<any>, timeout: number, name: string) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${name} timeout`)), timeout)
      )
    ])
  } catch (error) {
    console.log(`⚠️ ${name} skipped (timeout)`)
    return null
  }
}

// Start scan
runDirectScan().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
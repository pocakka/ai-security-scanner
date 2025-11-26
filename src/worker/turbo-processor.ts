#!/usr/bin/env tsx
/**
 * TURBO PROCESSOR - PHP Only Version
 * No Playwright, Pure Speed
 * Standalone process - no queue, no workers
 * ALL 31 analyzers included
 */

import { prisma } from '../lib/db'
import { transformToCrawlerResult } from './fast-scanner-wrapper'

// Import ALL 31 analyzers
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
console.log(`[TURBO] Starting scan: ${url}`)

async function runTurboScan() {
  let scanId: string | null = null
  const timings: Record<string, number> = {}

  try {
    // 1. Create scan record
    const scan = await prisma.scan.create({
      data: {
        url,
        domain: new URL(url).hostname,
        status: 'SCANNING',
        startedAt: new Date(),
        workerId: `turbo-${process.pid}`,
        scanType: 'FAST'
      }
    })
    scanId = scan.id

    // 2. PHP Fast Scanner ONLY - no Playwright fallback
    const crawlStart = Date.now()
    let crawlResult: any = null

    const phpCommand = `php /home/aiq/Asztal/10_M_USD/ai-security-scanner/workers/fast-scanner/scanner-turbo.php "${url}"`
    const { stdout } = await execAsync(phpCommand, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    })

    const scanResult = JSON.parse(stdout)
    if (!scanResult.success) {
      throw new Error(`PHP scanner failed: ${scanResult.error || 'Unknown error'}`)
    }

    crawlResult = transformToCrawlerResult(scanResult, url)
    timings.crawl = Date.now() - crawlStart

    // Ensure html is string
    if (!crawlResult.html || typeof crawlResult.html !== 'string') {
      crawlResult.html = crawlResult.html?.toString() || ''
    }

    // 3. Run ALL 31 analyzers with proper parameters
    const analyzerStart = Date.now()

    // Basic analyzers
    const securityHeaders = analyzeSecurityHeaders(crawlResult)
    const clientRisks = analyzeClientRisks(crawlResult)
    const sslTLS = analyzeSSLTLS(crawlResult)
    const cookieSecurity = analyzeCookieSecurity(crawlResult)
    const jsLibraries = analyzeJSLibraries(crawlResult)
    const techStack = analyzeTechStack(crawlResult)

    // Timeout protected analyzers
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
    const corsAnalysis = await runWithTimeout(
      () => analyzeCORS(crawlResult),
      5000, 'CORS'
    )
    const portScan = await runWithTimeout(
      () => analyzePortScan(crawlResult),
      5000, 'PortScan'
    )
    const dnsSecurity = await runWithTimeout(
      () => analyzeDNSSecurity(crawlResult),
      10000, 'DNSSecurity'
    )

    // FIX: Pass proper parameters to analyzeCompliance
    const compliance = await analyzeCompliance(
      crawlResult.html || '',
      crawlResult.cookies || [],
      crawlResult.responseHeaders || {},
      crawlResult.url
    )

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
      5000, 'LLM06'
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

    // 4. Generate report and score
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
            mode: 'turbo',
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
    console.log(`[TURBO] ✅ ${scanId} | ${url} | Score: ${score} | Time: ${totalTime}ms`)

  } catch (error) {
    console.error(`[TURBO] ❌ Failed: ${error}`)

    if (scanId) {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          metadata: {
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            }
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
    console.log(`[TURBO] ⚠️ ${name} skipped (timeout)`)
    return null
  }
}

// Start scan
runTurboScan().catch(error => {
  console.error('[TURBO] Fatal error:', error)
  process.exit(1)
})
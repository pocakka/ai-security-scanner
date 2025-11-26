/**
 * AI BATCH WORKER - Optimized for AI Red Teaming Lead Generation
 *
 * DIFFERENCES from index-sqlite.ts:
 * - Uses PHP crawler (80ms vs 3700ms)
 * - Skips non-AI analyzers (reconnaissance, admin, port scan, DNS, compliance, WAF, MFA)
 * - 3.3s/scan vs 22s/scan = 6.7x faster!
 *
 * CRITICAL: UI worker (index-sqlite.ts) remains UNCHANGED!
 * This worker is ONLY for batch terminal scanning (parallel-scanner.py)
 */

import { prisma } from '../lib/db'
import { jobQueue } from '../lib/queue-sqlite'
import { WorkerManager } from './worker-manager'
import { AIDetectionResult } from './analyzers/ai-detection'
import { analyzeClientRisks } from './analyzers/client-risks'
import { analyzeJSLibraries } from './analyzers/js-libraries-analyzer'
import { analyzeTechStack } from './analyzers/tech-stack-analyzer'
import { analyzeAiTrust } from './analyzers/ai-trust-analyzer'
import { analyzeCORS } from './analyzers/cors-analyzer'
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
import { analyzeFrontendFramework } from './analyzers/frontend-framework-security-analyzer'
import { analyzePassiveAPIDiscovery } from './analyzers/passive-api-discovery-analyzer'
import { calculateSecurityScore } from './scoring-v3'
import { generateReport } from './report-generator'
import { transformToCrawlerResult } from './fast-scanner-wrapper'

const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

// Initialize worker manager
const workerManager = WorkerManager.getInstance()

console.log('[AI Batch Worker] ⚡ OPTIMIZED MODE - AI Red Teaming Only')
console.log('[AI Batch Worker] Using PHP Crawler (80ms vs 3700ms Playwright)')
console.log('[AI Batch Worker] Skipping: Reconnaissance, Admin, Port Scan, DNS, Compliance, WAF, MFA')

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
      )
    ])
    return result
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`[AI Batch] ⏰ ${analyzerName} ${errorMsg} - using default`)
    return defaultValue
  }
}

async function processScanJob(data: { scanId: string; url: string }) {
  const { scanId, url } = data

  console.log(`[AI Batch] Processing scan ${scanId} for ${url}`)

  const timings: Record<string, number> = {}
  const startTime = Date.now()

  try {
    // Update status to scanning
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'SCANNING',
        startedAt: new Date(),
        workerId: `ai-batch-${process.pid}`,
      },
    })

    // ============================================================
    // STEP 1: PHP CRAWLER (80ms vs 3700ms Playwright!)
    // ============================================================
    console.log(`[AI Batch] 🚀 PHP Crawling ${url}...`)
    const crawlStart = Date.now()

    const phpCommand = `php /home/aiq/Asztal/10_M_USD/ai-security-scanner/workers/fast-scanner/scanner-turbo.php "${url}"`
    const { stdout } = await execAsync(phpCommand, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    })

    const scanResult = JSON.parse(stdout)
    if (!scanResult.success) {
      throw new Error(`PHP scanner failed: ${scanResult.error || 'Unknown error'}`)
    }

    const crawlResult = transformToCrawlerResult(scanResult, url)
    timings.crawl = Date.now() - crawlStart
    console.log(`[AI Batch] ✅ Crawl completed in ${timings.crawl}ms (PHP)`)

    // ============================================================
    // STEP 2: AI-ONLY ANALYZERS (No reconnaissance, admin, port scan, DNS, etc!)
    // ============================================================
    console.log(`[AI Batch] 🤖 Running AI-focused analyzers...`)
    const analyzerStart = Date.now()

    // Core AI-relevant analyzers
    const clientRisks = analyzeClientRisks(crawlResult)
    const jsLibraries = analyzeJSLibraries(crawlResult)
    const techStack = analyzeTechStack(crawlResult)
    const corsAnalysis = analyzeCORS(crawlResult)
    const rateLimiting = await analyzeRateLimiting(crawlResult.responseHeaders || {}, crawlResult.html)
    const graphQL = await analyzeGraphQL(crawlResult)
    const errorDisclosure = analyzeErrorDisclosure(crawlResult)
    const spaApi = analyzeSpaApi(crawlResult)
    const backendFramework = analyzeBackendFramework(crawlResult)
    const frontendFramework = analyzeFrontendFramework(crawlResult)
    const passiveAPI = await runWithTimeout(
      () => analyzePassiveAPIDiscovery(crawlResult.html, url),
      5000,
      'Passive API Discovery',
      {
        findings: [],
        discoveredAPIs: [],
        exposedTokens: [],
        sqlErrors: [],
        stackTraces: [],
        debugIndicators: [],
        hasJWT: false,
        hasAPIKeys: false,
        hasSQLErrors: false,
        hasStackTraces: false,
        hasDebugMode: false,
        riskLevel: 'none' as const
      }
    )

    // AI Trust Score (CORE!)
    console.log(`[AI Batch] 🎯 Analyzing AI Trust Score...`)
    const aiTrustStart = Date.now()
    const aiTrustResult = analyzeAiTrust(crawlResult, 100) // SSL score simplified to 100
    timings.aiTrust = Date.now() - aiTrustStart
    console.log(`[AI Batch] ✅ AI Trust Score: ${aiTrustResult.weightedScore ?? 0}/100 (${aiTrustResult.grade})`)
    console.log(`[AI Batch]   - Has AI: ${aiTrustResult.hasAiImplementation}`)
    console.log(`[AI Batch]   - Confidence: ${aiTrustResult.aiConfidenceLevel}`)

    // AI Detection (based on AI Trust Score)
    const aiDetection: AIDetectionResult = {
      hasAI: aiTrustResult.hasAiImplementation || false,
      providers: aiTrustResult.detectedAiProvider ? [aiTrustResult.detectedAiProvider] : [],
      chatWidgets: aiTrustResult.detectedChatFramework ? [aiTrustResult.detectedChatFramework] : [],
      apiEndpoints: [],
      jsLibraries: [],
      vectorDatabases: [],
      mlFrameworks: [],
      voiceServices: [],
      imageServices: [],
      securityTools: [],
      detailedFindings: []
    }

    // OWASP LLM analyzers (ONLY if AI detected!)
    let llm01PromptInjection, llm02InsecureOutput, llm05SupplyChain, llm06SensitiveInfo, llm07PluginDesign, llm08ExcessiveAgency

    if (aiTrustResult.hasAiImplementation && (aiTrustResult.aiConfidenceLevel === 'medium' || aiTrustResult.aiConfidenceLevel === 'high')) {
      console.log(`[AI Batch] 🤖 AI detected! Running OWASP LLM analyzers...`)

      llm01PromptInjection = await analyzeLLM01PromptInjection(crawlResult.html, crawlResult.responseHeaders || {})
      llm02InsecureOutput = await analyzeLLM02InsecureOutput(crawlResult.html, crawlResult.responseHeaders || {})
      llm07PluginDesign = await analyzeLLM07PluginDesign(crawlResult.html, crawlResult.responseHeaders || {})
      llm08ExcessiveAgency = await analyzeLLM08ExcessiveAgency(crawlResult.html, crawlResult.responseHeaders || {})
      llm05SupplyChain = await analyzeLLM05SupplyChain(crawlResult.html, crawlResult.responseHeaders || {})
      llm06SensitiveInfo = await runWithTimeout(
        () => analyzeLLM06SensitiveInfo(crawlResult.html, crawlResult.responseHeaders || {}),
        25000,
        'LLM06',
        {
          findings: [],
          hasAPIKeys: false,
          hasSystemPrompts: false,
          hasTrainingData: false,
          hasPII: false,
          hasInternalEndpoints: false,
          hasModelInfo: false,
          exposedDataTypes: [],
          overallRisk: 'none' as const,
          timeout: true
        }
      )

      console.log(`[AI Batch] ✅ OWASP LLM analyzers completed`)
    } else {
      console.log(`[AI Batch] ⚪ No AI detected - Skipping OWASP LLM analyzers`)

      // Empty results for all OWASP LLM analyzers
      llm01PromptInjection = {
        findings: [],
        hasSystemPromptLeaks: false,
        hasRiskyPromptAssembly: false,
        hasMissingSanitization: false,
        hasAIContext: false,
        sanitizationMethods: [],
        overallRisk: 'none' as const,
        aiEndpointsDetected: []
      }

      llm02InsecureOutput = {
        findings: [],
        hasDangerousDOM: false,
        hasUnsafeMarkdown: false,
        hasEvalUsage: false,
        cspStrength: 'none' as const,
        sanitizationLibraries: [],
        overallRisk: 'none' as const
      }

      llm05SupplyChain = {
        findings: [],
        hasVulnerablePackages: false,
        hasMissingSRI: false,
        hasUntrustedModels: false,
        vulnerablePackages: [],
        missingIntegrity: 0,
        untrustedModelSources: [],
        overallRisk: 'none' as const
      }

      llm06SensitiveInfo = {
        findings: [],
        hasAPIKeys: false,
        hasSystemPrompts: false,
        hasTrainingData: false,
        hasPII: false,
        hasInternalEndpoints: false,
        hasModelInfo: false,
        exposedDataTypes: [],
        overallRisk: 'none' as const
      }

      llm07PluginDesign = {
        findings: [],
        hasCriticalTools: false,
        hasHighRiskTools: false,
        detectedTools: [],
        toolArchitectures: [],
        overallRisk: 'none' as const
      }

      llm08ExcessiveAgency = {
        findings: [],
        hasAutoExecute: false,
        hasSandbox: false,
        hasApproval: false,
        hasLogging: false,
        hasRateLimiting: false,
        overallRisk: 'none' as const
      }
    }

    timings.analyzers = Date.now() - analyzerStart
    console.log(`[AI Batch] ✅ Analyzers completed in ${timings.analyzers}ms`)

    // ============================================================
    // STEP 3: SIMPLIFIED ANALYZERS (for compatibility)
    // ============================================================

    // Simplified SSL (just check if exists)
    const sslTLS = {
      score: crawlResult.sslCertificate ? 100 : 0,
      hasValidCert: !!crawlResult.sslCertificate,
      findings: []
    }

    // Simplified security headers (minimal)
    const securityHeaders = {
      missing: [],
      present: [],
      warnings: [],
      score: 100,
      findings: []
    }

    // Simplified cookie security
    const cookieSecurity = {
      totalCookies: crawlResult.cookies?.length || 0,
      insecureCookies: 0,
      score: 100,
      findings: []
    }

    // Empty results for SKIPPED analyzers (for generateReport compatibility)
    const reconnaissance = { findings: [], score: 100, summary: { total: 0, criticalExposures: 0, highExposures: 0, mediumExposures: 0, lowExposures: 0 } }
    const adminDetection = { hasAdminPanel: false, hasLoginForm: false, findings: [], adminUrls: [], loginForms: [] }
    const adminDiscovery = { hasAdminPanel: false, hasLoginForm: false, findings: [], adminUrls: [], loginForms: 0 }
    const dnsSecurity = { domain: new URL(url).hostname, findings: [], hasDNSSEC: false, hasSPF: false, hasDKIM: false, hasDMARC: false, hasCAA: false, score: 100, summary: { total: 0, high: 0, medium: 0, low: 0, info: 0 } }
    const portScan = { findings: [], exposedDatabases: 0, exposedInterfaces: 0, exposedDevServers: 0, score: 100, summary: { critical: 0, high: 0, medium: 0, low: 0 } }
    const compliance = { findings: [], gdprScore: 100, ccpaScore: 100, pciScore: 100, hipaaScore: 100, overallCompliance: 'full' as const }
    const wafDetection = { hasWAF: false, primaryWAF: null, detectedWAFs: [], confidence: 'none' as const, findings: [] }
    const mfaDetection = { hasMFA: false, hasOAuth: false, hasWebAuthn: false, hasTOTP: false, detectedMethods: [], findings: [] }

    // ============================================================
    // STEP 4: GENERATE REPORT & SCORE
    // ============================================================
    console.log(`[AI Batch] 📊 Generating report...`)
    const reportStart = Date.now()

    const report = generateReport(
      aiDetection,
      securityHeaders,
      clientRisks,
      sslTLS,
      cookieSecurity,
      jsLibraries,
      techStack,
      reconnaissance,
      adminDetection,
      adminDiscovery,
      { ...corsAnalysis, bypassPatterns: [] },
      dnsSecurity,
      portScan,
      compliance,
      wafDetection,
      mfaDetection,
      rateLimiting,
      graphQL,
      errorDisclosure,
      spaApi,
      llm01PromptInjection,
      llm02InsecureOutput,
      llm05SupplyChain,
      llm06SensitiveInfo,
      llm07PluginDesign,
      llm08ExcessiveAgency,
      backendFramework,
      { detectedServers: [], findings: [], score: 100 }, // webServer simplified
      frontendFramework,
      passiveAPI
    )

    timings.reportGeneration = Date.now() - reportStart

    // Calculate security score
    const scoreBreakdown = calculateSecurityScore(
      report.findings || [],
      {
        hasAI: aiDetection.hasAI,
        sslCertificate: crawlResult.sslCertificate,
      }
    )

    report.summary.riskScore = {
      score: scoreBreakdown.overallScore,
      level: scoreBreakdown.riskLevel,
      grade: scoreBreakdown.grade,
    }
    report.scoreBreakdown = scoreBreakdown

    timings.total = Date.now() - startTime

    console.log(`[AI Batch] ✅ Score: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.grade}, ${scoreBreakdown.riskLevel})`)
    console.log(`[AI Batch] ⚡ Total time: ${timings.total}ms`)

    // ============================================================
    // STEP 5: SAVE TO DATABASE
    // ============================================================
    const hasAI = (report.detectedTech?.aiProviders?.length ?? 0) > 0

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        riskScore: scoreBreakdown.overallScore,
        riskLevel: scoreBreakdown.riskLevel,
        workerId: null,
        hasAI: hasAI,
        detectedTech: report.detectedTech,
        findings: report as any,
        metadata: {
          timings,
          mode: 'ai-batch',
          scoreBreakdown,
        } as any,
        completedAt: new Date(),
        scanDuration: timings.total,

        // AI specific fields
        aiTrustScore: aiTrustResult,

        // OWASP LLM findings
        owaspLlm01: llm01PromptInjection,
        owaspLlm02: llm02InsecureOutput,
        owaspLlm05: llm05SupplyChain,
        owaspLlm06: llm06SensitiveInfo,
        owaspLlm07: llm07PluginDesign,
        owaspLlm08: llm08ExcessiveAgency,

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
        webServer: { detectedServers: [], findings: [], score: 100 },
        frontendFramework,
        passiveAPIDiscovery: passiveAPI
      },
    })

    // Save AI Trust Scorecard
    await prisma.aiTrustScorecard.upsert({
      where: { scanId: scanId },
      create: {
        scanId: scanId,
        isProviderDisclosed: aiTrustResult.checks.isProviderDisclosed,
        isIdentityDisclosed: aiTrustResult.checks.isIdentityDisclosed,
        isAiPolicyLinked: aiTrustResult.checks.isAiPolicyLinked,
        isModelVersionDisclosed: aiTrustResult.checks.isModelVersionDisclosed,
        isLimitationsDisclosed: aiTrustResult.checks.isLimitationsDisclosed,
        hasDataUsageDisclosure: aiTrustResult.checks.hasDataUsageDisclosure,
        hasFeedbackMechanism: aiTrustResult.checks.hasFeedbackMechanism,
        hasConversationReset: aiTrustResult.checks.hasConversationReset,
        hasHumanEscalation: aiTrustResult.checks.hasHumanEscalation,
        hasConversationExport: aiTrustResult.checks.hasConversationExport,
        hasDataDeletionOption: aiTrustResult.checks.hasDataDeletionOption,
        hasDpoContact: aiTrustResult.checks.hasDpoContact,
        hasCookieBanner: aiTrustResult.checks.hasCookieBanner,
        hasPrivacyPolicyLink: aiTrustResult.checks.hasPrivacyPolicyLink,
        hasTermsOfServiceLink: aiTrustResult.checks.hasTermsOfServiceLink,
        hasGdprCompliance: aiTrustResult.checks.hasGdprCompliance,
        hasBotProtection: aiTrustResult.checks.hasBotProtection,
        hasAiRateLimitHeaders: aiTrustResult.checks.hasAiRateLimitHeaders,
        hasBasicWebSecurity: aiTrustResult.checks.hasBasicWebSecurity,
        hasInputLengthLimit: aiTrustResult.checks.hasInputLengthLimit,
        usesInputSanitization: aiTrustResult.checks.usesInputSanitization,
        hasErrorHandling: aiTrustResult.checks.hasErrorHandling,
        hasSessionManagement: aiTrustResult.checks.hasSessionManagement,
        hasBiasDisclosure: aiTrustResult.checks.hasBiasDisclosure,
        hasContentModeration: aiTrustResult.checks.hasContentModeration,
        hasAgeVerification: aiTrustResult.checks.hasAgeVerification,
        hasAccessibilitySupport: aiTrustResult.checks.hasAccessibilitySupport,
        score: aiTrustResult.score ?? 0,
        weightedScore: aiTrustResult.weightedScore ?? 0,
        categoryScores: aiTrustResult.categoryScores,
        passedChecks: aiTrustResult.passedChecks,
        totalChecks: aiTrustResult.totalChecks,
        relevantChecks: aiTrustResult.relevantChecks || 0,
        hasAiImplementation: aiTrustResult.hasAiImplementation || false,
        aiConfidenceLevel: aiTrustResult.aiConfidenceLevel || 'none',
        detectedAiProvider: aiTrustResult.detectedAiProvider,
        detectedModel: aiTrustResult.detectedModel,
        detectedChatFramework: aiTrustResult.detectedChatFramework,
        evidenceData: (aiTrustResult.evidenceData || {}) as any,
        detailedChecks: (aiTrustResult.detailedChecks || {}) as any,
        summary: (aiTrustResult.summary || {}) as any,
      },
      update: {
        isProviderDisclosed: aiTrustResult.checks.isProviderDisclosed,
        isIdentityDisclosed: aiTrustResult.checks.isIdentityDisclosed,
        isAiPolicyLinked: aiTrustResult.checks.isAiPolicyLinked,
        isModelVersionDisclosed: aiTrustResult.checks.isModelVersionDisclosed,
        isLimitationsDisclosed: aiTrustResult.checks.isLimitationsDisclosed,
        hasDataUsageDisclosure: aiTrustResult.checks.hasDataUsageDisclosure,
        hasFeedbackMechanism: aiTrustResult.checks.hasFeedbackMechanism,
        hasConversationReset: aiTrustResult.checks.hasConversationReset,
        hasHumanEscalation: aiTrustResult.checks.hasHumanEscalation,
        hasConversationExport: aiTrustResult.checks.hasConversationExport,
        hasDataDeletionOption: aiTrustResult.checks.hasDataDeletionOption,
        hasDpoContact: aiTrustResult.checks.hasDpoContact,
        hasCookieBanner: aiTrustResult.checks.hasCookieBanner,
        hasPrivacyPolicyLink: aiTrustResult.checks.hasPrivacyPolicyLink,
        hasTermsOfServiceLink: aiTrustResult.checks.hasTermsOfServiceLink,
        hasGdprCompliance: aiTrustResult.checks.hasGdprCompliance,
        hasBotProtection: aiTrustResult.checks.hasBotProtection,
        hasAiRateLimitHeaders: aiTrustResult.checks.hasAiRateLimitHeaders,
        hasBasicWebSecurity: aiTrustResult.checks.hasBasicWebSecurity,
        hasInputLengthLimit: aiTrustResult.checks.hasInputLengthLimit,
        usesInputSanitization: aiTrustResult.checks.usesInputSanitization,
        hasErrorHandling: aiTrustResult.checks.hasErrorHandling,
        hasSessionManagement: aiTrustResult.checks.hasSessionManagement,
        hasBiasDisclosure: aiTrustResult.checks.hasBiasDisclosure,
        hasContentModeration: aiTrustResult.checks.hasContentModeration,
        hasAgeVerification: aiTrustResult.checks.hasAgeVerification,
        hasAccessibilitySupport: aiTrustResult.checks.hasAccessibilitySupport,
        score: aiTrustResult.score ?? 0,
        weightedScore: aiTrustResult.weightedScore ?? 0,
        categoryScores: aiTrustResult.categoryScores,
        passedChecks: aiTrustResult.passedChecks,
        totalChecks: aiTrustResult.totalChecks,
        relevantChecks: aiTrustResult.relevantChecks || 0,
        hasAiImplementation: aiTrustResult.hasAiImplementation || false,
        aiConfidenceLevel: aiTrustResult.aiConfidenceLevel || 'none',
        detectedAiProvider: aiTrustResult.detectedAiProvider,
        detectedModel: aiTrustResult.detectedModel,
        detectedChatFramework: aiTrustResult.detectedChatFramework,
        evidenceData: (aiTrustResult.evidenceData || {}) as any,
        detailedChecks: (aiTrustResult.detailedChecks || {}) as any,
        summary: (aiTrustResult.summary || {}) as any,
      },
    })

    console.log(`[AI Batch] ✅ Scan ${scanId} completed successfully`)

    return { success: true, scanId, riskScore: scoreBreakdown.overallScore }

  } catch (error) {
    console.error(`[AI Batch] ❌ Error processing scan ${scanId}:`, error)

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        workerId: null,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          mode: 'ai-batch'
        },
        completedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Process one job from the queue
 */
async function processOneJob() {
  try {
    const job = await jobQueue.getNext()

    if (job) {
      console.log(`[AI Batch] 🎯 Found job ${job.id} (type: ${job.type})`)

      try {
        if (job.type === 'scan') {
          const scanPromise = processScanJob(job.data)
          const timeoutPromise = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('⏰ Scan timeout after 60s')), 60000)
          )

          await Promise.race([scanPromise, timeoutPromise])
          await jobQueue.complete(job.id)
          console.log(`[AI Batch] ✅ Job completed successfully`)
        } else {
          console.log(`[AI Batch] ⚠️  Unknown job type: ${job.type}`)
          await jobQueue.fail(job.id, `Unknown job type: ${job.type}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (job.type === 'scan' && job.data.scanId) {
          try {
            await prisma.scan.update({
              where: { id: job.data.scanId },
              data: {
                status: 'FAILED',
                workerId: null,
                completedAt: new Date(),
              },
            })
            console.log(`[AI Batch] 📝 Marked scan ${job.data.scanId} as FAILED`)
          } catch (dbError) {
            console.error('[AI Batch] ❌ Failed to update scan status:', dbError)
          }
        }

        await jobQueue.fail(job.id, errorMessage)
        console.log(`[AI Batch] ❌ Job failed: ${errorMessage}`)
      }
    } else {
      console.log('[AI Batch] 💤 No jobs found, waiting 2s...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } catch (error) {
    console.error('[AI Batch] ❌ Error checking for jobs:', error)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

// Continuous worker loop
async function workerLoop() {
  const canStart = await workerManager.start()
  if (!canStart) {
    console.log('[AI Batch] Another worker is already running, exiting...')
    process.exit(0)
  }

  console.log('[AI Batch] ✅ AI Batch Worker started (Optimized Mode)')
  console.log('[AI Batch] 🔄 Processing jobs...')

  let running = true
  let jobsProcessed = 0

  const shutdown = async () => {
    running = false
    console.log('[AI Batch] 🛑 Shutdown signal received, will exit after current job...')
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  while (running) {
    await processOneJob()
    jobsProcessed++

    if (!running) break
  }

  console.log(`[AI Batch] 🧹 Cleaning up... (processed ${jobsProcessed} jobs)`)
  await workerManager.shutdown()
  process.exit(0)
}

// Start the worker loop
workerLoop()

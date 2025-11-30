/**
 * SQLite Queue Worker
 *
 * Polls the Job table for pending jobs and processes them
 */

import { prisma } from '../lib/db'
import { jobQueue } from '../lib/queue-sqlite'
import { MockCrawler } from './crawler-mock'
import { CrawlerAdapter } from '../lib/crawler-adapter'
import { HybridCrawler } from '../lib/crawler-hybrid'
import { WorkerManager } from './worker-manager'
import { AIDetectionResult } from './analyzers/ai-detection' // Import only the type, not the function
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
import { analyzeBackendFramework } from './analyzers/backend-framework-detector' // ⭐ NEW: Backend framework security
import { analyzeWebServer } from './analyzers/web-server-security-analyzer' // ⭐ NEW: Web server security
import { analyzeFrontendFramework } from './analyzers/frontend-framework-security-analyzer' // ⭐ NEW: Frontend framework security
import { analyzePassiveAPIDiscovery } from './analyzers/passive-api-discovery-analyzer' // ⭐ NEW: Passive API discovery
import { calculateSecurityScore } from './scoring-v3' // ✨ NEW: Professional scoring system v3 (100 = perfect)
import { generateReport } from './report-generator'

// Initialize worker manager
const workerManager = WorkerManager.getInstance()

// Choose crawler based on environment variable
const USE_REAL_CRAWLER = process.env.USE_REAL_CRAWLER === 'true'
const USE_HYBRID_CRAWLER = process.env.USE_HYBRID_CRAWLER === 'true'

// Crawler selection: Hybrid > Real (Playwright) > Mock
let crawler: CrawlerAdapter | HybridCrawler | MockCrawler
if (USE_HYBRID_CRAWLER) {
  crawler = new HybridCrawler()
  console.log(`[Worker] Using HYBRID crawler (curl_cffi + Playwright fallback)`)
} else if (USE_REAL_CRAWLER) {
  crawler = new CrawlerAdapter()
  console.log(`[Worker] Using REAL Playwright crawler`)
} else {
  crawler = new MockCrawler()
  console.log(`[Worker] Using MOCK crawler`)
}

/**
 * Timeout wrapper for analyzers
 * Prevents infinite loops by killing analyzer after timeout
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
    console.log(`[Worker] ⏰ ${analyzerName} ${errorMsg} - using default`)
    return defaultValue
  }
}

async function processScanJob(data: { scanId: string; url: string }) {
  const { scanId, url } = data

  console.log(`[Worker] ═══════════════════════════════════════════════════════════════`)
  console.log(`[Worker] 🚀 STARTING SCAN: ${url}`)
  console.log(`[Worker] ═══════════════════════════════════════════════════════════════`)

  // Performance timing tracking
  const timings: Record<string, number> = {}
  const startTime = Date.now()

  // Helper function to log step progress
  const logStep = (step: string, status: 'START' | 'DONE' | 'ERROR', durationMs?: number) => {
    const elapsed = Date.now() - startTime
    const statusIcon = status === 'START' ? '▶️' : status === 'DONE' ? '✅' : '❌'
    const durationStr = durationMs ? ` (${durationMs}ms)` : ''
    const totalStr = ` [Total: ${elapsed}ms]`
    console.log(`[Worker] ${statusIcon} ${step}${durationStr}${totalStr}`)
  }

  try {
    // Update status to scanning
    logStep('Step 0: Update status to SCANNING', 'START')
    const dbUpdateStart = Date.now()
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'SCANNING',
        startedAt: new Date(),
        workerId: process.pid.toString(), // Store worker PID for monitoring
      },
    })
    logStep('Step 0: Update status to SCANNING', 'DONE', Date.now() - dbUpdateStart)

    // Step 1: Crawl the website
    logStep('Step 1: Crawl website with Playwright', 'START')
    const crawlStart = Date.now()
    const crawlResult = await crawler.crawl(url)
    timings.crawl = Date.now() - crawlStart
    logStep('Step 1: Crawl website with Playwright', 'DONE', timings.crawl)

    // CRITICAL FIX: Ensure HTML is ALWAYS a string (not Buffer/Object)
    // Many analyzers call html.toLowerCase() which fails if html is not a string
    if (typeof crawlResult.html !== 'string' && crawlResult.html) {
      crawlResult.html = crawlResult.html.toString()
    }

    // Step 2: Run all analyzers
    logStep('Step 2: Running 31 security analyzers', 'START')
    const analyzerStart = Date.now()

    // NOTE: AI Detection moved to after AI Trust Score (line 237) to ensure consistency

    logStep('  2.1: Security Headers analyzer', 'START')
    const securityHeadersStart = Date.now()
    const securityHeaders = analyzeSecurityHeaders(crawlResult)
    timings.securityHeaders = Date.now() - securityHeadersStart
    logStep('  2.1: Security Headers analyzer', 'DONE', timings.securityHeaders)

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

    // NEW: Reconnaissance analyzer (with timeout)
    const reconnaissanceStart = Date.now()
    let reconnaissance
    try {
      const reconPromise = analyzeReconnaissance(crawlResult)
      const reconTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Reconnaissance timeout')), 5000)
      )
      reconnaissance = await Promise.race([reconPromise, reconTimeout]) as any
    } catch (error) {
      console.log(`[Worker] ⚠️  Reconnaissance analyzer skipped: ${error instanceof Error ? error.message : 'Unknown error'}`)
      reconnaissance = { findings: [], summary: { total: 0, criticalExposures: 0, highExposures: 0, mediumExposures: 0, lowExposures: 0 } }
    }
    timings.reconnaissance = Date.now() - reconnaissanceStart

    // NEW: Admin Detection analyzer (with timeout)
    const adminDetectionStart = Date.now()
    let adminDetection
    try {
      const adminPromise = analyzeAdminDetection(crawlResult)
      const adminTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Admin detection timeout')), 5000)
      )
      adminDetection = await Promise.race([adminPromise, adminTimeout]) as any
    } catch (error) {
      console.log(`[Worker] ⚠️  Admin Detection analyzer skipped: ${error instanceof Error ? error.message : 'Unknown error'}`)
      adminDetection = { hasAdminPanel: false, hasLoginForm: false, findings: [], adminUrls: [], loginForms: [] }
    }
    timings.adminDetection = Date.now() - adminDetectionStart

    // NEW: Admin Discovery analyzer (enhanced with API docs & GraphQL)
    const adminDiscoveryStart = Date.now()
    let adminDiscovery
    try {
      const discoveryPromise = analyzeAdminDiscovery(crawlResult)
      const discoveryTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Admin discovery timeout')), 5000)
      )
      adminDiscovery = await Promise.race([discoveryPromise, discoveryTimeout]) as any
    } catch (error) {
      console.log(`[Worker] ⚠️  Admin Discovery analyzer skipped: ${error instanceof Error ? error.message : 'Unknown error'}`)
      adminDiscovery = { hasAdminPanel: false, hasLoginForm: false, findings: [], adminUrls: [], loginForms: 0 }
    }
    timings.adminDiscovery = Date.now() - adminDiscoveryStart

    // NEW: CORS analyzer
    const corsStart = Date.now()
    const corsAnalysis = analyzeCORS(crawlResult)
    const corsBypassPatterns = checkCORSBypassPatterns(crawlResult)
    timings.cors = Date.now() - corsStart

    // NEW: Port Scanner analyzer (with timeout)
    const portScanStart = Date.now()
    let portScan
    try {
      const portScanPromise = analyzePortScan(crawlResult)
      const portScanTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Port scan timeout')), 5000)
      )
      portScan = await Promise.race([portScanPromise, portScanTimeout]) as any
    } catch (error) {
      console.log(`[Worker] ⚠️  Port Scanner analyzer skipped: ${error instanceof Error ? error.message : 'Unknown error'}`)
      portScan = { findings: [], exposedDatabases: 0, exposedInterfaces: 0, exposedDevServers: 0, score: 100, summary: { critical: 0, high: 0, medium: 0, low: 0 } }
    }
    timings.portScan = Date.now() - portScanStart

    // NEW: Compliance analyzer (GDPR, CCPA, PCI DSS, HIPAA)
    const complianceStart = Date.now()
    const compliance = await analyzeCompliance(
      crawlResult.html,
      crawlResult.cookies || [],
      crawlResult.responseHeaders || {},
      crawlResult.url // Nov 16, 2025: Added for EU scope detection
    )
    timings.compliance = Date.now() - complianceStart

    // NEW: WAF Detection analyzer (Cloudflare, AWS, Akamai, etc.)
    const wafStart = Date.now()
    const wafDetection = await analyzeWAFDetection(
      crawlResult.responseHeaders || {},
      crawlResult.cookies || [],
      crawlResult.html
    )
    timings.waf = Date.now() - wafStart

    // NEW: MFA/2FA Detection analyzer (OAuth, SAML, WebAuthn, TOTP)
    const mfaStart = Date.now()
    const mfaDetection = await analyzeMFADetection(crawlResult.html)
    timings.mfa = Date.now() - mfaStart

    // NEW: Rate Limiting analyzer
    const rateLimitStart = Date.now()
    const rateLimiting = await analyzeRateLimiting(crawlResult.responseHeaders || {}, crawlResult.html)
    timings.rateLimit = Date.now() - rateLimitStart

    // NEW: GraphQL Security analyzer
    const graphqlStart = Date.now()
    const graphqlSecurity = await analyzeGraphQL(crawlResult.html)
    timings.graphql = Date.now() - graphqlStart

    // NEW: Error Disclosure analyzer
    const errorStart = Date.now()
    const errorDisclosure = await analyzeErrorDisclosure(crawlResult.html, crawlResult.responseHeaders || {})
    timings.errorDisclosure = Date.now() - errorStart

    // NEW: SPA/API Detection analyzer
    const spaStart = Date.now()
    const spaApi = await analyzeSpaApi(
      crawlResult.html,
      [], // JS files - we could extract from crawlResult if needed
      [] // Network requests - would need to be captured by crawler
    )
    timings.spaApi = Date.now() - spaStart

    // ⭐ NEW: Backend Framework Security analyzer
    console.log(`[Worker] 🔍 Analyzing Backend Framework Security...`)
    const backendFrameworkStart = Date.now()
    const backendFramework = await analyzeBackendFramework(
      crawlResult.html,
      crawlResult.responseHeaders || {},
      crawlResult.cookies || []
    )
    timings.backendFramework = Date.now() - backendFrameworkStart
    console.log(`[Worker] ✓ Backend Framework analysis completed in ${timings.backendFramework}ms`)
    if (backendFramework.hasFramework) {
      console.log(`[Worker]   - Detected frameworks: ${backendFramework.detectedFrameworks.map(f => `${f.name}${f.version ? ` ${f.version}` : ''}`).join(', ')}`)
      console.log(`[Worker]   - Security findings: ${backendFramework.findings.length}`)
    }

    // ⭐ NEW: Web Server Security analyzer
    console.log(`[Worker] 🔍 Analyzing Web Server Security...`)
    const webServerStart = Date.now()
    const webServer = await analyzeWebServer(
      crawlResult.responseHeaders || {}
    )
    timings.webServer = Date.now() - webServerStart
    console.log(`[Worker] ✓ Web Server analysis completed in ${timings.webServer}ms`)
    if (webServer.detectedServers && webServer.detectedServers.length > 0) {
      const primaryServer = webServer.detectedServers[0]
      console.log(`[Worker]   - Detected server: ${primaryServer.name}${primaryServer.version ? ` ${primaryServer.version}` : ''}`)
      console.log(`[Worker]   - Security findings: ${webServer.findings.length}`)
    }

    // ⭐ NEW: Frontend Framework Security analyzer
    console.log(`[Worker] 🔍 Analyzing Frontend Framework Security...`)
    const frontendFrameworkStart = Date.now()
    const frontendFramework = await analyzeFrontendFramework(
      crawlResult.html,
      [] // TODO: Extract script URLs from crawlResult if available
    )
    timings.frontendFramework = Date.now() - frontendFrameworkStart
    console.log(`[Worker] ✓ Frontend Framework analysis completed in ${timings.frontendFramework}ms`)
    if (frontendFramework.hasFramework) {
      console.log(`[Worker]   - Detected frameworks: ${frontendFramework.detectedFrameworks.map(f => `${f.name}${f.version ? ` ${f.version}` : ''}`).join(', ')}`)
      console.log(`[Worker]   - Dev mode enabled: ${frontendFramework.hasDevMode}`)
      console.log(`[Worker]   - Source maps exposed: ${frontendFramework.hasSourceMaps}`)
      console.log(`[Worker]   - Security findings: ${frontendFramework.findings.length}`)
    }

    // ⭐ NEW: Passive API Discovery analyzer (with 5s timeout)
    console.log(`[Worker] 🔍 Analyzing Passive API Discovery...`)
    const passiveAPIStart = Date.now()
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
    timings.passiveAPI = Date.now() - passiveAPIStart
    console.log(`[Worker] ✓ Passive API Discovery completed in ${timings.passiveAPI}ms`)
    console.log(`[Worker]   - JWT tokens: ${passiveAPI.hasJWT ? 'FOUND' : 'none'}`)
    console.log(`[Worker]   - API keys: ${passiveAPI.hasAPIKeys ? 'FOUND' : 'none'}`)
    console.log(`[Worker]   - SQL errors: ${passiveAPI.hasSQLErrors ? 'FOUND' : 'none'}`)
    console.log(`[Worker]   - Stack traces: ${passiveAPI.hasStackTraces ? 'FOUND' : 'none'}`)
    console.log(`[Worker]   - API endpoints discovered: ${passiveAPI.discoveredAPIs.length}`)
    console.log(`[Worker]   - Risk level: ${passiveAPI.riskLevel.toUpperCase()}`)
    console.log(`[Worker]   - Security findings: ${passiveAPI.findings.length}`)

    // Step 2.5: Analyze AI Trust Score (MOVED HERE - BEFORE OWASP LLM!)
    console.log(`[Worker] Analyzing AI Trust Score...`)
    const aiTrustStart = Date.now()
    const aiTrustResult = analyzeAiTrust(crawlResult, sslTLS.score)
    timings.aiTrust = Date.now() - aiTrustStart
    console.log(`[Worker] ✓ AI Trust Score: ${aiTrustResult.weightedScore ?? 0}/100 (${aiTrustResult.grade})`)
    console.log(`[Worker]   - Has AI Implementation: ${aiTrustResult.hasAiImplementation}`)
    console.log(`[Worker]   - AI Confidence Level: ${aiTrustResult.aiConfidenceLevel}`)
    console.log(`[Worker]   - Trust checks: ${aiTrustResult.passedChecks}/${aiTrustResult.totalChecks} passed`)
    if (aiTrustResult.detectedAiProvider) {
      console.log(`[Worker]   - Detected AI Provider: ${aiTrustResult.detectedAiProvider}`)
    }

    // REPLACE OLD AI DETECTION: Use AI Trust Score detection as the source of truth
    // This ensures consistency between AI Trust Score and the "AI Detection" section in the report
    const aiDetection: AIDetectionResult = {
      hasAI: aiTrustResult.hasAiImplementation || false,
      providers: aiTrustResult.detectedAiProvider ? [aiTrustResult.detectedAiProvider] : [],
      chatWidgets: aiTrustResult.detectedChatFramework ? [aiTrustResult.detectedChatFramework] : [],
      apiEndpoints: [], // AI Trust Score doesn't track endpoints separately
      jsLibraries: [], // AI Trust Score doesn't track libraries separately
      vectorDatabases: [],
      mlFrameworks: [],
      voiceServices: [],
      imageServices: [],
      securityTools: [],
      detailedFindings: []
    }

    // CONDITIONAL: OWASP LLM analyzers ONLY if AI is detected
    let llm01PromptInjection, llm02InsecureOutput, llm05SupplyChain, llm06SensitiveInfo, llm07PluginDesign, llm08ExcessiveAgency

    if (aiTrustResult.hasAiImplementation && (aiTrustResult.aiConfidenceLevel === 'medium' || aiTrustResult.aiConfidenceLevel === 'high')) {
      logStep('Step 3: AI detected - Running 6 OWASP LLM analyzers', 'START')
      console.log(`[Worker] 🤖 AI detected! Running OWASP LLM security analyzers...`)

      // NEW: OWASP LLM01 - Prompt Injection Risk analyzer (HIGH)
      console.log(`[Worker] 🔍 Running LLM01 (Prompt Injection)...`)
      const llm01Start = Date.now()
      llm01PromptInjection = await analyzeLLM01PromptInjection(
        crawlResult.html,
        crawlResult.responseHeaders || {}
      )
      timings.llm01 = Date.now() - llm01Start
      console.log(`[Worker] ✓ LLM01 completed in ${timings.llm01}ms`)

      // NEW: OWASP LLM02 - Insecure Output Handling analyzer (CRITICAL)
      console.log(`[Worker] 🔍 Running LLM02 (Insecure Output)...`)
      const llm02Start = Date.now()
      llm02InsecureOutput = await analyzeLLM02InsecureOutput(
        crawlResult.html,
        crawlResult.responseHeaders || {}
      )
      timings.llm02 = Date.now() - llm02Start
      console.log(`[Worker] ✓ LLM02 completed in ${timings.llm02}ms`)

      // NEW: OWASP LLM07 - Insecure Plugin Design analyzer (MEDIUM)
      console.log(`[Worker] 🔍 Running LLM07 (Plugin Design)...`)
      const llm07Start = Date.now()
      llm07PluginDesign = await analyzeLLM07PluginDesign(
        crawlResult.html,
        crawlResult.responseHeaders || {}
      )
      timings.llm07 = Date.now() - llm07Start
      console.log(`[Worker] ✓ LLM07 completed in ${timings.llm07}ms`)

      // NEW: OWASP LLM08 - Excessive Agency analyzer (MEDIUM)
      console.log(`[Worker] 🔍 Running LLM08 (Excessive Agency)...`)
      const llm08Start = Date.now()
      llm08ExcessiveAgency = await analyzeLLM08ExcessiveAgency(
        crawlResult.html,
        crawlResult.responseHeaders || {}
      )
      timings.llm08 = Date.now() - llm08Start
      console.log(`[Worker] ✓ LLM08 completed in ${timings.llm08}ms`)

      // NEW: OWASP LLM05 - Supply Chain Vulnerabilities analyzer (HIGH)
      console.log(`[Worker] 🔍 Running LLM05 (Supply Chain)...`)
      const llm05Start = Date.now()
      llm05SupplyChain = await analyzeLLM05SupplyChain(
        crawlResult.html,
        crawlResult.responseHeaders || {}
      )
      timings.llm05 = Date.now() - llm05Start
      console.log(`[Worker] ✓ LLM05 completed in ${timings.llm05}ms`)

      // NEW: OWASP LLM06 - Sensitive Information Disclosure analyzer (CRITICAL)
      // LAST to run (most expensive) + 25s timeout
      console.log(`[Worker] 🔍 Running LLM06 (Sensitive Info)...`)
      const llm06Start = Date.now()
      const llm06Result = await runWithTimeout(
        () => analyzeLLM06SensitiveInfo(crawlResult.html, crawlResult.responseHeaders || {}),
        25000, // 25 seconds max
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
      timings.llm06 = Date.now() - llm06Start

      if (llm06Result === null) {
        // Timeout - return safe empty result
        llm06SensitiveInfo = {
          findings: [],
          hasAPIKeys: false,
          hasSystemPrompts: false,
          hasTrainingData: false,
          hasPII: false,
          hasInternalEndpoints: false,
          hasModelInfo: false,
          exposedDataTypes: [],
          overallRisk: 'none' as const,
          timeout: true // Mark as timed out
        }
        console.log(`[Worker] ⚠️ LLM06 timed out - skipped (scan continues)`)
      } else {
        llm06SensitiveInfo = llm06Result
        console.log(`[Worker] ✓ LLM06 completed in ${timings.llm06}ms`)
      }
    } else {
      // NO AI detected - return empty/N/A results for all OWASP LLM analyzers
      console.log(`[Worker] ⚪ No AI implementation detected - Skipping OWASP LLM analyzers`)

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

      timings.llm01 = 0
      timings.llm02 = 0
      timings.llm05 = 0
      timings.llm06 = 0
      timings.llm07 = 0
      timings.llm08 = 0

      logStep('Step 3: Skipped OWASP LLM analyzers (no AI detected)', 'DONE', 0)
    }

    // Calculate total time before DNS (everything except DNS)
    timings.totalAnalyzersBeforeDNS = Date.now() - analyzerStart

    const totalOWASPTime = (timings.llm01 || 0) + (timings.llm02 || 0) + (timings.llm05 || 0) +
                          (timings.llm06 || 0) + (timings.llm07 || 0) + (timings.llm08 || 0)
    if (totalOWASPTime > 0) {
      logStep('Step 3: OWASP LLM analyzers completed', 'DONE', totalOWASPTime)
    }

    // AI Detection summary (now based on AI Trust Score)
    console.log(`[Worker] ✓ AI detected: ${aiDetection.hasAI} (based on AI Trust Score)`)
    console.log(`[Worker] ✓ Providers: ${aiDetection.providers.join(', ') || 'none'}`)
    console.log(`[Worker] ✓ Chat Widgets: ${aiDetection.chatWidgets.join(', ') || 'none'}`)
    console.log(`[Worker] ✓ API keys found: ${clientRisks.apiKeysFound.length}`)
    console.log(`[Worker] ✓ Missing headers: ${securityHeaders.missing.length}`)
    console.log(`[Worker] ✓ SSL/TLS score: ${sslTLS.score}/100`)
    console.log(`[Worker] ✓ Cookies: ${cookieSecurity.totalCookies} (${cookieSecurity.insecureCookies} insecure)`)
    console.log(`[Worker] ✓ JS Libraries: ${jsLibraries.detected.length} (${jsLibraries.vulnerable.length} vulnerable)`)
    console.log(`[Worker] ✓ Tech Stack: ${techStack.totalCount} technologies detected`)
    console.log(`[Worker] ✓ Reconnaissance: ${reconnaissance.findings.length} findings (${reconnaissance.summary.criticalExposures} critical)`)
    console.log(`[Worker] ✓ Admin Detection: ${adminDetection.hasAdminPanel ? 'Admin panel found' : 'No admin panel'}, ${adminDetection.hasLoginForm ? 'Login form found' : 'No login form'}`)
    console.log(`[Worker] ✓ Admin Discovery: ${adminDiscovery.findings.length} findings (${adminDiscovery.adminUrls.length} admin URLs)`)
    console.log(`[Worker] ✓ CORS: ${corsAnalysis.findings.length} findings (wildcard: ${corsAnalysis.hasWildcardOrigin}, credentials: ${corsAnalysis.allowsCredentials})`)
    console.log(`[Worker] ✓ Port Scanner: ${portScan.findings.length} findings (DB interfaces: ${portScan.exposedInterfaces}, Dev servers: ${portScan.exposedDevServers})`)
    console.log(`[Worker] ✓ Compliance: ${compliance.findings.length} findings (GDPR: ${compliance.gdprScore}%, CCPA: ${compliance.ccpaScore}%, ${compliance.overallCompliance})`)
    console.log(`[Worker] ✓ WAF Detection: ${wafDetection.hasWAF ? `${wafDetection.primaryWAF} detected` : 'No WAF detected'} (${wafDetection.detectedWAFs.length} WAFs)`)
    console.log(`[Worker] ✓ MFA/2FA: ${mfaDetection.hasMFA ? `${mfaDetection.detectedMethods.length} methods detected` : 'No MFA detected'} (OAuth: ${mfaDetection.hasOAuth}, WebAuthn: ${mfaDetection.hasWebAuthn}, TOTP: ${mfaDetection.hasTOTP})`)
    console.log(`[Worker] ✓ Error Disclosure: ${errorDisclosure.findings.length} findings (Stack traces: ${errorDisclosure.hasStackTraces}, DB errors: ${errorDisclosure.hasDatabaseErrors}, Risk: ${errorDisclosure.riskLevel})`)
    console.log(`[Worker] ✓ SPA/API: ${spaApi.isSPA ? `${spaApi.detectedFramework} detected` : 'Not SPA'} (${spaApi.apiEndpoints.length} API endpoints, ${spaApi.hasUnprotectedEndpoints ? 'UNPROTECTED ENDPOINTS!' : 'Protected'})`)

    // OWASP LLM analyzer logs - only if AI was detected
    if (aiTrustResult.hasAiImplementation && (aiTrustResult.aiConfidenceLevel === 'medium' || aiTrustResult.aiConfidenceLevel === 'high')) {
      console.log(`[Worker] ✓ LLM01 (Prompt Injection): ${llm01PromptInjection.findings.length} findings (System prompts: ${llm01PromptInjection.hasSystemPromptLeaks}, Risky assembly: ${llm01PromptInjection.hasRiskyPromptAssembly}, AI context: ${llm01PromptInjection.hasAIContext}, Risk: ${llm01PromptInjection.overallRisk})`)
      console.log(`[Worker] ✓ LLM02 (Insecure Output): ${llm02InsecureOutput.findings.length} findings (DOM: ${llm02InsecureOutput.hasDangerousDOM}, Unsafe MD: ${llm02InsecureOutput.hasUnsafeMarkdown}, eval(): ${llm02InsecureOutput.hasEvalUsage}, CSP: ${llm02InsecureOutput.cspStrength}, Risk: ${llm02InsecureOutput.overallRisk})`)
      console.log(`[Worker] ✓ LLM05 (Supply Chain): ${llm05SupplyChain.findings.length} findings (Vulnerable pkgs: ${llm05SupplyChain.hasVulnerablePackages}, Missing SRI: ${llm05SupplyChain.hasMissingSRI}, Untrusted models: ${llm05SupplyChain.hasUntrustedModels}, Risk: ${llm05SupplyChain.overallRisk})`)
      console.log(`[Worker] ✓ LLM06 (Sensitive Info): ${llm06SensitiveInfo.findings.length} findings (API keys: ${llm06SensitiveInfo.hasAPIKeys}, System prompts: ${llm06SensitiveInfo.hasSystemPrompts}, PII: ${llm06SensitiveInfo.hasPII}, Model info: ${llm06SensitiveInfo.hasModelInfo}, Risk: ${llm06SensitiveInfo.overallRisk})`)
      console.log(`[Worker] ✓ LLM07 (Plugin Design): ${llm07PluginDesign.findings.length} findings (Critical tools: ${llm07PluginDesign.hasCriticalTools}, High risk: ${llm07PluginDesign.hasHighRiskTools}, Detected: ${llm07PluginDesign.detectedTools.length} tools, Risk: ${llm07PluginDesign.overallRisk})`)
      console.log(`[Worker] ✓ LLM08 (Excessive Agency): ${llm08ExcessiveAgency.findings.length} findings (Auto-exec: ${llm08ExcessiveAgency.hasAutoExecute}, Sandbox: ${llm08ExcessiveAgency.hasSandbox}, Approval: ${llm08ExcessiveAgency.hasApproval}, Logging: ${llm08ExcessiveAgency.hasLogging}, Risk: ${llm08ExcessiveAgency.overallRisk})`)
    } else {
      console.log(`[Worker] ⚪ OWASP LLM analyzers skipped (No AI implementation detected)`)
    }

    console.log(`[Worker]   - CMS: ${techStack.categories.cms.length}`)
    console.log(`[Worker]   - Analytics: ${techStack.categories.analytics.length}`)
    console.log(`[Worker]   - Ads: ${techStack.categories.ads.length}`)
    console.log(`[Worker]   - CDN: ${techStack.categories.cdn.length}`)
    console.log(`[Worker]   - Social: ${techStack.categories.social.length}`)

    logStep('Step 2: All analyzers completed', 'DONE', timings.totalAnalyzersBeforeDNS)

    // Step 3: Generate report (WITHOUT DNS initially) - we'll calculate score AFTER
    logStep('Step 4: Generating security report', 'START')
    console.log(`[Worker] Generating initial report (without DNS)...`)

    // Create default DNS result (will be updated if DNS check succeeds)
    let dnsAnalysis = {
      domain: new URL(url).hostname,
      findings: [],
      hasDNSSEC: false,
      hasSPF: false,
      hasDKIM: false,
      hasDMARC: false,
      hasCAA: false,
      score: 100,
      summary: {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      }
    }

    const reportStart = Date.now()
    let report = generateReport(
      aiDetection,
      securityHeaders,
      clientRisks,
      { score: 0, level: 'LOW', grade: 'A+' }, // Temporary dummy score, will be recalculated
      sslTLS,
      cookieSecurity,
      jsLibraries,
      techStack,
      reconnaissance,
      adminDetection,
      adminDiscovery, // NEW: Admin Discovery analyzer
      { ...corsAnalysis, bypassPatterns: corsBypassPatterns }, // Combine CORS results
      dnsAnalysis, // Use empty DNS for initial report
      portScan, // NEW: Port Scanner analyzer
      compliance, // Compliance analyzer
      wafDetection, // WAF Detection analyzer
      mfaDetection, // MFA Detection analyzer
      rateLimiting, // Rate Limiting analyzer
      graphqlSecurity, // GraphQL Security analyzer
      errorDisclosure, // Error Disclosure analyzer
      spaApi, // SPA/API Detection analyzer
      llm01PromptInjection, // OWASP LLM01 - Prompt Injection Risk
      llm02InsecureOutput, // OWASP LLM02 - Insecure Output Handling
      llm05SupplyChain, // OWASP LLM05 - Supply Chain Vulnerabilities
      llm06SensitiveInfo, // OWASP LLM06 - Sensitive Information Disclosure
      llm07PluginDesign, // OWASP LLM07 - Insecure Plugin Design
      llm08ExcessiveAgency, // OWASP LLM08 - Excessive Agency
      backendFramework, // ⭐ NEW: Backend Framework Security
      webServer, // ⭐ NEW: Web Server Security
      frontendFramework, // ⭐ NEW: Frontend Framework Security
      passiveAPI // ⭐ NEW: Passive API Discovery
    )
    timings.reportGeneration = Date.now() - reportStart
    logStep('Step 4: Generating security report', 'DONE', timings.reportGeneration)

    // Step 4: Calculate NEW v3 Professional Scoring (AFTER report generation)
    logStep('Step 5: Calculating security score', 'START')
    console.log(`[Worker] 🎯 Calculating Professional Security Score v3.0 (100=perfect, 0=critical)...`)
    const riskScoreStart = Date.now()

    // Calculate scoring breakdown using the new v3 system (intuitive 100-point scale)
    const scoreBreakdown = calculateSecurityScore(
      report.findings || [], // All findings from the report
      {
        hasAI: aiDetection.hasAI,
        sslCertificate: crawlResult.sslCertificate,
        // Add other metadata as needed
      }
    )

    timings.riskScore = Date.now() - riskScoreStart
    logStep('Step 5: Calculating security score', 'DONE', timings.riskScore)

    console.log(`[Worker] ✅ Score: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.grade}, ${scoreBreakdown.riskLevel})`)
    console.log(`[Worker]   - Critical Infrastructure: ${scoreBreakdown.categories.criticalInfrastructure.score}/100`)
    console.log(`[Worker]   - Authentication: ${scoreBreakdown.categories.authentication.score}/100`)
    console.log(`[Worker]   - Data Protection: ${scoreBreakdown.categories.dataProtection.score}/100`)
    console.log(`[Worker]   - Code Quality: ${scoreBreakdown.categories.codeQuality.score}/100`)
    console.log(`[Worker]   - AI Security: ${scoreBreakdown.categories.aiSecurity.applicable ? `${scoreBreakdown.categories.aiSecurity.score}/100` : 'N/A'}`)

    // Update report.summary.riskScore with v3 scoring results
    report.summary.riskScore = {
      score: scoreBreakdown.overallScore,
      level: scoreBreakdown.riskLevel,
      grade: scoreBreakdown.grade,
    }

    // Add scoreBreakdown to report for API access (not just metadata)
    report.scoreBreakdown = scoreBreakdown

    // Calculate total time
    timings.total = Date.now() - startTime

    // Add performance data to metadata
    const performanceData = {
      timings,
      timestamp: new Date().toISOString(),
      crawlerBreakdown: crawlResult.timingBreakdown || {}, // NEW: detailed crawler timing
      analyzerBreakdown: {
        aiTrust: timings.aiTrust, // AI Detection now part of AI Trust Score
        securityHeaders: timings.securityHeaders,
        clientRisks: timings.clientRisks,
        sslTLS: timings.sslTLS,
        cookieSecurity: timings.cookieSecurity,
        jsLibraries: timings.jsLibraries,
        techStack: timings.techStack,
        reconnaissance: timings.reconnaissance,
        adminDetection: timings.adminDetection,
        adminDiscovery: timings.adminDiscovery,
        cors: timings.cors,
        portScan: timings.portScan,
        llm01: timings.llm01,
        llm02: timings.llm02,
        llm05: timings.llm05,
        llm06: timings.llm06,
        llm07: timings.llm07,
        llm08: timings.llm08,
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
    logStep('Step 6: Saving scan results to database', 'START')
    console.log(`[Worker] Saving results...`)
    // Detect if AI is present on the site
    const hasAI = (report.detectedTech?.aiProviders?.length ?? 0) > 0
    console.log(`[Worker] AI detected: ${hasAI} (${report.detectedTech?.aiProviders?.length ?? 0} providers)`)

    const dbSaveStart = Date.now()
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        riskScore: scoreBreakdown.overallScore,
        riskLevel: scoreBreakdown.riskLevel,
        workerId: null, // Clear worker PID on completion
        hasAI: hasAI,  // ✨ NEW: Track AI presence
        // PostgreSQL JSONB: store as objects, not strings
        detectedTech: report.detectedTech,
        findings: report as any, // Prisma JSON type
        metadata: {
          ...performanceData,
          scoreBreakdown, // ✨ NEW: Include v2 professional scoring breakdown
        } as any,
        completedAt: new Date(),
      },
    })

    // Step 5.5: Save AI Trust Scorecard (UPSERT - handles retries!)
    // CRITICAL: Wrapped in try-catch to prevent status rollback if this fails
    console.log(`[Worker] Saving AI Trust Scorecard...`)
    try {
      await prisma.aiTrustScorecard.upsert({
      where: { scanId: scanId },
      create: {
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
        // PostgreSQL JSONB: store as objects, not strings
        categoryScores: aiTrustResult.categoryScores,
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

        // Evidence (PostgreSQL JSONB)
        evidenceData: (aiTrustResult.evidenceData || {}) as any,

        // NEW: Detailed checks and summary (PostgreSQL JSONB)
        detailedChecks: (aiTrustResult.detailedChecks || {}) as any,
        summary: (aiTrustResult.summary || {}) as any,
      },
      update: {
        // Update all fields on retry
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
      console.log(`[Worker] ✅ AI Trust Scorecard saved (upsert)`)
    } catch (scorecardError) {
      // CRITICAL: Don't let aiTrustScorecard errors fail the entire scan
      // The scan is already marked as COMPLETED with results
      console.error(`[Worker] ⚠️  AI Trust Scorecard save failed (non-fatal):`, scorecardError)
      console.log(`[Worker] ℹ️  Scan results are preserved, only AI Trust Score is missing`)
    }

    const dbSaveDuration = Date.now() - dbSaveStart
    logStep('Step 6: Saving scan results to database', 'DONE', dbSaveDuration)

    // Step 6: DNS Security analyzer (OPTIONAL - with 10 second timeout)
    logStep('Step 7: DNS Security check (10s timeout)', 'START')
    console.log(`[Worker] 🌍 Running DNS Security check (10s timeout)...`)
    const dnsStart = Date.now()

    try {
      // Create a promise that rejects after 10 seconds
      const dnsPromise = analyzeDNSSecurity(crawlResult)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('DNS analysis timeout (10s)')), 10000)
      })

      // Race between DNS check and timeout
      dnsAnalysis = await Promise.race([dnsPromise, timeoutPromise]) as any

      timings.dns = Date.now() - dnsStart
      console.log(`[Worker] ✓ DNS Security: ${dnsAnalysis.findings.length} findings (DNSSEC: ${dnsAnalysis.hasDNSSEC}, SPF: ${dnsAnalysis.hasSPF}, DKIM: ${dnsAnalysis.hasDKIM}, DMARC: ${dnsAnalysis.hasDMARC}) - completed in ${timings.dns}ms`)

      // Update report with DNS analysis (without regenerating entire report)
      report.dnsAnalysis = dnsAnalysis

      // Update the saved scan with DNS results
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          findings: report as any,  // PostgreSQL JSONB - store as object
          metadata: {
            ...performanceData,
            timings: { ...timings, dns: timings.dns }
          } as any,
        },
      })
      console.log(`[Worker] ✅ DNS results added to scan`)
      logStep('Step 7: DNS Security check (10s timeout)', 'DONE', timings.dns)

    } catch (error) {
      console.log(`[Worker] ⚠️  DNS Security check skipped: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // DNS check failed or timed out - continue without it
      timings.dns = Date.now() - dnsStart
      logStep('Step 7: DNS Security check (10s timeout)', 'ERROR', timings.dns)
    }

    // Update total time including DNS attempt
    timings.totalAnalyzers = Date.now() - analyzerStart

    console.log(`[Worker] ═══════════════════════════════════════════════════════════════`)
    console.log(`[Worker] ✅ SCAN COMPLETED SUCCESSFULLY`)
    console.log(`[Worker] ═══════════════════════════════════════════════════════════════`)
    console.log(`[Worker] Risk Score: ${scoreBreakdown.overallScore}/100 (${scoreBreakdown.grade} - ${scoreBreakdown.riskLevel})`)
    console.log(`[Worker] AI Trust Score: ${aiTrustResult.weightedScore}/100 (${aiTrustResult.grade})`)
    console.log(`[Worker] Total Duration: ${timings.total}ms`)
    console.log(`[Worker] ═══════════════════════════════════════════════════════════════`)

    return { success: true, scanId, riskScore: scoreBreakdown.overallScore }

  } catch (error) {
    console.error(`[Worker] ❌ Error processing scan ${scanId}:`, error)

    // Update status to failed
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        workerId: null, // Clear worker PID on failure
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        completedAt: new Date(),
      },
    })

    throw error
  }
}

/**
 * Process one job from the queue
 * Called in a loop by workerLoop()
 */
async function processOneJob() {
  try {
    // Get next pending job from SQLite queue
    const job = await jobQueue.getNext()

    if (job) {
      console.log(`[Worker] 🎯 Found job ${job.id} (type: ${job.type})`)

      try {
        if (job.type === 'scan') {
          // Wrap scan in 30s timeout
          const scanPromise = processScanJob(job.data)
          const timeoutPromise = new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('⏰ Scan timeout after 30s')), 120000)
          )

          await Promise.race([scanPromise, timeoutPromise])
          await jobQueue.complete(job.id)
          console.log(`[Worker] ✅ Job completed successfully`)
        } else {
          console.log(`[Worker] ⚠️  Unknown job type: ${job.type}`)
          await jobQueue.fail(job.id, `Unknown job type: ${job.type}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Mark scan as FAILED in database
        if (job.type === 'scan' && job.data.scanId) {
          try {
            await prisma.scan.update({
              where: { id: job.data.scanId },
              data: {
                status: 'FAILED',
                workerId: null, // Clear worker PID on failure
                completedAt: new Date(),
              },
            })
            console.log(`[Worker] 📝 Marked scan ${job.data.scanId} as FAILED`)
          } catch (dbError) {
            console.error('[Worker] ❌ Failed to update scan status:', dbError)
          }
        }

        await jobQueue.fail(job.id, errorMessage)
        console.log(`[Worker] ❌ Job failed: ${errorMessage}`)
      }
    } else {
      console.log('[Worker] 💤 No jobs found, waiting 2s...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } catch (error) {
    console.error('[Worker] ❌ Error checking for jobs:', error)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

// Single-job worker - processes ONE job then exits
// This prevents memory leaks from accumulating workers
async function runSingleJob() {
  // HARD TIMEOUT: Force exit after 90 seconds no matter what
  const HARD_TIMEOUT_MS = 90000
  const hardTimeoutId = setTimeout(() => {
    console.error('[Worker] ⏰ HARD TIMEOUT - forcing exit after 90s')
    process.exit(1)
  }, HARD_TIMEOUT_MS)
  hardTimeoutId.unref() // Don't keep process alive just for this timer

  // Check if we should start (prevents too many workers)
  const canStart = await workerManager.start()
  if (!canStart) {
    console.log('[Worker] Worker pool full, exiting...')
    clearTimeout(hardTimeoutId)
    process.exit(0)
  }

  console.log('[Worker] ✅ Single-job worker started (90s hard timeout)')

  // Graceful shutdown handler
  const cleanup = async () => {
    clearTimeout(hardTimeoutId)
    try {
      await Promise.race([
        crawler.close(),
        new Promise(resolve => setTimeout(resolve, 5000)) // 5s max for cleanup
      ])
    } catch (e) { /* ignore */ }
    await workerManager.shutdown()
  }

  process.on('SIGINT', async () => {
    console.log('[Worker] 🛑 SIGINT received, cleaning up...')
    await cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    console.log('[Worker] 🛑 SIGTERM received, cleaning up...')
    await cleanup()
    process.exit(0)
  })

  try {
    // Get job directly (don't use processOneJob which has wait logic)
    const job = await jobQueue.getNext()

    if (!job) {
      console.log('[Worker] 💤 No jobs available, exiting...')
      await cleanup()
      process.exit(0)
    }

    console.log(`[Worker] 🎯 Processing job ${job.id} (type: ${job.type})`)

    if (job.type === 'scan') {
      try {
        // 60 second timeout for the scan itself
        const scanPromise = processScanJob(job.data)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('⏰ Scan timeout after 60s')), 60000)
        )

        await Promise.race([scanPromise, timeoutPromise])
        await jobQueue.complete(job.id)
        console.log('[Worker] ✅ Job completed successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[Worker] ❌ Job failed: ${errorMessage}`)

        // Mark scan as FAILED
        if (job.data.scanId) {
          try {
            await prisma.scan.update({
              where: { id: job.data.scanId },
              data: {
                status: 'FAILED',
                workerId: null,
                completedAt: new Date(),
              },
            })
          } catch (e) { /* ignore */ }
        }

        await jobQueue.fail(job.id, errorMessage)
      }
    } else {
      console.log(`[Worker] ⚠️ Unknown job type: ${job.type}`)
      await jobQueue.fail(job.id, `Unknown job type: ${job.type}`)
    }
  } catch (error) {
    console.error('[Worker] ❌ Fatal error:', error)
  }

  // Cleanup and exit
  console.log('[Worker] 🧹 Cleaning up and exiting...')
  await cleanup()
  process.exit(0)
}

// Start single-job worker
runSingleJob()

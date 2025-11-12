/**
 * Playwright Crawler
 *
 * Real browser automation for passive security analysis.
 * Monitors network traffic, collects page data, and enables
 * comprehensive AI provider and security vulnerability detection.
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import type {
  CrawlerResult,
  CrawlerConfig,
  NetworkRequest,
  NetworkResponse,
  CookieData,
  JavaScriptEvaluation,
  CrawlerError,
  CrawlerErrorType,
} from './types/crawler-types'
import { DEFAULT_CRAWLER_CONFIG } from './types/crawler-types'

export class PlaywrightCrawler {
  private config: CrawlerConfig
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null

  // Network monitoring storage
  private requests: NetworkRequest[] = []
  private responses: NetworkResponse[] = []

  constructor(config?: Partial<CrawlerConfig>) {
    this.config = { ...DEFAULT_CRAWLER_CONFIG, ...config }
  }

  /**
   * Main crawl method - orchestrates the entire scanning process
   */
  async crawl(url: string): Promise<CrawlerResult> {
    const startTime = Date.now()
    const timingBreakdown: Record<string, number> = {}

    console.log(`[PlaywrightCrawler] Starting scan for: ${url}`)

    try {
      // Validate URL
      this.validateUrl(url)

      // Initialize browser
      const browserStart = Date.now()
      await this.initBrowser()
      timingBreakdown.browserInit = Date.now() - browserStart

      // Setup network monitoring
      const monitoringStart = Date.now()
      this.setupNetworkMonitoring()
      timingBreakdown.networkSetup = Date.now() - monitoringStart

      // Navigate to page (DNS + TCP + TLS + initial HTML)
      const navigationStart = Date.now()
      const response = await this.navigateToPage(url)
      const statusCode = response?.status() || 0
      timingBreakdown.navigation = Date.now() - navigationStart

      // Get SSL certificate from Playwright's securityDetails (MUCH more reliable than tls.connect)
      const securityDetails = response ? await response.securityDetails() : null

      // Wait for page to stabilize (JS execution, resources loading)
      const pageLoadStart = Date.now()
      await this.waitForPageLoad()
      timingBreakdown.pageLoad = Date.now() - pageLoadStart

      // Collect page data
      const dataCollectionStart = Date.now()
      const html = await this.page!.content()
      const title = await this.page!.title()
      const finalUrl = this.page!.url()
      const cookies = await this.collectCookies()

      // Try Playwright securityDetails first, fallback to tls.connect if null
      let sslCertificate = this.parseSecurityDetails(securityDetails, finalUrl)
      if (!sslCertificate) {
        console.log('[PlaywrightCrawler] ⚠️  securityDetails null, trying tls.connect fallback...')
        sslCertificate = await this.collectSSLCertificate(finalUrl)
      }
      const jsEvaluation = this.config.evaluateJavaScript
        ? await this.evaluateJavaScript()
        : undefined
      timingBreakdown.dataCollection = Date.now() - dataCollectionStart

      // Optional screenshot
      let screenshot: Buffer | undefined
      if (this.config.captureScreenshot) {
        const screenshotStart = Date.now()
        screenshot = await this.captureScreenshot()
        timingBreakdown.screenshot = Date.now() - screenshotStart
      }

      const loadTime = Date.now() - startTime

      console.log(`[PlaywrightCrawler] ✅ Scan completed in ${loadTime}ms`)
      console.log(`[PlaywrightCrawler]   Browser Init: ${timingBreakdown.browserInit}ms`)
      console.log(`[PlaywrightCrawler]   Navigation: ${timingBreakdown.navigation}ms`)
      console.log(`[PlaywrightCrawler]   Page Load: ${timingBreakdown.pageLoad}ms`)
      console.log(`[PlaywrightCrawler]   Data Collection: ${timingBreakdown.dataCollection}ms`)
      console.log(`[PlaywrightCrawler] Captured ${this.requests.length} requests, ${this.responses.length} responses`)

      return {
        url,
        finalUrl,
        statusCode,
        success: true,
        requests: this.requests,
        responses: this.responses,
        html,
        title,
        cookies,
        sslCertificate,
        jsEvaluation,
        screenshot,
        loadTime,
        timingBreakdown, // NEW: detailed timing data
        timestamp: new Date(),
        userAgent: (this.config.userAgent || DEFAULT_CRAWLER_CONFIG.userAgent) as string,
      }
    } catch (error) {
      console.error(`[PlaywrightCrawler] ❌ Scan failed:`, error)

      return {
        url,
        finalUrl: url,
        statusCode: 0,
        success: false,
        requests: this.requests,
        responses: this.responses,
        html: '',
        cookies: [],
        loadTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent: (this.config.userAgent || DEFAULT_CRAWLER_CONFIG.userAgent) as string,
      }
    } finally {
      // Always cleanup
      await this.cleanup()
    }
  }

  /**
   * Initialize browser and context
   */
  private async initBrowser(): Promise<void> {
    console.log('[PlaywrightCrawler] Launching browser...')

    this.browser = await chromium.launch({
      headless: this.config.headless,
      timeout: 30000, // 30s timeout for browser launch
    })

    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: this.config.viewport,
      bypassCSP: this.config.bypassCSP,
      ignoreHTTPSErrors: true, // For security analysis, we want to see cert issues
    })

    this.page = await this.context.newPage()

    // Set timeout
    this.page.setDefaultTimeout(this.config.timeout)
    this.page.setDefaultNavigationTimeout(this.config.timeout)

    // Block unnecessary resources for performance
    if (this.config.blockResources.length > 0) {
      await this.page.route('**/*', (route) => {
        const resourceType = route.request().resourceType()
        if (this.config.blockResources.includes(resourceType)) {
          route.abort()
        } else {
          route.continue()
        }
      })
    }

    console.log('[PlaywrightCrawler] Browser launched successfully')
  }

  /**
   * Setup network request/response monitoring
   */
  private setupNetworkMonitoring(): void {
    if (!this.page) return

    console.log('[PlaywrightCrawler] Setting up network monitoring...')

    // Monitor requests
    this.page.on('request', (request) => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now(),
        resourceType: request.resourceType(),
      })
    })

    // Monitor responses
    this.page.on('response', async (response) => {
      const responseData: NetworkResponse = {
        url: response.url(),
        statusCode: response.status(),
        headers: response.headers(),
        timestamp: Date.now(),
        resourceType: response.request().resourceType(),
      }

      // Optionally capture response body for API calls
      // (Only for small responses to avoid memory issues)
      const contentType = response.headers()['content-type'] || ''
      if (
        contentType.includes('application/json') ||
        contentType.includes('text/plain')
      ) {
        try {
          const body = await response.text()
          if (body.length < 10000) {
            // Max 10KB
            responseData.body = body
          }
        } catch (error) {
          // Ignore body capture errors
        }
      }

      this.responses.push(responseData)
    })

    console.log('[PlaywrightCrawler] Network monitoring active')
  }

  /**
   * Navigate to target URL
   */
  private async navigateToPage(url: string) {
    console.log(`[PlaywrightCrawler] Navigating to: ${url}`)

    return await this.page!.goto(url, {
      waitUntil: this.config.waitUntil,
      timeout: this.config.timeout,
    })
  }

  /**
   * Wait for page to fully load
   */
  private async waitForPageLoad(): Promise<void> {
    try {
      // Wait for network to be idle (no more than 2 connections for 500ms)
      await this.page!.waitForLoadState('networkidle', {
        timeout: 10000, // 10s max wait for network idle
      })
    } catch (error) {
      // Timeout is acceptable - page might have long-polling connections
      console.log('[PlaywrightCrawler] Network idle timeout (acceptable)')
    }
  }

  /**
   * Collect cookies from browser context
   */
  private async collectCookies(): Promise<CookieData[]> {
    if (!this.context) return []

    const cookies = await this.context.cookies()

    return cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'Strict' | 'Lax' | 'None',
    }))
  }

  /**
   * Evaluate JavaScript to detect frameworks and libraries
   */
  private async evaluateJavaScript(): Promise<JavaScriptEvaluation> {
    if (!this.page) {
      return {
        hasLangChain: false,
        hasOpenAI: false,
        hasVercelAI: false,
      }
    }

    try {
      const evaluation = await this.page.evaluate(() => {
        return {
          // AI Frameworks
          hasLangChain: typeof (window as any).LangChain !== 'undefined',
          hasOpenAI: typeof (window as any).OpenAI !== 'undefined',
          hasVercelAI:
            document.querySelector('[data-vercel-ai]') !== null ||
            typeof (window as any).ai !== 'undefined',

          // Library versions
          jQueryVersion: (window as any).jQuery?.fn?.jquery,
          reactVersion: (window as any).React?.version,
          vueVersion: (window as any).Vue?.version,
          angularVersion: (window as any).angular?.version,

          // Custom variables (if exposed)
          customVariables: {
            hasAIConfig: typeof (window as any).__AI_CONFIG__ !== 'undefined',
            hasOpenAIKey: typeof (window as any).OPENAI_API_KEY !== 'undefined',
          },
        }
      })

      return evaluation
    } catch (error) {
      console.error('[PlaywrightCrawler] JS evaluation failed:', error)
      return {
        hasLangChain: false,
        hasOpenAI: false,
        hasVercelAI: false,
      }
    }
  }

  /**
   * Capture screenshot of page
   */
  private async captureScreenshot(): Promise<Buffer | undefined> {
    if (!this.page) return undefined

    try {
      return await this.page.screenshot({
        fullPage: false, // Just viewport for performance
        type: 'png',
      })
    } catch (error) {
      console.error('[PlaywrightCrawler] Screenshot failed:', error)
      return undefined
    }
  }

  /**
   * Parse Playwright securityDetails into our certificate format
   * This is MUCH more reliable than tls.connect() because Playwright already has the certificate
   */
  private parseSecurityDetails(securityDetails: any, url: string): any {
    if (!securityDetails) {
      console.log(`[PlaywrightCrawler] ⚠️  No security details available for ${url}`)
      return null
    }

    try {
      console.log(`[PlaywrightCrawler] 🔒 Parsing SSL certificate from Playwright security details`)

      // Playwright securityDetails returns:
      // - issuer: string
      // - protocol: string (e.g., "TLS 1.3")
      // - subjectName: string
      // - validFrom: number (Unix timestamp in seconds)
      // - validTo: number (Unix timestamp in seconds)

      const validFromTimestamp = securityDetails.validFrom
      const validToTimestamp = securityDetails.validTo

      // Convert Unix timestamps to Date objects
      const validFromDate = new Date(validFromTimestamp * 1000)
      const validToDate = new Date(validToTimestamp * 1000)

      // Format as GMT string (matching Node.js tls format)
      const valid_from = validFromDate.toUTCString().replace(/GMT$/, '').trim() + ' GMT'
      const valid_to = validToDate.toUTCString().replace(/GMT$/, '').trim() + ' GMT'

      const certInfo = {
        subject: { CN: securityDetails.subjectName },
        issuer: { CN: securityDetails.issuer },
        // Store both snake_case and camelCase for compatibility
        valid_from,
        valid_to,
        validFrom: valid_from,
        validTo: valid_to,
        protocol: securityDetails.protocol,
      }

      console.log(`[PlaywrightCrawler] ✅ SSL certificate parsed successfully`)
      console.log(`[PlaywrightCrawler]   Issuer: ${securityDetails.issuer}`)
      console.log(`[PlaywrightCrawler]   Subject: ${securityDetails.subjectName}`)
      console.log(`[PlaywrightCrawler]   Valid to: ${valid_to}`)
      console.log(`[PlaywrightCrawler]   Protocol: ${securityDetails.protocol}`)

      return certInfo
    } catch (error) {
      console.error(`[PlaywrightCrawler] ❌ Failed to parse security details:`, error)
      return null
    }
  }

  /**
   * Collect SSL/TLS certificate information using tls.connect
   * Used as FALLBACK when Playwright securityDetails returns null
   * (e.g., for redirects, CDN, or non-main-frame responses)
   */
  private async collectSSLCertificate(url: string): Promise<any> {
    try {
      const parsedUrl = new URL(url)

      // Only collect SSL info for HTTPS
      if (parsedUrl.protocol !== 'https:') {
        console.log(`[PlaywrightCrawler] Skipping SSL collection for non-HTTPS URL: ${url}`)
        return null
      }

      console.log(`[PlaywrightCrawler] 🔒 Collecting SSL certificate for: ${parsedUrl.hostname}`)

      // Use Node.js tls module to get certificate details
      const tls = await import('tls')
      const { promisify } = await import('util')

      return new Promise((resolve) => {
        const socket = tls.connect(
          {
            host: parsedUrl.hostname,
            port: 443,
            servername: parsedUrl.hostname,
            rejectUnauthorized: false, // Accept self-signed certs
          },
          () => {
            const cert = socket.getPeerCertificate(true)

            if (cert && Object.keys(cert).length > 0) {
              const certInfo = {
                subject: cert.subject,
                issuer: cert.issuer,
                // Node.js tls.getPeerCertificate() returns snake_case
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
                // Keep camelCase for backwards compatibility
                validFrom: cert.valid_from,
                validTo: cert.valid_to,
                fingerprint: cert.fingerprint,
                serialNumber: cert.serialNumber,
              }

              console.log(`[PlaywrightCrawler] ✅ SSL certificate collected successfully`)
              console.log(`[PlaywrightCrawler]   Issuer: ${cert.issuer?.CN || cert.issuer?.O || 'Unknown'}`)
              console.log(`[PlaywrightCrawler]   Valid to: ${cert.valid_to}`)

              socket.end()
              resolve(certInfo)
            } else {
              console.warn(`[PlaywrightCrawler] ⚠️  Empty certificate object`)
              socket.end()
              resolve(null)
            }
          }
        )

        socket.on('error', (err) => {
          console.error(`[PlaywrightCrawler] ❌ SSL certificate collection failed:`, err.message)
          socket.end()
          resolve(null)
        })

        // Timeout after 5 seconds
        setTimeout(() => {
          console.warn(`[PlaywrightCrawler] ⏱️  SSL certificate collection timeout (5s)`)
          socket.end()
          resolve(null)
        }, 5000)
      })
    } catch (error) {
      console.error('[PlaywrightCrawler] SSL certificate collection failed:', error)
      return null
    }
  }

  /**
   * Validate URL format
   */
  private validateUrl(url: string): void {
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol')
      }
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`)
    }
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    console.log('[PlaywrightCrawler] Cleaning up browser resources...')

    try {
      if (this.page) {
        await this.page.close()
        this.page = null
      }

      if (this.context) {
        await this.context.close()
        this.context = null
      }

      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }

      // Reset monitoring arrays
      this.requests = []
      this.responses = []

      console.log('[PlaywrightCrawler] Cleanup complete')
    } catch (error) {
      console.error('[PlaywrightCrawler] Cleanup error:', error)
    }
  }
}

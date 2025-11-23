/**
 * Crawler Adapter
 *
 * Adapts PlaywrightCrawler output to unified CrawlerResult interface
 * Populates both Playwright fields and mock crawler compatibility fields
 */

import { PlaywrightCrawler } from './playwright-crawler'
import type { CrawlerResult } from './types/crawler-types'

export class CrawlerAdapter {
  private crawler: PlaywrightCrawler

  constructor() {
    this.crawler = new PlaywrightCrawler({
      timeout: 60000,
      captureScreenshot: false,
      evaluateJavaScript: true,
    })
  }

  /**
   * Crawl URL and convert result to MockCrawler format
   */
  async crawl(url: string): Promise<CrawlerResult> {
    console.log(`[CrawlerAdapter] Crawling ${url} with Playwright...`)

    const playwrightResult: CrawlerResult = await this.crawler.crawl(url)

    // Convert Playwright result to unified CrawlerResult format
    // Populate both Playwright fields AND mock crawler compatibility fields
    const networkRequests = (playwrightResult.responses || []).map((response) => ({
      url: response.url,
      method: 'GET', // Playwright responses don't have method, use GET as default
      resourceType: response.resourceType || 'other',
      status: response.statusCode,
    }))

    const scripts = (playwrightResult.responses || [])
      .filter((r) => r.resourceType === 'script' || r.resourceType === 'stylesheet')
      .map((r) => r.url)

    const adapted: CrawlerResult = {
      // Basic info
      url: playwrightResult.url,
      finalUrl: playwrightResult.finalUrl,
      statusCode: playwrightResult.statusCode,
      success: playwrightResult.success,

      // Network data (Playwright format)
      requests: playwrightResult.requests,
      responses: playwrightResult.responses,

      // Mock crawler compatibility fields
      domain: new URL(playwrightResult.finalUrl).hostname,
      networkRequests: networkRequests,
      scripts: scripts,
      responseHeaders: this.extractMainResponseHeaders(playwrightResult),

      // Page data
      html: playwrightResult.html,
      title: playwrightResult.title,
      cookies: playwrightResult.cookies || [],
      screenshot: playwrightResult.screenshot,

      // SSL/TLS certificate (CRITICAL: analyzer expects this at top level!)
      sslCertificate: playwrightResult.sslCertificate,

      // JavaScript evaluation
      jsEvaluation: playwrightResult.jsEvaluation,

      // Metadata
      loadTime: playwrightResult.loadTime,
      timingBreakdown: playwrightResult.timingBreakdown,
      timestamp: playwrightResult.timestamp,
      error: playwrightResult.error,
      userAgent: playwrightResult.userAgent,
      metadata: this.extractMetadata(playwrightResult),
    }

    console.log(`[CrawlerAdapter] ✅ Converted result - ${networkRequests.length} requests, ${scripts.length} scripts`)

    return adapted
  }

  /**
   * Extract response headers from main HTML response
   */
  private extractMainResponseHeaders(
    result: CrawlerResult
  ): Record<string, string> {
    // Find the main document response (HTML)
    const mainResponse = result.responses?.find(
      (r) => r.url === result.finalUrl || r.resourceType === 'document'
    )

    if (mainResponse && mainResponse.headers) {
      return mainResponse.headers
    }

    // Fallback: return empty headers
    return {}
  }

  /**
   * Extract metadata including certificate information
   */
  private extractMetadata(result: CrawlerResult): any {
    const metadata: any = {}

    // Include real SSL certificate information from Playwright crawler
    if (result.sslCertificate) {
      metadata.certificate = result.sslCertificate
    } else if (result.finalUrl.startsWith('https://')) {
      // Fallback for HTTPS without certificate data
      metadata.certificate = {
        secure: true,
        protocol: 'https',
      }
    }

    return metadata
  }

  /**
   * Close browser resources
   */
  async close(): Promise<void> {
    // PlaywrightCrawler already handles cleanup in crawl()
    console.log('[CrawlerAdapter] Closed')
  }
}

/**
 * Crawler Adapter
 *
 * Adapts PlaywrightCrawler output to match MockCrawler interface
 * This ensures backward compatibility with existing analyzers
 */

import { PlaywrightCrawler } from './playwright-crawler'
import type { CrawlerResult } from './types/crawler-types'
import type { CrawlResult, NetworkRequest } from '../worker/crawler-mock'

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
  async crawl(url: string): Promise<CrawlResult> {
    console.log(`[CrawlerAdapter] Crawling ${url} with Playwright...`)

    const playwrightResult: CrawlerResult = await this.crawler.crawl(url)

    // Convert Playwright result to Mock format
    const adapted: CrawlResult = {
      url: playwrightResult.url,
      domain: new URL(playwrightResult.finalUrl).hostname,
      finalUrl: playwrightResult.finalUrl,
      html: playwrightResult.html,
      loadTime: playwrightResult.loadTime,

      // Convert network requests
      networkRequests: playwrightResult.responses.map((response) => ({
        url: response.url,
        method: 'GET', // Playwright responses don't have method, use GET as default
        resourceType: response.resourceType || 'other',
        status: response.statusCode,
      })),

      // Extract script sources from responses
      scripts: playwrightResult.responses
        .filter((r) => r.resourceType === 'script')
        .map((r) => r.url),

      // Convert response headers (use first HTML response)
      responseHeaders: this.extractMainResponseHeaders(playwrightResult),

      // Pass through cookies
      cookies: playwrightResult.cookies || [],

      // Pass through metadata (certificate info, etc.)
      metadata: this.extractMetadata(playwrightResult),
    }

    console.log(`[CrawlerAdapter] ✅ Converted result - ${adapted.networkRequests.length} requests, ${adapted.scripts.length} scripts`)

    return adapted
  }

  /**
   * Extract response headers from main HTML response
   */
  private extractMainResponseHeaders(
    result: CrawlerResult
  ): Record<string, string> {
    // Find the main document response (HTML)
    const mainResponse = result.responses.find(
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

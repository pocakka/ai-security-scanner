/**
 * Hybrid Crawler - curl_cffi + Playwright Fallback
 *
 * Stratégia:
 * 1. Először curl_cffi (Chrome TLS fingerprint, ~1% CPU)
 * 2. Ha fail → Playwright fallback (teljes böngésző, ~100% CPU)
 *
 * Várható eredmény: ~70% CPU megtakarítás
 *
 * Visszaállítás: .env-ben USE_HYBRID_CRAWLER=false
 */

import { CrawlerAdapter } from './crawler-adapter'
import { fetchWithCurlCffi, isCurlCffiAvailable } from './curl-cffi-wrapper'
import { fetchSSLCertificate, extractHostname } from './ssl-certificate-fetcher'
import type { CrawlerResult, CookieData } from './types/crawler-types'

export class HybridCrawler {
  private playwrightCrawler: CrawlerAdapter
  private curlCffiAvailable: boolean | null = null

  // Statistics
  private stats = {
    curlCffiSuccess: 0,
    curlCffiFail: 0,
    playwrightFallback: 0,
  }

  constructor() {
    this.playwrightCrawler = new CrawlerAdapter()
  }

  /**
   * Check if curl_cffi is available (cached)
   */
  private async checkCurlCffi(): Promise<boolean> {
    if (this.curlCffiAvailable === null) {
      this.curlCffiAvailable = await isCurlCffiAvailable()
      if (this.curlCffiAvailable) {
        console.log('[HybridCrawler] ✅ curl_cffi available')
      } else {
        console.log('[HybridCrawler] ⚠️ curl_cffi not available, using Playwright only')
      }
    }
    return this.curlCffiAvailable
  }

  /**
   * Main crawl method - tries curl_cffi first, then Playwright
   */
  async crawl(url: string): Promise<CrawlerResult> {
    const startTime = Date.now()

    // Check if curl_cffi is available
    const hasCurlCffi = await this.checkCurlCffi()

    if (hasCurlCffi) {
      console.log(`[HybridCrawler] 🚀 Trying curl_cffi: ${url}`)

      const curlResult = await fetchWithCurlCffi(url, 15000)

      if (curlResult.success && !curlResult.needs_browser) {
        // curl_cffi succeeded!
        this.stats.curlCffiSuccess++
        const elapsed = Date.now() - startTime

        console.log(`[HybridCrawler] ✅ curl_cffi success (${elapsed}ms, ${curlResult.html_length} bytes)`)
        console.log(`[HybridCrawler] 📊 Stats: curl_cffi=${this.stats.curlCffiSuccess}, fallback=${this.stats.playwrightFallback}`)

        // Convert curl_cffi result to CrawlerResult format (includes SSL cert fetch)
        return await this.convertCurlCffiResult(url, curlResult)
      }

      // curl_cffi failed or needs browser
      this.stats.curlCffiFail++
      const reason = curlResult.detection_reason || curlResult.error || 'Unknown'
      console.log(`[HybridCrawler] ⚠️ curl_cffi needs browser: ${reason}`)
    }

    // Fallback to Playwright
    console.log(`[HybridCrawler] 🔄 Playwright fallback: ${url}`)
    this.stats.playwrightFallback++

    const playwrightResult = await this.playwrightCrawler.crawl(url)

    const elapsed = Date.now() - startTime
    console.log(`[HybridCrawler] ✅ Playwright success (${elapsed}ms)`)
    console.log(`[HybridCrawler] 📊 Stats: curl_cffi=${this.stats.curlCffiSuccess}, fallback=${this.stats.playwrightFallback}`)

    return playwrightResult
  }

  /**
   * Convert curl_cffi result to CrawlerResult format
   * Includes SSL certificate fetch via Node.js TLS (lightweight)
   */
  private async convertCurlCffiResult(
    originalUrl: string,
    curlResult: any
  ): Promise<CrawlerResult> {
    const finalUrl = curlResult.final_url || originalUrl
    let domain = ''
    try {
      domain = new URL(finalUrl).hostname
    } catch {
      domain = originalUrl.replace(/^https?:\/\//, '').split('/')[0]
    }

    // Convert cookies to CookieData format
    const cookies: CookieData[] = (curlResult.cookies || []).map((c: any) => ({
      name: c.name,
      value: c.value,
      domain: c.domain || domain,
      path: c.path || '/',
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite: c.sameSite,
    }))

    // Fetch SSL certificate using lightweight Node.js TLS (~100ms, ~0.1% CPU)
    const isHttps = finalUrl.startsWith('https://')
    let sslCertificate: any = null

    if (isHttps) {
      const hostname = extractHostname(finalUrl)
      const certInfo = await fetchSSLCertificate(hostname, 443, 5000)

      sslCertificate = {
        secure: certInfo.secure,
        protocol: certInfo.protocol,
        valid: certInfo.valid,
        issuer: certInfo.issuer,
        subject: certInfo.subject,
        valid_from: certInfo.valid_from,
        valid_to: certInfo.valid_to,
        validFrom: certInfo.valid_from,  // Alias for compatibility
        validTo: certInfo.valid_to,      // Alias for compatibility
        daysUntilExpiry: certInfo.daysUntilExpiry,
        isExpired: certInfo.isExpired,
        isSelfSigned: certInfo.isSelfSigned,
        serialNumber: certInfo.serialNumber,
        fingerprint: certInfo.fingerprint,
      }
    }

    return {
      // Basic info
      url: originalUrl,
      finalUrl: finalUrl,
      statusCode: curlResult.status_code,
      success: curlResult.success,

      // Network data
      requests: [],
      responses: [],

      // Mock crawler compatibility fields
      domain: domain,
      networkRequests: [],
      scripts: [], // curl_cffi doesn't parse scripts
      responseHeaders: curlResult.headers || {},

      // Page data
      html: curlResult.html || '',
      title: this.extractTitle(curlResult.html),
      cookies: cookies,

      // SSL/TLS certificate (now with full details!)
      sslCertificate: sslCertificate,

      // JavaScript evaluation (not available with curl_cffi)
      jsEvaluation: undefined,

      // Metadata
      loadTime: curlResult.elapsed_ms || 0,
      timingBreakdown: {
        curlCffi: curlResult.elapsed_ms || 0,
      },
      timestamp: new Date(),
      userAgent: 'curl_cffi/chrome120',
      metadata: {
        method: 'curl_cffi',
        certificate: sslCertificate,
      },
    }
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    if (!html) return ''

    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    return match ? match[1].trim() : ''
  }

  /**
   * Get crawler statistics
   */
  getStats() {
    const total = this.stats.curlCffiSuccess + this.stats.playwrightFallback
    const curlCffiRate = total > 0
      ? Math.round((this.stats.curlCffiSuccess / total) * 100)
      : 0

    return {
      ...this.stats,
      total,
      curlCffiRate: `${curlCffiRate}%`,
      estimatedCpuSavings: `${curlCffiRate * 0.99}%`, // ~99% CPU savings per curl_cffi
    }
  }

  /**
   * Close resources
   */
  async close(): Promise<void> {
    console.log(`[HybridCrawler] 📊 Final stats:`, this.getStats())
    await this.playwrightCrawler.close()
    console.log('[HybridCrawler] Closed')
  }
}

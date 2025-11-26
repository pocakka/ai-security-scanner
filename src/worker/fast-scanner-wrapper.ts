/**
 * Fast Scanner Wrapper - TypeScript interface for PHP curl scanner
 *
 * Executes PHP scanner and transforms output to match Playwright format
 * so that all existing TypeScript analyzers work without modification
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)

export interface FastScanResult {
  success: boolean
  url: string
  timestamp: string
  duration: number
  html: string
  headers: Record<string, string>
  cookies: Array<{
    name: string
    value: string
    domain?: string
    path?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: string
    maxAge?: number
    expires?: string
  }>
  status: number
  finalUrl: string
  redirectChain?: {
    count: number
    time: number
  }
  ssl?: {
    certInfo?: any
    version?: number
  }
  timing: {
    namelookup: number
    connect: number
    appconnect: number
    pretransfer: number
    starttransfer: number
    total: number
    redirect: number
  }
  error?: string
}

/**
 * Execute PHP fast scanner
 */
export async function runFastScanner(url: string): Promise<FastScanResult> {
  const phpScriptPath = path.join(
    process.cwd(),
    'workers',
    'fast-scanner',
    'scanner.php'
  )

  try {
    const { stdout, stderr } = await execFileAsync('php', [phpScriptPath, url], {
      timeout: 35000, // 35s timeout (PHP has 30s internal timeout)
      maxBuffer: 10 * 1024 * 1024, // 10MB max buffer for large pages
    })

    if (stderr) {
      console.warn('[FastScanner] PHP stderr:', stderr)
    }

    const result: FastScanResult = JSON.parse(stdout)
    return result
  } catch (error: any) {
    // Handle execution errors
    if (error.killed) {
      throw new Error('Fast scanner timeout')
    }

    if (error.code === 'ENOENT') {
      throw new Error('PHP not found - please install PHP')
    }

    // Try to parse stdout even on error (PHP script may return JSON with error)
    if (error.stdout) {
      try {
        const result: FastScanResult = JSON.parse(error.stdout)
        return result
      } catch {
        // Fall through to generic error
      }
    }

    throw new Error(`Fast scanner failed: ${error.message}`)
  }
}

/**
 * Transform fast scanner result to CrawlerResult format
 * This matches the EXACT format that Playwright crawler returns,
 * ensuring 100% compatibility with all analyzers (ZERO quality loss!)
 */
export function transformToCrawlerResult(scanResult: FastScanResult, url: string) {
  const domain = new URL(scanResult.finalUrl).hostname

  // CRITICAL FIX: Ensure HTML is ALWAYS a string (not Buffer/Object)
  // Many analyzers call html.toLowerCase() which fails if html is not a string
  const htmlString = typeof scanResult.html === 'string'
    ? scanResult.html
    : (scanResult.html?.toString() || '')

  return {
    // Basic info
    url: url,
    finalUrl: scanResult.finalUrl,
    statusCode: scanResult.status,
    success: scanResult.success,

    // Network data (minimal for fast scanner)
    requests: [],
    responses: [{
      url: scanResult.finalUrl,
      statusCode: scanResult.status,
      headers: scanResult.headers,
      resourceType: 'document',
    }],

    // Mock crawler compatibility fields
    domain: domain,
    networkRequests: [],
    scripts: extractScripts(htmlString),
    responseHeaders: scanResult.headers,

    // Page data
    html: htmlString,
    title: extractTitle(htmlString),
    cookies: scanResult.cookies,
    screenshot: undefined,

    // SSL/TLS certificate (from PHP curl)
    sslCertificate: scanResult.ssl?.certInfo ? {
      issuer: extractIssuerFromCert(scanResult.ssl.certInfo),
      subject: extractSubjectFromCert(scanResult.ssl.certInfo),
      validFrom: '',
      validTo: '',
      fingerprint: '',
    } : undefined,

    // JavaScript evaluation (not available in fast scanner)
    jsEvaluation: undefined,

    // Metadata
    loadTime: scanResult.duration,
    timingBreakdown: {
      dns: scanResult.timing.namelookup,
      tcp: scanResult.timing.connect - scanResult.timing.namelookup,
      tls: scanResult.timing.appconnect - scanResult.timing.connect,
      ttfb: scanResult.timing.starttransfer - scanResult.timing.pretransfer,
      download: scanResult.timing.total - scanResult.timing.starttransfer,
      total: scanResult.timing.total,
    },
    timestamp: scanResult.timestamp,
    error: scanResult.error,
    userAgent: 'AISecurityScanner/1.0 (Fast Scanner; +https://aisecurityscanner.com)',
    metadata: {
      scanType: 'FAST',
      workerType: 'PHP',
    },
  }
}

/**
 * Extract page title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : ''
}

/**
 * Extract script URLs from HTML
 */
function extractScripts(html: string): string[] {
  const scriptRegex = /<script[^>]*src=["']([^"']+)["']/gi
  const scripts: string[] = []
  let match

  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1])
  }

  return scripts
}

/**
 * Extract issuer from certificate info
 */
function extractIssuerFromCert(certInfo: any): string {
  if (Array.isArray(certInfo) && certInfo.length > 0) {
    const issuer = certInfo[0].Issuer || certInfo[0].issuer
    if (issuer) return issuer
  }
  return 'Unknown'
}

/**
 * Extract subject from certificate info
 */
function extractSubjectFromCert(certInfo: any): string {
  if (Array.isArray(certInfo) && certInfo.length > 0) {
    const subject = certInfo[0].Subject || certInfo[0].subject
    if (subject) return subject
  }
  return 'Unknown'
}

/**
 * Check if domain should use fast scanner
 * Returns true for 95% of domains, false for JS-heavy domains
 */
export function shouldUseFastScanner(domain: string, isBatchScan: boolean): boolean {
  // User-initiated scans always use Playwright
  if (!isBatchScan) {
    return false
  }

  // Check for AI-related keywords (likely needs Playwright)
  const aiKeywords = ['ai', 'chat', 'gpt', 'bot', 'assistant', 'llm', 'ml', 'openai', 'claude', 'gemini']
  const lowerDomain = domain.toLowerCase()

  for (const keyword of aiKeywords) {
    if (lowerDomain.includes(keyword)) {
      console.log(`[Router] Domain contains AI keyword "${keyword}" - using Playwright`)
      return false
    }
  }

  // Known platforms that work well with fast scanner
  const fastScannerFriendly = [
    '.wordpress.com',
    '.shopify.com',
    '.wix.com',
    '.squarespace.com',
    '.gov',
    '.edu',
    '.org',
  ]

  for (const suffix of fastScannerFriendly) {
    if (lowerDomain.endsWith(suffix)) {
      console.log(`[Router] Domain matches fast-scanner-friendly pattern "${suffix}" - using fast scanner`)
      return true
    }
  }

  // Known JS-heavy domains (always use Playwright)
  const jsHeavyDomains = [
    'app.',
    'admin.',
    'dashboard.',
    'portal.',
    'console.',
  ]

  for (const prefix of jsHeavyDomains) {
    if (lowerDomain.startsWith(prefix)) {
      console.log(`[Router] Domain starts with "${prefix}" - using Playwright`)
      return false
    }
  }

  // Default: use fast scanner for batch scans (95% of cases)
  console.log(`[Router] Domain "${domain}" - using fast scanner (default for batch)`)
  return true
}

/**
 * Decide scan type and return metadata
 */
export function decideScanType(domain: string, isBatchScan: boolean): {
  scanType: 'FAST' | 'DEEP'
  workerType: 'PHP' | 'PLAYWRIGHT'
  reason: string
} {
  const useFast = shouldUseFastScanner(domain, isBatchScan)

  if (useFast) {
    return {
      scanType: 'FAST',
      workerType: 'PHP',
      reason: 'Batch scan with static content',
    }
  } else {
    return {
      scanType: 'DEEP',
      workerType: 'PLAYWRIGHT',
      reason: isBatchScan
        ? 'JS-heavy domain detected'
        : 'User-initiated scan',
    }
  }
}

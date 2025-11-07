/**
 * Crawler Types for Playwright-based Security Analysis
 *
 * Defines interfaces for network monitoring, page data collection,
 * and crawler results used throughout the analysis pipeline.
 */

/**
 * Network request captured during page load
 */
export interface NetworkRequest {
  url: string
  method: string
  headers: Record<string, string>
  timestamp: number
  resourceType?: string
}

/**
 * Network response captured during page load
 */
export interface NetworkResponse {
  url: string
  statusCode: number
  headers: Record<string, string>
  timestamp: number
  resourceType?: string
  body?: string // Optional: response body for API calls
}

/**
 * Cookie data from browser context
 */
export interface CookieData {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
}

/**
 * JavaScript evaluation result
 * Captures client-side variables and framework detection
 */
export interface JavaScriptEvaluation {
  // AI Frameworks
  hasLangChain: boolean
  hasOpenAI: boolean
  hasVercelAI: boolean

  // Library versions
  jQueryVersion?: string
  reactVersion?: string
  vueVersion?: string
  angularVersion?: string

  // Custom detections
  customVariables?: Record<string, any>
}

/**
 * Complete result from Playwright crawler
 */
export interface CrawlerResult {
  // Basic info
  url: string
  finalUrl: string // After redirects
  statusCode: number
  success: boolean

  // Network data
  requests: NetworkRequest[]
  responses: NetworkResponse[]

  // Page data
  html: string
  title?: string
  cookies: CookieData[]
  screenshot?: Buffer

  // JavaScript evaluation
  jsEvaluation?: JavaScriptEvaluation

  // Metadata
  loadTime: number // milliseconds
  timestamp: Date
  error?: string
  userAgent: string
}

/**
 * Configuration for Playwright crawler
 */
export interface CrawlerConfig {
  // Browser options
  headless: boolean
  userAgent?: string
  viewport?: {
    width: number
    height: number
  }

  // Navigation options
  timeout: number // milliseconds
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle'

  // Feature flags
  captureScreenshot: boolean
  blockResources: string[] // Resource types to block (e.g., ['image', 'media'])
  evaluateJavaScript: boolean

  // Security
  bypassCSP: boolean // For analysis purposes only
}

/**
 * Error types that can occur during crawling
 */
export enum CrawlerErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_URL = 'INVALID_URL',
  BROWSER_CRASH = 'BROWSER_CRASH',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Crawler error with details
 */
export interface CrawlerError {
  type: CrawlerErrorType
  message: string
  url: string
  timestamp: Date
  stack?: string
}

/**
 * Default crawler configuration
 */
export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  headless: true,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  viewport: {
    width: 1920,
    height: 1080,
  },
  timeout: 60000, // 60 seconds
  waitUntil: 'networkidle',
  captureScreenshot: false, // Disabled by default for performance
  blockResources: ['media'], // Block videos/audio for performance
  evaluateJavaScript: true,
  bypassCSP: false,
}

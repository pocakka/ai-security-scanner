/**
 * Analytics AI Detection Analyzer
 *
 * Detects AI-powered Analytics platforms with focus on SESSION REPLAY tools
 * P0 Priority Service: FullStory (session replay - records everything)
 * P1 Services: LogRocket, Hotjar, Heap, Mixpanel, Amplitude
 *
 * Detection Methods:
 * - Script URL detection
 * - Global object detection (window.FS, window.LogRocket, etc.)
 * - Cookie detection (fs_uid, _lr_*, _hjid)
 * - API endpoint monitoring
 *
 * Security Focus:
 * - SESSION REPLAY = records keystrokes, clicks, form inputs (PII risk!)
 * - Password field recording (if misconfigured)
 * - Credit card number capture
 * - API key visibility in dev tools
 * - Console log recording (LogRocket)
 *
 * Created: 2025-11-14
 */

import type { CrawlerResult as CrawlResult } from '@/lib/types/crawler-types'

export interface AnalyticsAIDetection {
  provider: string
  category: 'Analytics AI (Session Replay)' | 'Analytics AI (Event Tracking)' | 'Analytics AI (Heatmaps)'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  scriptFound?: boolean
  globalObjectFound?: boolean
  cookieFound?: boolean
  apiEndpointFound?: boolean
  sessionReplayEnabled?: boolean // CRITICAL privacy risk
  detectionPatterns: string[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface AnalyticsAIDetectionResult {
  hasAnalyticsAI: boolean
  detections: AnalyticsAIDetection[]
  totalProviders: number
  highConfidenceCount: number
  sessionReplayDetected: boolean // TRUE if FullStory/LogRocket/Hotjar found
  criticalRiskCount: number
}

interface AnalyticsAIPattern {
  provider: string
  category: 'Analytics AI (Session Replay)' | 'Analytics AI (Event Tracking)' | 'Analytics AI (Heatmaps)'
  scriptUrls: RegExp[]
  globalObjects?: string[]
  cookies?: string[]
  apiEndpoints?: string[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  sessionReplay?: boolean
}

// Analytics AI Patterns (10 services total, 1 P0)
const ANALYTICS_AI_PATTERNS: AnalyticsAIPattern[] = [
  // 1. FullStory (P0) - SESSION REPLAY
  {
    provider: 'FullStory',
    category: 'Analytics AI (Session Replay)',
    scriptUrls: [
      /fullstory\.com\/s\/fs\.js/i,
      /rs\.fullstory\.com\//i,
      /edge\.fullstory\.com\//i,
    ],
    globalObjects: [
      'FS',
      '_fs_',
      '_fs_namespace',
    ],
    cookies: [
      'fs_uid',
      'fs_lua',
    ],
    apiEndpoints: [
      'rs.fullstory.com/rec/',
    ],
    attackSurface: [
      'Session replay records EVERYTHING (keystrokes, clicks, scrolls)',
      'Password field recording (if not masked)',
      'PII exposure in session replays',
      'Credit card number capture (if input masking disabled)',
      'API keys visible in browser dev tools',
      'Rage click detection data exposure',
      'Form abandonment tracking',
      'Error messages with sensitive data',
    ],
    riskLevel: 'CRITICAL',
    sessionReplay: true,
  },

  // 2. LogRocket (P0/P1) - SESSION REPLAY + CONSOLE LOGS
  {
    provider: 'LogRocket',
    category: 'Analytics AI (Session Replay)',
    scriptUrls: [
      /cdn\.logrocket\.io\//i,
      /cdn\.lr-ingest\.io\//i,
      /cdn\.lr-in\.com\//i,
    ],
    globalObjects: [
      'LogRocket',
      '_lr_',
    ],
    cookies: [
      '_lr_id',
      '_lr_tabs',
    ],
    apiEndpoints: [
      'r.lr-ingest.io/',
      'r.lr-in.com/',
    ],
    attackSurface: [
      'Session replay with full DOM snapshots',
      'Console log recording (API keys often logged here!)',
      'Network request recording (captures API calls)',
      'Redux/Vuex state exposure',
      'Error tracking with stack traces',
      'Performance metrics with user context',
      'Custom event tracking',
    ],
    riskLevel: 'CRITICAL',
    sessionReplay: true,
  },

  // 3. Hotjar (P1) - SESSION REPLAY + HEATMAPS
  {
    provider: 'Hotjar',
    category: 'Analytics AI (Session Replay)',
    scriptUrls: [
      /static\.hotjar\.com\/c\/hotjar-/i,
      /script\.hotjar\.com\//i,
    ],
    globalObjects: [
      'hj',
      '_hjSettings',
    ],
    cookies: [
      '_hjid',
      '_hjSessionUser',
      '_hjSession',
      '_hjIncludedInPageviewSample',
    ],
    apiEndpoints: [
      'vc.hotjar.io/',
      'insights.hotjar.com/',
    ],
    attackSurface: [
      'Heatmap data exposure',
      'Session recording (PII risk)',
      'Form field tracking',
      'Feedback poll responses',
      'User survey data',
      'Conversion funnel analytics',
    ],
    riskLevel: 'HIGH',
    sessionReplay: true,
  },

  // 4. Heap Analytics (P1) - AUTOCAPTURE
  {
    provider: 'Heap Analytics',
    category: 'Analytics AI (Event Tracking)',
    scriptUrls: [
      /cdn\.heapanalytics\.com\/js\//i,
      /heapanalytics\.com\/js\//i,
    ],
    globalObjects: [
      'heap',
    ],
    cookies: [
      '_hp2_id',
      '_hp2_ses',
    ],
    apiEndpoints: [
      'heapanalytics.com/api/',
    ],
    attackSurface: [
      'Autocapture everything (no code event tracking)',
      'Retroactive funnel analysis',
      'User session stitching',
      'Property tracking (can include PII)',
      'Form interaction tracking',
    ],
    riskLevel: 'MEDIUM',
  },

  // 5. Mixpanel (P1) - EVENT TRACKING
  {
    provider: 'Mixpanel',
    category: 'Analytics AI (Event Tracking)',
    scriptUrls: [
      /cdn\.mxpnl\.com\/libs\/mixpanel-/i,
      /cdn4\.mxpnl\.com\//i,
    ],
    globalObjects: [
      'mixpanel',
    ],
    cookies: [
      'mp_',
      '__mp_opt_in_out',
    ],
    apiEndpoints: [
      'api.mixpanel.com/track/',
      'api-js.mixpanel.com/track/',
    ],
    attackSurface: [
      'Event tracking manipulation',
      'User property exposure',
      'Funnel data leakage',
      'Cohort analysis data',
      'A/B test tracking',
    ],
    riskLevel: 'MEDIUM',
  },

  // 6. Amplitude (P1) - BEHAVIORAL ANALYTICS
  {
    provider: 'Amplitude',
    category: 'Analytics AI (Event Tracking)',
    scriptUrls: [
      /cdn\.amplitude\.com\//i,
      /analytics\.amplitude\.com\//i,
    ],
    globalObjects: [
      'amplitude',
    ],
    cookies: [
      'amplitude_id',
      'amplitude_',
    ],
    apiEndpoints: [
      'api.amplitude.com/2/httpapi',
      'api2.amplitude.com/2/httpapi',
    ],
    attackSurface: [
      'Behavioral cohort analysis',
      'User journey tracking',
      'Revenue analytics exposure',
      'Funnel conversion data',
      'Retention analysis',
    ],
    riskLevel: 'MEDIUM',
  },

  // 7. Smartlook (P1) - SESSION REPLAY
  {
    provider: 'Smartlook',
    category: 'Analytics AI (Session Replay)',
    scriptUrls: [
      /rec\.smartlook\.com\/recorder\.js/i,
      /manager\.smartlook\.com\//i,
    ],
    globalObjects: [
      'smartlook',
    ],
    cookies: [
      'SL_C_',
      'SL_L_',
    ],
    attackSurface: [
      'Session recording',
      'Mobile app tracking',
      'Heatmaps',
      'Event tracking',
    ],
    riskLevel: 'HIGH',
    sessionReplay: true,
  },

  // 8. Mouseflow (P2) - SESSION REPLAY
  {
    provider: 'Mouseflow',
    category: 'Analytics AI (Session Replay)',
    scriptUrls: [
      /cdn\.mouseflow\.com\/projects\//i,
    ],
    globalObjects: [
      '_mfq',
    ],
    cookies: [
      'mf_',
    ],
    attackSurface: [
      'Session replay',
      'Form analytics',
      'Funnel tracking',
      'Heatmaps',
    ],
    riskLevel: 'HIGH',
    sessionReplay: true,
  },

  // 9. Crazy Egg (P2) - HEATMAPS
  {
    provider: 'Crazy Egg',
    category: 'Analytics AI (Heatmaps)',
    scriptUrls: [
      /script\.crazyegg\.com\/pages\/scripts\//i,
    ],
    globalObjects: [
      'CE2',
    ],
    cookies: [
      'is_returning',
      '_ce.s',
    ],
    attackSurface: [
      'Heatmaps',
      'Scroll maps',
      'A/B testing',
      'Click tracking',
    ],
    riskLevel: 'MEDIUM',
  },

  // 10. Pendo (P1) - PRODUCT ANALYTICS
  {
    provider: 'Pendo',
    category: 'Analytics AI (Event Tracking)',
    scriptUrls: [
      /cdn\.pendo\.io\/agent\/static\//i,
      /pendo-static-/i,
    ],
    globalObjects: [
      'pendo',
    ],
    cookies: [
      '_pendo_',
    ],
    attackSurface: [
      'Product analytics',
      'In-app guidance tracking',
      'Feature adoption monitoring',
      'User segmentation',
    ],
    riskLevel: 'MEDIUM',
  },
]

/**
 * Detect Analytics AI services from crawl result
 */
export function detectAnalyticsAI(crawlResult: CrawlResult): AnalyticsAIDetectionResult {
  const detections: AnalyticsAIDetection[] = []
  let sessionReplayDetected = false
  let criticalRiskCount = 0

  for (const pattern of ANALYTICS_AI_PATTERNS) {
    const detection: AnalyticsAIDetection = {
      provider: pattern.provider,
      category: pattern.category,
      confidence: 'LOW',
      detectionPatterns: [],
      attackSurface: pattern.attackSurface,
      riskLevel: pattern.riskLevel,
      sessionReplayEnabled: pattern.sessionReplay || false,
    }

    let indicators = 0

    // 1. Check script URLs
    if (crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptUrl = typeof script === 'string' ? script : script.url || ''
        for (const urlPattern of pattern.scriptUrls) {
          if (urlPattern.test(scriptUrl)) {
            detection.scriptFound = true
            detection.detectionPatterns.push(`Script URL: ${urlPattern.source}`)
            indicators += 2
          }
        }
      }
    }

    // 2. Check global objects
    if (pattern.globalObjects && crawlResult.html) {
      for (const globalObject of pattern.globalObjects) {
        if (crawlResult.html.includes(globalObject)) {
          detection.globalObjectFound = true
          detection.detectionPatterns.push(`Global Object: ${globalObject}`)
          indicators += 1
        }
      }
    }

    // 3. Check cookies
    if (pattern.cookies && crawlResult.cookies && Array.isArray(crawlResult.cookies)) {
      for (const cookieName of pattern.cookies) {
        for (const cookie of crawlResult.cookies) {
          if (cookie.name === cookieName || cookie.name.startsWith(cookieName)) {
            detection.cookieFound = true
            detection.detectionPatterns.push(`Cookie: ${cookie.name}`)
            indicators += 1
          }
        }
      }
    }

    // 4. Check API endpoints
    if (pattern.apiEndpoints && crawlResult.networkRequests && Array.isArray(crawlResult.networkRequests)) {
      for (const request of crawlResult.networkRequests) {
        const url = request.url || ''
        for (const endpoint of pattern.apiEndpoints) {
          if (url.includes(endpoint)) {
            detection.apiEndpointFound = true
            detection.detectionPatterns.push(`API Endpoint: ${endpoint}`)
            indicators += 2
          }
        }
      }
    }

    // 5. Determine confidence level
    if (indicators >= 4) {
      detection.confidence = 'HIGH'
    } else if (indicators >= 2) {
      detection.confidence = 'MEDIUM'
    } else if (indicators >= 1) {
      detection.confidence = 'LOW'
    }

    // 6. Session replay detection
    if (pattern.sessionReplay && indicators > 0) {
      sessionReplayDetected = true
    }

    // 7. Critical risk counting
    if (pattern.riskLevel === 'CRITICAL' && indicators > 0) {
      criticalRiskCount++
    }

    // Add detection if any indicators found
    if (indicators > 0) {
      detections.push(detection)
    }
  }

  return {
    hasAnalyticsAI: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
    sessionReplayDetected,
    criticalRiskCount,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectAnalyticsAI

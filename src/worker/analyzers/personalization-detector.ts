/**
 * Personalization & A/B Testing AI Detection Analyzer
 *
 * Detects Personalization and A/B Testing platforms
 * P0 Priority Services: Optimizely, VWO
 *
 * Detection Methods:
 * - Script URL detection
 * - Global object detection (window.optimizely, window.VWO)
 * - Cookie detection (optimizelyEndUserId, _vwo_*)
 * - API endpoint monitoring (for server-side tools)
 *
 * Security Focus:
 * - Feature flag exploitation
 * - A/B test manipulation
 * - Experiment data leakage
 * - Session recording (VWO - PII risk)
 *
 * Created: 2025-11-14
 */

import type { CrawlResult } from '@/lib/types/crawler-types'

export interface PersonalizationAIDetection {
  provider: string
  category: 'Personalization & A/B Testing'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  scriptFound?: boolean
  globalObjectFound?: boolean
  cookieFound?: boolean
  apiEndpointFound?: boolean
  detectionPatterns: string[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface PersonalizationAIDetectionResult {
  hasPersonalizationAI: boolean
  detections: PersonalizationAIDetection[]
  totalProviders: number
  highConfidenceCount: number
  sessionRecordingDetected: boolean // VWO, Hotjar session recording
}

interface PersonalizationAIPattern {
  provider: string
  scriptUrls: RegExp[]
  globalObjects?: string[]
  cookies?: string[]
  apiEndpoints?: string[]
  domSelectors?: string[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  hasSessionRecording?: boolean
}

// Personalization & A/B Testing Patterns (12 services total, 2 P0)
const PERSONALIZATION_AI_PATTERNS: PersonalizationAIPattern[] = [
  // 1. Optimizely (P0) - Market Leader
  {
    provider: 'Optimizely',
    scriptUrls: [
      /cdn\.optimizely\.com\/js\//i,
      /optimizely\.s3\.amazonaws\.com/i,
    ],
    globalObjects: [
      'optimizely',
      'optimizelySdk',
    ],
    cookies: [
      'optimizelyEndUserId',
      'optimizelyBuckets',
    ],
    attackSurface: [
      'A/B test manipulation',
      'Feature flag exploitation',
      'Experiment data leakage',
      'Statistical significance gaming',
      'Variation assignment bypass',
      'Revenue tracking exposure',
    ],
    riskLevel: 'MEDIUM',
  },

  // 2. VWO (Visual Website Optimizer) (P0)
  {
    provider: 'VWO',
    scriptUrls: [
      /dev\.visualwebsiteoptimizer\.com\/j\.php/i,
      /dev\.visualwebsiteoptimizer\.com\/lib\//i,
    ],
    globalObjects: [
      'VWO',
      '_vwo_code',
    ],
    cookies: [
      '_vis_opt_exp',
      '_vis_opt_s',
      '_vwo_uuid',
      '_vwo_ds',
    ],
    attackSurface: [
      'Heatmap data exposure',
      'Conversion funnel manipulation',
      'Session recording (PII risk)',
      'Form analytics data leakage',
      'Click tracking abuse',
      'Scroll depth manipulation',
    ],
    riskLevel: 'HIGH',
    hasSessionRecording: true,
  },

  // 3. Google Optimize (P1 - Deprecated but still in use)
  {
    provider: 'Google Optimize',
    scriptUrls: [
      /www\.googleoptimize\.com\/optimize\.js/i,
    ],
    globalObjects: [
      'dataLayer', // GTM integration
    ],
    cookies: [
      '_gaexp',
      '_opt_',
    ],
    attackSurface: [
      'Google Analytics integration exposure',
      'Experiment ID enumeration',
      'Variant assignment tracking',
    ],
    riskLevel: 'LOW',
  },

  // 4. AB Tasty (P1)
  {
    provider: 'AB Tasty',
    scriptUrls: [
      /try\.abtasty\.com\/.*\/lib\.js/i,
    ],
    globalObjects: [
      'ABTasty',
    ],
    cookies: [
      'ABTasty',
      'ABTastySession',
    ],
    attackSurface: [
      'Personalization abuse',
      'Widget injection',
      'Campaign manipulation',
    ],
    riskLevel: 'MEDIUM',
  },

  // 5. Adobe Target (P1)
  {
    provider: 'Adobe Target',
    scriptUrls: [
      /assets\.adobedtm\.com\//i,
      /\.tt\.omtrdc\.net\//i,
    ],
    globalObjects: [
      'adobe.target',
    ],
    cookies: [
      'mbox',
    ],
    attackSurface: [
      'Enterprise personalization',
      'Adobe Experience Cloud exposure',
      'Visitor profile manipulation',
    ],
    riskLevel: 'MEDIUM',
  },

  // 6. LaunchDarkly (P1) - Feature Flags
  {
    provider: 'LaunchDarkly',
    scriptUrls: [
      /app\.launchdarkly\.com\//i,
    ],
    apiEndpoints: [
      'sdk.launchdarkly.com/sdk/eval/',
      'app.launchdarkly.com/sdk/eval/',
    ],
    globalObjects: [
      'LDClient',
    ],
    attackSurface: [
      'Feature flag manipulation',
      'Client SDK key exposure',
      'A/B test bypass',
      'Environment key leakage',
    ],
    riskLevel: 'MEDIUM',
  },

  // 7. Split.io (P2)
  {
    provider: 'Split.io',
    scriptUrls: [
      /cdn\.split\.io\/sdk\//i,
    ],
    globalObjects: [
      'SplitFactory',
    ],
    attackSurface: [
      'Feature delivery manipulation',
      'Treatment assignment abuse',
      'Split definition exposure',
    ],
    riskLevel: 'MEDIUM',
  },

  // 8. Kameleoon (P2)
  {
    provider: 'Kameleoon',
    scriptUrls: [
      /\.kameleoon\.eu\//i,
      /\.kameleoon\.com\//i,
    ],
    globalObjects: [
      'Kameleoon',
    ],
    attackSurface: [
      'Real-time personalization',
      'Predictive targeting',
      'AI-powered segmentation abuse',
    ],
    riskLevel: 'MEDIUM',
  },

  // 9. Convert.com (P2)
  {
    provider: 'Convert.com',
    scriptUrls: [
      /cdn-.*\.convertexperiments\.com\//i,
    ],
    globalObjects: [
      '_conv_q',
    ],
    attackSurface: [
      'Privacy-focused A/B testing',
      'GDPR bypass attempts',
      'Experiment data exposure',
    ],
    riskLevel: 'LOW',
  },

  // 10. Unbounce (P2)
  {
    provider: 'Unbounce',
    scriptUrls: [
      /unbounce\.com\/.*\/variants\//i,
    ],
    attackSurface: [
      'Landing page A/B tests',
      'Conversion tracking',
      'Form submission manipulation',
    ],
    riskLevel: 'LOW',
  },

  // 11. Webtrends Optimize (P3)
  {
    provider: 'Webtrends Optimize',
    scriptUrls: [
      /\.webtrends-optimize\.com\//i,
    ],
    attackSurface: [
      'Behavioral targeting',
      'Segment manipulation',
    ],
    riskLevel: 'LOW',
  },

  // 12. SiteSpect (P3) - Server-side testing
  {
    provider: 'SiteSpect',
    scriptUrls: [],
    apiEndpoints: [
      // Server-side only, detected via response headers
    ],
    attackSurface: [
      'Server-side testing exposure',
      'Edge-based personalization',
    ],
    riskLevel: 'LOW',
  },
]

/**
 * Detect Personalization & A/B Testing AI services from crawl result
 */
export function detectPersonalizationAI(crawlResult: CrawlResult): PersonalizationAIDetectionResult {
  const detections: PersonalizationAIDetection[] = []
  let sessionRecordingDetected = false

  for (const pattern of PERSONALIZATION_AI_PATTERNS) {
    const detection: PersonalizationAIDetection = {
      provider: pattern.provider,
      category: 'Personalization & A/B Testing',
      confidence: 'LOW',
      detectionPatterns: [],
      attackSurface: pattern.attackSurface,
      riskLevel: pattern.riskLevel,
    }

    let indicators = 0

    // 1. Check script URLs
    if (pattern.scriptUrls.length > 0 && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
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

    // 5. Check DOM selectors (if provided)
    if (pattern.domSelectors && crawlResult.html) {
      for (const selector of pattern.domSelectors) {
        if (crawlResult.html.includes(selector)) {
          detection.detectionPatterns.push(`DOM Element: ${selector}`)
          indicators += 1
        }
      }
    }

    // 6. Determine confidence level
    if (indicators >= 4) {
      detection.confidence = 'HIGH'
    } else if (indicators >= 2) {
      detection.confidence = 'MEDIUM'
    } else if (indicators >= 1) {
      detection.confidence = 'LOW'
    }

    // 7. Session recording detection
    if (pattern.hasSessionRecording && indicators > 0) {
      sessionRecordingDetected = true
    }

    // Add detection if any indicators found
    if (indicators > 0) {
      detections.push(detection)
    }
  }

  return {
    hasPersonalizationAI: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
    sessionRecordingDetected,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectPersonalizationAI

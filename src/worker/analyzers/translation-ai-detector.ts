/**
 * Translation AI Detection Analyzer
 *
 * Detects Translation AI services (widgets, APIs, SDKs)
 * P0 Priority Services: Google Translate Widget, DeepL, Weglot
 *
 * Detection Methods:
 * - Widget script URL detection
 * - API endpoint monitoring
 * - Global object detection (window.google.translate, window.Weglot, etc.)
 * - DOM selector detection (#google_translate_element, .weglot-container)
 * - Cookie detection (googtrans, weglot_language)
 * - API key pattern matching
 *
 * Created: 2025-11-14
 */

import type { CrawlerResult as CrawlResult } from '@/lib/types/crawler-types'

export interface TranslationAIDetection {
  provider: string
  category: 'Translation AI (Widget)' | 'Translation AI (API)' | 'Translation AI (SaaS)'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  widgetFound?: boolean
  apiEndpointFound?: boolean
  globalObjectFound?: boolean
  domElementFound?: boolean
  cookieFound?: boolean
  apiKeyMasked?: string
  detectionPatterns: string[]
  attackSurface: string[]
}

export interface TranslationAIDetectionResult {
  hasTranslationAI: boolean
  detections: TranslationAIDetection[]
  totalProviders: number
  highConfidenceCount: number
}

interface TranslationAIPattern {
  provider: string
  category: 'Translation AI (Widget)' | 'Translation AI (API)' | 'Translation AI (SaaS)'
  scriptUrls?: RegExp[]
  apiEndpoints?: string[]
  globalObjects?: string[]
  domSelectors?: string[]
  cookies?: string[]
  apiKeyPatterns?: RegExp[]
  authHeaderPatterns?: RegExp[]
  attackSurface: string[]
}

// Translation AI Patterns (8 services total, 3 P0)
const TRANSLATION_AI_PATTERNS: TranslationAIPattern[] = [
  // 1. Google Translate Widget (P0) - VERY COMMON
  {
    provider: 'Google Translate Widget',
    category: 'Translation AI (Widget)',
    scriptUrls: [
      /translate\.google\.com\/translate_a\/element\.js/i,
      /translate\.googleapis\.com\/translate_static\/js\//i,
    ],
    globalObjects: [
      'google.translate.TranslateElement',
      'google.translate',
    ],
    domSelectors: [
      '#google_translate_element',
      '.goog-te-banner-frame',
      '.goog-te-menu-value',
      'select.goog-te-combo',
    ],
    cookies: [
      'googtrans',
    ],
    attackSurface: [
      'Automatic translation manipulation',
      'Language preference tracking',
      'Cross-site content injection',
      'Privacy concerns (sends all text to Google)',
      'DOM manipulation for XSS',
      'Cookie poisoning',
    ],
  },

  // 2. Google Cloud Translation API (P0)
  {
    provider: 'Google Cloud Translation API',
    category: 'Translation AI (API)',
    apiEndpoints: [
      'translation.googleapis.com/language/translate/v2',
      'translation.googleapis.com/v3/projects/',
    ],
    apiKeyPatterns: [
      /AIza[a-zA-Z0-9\-_]{35}/,
    ],
    authHeaderPatterns: [
      /X-Goog-Api-Key:\s*(AIza[a-zA-Z0-9\-_]{35})/i,
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-._~+\/]+=*)/i,
    ],
    attackSurface: [
      'Google API key exposure',
      'Translation manipulation',
      'Language detection abuse',
      'AutoML custom model theft',
      'Batch translation exploitation',
      'Glossary manipulation',
    ],
  },

  // 3. DeepL (P0) - Superior Quality
  {
    provider: 'DeepL',
    category: 'Translation AI (API)',
    scriptUrls: [
      /www\.deepl\.com\/js\/element\/main\.js/i,
      /cdn\.deepl\.com\//i,
    ],
    apiEndpoints: [
      'api.deepl.com/v2/translate',
      'api-free.deepl.com/v2/translate',
      'api.deepl.com/v2/document',
    ],
    apiKeyPatterns: [
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:fx/i, // DeepL API key format
    ],
    authHeaderPatterns: [
      /Authorization:\s*DeepL-Auth-Key\s+([a-f0-9\-:]+)/i,
    ],
    attackSurface: [
      'Superior translation quality exploitation',
      'Free vs Pro API key exposure',
      'Glossary manipulation',
      'Formality level abuse',
      'Document translation abuse',
      'Tag handling exploitation',
    ],
  },

  // 4. Weglot (P0) - SaaS Translation Platform
  {
    provider: 'Weglot',
    category: 'Translation AI (SaaS)',
    scriptUrls: [
      /cdn\.weglot\.com\/weglot\.min\.js/i,
    ],
    globalObjects: [
      'Weglot',
    ],
    domSelectors: [
      '.weglot-container',
      '[data-wg-notranslate]',
      '.country-selector',
    ],
    cookies: [
      'weglot_language',
    ],
    apiKeyPatterns: [
      /wg_[a-zA-Z0-9]{32}/i, // Weglot API key pattern
    ],
    attackSurface: [
      'SaaS translation service exposure',
      'Language switcher manipulation',
      'SEO impact (hreflang tags)',
      'API key in client-side code',
      'URL structure manipulation',
      'Multi-language content injection',
    ],
  },

  // 5. Lokalise (P1)
  {
    provider: 'Lokalise',
    category: 'Translation AI (SaaS)',
    scriptUrls: [
      /cdn\.lokalise\.com\//i,
    ],
    apiEndpoints: [
      'api.lokalise.com/api2/projects/',
    ],
    apiKeyPatterns: [
      /[a-f0-9]{64}/i, // Lokalise API token
    ],
    attackSurface: [
      'Translation management platform',
      'API token exposure',
      'Project key leakage',
      'Translation key enumeration',
    ],
  },

  // 6. Microsoft Translator (P1)
  {
    provider: 'Microsoft Translator',
    category: 'Translation AI (Widget)',
    scriptUrls: [
      /www\.microsofttranslator\.com\/ajax\/v3\/widgetv3\.ashx/i,
    ],
    apiEndpoints: [
      'api.cognitive.microsofttranslator.com/translate',
      'api.cognitive.microsofttranslator.com/detect',
    ],
    authHeaderPatterns: [
      /Ocp-Apim-Subscription-Key:\s*([a-f0-9]{32})/i,
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/,
    ],
    attackSurface: [
      'Azure Cognitive Services key exposure',
      'Translation manipulation',
      'Custom dictionary abuse',
      'Language detection bypass',
    ],
  },

  // 7. Amazon Translate (P1)
  {
    provider: 'Amazon Translate',
    category: 'Translation AI (API)',
    apiEndpoints: [
      'translate.us-east-1.amazonaws.com',
      'translate.us-west-2.amazonaws.com',
      'translate.eu-west-1.amazonaws.com',
    ],
    authHeaderPatterns: [
      /X-Amz-Target:\s*AWSShineFrontendService_20170701\.TranslateText/i,
      /Authorization:\s*AWS4-HMAC-SHA256/i,
    ],
    apiKeyPatterns: [
      /AKIA[A-Z0-9]{16}/,
    ],
    attackSurface: [
      'AWS credential exposure',
      'Custom terminology manipulation',
      'Parallel data exploitation',
      'Real-time translation abuse',
    ],
  },

  // 8. ModernMT (P2)
  {
    provider: 'ModernMT',
    category: 'Translation AI (API)',
    apiEndpoints: [
      'api.modernmt.com/translate',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-_]+)/i,
    ],
    attackSurface: [
      'Adaptive neural MT',
      'Context-aware translation abuse',
      'Custom domain exploitation',
    ],
  },
]

/**
 * Safely mask API key (show first 8 + last 4 chars)
 */
function maskAPIKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return apiKey.substring(0, 4) + '****'
  }
  return apiKey.substring(0, 8) + '****' + apiKey.substring(apiKey.length - 4)
}

/**
 * Detect Translation AI services from crawl result
 */
export function detectTranslationAI(crawlResult: CrawlResult): TranslationAIDetectionResult {
  const detections: TranslationAIDetection[] = []

  for (const pattern of TRANSLATION_AI_PATTERNS) {
    const detection: TranslationAIDetection = {
      provider: pattern.provider,
      category: pattern.category,
      confidence: 'LOW',
      detectionPatterns: [],
      attackSurface: pattern.attackSurface,
    }

    let indicators = 0

    // 1. Check script URLs
    if (pattern.scriptUrls && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptUrl = script // scripts is string[]
        for (const urlPattern of pattern.scriptUrls) {
          if (urlPattern.test(scriptUrl)) {
            detection.widgetFound = true
            detection.detectionPatterns.push(`Script URL: ${urlPattern.source}`)
            indicators += 2 // Script URL is high confidence
          }
        }
      }
    }

    // 2. Check API endpoints in network requests
    if (pattern.apiEndpoints && crawlResult.networkRequests && Array.isArray(crawlResult.networkRequests)) {
      for (const request of crawlResult.networkRequests) {
        const url = request.url || ''
        for (const endpoint of pattern.apiEndpoints) {
          if (url.includes(endpoint)) {
            detection.apiEndpointFound = true
            detection.detectionPatterns.push(`API Endpoint: ${endpoint}`)
            indicators += 2 // API endpoint is high confidence
          }
        }

        // Check auth headers
        if (pattern.authHeaderPatterns && request.headers) {
          const headers = request.headers
          for (const headerPattern of pattern.authHeaderPatterns) {
            for (const [headerName, headerValue] of Object.entries(headers)) {
              const headerString = `${headerName}: ${headerValue}`
              const match = headerString.match(headerPattern)
              if (match && match[1]) {
                detection.apiKeyMasked = maskAPIKey(match[1])
                detection.detectionPatterns.push(`Auth Header: ${headerName}`)
                indicators += 2
              }
            }
          }
        }
      }
    }

    // 3. Check global objects
    if (pattern.globalObjects && crawlResult.html) {
      for (const globalObject of pattern.globalObjects) {
        // Check for window.google.translate or window.Weglot
        if (crawlResult.html.includes(globalObject)) {
          detection.globalObjectFound = true
          detection.detectionPatterns.push(`Global Object: ${globalObject}`)
          indicators += 1
        }
      }
    }

    // 4. Check DOM selectors
    if (pattern.domSelectors && crawlResult.html) {
      for (const selector of pattern.domSelectors) {
        // Simple check - look for id= or class= in HTML
        const idPattern = selector.startsWith('#') ? `id="${selector.substring(1)}"` : null
        const classPattern = selector.startsWith('.') ? `class="${selector.substring(1)}"` : null

        if ((idPattern && crawlResult.html.includes(idPattern)) ||
            (classPattern && crawlResult.html.includes(classPattern)) ||
            crawlResult.html.includes(selector)) {
          detection.domElementFound = true
          detection.detectionPatterns.push(`DOM Element: ${selector}`)
          indicators += 1
        }
      }
    }

    // 5. Check cookies
    if (pattern.cookies && crawlResult.cookies && Array.isArray(crawlResult.cookies)) {
      for (const cookieName of pattern.cookies) {
        for (const cookie of crawlResult.cookies) {
          if (cookie.name === cookieName) {
            detection.cookieFound = true
            detection.detectionPatterns.push(`Cookie: ${cookieName}`)
            indicators += 1
          }
        }
      }
    }

    // 6. Check for API key patterns in scripts
    if (pattern.apiKeyPatterns && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptContent = script // scripts is string[]
        for (const keyPattern of pattern.apiKeyPatterns) {
          const match = scriptContent.match(keyPattern)
          if (match && match[0]) {
            detection.apiKeyMasked = maskAPIKey(match[0])
            detection.detectionPatterns.push(`API Key Pattern: ${keyPattern.source}`)
            indicators += 2
          }
        }
      }
    }

    // 7. Determine confidence level
    if (indicators >= 4) {
      detection.confidence = 'HIGH'
    } else if (indicators >= 2) {
      detection.confidence = 'MEDIUM'
    } else if (indicators >= 1) {
      detection.confidence = 'LOW'
    }

    // Add detection if any indicators found
    if (indicators > 0) {
      detections.push(detection)
    }
  }

  return {
    hasTranslationAI: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectTranslationAI

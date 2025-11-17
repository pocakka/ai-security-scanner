/**
 * Content Moderation AI Detection Analyzer
 *
 * Detects AI-powered Content Moderation services
 * P1 Priority Services: Perspective API, Azure Content Moderator, OpenAI Moderation
 *
 * Detection Methods:
 * - API endpoint monitoring
 * - Request header analysis
 * - API key pattern matching
 *
 * Security Focus:
 * - Moderation bypass
 * - False positive exploitation
 * - Toxicity threshold manipulation
 * - Category threshold abuse
 *
 * Created: 2025-11-15
 */

import type { CrawlerResult as CrawlResult } from '@/lib/types/crawler-types'

export interface ContentModerationDetection {
  provider: string
  category: 'Content Moderation AI'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  endpoints: string[]
  apiKeyMasked?: string
  detectionPatterns: string[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ContentModerationDetectionResult {
  hasContentModeration: boolean
  detections: ContentModerationDetection[]
  totalProviders: number
  highConfidenceCount: number
}

interface ContentModerationPattern {
  provider: string
  endpoints: string[]
  apiKeyPatterns?: RegExp[]
  authHeaderPatterns?: RegExp[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

// Content Moderation AI Patterns (6 services, 1 already in reCAPTCHA)
const CONTENT_MODERATION_PATTERNS: ContentModerationPattern[] = [
  // 1. reCAPTCHA v3 - Already detected elsewhere, but included for completeness
  {
    provider: 'reCAPTCHA v3 (Google)',
    endpoints: [
      'www.google.com/recaptcha/api.js',
      'www.gstatic.com/recaptcha/',
    ],
    attackSurface: [
      'Bot detection bypass',
      'Score manipulation',
      'Token replay attacks',
    ],
    riskLevel: 'MEDIUM',
  },

  // 2. OpenAI Moderation API - P1
  {
    provider: 'OpenAI Moderation API',
    endpoints: [
      'api.openai.com/v1/moderations',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{48,})/i,
    ],
    apiKeyPatterns: [
      /sk-[a-zA-Z0-9]{48,}/,
    ],
    attackSurface: [
      'Moderation bypass attempts',
      'False positive exploitation',
      'Category threshold manipulation',
      'Hate speech detection bypass',
      'Violence filter evasion',
      'Sexual content bypass',
    ],
    riskLevel: 'HIGH',
  },

  // 3. Perspective API (Google Jigsaw) - P1
  {
    provider: 'Perspective API (Google Jigsaw)',
    endpoints: [
      'commentanalyzer.googleapis.com/v1alpha1/comments:analyze',
      'commentanalyzer.googleapis.com/v1beta1/comments:analyze',
    ],
    apiKeyPatterns: [
      /AIza[a-zA-Z0-9\-_]{35}/,
    ],
    authHeaderPatterns: [
      /X-Goog-Api-Key:\s*(AIza[a-zA-Z0-9\-_]{35})/i,
    ],
    attackSurface: [
      'Toxicity score manipulation',
      'Attribute threshold abuse',
      'Language-specific exploits',
      'Severe toxicity bypass',
      'Identity attack detection evasion',
      'Insult detection bypass',
    ],
    riskLevel: 'HIGH',
  },

  // 4. Azure Content Moderator - P1
  {
    provider: 'Azure Content Moderator',
    endpoints: [
      '.api.cognitive.microsoft.com/contentmoderator/',
      '.cognitiveservices.azure.com/contentmoderator/',
    ],
    authHeaderPatterns: [
      /Ocp-Apim-Subscription-Key:\s*([a-f0-9]{32})/i,
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/,
    ],
    attackSurface: [
      'Text/image moderation bypass',
      'Custom term list exposure',
      'Review API manipulation',
      'Adult content detection bypass',
      'PII detection evasion',
    ],
    riskLevel: 'HIGH',
  },

  // 5. AWS Rekognition Moderation - P1 (already in Image AI detector)
  {
    provider: 'AWS Rekognition Moderation',
    endpoints: [
      'rekognition.us-east-1.amazonaws.com',
      'rekognition.us-west-2.amazonaws.com',
    ],
    authHeaderPatterns: [
      /X-Amz-Target:\s*RekognitionService\.DetectModerationLabels/i,
    ],
    apiKeyPatterns: [
      /AKIA[A-Z0-9]{16}/,
    ],
    attackSurface: [
      'NSFW detection bypass',
      'Label confidence manipulation',
      'Violence detection evasion',
      'Explicit content bypass',
    ],
    riskLevel: 'MEDIUM',
  },

  // 6. Hive Moderation - P2
  {
    provider: 'Hive Moderation',
    endpoints: [
      'api.thehive.ai/api/v2/task/sync',
    ],
    authHeaderPatterns: [
      /authorization:\s*Token\s+([a-zA-Z0-9]+)/i,
    ],
    attackSurface: [
      'Multi-modal moderation bypass',
      'Custom model exploitation',
      'Image classification evasion',
      'Video content bypass',
    ],
    riskLevel: 'MEDIUM',
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
 * Detect Content Moderation AI services from crawl result
 */
export function detectContentModeration(crawlResult: CrawlResult): ContentModerationDetectionResult {
  const detections: ContentModerationDetection[] = []

  for (const pattern of CONTENT_MODERATION_PATTERNS) {
    const detection: ContentModerationDetection = {
      provider: pattern.provider,
      category: 'Content Moderation AI',
      confidence: 'LOW',
      endpoints: [],
      detectionPatterns: [],
      attackSurface: pattern.attackSurface,
      riskLevel: pattern.riskLevel,
    }

    let indicators = 0

    // 1. Check API endpoints in network requests
    if (crawlResult.networkRequests && Array.isArray(crawlResult.networkRequests)) {
      for (const request of crawlResult.networkRequests) {
        const url = request.url || ''

        // Check endpoint patterns
        for (const endpoint of pattern.endpoints) {
          if (url.includes(endpoint)) {
            if (!detection.endpoints.includes(endpoint)) {
              detection.endpoints.push(endpoint)
              detection.detectionPatterns.push(`API Endpoint: ${endpoint}`)
              indicators += 2
            }
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

    // 2. Check for API key patterns in script content
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

    // 3. Determine confidence level
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
    hasContentModeration: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectContentModeration

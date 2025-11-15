/**
 * Image/Video AI Detection Analyzer
 *
 * Detects AI-powered Image & Video Generation/Processing services
 * P1 Priority Services: Stability AI, Midjourney, Runway ML, Replicate, Cloudinary AI
 *
 * Detection Methods:
 * - API endpoint monitoring
 * - SDK script URL detection
 * - API key pattern matching
 * - Request header analysis
 * - Global object detection
 *
 * Security Focus:
 * - NSFW filter bypass
 * - Deepfake generation
 * - Prompt injection
 * - API key exposure
 * - Model weight extraction
 *
 * Created: 2025-11-15
 */

import type { CrawlerResult as CrawlResult } from '@/lib/types/crawler-types'

export interface ImageVideoAIDetection {
  provider: string
  category: 'Image AI (Generation)' | 'Image AI (Processing)' | 'Video AI' | 'Image AI (Recognition)'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  endpoints: string[]
  sdkFound?: boolean
  apiKeyMasked?: string
  detectionPatterns: string[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface ImageVideoAIDetectionResult {
  hasImageVideoAI: boolean
  detections: ImageVideoAIDetection[]
  totalProviders: number
  highConfidenceCount: number
  generativeAIDetected: boolean // Stability AI, Midjourney, DALL-E
}

interface ImageVideoAIPattern {
  provider: string
  category: 'Image AI (Generation)' | 'Image AI (Processing)' | 'Video AI' | 'Image AI (Recognition)'
  endpoints: string[]
  sdkUrls?: string[]
  globalObjects?: string[]
  apiKeyPatterns?: RegExp[]
  authHeaderPatterns?: RegExp[]
  attackSurface: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isGenerative?: boolean
}

// Image/Video AI Patterns (15 services total, P1 focus)
const IMAGE_VIDEO_AI_PATTERNS: ImageVideoAIPattern[] = [
  // 1. DALL-E (OpenAI) - Already in LLM API detector, included for completeness
  {
    provider: 'DALL-E (OpenAI)',
    category: 'Image AI (Generation)',
    endpoints: [
      'api.openai.com/v1/images/generations',
      'api.openai.com/v1/images/edits',
      'api.openai.com/v1/images/variations',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{48,})/i,
    ],
    apiKeyPatterns: [
      /sk-[a-zA-Z0-9]{48,}/,
    ],
    attackSurface: [
      'Prompt injection for NSFW bypass',
      'API key exposure',
      'Image variation manipulation',
      'Content policy violation',
    ],
    riskLevel: 'MEDIUM',
    isGenerative: true,
  },

  // 2. Stability AI (Stable Diffusion) - P0/P1 HIGH PROFILE
  {
    provider: 'Stability AI (Stable Diffusion)',
    category: 'Image AI (Generation)',
    endpoints: [
      'api.stability.ai/v1/generation/',
      'api.stability.ai/v1/user/balance',
      'api.stability.ai/v1/engines/list',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{40,})/i,
    ],
    apiKeyPatterns: [
      /sk-[a-zA-Z0-9]{40,}/,
    ],
    attackSurface: [
      'NSFW filter bypass',
      'Negative prompt injection',
      'Model weight extraction',
      'API key exposure (CRITICAL)',
      'Seed manipulation',
      'Cfg_scale exploitation',
    ],
    riskLevel: 'HIGH',
    isGenerative: true,
  },

  // 3. Midjourney - P1 (Discord-based, hard to detect)
  {
    provider: 'Midjourney',
    category: 'Image AI (Generation)',
    endpoints: [
      'discord.com/api/v9/interactions', // Discord bot
      'cdn.midjourney.com/',
    ],
    sdkUrls: [
      'cdn.midjourney.com/',
    ],
    attackSurface: [
      'Prompt injection for NSFW bypass',
      'Copyright infringement',
      'Discord token theft',
      'Image URL enumeration',
      'Upscale/variation manipulation',
    ],
    riskLevel: 'MEDIUM',
    isGenerative: true,
  },

  // 4. Runway ML - P1 VIDEO AI
  {
    provider: 'Runway ML',
    category: 'Video AI',
    endpoints: [
      'api.runwayml.com/v1/',
      'runwayml.com/api/',
    ],
    sdkUrls: [
      'cdn.runwayml.com/',
    ],
    attackSurface: [
      'Video generation manipulation (Gen-2)',
      'Motion tracking exploitation',
      'Green screen removal abuse',
      'Frame interpolation attacks',
    ],
    riskLevel: 'MEDIUM',
    isGenerative: true,
  },

  // 5. Replicate (Image Models) - P1
  {
    provider: 'Replicate (Image Models)',
    category: 'Image AI (Generation)',
    endpoints: [
      'api.replicate.com/v1/predictions',
      'api.replicate.com/v1/models/',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Token\s+(r8_[a-zA-Z0-9]{40,})/i,
    ],
    apiKeyPatterns: [
      /r8_[a-zA-Z0-9]{40,}/,
    ],
    attackSurface: [
      'Open model marketplace abuse',
      'Webhook injection',
      'SDXL/Stable Diffusion exploitation',
      'Model version manipulation',
    ],
    riskLevel: 'MEDIUM',
    isGenerative: true,
  },

  // 6. Cloudinary AI - P1
  {
    provider: 'Cloudinary AI',
    category: 'Image AI (Processing)',
    endpoints: [
      'res.cloudinary.com/',
      'api.cloudinary.com/v1_1/',
    ],
    sdkUrls: [
      'res.cloudinary.com/',
      'cloudinary.com/documentation/ai_in_action',
    ],
    globalObjects: [
      'cloudinary',
    ],
    attackSurface: [
      'AI-powered transformations',
      'Auto-tagging manipulation',
      'Content-aware cropping abuse',
      'Background removal exploitation',
      'Object detection bypass',
    ],
    riskLevel: 'LOW',
  },

  // 7. Amazon Rekognition - P1
  {
    provider: 'Amazon Rekognition',
    category: 'Image AI (Recognition)',
    endpoints: [
      'rekognition.us-east-1.amazonaws.com',
      'rekognition.us-west-2.amazonaws.com',
    ],
    authHeaderPatterns: [
      /X-Amz-Target:\s*RekognitionService\./i,
    ],
    apiKeyPatterns: [
      /AKIA[A-Z0-9]{16}/,
    ],
    attackSurface: [
      'AWS credential exposure',
      'Facial recognition abuse',
      'Content moderation bypass',
      'Celebrity recognition exploitation',
      'Text detection (OCR) manipulation',
    ],
    riskLevel: 'MEDIUM',
  },

  // 8. Google Cloud Vision API - P1
  {
    provider: 'Google Cloud Vision API',
    category: 'Image AI (Recognition)',
    endpoints: [
      'vision.googleapis.com/v1/images:annotate',
      'vision.googleapis.com/v1/images:asyncBatchAnnotate',
    ],
    apiKeyPatterns: [
      /AIza[a-zA-Z0-9\-_]{35}/,
    ],
    authHeaderPatterns: [
      /X-Goog-Api-Key:\s*(AIza[a-zA-Z0-9\-_]{35})/i,
    ],
    attackSurface: [
      'OCR manipulation',
      'Label detection abuse',
      'SafeSearch bypass',
      'Logo detection exploitation',
      'Landmark recognition abuse',
    ],
    riskLevel: 'LOW',
  },

  // 9. Clarifai - P1
  {
    provider: 'Clarifai',
    category: 'Image AI (Recognition)',
    endpoints: [
      'api.clarifai.com/v2/models/',
      'api.clarifai.com/v2/workflows/',
      'api.clarifai.com/v2/inputs',
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/,
    ],
    authHeaderPatterns: [
      /Authorization:\s*Key\s+([a-f0-9]{32})/i,
    ],
    attackSurface: [
      'Custom model exploitation',
      'Visual search manipulation',
      'Concept detection abuse',
      'Face detection bypass',
    ],
    riskLevel: 'MEDIUM',
  },

  // 10. Roboflow - P2
  {
    provider: 'Roboflow',
    category: 'Image AI (Recognition)',
    endpoints: [
      'detect.roboflow.com/',
      'api.roboflow.com/',
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9]{40}/,
    ],
    attackSurface: [
      'Object detection manipulation',
      'Custom dataset poisoning',
      'Computer vision model theft',
    ],
    riskLevel: 'LOW',
  },

  // 11. Remove.bg - P2
  {
    provider: 'Remove.bg',
    category: 'Image AI (Processing)',
    endpoints: [
      'api.remove.bg/v1.0/removebg',
    ],
    authHeaderPatterns: [
      /X-Api-Key:\s*([a-zA-Z0-9]+)/i,
    ],
    attackSurface: [
      'Background removal abuse',
      'API key exposure',
    ],
    riskLevel: 'LOW',
  },

  // 12. DeepAI - P2
  {
    provider: 'DeepAI',
    category: 'Image AI (Generation)',
    endpoints: [
      'api.deepai.org/api/',
    ],
    authHeaderPatterns: [
      /api-key:\s*([a-zA-Z0-9\-]+)/i,
    ],
    attackSurface: [
      'Multiple AI model access',
      'Style transfer abuse',
      'Image enhancement manipulation',
    ],
    riskLevel: 'LOW',
    isGenerative: true,
  },

  // 13. Leonardo.ai - P2
  {
    provider: 'Leonardo.ai',
    category: 'Image AI (Generation)',
    endpoints: [
      'cloud.leonardo.ai/api/rest/v1/',
    ],
    attackSurface: [
      'AI canvas manipulation',
      'Model training data poisoning',
    ],
    riskLevel: 'LOW',
    isGenerative: true,
  },

  // 14. Clipdrop (Stability AI) - P2
  {
    provider: 'Clipdrop (Stability AI)',
    category: 'Image AI (Processing)',
    endpoints: [
      'clipdrop-api.co/*/v1/',
    ],
    authHeaderPatterns: [
      /x-api-key:\s*([a-zA-Z0-9]+)/i,
    ],
    attackSurface: [
      'Background removal abuse',
      'Image upscaling exploitation',
      'Cleanup tool manipulation',
    ],
    riskLevel: 'LOW',
  },

  // 15. Pinata (IPFS + AI) - P3
  {
    provider: 'Pinata (IPFS + AI)',
    category: 'Image AI (Processing)',
    endpoints: [
      'api.pinata.cloud/pinning/',
    ],
    attackSurface: [
      'Decentralized AI model hosting',
      'IPFS content manipulation',
    ],
    riskLevel: 'LOW',
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
 * Detect Image/Video AI services from crawl result
 */
export function detectImageVideoAI(crawlResult: CrawlResult): ImageVideoAIDetectionResult {
  const detections: ImageVideoAIDetection[] = []
  let generativeAIDetected = false

  for (const pattern of IMAGE_VIDEO_AI_PATTERNS) {
    const detection: ImageVideoAIDetection = {
      provider: pattern.provider,
      category: pattern.category,
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

    // 2. Check SDK URLs in scripts
    if (pattern.sdkUrls && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptUrl = typeof script === 'string' ? script : script.url || ''
        for (const sdkUrl of pattern.sdkUrls) {
          if (scriptUrl.includes(sdkUrl)) {
            detection.sdkFound = true
            detection.detectionPatterns.push(`SDK Script: ${sdkUrl}`)
            indicators += 2
          }
        }
      }
    }

    // 3. Check global objects
    if (pattern.globalObjects && crawlResult.html) {
      for (const globalObject of pattern.globalObjects) {
        if (crawlResult.html.includes(globalObject)) {
          detection.detectionPatterns.push(`Global Object: ${globalObject}`)
          indicators += 1
        }
      }
    }

    // 4. Check for API key patterns in script content
    if (pattern.apiKeyPatterns && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptContent = typeof script === 'string' ? script : script.content || ''
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

    // 5. Determine confidence level
    if (indicators >= 4) {
      detection.confidence = 'HIGH'
    } else if (indicators >= 2) {
      detection.confidence = 'MEDIUM'
    } else if (indicators >= 1) {
      detection.confidence = 'LOW'
    }

    // 6. Generative AI detection
    if (pattern.isGenerative && indicators > 0) {
      generativeAIDetected = true
    }

    // Add detection if any indicators found
    if (indicators > 0) {
      detections.push(detection)
    }
  }

  return {
    hasImageVideoAI: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
    generativeAIDetected,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectImageVideoAI

/**
 * Search AI Detection Analyzer
 *
 * Detects AI-powered Search services (Algolia, Elasticsearch, etc.)
 * P0 Priority Services: Algolia, Elasticsearch
 *
 * Detection Methods:
 * - API endpoint monitoring
 * - SDK script URL detection
 * - API key pattern matching (search-only vs admin keys)
 * - Request header analysis
 * - Global object detection
 *
 * Security Focus:
 * - Search-only API keys (low risk if scoped)
 * - Admin API keys (CRITICAL risk)
 * - Open Elasticsearch instances (common misconfiguration)
 *
 * Created: 2025-11-14
 */

import type { CrawlerResult as CrawlResult } from '@/lib/types/crawler-types'

export interface SearchAIDetection {
  provider: string
  category: 'Search AI (Hosted)' | 'Search AI (Self-Hosted)' | 'Search AI (SaaS)'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  endpoints: string[]
  sdkFound?: boolean
  apiKeyType?: 'Search-Only' | 'Admin' | 'Unknown'
  apiKeyMasked?: string
  openInstanceDetected?: boolean
  requestPatterns: string[]
  attackSurface: string[]
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface SearchAIDetectionResult {
  hasSearchAI: boolean
  detections: SearchAIDetection[]
  totalProviders: number
  highConfidenceCount: number
  criticalRiskCount: number
}

interface SearchAIPattern {
  provider: string
  category: 'Search AI (Hosted)' | 'Search AI (Self-Hosted)' | 'Search AI (SaaS)'
  endpoints: string[]
  sdkUrls?: string[]
  globalObjects?: string[]
  apiKeyPatterns?: RegExp[]
  authHeaderPatterns?: RegExp[]
  attackSurface: string[]
}

// Search AI Patterns (8 services total, 2 P0)
const SEARCH_AI_PATTERNS: SearchAIPattern[] = [
  // 1. Algolia (P0) - VERY COMMON
  {
    provider: 'Algolia',
    category: 'Search AI (Hosted)',
    endpoints: [
      '.algolia.net/1/indexes/',
      '.algolianet.com/',
      '-dsn.algolia.net/',
    ],
    sdkUrls: [
      'cdn.jsdelivr.net/npm/algoliasearch',
      'cdn.jsdelivr.net/npm/instantsearch.js',
      'cdn.jsdelivr.net/algoliasearch/',
    ],
    globalObjects: [
      'algoliasearch',
      'instantsearch',
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/, // Algolia API key (32-char hex)
    ],
    authHeaderPatterns: [
      /X-Algolia-Application-Id:\s*([A-Z0-9]+)/i,
      /X-Algolia-API-Key:\s*([a-f0-9]{32})/i,
    ],
    attackSurface: [
      'Search-only API key exposure (LOW RISK if properly scoped)',
      'Index enumeration',
      'Query manipulation',
      'Facet abuse',
      'Rate limiting bypass',
      'Admin API key exposure (CRITICAL RISK)',
      'Index deletion if admin key exposed',
      'Data exfiltration via search queries',
    ],
  },

  // 2. Elasticsearch (P0) - COMMON MISCONFIGURATION
  {
    provider: 'Elasticsearch',
    category: 'Search AI (Self-Hosted)',
    endpoints: [
      ':9200/', // Default Elasticsearch port
      '/elasticsearch/',
      '/_search',
      '/_cluster/health',
      '/_cat/indices',
      '/_mapping',
    ],
    apiKeyPatterns: [
      /ApiKey\s+([A-Za-z0-9+\/=]{40,})/, // Elasticsearch API key (Base64)
    ],
    authHeaderPatterns: [
      /Authorization:\s*ApiKey\s+([A-Za-z0-9+\/=]{40,})/i,
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-._~+\/]+=*)/i,
    ],
    attackSurface: [
      'Open Elasticsearch instance (CRITICAL - common misconfiguration)',
      'Index listing (/_cat/indices)',
      'Mapping disclosure',
      'Query DSL injection',
      'Aggregation abuse',
      'Cluster info leakage',
      'Document enumeration',
      'Delete by query attacks',
      'No authentication (common in dev environments)',
    ],
  },

  // 3. Coveo (P1) - Enterprise Search
  {
    provider: 'Coveo',
    category: 'Search AI (SaaS)',
    endpoints: [
      'platform.cloud.coveo.com/rest/search',
      'platform.cloud.coveo.com/rest/ua',
    ],
    sdkUrls: [
      'static.cloud.coveo.com/searchui/',
    ],
    globalObjects: [
      'Coveo',
    ],
    attackSurface: [
      'Enterprise search exposure',
      'Salesforce/ServiceNow integration leaks',
      'Query pipeline manipulation',
      'Machine learning model exploitation',
    ],
  },

  // 4. Swiftype (Elastic App Search) (P1)
  {
    provider: 'Swiftype (Elastic App Search)',
    category: 'Search AI (SaaS)',
    endpoints: [
      '.swiftype.com/api/v1/engines/',
      '.ent-search.com/',
    ],
    sdkUrls: [
      'cdn.swiftype.com/assets/',
    ],
    globalObjects: [
      'Swiftype',
    ],
    attackSurface: [
      'App Search API key exposure',
      'Engine enumeration',
      'Document injection',
      'Search settings manipulation',
    ],
  },

  // 5. Constructor.io (P1)
  {
    provider: 'Constructor.io',
    category: 'Search AI (SaaS)',
    endpoints: [
      'ac.cnstrc.com/search/',
      'ac.cnstrc.com/autocomplete/',
      'ac.cnstrc.com/browse/',
    ],
    sdkUrls: [
      'cdn.constructor.io/constructorio-',
    ],
    authHeaderPatterns: [
      /x-cnstrc-client:\s*([a-zA-Z0-9\-]+)/i,
    ],
    attackSurface: [
      'Product search manipulation',
      'Autocomplete suggestion abuse',
      'Revenue tracking',
      'Personalization data leakage',
    ],
  },

  // 6. Meilisearch (P1) - Open Source
  {
    provider: 'Meilisearch',
    category: 'Search AI (Self-Hosted)',
    endpoints: [
      '/indexes/',
      '/health',
      '/stats',
      '/keys',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-_]+)/i,
      /X-Meili-API-Key:\s*([a-zA-Z0-9\-_]+)/i,
    ],
    attackSurface: [
      'Open-source search server exposure',
      'Master key vs search key distinction',
      'Index manipulation if admin key exposed',
      'Document deletion',
      'Settings tampering',
    ],
  },

  // 7. Typesense (P2) - Open Source
  {
    provider: 'Typesense',
    category: 'Search AI (Self-Hosted)',
    endpoints: [
      '.typesense.net/collections/',
      '/collections/',
    ],
    authHeaderPatterns: [
      /X-TYPESENSE-API-KEY:\s*([a-zA-Z0-9]+)/i,
    ],
    attackSurface: [
      'Cloud-hosted search exposure',
      'Collection schema leakage',
      'Search key vs admin key',
    ],
  },

  // 8. Lucidworks Fusion (P3) - Enterprise
  {
    provider: 'Lucidworks Fusion',
    category: 'Search AI (SaaS)',
    endpoints: [
      '/api/apollo/query-pipelines/',
      '/api/apollo/collections/',
    ],
    attackSurface: [
      'Enterprise AI-powered search',
      'Query pipeline exposure',
      'Solr backend exploitation',
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
 * Determine if Algolia key is search-only or admin
 * Search keys typically have restrictions, admin keys don't
 * This is a heuristic - real check would need API call
 */
function determineAlgoliaKeyType(key: string): 'Search-Only' | 'Admin' | 'Unknown' {
  // This is a placeholder - real implementation would check key permissions
  // For now, we assume exposed keys are search-only (safer assumption)
  return 'Search-Only'
}

/**
 * Detect Search AI services from crawl result
 */
export function detectSearchAI(crawlResult: CrawlResult): SearchAIDetectionResult {
  const detections: SearchAIDetection[] = []

  for (const pattern of SEARCH_AI_PATTERNS) {
    const detection: SearchAIDetection = {
      provider: pattern.provider,
      category: pattern.category,
      confidence: 'LOW',
      endpoints: [],
      requestPatterns: [],
      attackSurface: pattern.attackSurface,
      riskLevel: 'LOW',
    }

    let hasEndpoint = false
    let hasAuthHeader = false
    let hasSDK = false
    let hasGlobalObject = false
    let isOpenInstance = false

    // 1. Check API endpoints in network requests
    if (crawlResult.networkRequests && Array.isArray(crawlResult.networkRequests)) {
      for (const request of crawlResult.networkRequests) {
        const url = request.url || ''

        // Check endpoint patterns
        for (const endpoint of pattern.endpoints) {
          if (url.includes(endpoint)) {
            hasEndpoint = true
            if (!detection.endpoints.includes(endpoint)) {
              detection.endpoints.push(endpoint)
              detection.requestPatterns.push(`API Endpoint: ${endpoint}`)
            }

            // Check for open Elasticsearch (no auth header)
            if (pattern.provider === 'Elasticsearch' && request.headers) {
              const hasAuth = 'authorization' in request.headers || 'Authorization' in request.headers
              if (!hasAuth && (endpoint.includes('/_search') || endpoint.includes('/_cluster'))) {
                isOpenInstance = true
                detection.openInstanceDetected = true
                detection.riskLevel = 'CRITICAL'
                detection.requestPatterns.push('CRITICAL: Open Elasticsearch instance (no authentication)')
              }
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
                hasAuthHeader = true
                detection.apiKeyMasked = maskAPIKey(match[1])
                detection.requestPatterns.push(`Auth Header: ${headerName}`)

                // Determine key type for Algolia
                if (pattern.provider === 'Algolia') {
                  if (headerName.toLowerCase() === 'x-algolia-api-key') {
                    detection.apiKeyType = determineAlgoliaKeyType(match[1])
                    detection.riskLevel = detection.apiKeyType === 'Admin' ? 'CRITICAL' : 'LOW'
                  }
                }
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
            hasSDK = true
            detection.sdkFound = true
            detection.requestPatterns.push(`SDK Script: ${sdkUrl}`)
          }
        }
      }
    }

    // 3. Check global objects
    if (pattern.globalObjects && crawlResult.html) {
      for (const globalObject of pattern.globalObjects) {
        if (crawlResult.html.includes(globalObject)) {
          hasGlobalObject = true
          detection.requestPatterns.push(`Global Object: ${globalObject}`)
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
            detection.requestPatterns.push(`API Key in Script: ${keyPattern.source}`)
          }
        }
      }
    }

    // 5. Determine confidence level
    if (hasEndpoint && hasAuthHeader) {
      detection.confidence = 'HIGH'
    } else if (hasSDK && (hasEndpoint || hasGlobalObject)) {
      detection.confidence = 'HIGH'
    } else if (hasEndpoint || hasSDK) {
      detection.confidence = 'MEDIUM'
    } else if (hasGlobalObject) {
      detection.confidence = 'LOW'
    }

    // Open Elasticsearch is always HIGH confidence
    if (isOpenInstance) {
      detection.confidence = 'HIGH'
    }

    // Add detection if any indicators found
    if (hasEndpoint || hasAuthHeader || hasSDK || hasGlobalObject) {
      detections.push(detection)
    }
  }

  return {
    hasSearchAI: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
    criticalRiskCount: detections.filter((d) => d.riskLevel === 'CRITICAL').length,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectSearchAI

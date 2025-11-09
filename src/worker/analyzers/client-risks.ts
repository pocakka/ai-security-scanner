import { CrawlResult } from '../crawler-mock'
import { ADVANCED_API_KEY_PATTERNS, detectExposedEnvVars, identifyProvider } from './advanced-api-key-patterns'

export interface ClientRisksResult {
  apiKeysFound: APIKeyFinding[]
  findings: ClientRiskFinding[]
  exposedEnvVars?: string[] // NEW: Detected environment variable names
}

export interface APIKeyFinding {
  type: string
  location: 'script' | 'html'
  preview: string
  provider?: string // NEW: Identified provider
  costRisk?: 'extreme' | 'high' | 'medium' // NEW: Cost risk level
}

export interface ClientRiskFinding {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string
  recommendation: string
}

/**
 * Check if a potential API key match is a false positive
 * (e.g., part of an image URL, asset ID, or other non-sensitive context)
 */
function isLikelyFalsePositive(key: string, context: string, provider: string): boolean {
  // 32-hex-char patterns are used by Azure OpenAI, AssemblyAI, and others
  // BUT they're also common in image URLs, asset IDs, etc.
  // Apply filtering for ANY provider with 32-hex patterns
  if (key.length === 32 && /^[a-f0-9]{32}$/i.test(key)) {
    // Check if the key appears in common false positive contexts
    const falsePositivePatterns = [
      /images\.ctfassets\.net\/[^\/]+\/[^\/]+\/[a-f0-9]{32}/i,  // Contentful asset URLs
      /cdn\.[\w-]+\.com\/[^\/]*[a-f0-9]{32}/i,                 // CDN URLs with hex IDs
      /\.(png|jpg|jpeg|gif|webp|svg|ico)\?[^"']*[a-f0-9]{32}/i, // Image URLs with query params
      /\/assets\/[^\/]*[a-f0-9]{32}/i,                          // Asset paths
      /\/static\/[^\/]*[a-f0-9]{32}/i,                          // Static file paths
      /"url":"[^"]*[a-f0-9]{32}/i,                              // JSON URL fields
      /"src":"[^"]*[a-f0-9]{32}/i,                              // JSON src fields
      /"href":"[^"]*[a-f0-9]{32}/i,                             // JSON href fields
      /\.net\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9]{32}/i,   // Generic CDN asset patterns
    ]

    // Check if key appears in any false positive context
    for (const pattern of falsePositivePatterns) {
      if (pattern.test(context)) {
        return true
      }
    }

    // Check if the key is immediately preceded/followed by URL path characters
    const keyIndex = context.indexOf(key)
    if (keyIndex > 0) {
      const before = context.charAt(keyIndex - 1)
      const after = context.charAt(keyIndex + key.length)
      if (before === '/' || after === '/' || after === '.') {
        return true
      }
    }
  }

  return false
}

export function analyzeClientRisks(crawlResult: CrawlResult): ClientRisksResult {
  const result: ClientRisksResult = {
    apiKeysFound: [],
    findings: [],
    exposedEnvVars: [],
  }

  const detectedKeys = new Set<string>() // Prevent duplicates

  // Check all scripts for API keys using ADVANCED patterns
  for (let i = 0; i < crawlResult.scripts.length; i++) {
    const script = crawlResult.scripts[i]

    for (const apiKeyConfig of ADVANCED_API_KEY_PATTERNS) {
      for (const pattern of apiKeyConfig.patterns) {
        const matches = script.matchAll(pattern)
        for (const match of matches) {
          const key = match[0]

          // Skip if already detected
          if (detectedKeys.has(key)) continue

          // Check if this is a false positive (e.g., part of image URL)
          if (isLikelyFalsePositive(key, script, apiKeyConfig.provider)) {
            continue
          }

          detectedKeys.add(key)

          const provider = identifyProvider(key)

          result.apiKeysFound.push({
            type: apiKeyConfig.provider,
            location: 'script',
            preview: `${key.substring(0, 15)}...${key.substring(key.length - 10)}`,
            provider: provider?.provider,
            costRisk: provider?.costRisk,
          })

          result.findings.push({
            type: 'exposed_api_key',
            severity: apiKeyConfig.severity,
            description: apiKeyConfig.description,
            evidence: `Script contains: ${key.substring(0, 25)}...`,
            recommendation: apiKeyConfig.recommendation,
          })
        }
      }
    }
  }

  // Check HTML for API keys (less common but possible)
  for (const apiKeyConfig of ADVANCED_API_KEY_PATTERNS) {
    for (const pattern of apiKeyConfig.patterns) {
      const matches = crawlResult.html.matchAll(pattern)
      for (const match of matches) {
        const key = match[0]

        // Skip if already detected
        if (detectedKeys.has(key)) continue

        // Check if this is a false positive (e.g., part of image URL)
        if (isLikelyFalsePositive(key, crawlResult.html, apiKeyConfig.provider)) {
          continue
        }

        detectedKeys.add(key)

        const provider = identifyProvider(key)

        result.apiKeysFound.push({
          type: apiKeyConfig.provider,
          location: 'html',
          preview: `${key.substring(0, 15)}...${key.substring(key.length - 10)}`,
          provider: provider?.provider,
          costRisk: provider?.costRisk,
        })

        result.findings.push({
          type: 'exposed_api_key_html',
          severity: apiKeyConfig.severity,
          description: `${apiKeyConfig.provider} API key found in HTML source`,
          evidence: key.substring(0, 30) + '...',
          recommendation: apiKeyConfig.recommendation,
        })
      }
    }
  }

  // NEW: Check for exposed environment variable names
  const exposedEnvVars = detectExposedEnvVars(crawlResult.html)
  if (exposedEnvVars.length > 0) {
    result.exposedEnvVars = exposedEnvVars

    result.findings.push({
      type: 'exposed_env_vars',
      severity: 'high',
      description: `${exposedEnvVars.length} environment variable names exposed in client-side code`,
      evidence: exposedEnvVars.join(', '),
      recommendation: 'Remove all environment variable references from client-side code. Use server-side proxy pattern.',
    })
  }

  return result
}

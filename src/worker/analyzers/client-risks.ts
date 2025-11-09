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

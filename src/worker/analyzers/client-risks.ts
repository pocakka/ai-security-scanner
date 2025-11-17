import { CrawlResult } from '../crawler-mock'
import { detectAPIKeys, detectEnvVarExposure } from './api-key-detector-improved'

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
 * DEPRECATED: Using improved detector with entropy checking and better patterns
 * Check if a potential API key match is a false positive
 * (e.g., part of an image URL, asset ID, URL slug, or other non-sensitive context)
 */
function isLikelyFalsePositive(key: string, context: string, provider: string): boolean {
  // ========================================================================
  // OpenAI API Key False Positives
  // ========================================================================
  if (provider === 'OpenAI' && key.startsWith('sk-')) {
    // Check if "sk-" match is part of a URL or article slug
    // Real OpenAI keys: sk-proj-abc123... or sk-1234567890abcdef...
    // False positives: sk-loses-10-billion-after-tesl (URL slug)

    // 1. Check if it's in a URL context (preceded by domain or path)
    const keyIndex = context.indexOf(key)
    if (keyIndex > 0) {
      // Get 100 chars before the match to check context
      const before = context.substring(Math.max(0, keyIndex - 100), keyIndex)

      // Check for URL patterns before the key
      const urlPatterns = [
        /https?:\/\/[^\s"']+$/,          // http://example.com/
        /\/sites\/[^\s"']+$/,            // /sites/author/2025/11/07/
        /\.com\/[^\s"']+$/,              // .com/article/
        /\.net\/[^\s"']+$/,              // .net/path/
        /\/\d{4}\/\d{2}\/\d{2}\/$/,      // /2025/11/07/
        /href="[^"]*$/,                  // href="...
        /url["':\s]+[^"'\s]*$/,          // url: "...
      ]

      for (const pattern of urlPatterns) {
        if (pattern.test(before)) {
          return true // Key is part of a URL
        }
      }

      // Check if surrounded by URL path separators (hyphens)
      const charBefore = context.charAt(keyIndex - 1)
      const charAfter = context.charAt(keyIndex + key.length)

      // If "sk-" is surrounded by hyphens/slashes, it's likely a URL slug
      // Real API keys: sk-proj-ALPHANUMERIC or sk-ALPHANUMERIC (no trailing hyphens)
      // URL slugs: word-sk-word or /sk-loses-10-billion/
      if (charBefore === '-' || charBefore === '/' || charAfter === '-' || charAfter === '/') {
        return true
      }
    }

    // 2. Check if key contains common English words (URL slugs often do)
    // Real OpenAI keys are random: sk-proj-a8f2h3g9... or sk-1a2b3c4d...
    // URL slugs contain words: sk-loses-10-billion-after-tesl
    const commonWords = [
      'loses', 'after', 'tesla', 'billion', 'million', 'approves', 'deal',
      'here', 'what', 'how', 'why', 'when', 'where', 'who', 'about',
      'new', 'old', 'big', 'small', 'best', 'worst', 'top', 'bottom',
      'first', 'last', 'next', 'previous', 'more', 'less',
    ]

    const keyLower = key.toLowerCase()
    for (const word of commonWords) {
      if (keyLower.includes(word)) {
        return true // Key contains English words - likely a URL slug
      }
    }

    // 3. OpenAI keys should be mostly alphanumeric with limited hyphens
    // Real: sk-proj-abc123xyz (2-3 hyphens max)
    // Fake: sk-loses-10-billion-after-tesl (5+ hyphens)
    const hyphenCount = (key.match(/-/g) || []).length
    if (hyphenCount > 3) {
      return true // Too many hyphens - likely a URL slug
    }

    // 4. Real OpenAI keys have specific formats:
    // - sk-proj-[48+ chars] (project key)
    // - sk-[48+ chars] (legacy key)
    // - Flexible pattern for older keys: sk-[20+ chars]
    // BUT: Real keys are BASE64-like (a-zA-Z0-9 only, no repeated hyphens)

    // If key has consecutive hyphens, it's likely fake
    if (key.includes('--')) {
      return true
    }

    // If key has numbers followed by many hyphens (10-billion-after), it's fake
    if (/\d+-[a-z]+-[a-z]+/.test(keyLower)) {
      return true
    }
  }

  // ========================================================================
  // Generic 32-hex patterns (Azure OpenAI, AssemblyAI, MD5 hashes, etc.)
  // ========================================================================
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

  // Check all scripts for API keys using improved detector
  for (let i = 0; i < (crawlResult.scripts || []).length; i++) {
    const script = (crawlResult.scripts || [])[i]

    // Use the new improved detector
    const detectedInScript = detectAPIKeys(script)

    for (const detection of detectedInScript) {
      // Create unique key signature to avoid duplicates
      const keySignature = `${detection.provider}:${detection.key}`

      // Skip if already detected
      if (detectedKeys.has(keySignature)) continue

      detectedKeys.add(keySignature)

      result.apiKeysFound.push({
        type: detection.provider,
        location: 'script',
        preview: detection.key,
        provider: detection.provider,
        costRisk: detection.severity === 'critical' ? 'extreme' :
                  detection.severity === 'high' ? 'high' : 'medium'
      })

      result.findings.push({
        type: 'exposed_api_key',
        severity: detection.severity as any,
        description: detection.description,
        evidence: `Script contains: ${detection.key}`,
        recommendation: detection.recommendation,
      })
    }
  }

  // Check HTML for API keys using improved detector
  const detectedInHTML = detectAPIKeys(crawlResult.html)

  for (const detection of detectedInHTML) {
    // Create unique key signature to avoid duplicates
    const keySignature = `${detection.provider}:${detection.key}`

    // Skip if already detected
    if (detectedKeys.has(keySignature)) continue

    detectedKeys.add(keySignature)

    result.apiKeysFound.push({
      type: detection.provider,
      location: 'html',
      preview: detection.key,
      provider: detection.provider,
      costRisk: detection.severity === 'critical' ? 'extreme' :
                detection.severity === 'high' ? 'high' : 'medium'
    })

    result.findings.push({
      type: 'exposed_api_key_html',
      severity: detection.severity as any,
      description: `${detection.provider} API key found in HTML source`,
      evidence: detection.key,
      recommendation: detection.recommendation,
    })
  }

  // Check for exposed environment variable names using improved detector
  const exposedEnvVars = detectEnvVarExposure(crawlResult.html)
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

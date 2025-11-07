import { CrawlResult } from '../crawler-mock'

export interface ClientRisksResult {
  apiKeysFound: APIKeyFinding[]
  findings: ClientRiskFinding[]
}

export interface APIKeyFinding {
  type: string
  location: 'script' | 'html'
  preview: string
}

export interface ClientRiskFinding {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string
  recommendation: string
}

// API Key patterns
const API_KEY_PATTERNS = [
  { type: 'OpenAI', regex: /sk-[a-zA-Z0-9]{48}/g, severity: 'critical' as const },
  { type: 'OpenAI Project', regex: /sk-proj-[a-zA-Z0-9]{48}/g, severity: 'critical' as const },
  { type: 'Anthropic', regex: /sk-ant-[a-zA-Z0-9\-]{95}/g, severity: 'critical' as const },
  { type: 'Google AI', regex: /AIza[a-zA-Z0-9_\-]{35}/g, severity: 'critical' as const },
  { type: 'Generic Bearer', regex: /Bearer\s+[a-zA-Z0-9\-_]{20,}/g, severity: 'high' as const },
]

export function analyzeClientRisks(crawlResult: CrawlResult): ClientRisksResult {
  const result: ClientRisksResult = {
    apiKeysFound: [],
    findings: [],
  }

  // Check all scripts for API keys
  for (let i = 0; i < crawlResult.scripts.length; i++) {
    const script = crawlResult.scripts[i]

    for (const { type, regex, severity } of API_KEY_PATTERNS) {
      const matches = script.match(regex)
      if (matches) {
        for (const match of matches) {
          const key = match

          result.apiKeysFound.push({
            type,
            location: 'script',
            preview: `${key.substring(0, 15)}...${key.substring(key.length - 10)}`,
          })

          result.findings.push({
            type: 'exposed_api_key',
            severity,
            description: `${type} API key found in client-side JavaScript`,
            evidence: `Script contains: ${match.substring(0, 25)}...`,
            recommendation: 'CRITICAL: Revoke this API key immediately and move authentication to server-side. Never expose API keys in client code.',
          })
        }
      }
    }
  }

  // Check HTML for API keys (less common but possible)
  for (const { type, regex, severity } of API_KEY_PATTERNS) {
    const matches = crawlResult.html.match(regex)
    if (matches) {
      for (const match of matches) {
        const key = match

        result.apiKeysFound.push({
          type,
          location: 'html',
          preview: `${key.substring(0, 15)}...${key.substring(key.length - 10)}`,
        })

        result.findings.push({
          type: 'exposed_api_key_html',
          severity,
          description: `${type} API key found in HTML`,
          evidence: match.substring(0, 30) + '...',
          recommendation: 'CRITICAL: Revoke this API key immediately. API keys should never appear in HTML.',
        })
      }
    }
  }

  return result
}

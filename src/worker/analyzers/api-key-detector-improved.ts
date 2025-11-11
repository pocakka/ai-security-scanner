/**
 * Improved API Key Detector with Context-Aware Detection
 * Based on comprehensive research from Claude, ChatGPT, and Gemini analysis
 *
 * Key improvements:
 * 1. More specific regex patterns with proper prefixes
 * 2. Context-aware detection to reduce false positives
 * 3. Entropy checking for generic patterns
 * 4. Exclusion of common false positive patterns
 */

export interface APIKeyPattern {
  provider: string
  patterns: RegExp[]
  severity: 'critical' | 'high' | 'medium'
  costRisk: 'extreme' | 'high' | 'medium'
  description: string
  recommendation: string
  requiresContext?: boolean
  contextKeywords?: string[]
}

/**
 * Calculate Shannon entropy of a string to detect random-looking keys
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0

  const frequencies: Record<string, number> = {}
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1
  }

  let entropy = 0
  const len = str.length
  for (const char in frequencies) {
    const p = frequencies[char] / len
    entropy -= p * Math.log2(p)
  }

  return entropy
}

/**
 * Check if a string looks like a webpack chunk or build artifact
 */
export function isWebpackChunk(str: string): boolean {
  // Common webpack/build patterns to exclude
  const webpackPatterns = [
    /^vendors-node_modules_/,
    /^node_modules_/,
    /_esm_browser/,
    /\.(chunk|bundle|min)\./,
    /-[a-f0-9]{8}\.(js|css)$/,
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}/, // UUID-like but not a key
  ]

  return webpackPatterns.some(pattern => pattern.test(str))
}

/**
 * Check if context contains relevant keywords
 */
export function hasRelevantContext(text: string, keywords: string[], position: number): boolean {
  // Check within 100 characters before and after
  const contextStart = Math.max(0, position - 100)
  const contextEnd = Math.min(text.length, position + 100)
  const context = text.substring(contextStart, contextEnd).toLowerCase()

  return keywords.some(keyword => context.includes(keyword.toLowerCase()))
}

/**
 * High-confidence API key patterns based on Claude's comprehensive research
 * These patterns have distinctive prefixes and formats
 */
export const HIGH_CONFIDENCE_PATTERNS: APIKeyPattern[] = [
  // ========== TIER 1: EXCELLENT DETECTION (Fixed length, unique prefix) ==========
  {
    provider: 'Google AI (Gemini/PaLM)',
    patterns: [
      /\bAIza[A-Za-z0-9_-]{35}\b/g, // Fixed 39 chars
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Google AI/Gemini API key detected',
    recommendation: 'Restrict API key in Google Cloud Console. Use application restrictions.',
  },
  {
    provider: 'Cohere',
    patterns: [
      /\bco_[a-zA-Z0-9]{48}\b/g, // Fixed 51 chars
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Cohere API key detected',
    recommendation: 'Rotate key from Cohere dashboard. Implement server-side API calls.',
  },
  {
    provider: 'Replicate',
    patterns: [
      /\br8_[A-Za-z0-9]{37}\b/g, // Fixed 40 chars total
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Replicate API token exposed',
    recommendation: 'Revoke and create new token. Replicate auto-revokes exposed tokens on GitHub.',
  },
  {
    provider: 'Databricks',
    patterns: [
      /\bdapi[a-f0-9]{32}\b/g, // Fixed 36 chars, hex only
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Databricks API token detected',
    recommendation: 'Revoke token immediately from Databricks workspace settings.',
  },
  {
    provider: 'Anyscale',
    patterns: [
      /\besecret_[a-zA-Z0-9]{20,40}\b/g,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Anyscale API key detected',
    recommendation: 'Regenerate key from Anyscale dashboard.',
  },
  {
    provider: 'Perplexity AI',
    patterns: [
      /\bpplx-[a-z0-9]{16,32}\b/g, // Lowercase only after prefix
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Perplexity AI API key detected',
    recommendation: 'Rotate key from Perplexity settings.',
  },

  // ========== TIER 2: VERY GOOD DETECTION (Variable length but unique prefix) ==========
  {
    provider: 'OpenAI',
    patterns: [
      /\bsk-proj-[A-Za-z0-9_-]{20,200}\b/g, // Current project keys (156-164+ chars)
      /\bsk-[A-Za-z0-9]{48}\b/g,           // Legacy keys (exactly 48 chars after sk-)
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'OpenAI API key detected. Immediate cost explosion risk.',
    recommendation: 'Revoke key immediately at platform.openai.com/api-keys',
  },
  {
    provider: 'Anthropic Claude',
    patterns: [
      /\bsk-ant-api\d{2}-[A-Za-z0-9_-]{80,120}\b/g, // Current format
      /\bsk-ant-[A-Za-z0-9_-]{40,150}\b/g,         // Flexible for future versions
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Anthropic Claude API key exposed',
    recommendation: 'Revoke key immediately from Anthropic Console.',
  },
  {
    provider: 'Hugging Face',
    patterns: [
      /\bhf_[A-Za-z0-9]{34}\b/g, // Current generation
      /\bhf_[A-Za-z0-9]{40}\b/g, // Legacy format
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Hugging Face API token exposed',
    recommendation: 'Revoke token from Hugging Face settings.',
  },
  {
    provider: 'AWS Bedrock',
    patterns: [
      /\bABSK[A-Za-z0-9+/]{128}\b/g, // Long-term keys (132 chars total)
      /\bbedrock-api-key-[A-Za-z0-9+/]{1000,}\b/g, // Short-term keys
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'AWS Bedrock API key detected',
    recommendation: 'Revoke immediately in AWS Console. Use IAM roles instead.',
  },

  // ========== COMMUNICATION PLATFORMS ==========
  {
    provider: 'Slack',
    patterns: [
      /\bxoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}\b/g, // Bot token
      /\bxoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}\b/g, // User token
      /\bxoxa-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}\b/g, // App token
      /\bxoxs-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}\b/g, // Workspace token
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,10}\/B[A-Z0-9]{8,10}\/[a-zA-Z0-9]{24}/g,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Slack token exposed',
    recommendation: 'Revoke token from Slack App settings immediately.',
  },
  {
    provider: 'Discord',
    patterns: [
      /\b[MN][a-zA-Z0-9_-]{23}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}\b/g, // Bot token
      /discord\.com\/api\/webhooks\/[0-9]{17,19}\/[a-zA-Z0-9_-]{68}/g,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Discord bot/webhook token exposed',
    recommendation: 'Regenerate bot token in Discord Developer Portal.',
  },
  {
    provider: 'Telegram',
    patterns: [
      /\b[0-9]{8,10}:[a-zA-Z0-9_-]{35}\b/g, // Bot token format
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Telegram bot token exposed',
    recommendation: 'Generate new bot token from @BotFather.',
  },

  // ========== EMAIL & PAYMENT SERVICES ==========
  {
    provider: 'SendGrid',
    patterns: [
      /\bSG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}\b/g,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'SendGrid API key exposed',
    recommendation: 'Revoke key from SendGrid dashboard.',
  },
  {
    provider: 'Stripe',
    patterns: [
      /\bsk_live_[a-zA-Z0-9]{99}\b/g, // Live secret key
      /\bsk_test_[a-zA-Z0-9]{99}\b/g, // Test secret key
      /\brk_live_[a-zA-Z0-9]{99}\b/g, // Restricted key
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Stripe secret key exposed. Payment processing at risk.',
    recommendation: 'Roll key immediately in Stripe Dashboard. Audit recent charges.',
  },
  {
    provider: 'Twilio',
    patterns: [
      /\bAC[a-z0-9]{32}\b/gi, // Account SID
      /\bSK[a-z0-9]{32}\b/gi, // Auth token
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Twilio credentials exposed',
    recommendation: 'Rotate auth token immediately from Twilio Console.',
  },

  // ========== AUTHENTICATION & SECRETS ==========
  {
    provider: 'JWT Secret',
    patterns: [
      /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, // Hardcoded JWT
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Hardcoded JWT token detected',
    recommendation: 'Rotate JWT secret and invalidate all existing tokens.',
  },
  {
    provider: 'SSH Private Key',
    patterns: [
      /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{100,}?-----END (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'SSH private key exposed',
    recommendation: 'Revoke key immediately and audit server access logs.',
  },
]

/**
 * Context-required patterns (need additional validation)
 */
export const CONTEXT_REQUIRED_PATTERNS: APIKeyPattern[] = [
  {
    provider: 'Azure OpenAI',
    patterns: [
      /\b[a-f0-9]{32}\b/g, // 32 hex chars
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Potential Azure OpenAI key detected',
    recommendation: 'Regenerate key in Azure Portal.',
    requiresContext: true,
    contextKeywords: ['azure', 'openai', 'cognitive', 'ocp-apim-subscription-key'],
  },
  {
    provider: 'Firebase',
    patterns: [
      /\bAIza[0-9A-Za-z\-_]{35}\b/g, // Firebase uses same format as Google
    ],
    severity: 'medium',
    costRisk: 'medium',
    description: 'Firebase API key detected',
    recommendation: 'Restrict API key in Firebase Console.',
    requiresContext: true,
    contextKeywords: ['firebase', 'firebaseConfig', 'firebaseapp'],
  },
]

/**
 * Patterns to explicitly exclude (common false positives)
 */
export const EXCLUSION_PATTERNS = [
  // Webpack/build artifacts
  /vendors-node_modules_/,
  /node_modules_[a-z0-9_-]+/,
  /_esm_browser_[a-z0-9_-]+/,
  /\.(chunk|bundle|min)\.[a-f0-9]{8}/,

  // Git/Version control
  /^[a-f0-9]{40}$/, // Git SHA
  /^[a-f0-9]{7,8}$/, // Short Git SHA

  // Common placeholders
  /^(YOUR_API_KEY|your-api-key|xxx+|test123|example|demo|sample|placeholder)$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID

  // CSS/Style hashes
  /^#[a-f0-9]{3,6}$/i, // Hex colors

  // Common test data
  /^0{8,}$/, // All zeros
  /^1{8,}$/, // All ones
  /^(abc|123|test|demo){2,}$/i, // Repeated simple patterns
]

/**
 * Main detection function with improved accuracy
 */
export function detectAPIKeys(text: string): Array<{
  provider: string
  key: string
  severity: string
  description: string
  recommendation: string
  position: number
}> {
  const findings: Array<any> = []
  const foundKeys = new Set<string>() // Deduplicate

  // First, check high-confidence patterns
  for (const pattern of HIGH_CONFIDENCE_PATTERNS) {
    for (const regex of pattern.patterns) {
      let match
      regex.lastIndex = 0 // Reset regex

      while ((match = regex.exec(text)) !== null) {
        const key = match[0]

        // Skip if already found
        if (foundKeys.has(key)) continue

        // Skip if matches exclusion pattern
        if (EXCLUSION_PATTERNS.some(excl => excl.test(key))) continue

        // Skip if looks like webpack chunk
        if (isWebpackChunk(key)) continue

        // For very short patterns, check entropy
        if (key.length < 20) {
          const entropy = calculateEntropy(key)
          if (entropy < 3.0) continue // Too low entropy for a real key
        }

        foundKeys.add(key)
        findings.push({
          provider: pattern.provider,
          key: key.substring(0, 20) + '...',
          severity: pattern.severity,
          description: pattern.description,
          recommendation: pattern.recommendation,
          position: match.index,
        })
      }
    }
  }

  // Then check context-required patterns
  for (const pattern of CONTEXT_REQUIRED_PATTERNS) {
    if (!pattern.requiresContext || !pattern.contextKeywords) continue

    for (const regex of pattern.patterns) {
      let match
      regex.lastIndex = 0

      while ((match = regex.exec(text)) !== null) {
        const key = match[0]

        // Skip if already found
        if (foundKeys.has(key)) continue

        // Skip if matches exclusion pattern
        if (EXCLUSION_PATTERNS.some(excl => excl.test(key))) continue

        // Check entropy for generic patterns
        const entropy = calculateEntropy(key)
        if (entropy < 3.5) continue // Need higher entropy for generic patterns

        // Check context
        if (!hasRelevantContext(text, pattern.contextKeywords, match.index)) continue

        foundKeys.add(key)
        findings.push({
          provider: pattern.provider,
          key: key.substring(0, 20) + '...',
          severity: pattern.severity,
          description: pattern.description,
          recommendation: pattern.recommendation,
          position: match.index,
        })
      }
    }
  }

  return findings
}

/**
 * Quick check for environment variable patterns
 */
export function detectEnvVarExposure(text: string): string[] {
  const envPatterns = [
    /(?:OPENAI|ANTHROPIC|GEMINI|AZURE|AWS|GOOGLE)_API_KEY/gi,
    /(?:SLACK|DISCORD|TELEGRAM)_(?:BOT_)?TOKEN/gi,
    /(?:STRIPE|PAYPAL)_SECRET_KEY/gi,
    /(?:SENDGRID|MAILGUN|TWILIO)_API_KEY/gi,
    /DATABASE_URL|MONGODB_URI|REDIS_URL/gi,
    /JWT_SECRET|SESSION_SECRET/gi,
  ]

  const exposed: string[] = []
  for (const pattern of envPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      exposed.push(...matches)
    }
  }

  return [...new Set(exposed)]
}
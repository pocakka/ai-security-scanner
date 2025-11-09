/**
 * Advanced API Key Patterns for AI Services
 *
 * Comprehensive collection of API key patterns for detection of exposed
 * credentials in client-side code, HTML, headers, and configuration files.
 *
 * CRITICAL SECURITY RISK: Exposed API keys can lead to:
 * - Unlimited cost exposure ($$$)
 * - Data breaches
 * - Service abuse
 * - Compliance violations
 */

export interface APIKeyPattern {
  provider: string
  patterns: RegExp[]
  severity: 'critical' | 'high'
  costRisk: 'extreme' | 'high' | 'medium'
  description: string
  recommendation: string
}

export const ADVANCED_API_KEY_PATTERNS: APIKeyPattern[] = [
  // ========================================================================
  // MAJOR AI PROVIDERS (Extreme Cost Risk)
  // ========================================================================
  {
    provider: 'OpenAI',
    patterns: [
      /sk-[a-zA-Z0-9]{48}/g,           // Standard API key
      /sk-proj-[a-zA-Z0-9]{48,}/g,     // Project-scoped key
      /sk-[a-zA-Z0-9-_]{20,}/g,        // Flexible pattern
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'OpenAI API key detected. Immediate cost explosion risk.',
    recommendation: 'Move API key to server-side environment variables immediately. Revoke and rotate key.',
  },
  {
    provider: 'Anthropic Claude',
    patterns: [
      /sk-ant-api[0-9]{2}-[a-zA-Z0-9_-]{93}/g,  // New format
      /sk-ant-[a-zA-Z0-9]{95}/g,                  // Legacy format
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Anthropic Claude API key exposed.',
    recommendation: 'Revoke key immediately from Anthropic Console. Use server-side proxy.',
  },
  {
    provider: 'Google AI (Gemini/PaLM)',
    patterns: [
      /AIzaSy[a-zA-Z0-9_-]{33}/g,      // Google AI API key
    ],
    severity: 'critical',
    costRisk: 'high',
    description: 'Google AI API key detected.',
    recommendation: 'Restrict API key to specific IP addresses and domains in Google Cloud Console.',
  },
  {
    provider: 'Azure OpenAI',
    patterns: [
      /[a-f0-9]{32}/g,                  // Azure API key (32 hex chars)
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Azure OpenAI subscription key potentially exposed.',
    recommendation: 'Regenerate key in Azure Portal. Use Azure AD authentication instead.',
  },

  // ========================================================================
  // AI MODEL PROVIDERS
  // ========================================================================
  {
    provider: 'Hugging Face',
    patterns: [
      /hf_[a-zA-Z0-9]{34}/g,            // User access token
      /hf_api_[a-zA-Z0-9]{34}/g,        // API token
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Hugging Face API token exposed.',
    recommendation: 'Revoke token from Hugging Face settings. Use inference endpoints with authentication.',
  },
  {
    provider: 'Cohere',
    patterns: [
      /co-[a-zA-Z0-9]{40}/g,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Cohere API key detected.',
    recommendation: 'Rotate key from Cohere dashboard. Implement server-side API calls.',
  },
  {
    provider: 'Replicate',
    patterns: [
      /r8_[a-zA-Z0-9]{40}/g,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Replicate API token exposed.',
    recommendation: 'Revoke and create new token with limited scope.',
  },
  {
    provider: 'Stability AI',
    patterns: [
      /sk-[a-zA-Z0-9]{32,}/g,           // Similar to OpenAI format
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Stability AI API key detected.',
    recommendation: 'Move to server-side. Implement rate limiting.',
  },
  {
    provider: 'Perplexity AI',
    patterns: [
      /pplx-[a-zA-Z0-9]{32,}/g,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Perplexity AI API key exposed.',
    recommendation: 'Rotate key and use backend proxy.',
  },

  // ========================================================================
  // VOICE/SPEECH AI SERVICES
  // ========================================================================
  {
    provider: 'ElevenLabs',
    patterns: [
      /xi_[a-zA-Z0-9]{32,}/g,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'ElevenLabs API key detected.',
    recommendation: 'Revoke key. Voice synthesis can be expensive with abuse.',
  },
  {
    provider: 'AssemblyAI',
    patterns: [
      /[a-f0-9]{32}/g,                  // Generic 32-char hex
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'AssemblyAI API key potentially exposed.',
    recommendation: 'Verify key usage and move to server-side.',
  },

  // ========================================================================
  // VECTOR DATABASES & RAG
  // ========================================================================
  {
    provider: 'Pinecone',
    patterns: [
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,  // UUID format
      /pc-[a-zA-Z0-9]{32,}/g,           // Pinecone API key
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Pinecone API key or environment exposed.',
    recommendation: 'Regenerate API key. Use backend proxy for vector operations.',
  },
  {
    provider: 'Qdrant',
    patterns: [
      /qdrant_[a-zA-Z0-9]{32,}/g,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Qdrant API key detected.',
    recommendation: 'Rotate key and restrict access by IP.',
  },

  // ========================================================================
  // GENERIC PATTERNS (Low specificity but important)
  // ========================================================================
  {
    provider: 'Generic Bearer Token',
    patterns: [
      /Bearer\s+[a-zA-Z0-9\-._~+\/]+=*/g,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Generic Bearer token found in client-side code.',
    recommendation: 'Remove all authentication tokens from client-side code.',
  },
  {
    provider: 'Generic API Key',
    patterns: [
      /api[_-]?key['"\s:=]+[a-zA-Z0-9]{20,}/gi,
      /apikey['"\s:=]+[a-zA-Z0-9]{20,}/gi,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Generic API key pattern detected.',
    recommendation: 'Review all API keys and move to secure server-side storage.',
  },
]

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Get all API key patterns as a flat array
 */
export function getAllAPIKeyPatterns(): RegExp[] {
  return ADVANCED_API_KEY_PATTERNS.flatMap(p => p.patterns)
}

/**
 * Find which provider a matched key belongs to
 */
export function identifyProvider(key: string): APIKeyPattern | undefined {
  return ADVANCED_API_KEY_PATTERNS.find(pattern =>
    pattern.patterns.some(regex => regex.test(key))
  )
}

/**
 * Calculate risk score based on detected API keys
 */
export function calculateAPIKeyRisk(keys: string[]): number {
  let totalRisk = 0

  keys.forEach(key => {
    const provider = identifyProvider(key)
    if (provider) {
      if (provider.costRisk === 'extreme') totalRisk += 25
      else if (provider.costRisk === 'high') totalRisk += 15
      else if (provider.costRisk === 'medium') totalRisk += 10
    }
  })

  return Math.min(totalRisk, 100) // Cap at 100
}

/**
 * Environment variable patterns (should NEVER be in client-side code)
 */
export const EXPOSED_ENV_PATTERNS = [
  /OPENAI_API_KEY/gi,
  /ANTHROPIC_API_KEY/gi,
  /GOOGLE_AI_API_KEY/gi,
  /GEMINI_API_KEY/gi,
  /AZURE_OPENAI_KEY/gi,
  /HUGGINGFACE_API_TOKEN/gi,
  /COHERE_API_KEY/gi,
  /REPLICATE_API_TOKEN/gi,
  /PINECONE_API_KEY/gi,
  /PINECONE_ENVIRONMENT/gi,
  /ELEVENLABS_API_KEY/gi,
  /LANGCHAIN_API_KEY/gi,
]

/**
 * Check if environment variable names are exposed
 */
export function detectExposedEnvVars(html: string): string[] {
  const exposed: string[] = []

  EXPOSED_ENV_PATTERNS.forEach(pattern => {
    const matches = html.match(pattern)
    if (matches) {
      exposed.push(...matches)
    }
  })

  return [...new Set(exposed)] // Deduplicate
}

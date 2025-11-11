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
  // Azure OpenAI - REMOVED: 32-hex pattern too generic (MD5 hashes, asset IDs, etc.)
  // TODO: Re-add with context-aware detection (Ocp-Apim-Subscription-Key header + 32-hex value)
  // {
  //   provider: 'Azure OpenAI',
  //   patterns: [
  //     /(?<!\/)[a-f0-9]{32}(?![a-zA-Z0-9/])/g,  // TOO GENERIC - matches MD5 hashes
  //   ],
  //   severity: 'high',
  //   costRisk: 'high',
  //   description: 'Azure OpenAI subscription key potentially exposed.',
  //   recommendation: 'Regenerate key in Azure Portal. Use Azure AD authentication instead.',
  // },

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
  // AssemblyAI - REMOVED: 32-hex pattern too generic (MD5 hashes, asset IDs, etc.)
  // TODO: Re-add with context-aware detection (ASSEMBLYAI_API_KEY variable + 32-hex value)
  // {
  //   provider: 'AssemblyAI',
  //   patterns: [
  //     /[a-f0-9]{32}/g,  // TOO GENERIC - matches everything
  //   ],
  //   severity: 'high',
  //   costRisk: 'medium',
  //   description: 'AssemblyAI API key potentially exposed.',
  //   recommendation: 'Verify key usage and move to server-side.',
  // },

  // ========================================================================
  // VECTOR DATABASES & RAG
  // ========================================================================
  {
    provider: 'Pinecone',
    patterns: [
      // REMOVED: UUID pattern - too generic, matches session IDs, database IDs, etc.
      // /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,  // TOO GENERIC
      /pc-[a-zA-Z0-9]{32,}/g,           // Pinecone API key with prefix (GOOD - specific!)
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Pinecone API key exposed.',
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
  // CLOUD PROVIDERS (New additions from IMPLEMENTATION_2_EASY.md)
  // ========================================================================
  {
    provider: 'Azure Storage',
    patterns: [
      /DefaultEndpointsProtocol=https;AccountName=([^;]+);AccountKey=([a-zA-Z0-9+/]{86}==)/g,
      /(\?sv=[\d-]+&s[rst]=[\d\w-]+&se=[\d\w-]+&sp=[\w]+&sig=[a-zA-Z0-9%]+)/g, // SAS token
      /managementcertificate="([a-zA-Z0-9+/]{100,}={0,2})"/gi,
      /Ocp-Apim-Subscription-Key['":\s]+([a-f0-9]{32})/gi,
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Azure Storage/API credentials exposed. Full cloud resource access risk.',
    recommendation: 'Revoke immediately in Azure Portal. Use managed identities instead.',
  },
  {
    provider: 'Cloudflare',
    patterns: [
      /CF_API_KEY['":\s]+([A-Za-z0-9_-]{37})/gi,
      /CF_EMAIL['":\s]+([^\s'"]+@[^\s'"]+)/gi,
      /[A-Za-z0-9_-]{40}/g, // When found near 'cloudflare' context
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Cloudflare API token detected. DNS and CDN control at risk.',
    recommendation: 'Rotate token immediately. Use API tokens with limited scope.',
  },
  {
    provider: 'DigitalOcean',
    patterns: [
      /dop_v1_[a-f0-9]{64}/g,
      /DO_API_TOKEN['":\s]+([a-f0-9]{64})/gi,
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'DigitalOcean access token exposed. Full infrastructure access risk.',
    recommendation: 'Revoke token immediately from DO control panel.',
  },
  {
    provider: 'Heroku',
    patterns: [
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, // When near 'heroku' context
      /HEROKU_API_KEY['":\s]+([a-f0-9-]{36})/gi,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Heroku API key detected. Application deployment at risk.',
    recommendation: 'Regenerate API key from Heroku dashboard.',
  },

  // ========================================================================
  // COMMUNICATION PLATFORMS (New additions)
  // ========================================================================
  {
    provider: 'Slack',
    patterns: [
      /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/g, // Bot token
      /xoxp-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/g, // User token
      /xoxa-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/g, // App token
      /xoxs-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/g, // Workspace token
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,10}\/B[A-Z0-9]{8,10}\/[a-zA-Z0-9]{24}/g,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Slack token exposed. Workspace access and data leak risk.',
    recommendation: 'Revoke token from Slack App settings immediately.',
  },
  {
    provider: 'Discord',
    patterns: [
      /[MN][a-zA-Z0-9_-]{23}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}/g, // Bot token
      /discord\.com\/api\/webhooks\/[0-9]{17,19}\/[a-zA-Z0-9_-]{68}/g, // Webhook
      /[a-zA-Z0-9_-]{24}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27}/g, // OAuth token
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Discord bot/webhook token exposed. Server control at risk.',
    recommendation: 'Regenerate bot token in Discord Developer Portal.',
  },
  {
    provider: 'Telegram',
    patterns: [
      /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g, // Bot token
      /api_id['":\s]+([0-9]{5,7})/gi,
      /api_hash['":\s]+([a-f0-9]{32})/gi,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Telegram bot credentials exposed.',
    recommendation: 'Generate new bot token from @BotFather.',
  },

  // ========================================================================
  // EMAIL SERVICE PROVIDERS (New additions)
  // ========================================================================
  {
    provider: 'SendGrid',
    patterns: [
      /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
      /SENDGRID_API_KEY['":\s]+([a-zA-Z0-9_-]{69})/gi,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'SendGrid API key exposed. Email sending abuse risk.',
    recommendation: 'Revoke key from SendGrid dashboard. Implement IP restrictions.',
  },
  {
    provider: 'Mailgun',
    patterns: [
      /key-[a-f0-9]{32}/g,
      /MAILGUN_API_KEY['":\s]+([a-f0-9-]{35})/gi,
      /pubkey-[a-f0-9]{32}/g,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Mailgun API key detected. Email service abuse risk.',
    recommendation: 'Regenerate key from Mailgun control panel.',
  },
  {
    provider: 'Mailchimp',
    patterns: [
      /[a-f0-9]{32}-us[0-9]{1,2}/g,
      /MAILCHIMP_API_KEY['":\s]+([a-f0-9]{32}-us[0-9]{1,2})/gi,
    ],
    severity: 'high',
    costRisk: 'medium',
    description: 'Mailchimp API key exposed. Marketing data at risk.',
    recommendation: 'Revoke and regenerate API key from Account settings.',
  },
  {
    provider: 'Twilio',
    patterns: [
      /AC[a-z0-9]{32}/gi, // Account SID
      /SK[a-z0-9]{32}/gi, // Auth token
      /TWILIO_AUTH_TOKEN['":\s]+([a-z0-9]{32})/gi,
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Twilio credentials exposed. SMS/Voice abuse and cost explosion risk.',
    recommendation: 'Rotate auth token immediately from Twilio Console.',
  },

  // ========================================================================
  // FIREBASE & BACKEND SERVICES (New additions)
  // ========================================================================
  {
    provider: 'Firebase',
    patterns: [
      /AIza[0-9A-Za-z\-_]{35}/g, // Firebase API key
      /"private_key":\s*"-----BEGIN (?:RSA )?PRIVATE KEY-----[^"]+-----END (?:RSA )?PRIVATE KEY-----"/g,
      /firebase[a-z0-9-]+\.firebaseapp\.com/gi,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'Firebase credentials exposed. Database access at risk.',
    recommendation: 'Restrict API key in Firebase Console. Use security rules.',
  },

  // ========================================================================
  // CRYPTOCURRENCY & FINANCIAL (New additions)
  // ========================================================================
  {
    provider: 'Cryptocurrency Wallets',
    patterns: [
      /5[HJK][1-9A-HJ-NP-Za-km-z]{49,51}/g, // Bitcoin private key
      /0x[a-fA-F0-9]{64}/g, // Ethereum private key (with context)
      /[a-z0-9]{16}/g, // When near 'coinbase' context
      /[A-Za-z0-9]{64}/g, // When near 'binance' context
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Cryptocurrency private key or API detected. FUNDS AT RISK!',
    recommendation: 'Move funds immediately! Never store crypto keys in code.',
  },
  {
    provider: 'Stripe',
    patterns: [
      /sk_live_[a-zA-Z0-9]{99}/g, // Live secret key
      /sk_test_[a-zA-Z0-9]{99}/g, // Test secret key
      /rk_live_[a-zA-Z0-9]{99}/g, // Restricted key
      /pk_live_[a-zA-Z0-9]{99}/g, // Publishable key (less sensitive)
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Stripe secret key exposed. Payment processing at risk.',
    recommendation: 'Roll key immediately in Stripe Dashboard. Audit recent charges.',
  },

  // ========================================================================
  // AUTHENTICATION & SECRETS (New additions)
  // ========================================================================
  {
    provider: 'JWT Secrets',
    patterns: [
      /jwt[_-]?secret['":\s]+['"]([^'"]{16,})['"]>/gi,
      /JWT_SECRET['":\s]+['"]([^'"]{16,})['"]>/gi,
      /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // Hardcoded JWT
    ],
    severity: 'critical',
    costRisk: 'high',
    description: 'JWT secret or token exposed. Authentication bypass risk.',
    recommendation: 'Rotate JWT secret immediately. Invalidate all existing tokens.',
  },
  {
    provider: 'SSH Keys',
    patterns: [
      /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
      /ssh-rsa\s+[A-Za-z0-9+/]+[=]{0,2}/g,
      /sshpass['":\s]+['"]([^'"]+)['"]/gi,
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'SSH private key exposed. Server access compromised.',
    recommendation: 'Revoke key immediately. Audit server access logs.',
  },
  {
    provider: 'OAuth Secrets',
    patterns: [
      /client[_-]?secret['":\s]+['"]([A-Za-z0-9\-_]{32,})['"]/gi,
      /refresh[_-]?token['":\s]+['"]([A-Za-z0-9\-_]{20,})['"]/gi,
      /access[_-]?token['":\s]+['"]([A-Za-z0-9\-_]{20,})['"]/gi,
    ],
    severity: 'high',
    costRisk: 'high',
    description: 'OAuth credentials exposed. Account takeover risk.',
    recommendation: 'Revoke OAuth app and regenerate credentials.',
  },

  // ========================================================================
  // DATABASE CONNECTIONS (Enhanced)
  // ========================================================================
  {
    provider: 'Database Connection Strings',
    patterns: [
      /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^/]+/g,
      /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^/]+/g,
      /mysql:\/\/[^:]+:[^@]+@[^/]+/g,
      /redis:\/\/(?::[^@]+@)?[^/]+/g,
      /Data Source=.*;User Id=.*;Password=.*/gi, // SQL Server
    ],
    severity: 'critical',
    costRisk: 'extreme',
    description: 'Database connection string exposed. Data breach risk.',
    recommendation: 'Rotate database passwords immediately. Use environment variables.',
  },

  // ========================================================================
  // WEBHOOK URLs (New additions)
  // ========================================================================
  {
    provider: 'Webhook URLs',
    patterns: [
      /https?:\/\/[^/]+\/[^?\s]+\?(?:token|key|secret)=([A-Za-z0-9\-_]{16,})/g,
      /https:\/\/hooks\.zapier\.com\/hooks\/catch\/[0-9]+\/[a-z0-9]+/g,
      /https:\/\/maker\.ifttt\.com\/trigger\/[^/]+\/with\/key\/[A-Za-z0-9\-_]+/g,
      /https:\/\/[^/]+\/webhooks\/[A-Za-z0-9\-_]{16,}/g,
    ],
    severity: 'medium',
    costRisk: 'medium',
    description: 'Webhook URL with embedded token exposed.',
    recommendation: 'Regenerate webhook URL. Add request signing verification.',
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
  // AI Providers
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
  // Cloud Providers
  /AZURE_STORAGE_KEY/gi,
  /CF_API_KEY/gi,
  /CLOUDFLARE_API_TOKEN/gi,
  /DO_API_TOKEN/gi,
  /DIGITALOCEAN_ACCESS_TOKEN/gi,
  /HEROKU_API_KEY/gi,
  // Communication
  /SLACK_TOKEN/gi,
  /SLACK_BOT_TOKEN/gi,
  /DISCORD_TOKEN/gi,
  /DISCORD_BOT_TOKEN/gi,
  /TELEGRAM_BOT_TOKEN/gi,
  // Email Services
  /SENDGRID_API_KEY/gi,
  /MAILGUN_API_KEY/gi,
  /MAILCHIMP_API_KEY/gi,
  /TWILIO_AUTH_TOKEN/gi,
  /TWILIO_ACCOUNT_SID/gi,
  // Database
  /DATABASE_URL/gi,
  /MONGODB_URI/gi,
  /POSTGRES_PASSWORD/gi,
  /MYSQL_PASSWORD/gi,
  /REDIS_URL/gi,
  // Payments
  /STRIPE_SECRET_KEY/gi,
  /STRIPE_PUBLISHABLE_KEY/gi,
  // Authentication
  /JWT_SECRET/gi,
  /SESSION_SECRET/gi,
  /REFRESH_TOKEN_SECRET/gi,
  /CLIENT_SECRET/gi,
  // Firebase
  /FIREBASE_API_KEY/gi,
  /FIREBASE_PROJECT_ID/gi,
  /FIREBASE_PRIVATE_KEY/gi,
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

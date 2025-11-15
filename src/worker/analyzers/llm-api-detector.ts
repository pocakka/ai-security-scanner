/**
 * LLM API Detector - Detailed Detection for AI Red Teaming
 *
 * Detects LLM API usage with detailed pattern matching:
 * - API endpoint URLs
 * - Authorization header patterns
 * - API key extraction (with masking)
 * - Request/Response structure analysis
 *
 * Attack Surface: Prompt injection, Model theft, API key exposure, Rate limit bypass
 */

import { CrawlResult } from '../crawler-mock'

export interface LLMAPIDetection {
  provider: string
  category: 'LLM API Provider'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  endpoints: string[]
  apiKeyPattern?: string
  apiKeyFound?: boolean
  apiKeyMasked?: string
  requestPatterns: string[]
  attackSurface: string[]
}

export interface LLMAPIDetectorResult {
  hasLLMAPI: boolean
  detections: LLMAPIDetection[]
  totalAPIsFound: number
}

interface LLMAPIPattern {
  provider: string
  endpoints: string[]
  authHeaderPatterns: RegExp[]
  apiKeyPatterns: RegExp[]
  requestStructureKeywords: string[]
  responseStructureKeywords: string[]
  attackSurface: string[]
}

const LLM_API_PATTERNS: LLMAPIPattern[] = [
  // 1. OpenAI (GPT-3, GPT-4, DALL-E, Whisper, Embeddings)
  {
    provider: 'OpenAI',
    endpoints: [
      'api.openai.com/v1/chat/completions',
      'api.openai.com/v1/completions',
      'api.openai.com/v1/embeddings',
      'api.openai.com/v1/images/generations',
      'api.openai.com/v1/images/edits',
      'api.openai.com/v1/audio/transcriptions',
      'api.openai.com/v1/audio/translations',
      'api.openai.com/v1/models',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{48,})/i,
      /Authorization:\s*Bearer\s+(sk-proj-[a-zA-Z0-9\-_]{40,})/i,
    ],
    apiKeyPatterns: [
      /sk-[a-zA-Z0-9]{48,}/,
      /sk-proj-[a-zA-Z0-9\-_]{40,}/,
    ],
    requestStructureKeywords: ['model', 'messages', 'temperature', 'max_tokens', 'top_p', 'frequency_penalty'],
    responseStructureKeywords: ['choices', 'usage', 'completion_tokens', 'prompt_tokens'],
    attackSurface: [
      'Prompt injection via messages array',
      'Model extraction via API responses',
      'API key exposure in client-side code',
      'Rate limit bypass attempts',
      'Token usage manipulation',
    ],
  },

  // 2. Anthropic (Claude)
  {
    provider: 'Anthropic Claude',
    endpoints: [
      'api.anthropic.com/v1/messages',
      'api.anthropic.com/v1/complete',
      'api.anthropic.com/v1/chat/completions',
    ],
    authHeaderPatterns: [
      /x-api-key:\s*(sk-ant-[a-zA-Z0-9\-_]{40,})/i,
      /anthropic-version:\s*2023-\d{2}-\d{2}/i,
    ],
    apiKeyPatterns: [
      /sk-ant-[a-zA-Z0-9\-_]{40,}/,
    ],
    requestStructureKeywords: ['model', 'messages', 'max_tokens', 'temperature', 'system', 'stop_sequences'],
    responseStructureKeywords: ['content', 'stop_reason', 'usage', 'input_tokens', 'output_tokens'],
    attackSurface: [
      'Constitutional AI bypass attempts',
      'Context stuffing attacks',
      'System prompt manipulation',
      'API key leakage in headers',
    ],
  },

  // 3. Cohere
  {
    provider: 'Cohere',
    endpoints: [
      'api.cohere.ai/v1/generate',
      'api.cohere.ai/v1/embed',
      'api.cohere.ai/v1/classify',
      'api.cohere.ai/v1/summarize',
      'api.cohere.ai/v1/chat',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9]{40,})/i,
      /Cohere-Version:\s*\d{4}-\d{2}-\d{2}/i,
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9]{40,}/,  // Generic but context-aware
    ],
    requestStructureKeywords: ['model', 'prompt', 'max_tokens', 'temperature', 'k', 'p', 'frequency_penalty'],
    responseStructureKeywords: ['generations', 'embeddings', 'classifications', 'summary'],
    attackSurface: [
      'Command injection via prompt',
      'Embeddings manipulation',
      'Classification bias exploitation',
    ],
  },

  // 4. Google Gemini / Generative AI
  {
    provider: 'Google Gemini',
    endpoints: [
      'generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      'generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
      'generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
    ],
    authHeaderPatterns: [
      /X-Goog-Api-Key:\s*([a-zA-Z0-9\-_]{39})/i,
      /key=([a-zA-Z0-9\-_]{39})/i,
    ],
    apiKeyPatterns: [
      /AIza[a-zA-Z0-9\-_]{35}/,  // Google API key pattern
    ],
    requestStructureKeywords: ['contents', 'generationConfig', 'safetySettings', 'temperature', 'maxOutputTokens'],
    responseStructureKeywords: ['candidates', 'content', 'parts', 'finishReason', 'safetyRatings'],
    attackSurface: [
      'Multimodal injection (text + image)',
      'Safety filter bypass',
      'Vision model exploitation',
      'API key exposure in query params',
    ],
  },

  // 5. Hugging Face Inference API
  {
    provider: 'Hugging Face',
    endpoints: [
      'api-inference.huggingface.co/models/',
      'api.huggingface.co/models/',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(hf_[a-zA-Z0-9]{30,})/i,
    ],
    apiKeyPatterns: [
      /hf_[a-zA-Z0-9]{30,}/,
    ],
    requestStructureKeywords: ['inputs', 'parameters', 'options', 'wait_for_model'],
    responseStructureKeywords: ['generated_text', 'score', 'label', 'embeddings'],
    attackSurface: [
      'Model-specific attacks (varies by model)',
      'Open-source model manipulation',
      'Inference endpoint abuse',
      'Hub API key theft',
    ],
  },

  // 6. Replicate
  {
    provider: 'Replicate',
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
    requestStructureKeywords: ['version', 'input', 'webhook', 'stream'],
    responseStructureKeywords: ['output', 'status', 'logs', 'metrics'],
    attackSurface: [
      'Stable Diffusion prompt injection',
      'NSFW filter bypass',
      'Webhook injection',
      'Model version exploitation',
    ],
  },

  // 7. Azure OpenAI
  {
    provider: 'Azure OpenAI',
    endpoints: [
      '.openai.azure.com/openai/deployments/',
      '.openai.azure.com/openai/models/',
    ],
    authHeaderPatterns: [
      /api-key:\s*([a-zA-Z0-9]{32,})/i,
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-_\.]+)/i,  // Azure AD token
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9]{32}/,  // Azure API key (context-aware)
    ],
    requestStructureKeywords: ['messages', 'temperature', 'max_tokens', 'deployment_id'],
    responseStructureKeywords: ['choices', 'usage', 'model', 'created'],
    attackSurface: [
      'Enterprise data leakage',
      'Private endpoint exposure',
      'Azure AD token theft',
      'Deployment name enumeration',
    ],
  },

  // 8. AWS Bedrock
  {
    provider: 'AWS Bedrock',
    endpoints: [
      'bedrock-runtime.us-east-1.amazonaws.com/model/',
      'bedrock-runtime.us-west-2.amazonaws.com/model/',
      'bedrock-runtime.eu-west-1.amazonaws.com/model/',
      'bedrock.amazonaws.com',
    ],
    authHeaderPatterns: [
      /X-Amz-Security-Token:\s*([a-zA-Z0-9\/\+=]+)/i,
      /Authorization:\s*AWS4-HMAC-SHA256/i,
    ],
    apiKeyPatterns: [
      /AKIA[A-Z0-9]{16}/,  // AWS Access Key
    ],
    requestStructureKeywords: ['modelId', 'accept', 'contentType', 'body'],
    responseStructureKeywords: ['completion', 'stop_reason', 'amazon-bedrock-invocationMetrics'],
    attackSurface: [
      'IAM role exploitation',
      'Cross-account access',
      'Model invocation logging bypass',
      'AWS credentials exposure',
    ],
  },

  // 9. Google Vertex AI
  {
    provider: 'Google Vertex AI',
    endpoints: [
      'aiplatform.googleapis.com/v1/projects/',
      '-aiplatform.googleapis.com/v1/projects/',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-_\.]+)/i,  // OAuth 2.0 token
    ],
    apiKeyPatterns: [],  // Uses OAuth, not API keys
    requestStructureKeywords: ['instances', 'parameters', 'endpoint'],
    responseStructureKeywords: ['predictions', 'deployedModelId', 'metadata'],
    attackSurface: [
      'Enterprise ML pipeline exposure',
      'Service account compromise',
      'Endpoint enumeration',
      'Prediction manipulation',
    ],
  },

  // 10. Together AI (P0) - Open-source models
  {
    provider: 'Together AI',
    endpoints: [
      'api.together.xyz/inference',
      'api.together.xyz/v1/chat/completions',
      'api.together.xyz/v1/completions',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-f0-9]{64})/i,  // 64-char hex
    ],
    apiKeyPatterns: [
      /[a-f0-9]{64}/,
    ],
    requestStructureKeywords: ['model', 'prompt', 'messages', 'max_tokens', 'temperature'],
    responseStructureKeywords: ['output', 'choices', 'usage'],
    attackSurface: [
      'Open-source model exploitation',
      'Prompt injection',
      'API key exposure (64-char hex)',
      'Rate limit bypass',
      'Model parameter manipulation',
    ],
  },

  // 11. Perplexity AI (P0) - Search-augmented LLM
  {
    provider: 'Perplexity AI',
    endpoints: [
      'api.perplexity.ai/chat/completions',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(pplx-[a-zA-Z0-9]{40,})/i,
    ],
    apiKeyPatterns: [
      /pplx-[a-zA-Z0-9]{40,}/,
    ],
    requestStructureKeywords: ['model', 'messages', 'temperature', 'max_tokens', 'stream'],
    responseStructureKeywords: ['choices', 'citations', 'usage'],
    attackSurface: [
      'Search-augmented prompt injection',
      'Citation manipulation',
      'Source spoofing',
      'API key exposure (pplx- prefix)',
      'Real-time web data poisoning',
    ],
  },

  // 12. Mistral AI (P0) - European AI
  {
    provider: 'Mistral AI',
    endpoints: [
      'api.mistral.ai/v1/chat/completions',
      'api.mistral.ai/v1/embeddings',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9]{32})/i,
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9]{32}/,  // Generic 32-char key (context-aware)
    ],
    requestStructureKeywords: ['model', 'messages', 'temperature', 'max_tokens', 'safe_mode'],
    responseStructureKeywords: ['choices', 'usage', 'model'],
    attackSurface: [
      'European AI regulation bypass',
      'Prompt injection',
      'Model extraction',
      'API key exposure (32-char)',
      'Safe mode bypass attempts',
    ],
  },

  // 13. Groq (P0) - Ultra-fast inference (LPU)
  {
    provider: 'Groq',
    endpoints: [
      'api.groq.com/openai/v1/chat/completions',
      'api.groq.com/openai/v1/models',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(gsk_[a-zA-Z0-9]{52})/i,
    ],
    apiKeyPatterns: [
      /gsk_[a-zA-Z0-9]{52}/,
    ],
    requestStructureKeywords: ['model', 'messages', 'temperature', 'max_tokens', 'stream'],
    responseStructureKeywords: ['choices', 'usage', 'x_groq'],
    attackSurface: [
      'Ultra-fast inference exploitation',
      'Token manipulation',
      'LPU-specific attacks',
      'API key exposure (gsk_ prefix)',
      'OpenAI compatibility layer abuse',
    ],
  },

  // 14. Anyscale (P1) - Ray-based distributed inference
  {
    provider: 'Anyscale',
    endpoints: [
      'api.endpoints.anyscale.com/v1/',
      'api.endpoints.anyscale.com/v1/chat/completions',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(esecret_[a-zA-Z0-9]{40,})/i,
    ],
    apiKeyPatterns: [
      /esecret_[a-zA-Z0-9]{40,}/,
    ],
    requestStructureKeywords: ['model', 'messages', 'temperature', 'max_tokens'],
    responseStructureKeywords: ['choices', 'usage'],
    attackSurface: [
      'Ray cluster exposure',
      'Distributed inference manipulation',
      'API key exposure (esecret_ prefix)',
      'Prompt injection across distributed nodes',
      'Resource exhaustion via distributed requests',
    ],
  },

  // 15. Fireworks AI (P1) - Production-ready inference platform
  {
    provider: 'Fireworks AI',
    endpoints: [
      'api.fireworks.ai/inference/v1/chat/completions',
      'api.fireworks.ai/inference/v1/completions',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(fw_[a-zA-Z0-9]{40,})/i,
    ],
    apiKeyPatterns: [
      /fw_[a-zA-Z0-9]{40,}/,
    ],
    requestStructureKeywords: ['model', 'messages', 'temperature', 'max_tokens', 'stream'],
    responseStructureKeywords: ['choices', 'usage'],
    attackSurface: [
      'Production-ready model exploitation',
      'LoRA adapter manipulation',
      'API key exposure (fw_ prefix)',
      'Custom model deployment attacks',
      'Fine-tuning data extraction',
    ],
  },
]

/**
 * Mask API key for safe logging (show first 8 chars + last 4 chars)
 */
function maskAPIKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return apiKey.substring(0, 4) + '****'
  }
  return apiKey.substring(0, 8) + '****' + apiKey.substring(apiKey.length - 4)
}

/**
 * Detect LLM API usage from crawl result
 */
export function detectLLMAPIs(crawlResult: CrawlResult): LLMAPIDetectorResult {
  const detections: LLMAPIDetection[] = []
  const detectedProviders = new Set<string>()

  // Check network requests for API endpoints
  for (const request of crawlResult.networkRequests) {
    const url = request.url.toLowerCase()

    for (const pattern of LLM_API_PATTERNS) {
      // Check if URL matches any endpoint
      const matchedEndpoint = pattern.endpoints.find(endpoint =>
        url.includes(endpoint.toLowerCase())
      )

      if (matchedEndpoint) {
        // Avoid duplicate detections for same provider
        if (detectedProviders.has(pattern.provider)) {
          continue
        }

        const detection: LLMAPIDetection = {
          provider: pattern.provider,
          category: 'LLM API Provider',
          confidence: 'HIGH',
          endpoints: [matchedEndpoint],
          requestPatterns: pattern.requestStructureKeywords,
          attackSurface: pattern.attackSurface,
        }

        // Try to extract API key from headers (if available in crawl result)
        // Note: In real crawl, headers might not be fully captured
        let apiKeyFound = false
        let apiKeyMasked = undefined

        // Check in HTML/JS for exposed API keys
        const allContent = crawlResult.html + ' ' + crawlResult.scripts.join(' ')

        for (const apiKeyPattern of pattern.apiKeyPatterns) {
          const match = allContent.match(apiKeyPattern)
          if (match) {
            apiKeyFound = true
            apiKeyMasked = maskAPIKey(match[0])
            detection.apiKeyPattern = apiKeyPattern.toString()
            detection.apiKeyFound = true
            detection.apiKeyMasked = apiKeyMasked
            detection.confidence = 'HIGH'  // API key found = very high confidence
            break
          }
        }

        // Check for auth header patterns in script content
        if (!apiKeyFound) {
          for (const authPattern of pattern.authHeaderPatterns) {
            const match = allContent.match(authPattern)
            if (match && match[1]) {
              apiKeyFound = true
              apiKeyMasked = maskAPIKey(match[1])
              detection.apiKeyPattern = authPattern.toString()
              detection.apiKeyFound = true
              detection.apiKeyMasked = apiKeyMasked
              detection.confidence = 'HIGH'
              break
            }
          }
        }

        detections.push(detection)
        detectedProviders.add(pattern.provider)
      }
    }
  }

  // Additional check: Search in scripts for API calls even without network capture
  for (const script of crawlResult.scripts) {
    const scriptLower = script.toLowerCase()

    for (const pattern of LLM_API_PATTERNS) {
      // Skip if already detected via network
      if (detectedProviders.has(pattern.provider)) {
        continue
      }

      // Check if script contains API endpoint references
      const hasEndpoint = pattern.endpoints.some(endpoint =>
        scriptLower.includes(endpoint.toLowerCase())
      )

      if (hasEndpoint) {
        const detection: LLMAPIDetection = {
          provider: pattern.provider,
          category: 'LLM API Provider',
          confidence: 'MEDIUM',  // Lower confidence (script reference, not actual call)
          endpoints: pattern.endpoints.filter(e => scriptLower.includes(e.toLowerCase())),
          requestPatterns: pattern.requestStructureKeywords,
          attackSurface: pattern.attackSurface,
        }

        // Try to find API key in script
        for (const apiKeyPattern of pattern.apiKeyPatterns) {
          const match = script.match(apiKeyPattern)
          if (match) {
            detection.apiKeyFound = true
            detection.apiKeyMasked = maskAPIKey(match[0])
            detection.apiKeyPattern = apiKeyPattern.toString()
            detection.confidence = 'HIGH'  // Upgrade to high if key found
            break
          }
        }

        detections.push(detection)
        detectedProviders.add(pattern.provider)
      }
    }
  }

  return {
    hasLLMAPI: detections.length > 0,
    detections,
    totalAPIsFound: detections.length,
  }
}

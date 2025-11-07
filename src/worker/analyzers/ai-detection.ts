import { CrawlResult } from '../crawler-mock'

export interface AIDetectionResult {
  hasAI: boolean
  providers: string[]
  chatWidgets: string[]
  apiEndpoints: string[]
  jsLibraries: string[]
}

const AI_PROVIDERS = {
  // Existing providers (5)
  'OpenAI': ['openai.com', 'api.openai.com'],
  'Anthropic Claude': ['anthropic.com', 'api.anthropic.com'],
  'Google Gemini': ['googleapis.com', 'generativelanguage.googleapis.com', 'gemini'],
  'Cohere': ['cohere.ai', 'api.cohere.ai'],
  'HuggingFace': ['huggingface.co', 'api-inference.huggingface.co'],

  // New providers (6+)
  'Azure OpenAI': ['openai.azure.com', 'azure.com/openai'],
  'AWS Bedrock': ['bedrock-runtime', 'bedrock.', 'amazonaws.com/bedrock'],
  'Google Vertex AI': ['aiplatform.googleapis.com', 'vertex', 'vertexai'],
  'Stability AI': ['stability.ai', 'api.stability.ai', 'dreamstudio'],
  'Replicate': ['replicate.com', 'api.replicate.com'],
  'ElevenLabs': ['elevenlabs.io', 'api.elevenlabs.io'],
}

const CHAT_WIDGETS = {
  intercom: ['intercom', 'intercom.io'],
  drift: ['drift', 'drift.com'],
  crisp: ['crisp.chat'],
  tawk: ['tawk.to'],
  zendesk: ['zendesk'],
}

const AI_ENDPOINTS = [
  // OpenAI-style endpoints
  '/api/chat',
  '/api/ai',
  '/v1/chat',
  '/v1/completions',
  '/v1/embeddings',
  '/v1/images',
  '/completions',
  '/generate',

  // Anthropic-style
  '/v1/messages',
  '/v1/complete',

  // Generic AI patterns
  '/ai/generate',
  '/ai/chat',
  '/llm/',
  '/gpt',
  '/assistant',
  '/inference',
]

const AI_JS_LIBRARIES = [
  // Core AI SDKs
  'openai',
  'anthropic',
  '@anthropic-ai',
  '@azure/openai',
  '@aws-sdk/client-bedrock',
  '@google-cloud/aiplatform',
  '@google/generative-ai',
  'cohere-ai',
  '@huggingface/inference',
  'replicate',

  // AI Frameworks
  'langchain',
  '@langchain',
  'llamaindex',
  'llama-index',
  'transformers',
  '@xenova/transformers',

  // AI SDKs & Tools
  'ai-sdk',
  '@ai-sdk',
  'vercel-ai',
  '@vercel/ai',
  'gpt-3-encoder',
  'tiktoken',

  // Chatbot libraries
  'chatbot',
  'chat-widget',
  'rasa',
  'botpress',
]

export function analyzeAIDetection(crawlResult: CrawlResult): AIDetectionResult {
  const result: AIDetectionResult = {
    hasAI: false,
    providers: [],
    chatWidgets: [],
    apiEndpoints: [],
    jsLibraries: [],
  }

  // Check network requests for AI providers
  for (const request of crawlResult.networkRequests) {
    const url = request.url.toLowerCase()

    // Check AI providers
    for (const [provider, domains] of Object.entries(AI_PROVIDERS)) {
      if (domains.some(domain => url.includes(domain))) {
        if (!result.providers.includes(provider)) {
          result.providers.push(provider)
          result.hasAI = true
        }
      }
    }

    // Check chat widgets
    for (const [widget, patterns] of Object.entries(CHAT_WIDGETS)) {
      if (patterns.some(pattern => url.includes(pattern))) {
        if (!result.chatWidgets.includes(widget)) {
          result.chatWidgets.push(widget)
          result.hasAI = true
        }
      }
    }

    // Check AI endpoints
    for (const endpoint of AI_ENDPOINTS) {
      if (url.includes(endpoint)) {
        if (!result.apiEndpoints.includes(request.url)) {
          result.apiEndpoints.push(request.url)
          result.hasAI = true
        }
      }
    }
  }

  // Check JavaScript for AI libraries
  for (const script of crawlResult.scripts) {
    const scriptLower = script.toLowerCase()
    for (const lib of AI_JS_LIBRARIES) {
      if (scriptLower.includes(lib)) {
        if (!result.jsLibraries.includes(lib)) {
          result.jsLibraries.push(lib)
          result.hasAI = true
        }
      }
    }
  }

  // Check HTML for chat widgets in DOM
  const htmlLower = crawlResult.html.toLowerCase()
  for (const [widget, patterns] of Object.entries(CHAT_WIDGETS)) {
    if (patterns.some(pattern => htmlLower.includes(pattern))) {
      if (!result.chatWidgets.includes(widget)) {
        result.chatWidgets.push(widget)
        result.hasAI = true
      }
    }
  }

  return result
}

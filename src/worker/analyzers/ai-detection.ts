import { CrawlResult } from '../crawler-mock'

export interface AIDetectionResult {
  hasAI: boolean
  providers: string[]
  chatWidgets: string[]
  apiEndpoints: string[]
  jsLibraries: string[]
}

const AI_PROVIDERS = {
  openai: ['openai.com', 'api.openai.com'],
  anthropic: ['anthropic.com', 'api.anthropic.com'],
  google: ['googleapis.com', 'generativelanguage.googleapis.com', 'gemini'],
  cohere: ['cohere.ai', 'api.cohere.ai'],
  huggingface: ['huggingface.co'],
}

const CHAT_WIDGETS = {
  intercom: ['intercom', 'intercom.io'],
  drift: ['drift', 'drift.com'],
  crisp: ['crisp.chat'],
  tawk: ['tawk.to'],
  zendesk: ['zendesk'],
}

const AI_ENDPOINTS = [
  '/api/chat',
  '/api/ai',
  '/v1/chat',
  '/v1/completions',
  '/completions',
  '/generate',
]

const AI_JS_LIBRARIES = [
  'openai',
  'anthropic',
  '@anthropic-ai',
  'langchain',
  'llamaindex',
  'transformers',
  'huggingface',
  'ai-sdk',
  'chatbot',
  'chat-widget',
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

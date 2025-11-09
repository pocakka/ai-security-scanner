import { CrawlResult } from '../crawler-mock'
import { ADVANCED_AI_DETECTION_RULES } from './advanced-ai-detection-rules'

export interface AIDetectionResult {
  hasAI: boolean
  providers: string[]
  chatWidgets: string[]
  apiEndpoints: string[]
  jsLibraries: string[]
  // NEW: Advanced categories
  vectorDatabases?: string[]
  mlFrameworks?: string[]
  voiceServices?: string[]
  imageServices?: string[]
  securityTools?: string[]
  detailedFindings?: AIDetailedFinding[]
}

export interface AIDetailedFinding {
  name: string
  category: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  description: string
  evidence: string[]
}

const AI_PROVIDERS = {
  // Existing providers (5)
  'OpenAI': ['openai.com', 'api.openai.com', 'chatgpt.com'],
  'Anthropic Claude': ['anthropic.com', 'api.anthropic.com', 'claude.ai'],
  'Google Gemini': ['generativelanguage.googleapis.com', 'gemini.google.com', 'bard.google.com'], // FIXED: Removed generic googleapis.com
  'Cohere': ['cohere.ai', 'api.cohere.ai', 'cohere.com'],
  'HuggingFace': ['huggingface.co', 'api-inference.huggingface.co', 'hf.co'],

  // New providers (6+)
  'Azure OpenAI': ['openai.azure.com', 'azure.com/openai'],
  'AWS Bedrock': ['bedrock-runtime', 'bedrock.', 'amazonaws.com/bedrock'],
  'Google Vertex AI': ['aiplatform.googleapis.com', 'vertex', 'vertexai'],
  'Stability AI': ['stability.ai', 'api.stability.ai', 'dreamstudio'],
  'Replicate': ['replicate.com', 'api.replicate.com'],
  'ElevenLabs': ['elevenlabs.io', 'api.elevenlabs.io'],

  // Custom/Business AI tools
  'GPT4Business (YoloAI)': ['gpt4business.yoloai.com', 'app.gpt4business'],
}

const CHAT_WIDGETS = {
  intercom: ['intercom', 'intercom.io'],
  drift: ['drift', 'drift.com'],
  crisp: ['crisp.chat'],
  tawk: ['tawk.to'],
  zendesk: ['zendesk'],
}

// DOM-based AI detection patterns (HTML/JS code snippets)
// Add patterns like: window.__oai_logHTML, specific script sources, etc.
const AI_DOM_PATTERNS = {
  'OpenAI ChatGPT': ['window.__oai_loghtml', '__oai_', 'chatgpt-web'],
  'GPT4Business (YoloAI)': ['app.gpt4business.yoloai.com', 'gpt4business'],
  'Anthropic Claude': ['claude-web', 'anthropic-web'],
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

  // Check HTML/JS for AI DOM patterns (window.__oai_, specific script tags, etc.)
  for (const [provider, patterns] of Object.entries(AI_DOM_PATTERNS)) {
    if (patterns.some(pattern => htmlLower.includes(pattern.toLowerCase()))) {
      if (!result.providers.includes(provider)) {
        result.providers.push(provider)
        result.hasAI = true
      }
    }
  }

  // NEW: Advanced AI detection using comprehensive rules
  result.vectorDatabases = []
  result.mlFrameworks = []
  result.voiceServices = []
  result.imageServices = []
  result.securityTools = []
  result.detailedFindings = []

  for (const rule of ADVANCED_AI_DETECTION_RULES) {
    let detected = false
    const evidence: string[] = []

    for (const pattern of rule.patterns) {
      // Check scripts
      if (pattern.type === 'script') {
        for (const script of crawlResult.scripts) {
          if (pattern.match.test(script)) {
            detected = true
            evidence.push(`Script: ${script.substring(0, 100)}...`)
            break
          }
        }
      }

      // Check HTML
      if (pattern.type === 'html' && pattern.match.test(crawlResult.html)) {
        detected = true
        evidence.push(`HTML contains pattern: ${pattern.description || 'match found'}`)
      }

      // Check network requests
      if (pattern.type === 'api-endpoint') {
        for (const req of crawlResult.networkRequests) {
          if (pattern.match.test(req.url)) {
            detected = true
            evidence.push(`API endpoint: ${req.url}`)
            break
          }
        }
      }

      // Check headers
      if (pattern.type === 'header' && crawlResult.responseHeaders) {
        for (const [key, value] of Object.entries(crawlResult.responseHeaders)) {
          if (pattern.match.test(`${key}: ${value}`)) {
            detected = true
            evidence.push(`Header: ${key}`)
            break
          }
        }
      }
    }

    if (detected) {
      result.hasAI = true

      // Categorize by type
      if (rule.category === 'Vector Database') {
        result.vectorDatabases.push(rule.name)
      } else if (rule.category === 'Client-side ML Framework') {
        result.mlFrameworks.push(rule.name)
      } else if (rule.category === 'Voice/Speech AI') {
        result.voiceServices.push(rule.name)
      } else if (rule.category.includes('Image')) {
        result.imageServices.push(rule.name)
      } else if (rule.category.includes('Security') || rule.category.includes('Monitoring')) {
        result.securityTools.push(rule.name)
      } else if (rule.category === 'AI API Provider' || rule.category === 'AI Development Framework') {
        // Add to providers if not already there
        if (!result.providers.includes(rule.name)) {
          result.providers.push(rule.name)
        }
      }

      // Add detailed finding
      result.detailedFindings.push({
        name: rule.name,
        category: rule.category,
        riskLevel: rule.riskLevel,
        description: rule.description,
        evidence: evidence.slice(0, 3), // Limit to 3 evidence items
      })
    }
  }

  return result
}

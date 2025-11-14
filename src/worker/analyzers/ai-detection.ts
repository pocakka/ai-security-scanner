import { CrawlResult } from '../crawler-mock'
import { ADVANCED_AI_DETECTION_RULES } from './advanced-ai-detection-rules'
import { detectLLMAPIs, LLMAPIDetection } from './llm-api-detector'

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
  // NEW: LLM API detections
  llmAPIs?: LLMAPIDetection[]
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

// EXPANDED: Top 30 AI Chat Widgets with multi-pattern detection
// Each widget has: scriptUrls (high confidence), globalObjects (medium), domSelectors (lower)
interface ChatWidgetPattern {
  scriptUrls: string[]
  globalObjects: string[]
  domSelectors: string[]
}

const EXPANDED_CHAT_WIDGETS: Record<string, ChatWidgetPattern> = {
  // Tier 1: Market Leaders (10 services)
  'Intercom': {
    scriptUrls: ['widget.intercom.io/widget/', 'js.intercomcdn.com'],
    globalObjects: ['window.Intercom', 'window.intercomSettings'],
    domSelectors: ['#intercom-container', '.intercom-messenger-frame'],
  },
  'Drift': {
    scriptUrls: ['js.driftt.com/include/', 'js.drift.com'],
    globalObjects: ['window.drift', 'window.driftApi'],
    domSelectors: ['#drift-widget-container', '#drift-frame-controller'],
  },
  'Zendesk Chat': {
    scriptUrls: ['static.zdassets.com/ekr/snippet.js', 'v2.zopim.com'],
    globalObjects: ['window.zE', 'window.$zopim'],
    domSelectors: ['#ze-snippet', '.zopim'],
  },
  'LiveChat': {
    scriptUrls: ['cdn.livechatinc.com/tracking.js', 'cdn.livechat-files.com'],
    globalObjects: ['window.LiveChatWidget', 'window.LC_API'],
    domSelectors: ['#livechat-widget', '.livechat-'],
  },
  'Freshchat': {
    scriptUrls: ['wchat.freshchat.com/js/widget.js', 'snippet.freshchat.com'],
    globalObjects: ['window.fcWidget', 'window.fcSettings'],
    domSelectors: ['.freshchat-', '#fc_frame'],
  },
  'HubSpot Chat': {
    scriptUrls: ['js.hs-scripts.com/', 'js.hubspot.com'],
    globalObjects: ['window.HubSpotConversations', 'window.hsConversationsSettings'],
    domSelectors: ['#hubspot-messages-iframe', '.hs-'],
  },
  'Crisp': {
    scriptUrls: ['client.crisp.chat/l.js', 'client.relay.crisp.chat'],
    globalObjects: ['window.$crisp', 'window.CRISP_'],
    domSelectors: ['.crisp-client', '#crisp-chatbox'],
  },
  'Tidio': {
    scriptUrls: ['code.tidio.co/', 'cdn.tidio.co'],
    globalObjects: ['window.tidioChatApi', 'window.tidioIdentify'],
    domSelectors: ['#tidio-chat', '.tidio-'],
  },
  'Tawk.to': {
    scriptUrls: ['embed.tawk.to/', 'va.tawk.to'],
    globalObjects: ['window.Tawk_API', 'window.Tawk_LoadStart'],
    domSelectors: ['.tawk-widget', '#tawkchat-'],
  },
  'Olark': {
    scriptUrls: ['static.olark.com/jsclient/loader.js'],
    globalObjects: ['window.olark', 'window.olark_'],
    domSelectors: ['#olark-box', '.olark'],
  },

  // Tier 2: Enterprise/SaaS (10 services)
  'Salesforce Live Agent': {
    scriptUrls: ['service.force.com/embeddedservice/', 'c.la'],
    globalObjects: ['window.embedded_svc', 'window.liveagent'],
    domSelectors: ['.embeddedServiceHelpButton', '#liveagent_'],
  },
  'LivePerson': {
    scriptUrls: ['lptag.liveperson.net/tag/tag.js', 'lpcdn.lpsnmedia.net'],
    globalObjects: ['window.lpTag', 'window.LPMcontainer'],
    domSelectors: ['#lpChat', '.LPMcontainer'],
  },
  'Genesys Cloud': {
    scriptUrls: ['apps.mypurecloud.com/webchat/', 'apps.mypurecloud.'],
    globalObjects: ['window.Genesys', 'window.purecloud'],
    domSelectors: ['.cx-widget', '#webchat-'],
  },
  'Help Scout Beacon': {
    scriptUrls: ['beacon-v2.helpscout.net', 'd3hb14vkzrxvla.cloudfront.net'],
    globalObjects: ['window.Beacon', 'window.BeaconAPI'],
    domSelectors: ['#beacon-container', '.BeaconFabButton'],
  },
  'Gorgias': {
    scriptUrls: ['config.gorgias.chat/', 'client.gorgias.chat'],
    globalObjects: ['window.GorgiasChat', 'window.$gorgias'],
    domSelectors: ['.gorgias-chat-', '#gorgias-'],
  },
  'Chatwoot': {
    scriptUrls: ['/packs/js/sdk.js', 'chatwoot.com/packs'],
    globalObjects: ['window.$chatwoot', 'window.chatwootSDK'],
    domSelectors: ['.woot-widget-holder', '#chatwoot_'],
  },
  'Re:amaze': {
    scriptUrls: ['cdn.reamaze.com/assets/reamaze.js'],
    globalObjects: ['window.reamaze', 'window._raSettings'],
    domSelectors: ['#reamaze-widget', '.reamaze-'],
  },
  'Smartsupp': {
    scriptUrls: ['www.smartsuppchat.com/loader.js'],
    globalObjects: ['window.smartsupp', 'window.$smartsupp'],
    domSelectors: ['#chat-application', '.smartsupp-'],
  },
  'JivoChat': {
    scriptUrls: ['code.jivosite.com/widget/', 'code.jivo'],
    globalObjects: ['window.jivo_api', 'window.jivo_config'],
    domSelectors: ['#jivo-iframe-container', '.globalClass_'],
  },
  'Userlike': {
    scriptUrls: ['userlike-cdn-widgets', 'userlike.com/'],
    globalObjects: ['window.userlikeConfig', 'window.userlike_'],
    domSelectors: ['#userlike-widget', '.userlike-'],
  },

  // Tier 3: AI-First / LLM-Based (10 services)
  'Chatbase': {
    scriptUrls: ['www.chatbase.co/embed.min.js', 'cdn.chatbase.co'],
    globalObjects: ['window.chatbase', 'window.embeddedChatbotConfig'],
    domSelectors: ['#chatbase-bubble', '.chatbase-'],
  },
  'Voiceflow': {
    scriptUrls: ['cdn.voiceflow.com/widget/bundle.mjs'],
    globalObjects: ['window.voiceflow.chat', 'window.voiceflow'],
    domSelectors: ['vf-chat', '.vf-'],
  },
  'Botpress': {
    scriptUrls: ['cdn.botpress.cloud/webchat/', 'mediafiles.botpress.cloud'],
    globalObjects: ['window.botpressWebChat', 'window.botpress'],
    domSelectors: ['#bp-web-widget', '.bpWidget'],
  },
  'Dialogflow Messenger': {
    scriptUrls: ['gstatic.com/dialogflow-console/fast/messenger/'],
    globalObjects: ['window.dialogflow', 'window.dfMessenger'],
    domSelectors: ['df-messenger', '.df-messenger'],
  },
  'IBM Watson Assistant': {
    scriptUrls: ['web-chat.global.assistant.watson.appdomain.cloud', 'assistant.watson'],
    globalObjects: ['window.watsonAssistantChatOptions', 'window.WatsonAssistant'],
    domSelectors: ['#WACContainer', '.WAC__'],
  },
  'Microsoft Bot Framework': {
    scriptUrls: ['cdn.botframework.com/botframework-webchat/'],
    globalObjects: ['window.WebChat', 'window.BotChat'],
    domSelectors: ['#webchat', '.webchat'],
  },
  'Ada': {
    scriptUrls: ['static.ada.support/embed2.js'],
    globalObjects: ['window.adaEmbed', 'window.adaSettings'],
    domSelectors: ['#ada-button-frame', '.ada-'],
  },
  'Landbot': {
    scriptUrls: ['cdn.landbot.io/landbot-3/', 'static.landbot.io'],
    globalObjects: ['window.Landbot', 'window.myLandbot'],
    domSelectors: ['#landbot-', '.landbot'],
  },
  'Rasa Webchat': {
    scriptUrls: ['cdn.jsdelivr.net/npm/rasa-webchat/', 'unpkg.com/rasa-webchat'],
    globalObjects: ['window.WebChat', 'window.RasaWebchat'],
    domSelectors: ['.rasa-chat-', '#rasa-'],
  },
  'Amazon Lex': {
    scriptUrls: ['runtime.lex.', '.amazonaws.com/lex'],
    globalObjects: ['window.AWS.LexRuntime', 'window.lexruntime'],
    domSelectors: ['#lex-web-ui', '.lex-'],
  },

  // Additional Popular Widgets (5 services - extending to 35 total)
  'Chatra': {
    scriptUrls: ['call.chatra.io/chatra.js', 'io.chatra.io'],
    globalObjects: ['window.Chatra', 'window.ChatraID'],
    domSelectors: ['.chatra-', '#chatra-'],
  },
  'Pure Chat': {
    scriptUrls: ['app.purechat.com/VisitorWidget/WidgetScript'],
    globalObjects: ['window.purechatApi', 'window.PCWidget'],
    domSelectors: ['.purechat-', '#purechat-'],
  },
  'Zoho SalesIQ': {
    scriptUrls: ['salesiq.zoho.com/widget', 'js.zohocdn.com/salesiq'],
    globalObjects: ['window.$zoho.salesiq', 'window.$zoho.ichat'],
    domSelectors: ['#zsiq_float', '.zsiq'],
  },
  'HelpCrunch': {
    scriptUrls: ['widget.helpcrunch.com/'],
    globalObjects: ['window.HelpCrunch', 'window.helpcrunchSettings'],
    domSelectors: ['.helpcrunch-widget', '#helpcrunch-'],
  },
  'Kommunicate': {
    scriptUrls: ['widget.kommunicate.io/v2/kommunicate.app'],
    globalObjects: ['window.kommunicate', 'window.Kommunicate'],
    domSelectors: ['#kommunicate-widget-iframe', '.kommunicate-'],
  },
}

// Legacy simple pattern mapping (backwards compatibility)
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

// Helper function for multi-pattern chat widget detection with confidence scoring
function detectChatWidget(
  widgetName: string,
  patterns: ChatWidgetPattern,
  crawlResult: CrawlResult
): { detected: boolean; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; matchedPatterns: number } {
  let matchedPatterns = 0
  const htmlLower = crawlResult.html.toLowerCase()
  const networkUrls = crawlResult.networkRequests.map(r => r.url.toLowerCase())
  const allScripts = crawlResult.scripts.map(s => s.toLowerCase())

  // Check script URLs (high confidence)
  const scriptUrlMatch = patterns.scriptUrls.some(pattern =>
    networkUrls.some(url => url.includes(pattern.toLowerCase())) ||
    allScripts.some(script => script.includes(pattern.toLowerCase()))
  )
  if (scriptUrlMatch) matchedPatterns++

  // Check global objects (medium confidence)
  const globalObjectMatch = patterns.globalObjects.some(obj =>
    htmlLower.includes(obj.toLowerCase())
  )
  if (globalObjectMatch) matchedPatterns++

  // Check DOM selectors (lower confidence)
  const domSelectorMatch = patterns.domSelectors.some(selector =>
    htmlLower.includes(selector.toLowerCase())
  )
  if (domSelectorMatch) matchedPatterns++

  // Determine confidence based on number of matches
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
  if (matchedPatterns >= 3) confidence = 'HIGH'
  else if (matchedPatterns >= 2) confidence = 'MEDIUM'
  else if (matchedPatterns >= 1) confidence = 'LOW'

  return {
    detected: matchedPatterns >= 1, // Detect if at least 1 pattern matches
    confidence,
    matchedPatterns,
  }
}

export function analyzeAIDetection(crawlResult: CrawlResult): AIDetectionResult {
  const result: AIDetectionResult = {
    hasAI: false,
    providers: [],
    chatWidgets: [],
    apiEndpoints: [],
    jsLibraries: [],
  }

  // ENHANCED: Check expanded chat widgets (30 services) with confidence scoring
  for (const [widgetName, patterns] of Object.entries(EXPANDED_CHAT_WIDGETS)) {
    const detection = detectChatWidget(widgetName, patterns, crawlResult)

    if (detection.detected) {
      // Only add if not already in list (avoid duplicates)
      const widgetEntry = `${widgetName} (${detection.confidence})`
      if (!result.chatWidgets.some(w => w.startsWith(widgetName))) {
        result.chatWidgets.push(widgetEntry)
        result.hasAI = true
      }
    }
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

    // Legacy: Check old chat widgets (backwards compatibility)
    for (const [widget, patterns] of Object.entries(CHAT_WIDGETS)) {
      if (patterns.some(pattern => url.includes(pattern))) {
        // Only add if not already detected by EXPANDED_CHAT_WIDGETS
        const widgetBaseName = widget.charAt(0).toUpperCase() + widget.slice(1)
        if (!result.chatWidgets.some(w => w.toLowerCase().includes(widget))) {
          result.chatWidgets.push(`${widgetBaseName} (MEDIUM)`)
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

  // Legacy: Check HTML for old chat widgets in DOM (backwards compatibility)
  const htmlLower = crawlResult.html.toLowerCase()
  for (const [widget, patterns] of Object.entries(CHAT_WIDGETS)) {
    if (patterns.some(pattern => htmlLower.includes(pattern))) {
      const widgetBaseName = widget.charAt(0).toUpperCase() + widget.slice(1)
      if (!result.chatWidgets.some(w => w.toLowerCase().includes(widget))) {
        result.chatWidgets.push(`${widgetBaseName} (LOW)`)
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

  // ===== LLM API DETECTION (DETAILED) =====
  const llmAPIResult = detectLLMAPIs(crawlResult)
  if (llmAPIResult.hasLLMAPI) {
    result.hasAI = true
    result.llmAPIs = llmAPIResult.detections

    // Also add to providers list for backwards compatibility
    for (const detection of llmAPIResult.detections) {
      if (!result.providers.includes(detection.provider)) {
        result.providers.push(detection.provider)
      }
    }
  }

  return result
}

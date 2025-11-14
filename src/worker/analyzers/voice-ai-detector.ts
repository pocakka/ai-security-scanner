/**
 * Voice AI Detection Analyzer
 *
 * Detects Voice/Speech AI services (STT, TTS, Voice Cloning)
 * P0 Priority Services: Deepgram, AssemblyAI, ElevenLabs, Google Cloud Speech
 *
 * Detection Methods:
 * - API endpoint monitoring (Playwright network requests)
 * - API key pattern matching in requests/scripts
 * - SDK script URL detection
 * - Request header analysis
 *
 * Created: 2025-11-14
 */

import type { CrawlerResult as CrawlResult } from '@/lib/types/crawler-types'

export interface VoiceAIDetection {
  provider: string
  category: 'Voice AI (STT)' | 'Voice AI (TTS)' | 'Voice AI (STT/TTS)' | 'Voice AI (Voice Cloning)'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  endpoints: string[]
  apiKeyPattern?: string
  apiKeyFound?: boolean
  apiKeyMasked?: string
  sdkFound?: boolean
  requestPatterns: string[]
  attackSurface: string[]
}

export interface VoiceAIDetectionResult {
  hasVoiceAI: boolean
  detections: VoiceAIDetection[]
  totalProviders: number
  highConfidenceCount: number
}

interface VoiceAIPattern {
  provider: string
  category: 'Voice AI (STT)' | 'Voice AI (TTS)' | 'Voice AI (STT/TTS)' | 'Voice AI (Voice Cloning)'
  endpoints: string[]
  sdkUrls?: string[]
  authHeaderPatterns?: RegExp[]
  apiKeyPatterns?: RegExp[]
  attackSurface: string[]
}

// P0 Priority Voice AI Patterns
const VOICE_AI_PATTERNS: VoiceAIPattern[] = [
  // 1. Deepgram (P0) - STT/TTS
  {
    provider: 'Deepgram',
    category: 'Voice AI (STT/TTS)',
    endpoints: [
      'api.deepgram.com/v1/listen',
      'api.deepgram.com/v1/speak',
      'api.deepgram.com/v1/projects',
      'api.deepgram.com/v1/keys',
    ],
    sdkUrls: [
      'cdn.deepgram.com/sdk/',
      'cdn.deepgram.com/deepgram-sdk',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Token\s+([a-f0-9]{40})/i,
    ],
    apiKeyPatterns: [
      /[a-f0-9]{40}/, // 40-char hex token
    ],
    attackSurface: [
      'Audio injection attacks',
      'Transcription manipulation',
      'Voice biometric theft',
      'API key exposure in client-side code',
      'WebSocket hijacking (live streaming)',
      'Model parameter tampering',
      'Language detection bypass',
    ],
  },

  // 2. AssemblyAI (P0) - STT
  {
    provider: 'AssemblyAI',
    category: 'Voice AI (STT)',
    endpoints: [
      'api.assemblyai.com/v2/transcript',
      'api.assemblyai.com/v2/upload',
      'api.assemblyai.com/v2/realtime',
      'api.assemblyai.com/v2/lemur',
    ],
    authHeaderPatterns: [
      /authorization:\s*([a-f0-9]{32})/i,
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/, // 32-char hex key
    ],
    attackSurface: [
      'Audio file manipulation',
      'PII extraction from transcripts',
      'Speaker diarization abuse',
      'Sentiment analysis manipulation',
      'Auto-chapters exploitation',
      'Entity detection abuse',
      'LeMUR (LLM) prompt injection',
    ],
  },

  // 3. ElevenLabs (P0) - TTS/Voice Cloning (HIGH RISK)
  {
    provider: 'ElevenLabs',
    category: 'Voice AI (Voice Cloning)',
    endpoints: [
      'api.elevenlabs.io/v1/text-to-speech',
      'api.elevenlabs.io/v1/voices',
      'api.elevenlabs.io/v1/voice-generation',
      'api.elevenlabs.io/v1/dubbing',
      'api.elevenlabs.io/v1/sound-generation',
    ],
    authHeaderPatterns: [
      /xi-api-key:\s*([a-f0-9]{32})/i,
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/, // 32-char hex key
    ],
    attackSurface: [
      'Voice cloning abuse (deepfakes)',
      'Deepfake audio generation',
      'Voice model theft',
      'TTS manipulation for phishing',
      'Celebrity voice impersonation',
      'Multilingual voice synthesis',
      'Real-time voice conversion',
      'API key exposure (CRITICAL - enables voice cloning)',
    ],
  },

  // 4. Google Cloud Speech-to-Text (P0)
  {
    provider: 'Google Cloud Speech-to-Text',
    category: 'Voice AI (STT)',
    endpoints: [
      'speech.googleapis.com/v1/speech:recognize',
      'speech.googleapis.com/v1/speech:longrunningrecognize',
      'speech.googleapis.com/v1p1beta1/speech:recognize',
    ],
    authHeaderPatterns: [
      /X-Goog-Api-Key:\s*(AIza[a-zA-Z0-9\-_]{35})/i,
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-._~+\/]+=*)/i,
    ],
    apiKeyPatterns: [
      /AIza[a-zA-Z0-9\-_]{35}/, // Google API key
    ],
    attackSurface: [
      'Google Cloud credential exposure',
      'Transcription manipulation',
      'Language model exploitation',
      'Custom model theft',
      'Speaker diarization abuse',
      'Word-level timestamps manipulation',
    ],
  },

  // 5. Google Cloud Text-to-Speech (P1)
  {
    provider: 'Google Cloud Text-to-Speech',
    category: 'Voice AI (TTS)',
    endpoints: [
      'texttospeech.googleapis.com/v1/text:synthesize',
      'texttospeech.googleapis.com/v1beta1/text:synthesize',
    ],
    authHeaderPatterns: [
      /X-Goog-Api-Key:\s*(AIza[a-zA-Z0-9\-_]{35})/i,
    ],
    apiKeyPatterns: [
      /AIza[a-zA-Z0-9\-_]{35}/,
    ],
    attackSurface: [
      'Voice synthesis abuse',
      'WaveNet exploitation',
      'Custom voice model theft',
      'SSML injection',
    ],
  },

  // 6. Amazon Transcribe (P1)
  {
    provider: 'Amazon Transcribe',
    category: 'Voice AI (STT)',
    endpoints: [
      'transcribe.us-east-1.amazonaws.com',
      'transcribe.us-west-2.amazonaws.com',
      'transcribe-streaming.us-east-1.amazonaws.com',
    ],
    authHeaderPatterns: [
      /X-Amz-Security-Token:\s*([A-Za-z0-9+\/=]+)/i,
      /Authorization:\s*AWS4-HMAC-SHA256/i,
    ],
    apiKeyPatterns: [
      /AKIA[A-Z0-9]{16}/, // AWS Access Key
    ],
    attackSurface: [
      'AWS credential exposure',
      'S3 bucket enumeration',
      'Medical transcription (HIPAA)',
      'Custom vocabulary exploitation',
      'Channel identification abuse',
    ],
  },

  // 7. Amazon Polly (P1)
  {
    provider: 'Amazon Polly',
    category: 'Voice AI (TTS)',
    endpoints: [
      'polly.us-east-1.amazonaws.com/v1/speech',
      'polly.us-west-2.amazonaws.com/v1/speech',
    ],
    authHeaderPatterns: [
      /Authorization:\s*AWS4-HMAC-SHA256/i,
    ],
    apiKeyPatterns: [
      /AKIA[A-Z0-9]{16}/,
    ],
    attackSurface: [
      'AWS credential theft',
      'SSML injection',
      'Neural voice abuse',
      'Lexicon manipulation',
    ],
  },

  // 8. Azure Speech Services (P1)
  {
    provider: 'Azure Speech Services',
    category: 'Voice AI (STT/TTS)',
    endpoints: [
      '.cognitiveservices.azure.com/sts/v1.0/issuetoken',
      '.cognitiveservices.azure.com/speechtotext/v3.0',
      '.cognitiveservices.azure.com/tts/cognitiveservices/v1',
    ],
    authHeaderPatterns: [
      /Ocp-Apim-Subscription-Key:\s*([a-f0-9]{32})/i,
    ],
    apiKeyPatterns: [
      /[a-f0-9]{32}/, // Azure subscription key
    ],
    attackSurface: [
      'Azure subscription key exposure',
      'Custom neural voice theft',
      'Pronunciation assessment abuse',
      'Speaker recognition exploitation',
      'Language identification bypass',
    ],
  },

  // 9. Rev.ai (P1)
  {
    provider: 'Rev.ai',
    category: 'Voice AI (STT)',
    endpoints: [
      'api.rev.ai/speechtotext/v1/jobs',
      'api.rev.ai/revspeech/v1beta',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9]{40,})/i,
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9]{40,}/,
    ],
    attackSurface: [
      'Human + AI hybrid transcription',
      'Caption manipulation',
      'PII leakage',
      'Custom vocabulary abuse',
    ],
  },

  // 10. Speechmatics (P2)
  {
    provider: 'Speechmatics',
    category: 'Voice AI (STT)',
    endpoints: [
      'asr.api.speechmatics.com/v2',
      'asr.api.speechmatics.com/v2/jobs',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9\-]{36})/i,
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9\-]{36}/, // UUID-like key
    ],
    attackSurface: [
      'Real-time transcription manipulation',
      'Multi-language exploitation',
      'Custom dictionary abuse',
    ],
  },

  // 11. Whisper API (OpenAI) (P1) - Already partially covered by OpenAI detector
  {
    provider: 'OpenAI Whisper',
    category: 'Voice AI (STT)',
    endpoints: [
      'api.openai.com/v1/audio/transcriptions',
      'api.openai.com/v1/audio/translations',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+(sk-[a-zA-Z0-9]{48,})/i,
      /Authorization:\s*Bearer\s+(sk-proj-[a-zA-Z0-9\-_]{40,})/i,
    ],
    apiKeyPatterns: [
      /sk-[a-zA-Z0-9]{48,}/,
      /sk-proj-[a-zA-Z0-9\-_]{40,}/,
    ],
    attackSurface: [
      'Audio file injection',
      'Translation manipulation',
      'Multilingual prompt injection',
      'OpenAI API key exposure',
    ],
  },

  // 12. Play.ht (P2)
  {
    provider: 'Play.ht',
    category: 'Voice AI (TTS)',
    endpoints: [
      'api.play.ht/api/v2/tts',
      'api.play.ht/api/v2/cloned-voices',
    ],
    authHeaderPatterns: [
      /Authorization:\s*Bearer\s+([a-zA-Z0-9]+)/i,
      /X-User-Id:\s*([a-zA-Z0-9\-]+)/i,
    ],
    apiKeyPatterns: [
      /[a-zA-Z0-9]{40,}/,
    ],
    attackSurface: [
      'Ultra-realistic voice cloning',
      'Voice model marketplace abuse',
      'Instant voice cloning (1-minute samples)',
    ],
  },
]

/**
 * Safely mask API key (show first 8 + last 4 chars)
 */
function maskAPIKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return apiKey.substring(0, 4) + '****'
  }
  return apiKey.substring(0, 8) + '****' + apiKey.substring(apiKey.length - 4)
}

/**
 * Detect Voice AI services from crawl result
 */
export function detectVoiceAI(crawlResult: CrawlResult): VoiceAIDetectionResult {
  const detections: VoiceAIDetection[] = []

  for (const pattern of VOICE_AI_PATTERNS) {
    const detection: VoiceAIDetection = {
      provider: pattern.provider,
      category: pattern.category,
      confidence: 'LOW',
      endpoints: [],
      requestPatterns: [],
      attackSurface: pattern.attackSurface,
    }

    let hasEndpoint = false
    let hasAuthHeader = false
    let hasSDK = false

    // 1. Check API endpoints in network requests
    if (crawlResult.networkRequests && Array.isArray(crawlResult.networkRequests)) {
      for (const request of crawlResult.networkRequests) {
        const url = request.url || ''

        // Check endpoint patterns
        for (const endpoint of pattern.endpoints) {
          if (url.includes(endpoint)) {
            hasEndpoint = true
            if (!detection.endpoints.includes(endpoint)) {
              detection.endpoints.push(endpoint)
              detection.requestPatterns.push(`API Endpoint: ${endpoint}`)
            }
          }
        }

        // Check auth headers
        if (pattern.authHeaderPatterns && request.headers) {
          const headers = request.headers
          for (const headerPattern of pattern.authHeaderPatterns) {
            // Check all header values
            for (const [headerName, headerValue] of Object.entries(headers)) {
              const headerString = `${headerName}: ${headerValue}`
              const match = headerString.match(headerPattern)
              if (match && match[1]) {
                hasAuthHeader = true
                detection.apiKeyFound = true
                detection.apiKeyMasked = maskAPIKey(match[1])
                detection.requestPatterns.push(`Auth Header: ${headerName}`)
              }
            }
          }
        }
      }
    }

    // 2. Check SDK URLs in scripts
    if (pattern.sdkUrls && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptUrl = typeof script === 'string' ? script : script.url || ''
        for (const sdkUrl of pattern.sdkUrls) {
          if (scriptUrl.includes(sdkUrl)) {
            hasSDK = true
            detection.sdkFound = true
            detection.requestPatterns.push(`SDK Script: ${sdkUrl}`)
          }
        }
      }
    }

    // 3. Check for API key patterns in script content
    if (pattern.apiKeyPatterns && crawlResult.scripts && Array.isArray(crawlResult.scripts)) {
      for (const script of crawlResult.scripts) {
        const scriptContent = typeof script === 'string' ? script : script.content || ''
        for (const keyPattern of pattern.apiKeyPatterns) {
          const match = scriptContent.match(keyPattern)
          if (match && match[0]) {
            detection.apiKeyFound = true
            detection.apiKeyMasked = maskAPIKey(match[0])
            detection.apiKeyPattern = keyPattern.source
          }
        }
      }
    }

    // 4. Determine confidence level
    if (hasEndpoint && hasAuthHeader) {
      detection.confidence = 'HIGH'
    } else if (hasSDK || hasEndpoint) {
      detection.confidence = 'HIGH'
    } else if (hasAuthHeader) {
      detection.confidence = 'MEDIUM'
    }

    // Add detection if any indicators found
    if (hasEndpoint || hasAuthHeader || hasSDK) {
      detections.push(detection)
    }
  }

  return {
    hasVoiceAI: detections.length > 0,
    detections,
    totalProviders: detections.length,
    highConfidenceCount: detections.filter((d) => d.confidence === 'HIGH').length,
  }
}

/**
 * Export for use in AI Trust Analyzer
 */
export default detectVoiceAI

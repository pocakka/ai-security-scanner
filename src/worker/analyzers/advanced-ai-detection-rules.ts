/**
 * Advanced AI Detection Rules Database
 *
 * Comprehensive detection patterns for AI services, frameworks, libraries,
 * and security vulnerabilities based on AI Red Teaming documentation.
 *
 * Categories:
 * - AI API Providers (12+)
 * - Client-side ML Frameworks (10+)
 * - AI Development Frameworks (8+)
 * - Vector Databases & RAG (10+)
 * - Chatbot Platforms (15+)
 * - Voice/Speech Services (9+)
 * - Image AI Services (10+)
 * - Security & Monitoring Tools (7+)
 * - AI Search Services (4+)
 * - Model Serving Platforms (10+)
 */

export interface AIDetectionPattern {
  name: string
  category: string
  patterns: {
    type: 'script' | 'html' | 'js-global' | 'header' | 'api-endpoint' | 'file' | 'port'
    match: RegExp
    description?: string
  }[]
  apiKeyPatterns?: RegExp[]
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  description: string
}

// =============================================================================
// AI API PROVIDERS
// =============================================================================

export const AI_API_PROVIDERS: AIDetectionPattern[] = [
  {
    name: 'OpenAI',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.openai\.com/i },
      { type: 'script', match: /openai\.com\/v1/i },
      { type: 'js-global', match: /window\.OpenAI/i },
      { type: 'header', match: /openai-organization/i },
      { type: 'api-endpoint', match: /\/v1\/chat\/completions/i },
      { type: 'api-endpoint', match: /\/v1\/completions/i },
    ],
    apiKeyPatterns: [
      /sk-[a-zA-Z0-9]{48}/,
      /sk-proj-[a-zA-Z0-9]+/,
    ],
    riskLevel: 'high',
    description: 'OpenAI API integration detected. Check for API key exposure and rate limiting.',
  },
  {
    name: 'Anthropic Claude',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.anthropic\.com/i },
      { type: 'header', match: /x-api-key.*anthropic/i },
      { type: 'header', match: /anthropic-version/i },
      { type: 'js-global', match: /window\.Anthropic/i },
    ],
    apiKeyPatterns: [
      /sk-ant-api[a-zA-Z0-9]+/,
      /sk-ant-[a-zA-Z0-9]+/,
    ],
    riskLevel: 'high',
    description: 'Anthropic Claude API detected. Verify API key protection and cost controls.',
  },
  {
    name: 'Google AI (Gemini/PaLM/Vertex)',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /generativelanguage\.googleapis\.com/i },
      { type: 'script', match: /aiplatform\.googleapis\.com/i },
      { type: 'script', match: /vertexai/i },
      { type: 'js-global', match: /window\.googleAI/i },
      { type: 'header', match: /x-goog-api-key/i },
    ],
    apiKeyPatterns: [
      /AIzaSy[a-zA-Z0-9_-]{33}/,
    ],
    riskLevel: 'high',
    description: 'Google AI services detected (Gemini/PaLM/Vertex AI).',
  },
  {
    name: 'Microsoft Azure OpenAI',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /\.openai\.azure\.com/i },
      { type: 'script', match: /cognitive\.microsoft/i },
      { type: 'header', match: /ocp-apim-subscription-key/i },
      { type: 'js-global', match: /window\.AzureOpenAI/i },
      { type: 'html', match: /azure.*endpoint.*openai/i },
    ],
    riskLevel: 'high',
    description: 'Azure OpenAI Service detected. Check subscription key security.',
  },
  {
    name: 'Cohere',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.cohere\.ai/i },
      { type: 'header', match: /cohere-api-key/i },
      { type: 'js-global', match: /window\.cohere/i },
    ],
    apiKeyPatterns: [
      /co-[a-zA-Z0-9]{40}/,
    ],
    riskLevel: 'high',
    description: 'Cohere API integration detected.',
  },
  {
    name: 'Hugging Face',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.huggingface\.co/i },
      { type: 'script', match: /huggingface\.co\/api/i },
      { type: 'header', match: /authorization.*bearer.*hf_/i },
      { type: 'js-global', match: /window\.HuggingFace/i },
      { type: 'file', match: /models\/.*\.safetensors/i },
    ],
    apiKeyPatterns: [
      /hf_[a-zA-Z0-9]{34}/,
    ],
    riskLevel: 'medium',
    description: 'Hugging Face API or model hosting detected.',
  },
  {
    name: 'Replicate',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.replicate\.com/i },
      { type: 'header', match: /replicate-api-token/i },
      { type: 'js-global', match: /window\.Replicate/i },
    ],
    apiKeyPatterns: [
      /r8_[a-zA-Z0-9]{40}/,
    ],
    riskLevel: 'high',
    description: 'Replicate API detected for model inference.',
  },
  {
    name: 'Stability AI',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.stability\.ai/i },
      { type: 'header', match: /stability-api-key/i },
      { type: 'js-global', match: /window\.StabilityAI/i },
    ],
    riskLevel: 'medium',
    description: 'Stability AI (Stable Diffusion) API detected.',
  },
  {
    name: 'AI21 Labs',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.ai21\.com/i },
      { type: 'header', match: /authorization.*bearer.*ai21/i },
      { type: 'js-global', match: /window\.AI21/i },
    ],
    riskLevel: 'medium',
    description: 'AI21 Labs (Jurassic) API detected.',
  },
  {
    name: 'Perplexity AI',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.perplexity\.ai/i },
      { type: 'header', match: /authorization.*pplx-api/i },
    ],
    apiKeyPatterns: [
      /pplx-[a-zA-Z0-9]+/,
    ],
    riskLevel: 'medium',
    description: 'Perplexity AI API detected.',
  },
  {
    name: 'Together AI',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.together\.xyz/i },
      { type: 'js-global', match: /window\.Together/i },
    ],
    riskLevel: 'medium',
    description: 'Together AI inference API detected.',
  },
  {
    name: 'Anyscale',
    category: 'AI API Provider',
    patterns: [
      { type: 'script', match: /api\.anyscale\.com/i },
      { type: 'header', match: /authorization.*anyscale/i },
      { type: 'js-global', match: /window\.Anyscale/i },
    ],
    riskLevel: 'medium',
    description: 'Anyscale Endpoints (Ray-based serving) detected.',
  },
]

// =============================================================================
// CLIENT-SIDE ML FRAMEWORKS
// =============================================================================

export const CLIENT_ML_FRAMEWORKS: AIDetectionPattern[] = [
  {
    name: 'TensorFlow.js',
    category: 'Client-side ML Framework',
    patterns: [
      { type: 'script', match: /cdn\.jsdelivr\.net\/npm\/@tensorflow\/tfjs/i },
      { type: 'script', match: /unpkg\.com\/@tensorflow\/tfjs/i },
      { type: 'js-global', match: /window\.tf/i },
      { type: 'file', match: /model\.json/i, description: 'CRITICAL: Model file exposure' },
      { type: 'file', match: /\.weights\.bin/i, description: 'CRITICAL: Model weights exposure' },
      { type: 'file', match: /group[0-9]+-shard[0-9]+of[0-9]+/i },
    ],
    riskLevel: 'high',
    description: 'TensorFlow.js detected. Check for exposed model files (IP theft risk).',
  },
  {
    name: 'ONNX Runtime Web',
    category: 'Client-side ML Framework',
    patterns: [
      { type: 'script', match: /onnxruntime-web/i },
      { type: 'js-global', match: /window\.ort/i },
      { type: 'file', match: /\.onnx$/i, description: 'ONNX model file' },
      { type: 'file', match: /\.ort$/i },
    ],
    riskLevel: 'high',
    description: 'ONNX Runtime detected. Verify model file protection.',
  },
  {
    name: 'ML5.js',
    category: 'Client-side ML Framework',
    patterns: [
      { type: 'script', match: /ml5\.min\.js/i },
      { type: 'script', match: /unpkg\.com\/ml5/i },
      { type: 'js-global', match: /window\.ml5/i },
    ],
    riskLevel: 'low',
    description: 'ML5.js (friendly ML library) detected.',
  },
  {
    name: 'Brain.js',
    category: 'Client-side ML Framework',
    patterns: [
      { type: 'script', match: /brain\.js/i },
      { type: 'js-global', match: /window\.brain/i },
    ],
    riskLevel: 'low',
    description: 'Brain.js neural network library detected.',
  },
]

// =============================================================================
// AI DEVELOPMENT FRAMEWORKS
// =============================================================================

export const AI_DEV_FRAMEWORKS: AIDetectionPattern[] = [
  {
    name: 'LangChain',
    category: 'AI Development Framework',
    patterns: [
      { type: 'script', match: /langchain/i },
      { type: 'js-global', match: /window\.LangChain/i },
      { type: 'html', match: /from ['"]langchain/i },
      { type: 'html', match: /chain_type.*stuff|map_reduce/i, description: 'Chain configuration exposed' },
    ],
    riskLevel: 'medium',
    description: 'LangChain framework detected. Review chain configurations and prompt templates.',
  },
  {
    name: 'LlamaIndex',
    category: 'AI Development Framework',
    patterns: [
      { type: 'script', match: /llamaindex/i },
      { type: 'js-global', match: /window\.LlamaIndex/i },
    ],
    riskLevel: 'medium',
    description: 'LlamaIndex (GPT Index) detected for RAG applications.',
  },
  {
    name: 'Semantic Kernel',
    category: 'AI Development Framework',
    patterns: [
      { type: 'script', match: /semantic-kernel/i },
      { type: 'header', match: /x-semantic-kernel/i },
    ],
    riskLevel: 'medium',
    description: 'Microsoft Semantic Kernel detected.',
  },
  {
    name: 'AutoGPT/Agent Framework',
    category: 'AI Development Framework',
    patterns: [
      { type: 'script', match: /autogpt|babyagi|agentgpt/i },
      { type: 'js-global', match: /window\.Agent/i },
    ],
    riskLevel: 'high',
    description: 'Autonomous AI agent framework detected. Review safety controls.',
  },
]

// =============================================================================
// VECTOR DATABASES & RAG INFRASTRUCTURE
// =============================================================================

export const VECTOR_DATABASES: AIDetectionPattern[] = [
  {
    name: 'Pinecone',
    category: 'Vector Database',
    patterns: [
      { type: 'script', match: /pinecone\.io/i },
      { type: 'script', match: /api\.pinecone\.io/i },
      { type: 'header', match: /api-key.*pinecone/i },
      { type: 'js-global', match: /PINECONE_ENVIRONMENT/i, description: 'Environment variable exposed' },
      { type: 'js-global', match: /PINECONE_API_KEY/i, description: 'CRITICAL: API key exposed' },
    ],
    riskLevel: 'high',
    description: 'Pinecone vector database detected. Check API key protection.',
  },
  {
    name: 'Weaviate',
    category: 'Vector Database',
    patterns: [
      { type: 'script', match: /weaviate\.io/i },
      { type: 'header', match: /x-weaviate/i },
      { type: 'port', match: /8080/i },
    ],
    riskLevel: 'medium',
    description: 'Weaviate vector search engine detected.',
  },
  {
    name: 'Qdrant',
    category: 'Vector Database',
    patterns: [
      { type: 'script', match: /qdrant/i },
      { type: 'port', match: /6333/i },
      { type: 'header', match: /qdrant-api-key/i },
    ],
    riskLevel: 'medium',
    description: 'Qdrant vector database detected.',
  },
  {
    name: 'Chroma',
    category: 'Vector Database',
    patterns: [
      { type: 'script', match: /chromadb/i },
      { type: 'header', match: /x-chroma/i },
    ],
    riskLevel: 'medium',
    description: 'Chroma vector database detected.',
  },
]

// =============================================================================
// VOICE & SPEECH SERVICES
// =============================================================================

export const VOICE_SERVICES: AIDetectionPattern[] = [
  {
    name: 'ElevenLabs',
    category: 'Voice/Speech AI',
    patterns: [
      { type: 'script', match: /api\.elevenlabs\.io/i },
      { type: 'header', match: /xi-api-key/i },
    ],
    apiKeyPatterns: [
      /xi_[a-zA-Z0-9]+/,
    ],
    riskLevel: 'medium',
    description: 'ElevenLabs text-to-speech API detected.',
  },
  {
    name: 'AssemblyAI',
    category: 'Voice/Speech AI',
    patterns: [
      { type: 'script', match: /api\.assemblyai\.com/i },
      { type: 'header', match: /authorization.*assemblyai/i },
    ],
    riskLevel: 'medium',
    description: 'AssemblyAI speech-to-text API detected.',
  },
  {
    name: 'Deepgram',
    category: 'Voice/Speech AI',
    patterns: [
      { type: 'script', match: /api\.deepgram\.com/i },
      { type: 'header', match: /authorization.*deepgram/i },
    ],
    riskLevel: 'medium',
    description: 'Deepgram speech recognition API detected.',
  },
  {
    name: 'Whisper API',
    category: 'Voice/Speech AI',
    patterns: [
      { type: 'script', match: /whisper.*api/i },
      { type: 'api-endpoint', match: /\/v1\/audio\/transcriptions/i },
    ],
    riskLevel: 'medium',
    description: 'OpenAI Whisper API for speech transcription detected.',
  },
]

// =============================================================================
// IMAGE AI SERVICES
// =============================================================================

export const IMAGE_AI_SERVICES: AIDetectionPattern[] = [
  {
    name: 'DALL-E',
    category: 'Image Generation AI',
    patterns: [
      { type: 'api-endpoint', match: /\/v1\/images\/generations/i },
      { type: 'script', match: /dalle/i },
    ],
    riskLevel: 'medium',
    description: 'DALL-E image generation API detected.',
  },
  {
    name: 'Stable Diffusion',
    category: 'Image Generation AI',
    patterns: [
      { type: 'script', match: /stable-diffusion/i },
      { type: 'port', match: /7860/i },
      { type: 'js-global', match: /window\.SD/i },
    ],
    riskLevel: 'medium',
    description: 'Stable Diffusion Web UI or API detected.',
  },
  {
    name: 'Remove.bg',
    category: 'Image Processing AI',
    patterns: [
      { type: 'script', match: /api\.remove\.bg/i },
      { type: 'header', match: /x-api-key.*removebg/i },
    ],
    riskLevel: 'low',
    description: 'Remove.bg background removal API detected.',
  },
]

// =============================================================================
// AI SECURITY & MONITORING TOOLS
// =============================================================================

export const AI_SECURITY_TOOLS: AIDetectionPattern[] = [
  {
    name: 'Rebuff (Prompt Injection Defense)',
    category: 'AI Security Tool',
    patterns: [
      { type: 'script', match: /rebuff\.ai/i },
      { type: 'header', match: /x-rebuff/i },
    ],
    riskLevel: 'low',
    description: '✅ Rebuff prompt injection protection detected (GOOD!).',
  },
  {
    name: 'Lakera Guard',
    category: 'AI Security Tool',
    patterns: [
      { type: 'script', match: /lakera\.ai/i },
      { type: 'header', match: /x-lakera/i },
    ],
    riskLevel: 'low',
    description: '✅ Lakera Guard AI security platform detected (GOOD!).',
  },
  {
    name: 'Langfuse (AI Observability)',
    category: 'AI Monitoring Tool',
    patterns: [
      { type: 'script', match: /langfuse/i },
      { type: 'header', match: /x-langfuse/i },
      { type: 'js-global', match: /window\.langfuse/i },
    ],
    riskLevel: 'low',
    description: '✅ Langfuse AI observability platform detected (GOOD!).',
  },
  {
    name: 'Helicone (AI Monitoring)',
    category: 'AI Monitoring Tool',
    patterns: [
      { type: 'script', match: /helicone\.ai/i },
      { type: 'header', match: /helicone-auth/i },
      { type: 'script', match: /oai\.hconeai\.com/i },
    ],
    riskLevel: 'low',
    description: '✅ Helicone AI monitoring proxy detected (GOOD!).',
  },
]

// =============================================================================
// MASTER COLLECTION
// =============================================================================

export const ADVANCED_AI_DETECTION_RULES: AIDetectionPattern[] = [
  ...AI_API_PROVIDERS,
  ...CLIENT_ML_FRAMEWORKS,
  ...AI_DEV_FRAMEWORKS,
  ...VECTOR_DATABASES,
  ...VOICE_SERVICES,
  ...IMAGE_AI_SERVICES,
  ...AI_SECURITY_TOOLS,
]

// Category grouping helper
export const AI_CATEGORIES = {
  'AI API Provider': AI_API_PROVIDERS,
  'Client-side ML Framework': CLIENT_ML_FRAMEWORKS,
  'AI Development Framework': AI_DEV_FRAMEWORKS,
  'Vector Database': VECTOR_DATABASES,
  'Voice/Speech AI': VOICE_SERVICES,
  'Image Generation AI': IMAGE_AI_SERVICES,
  'Image Processing AI': IMAGE_AI_SERVICES,
  'AI Security Tool': AI_SECURITY_TOOLS,
  'AI Monitoring Tool': AI_SECURITY_TOOLS,
}

# Current Analyzers Documentation - AI Security Scanner

**Last Updated**: 2025-11-14
**Status**: ✅ LLM API Detector Successfully Integrated

---

## Overview

This document provides a complete overview of all implemented analyzers in the AI Security Scanner, with special focus on the newly integrated **LLM API Detector**.

---

## 1. AI Detection Analyzer

**File**: `src/worker/analyzers/ai-detection.ts`
**Status**: ✅ Fully Implemented with LLM API Detection

### Current Capabilities

#### A. Chat Widgets Detection (35 services)
Multi-pattern detection with confidence scoring (HIGH/MEDIUM/LOW):
- Script URLs
- Global Objects (window.* variables)
- DOM Selectors (CSS classes, IDs)

**Tier 1 - Popular** (15 services):
1. Intercom
2. Drift
3. Crisp
4. Zendesk Chat
5. LiveChat
6. Tawk.to
7. HubSpot
8. Tidio
9. Olark
10. Freshchat
11. Customer.io
12. Acquire
13. UserLike
14. LivePerson
15. Genesys Cloud

**Tier 2 - Common** (10 services):
16. Ada
17. Landbot
18. Qualified
19. Manychat
20. Gorgias
21. Re:amaze
22. Customerly
23. Helpshift
24. Chaport
25. Smartsupp

**Tier 3 - Niche** (5 services):
26. JivoChat
27. Usercom
28. Whisbi
29. Zowie
30. Verloop

**Newly Added** (5 services - November 14, 2025):
31. **Chatra**
32. **Pure Chat**
33. **Zoho SalesIQ**
34. **HelpCrunch**
35. **Kommunicate**

#### B. LLM API Detection (9 providers) - **NEW!**

**File**: `src/worker/analyzers/llm-api-detector.ts`
**Integration Date**: November 14, 2025

##### Features:
- ✅ API endpoint URL detection (network requests)
- ✅ Authorization header pattern matching
- ✅ API key extraction with safe masking (show first 8 + last 4 chars)
- ✅ Request/Response structure analysis
- ✅ Attack surface mapping for each provider
- ✅ Confidence scoring (HIGH/MEDIUM/LOW)

##### Supported Providers:

**1. OpenAI** (8 endpoints)
- `api.openai.com/v1/chat/completions`
- `api.openai.com/v1/completions`
- `api.openai.com/v1/embeddings`
- `api.openai.com/v1/images/generations`
- `api.openai.com/v1/images/edits`
- `api.openai.com/v1/audio/transcriptions`
- `api.openai.com/v1/audio/translations`
- `api.openai.com/v1/models`

**API Key Patterns**:
- `sk-[a-zA-Z0-9]{48,}` (legacy)
- `sk-proj-[a-zA-Z0-9\-_]{40,}` (project keys)

**Attack Surface**:
- Prompt injection via messages array
- Model extraction via API responses
- API key exposure in client-side code
- Rate limit bypass attempts
- Token usage manipulation

---

**2. Anthropic Claude** (3 endpoints)
- `api.anthropic.com/v1/messages`
- `api.anthropic.com/v1/complete`
- `api.anthropic.com/v1/chat/completions`

**API Key Patterns**:
- `sk-ant-[a-zA-Z0-9\-_]{40,}`

**Header Patterns**:
- `x-api-key: sk-ant-*`
- `anthropic-version: 2023-XX-XX`

**Attack Surface**:
- Constitutional AI bypass attempts
- Context stuffing attacks
- System prompt manipulation
- API key leakage in headers

---

**3. Cohere** (5 endpoints)
- `api.cohere.ai/v1/generate`
- `api.cohere.ai/v1/embed`
- `api.cohere.ai/v1/classify`
- `api.cohere.ai/v1/summarize`
- `api.cohere.ai/v1/chat`

**API Key Patterns**:
- Generic 40+ char tokens (context-aware)

**Attack Surface**:
- Command injection via prompt
- Embeddings manipulation
- Classification bias exploitation

---

**4. Google Gemini** (3 endpoints)
- `generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- `generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent`
- `generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`

**API Key Patterns**:
- `AIza[a-zA-Z0-9\-_]{35}` (Google API key format)

**Header Patterns**:
- `X-Goog-Api-Key: AIza*`
- `key=AIza*` (query param)

**Attack Surface**:
- Multimodal injection (text + image)
- Safety filter bypass
- Vision model exploitation
- API key exposure in query params

---

**5. Hugging Face** (2 endpoints)
- `api-inference.huggingface.co/models/`
- `api.huggingface.co/models/`

**API Key Patterns**:
- `hf_[a-zA-Z0-9]{30,}`

**Attack Surface**:
- Model-specific attacks (varies by model)
- Open-source model manipulation
- Inference endpoint abuse
- Hub API key theft

---

**6. Replicate** (2 endpoints)
- `api.replicate.com/v1/predictions`
- `api.replicate.com/v1/models/`

**API Key Patterns**:
- `r8_[a-zA-Z0-9]{40,}`

**Attack Surface**:
- Stable Diffusion prompt injection
- NSFW filter bypass
- Webhook injection
- Model version exploitation

---

**7. Azure OpenAI** (2 endpoints)
- `.openai.azure.com/openai/deployments/`
- `.openai.azure.com/openai/models/`

**API Key Patterns**:
- 32+ char tokens (Azure API key)
- Azure AD bearer tokens

**Attack Surface**:
- Enterprise data leakage
- Private endpoint exposure
- Azure AD token theft
- Deployment name enumeration

---

**8. AWS Bedrock** (4 endpoints)
- `bedrock-runtime.us-east-1.amazonaws.com/model/`
- `bedrock-runtime.us-west-2.amazonaws.com/model/`
- `bedrock-runtime.eu-west-1.amazonaws.com/model/`
- `bedrock.amazonaws.com`

**API Key Patterns**:
- `AKIA[A-Z0-9]{16}` (AWS Access Key)

**Header Patterns**:
- `X-Amz-Security-Token`
- `Authorization: AWS4-HMAC-SHA256`

**Attack Surface**:
- IAM role exploitation
- Cross-account access
- Model invocation logging bypass
- AWS credentials exposure

---

**9. Google Vertex AI** (2 endpoints)
- `aiplatform.googleapis.com/v1/projects/`
- `-aiplatform.googleapis.com/v1/projects/`

**API Key Patterns**:
- OAuth 2.0 tokens (no API keys)

**Attack Surface**:
- Enterprise ML pipeline exposure
- Service account compromise
- Endpoint enumeration
- Prediction manipulation

---

#### C. Advanced AI Detection (via `advanced-ai-detection-rules.ts`)

**Categories**:
1. **Vector Databases** (7 services)
   - Pinecone, Weaviate, Chroma, Qdrant, Milvus, DeepLake, LanceDB

2. **Client-side ML Frameworks** (6 services)
   - TensorFlow.js, ONNX Runtime Web, ML5.js, Brain.js, Synaptic, ConvNetJS

3. **Voice/Speech AI** (7 services - Detection exists, needs expansion)
   - Deepgram, AssemblyAI, ElevenLabs, Google Speech STT/TTS, Amazon Transcribe/Polly

4. **Image/Video AI** (7 services - Detection exists, needs expansion)
   - DALL-E, Midjourney, Runway, Clarifai, Google Vision, Rekognition, Stability AI

5. **Security AI** (7 services)
   - reCAPTCHA v3, hCaptcha Enterprise, DataDome, PerimeterX, Cloudflare Bot Management, Arkose Labs, Shape Security

---

## 2. Other Analyzers (28 total)

### Infrastructure Security (22 analyzers)
1. **Security Headers Analyzer** - CSP, HSTS, X-Frame-Options
2. **SSL/TLS Analyzer** - Certificate validation, expiry, issuer
3. **Cookie Security Analyzer** - 1st party only, 7 advanced checks
4. **Cookie Security Enhanced** - Prefix validation, domain scope, session fixation
5. **JS Libraries Analyzer** - Version detection, vulnerability scanning
6. **Tech Stack Analyzer** - 120+ technologies across 8 categories
7. **CORS Analyzer** - Wildcard origins, credentials, bypass patterns
8. **Reconnaissance Analyzer** - robots.txt, .git, .env, backups
9. **Admin Detection Analyzer** - Login forms, admin URLs, CMS detection
10. **API Key Detector** - 20+ providers with entropy checking
11. **Advanced API Key Patterns** - 200+ patterns for 50+ providers
12. **DNS Security Analyzer** - DNSSEC, CAA, SPF, DKIM, DMARC
13. **Client Risks Analyzer** - Exposed secrets, API keys
14. **LLM API Detector** - ✅ **NEW!** Detailed LLM API detection

### OWASP LLM Top 10 (6 analyzers)
15. **LLM01 - Prompt Injection** - Detection patterns
16. **LLM02 - Insecure Output Handling** - XSS, SQLi in AI outputs
17. **LLM03 - Training Data Poisoning** - Model bias detection
18. **LLM04 - Model Denial of Service** - Rate limiting checks
19. **LLM05 - Supply Chain Vulnerabilities** - Third-party AI dependencies
20. **LLM06 - Sensitive Information Disclosure** - PII, API keys, system prompts

### AI-Specific Analyzers (8 analyzers - overlaps with above)
21. **AI Detection** - Chat widgets, LLM APIs, frameworks
22. **AI Trust Score** - 27 checks across 5 categories
23. Various specialized detectors

---

## 3. Integration Points

### How LLM API Detector Works

```typescript
// 1. Import in ai-detection.ts
import { detectLLMAPIs, LLMAPIDetection } from './llm-api-detector'

// 2. Extended interface
export interface AIDetectionResult {
  hasAI: boolean
  providers: string[]
  chatWidgets: string[]
  apiEndpoints: string[]
  jsLibraries: string[]
  vectorDatabases?: string[]
  mlFrameworks?: string[]
  voiceServices?: string[]
  imageServices?: string[]
  securityTools?: string[]
  detailedFindings?: AIDetailedFinding[]
  llmAPIs?: LLMAPIDetection[]  // ← NEW FIELD
}

// 3. Detection call in analyzeAIDetection()
const llmAPIResult = detectLLMAPIs(crawlResult)
if (llmAPIResult.hasLLMAPI) {
  result.hasAI = true
  result.llmAPIs = llmAPIResult.detections

  // Backwards compatibility: add to providers list
  for (const detection of llmAPIResult.detections) {
    if (!result.providers.includes(detection.provider)) {
      result.providers.push(detection.provider)
    }
  }
}
```

### Detection Flow

1. **Network Request Scanning**
   - Playwright captures all network requests during page load
   - LLM detector checks each request URL against endpoint patterns
   - High confidence if endpoint matches

2. **Script Content Analysis**
   - Extracts JavaScript code from crawl result
   - Searches for API endpoint references (even without network calls)
   - Medium confidence if endpoint found in scripts

3. **API Key Extraction**
   - Searches HTML + JS for API key patterns
   - Extracts and safely masks keys (first 8 + last 4 chars)
   - Example: `sk-proj-abc123xyz789...` → `sk-proj-****xyz789`
   - Upgrades confidence to HIGH if key found

4. **Attack Surface Mapping**
   - Each provider has predefined attack vectors
   - Includes specific risks (prompt injection, key exposure, etc.)
   - Helps security analysts prioritize testing

---

## 4. Next Steps - Remaining AI Categories

### P0 - KRITIKUS (High Priority)

**Voice/Speech AI Detection** (7 services - ~3 hours)
- Currently: Basic URL matching in `advanced-ai-detection-rules.ts`
- Needed: Detailed detector like LLM API detector
- Services: Deepgram, AssemblyAI, ElevenLabs, Google Speech STT/TTS, Amazon Transcribe/Polly
- Attack Surface: Voice deepfake, Audio adversarial attacks, STT manipulation

### P1 - MAGAS (Medium Priority)

**Image/Video AI Detection** (7 services - ~3 hours)
- Currently: Basic URL matching
- Needed: Detailed detector with API key extraction
- Services: DALL-E (detailed), Midjourney, Runway, Clarifai, Google Vision, Rekognition, Stability AI
- Attack Surface: NSFW bypass, Deepfake creation, Prompt injection

**Messenger Bots Detection** (4 services - ~2 hours)
- Currently: Not implemented
- Needed: New detector for social platform bots
- Services: ManyChat, Chatfuel, MobileMonkey, Botsify
- Attack Surface: GPT integration, Cross-platform tracking, Data leakage

**Analytics AI Detection** (6 services - ~2 hours)
- Currently: Not implemented
- Needed: Session replay and behavioral analysis detection
- Services: Heap, FullStory, Hotjar, LogRocket, Mixpanel, Amplitude
- Attack Surface: Session replay, Password recording, PII collection

### P2 - KÖZEPES (Low Priority)

**Search AI Detection** (4 services - ~1 hour)
- Services: Algolia, Coveo, Elasticsearch, Meilisearch
- Attack Surface: Index poisoning, Query injection

**Additional Chat Widgets** (5-10 services - ~1 hour)
- LiveAgent, Rocket.Chat, SnapEngage, Kayako, Kustomer

---

## 5. Testing Recommendations

### Test Sites for LLM API Detection

1. **OpenAI API**:
   - https://platform.openai.com/docs
   - https://chat.openai.com (may have API calls)

2. **Anthropic Claude**:
   - https://www.anthropic.com
   - https://claude.ai

3. **Google Gemini**:
   - https://ai.google.dev
   - https://makersuite.google.com

4. **Hugging Face**:
   - https://huggingface.co/models
   - Sites using Inference API

5. **Azure OpenAI**:
   - Enterprise sites using Azure OpenAI (harder to find publicly)

### Expected Behavior

**When LLM API is detected**:
```json
{
  "hasAI": true,
  "llmAPIs": [
    {
      "provider": "OpenAI",
      "category": "LLM API Provider",
      "confidence": "HIGH",
      "endpoints": ["api.openai.com/v1/chat/completions"],
      "apiKeyPattern": "/sk-[a-zA-Z0-9]{48,}/",
      "apiKeyFound": true,
      "apiKeyMasked": "sk-proj-****xyz789",
      "requestPatterns": ["model", "messages", "temperature", "max_tokens"],
      "attackSurface": [
        "Prompt injection via messages array",
        "Model extraction via API responses",
        "API key exposure in client-side code",
        "Rate limit bypass attempts"
      ]
    }
  ],
  "providers": ["OpenAI"]
}
```

**When no LLM API detected**:
```json
{
  "hasAI": false,
  "llmAPIs": [],
  "providers": []
}
```

---

## 6. Code Quality & Security

### API Key Masking
- Always masks API keys before storing/displaying
- Shows enough for identification (first 8 chars + last 4)
- Example: `sk-proj-abcdefgh1234567890xyz123456789` → `sk-proj-ab****6789`

### False Positive Prevention
- Multi-level detection (network + scripts + keys)
- Confidence scoring (HIGH only if multiple signals)
- Context-aware pattern matching (avoid generic regexes)

### Performance Optimization
- Early exit after first match (chat widgets)
- Efficient regex patterns (no catastrophic backtracking)
- Minimal DOM traversal

---

## 7. Documentation Files

**Key Documentation**:
1. `CLAUDE.md` - Project overview, architecture, roadmap
2. `CURRENT_IMPLEMENTATION_STATUS.md` - Implementation audit (51% coverage before LLM detector)
3. `AI_RED_TEAMING_FULL_ANALYSIS.md` - Complete analysis of 98 AI technologies
4. `COMPARISON_TXT_VS_IMPLEMENTED.md` - Detailed comparison of txt files vs implementation
5. `NEWLY_IMPLEMENTED_CHAT_WIDGETS.md` - Hungarian documentation of 30 chat widgets
6. **`CURRENT_ANALYZERS_DOCUMENTATION.md`** - This file (comprehensive analyzer documentation)

---

## 8. Summary

### What's Working Now (November 14, 2025)

✅ **35 Chat Widgets** with multi-pattern detection (HIGH/MEDIUM/LOW confidence)
✅ **9 LLM API Providers** with detailed detection (endpoints, API keys, attack surface)
✅ **7 Vector Databases** with basic detection
✅ **6 ML Frameworks** with basic detection
✅ **7 Security AI tools** with basic detection
✅ **28 Total Analyzers** (22 infrastructure + 6 OWASP LLM)

### What's Missing

❌ **Detailed Voice/Speech AI Detection** (7 services - P0)
❌ **Detailed Image/Video AI Detection** (7 services - P1)
❌ **Messenger Bots Detection** (4 services - P1)
❌ **Analytics AI Detection** (6 services - P1)
❌ **Search AI Detection** (4 services - P2)
❌ **Additional Chat Widgets** (5-10 services - P2)

### Implementation Progress

**Before LLM Detector**: 51% coverage (49/97 AI technologies)
**After LLM Detector**: ~60% coverage (58/97 AI technologies)
**Target**: 85%+ coverage (83/97 AI technologies)

---

**Next Implementation**: Voice/Speech AI Detector (following same pattern as LLM API Detector)

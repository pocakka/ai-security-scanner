# Comprehensive AI Web Technologies Research

**Date**: November 14, 2025
**Purpose**: Complete catalog of detectable AI services for AI Security Scanner
**Goal**: Increase coverage from 60% (58/97) to 95%+ (143/150)

---

## Executive Summary

This document provides a comprehensive catalog of **150+ AI services** across **12 categories**, each with specific detection patterns for implementation in the AI Security Scanner.

### Coverage Statistics

| Category | Total Services | Currently Implemented | Coverage | Priority |
|----------|----------------|----------------------|----------|----------|
| Chat Widgets | 45 | 36 | 80% | P2-P3 |
| LLM APIs | 15 | 9 | 60% | P0-P1 |
| Voice/Speech AI | 12 | 0 | 0% | **P0** |
| Image/Video AI | 15 | 1 | 7% | P1 |
| Recommendations | 10 | 0 | 0% | P2 |
| Personalization/A/B | 12 | 0 | 0% | **P0** |
| Analytics AI | 10 | 2 | 20% | **P0** |
| Search AI | 8 | 0 | 0% | **P0** |
| Content Moderation | 6 | 1 | 17% | P1 |
| Translation | 8 | 0 | 0% | **P0** |
| Email/Marketing AI | 8 | 1 | 13% | P1 |
| Fraud/Security | 11 | 7 | 64% | P2 |
| **TOTAL** | **150** | **57** | **38%** | - |

### Implementation Priority Matrix

- **P0 (Critical - 20 services)**: High-traffic services, easy detection, major security impact
- **P1 (High - 30 services)**: Common services, moderate detection complexity
- **P2 (Medium - 30 services)**: Niche services, specialized use cases
- **P3 (Low - 13 services)**: Rare services, complex detection, low ROI

---

## Detection Methodology

### 1. Script URL Detection (Highest Confidence)
```typescript
// Example pattern
scriptUrls: [
  /cdn\.example\.com\/widget\.js/i,
  /api\.example\.com\/sdk/i
]
```

### 2. Global Object Detection (High Confidence)
```typescript
// Check window object
globalObjects: ['window.ExampleSDK', 'window._example']
```

### 3. API Endpoint Detection (High Confidence)
```typescript
// Network monitoring via Playwright
endpoints: [
  'api.example.com/v1/chat',
  'example.com/api/inference'
]
```

### 4. DOM Selector Detection (Medium Confidence)
```typescript
// HTML element patterns
domSelectors: ['#example-widget', '.example-chat-container']
```

### 5. Cookie Detection (Low Confidence)
```typescript
// Cookie names
cookies: ['_example_session', 'example_user_id']
```

### 6. Header Detection (High Confidence - for APIs)
```typescript
// Request/response headers
headers: ['X-Example-Api-Key', 'Example-Version']
```

---

## Category 1: Chat Widgets (45 services)

**Current Implementation**: 36/45 (80%)
**Priority**: P2-P3 (most are implemented)

### ✅ Already Implemented (36)

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
26. JivoChat
27. Usercom
28. Whisbi
29. Zowie
30. Verloop
31. Chatra
32. Pure Chat
33. Zoho SalesIQ
34. HelpCrunch
35. Kommunicate
36. GPT4Business (YoloAI)

### ❌ Missing (9 services - P2/P3)

#### 37. LiveAgent (P2)
```javascript
// Script URLs
'ladesk.com',
'//cdn.ladesk.com/',
'/ladesk/scripts/'

// Global Objects
window.LiveAgent

// DOM Selectors
'#liveagent-button',
'.ladesk-widget'

// Attack Surface
- Session hijacking via widget
- XSS through agent messages
- CSRF in chat forms

// Confidence: HIGH if script + global object
```

#### 38. Rocket.Chat (P0 - Open Source)
```javascript
// Script URLs
'rocket.chat/livechat',
'/livechat/rocketchat-livechat.min.js'

// Global Objects
window.RocketChat

// API Endpoints
'your-domain.rocket.chat/api/v1/livechat/message'

// DOM Selectors
'.rocketchat-widget',
'#rocketchat-iframe'

// Attack Surface
- Self-hosted security risks
- API endpoint exposure
- Message injection
- Webhook manipulation

// Confidence: HIGH if API endpoint or global object
```

#### 39. SnapEngage (P0)
```javascript
// Script URLs
'snapengage.com/cdn/',
'snapabug.appspot.com'

// Global Objects
window.SnapEngage,
window.SnapABug

// DOM Selectors
'#snapengage-widget'

// Attack Surface
- Widget hijacking
- Agent impersonation
- Session fixation

// Confidence: HIGH if script or global object
```

#### 40. Kayako (P0)
```javascript
// Script URLs
'kayako.com/api/v1/messenger.js',
'kayakocdn.com'

// Global Objects
window.kayako

// DOM Selectors
'.kayako-messenger'

// Attack Surface
- Messenger API exposure
- Ticket manipulation
- Customer data leakage

// Confidence: HIGH if script found
```

#### 41. Kustomer (P0)
```javascript
// Script URLs
'cdn.kustomerapp.com/chat-web/',
'kustomerapp.com'

// Global Objects
window.Kustomer

// DOM Selectors
'#kustomer-ui-sdk-iframe'

// Attack Surface
- CRM data exposure
- Customer profile manipulation
- API key leakage

// Confidence: HIGH if SDK or global object
```

#### 42. Front Chat (P3)
```javascript
// Script URLs
'chat-assets.frontapp.com'

// Global Objects
window.FrontChat

// DOM Selectors
'.front-chat-iframe'

// Attack Surface
- Shared inbox exposure
- Team collaboration leaks

// Confidence: MEDIUM
```

#### 43. Gladly (P3)
```javascript
// Script URLs
'gladly.com/web-sdk'

// Global Objects
window.gladly

// Attack Surface
- Customer context leakage
- Omnichannel tracking

// Confidence: MEDIUM
```

#### 44. Helpscout Beacon (P2)
```javascript
// Script URLs
'beacon-v2.helpscout.net'

// Global Objects
window.Beacon

// DOM Selectors
'.BeaconFabButton'

// Attack Surface
- Knowledge base exposure
- Contact form manipulation

// Confidence: HIGH if script found
```

#### 45. Messenger by Meta (P1)
```javascript
// Script URLs
'connect.facebook.net/*/sdk/xfbml.customerchat.js'

// Global Objects
window.FB,
FB.CustomerChat

// DOM Selectors
'.fb-customerchat',
'#fb-customer-chat-bubble'

// Attack Surface
- Facebook tracking integration
- Cross-site data sharing
- Privacy concerns (GDPR)

// Confidence: HIGH if script + DOM
```

---

## Category 2: LLM APIs (15 services)

**Current Implementation**: 9/15 (60%)
**Priority**: P0-P1 (high security impact)

### ✅ Already Implemented (9)

1. OpenAI
2. Anthropic Claude
3. Cohere
4. Google Gemini
5. Hugging Face
6. Replicate
7. Azure OpenAI
8. AWS Bedrock
9. Google Vertex AI

### ❌ Missing (6 services)

#### 10. Together AI (P0)
```javascript
// API Endpoints
'api.together.xyz/inference',
'api.together.xyz/v1/chat/completions'

// API Key Pattern
/[a-f0-9]{64}/

// Request Headers
Authorization: Bearer [64-char hex]

// Attack Surface
- Open-source model exploitation
- Prompt injection
- API key exposure
- Rate limit bypass

// Confidence: HIGH if endpoint found
```

#### 11. Perplexity AI (P0)
```javascript
// API Endpoints
'api.perplexity.ai/chat/completions'

// API Key Pattern
/pplx-[a-zA-Z0-9]{40,}/

// Request Headers
Authorization: Bearer pplx-*

// Attack Surface
- Search-augmented prompt injection
- Citation manipulation
- Source spoofing

// Confidence: HIGH if endpoint or key pattern
```

#### 12. Mistral AI (P0)
```javascript
// API Endpoints
'api.mistral.ai/v1/chat/completions'

// API Key Pattern
/[a-zA-Z0-9]{32}/

// Request Headers
Authorization: Bearer *

// Attack Surface
- European AI regulation bypass
- Prompt injection
- Model extraction

// Confidence: HIGH if endpoint found
```

#### 13. Groq (P0)
```javascript
// API Endpoints
'api.groq.com/openai/v1/chat/completions'

// API Key Pattern
/gsk_[a-zA-Z0-9]{52}/

// Request Headers
Authorization: Bearer gsk_*

// Attack Surface
- Ultra-fast inference exploitation
- Token manipulation
- LPU-specific attacks

// Confidence: HIGH if endpoint or key
```

#### 14. Anyscale (P1)
```javascript
// API Endpoints
'api.endpoints.anyscale.com/v1/'

// API Key Pattern
/esecret_[a-zA-Z0-9]{40,}/

// Request Headers
Authorization: Bearer esecret_*

// Attack Surface
- Ray cluster exposure
- Distributed inference manipulation

// Confidence: MEDIUM
```

#### 15. Fireworks AI (P1)
```javascript
// API Endpoints
'api.fireworks.ai/inference/v1/chat/completions'

// API Key Pattern
/fw_[a-zA-Z0-9]{40,}/

// Request Headers
Authorization: Bearer fw_*

// Attack Surface
- Production-ready model exploitation
- LoRA adapter manipulation

// Confidence: HIGH if endpoint found
```

---

## Category 3: Voice/Speech AI (12 services)

**Current Implementation**: 0/12 (0%)
**Priority**: P0 (critical gap)

#### 1. Deepgram (P0)
```javascript
// API Endpoints
'api.deepgram.com/v1/listen',
'api.deepgram.com/v1/speak'

// Script URLs
'cdn.deepgram.com/sdk/'

// API Key Pattern
/[a-f0-9]{40}/

// Request Headers
Authorization: Token [40-char hex]

// Attack Surface
- Audio injection attacks
- Transcription manipulation
- Voice biometric theft
- API key exposure
- WebSocket hijacking

// Confidence: HIGH if endpoint or SDK found
```

#### 2. AssemblyAI (P0)
```javascript
// API Endpoints
'api.assemblyai.com/v2/transcript',
'api.assemblyai.com/v2/upload'

// API Key Pattern
/[a-f0-9]{32}/

// Request Headers
authorization: [32-char hex]

// Attack Surface
- Audio file manipulation
- PII extraction from transcripts
- Speaker diarization abuse
- Sentiment analysis manipulation

// Confidence: HIGH if endpoint found
```

#### 3. ElevenLabs (P0)
```javascript
// API Endpoints
'api.elevenlabs.io/v1/text-to-speech',
'api.elevenlabs.io/v1/voices'

// API Key Pattern
/[a-f0-9]{32}/

// Request Headers
xi-api-key: [32-char hex]

// Attack Surface
- Voice cloning abuse
- Deepfake audio generation
- Voice model theft
- TTS manipulation for phishing

// Confidence: HIGH if endpoint or header
```

#### 4. Google Cloud Speech-to-Text (P0)
```javascript
// API Endpoints
'speech.googleapis.com/v1/speech:recognize',
'speech.googleapis.com/v1/speech:longrunningrecognize'

// API Key Pattern
/AIza[a-zA-Z0-9\-_]{35}/

// Request Headers
X-Goog-Api-Key: AIza*

// Attack Surface
- Google Cloud credential exposure
- Transcription manipulation
- Language model exploitation

// Confidence: HIGH if endpoint found
```

#### 5. Google Cloud Text-to-Speech (P1)
```javascript
// API Endpoints
'texttospeech.googleapis.com/v1/text:synthesize'

// API Key Pattern
/AIza[a-zA-Z0-9\-_]{35}/

// Attack Surface
- Voice synthesis abuse
- WaveNet exploitation

// Confidence: HIGH
```

#### 6. Amazon Transcribe (P1)
```javascript
// API Endpoints
'transcribe.us-east-1.amazonaws.com',
'transcribe-streaming.amazonaws.com'

// API Key Pattern
/AKIA[A-Z0-9]{16}/

// Request Headers
X-Amz-Security-Token,
Authorization: AWS4-HMAC-SHA256

// Attack Surface
- AWS credential exposure
- S3 bucket enumeration
- Medical transcription (HIPAA)

// Confidence: HIGH if endpoint + auth header
```

#### 7. Amazon Polly (P1)
```javascript
// API Endpoints
'polly.us-east-1.amazonaws.com/v1/speech'

// Attack Surface
- AWS credential theft
- SSML injection
- Neural voice abuse

// Confidence: HIGH
```

#### 8. Rev.ai (P1)
```javascript
// API Endpoints
'api.rev.ai/speechtotext/v1/jobs'

// API Key Pattern
/[a-zA-Z0-9]{40,}/

// Request Headers
Authorization: Bearer *

// Attack Surface
- Human + AI hybrid transcription
- Caption manipulation
- PII leakage

// Confidence: MEDIUM
```

#### 9. Azure Speech Services (P1)
```javascript
// API Endpoints
'*.cognitiveservices.azure.com/sts/v1.0/issuetoken',
'*.cognitiveservices.azure.com/speechtotext/v3.0/'

// API Key Pattern
/[a-f0-9]{32}/

// Request Headers
Ocp-Apim-Subscription-Key: *

// Attack Surface
- Azure subscription key exposure
- Custom neural voice theft
- Pronunciation assessment abuse

// Confidence: HIGH if endpoint found
```

#### 10. Speechmatics (P2)
```javascript
// API Endpoints
'asr.api.speechmatics.com/v2'

// API Key Pattern
/[a-zA-Z0-9\-]{36}/

// Attack Surface
- Real-time transcription manipulation
- Multi-language exploitation

// Confidence: MEDIUM
```

#### 11. Whisper API (OpenAI) (P1)
```javascript
// API Endpoints
'api.openai.com/v1/audio/transcriptions',
'api.openai.com/v1/audio/translations'

// API Key Pattern
/sk-[a-zA-Z0-9]{48,}/

// Attack Surface
- Audio file injection
- Translation manipulation
- Multilingual prompt injection

// Confidence: HIGH (already partially covered by OpenAI detector)
```

#### 12. Play.ht (P2)
```javascript
// API Endpoints
'api.play.ht/api/v2/tts'

// Request Headers
Authorization: Bearer *,
X-User-Id: *

// Attack Surface
- Ultra-realistic voice cloning
- Voice model marketplace abuse

// Confidence: MEDIUM
```

---

## Category 4: Image/Video AI (15 services)

**Current Implementation**: 1/15 (7%) - DALL-E only
**Priority**: P1 (high-profile services)

#### 1. ✅ DALL-E (OpenAI) - Already Implemented
```javascript
// API Endpoints
'api.openai.com/v1/images/generations',
'api.openai.com/v1/images/edits'
```

#### 2. Midjourney (P1)
```javascript
// API Endpoints
'discord.com/api/v*/interactions' (Discord bot)

// Detection Method
- Check for Discord webhook with Midjourney bot ID
- Look for cdn.midjourney.com image URLs

// Attack Surface
- Prompt injection for NSFW bypass
- Copyright infringement
- Discord token theft
- Image URL enumeration

// Confidence: LOW (Discord-based, hard to detect)
```

#### 3. Stability AI (Stable Diffusion) (P0)
```javascript
// API Endpoints
'api.stability.ai/v1/generation/',
'api.stability.ai/v1/user/balance'

// API Key Pattern
/sk-[a-zA-Z0-9]{40,}/

// Request Headers
Authorization: Bearer sk-*

// Attack Surface
- NSFW filter bypass
- Negative prompt injection
- Model weight extraction
- API key exposure
- Seed manipulation

// Confidence: HIGH if endpoint found
```

#### 4. Runway ML (P1)
```javascript
// API Endpoints
'api.runwayml.com/v1/',
'runwayml.com/api/'

// Script URLs
'cdn.runwayml.com/'

// Attack Surface
- Video generation manipulation
- Gen-2 model abuse
- Motion tracking exploitation

// Confidence: MEDIUM
```

#### 5. Leonardo.ai (P2)
```javascript
// API Endpoints
'cloud.leonardo.ai/api/rest/v1/'

// Attack Surface
- AI canvas manipulation
- Model training data poisoning

// Confidence: MEDIUM
```

#### 6. Clipdrop (Stability AI) (P2)
```javascript
// API Endpoints
'clipdrop-api.co/*/v1/'

// Request Headers
x-api-key: *

// Attack Surface
- Background removal abuse
- Image upscaling exploitation

// Confidence: MEDIUM
```

#### 7. Replicate (Image Models) (P1)
```javascript
// Already covered by LLM API detector
// Add specific image model patterns:
'api.replicate.com/v1/predictions' +
  models: 'stability-ai/sdxl', 'salesforce/blip'

// Attack Surface
- Open model marketplace abuse
- Webhook injection

// Confidence: HIGH (already implemented)
```

#### 8. Cloudinary AI (P1)
```javascript
// Script URLs
'res.cloudinary.com/',
'cloudinary.com/documentation/ai_in_action'

// Global Objects
window.cloudinary

// Attack Surface
- AI-powered transformations
- Auto-tagging manipulation
- Content-aware cropping abuse

// Confidence: HIGH if script found
```

#### 9. Amazon Rekognition (P1)
```javascript
// API Endpoints
'rekognition.us-east-1.amazonaws.com'

// Request Headers
X-Amz-Target: RekognitionService.*

// Attack Surface
- AWS credential exposure
- Facial recognition abuse
- Content moderation bypass
- Celebrity recognition exploitation

// Confidence: HIGH if endpoint + header
```

#### 10. Google Cloud Vision API (P1)
```javascript
// API Endpoints
'vision.googleapis.com/v1/images:annotate'

// API Key Pattern
/AIza[a-zA-Z0-9\-_]{35}/

// Attack Surface
- OCR manipulation
- Label detection abuse
- SafeSearch bypass
- Logo detection exploitation

// Confidence: HIGH if endpoint found
```

#### 11. Clarifai (P1)
```javascript
// API Endpoints
'api.clarifai.com/v2/models/',
'api.clarifai.com/v2/workflows/'

// API Key Pattern
/[a-f0-9]{32}/

// Request Headers
Authorization: Key [32-char hex]

// Attack Surface
- Custom model exploitation
- Visual search manipulation
- Concept detection abuse

// Confidence: HIGH if endpoint found
```

#### 12. Roboflow (P2)
```javascript
// API Endpoints
'detect.roboflow.com/',
'api.roboflow.com/'

// API Key Pattern
/[a-zA-Z0-9]{40}/

// Attack Surface
- Object detection manipulation
- Custom dataset poisoning
- Computer vision model theft

// Confidence: MEDIUM
```

#### 13. Remove.bg (P2)
```javascript
// API Endpoints
'api.remove.bg/v1.0/removebg'

// Request Headers
X-Api-Key: *

// Attack Surface
- Background removal abuse
- API key exposure

// Confidence: HIGH if endpoint found
```

#### 14. DeepAI (P2)
```javascript
// API Endpoints
'api.deepai.org/api/'

// Request Headers
api-key: *

// Attack Surface
- Multiple AI model access
- Style transfer abuse
- Image enhancement manipulation

// Confidence: MEDIUM
```

#### 15. Pinata (IPFS + AI) (P3)
```javascript
// API Endpoints
'api.pinata.cloud/pinning/'

// Attack Surface
- Decentralized AI model hosting
- IPFS content manipulation

// Confidence: LOW
```

---

## Category 5: Recommendation Engines (10 services)

**Current Implementation**: 0/10 (0%)
**Priority**: P2 (E-commerce focus)

#### 1. Dynamic Yield (P2)
```javascript
// Script URLs
'cdn.dynamicyield.com/api/',
'st.dynamicyield.com/scripts/'

// Global Objects
window.DY

// Cookies
_dy_*, _dyid

// Attack Surface
- Personalization manipulation
- A/B test spoofing
- User segmentation abuse

// Confidence: HIGH if script + cookie
```

#### 2. Nosto (P2)
```javascript
// Script URLs
'connect.nosto.com/include/'

// Global Objects
window.nostojs

// Attack Surface
- Product recommendation manipulation
- Revenue tracking abuse

// Confidence: HIGH
```

#### 3. Barilliance (P2)
```javascript
// Script URLs
'cdn.barilliance.com/'

// Global Objects
window.Barilliance

// Attack Surface
- Behavioral targeting
- Email remarketing data

// Confidence: MEDIUM
```

#### 4. Klevu (P2)
```javascript
// Script URLs
'js.klevu.com/'

// Global Objects
window.klevu

// Attack Surface
- AI search manipulation
- Product discovery abuse

// Confidence: HIGH
```

#### 5. Bloomreach (P2)
```javascript
// Script URLs
'cdn.exponea.com/',
'api.exponea.com/'

// Global Objects
window.exponea

// Attack Surface
- Customer data platform exposure
- Omnichannel tracking

// Confidence: HIGH
```

#### 6. RichRelevance (P3)
```javascript
// Script URLs
'media.richrelevance.com/rrserver/'

// Global Objects
window.RR

// Attack Surface
- Personalization engine abuse

// Confidence: MEDIUM
```

#### 7. Certona (P3)
```javascript
// Script URLs
'cdn.certona.net/'

// Attack Surface
- Real-time recommendations

// Confidence: LOW
```

#### 8. Recopilot (P3)
```javascript
// Script URLs
'cdn.recopilot.com/'

// Attack Surface
- Amazon-like recommendations

// Confidence: LOW
```

#### 9. Yusp (P3)
```javascript
// Script URLs
'yusp.com/api/'

// Attack Surface
- Predictive recommendations

// Confidence: LOW
```

#### 10. Reflektion (P3)
```javascript
// Script URLs
'cdn.reflektion.com/'

// Attack Surface
- Commerce search AI

// Confidence: LOW
```

---

## Category 6: Personalization & A/B Testing (12 services)

**Current Implementation**: 0/12 (0%)
**Priority**: P0-P1 (high-traffic)

#### 1. Optimizely (P0)
```javascript
// Script URLs
'cdn.optimizely.com/js/'

// Global Objects
window.optimizely,
window.optimizelySdk

// Cookies
optimizelyEndUserId

// Attack Surface
- A/B test manipulation
- Feature flag exploitation
- Experiment data leakage
- Statistical significance gaming

// Confidence: HIGH if script + global object
```

#### 2. VWO (Visual Website Optimizer) (P0)
```javascript
// Script URLs
'dev.visualwebsiteoptimizer.com/j.php',
'dev.visualwebsiteoptimizer.com/lib/'

// Global Objects
window.VWO,
window._vwo_code

// Cookies
_vis_opt_*, _vwo_*

// Attack Surface
- Heatmap data exposure
- Conversion funnel manipulation
- Session recording (PII risk)

// Confidence: HIGH if script found
```

#### 3. Google Optimize (P1 - Deprecated but still in use)
```javascript
// Script URLs
'www.googleoptimize.com/optimize.js'

// Global Objects
window.dataLayer (GTM integration)

// Attack Surface
- Google Analytics integration exposure
- Experiment ID enumeration

// Confidence: HIGH
```

#### 4. AB Tasty (P1)
```javascript
// Script URLs
'try.abtasty.com/*/lib.js'

// Global Objects
window.ABTasty

// Cookies
ABTasty*

// Attack Surface
- Personalization abuse
- Widget injection

// Confidence: HIGH
```

#### 5. Adobe Target (P1)
```javascript
// Script URLs
'assets.adobedtm.com/',
'*.tt.omtrdc.net/'

// Global Objects
window.adobe.target

// Attack Surface
- Enterprise personalization
- Adobe Experience Cloud exposure

// Confidence: MEDIUM
```

#### 6. LaunchDarkly (P1)
```javascript
// Script URLs
'app.launchdarkly.com/'

// API Endpoints
'sdk.launchdarkly.com/sdk/eval/'

// Global Objects
window.LDClient

// Attack Surface
- Feature flag manipulation
- Client SDK key exposure
- A/B test bypass

// Confidence: HIGH if SDK or endpoint found
```

#### 7. Split.io (P2)
```javascript
// Script URLs
'cdn.split.io/sdk/'

// Global Objects
window.SplitFactory

// Attack Surface
- Feature delivery manipulation
- Treatment assignment abuse

// Confidence: MEDIUM
```

#### 8. Kameleoon (P2)
```javascript
// Script URLs
'*.kameleoon.eu/',
'*.kameleoon.com/'

// Global Objects
window.Kameleoon

// Attack Surface
- Real-time personalization
- Predictive targeting

// Confidence: MEDIUM
```

#### 9. Convert.com (P2)
```javascript
// Script URLs
'cdn-*.convertexperiments.com/'

// Global Objects
window._conv_q

// Attack Surface
- Privacy-focused A/B testing
- GDPR bypass attempts

// Confidence: MEDIUM
```

#### 10. Unbounce (P2)
```javascript
// Script URLs
'unbounce.com/*/variants/'

// Attack Surface
- Landing page A/B tests
- Conversion tracking

// Confidence: LOW
```

#### 11. Webtrends Optimize (P3)
```javascript
// Script URLs
'*.webtrends-optimize.com/'

// Attack Surface
- Behavioral targeting

// Confidence: LOW
```

#### 12. SiteSpect (P3)
```javascript
// No client-side script (edge-based)

// Detection Method
Response headers: X-SiteSpect-*

// Attack Surface
- Server-side testing exposure

// Confidence: LOW
```

---

## Category 7: Analytics AI (10 services)

**Current Implementation**: 2/10 (20%) - Heap, Mixpanel basic detection
**Priority**: P0 (session replay = major privacy risk)

#### 1. FullStory (P0)
```javascript
// Script URLs
'fullstory.com/s/fs.js',
'rs.fullstory.com/'

// Global Objects
window.FS,
window._fs_*

// Cookies
fs_uid

// Attack Surface
- **Session replay (records everything)**
- Password field recording (if misconfigured)
- PII exposure in replays
- Credit card number capture
- API key visibility in dev tools
- Rage click detection abuse

// Confidence: HIGH if script found
```

#### 2. LogRocket (P0)
```javascript
// Script URLs
'cdn.logrocket.io/',
'cdn.lr-ingest.io/'

// Global Objects
window.LogRocket

// Attack Surface
- Session replay with console logs
- Network request recording (API keys!)
- Redux state exposure
- Error tracking manipulation

// Confidence: HIGH
```

#### 3. Hotjar (P0)
```javascript
// Script URLs
'static.hotjar.com/c/hotjar-'

// Global Objects
window.hj,
window._hjSettings

// Cookies
_hjid, _hjSession*

// Attack Surface
- Heatmap data exposure
- Session recording (PII risk)
- Form field tracking
- Feedback polls manipulation

// Confidence: HIGH if script found
```

#### 4. Heap Analytics (P1)
```javascript
// Script URLs
'cdn.heapanalytics.com/js/'

// Global Objects
window.heap

// Cookies
_hp2_*

// Attack Surface
- Autocapture everything (no code tracking)
- Retroactive funnels
- User session stitching

// Confidence: HIGH
```

#### 5. Mixpanel (P1)
```javascript
// Script URLs
'cdn.mxpnl.com/libs/mixpanel-'

// Global Objects
window.mixpanel

// Cookies
mp_*

// Attack Surface
- Event tracking manipulation
- User property exposure
- Funnel data leakage

// Confidence: HIGH
```

#### 6. Amplitude (P1)
```javascript
// Script URLs
'cdn.amplitude.com/'

// Global Objects
window.amplitude

// Cookies
amplitude_*

// Attack Surface
- Behavioral cohort analysis
- User journey tracking
- Revenue analytics exposure

// Confidence: HIGH
```

#### 7. Smartlook (P1)
```javascript
// Script URLs
'rec.smartlook.com/recorder.js'

// Global Objects
window.smartlook

// Attack Surface
- Session recording
- Mobile app tracking

// Confidence: HIGH
```

#### 8. Mouseflow (P2)
```javascript
// Script URLs
'cdn.mouseflow.com/projects/'

// Global Objects
window._mfq

// Attack Surface
- Session replay
- Form analytics
- Funnel tracking

// Confidence: MEDIUM
```

#### 9. Crazy Egg (P2)
```javascript
// Script URLs
'script.crazyegg.com/pages/scripts/'

// Global Objects
window.CE2

// Attack Surface
- Heatmaps
- Scroll maps
- A/B testing

// Confidence: MEDIUM
```

#### 10. Pendo (P1)
```javascript
// Script URLs
'cdn.pendo.io/agent/static/'

// Global Objects
window.pendo

// Attack Surface
- Product analytics
- In-app guidance tracking
- Feature adoption monitoring

// Confidence: HIGH
```

---

## Category 8: Search AI (8 services)

**Current Implementation**: 0/8 (0%)
**Priority**: P0 (common enterprise tools)

#### 1. Algolia (P0)
```javascript
// Script URLs
'cdn.jsdelivr.net/npm/algoliasearch',
'cdn.jsdelivr.net/npm/instantsearch.js'

// Global Objects
window.algoliasearch,
window.instantsearch

// API Endpoints
'*.algolia.net/1/indexes/',
'*.algolianet.com/'

// API Key Pattern (Search-only key)
/[a-f0-9]{32}/

// Request Headers
X-Algolia-Application-Id: *,
X-Algolia-API-Key: *

// Attack Surface
- Search-only API key exposure (low risk if scoped)
- Index enumeration
- Query manipulation
- Facet abuse
- Rate limiting bypass
- Admin API key exposure (CRITICAL)

// Confidence: HIGH if endpoint + headers found
```

#### 2. Elasticsearch (P0)
```javascript
// API Endpoints
'*.elastic.co:9200/',
'*/elasticsearch/',
'*/_search',
'*/_cluster/health'

// Request Headers
Authorization: ApiKey *,
Authorization: Bearer *

// Attack Surface
- **Open Elasticsearch exposure (common misconfiguration)**
- Index listing (/_cat/indices)
- Mapping disclosure
- Query DSL injection
- Aggregation abuse
- Cluster info leakage

// Confidence: HIGH if endpoint accessible
```

#### 3. Coveo (P1)
```javascript
// Script URLs
'static.cloud.coveo.com/searchui/',
'platform.cloud.coveo.com/'

// Global Objects
window.Coveo

// API Endpoints
'platform.cloud.coveo.com/rest/search'

// Attack Surface
- Enterprise search exposure
- Salesforce/ServiceNow integration leaks
- Query pipeline manipulation

// Confidence: HIGH if script or endpoint found
```

#### 4. Swiftype (Elastic App Search) (P1)
```javascript
// Script URLs
'cdn.swiftype.com/assets/'

// Global Objects
window.Swiftype

// API Endpoints
'*.swiftype.com/api/v1/engines/'

// Attack Surface
- App Search API key exposure
- Engine enumeration
- Document injection

// Confidence: MEDIUM
```

#### 5. Constructor.io (P1)
```javascript
// Script URLs
'cdn.constructor.io/constructorio-'

// API Endpoints
'ac.cnstrc.com/search/',
'ac.cnstrc.com/autocomplete/'

// Request Headers
x-cnstrc-client: *

// Attack Surface
- Product search manipulation
- Autocomplete suggestion abuse
- Revenue tracking

// Confidence: HIGH if endpoint found
```

#### 6. Meilisearch (P1)
```javascript
// API Endpoints
'*/indexes/',
'*/health',
'*/stats'

// Request Headers
Authorization: Bearer *,
X-Meili-API-Key: *

// Attack Surface
- Open-source search server exposure
- Master key vs search key distinction
- Index manipulation if admin key exposed

// Confidence: HIGH if endpoint accessible
```

#### 7. Typesense (P2)
```javascript
// API Endpoints
'*.typesense.net/collections/'

// Request Headers
X-TYPESENSE-API-KEY: *

// Attack Surface
- Cloud-hosted search exposure
- Collection schema leakage

// Confidence: MEDIUM
```

#### 8. Lucidworks Fusion (P3)
```javascript
// API Endpoints
'*/api/apollo/query-pipelines/'

// Attack Surface
- Enterprise AI-powered search
- Query pipeline exposure

// Confidence: LOW
```

---

## Category 9: Content Moderation AI (6 services)

**Current Implementation**: 1/6 (17%) - reCAPTCHA v3
**Priority**: P1 (security-critical)

#### 1. ✅ reCAPTCHA v3 (Google) - Already Implemented

#### 2. OpenAI Moderation API (P1)
```javascript
// API Endpoints
'api.openai.com/v1/moderations'

// API Key Pattern
/sk-[a-zA-Z0-9]{48,}/

// Attack Surface
- Moderation bypass attempts
- False positive exploitation
- Category threshold manipulation

// Confidence: HIGH (partially covered by OpenAI detector)
```

#### 3. Perspective API (Google Jigsaw) (P1)
```javascript
// API Endpoints
'commentanalyzer.googleapis.com/v1alpha1/comments:analyze'

// API Key Pattern
/AIza[a-zA-Z0-9\-_]{35}/

// Attack Surface
- Toxicity score manipulation
- Attribute threshold abuse
- Language-specific exploits

// Confidence: HIGH if endpoint found
```

#### 4. Azure Content Moderator (P1)
```javascript
// API Endpoints
'*.api.cognitive.microsoft.com/contentmoderator/',
'*.cognitiveservices.azure.com/contentmoderator/'

// Request Headers
Ocp-Apim-Subscription-Key: *

// Attack Surface
- Text/image moderation bypass
- Custom term list exposure
- Review API manipulation

// Confidence: HIGH if endpoint found
```

#### 5. AWS Rekognition Moderation (P1)
```javascript
// API Endpoints
'rekognition.*.amazonaws.com'

// Request Headers
X-Amz-Target: RekognitionService.DetectModerationLabels

// Attack Surface
- NSFW detection bypass
- Label confidence manipulation

// Confidence: MEDIUM (covered by Rekognition detector if implemented)
```

#### 6. Hive Moderation (P2)
```javascript
// API Endpoints
'api.thehive.ai/api/v2/task/sync'

// Request Headers
authorization: Token *

// Attack Surface
- Multi-modal moderation bypass
- Custom model exploitation

// Confidence: MEDIUM
```

---

## Category 10: Translation AI (8 services)

**Current Implementation**: 0/8 (0%)
**Priority**: P0 (very common)

#### 1. Google Translate Widget (P0)
```javascript
// Script URLs
'translate.google.com/translate_a/element.js',
'translate.googleapis.com/translate_static/js/'

// Global Objects
window.google.translate.TranslateElement

// DOM Selectors
'#google_translate_element',
'.goog-te-banner-frame'

// Cookies
googtrans

// Attack Surface
- Automatic translation manipulation
- Language preference tracking
- Cross-site content injection
- Privacy concerns (sends all text to Google)

// Confidence: HIGH if script + DOM element
```

#### 2. Google Cloud Translation API (P0)
```javascript
// API Endpoints
'translation.googleapis.com/language/translate/v2',
'translation.googleapis.com/v3/projects/'

// API Key Pattern
/AIza[a-zA-Z0-9\-_]{35}/

// Attack Surface
- API key exposure
- Translation manipulation
- Language detection abuse
- AutoML custom model theft

// Confidence: HIGH if endpoint found
```

#### 3. DeepL (P0)
```javascript
// Script URLs
'www.deepl.com/js/element/main.js'

// API Endpoints
'api.deepl.com/v2/translate',
'api-free.deepl.com/v2/translate'

// API Key Pattern
/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:fx/

// Request Headers
Authorization: DeepL-Auth-Key *

// Attack Surface
- Superior translation quality exploitation
- Free vs Pro API key exposure
- Glossary manipulation
- Formality level abuse

// Confidence: HIGH if endpoint or widget found
```

#### 4. Weglot (P0)
```javascript
// Script URLs
'cdn.weglot.com/weglot.min.js'

// Global Objects
window.Weglot

// Cookies
weglot_language

// DOM Selectors
'.weglot-container',
'[data-wg-notranslate]'

// Attack Surface
- SaaS translation service exposure
- Language switcher manipulation
- SEO impact (hreflang tags)
- API key in client-side code

// Confidence: HIGH if script found
```

#### 5. Lokalise (P1)
```javascript
// Script URLs
'cdn.lokalise.com/'

// API Endpoints
'api.lokalise.com/api2/projects/'

// Attack Surface
- Translation management platform
- API token exposure
- Project key leakage

// Confidence: MEDIUM
```

#### 6. Microsoft Translator (P1)
```javascript
// Script URLs
'www.microsofttranslator.com/ajax/v3/widgetv3.ashx'

// API Endpoints
'api.cognitive.microsofttranslator.com/translate'

// Request Headers
Ocp-Apim-Subscription-Key: *

// Attack Surface
- Azure Cognitive Services key exposure
- Translation manipulation
- Custom dictionary abuse

// Confidence: HIGH if endpoint or widget found
```

#### 7. Amazon Translate (P1)
```javascript
// API Endpoints
'translate.*.amazonaws.com'

// Request Headers
X-Amz-Target: AWSShineFrontendService_20170701.TranslateText

// Attack Surface
- AWS credential exposure
- Custom terminology manipulation
- Parallel data exploitation

// Confidence: MEDIUM
```

#### 8. ModernMT (P2)
```javascript
// API Endpoints
'api.modernmt.com/translate'

// Attack Surface
- Adaptive neural MT
- Context-aware translation abuse

// Confidence: LOW
```

---

## Category 11: Email & Marketing AI (8 services)

**Current Implementation**: 1/8 (13%) - HubSpot chat widget only
**Priority**: P1

#### 1. ✅ HubSpot - Already Implemented (chat widget)
Need to add: Marketing automation detection

#### 2. Mailchimp AI (P1)
```javascript
// Script URLs
'chimpstatic.com/mcjs-connected/'

// Global Objects
window.mc4wp

// Cookies
_mcid

// Attack Surface
- Email campaign tracking
- Subscriber list exposure
- A/B test manipulation
- Send time optimization abuse

// Confidence: MEDIUM
```

#### 3. Salesforce Marketing Cloud (Pardot) (P1)
```javascript
// Script URLs
'pi.pardot.com/pd.js'

// Global Objects
window.piTracker

// Cookies
visitor_id*

// Attack Surface
- Lead scoring manipulation
- Prospect tracking
- Form handler exposure

// Confidence: HIGH if script found
```

#### 4. ActiveCampaign (P1)
```javascript
// Script URLs
'trackcmp.net/visit'

// Global Objects
window.vgo

// Attack Surface
- Marketing automation tracking
- Contact scoring abuse
- Event tracking manipulation

// Confidence: MEDIUM
```

#### 5. Klaviyo (P1)
```javascript
// Script URLs
'static.klaviyo.com/onsite/js/'

// Global Objects
window.klaviyo,
window._learnq

// Cookies
__kla_id

// Attack Surface
- E-commerce email tracking
- Customer profile exposure
- Flow trigger manipulation
- SMS marketing tracking

// Confidence: HIGH if script found
```

#### 6. Sendinblue (Brevo) (P2)
```javascript
// Script URLs
'sibautomation.com/sa.js'

// Global Objects
window.sendinblue

// Cookies
sib_*

// Attack Surface
- Marketing automation
- Contact attribute manipulation

// Confidence: MEDIUM
```

#### 7. Iterable (P2)
```javascript
// Script URLs
'js.iterable.com/analytics.js'

// Global Objects
window._iaq

// Attack Surface
- Cross-channel messaging
- User event tracking

// Confidence: MEDIUM
```

#### 8. Drift Email (P1)
```javascript
// Already covered by Drift chat widget
// Add: Email campaign tracking detection

// Confidence: HIGH (already implemented)
```

---

## Category 12: Fraud Detection & Security AI (11 services)

**Current Implementation**: 7/11 (64%)
**Priority**: P2 (most common ones done)

### ✅ Already Implemented (7)

1. reCAPTCHA v3 (Google)
2. hCaptcha Enterprise
3. DataDome
4. PerimeterX
5. Cloudflare Bot Management
6. Arkose Labs
7. Shape Security

### ❌ Missing (4 services)

#### 8. Sift (P1)
```javascript
// Script URLs
'cdn.sift.com/s.js'

// Global Objects
window._sift

// Cookies
_sift_uid

// Attack Surface
- Fraud score manipulation
- Device fingerprinting
- Account takeover detection abuse

// Confidence: HIGH if script found
```

#### 9. Forter (P2)
```javascript
// Script URLs
'*.forter.com/web-api/v1/init'

// Global Objects
window.ftr,
window.forterToken

// Attack Surface
- E-commerce fraud prevention
- Chargeback protection bypass

// Confidence: MEDIUM
```

#### 10. Kount (P2)
```javascript
// Script URLs
'*.kount.net/logo.htm'

// Global Objects
window.ka

// Attack Surface
- Transaction risk scoring
- Identity verification bypass

// Confidence: MEDIUM
```

#### 11. Signifyd (P3)
```javascript
// Script URLs
'cdn-scripts.signifyd.com/api/script-tag.js'

// Global Objects
window.SIGNIFYD

// Attack Surface
- E-commerce fraud protection
- Chargeback guarantee abuse

// Confidence: LOW
```

---

## Implementation Priority Breakdown

### P0 - CRITICAL (20 services) - Implement First

**High Traffic + Easy Detection + Major Security Impact**

1. **Voice AI (4)**
   - Deepgram
   - AssemblyAI
   - ElevenLabs
   - Google Cloud Speech

2. **Translation (3)**
   - Google Translate Widget
   - DeepL
   - Weglot

3. **Search (2)**
   - Algolia
   - Elasticsearch

4. **LLM APIs (4)**
   - Together AI
   - Perplexity AI
   - Mistral AI
   - Groq

5. **Chat Widgets (4)**
   - Rocket.Chat
   - SnapEngage
   - Kayako
   - Kustomer

6. **Personalization (2)**
   - Optimizely
   - VWO

7. **Analytics (1)**
   - FullStory (session replay = major privacy risk)

### P1 - HIGH (30 services) - Implement Second

**Common Services + Moderate Detection Complexity**

- Image/Video AI (7): Midjourney, Stability AI, Runway, Replicate, Cloudinary, Rekognition, Vision API
- Voice AI (5): Google TTS, Amazon Transcribe, Polly, Azure Speech, Whisper
- Content Moderation (3): OpenAI Moderation, Perspective API, Azure Content Moderator
- Translation (3): Lokalise, Microsoft Translator, Amazon Translate
- Search (3): Coveo, Constructor.io, Meilisearch
- Personalization (4): AB Tasty, Adobe Target, LaunchDarkly, Google Optimize
- Analytics (4): LogRocket, Hotjar, Heap, Mixpanel
- Email/Marketing (1): Klaviyo

### P2 - MEDIUM (30 services) - Implement Third

**Niche Services + Specialized Use Cases**

- Chat Widgets (7): LiveAgent, Helpscout, Front, Gladly, etc.
- Recommendations (10): Dynamic Yield, Nosto, etc.
- Personalization (4): Split.io, Kameleoon, etc.
- Image/Video AI (3): Leonardo.ai, Clipdrop, etc.
- Analytics (2): Mouseflow, Crazy Egg
- Fraud Detection (2): Forter, Kount
- Voice AI (2): Speechmatics, Play.ht

### P3 - LOW (13 services) - Implement Last

**Rare Services + Complex Detection + Low ROI**

- Chat Widgets (2): Front Chat, Gladly
- Recommendations (4): RichRelevance, Certona, etc.
- Personalization (2): Unbounce, SiteSpect
- Image/Video AI (1): Pinata
- Search (1): Lucidworks Fusion
- Email Marketing (1): Iterable
- Fraud Detection (1): Signifyd
- Content Moderation (1): Hive

---

## Expected Outcomes

### Coverage Improvement
- **Current**: 38% (57/150 services)
- **After P0**: 51% (77/150)
- **After P0+P1**: 71% (107/150)
- **After P0+P1+P2**: 91% (137/150)
- **After All**: 100% (150/150)

### Security Impact
- **High-Risk Services Covered** (P0+P1): 50 services
- **Privacy-Critical Services**: FullStory, LogRocket, Hotjar (session replay)
- **API Key Exposure Risk**: 25+ new API key patterns
- **Enterprise Attack Surface**: Azure, AWS, Google Cloud services

### Market Differentiation
- **Comprehensive Coverage**: 150+ AI services (competitors: ~30-50)
- **Specialized Detectors**: Voice, Translation, Search (unique)
- **Privacy Focus**: Session replay detection (major selling point)
- **Enterprise Appeal**: Cloud provider AI services coverage

---

## Next Steps

1. **Create Individual Detector Files** (following LLM API detector pattern):
   - `voice-ai-detector.ts` (12 services)
   - `translation-ai-detector.ts` (8 services)
   - `search-ai-detector.ts` (8 services)
   - `analytics-ai-detector.ts` (10 services)
   - `personalization-detector.ts` (12 services)
   - `image-ai-detector.ts` (15 services)
   - `recommendation-detector.ts` (10 services)
   - `email-marketing-ai-detector.ts` (8 services)

2. **Integrate into AI Trust Analyzer** (not ai-detection.ts):
   - Add imports
   - Call each detector
   - Aggregate results
   - Update confidence scoring

3. **Testing Strategy**:
   - Find real websites using these services
   - Create test scan list
   - Verify detection accuracy
   - Measure false positive rate

4. **Documentation Updates**:
   - Update CURRENT_ANALYZERS_DOCUMENTATION.md
   - Add detection examples to SYSTEM_ARCHITECTURE.md
   - Update CLAUDE.md with new coverage stats

---

## Detection Pattern Template

For each new service, use this template:

```typescript
// Service Name (Priority)

// Script URLs (regex patterns)
scriptUrls: [/pattern1/i, /pattern2/i]

// Global Objects (exact strings)
globalObjects: ['window.ServiceName']

// API Endpoints (regex patterns)
endpoints: [/api\.service\.com\/v1\//i]

// API Key Pattern (regex)
apiKeyPattern: /key-[a-z0-9]{32}/

// Request Headers (header name + pattern)
headers: {
  'X-Service-Key': /[a-z0-9]{40}/,
  'Authorization': /Bearer [a-z0-9]+/
}

// Response Headers
responseHeaders: ['X-Service-Version']

// Cookies (cookie name patterns)
cookies: [/_service_.*/, 'service_session']

// DOM Selectors (CSS selectors)
domSelectors: ['#service-widget', '.service-container']

// Attack Surface (array of strings)
attackSurface: [
  'Description of attack vector 1',
  'Description of attack vector 2',
  'API key exposure risk',
  'Data leakage potential'
]

// Confidence Logic
// HIGH: endpoint + header OR script + global object + cookie
// MEDIUM: script + global object OR endpoint only
// LOW: script only OR cookie only
```

---

**End of Document**

**Total Services Documented**: 150
**Total Categories**: 12
**Implementation Priority Levels**: 4 (P0-P3)
**Expected Coverage After Full Implementation**: 100%

**Ready for Implementation**: ✅
**Next Action**: Begin P0 implementation (20 services, ~8-10 hours work)

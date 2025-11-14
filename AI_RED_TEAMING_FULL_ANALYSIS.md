# AI Red Teaming - Teljes Elemzés (Mind a 4 TXT Fájl)

**Dátum**: 2025. november 14.
**Cél**: MINDEN AI technológia azonosítása és implementálása AI Red Teaming szempontból
**Forrásfájlok**: ai_chat_chatgpt.txt, ai_chat_chatgpt_2.txt, ai_vegyes_claude.txt, ai_vegyes_gemini.txt

---

## AI Red Teaming Támadási Felület Kategóriák

### Kategória 1: AI Chat Interfészek (Conversational AI)
**Támadási vektorok**: Prompt injection, Context manipulation, PII leakage, Jailbreaking

#### 1.1 Webchat Widgetek (Már Implementálva: 30)
✅ Intercom, Drift, Zendesk Chat, LiveChat, Freshchat, HubSpot Chat, Crisp, Tidio, Tawk.to, Olark
✅ Salesforce Live Agent, LivePerson, Genesys Cloud, Help Scout Beacon, Gorgias
✅ Chatwoot, Re:amaze, Smartsupp, JivoChat, Userlike
✅ Chatbase, Voiceflow, Botpress, Dialogflow Messenger, IBM Watson Assistant
✅ Microsoft Bot Framework, Ada, Landbot, Rasa Webchat, Amazon Lex

#### 1.2 Hiányzó Népszerű Webchat Widgetek (IMPLEMENTÁLANDÓ)

| # | Szolgáltatás | Forrás | Script URL | Global Object | DOM Selector | Attack Surface |
|---|--------------|--------|------------|---------------|--------------|-----------------|
| 31 | **Chatra** | GPT#10, GPT2#39, Gemini#151 | `call.chatra.io/chatra.js`, `io.chatra.io` | `window.Chatra`, `window.ChatraID` | `.chatra-*`, `#chatra-` | NLP, Auto-responses |
| 32 | **Pure Chat** | GPT#14, Claude#52, Gemini#158 | `app.purechat.com/VisitorWidget/WidgetScript` | `window.purechatApi`, `window.PCWidget` | `.purechat-*` | Simple chatbot |
| 33 | **Zoho SalesIQ** | GPT#15, GPT2#175, Claude#53, Gemini#175 | `salesiq.zoho.com/widget`, `js.zohocdn.com/salesiq` | `window.$zoho.salesiq`, `window.$zoho.ichat` | `#zsiq_float`, `.zsiq` | AI chatbot, Intent detection |
| 34 | **HelpCrunch** | GPT#24, GPT2#62, Claude#56 | `widget.helpcrunch.com/` | `window.HelpCrunch`, `window.helpcrunchSettings` | `.helpcrunch-widget` | Auto-messaging, AI assist |
| 35 | **Kommunicate** | GPT2#65, Claude#55 | `widget.kommunicate.io/v2/kommunicate.app` | `window.kommunicate`, `window.Kommunicate` | `#kommunicate-widget-iframe` | Multi-channel AI bot |
| 36 | **LiveAgent** | GPT#21, Claude#53, Gemini#122 | `[domain].ladesk.com/scripts/track.js` | `window.LiveAgent`, `window._laq` | `#la_*` | Helpdesk with AI |
| 37 | **Rocket.Chat** | GPT#34, Claude#43 | `[workspace]/livechat/rocketchat-livechat.min.js` | `window.RocketChat` | `#rocketchat-widget`, `.LivechatLauncher` | Open-source chat, AI integrations |
| 38 | **SnapEngage** | GPT#17, GPT2#77, Claude#49 | `snapengage.com/Script/cb.js`, `app.snapengage.com/js/client.js` | `window.SnapEngage`, `window.SnapABug` | `#se-sdk-snippet` | Bot integration |
| 39 | **Kayako** | GPT#22, Claude#86, Gemini#164 | `kayako.net/visitor/`, `__kyp.kayako.net` | `window.kayako`, `window.KY` | `.kayako-*` | Helpdesk AI |
| 40 | **Kustomer** | GPT#94, Claude#75 | `cdn.kustomerapp.com/chat-web/widget.js` | `window.Kustomer` | `.kustomer-*`, `data-kustomer-api-key` | AI-powered CRM |

#### 1.3 Messenger/Social Chat Bots (IMPLEMENTÁLANDÓ - AI!)

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 41 | **ManyChat** | GPT#58, Claude#62, Gemini#182 | `widget.manychat.com/*.js`, `window.MC`, `.mcwidget-embed` | **GPT-3/4 integration**, NLP, Intent detection, Cross-platform tracking |
| 42 | **Chatfuel** | Claude#63 | `chatfuel.com`, Facebook Messenger SDK | **AI-powered flows**, NLP, User profiling |
| 43 | **MobileMonkey** | GPT#59, Claude#64 | `mobilemonkey.com`, `window.MobileMonkey`, `customers.ai` | **OmniChat AI**, Multi-channel bot |
| 44 | **Botsify** | GPT#57, Claude#65 | `botsify.com/js/widgets.js`, `window.BotsifyWidget` | **AI chatbot builder**, NLP |

**FONTOS**: Ezek Facebook Messenger botok, DE használnak AI-t (GPT integrációk, NLP), ezért **AI Red Teaming szempontból relevánsak**!

#### 1.4 Voice/Call Center AI (IMPLEMENTÁLANDÓ - KRITIKUS!)

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 45 | **Twilio Autopilot** | GPT#67, GPT2#152, Gemini#232 | `media.twiliocdn.com/sdk/js/chat/autopilot.min.js`, `window.TwilioAutopilot` | **Voice AI**, STT/TTS, Dialogflow integration, **Voice prompt injection** |
| 46 | **Twilio Flex** | GPT2#156 | `assets.flex.twilio.com/`, `window.FlexWebChat` | **Virtual agents**, Sentiment analysis, **Audio adversarial attacks** |
| 47 | **Talkdesk** | GPT#68, GPT2#235, Gemini#235 | `static.talkdeskapp.com/chat-widget.js`, `window.TalkdeskChatWidget` | **AI-powered routing**, Sentiment analysis |
| 48 | **Genesys Predictive Engagement** | Gemini#243 | (Már van Genesys Cloud) | **AI-driven engagement**, Behavioral prediction |

---

### Kategória 2: LLM API Providers (KRITIKUS - NEM IMPLEMENTÁLVA!)
**Támadási vektorok**: Prompt injection, Model theft, Data poisoning, API key exposure, Rate limit bypass

| # | Szolgáltatás | Forrás | API Endpoint | Auth Header | Attack Surface |
|---|--------------|--------|--------------|-------------|-----------------|
| 49 | **OpenAI (GPT-3/4, DALL-E)** | Claude#27, Gemini#226 | `api.openai.com/v1/`, `/chat/completions`, `/images/generations` | `Authorization: Bearer sk-*` | **Prompt injection**, Model extraction, **API key leak** |
| 50 | **Anthropic (Claude)** | Claude#27 | `api.anthropic.com/v1/messages`, `/v1/complete` | `x-api-key: sk-ant-*` | **Constitutional AI bypass**, Context stuffing |
| 51 | **Cohere** | Claude#27, Gemini#226 | `api.cohere.ai/v1/generate`, `/embed` | `Authorization: Bearer *` | **Command injection**, Embeddings manipulation |
| 52 | **Google Gemini** | Claude#25, Gemini#226 | `generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent` | `X-Goog-Api-Key: *` | **Multimodal injection** (text+image) |
| 53 | **Hugging Face Inference** | Claude#29, Gemini#226 | `api-inference.huggingface.co/models/[model_id]` | `Authorization: Bearer hf_*` | **Model-specific attacks**, Open-source model manipulation |
| 54 | **Replicate** | Claude#29, Gemini#226 | `api.replicate.com/v1/predictions` | `Authorization: Token r8_*` | **Stable Diffusion attacks**, NSFW bypass |
| 55 | **Azure OpenAI** | GPT2#92, Claude#27 | `[resource].openai.azure.com/openai/deployments/[deployment]/chat/completions` | `api-key: *` | **Enterprise data leakage**, Private endpoint exposure |
| 56 | **AWS Bedrock** | Claude#28 | `bedrock-runtime.[region].amazonaws.com/model/[model-id]/invoke` | AWS SigV4 auth | **Claude/Llama on AWS**, IAM role exploitation |
| 57 | **Google Vertex AI** | Claude#30 | `[region]-aiplatform.googleapis.com/v1/projects/[project]/locations/[location]/publishers/google/models/[model]:predict` | OAuth 2.0 | **Enterprise ML pipeline**, Service account compromise |

**DETEKTÁLÁS MÓDJA**:
1. **Network requests**: Playwright `page.on('request')` listener
2. **Script tartalom**: API endpoint URL-ek keresése JS fájlokban
3. **Headers**: Authorization/API key pattern matching
4. **Response inspection**: LLM-specific response struktúra (choices, messages, completion)

---

### Kategória 3: Voice & Speech AI (KRITIKUS - NEM IMPLEMENTÁLVA!)
**Támadási vektorok**: Audio adversarial examples, Voice deepfake, Transcription manipulation, PII in audio

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 58 | **Deepgram (STT)** | Gemini#228 | `api.deepgram.com/v1/listen`, `wss://api.deepgram.com/v1/listen` | **Whisper-based**, Adversarial audio, **Speaker diarization bypass** |
| 59 | **AssemblyAI (STT)** | Gemini#228 | `api.assemblyai.com/v2/transcript`, `/v2/realtime/ws` | **Auto-chapters**, PII detection bypass, **Sentiment manipulation** |
| 60 | **ElevenLabs (TTS)** | Claude#41, Gemini#228 | `api.elevenlabs.io/v1/text-to-speech/[voice_id]`, `/v1/voice-generation` | **Voice cloning**, Deepfake generation, **Identity theft** |
| 61 | **Google Cloud Speech-to-Text** | Gemini#228 | `speech.googleapis.com/v1/speech:recognize`, `:longrunningrecognize` | **Multi-language**, Audio injection, **PII extraction** |
| 62 | **Google Cloud Text-to-Speech** | Gemini#228 | `texttospeech.googleapis.com/v1/text:synthesize` | **WaveNet voices**, Phishing voice generation |
| 63 | **Amazon Transcribe** | - | `transcribe.[region].amazonaws.com/` | **Medical/Call analytics**, HIPAA data leakage |
| 64 | **Amazon Polly (TTS)** | - | `polly.[region].amazonaws.com/v1/speech` | **Neural voices**, Social engineering attacks |

---

### Kategória 4: Image & Video AI (MAGAS - NEM IMPLEMENTÁLVA!)
**Támadási vektorok**: NSFW bypass, Watermark removal, Deepfake generation, Copyright infringement

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 65 | **Stability AI (Stable Diffusion)** | Claude#39, Gemini#227 | `api.stability.ai/v1/generation/[engine]/text-to-image` | **NSFW filter bypass**, Prompt injection, **Harmful content generation** |
| 66 | **Midjourney** | Gemini#227 | `cdn.midjourney.com/[id]/[hash]_*.png` (output pattern), Discord API | **Watermark analysis**, Content moderation bypass |
| 67 | **DALL-E (OpenAI)** | Gemini#227 | `api.openai.com/v1/images/generations` | **Content policy bypass**, Adversarial prompts |
| 68 | **Runway ML** | Gemini#227 | `api.runwayml.com/v1/` | **Video generation**, Deepfake creation |
| 69 | **Clarifai** | Gemini#228 | `api.clarifai.com/v2/models/[model_id]/outputs` | **NSFW detection**, Adversarial images, **Model evasion** |
| 70 | **Google Vision AI** | Gemini#228 | `vision.googleapis.com/v1/images:annotate` | **OCR**, Label detection bypass, **PII in images** |
| 71 | **Amazon Rekognition** | Gemini#228 | `rekognition.[region].amazonaws.com/` | **Face recognition**, Adversarial face images, **Bias exploitation** |

---

### Kategória 5: Analytics & Behavioral AI (KÖZEPES - RÉSZBEN IMPLEMENTÁLVA)
**Támadási vektorok**: User profiling, Session replay privacy, Behavioral fingerprinting, Model poisoning

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 72 | **Heap Analytics** | Gemini#231 | `cdn.heapanalytics.com/js/heap-*.js`, `window.heap` | **Auto-capture ML**, Behavioral prediction, **PII in events** |
| 73 | **FullStory** | Gemini#231 | `rs.fullstory.com/rec.js`, `window._fs_` | **Session replay**, AI-powered search, **Password field recording** |
| 74 | **Hotjar** | - | `static.hotjar.com/c/hotjar-*.js`, `window.hj` | **Heatmaps**, User recordings, **Form field tracking** |
| 75 | **LogRocket** | - | `cdn.logrocket.io/LogRocket.min.js`, `window.LogRocket` | **Session replay**, Console logs, **Sensitive data exposure** |
| 76 | **Mixpanel** | - | `cdn.mxpnl.com/libs/mixpanel-*.min.js`, `window.mixpanel` | **Predictive analytics**, User segmentation |
| 77 | **Amplitude** | - | `cdn.amplitude.com/libs/amplitude-*.min.js`, `window.amplitude` | **Behavioral cohorts**, Predictive LTV |

---

### Kategória 6: Security & Fraud Detection AI (KRITIKUS - RÉSZBEN IMPLEMENTÁLVA)
**Támadási vektorok**: Bot detection bypass, CAPTCHA solving, Fraud model evasion, Rate limit bypass

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 78 | **Cloudflare Bot Management** | Gemini#230 | `__cf_bm` cookie, `/cdn-cgi/challenge-platform/`, `cf-ray` header | **ML-based bot detection**, Challenge bypass, **Turnstile CAPTCHA** |
| 79 | **reCAPTCHA v2/v3** | Gemini#230 | `www.google.com/recaptcha/api.js`, `www.google.com/recaptcha/enterprise.js` | **Risk score ML**, CAPTCHA farms, **Audio challenge exploitation** |
| 80 | **hCaptcha** | Gemini#230 | `hcaptcha.com/1/api.js`, `js.hcaptcha.com/1/api.js` | **Image classification**, Accessibility bypass |
| 81 | **Sift (Fraud Detection)** | Gemini#230 | `cdn.sift.com/s.js`, `window._sift` | **Fraud ML models**, Device fingerprinting, **Behavioral anomaly detection** |
| 82 | **Stripe Radar** | - | `js.stripe.com/v3/`, Stripe API responses | **Fraud scoring**, Payment pattern analysis |
| 83 | **DataDome** | - | `js.datadome.co/tags.js`, `.datadome` cookies | **Real-time bot detection**, CAPTCHA injection |
| 84 | **PerimeterX** | - | `[client-id].perimeterx.net/[app-id]/init.js`, `_px*` cookies | **Behavioral biometrics**, Challenge-response |

---

### Kategória 7: Search & Recommendation AI (KÖZEPES - NEM IMPLEMENTÁLVA)
**Támadási vektorok**: Search manipulation, Recommendation bias, Query injection, Index poisoning

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 85 | **Algolia** | Gemini#227 | `cdn.jsdelivr.net/npm/algoliasearch`, `*.algolia.net/1/indexes/`, `window.algoliasearch` | **Typo tolerance**, Search ranking manipulation, **API key exposure** |
| 86 | **Coveo** | Gemini#227 | `static.cloud.coveo.com/`, `window.Coveo` | **ML relevance**, Query suggestions, **Index access** |
| 87 | **Elasticsearch** | Gemini#227 | `/_search` endpoint, `/_cat/indices` | **Vector search**, Query DSL injection, **Cluster enumeration** |
| 88 | **Meilisearch** | - | `/indexes/[index]/search` | **Typo tolerance**, Faceted search |

---

### Kategória 8: No-Code AI Bot Builders (KÖZEPES - RÉSZBEN IMPLEMENTÁLVA)
**Támadási vektorok**: Flow manipulation, Intent hijacking, Training data poisoning, Webhook exploitation

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 89 | **Typebot** | GPT2#113, Claude#46 | `app.typebot.io`, `cdn.jsdelivr.net/npm/typebot`, `[typebot]` shortcode | **Open-source**, Self-hosted flow editor, **Webhook injection** |
| 90 | **Tock** | Claude#47 | `unpkg.com/tock-react-kit/`, `window.TockReact` | **Multi-channel**, NLU training data access |
| 91 | **BotMan** | Claude#48 | `cdn.jsdelivr.net/npm/botman-web-widget/`, `window.botmanWidget` | **PHP framework**, Webhook endpoint exposure |
| 92 | **Botonic** | Claude#113 | `@botonic/react`, `@botonic/core` NPM | **Serverless**, Lambda function exploitation |

---

### Kategória 9: Enterprise AI Platforms (MAGAS - RÉSZBEN IMPLEMENTÁLVA)
**Támadási vektorok**: Service account compromise, Data exfiltration, Model extraction, Tenant isolation bypass

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 93 | **ServiceNow Virtual Agent** | Claude#69 | `sn_va_web_client_app_embed.do`, `iframe#sn_va_web_client`, `*.service-now.com` | **Enterprise NLU**, Intent routing, **Backend API exposure** |
| 94 | **Oracle Digital Assistant** | Claude#70 | `web-sdk.js`, `window.Bots`, `Bots.init()` | **Multi-channel**, Skill invocation, **Oracle Cloud integration** |
| 95 | **SAP Conversational AI** | Claude#71 | `cai.tools.sap`, SAP CAI widget | **SAP integration**, Intent training data |
| 96 | **Nuance** | Claude#72 | `nuance.com`, Nuance Nina integration | **Healthcare AI**, HIPAA data exposure |
| 97 | **NICE inContact** | Claude#73 | `incontact.com`, NICE CXone | **Call center AI**, Recording access |
| 98 | **Avaya** | Claude#74 | `avaya.com`, Avaya OneCloud CCaaS | **Enterprise telephony**, SIP integration |

---

### Kategória 10: AI-Powered Helpdesk & CRM (KÖZEPES - RÉSZBEN IMPLEMENTÁLVA)
**Támadási vektorok**: Ticket manipulation, Knowledge base poisoning, Auto-response exploitation

| # | Szolgáltatás | Forrás | Detection | Attack Surface |
|---|--------------|--------|-----------|-----------------|
| 99 | **Front** | GPT#46, Claude#76 | `chat.frontapp.com/chat.bundle.js`, `window.FrontChat` | **AI triage**, Shared inbox intelligence |
| 100 | **Richpanel** | Claude#78 | `api.richpanel.com/v2/j/*`, `window.richpanel` | **E-commerce AI**, Customer profiling |
| 101 | **Gladly** | GPT#24, Claude#79, Gemini#188 | `cdn.gladly.com/chat-sdk/widget.js`, `window.Gladly` | **Customer-centric AI**, Thread consolidation |
| 102 | **Customerly** | Claude#60 | `CustomerlySDK`, `io.customerly` | **AI chatbot**, Behavior tracking |

---

## Implementációs Prioritás (AI Red Teaming Fókusz)

### 🔴 P0 - KRITIKUS (Azonnal implementálandó)

**LLM API Providers** (49-57):
- OpenAI, Anthropic, Cohere, Google Gemini, Hugging Face, Replicate, Azure OpenAI, AWS Bedrock

**Voice/Speech AI** (58-64):
- Deepgram, AssemblyAI, ElevenLabs, Google Speech, Amazon Transcribe/Polly

**Hiányzó Top Chat Widgetek** (31-35):
- Chatra, Pure Chat, Zoho SalesIQ, HelpCrunch, Kommunicate

### 🟡 P1 - MAGAS (Következő sprint)

**Image/Video AI** (65-71):
- Stability AI, Midjourney, DALL-E, Runway ML, Clarifai, Google Vision, Amazon Rekognition

**Security AI** (78-84):
- Cloudflare Bot Management, reCAPTCHA, hCaptcha, Sift, Stripe Radar, DataDome, PerimeterX

**Messenger Bots** (41-44):
- ManyChat, Chatfuel, MobileMonkey, Botsify

### 🟢 P2 - KÖZEPES (Később)

**Analytics AI** (72-77):
- Heap, FullStory, Hotjar, LogRocket, Mixpanel, Amplitude

**Search AI** (85-88):
- Algolia, Coveo, Elasticsearch, Meilisearch

**Additional Chat Widgetek** (36-40):
- LiveAgent, Rocket.Chat, SnapEngage, Kayako, Kustomer

---

## Összesítés

| Kategória | Összes Szolgáltatás | Implementálva | Hiányzik | Prioritás |
|-----------|---------------------|---------------|----------|-----------|
| **Chat Widgetek** | 40 | 30 (75%) | 10 | 🔴 P0 (top 5), 🟢 P2 (többi) |
| **LLM API Providers** | 9 | 0 (0%) | 9 | 🔴 P0 |
| **Voice/Speech AI** | 7 | 0 (0%) | 7 | 🔴 P0 |
| **Image/Video AI** | 7 | 0 (0%) | 7 | 🟡 P1 |
| **Security AI** | 7 | 0 (0%) | 7 | 🟡 P1 |
| **Analytics AI** | 6 | 0 (0%) | 6 | 🟢 P2 |
| **Search AI** | 4 | 0 (0%) | 4 | 🟢 P2 |
| **Messenger Bots** | 4 | 0 (0%) | 4 | 🟡 P1 |
| **Bot Builders** | 4 | 2 (50%) | 2 | 🟢 P2 |
| **Enterprise AI** | 6 | 3 (50%) | 3 | 🟢 P2 |
| **CRM/Helpdesk AI** | 4 | 1 (25%) | 3 | 🟢 P2 |
| **TOTAL** | **98** | **36 (37%)** | **62** | - |

---

## Következő Lépések

1. ✅ **Elemzés kész** - Mind a 4 txt átnézve AI Red Teaming szempontból
2. ⏳ **P0 implementáció** - LLM API + Voice AI + Top 5 Chat Widget
3. ⏳ **P1 implementáció** - Image AI + Security AI + Messenger Bots
4. ⏳ **P2 implementáció** - Analytics + Search + többi
5. ⏳ **Tesztelés** - Valós weboldalakon minden kategória
6. ⏳ **Dokumentáció** - Attack surface mapping minden szolgáltatáshoz

**Jelenlegi lefedettség: 37%** → **Cél P0 után: 70%** → **Cél P1 után: 90%** 🎯

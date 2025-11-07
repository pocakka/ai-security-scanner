# AI Provider Detection Configuration

## 📁 Fájl helye

**Szerkeszd ezt a fájlt:**
```
src/worker/analyzers/ai-detection.ts
```

---

## 🎯 Hogyan adj hozzá új AI providert?

### 1. Network-based detection (API hívások, domének)

Nyisd meg: `src/worker/analyzers/ai-detection.ts`

Keresd meg a `AI_PROVIDERS` konstanst (kb. 11. sor):

```typescript
const AI_PROVIDERS = {
  'OpenAI': ['openai.com', 'api.openai.com', 'chatgpt.com'],
  'Google Gemini': ['generativelanguage.googleapis.com', 'gemini.google.com', 'bard.google.com'],

  // ÚJ PROVIDER HOZZÁADÁSA:
  'Provider Neve': ['domain1.com', 'api.domain2.com', 'kulcsszo'],
}
```

**Példa:**
```typescript
'GPT4Business (YoloAI)': ['gpt4business.yoloai.com', 'app.gpt4business'],
'ChatSonic': ['chatsonic.com', 'writesonic.com/chatsonic'],
'Perplexity AI': ['perplexity.ai', 'api.perplexity.ai'],
```

---

### 2. DOM-based detection (HTML/JavaScript kód mintázatok)

Keresd meg a `AI_DOM_PATTERNS` konstanst (kb. 41. sor):

```typescript
const AI_DOM_PATTERNS = {
  'OpenAI ChatGPT': ['window.__oai_loghtml', '__oai_', 'chatgpt-web'],

  // ÚJ MINTA HOZZÁADÁSA:
  'Provider Neve': ['window.__kulcs__', 'script-pattern', 'html-class'],
}
```

**Példa:**
```typescript
'GPT4Business (YoloAI)': ['app.gpt4business.yoloai.com', 'gpt4business'],
'Jasper AI': ['window.jasper', 'jasper-chat-widget'],
'Copy.ai': ['window.copyai', 'copy-ai-widget'],
```

---

### 3. Chat Widget detection

Keresd meg a `CHAT_WIDGETS` konstanst (kb. 31. sor):

```typescript
const CHAT_WIDGETS = {
  intercom: ['intercom', 'intercom.io'],

  // ÚJ WIDGET:
  'widget-neve': ['pattern1', 'pattern2.com'],
}
```

**Példa:**
```typescript
'livechat': ['livechat', 'livechatinc.com'],
'tidio': ['tidio', 'tidio.co'],
'freshchat': ['freshchat', 'freshworks.com/live-chat'],
```

---

### 4. JavaScript Library detection

Keresd meg a `AI_JS_LIBRARIES` tömböt (kb. 60. sor):

```typescript
const AI_JS_LIBRARIES = [
  'openai',
  'anthropic',
  '@vercel/ai',

  // ÚJ LIBRARY:
  'library-neve',
  '@scope/library',
]
```

**Példa:**
```typescript
'@mistralai/mistralai',
'@stability/sdk',
'@elevenlabs/elevenlabs-js',
```

---

### 5. API Endpoint patterns

Keresd meg a `AI_ENDPOINTS` tömböt (kb. 47. sor):

```typescript
const AI_ENDPOINTS = [
  '/api/chat',
  '/v1/completions',

  // ÚJ ENDPOINT:
  '/your/endpoint',
]
```

**Példa:**
```typescript
'/api/ai/generate',
'/chatbot/message',
'/llm/inference',
```

---

## 🔧 Munkamenet

### 1. Szerkesztés után MINDIG restart-old a worker-t:

```bash
# Terminálban állítsd le (Ctrl+C vagy):
pkill -9 -f "tsx src/worker"

# Indítsd újra:
npm run worker
```

### 2. Tesztelés:

- Menj a http://localhost:3000 címre
- Szkennelj egy URL-t
- Ellenőrizd hogy megjelenik-e az új provider

### 3. Commit:

```bash
git add src/worker/analyzers/ai-detection.ts
git commit -m "✨ Add [Provider Name] detection"
git push
```

---

## 🚨 FONTOS SZABÁLYOK

### ❌ ROSSZ (túl általános):
```typescript
'Google Gemini': ['googleapis.com'],  // FALSE POSITIVE! (Maps, Fonts, Analytics)
'OpenAI': ['api'],                    // FALSE POSITIVE! (minden api)
```

### ✅ JÓ (specifikus):
```typescript
'Google Gemini': ['generativelanguage.googleapis.com', 'gemini.google.com'],
'OpenAI': ['openai.com', 'api.openai.com', 'chatgpt.com'],
```

### Tipp: Minél SPECIFIKUSABB, annál kevesebb false positive!

---

## 📊 Példa konfiguráció (teljes)

```typescript
const AI_PROVIDERS = {
  // LLM API-k
  'OpenAI': ['openai.com', 'api.openai.com', 'chatgpt.com'],
  'Anthropic Claude': ['anthropic.com', 'api.anthropic.com', 'claude.ai'],
  'Google Gemini': ['generativelanguage.googleapis.com', 'gemini.google.com'],
  'Mistral AI': ['mistral.ai', 'api.mistral.ai'],

  // Enterprise AI
  'Azure OpenAI': ['openai.azure.com', 'azure.com/openai'],
  'AWS Bedrock': ['bedrock-runtime', 'amazonaws.com/bedrock'],
  'Google Vertex AI': ['aiplatform.googleapis.com', 'vertexai'],

  // Image/Voice AI
  'Stability AI': ['stability.ai', 'api.stability.ai', 'dreamstudio'],
  'ElevenLabs': ['elevenlabs.io', 'api.elevenlabs.io'],
  'Midjourney': ['midjourney.com', 'discord.gg/midjourney'],

  // Business/Custom
  'GPT4Business': ['gpt4business.yoloai.com', 'app.gpt4business'],
  'Jasper AI': ['jasper.ai', 'api.jasper.ai'],
  'Copy.ai': ['copy.ai', 'api.copy.ai'],
}
```

---

## 🔍 Hogyan találd meg a mintákat?

### 1. Network Tab (Chrome DevTools):
1. Nyisd meg az oldalt
2. F12 → Network tab
3. Keress "ai", "chat", "gpt", "api" szavakra
4. Nézd meg milyen domain-ekre megy kérés

### 2. View Source:
1. Jobb klikk → View Page Source
2. Ctrl+F keresés: `<script src=`
3. Keress AI-related script URL-eket

### 3. Console (JavaScript változók):
1. F12 → Console
2. Írd be: `window`
3. Keress `__` kezdetű változókat (pl. `__oai_`, `__claude_`)

---

## 💾 Mentés

A fájl automatikusan betöltődik amikor:
- Újraindítod a worker-t (`npm run worker`)
- TypeScript újrafordul (hot reload esetén)

**MINDIG CHECK**: A worker logban látnod kell:
```
[Worker] Using REAL Playwright crawler
```

---

**Utoljára frissítve:** 2025-11-07
**Verzió:** Sprint 4A Day 2 (post-fix)

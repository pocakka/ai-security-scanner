[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/voice-ai-detector](../README.md) / VoiceAIDetection

# Interface: VoiceAIDetection

Defined in: [src/worker/analyzers/voice-ai-detector.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L18)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L19)

***

### category

> **category**: `"Voice AI (STT)"` \| `"Voice AI (TTS)"` \| `"Voice AI (STT/TTS)"` \| `"Voice AI (Voice Cloning)"`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L20)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L21)

***

### endpoints

> **endpoints**: `string`[]

Defined in: [src/worker/analyzers/voice-ai-detector.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L22)

***

### apiKeyPattern?

> `optional` **apiKeyPattern**: `string`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L23)

***

### apiKeyFound?

> `optional` **apiKeyFound**: `boolean`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L24)

***

### apiKeyMasked?

> `optional` **apiKeyMasked**: `string`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L25)

***

### sdkFound?

> `optional` **sdkFound**: `boolean`

Defined in: [src/worker/analyzers/voice-ai-detector.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L26)

***

### requestPatterns

> **requestPatterns**: `string`[]

Defined in: [src/worker/analyzers/voice-ai-detector.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L27)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/voice-ai-detector.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/voice-ai-detector.ts#L28)

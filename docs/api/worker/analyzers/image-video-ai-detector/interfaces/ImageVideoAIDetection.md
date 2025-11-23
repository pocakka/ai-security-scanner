[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/image-video-ai-detector](../README.md) / ImageVideoAIDetection

# Interface: ImageVideoAIDetection

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L26)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L27)

***

### category

> **category**: `"Image AI (Generation)"` \| `"Image AI (Processing)"` \| `"Video AI"` \| `"Image AI (Recognition)"`

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L28)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L29)

***

### endpoints

> **endpoints**: `string`[]

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L30)

***

### sdkFound?

> `optional` **sdkFound**: `boolean`

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L31)

***

### apiKeyMasked?

> `optional` **apiKeyMasked**: `string`

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L32)

***

### detectionPatterns

> **detectionPatterns**: `string`[]

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L33)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L34)

***

### riskLevel

> **riskLevel**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"CRITICAL"`

Defined in: [src/worker/analyzers/image-video-ai-detector.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/image-video-ai-detector.ts#L35)

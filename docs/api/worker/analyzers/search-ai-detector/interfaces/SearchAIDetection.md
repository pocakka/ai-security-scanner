[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/search-ai-detector](../README.md) / SearchAIDetection

# Interface: SearchAIDetection

Defined in: [src/worker/analyzers/search-ai-detector.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L24)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/search-ai-detector.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L25)

***

### category

> **category**: `"Search AI (Hosted)"` \| `"Search AI (Self-Hosted)"` \| `"Search AI (SaaS)"`

Defined in: [src/worker/analyzers/search-ai-detector.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L26)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/search-ai-detector.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L27)

***

### endpoints

> **endpoints**: `string`[]

Defined in: [src/worker/analyzers/search-ai-detector.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L28)

***

### sdkFound?

> `optional` **sdkFound**: `boolean`

Defined in: [src/worker/analyzers/search-ai-detector.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L29)

***

### apiKeyType?

> `optional` **apiKeyType**: `"Unknown"` \| `"Search-Only"` \| `"Admin"`

Defined in: [src/worker/analyzers/search-ai-detector.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L30)

***

### apiKeyMasked?

> `optional` **apiKeyMasked**: `string`

Defined in: [src/worker/analyzers/search-ai-detector.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L31)

***

### openInstanceDetected?

> `optional` **openInstanceDetected**: `boolean`

Defined in: [src/worker/analyzers/search-ai-detector.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L32)

***

### requestPatterns

> **requestPatterns**: `string`[]

Defined in: [src/worker/analyzers/search-ai-detector.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L33)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/search-ai-detector.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L34)

***

### riskLevel?

> `optional` **riskLevel**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"CRITICAL"`

Defined in: [src/worker/analyzers/search-ai-detector.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/search-ai-detector.ts#L35)

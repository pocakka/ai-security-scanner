[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/translation-ai-detector](../README.md) / TranslationAIDetection

# Interface: TranslationAIDetection

Defined in: [src/worker/analyzers/translation-ai-detector.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L20)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L21)

***

### category

> **category**: `"Translation AI (Widget)"` \| `"Translation AI (API)"` \| `"Translation AI (SaaS)"`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L22)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L23)

***

### widgetFound?

> `optional` **widgetFound**: `boolean`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L24)

***

### apiEndpointFound?

> `optional` **apiEndpointFound**: `boolean`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L25)

***

### globalObjectFound?

> `optional` **globalObjectFound**: `boolean`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L26)

***

### domElementFound?

> `optional` **domElementFound**: `boolean`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L27)

***

### cookieFound?

> `optional` **cookieFound**: `boolean`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L28)

***

### apiKeyMasked?

> `optional` **apiKeyMasked**: `string`

Defined in: [src/worker/analyzers/translation-ai-detector.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L29)

***

### detectionPatterns

> **detectionPatterns**: `string`[]

Defined in: [src/worker/analyzers/translation-ai-detector.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L30)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/translation-ai-detector.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/translation-ai-detector.ts#L31)

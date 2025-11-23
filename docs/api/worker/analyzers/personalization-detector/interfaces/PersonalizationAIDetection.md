[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/personalization-detector](../README.md) / PersonalizationAIDetection

# Interface: PersonalizationAIDetection

Defined in: [src/worker/analyzers/personalization-detector.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L24)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/personalization-detector.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L25)

***

### category

> **category**: `"Personalization & A/B Testing"`

Defined in: [src/worker/analyzers/personalization-detector.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L26)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/personalization-detector.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L27)

***

### scriptFound?

> `optional` **scriptFound**: `boolean`

Defined in: [src/worker/analyzers/personalization-detector.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L28)

***

### globalObjectFound?

> `optional` **globalObjectFound**: `boolean`

Defined in: [src/worker/analyzers/personalization-detector.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L29)

***

### cookieFound?

> `optional` **cookieFound**: `boolean`

Defined in: [src/worker/analyzers/personalization-detector.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L30)

***

### apiEndpointFound?

> `optional` **apiEndpointFound**: `boolean`

Defined in: [src/worker/analyzers/personalization-detector.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L31)

***

### detectionPatterns

> **detectionPatterns**: `string`[]

Defined in: [src/worker/analyzers/personalization-detector.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L32)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/personalization-detector.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L33)

***

### riskLevel

> **riskLevel**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"CRITICAL"`

Defined in: [src/worker/analyzers/personalization-detector.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/personalization-detector.ts#L34)

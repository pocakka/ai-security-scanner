[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/llm-api-detector](../README.md) / LLMAPIDetection

# Interface: LLMAPIDetection

Defined in: [src/worker/analyzers/llm-api-detector.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L15)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/llm-api-detector.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L16)

***

### category

> **category**: `"LLM API Provider"`

Defined in: [src/worker/analyzers/llm-api-detector.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L17)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/llm-api-detector.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L18)

***

### endpoints

> **endpoints**: `string`[]

Defined in: [src/worker/analyzers/llm-api-detector.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L19)

***

### apiKeyPattern?

> `optional` **apiKeyPattern**: `string`

Defined in: [src/worker/analyzers/llm-api-detector.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L20)

***

### apiKeyFound?

> `optional` **apiKeyFound**: `boolean`

Defined in: [src/worker/analyzers/llm-api-detector.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L21)

***

### apiKeyMasked?

> `optional` **apiKeyMasked**: `string`

Defined in: [src/worker/analyzers/llm-api-detector.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L22)

***

### requestPatterns

> **requestPatterns**: `string`[]

Defined in: [src/worker/analyzers/llm-api-detector.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L23)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/llm-api-detector.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/llm-api-detector.ts#L24)

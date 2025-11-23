[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/api-key-detector-improved](../README.md) / APIKeyPattern

# Interface: APIKeyPattern

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L12)

Improved API Key Detector with Context-Aware Detection
Based on comprehensive research from Claude, ChatGPT, and Gemini analysis

Key improvements:
1. More specific regex patterns with proper prefixes
2. Context-aware detection to reduce false positives
3. Entropy checking for generic patterns
4. Exclusion of common false positive patterns

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L13)

***

### patterns

> **patterns**: `RegExp`[]

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L14)

***

### severity

> **severity**: `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L15)

***

### costRisk

> **costRisk**: `"medium"` \| `"high"` \| `"extreme"`

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L16)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L17)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L18)

***

### requiresContext?

> `optional` **requiresContext**: `boolean`

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L19)

***

### contextKeywords?

> `optional` **contextKeywords**: `string`[]

Defined in: [src/worker/analyzers/api-key-detector-improved.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/api-key-detector-improved.ts#L20)

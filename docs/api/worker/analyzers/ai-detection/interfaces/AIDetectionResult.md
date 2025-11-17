[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ai-detection](../README.md) / AIDetectionResult

# Interface: AIDetectionResult

Defined in: [src/worker/analyzers/ai-detection.ts:5](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L5)

## Properties

### hasAI

> **hasAI**: `boolean`

Defined in: [src/worker/analyzers/ai-detection.ts:6](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L6)

***

### providers

> **providers**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:7](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L7)

***

### chatWidgets

> **chatWidgets**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:8](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L8)

***

### apiEndpoints

> **apiEndpoints**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:9](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L9)

***

### jsLibraries

> **jsLibraries**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:10](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L10)

***

### vectorDatabases?

> `optional` **vectorDatabases**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L12)

***

### mlFrameworks?

> `optional` **mlFrameworks**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L13)

***

### voiceServices?

> `optional` **voiceServices**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L14)

***

### imageServices?

> `optional` **imageServices**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L15)

***

### securityTools?

> `optional` **securityTools**: `string`[]

Defined in: [src/worker/analyzers/ai-detection.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L16)

***

### detailedFindings?

> `optional` **detailedFindings**: [`AIDetailedFinding`](AIDetailedFinding.md)[]

Defined in: [src/worker/analyzers/ai-detection.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L17)

***

### llmAPIs?

> `optional` **llmAPIs**: [`LLMAPIDetection`](../../llm-api-detector/interfaces/LLMAPIDetection.md)[]

Defined in: [src/worker/analyzers/ai-detection.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-detection.ts#L19)

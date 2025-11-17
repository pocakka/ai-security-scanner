[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm06-sensitive-info](../README.md) / SensitiveInfoResult

# Interface: SensitiveInfoResult

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:40](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L40)

## Properties

### findings

> **findings**: [`SensitiveInfoFinding`](SensitiveInfoFinding.md)[]

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:41](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L41)

***

### hasAPIKeys

> **hasAPIKeys**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:42](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L42)

***

### hasSystemPrompts

> **hasSystemPrompts**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:43](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L43)

***

### hasTrainingData

> **hasTrainingData**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:44](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L44)

***

### hasPII

> **hasPII**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:45](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L45)

***

### hasInternalEndpoints

> **hasInternalEndpoints**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:46](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L46)

***

### hasModelInfo

> **hasModelInfo**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L47)

***

### exposedDataTypes

> **exposedDataTypes**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L48)

***

### overallRisk

> **overallRisk**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L49)

***

### timeout?

> `optional` **timeout**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L50)

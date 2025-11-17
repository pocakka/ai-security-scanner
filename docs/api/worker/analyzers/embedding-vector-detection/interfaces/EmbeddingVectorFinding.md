[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/embedding-vector-detection](../README.md) / EmbeddingVectorFinding

# Interface: EmbeddingVectorFinding

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L14)

## Properties

### type

> **type**: `"embedding_vector_exposure"`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L15)

***

### severity

> **severity**: `"critical"`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L16)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L17)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L18)

***

### evidence

> **evidence**: `object`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L19)

#### vectorCount

> **vectorCount**: `number`

#### dimensions

> **dimensions**: `number`

#### file

> **file**: `string` \| `null`

#### sampleVector

> **sampleVector**: `string`

#### estimatedProvider

> **estimatedProvider**: `string`

#### confidence

> **confidence**: `"low"` \| `"medium"` \| `"high"`

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L27)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/embedding-vector-detection.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/embedding-vector-detection.ts#L28)

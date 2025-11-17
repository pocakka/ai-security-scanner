[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cors-analyzer](../README.md) / CORSResult

# Interface: CORSResult

Defined in: [src/worker/analyzers/cors-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L20)

## Properties

### findings

> **findings**: [`CORSFinding`](CORSFinding.md)[]

Defined in: [src/worker/analyzers/cors-analyzer.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L21)

***

### hasWildcardOrigin

> **hasWildcardOrigin**: `boolean`

Defined in: [src/worker/analyzers/cors-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L22)

***

### allowsCredentials

> **allowsCredentials**: `boolean`

Defined in: [src/worker/analyzers/cors-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L23)

***

### hasCORSHeaders

> **hasCORSHeaders**: `boolean`

Defined in: [src/worker/analyzers/cors-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L24)

***

### allowedMethods?

> `optional` **allowedMethods**: `string`[]

Defined in: [src/worker/analyzers/cors-analyzer.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L25)

***

### allowedHeaders?

> `optional` **allowedHeaders**: `string`[]

Defined in: [src/worker/analyzers/cors-analyzer.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L26)

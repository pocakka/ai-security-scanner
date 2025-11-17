[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/spa-api-analyzer](../README.md) / SpaApiResult

# Interface: SpaApiResult

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L31)

## Properties

### findings

> **findings**: [`SpaApiFinding`](SpaApiFinding.md)[]

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L32)

***

### isSPA

> **isSPA**: `boolean`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L33)

***

### detectedFramework?

> `optional` **detectedFramework**: `string`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L34)

***

### frameworkVersion?

> `optional` **frameworkVersion**: `string`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L35)

***

### apiEndpoints

> **apiEndpoints**: [`ApiEndpoint`](ApiEndpoint.md)[]

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L36)

***

### webSocketConnections

> **webSocketConnections**: `string`[]

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:37](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L37)

***

### hasUnprotectedEndpoints

> **hasUnprotectedEndpoints**: `boolean`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:38](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L38)

***

### hasAuthentication

> **hasAuthentication**: `boolean`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:39](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L39)

***

### riskLevel

> **riskLevel**: `"low"` \| `"medium"` \| `"high"` \| `"none"`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:40](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L40)

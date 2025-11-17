[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/passive-api-discovery-analyzer](../README.md) / DiscoveredAPI

# Interface: DiscoveredAPI

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:46](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L46)

## Properties

### url

> **url**: `string`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L47)

***

### method?

> `optional` **method**: `string`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L48)

***

### type

> **type**: `"REST"` \| `"GraphQL"` \| `"WebSocket"` \| `"Unknown"`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L49)

***

### authentication?

> `optional` **authentication**: `string`[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L50)

***

### isExternal

> **isExternal**: `boolean`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:51](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L51)

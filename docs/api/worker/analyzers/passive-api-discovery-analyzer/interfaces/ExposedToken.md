[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/passive-api-discovery-analyzer](../README.md) / ExposedToken

# Interface: ExposedToken

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:54](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L54)

## Properties

### type

> **type**: `"Unknown"` \| `"JWT"` \| `"API_KEY"` \| `"Bearer"` \| `"Session"` \| `"OAuth"`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:55](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L55)

***

### location

> **location**: `"script"` \| `"localStorage"` \| `"sessionStorage"` \| `"cookie"` \| `"inline"`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:56](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L56)

***

### pattern

> **pattern**: `string`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:57](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L57)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:58](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L58)

***

### entropy?

> `optional` **entropy**: `number`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:59](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L59)

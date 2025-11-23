[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/spa-api-analyzer](../README.md) / ApiEndpoint

# Interface: ApiEndpoint

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:10](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L10)

SPA & API Detection Analyzer

Detects Single Page Applications (SPAs) and analyzes their API communication patterns.
This analyzer identifies modern web architectures and potential API security issues.

Fully passive - analyzes network requests captured during page load.

## Properties

### url

> **url**: `string`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:11](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L11)

***

### method

> **method**: `string`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L12)

***

### type

> **type**: `"REST"` \| `"GraphQL"` \| `"WebSocket"` \| `"Unknown"` \| `"SSE"`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L13)

***

### hasAuthentication

> **hasAuthentication**: `boolean`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L14)

***

### authType?

> `optional` **authType**: `"Bearer"` \| `"API-Key"` \| `"Basic"` \| `"Cookie"` \| `"Custom"`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L15)

***

### responseType?

> `optional` **responseType**: `string`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L16)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L17)

***

### hasCORS

> **hasCORS**: `boolean`

Defined in: [src/worker/analyzers/spa-api-analyzer.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/spa-api-analyzer.ts#L18)

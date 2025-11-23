[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/web-server-security-analyzer](../README.md) / WebServerResult

# Interface: WebServerResult

Defined in: [src/worker/analyzers/web-server-security-analyzer.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/web-server-security-analyzer.ts#L32)

## Properties

### detectedServers

> **detectedServers**: `WebServer`[]

Defined in: [src/worker/analyzers/web-server-security-analyzer.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/web-server-security-analyzer.ts#L33)

***

### findings

> **findings**: `object`[]

Defined in: [src/worker/analyzers/web-server-security-analyzer.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/web-server-security-analyzer.ts#L34)

#### type

> **type**: `string`

#### category

> **category**: `string`

#### severity

> **severity**: `"info"` \| `"low"` \| `"medium"` \| `"high"` \| `"critical"`

#### title

> **title**: `string`

#### description

> **description**: `string`

#### impact

> **impact**: `string`

#### recommendation

> **recommendation**: `string`

#### evidence?

> `optional` **evidence**: `string`

***

### hasServer

> **hasServer**: `boolean`

Defined in: [src/worker/analyzers/web-server-security-analyzer.ts:44](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/web-server-security-analyzer.ts#L44)

***

### primaryServer?

> `optional` **primaryServer**: `string`

Defined in: [src/worker/analyzers/web-server-security-analyzer.ts:45](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/web-server-security-analyzer.ts#L45)

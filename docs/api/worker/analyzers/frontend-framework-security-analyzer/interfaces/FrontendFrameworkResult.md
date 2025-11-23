[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/frontend-framework-security-analyzer](../README.md) / FrontendFrameworkResult

# Interface: FrontendFrameworkResult

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L36)

## Properties

### detectedFrameworks

> **detectedFrameworks**: [`FrontendFramework`](FrontendFramework.md)[]

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:37](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L37)

***

### findings

> **findings**: `object`[]

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:38](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L38)

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

### hasFramework

> **hasFramework**: `boolean`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L48)

***

### primaryFramework?

> `optional` **primaryFramework**: `string`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L49)

***

### hasDevMode

> **hasDevMode**: `boolean`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L50)

***

### hasSourceMaps

> **hasSourceMaps**: `boolean`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:51](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L51)

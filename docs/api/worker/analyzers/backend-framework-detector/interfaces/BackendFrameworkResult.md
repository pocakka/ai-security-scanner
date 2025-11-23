[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/backend-framework-detector](../README.md) / BackendFrameworkResult

# Interface: BackendFrameworkResult

Defined in: [src/worker/analyzers/backend-framework-detector.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/backend-framework-detector.ts#L34)

## Properties

### detectedFrameworks

> **detectedFrameworks**: `BackendFramework`[]

Defined in: [src/worker/analyzers/backend-framework-detector.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/backend-framework-detector.ts#L35)

***

### findings

> **findings**: `object`[]

Defined in: [src/worker/analyzers/backend-framework-detector.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/backend-framework-detector.ts#L36)

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

Defined in: [src/worker/analyzers/backend-framework-detector.ts:46](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/backend-framework-detector.ts#L46)

***

### primaryFramework?

> `optional` **primaryFramework**: `string`

Defined in: [src/worker/analyzers/backend-framework-detector.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/backend-framework-detector.ts#L47)

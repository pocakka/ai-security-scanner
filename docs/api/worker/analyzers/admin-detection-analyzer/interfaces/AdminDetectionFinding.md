[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/admin-detection-analyzer](../README.md) / AdminDetectionFinding

# Interface: AdminDetectionFinding

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:3](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L3)

## Properties

### type

> **type**: `"admin-panel"` \| `"login-form"` \| `"authentication"` \| `"management-interface"`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:4](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L4)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:5](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L5)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:6](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L6)

***

### description?

> `optional` **description**: `string`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:7](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L7)

***

### evidence?

> `optional` **evidence**: `string` \| `string`[]

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:8](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L8)

***

### location?

> `optional` **location**: `string`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:9](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L9)

***

### impact?

> `optional` **impact**: `string`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:10](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L10)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:11](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L11)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L12)

#### paths?

> `optional` **paths**: `string`[]

#### formAction?

> `optional` **formAction**: `string`

#### inputFields?

> `optional` **inputFields**: `string`[]

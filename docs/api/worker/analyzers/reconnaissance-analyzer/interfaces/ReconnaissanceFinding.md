[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/reconnaissance-analyzer](../README.md) / ReconnaissanceFinding

# Interface: ReconnaissanceFinding

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:3](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L3)

## Properties

### type

> **type**: `"information-disclosure"` \| `"critical-exposure"` \| `"reconnaissance"`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:4](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L4)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:5](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L5)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:6](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L6)

***

### description?

> `optional` **description**: `string`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:7](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L7)

***

### evidence?

> `optional` **evidence**: `string` \| `string`[]

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:8](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L8)

***

### impact?

> `optional` **impact**: `string`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:9](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L9)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:10](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L10)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:11](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L11)

#### paths?

> `optional` **paths**: `string`[]

#### urlCount?

> `optional` **urlCount**: `number`

#### endpoints?

> `optional` **endpoints**: `string`[]

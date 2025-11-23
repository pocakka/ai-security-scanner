[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/admin-discovery-analyzer](../README.md) / AdminDiscoveryFinding

# Interface: AdminDiscoveryFinding

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:3](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L3)

## Properties

### type

> **type**: `"admin-panel"` \| `"login-form"` \| `"api-documentation"` \| `"graphql-introspection"` \| `"graphql-endpoint"` \| `"possible-admin"`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:4](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L4)

***

### severity

> **severity**: `"info"` \| `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:5](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L5)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:6](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L6)

***

### description?

> `optional` **description**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:7](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L7)

***

### url?

> `optional` **url**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:8](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L8)

***

### status?

> `optional` **status**: `number`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:9](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L9)

***

### redirectsTo?

> `optional` **redirectsTo**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:10](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L10)

***

### format?

> `optional` **format**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:11](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L11)

***

### typesCount?

> `optional` **typesCount**: `number`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L12)

***

### passwordFields?

> `optional` **passwordFields**: `number`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L13)

***

### formActions?

> `optional` **formActions**: `string`[]

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L14)

***

### indicator?

> `optional` **indicator**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L15)

***

### foundIn?

> `optional` **foundIn**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L16)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L17)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L18)

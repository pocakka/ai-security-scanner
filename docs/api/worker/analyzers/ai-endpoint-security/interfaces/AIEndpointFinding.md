[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ai-endpoint-security](../README.md) / AIEndpointFinding

# Interface: AIEndpointFinding

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L13)

## Properties

### type

> **type**: `"cors_misconfiguration_ai_endpoint"` \| `"missing_rate_limiting"`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L14)

***

### severity

> **severity**: `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L15)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L16)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L17)

***

### evidence

> **evidence**: `object`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L18)

#### endpoint

> **endpoint**: `string`

#### method

> **method**: `string`

#### allowOrigin?

> `optional` **allowOrigin**: `string`

#### allowCredentials?

> `optional` **allowCredentials**: `string`

#### allowMethods?

> `optional` **allowMethods**: `string`

#### rateLimitHeaders?

> `optional` **rateLimitHeaders**: `string`[]

#### vulnerability?

> `optional` **vulnerability**: `string`

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L27)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/ai-endpoint-security.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-endpoint-security.ts#L28)

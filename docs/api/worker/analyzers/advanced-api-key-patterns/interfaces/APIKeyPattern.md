[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/advanced-api-key-patterns](../README.md) / APIKeyPattern

# Interface: APIKeyPattern

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L14)

Advanced API Key Patterns for AI Services

Comprehensive collection of API key patterns for detection of exposed
credentials in client-side code, HTML, headers, and configuration files.

CRITICAL SECURITY RISK: Exposed API keys can lead to:
- Unlimited cost exposure ($$$)
- Data breaches
- Service abuse
- Compliance violations

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L15)

***

### patterns

> **patterns**: `RegExp`[]

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L16)

***

### severity

> **severity**: `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L17)

***

### costRisk

> **costRisk**: `"medium"` \| `"high"` \| `"extreme"`

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L18)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L19)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/advanced-api-key-patterns.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-api-key-patterns.ts#L20)

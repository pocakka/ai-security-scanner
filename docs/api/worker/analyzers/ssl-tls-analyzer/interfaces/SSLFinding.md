[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ssl-tls-analyzer](../README.md) / SSLFinding

# Interface: SSLFinding

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L22)

## Properties

### type

> **type**: `"protocol"` \| `"certificate"` \| `"cipher"` \| `"mixed_content"`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L23)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L24)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L25)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L26)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L27)

***

### evidence?

> `optional` **evidence**: `string`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L28)

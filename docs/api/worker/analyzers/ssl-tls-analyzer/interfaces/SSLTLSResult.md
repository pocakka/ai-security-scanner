[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ssl-tls-analyzer](../README.md) / SSLTLSResult

# Interface: SSLTLSResult

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:3](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L3)

## Properties

### isSecure

> **isSecure**: `boolean`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:4](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L4)

***

### protocol

> **protocol**: `string`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:5](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L5)

***

### certificate

> **certificate**: [`CertificateInfo`](CertificateInfo.md) \| `null`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:6](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L6)

***

### findings

> **findings**: [`SSLFinding`](SSLFinding.md)[]

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:7](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L7)

***

### mixedContent

> **mixedContent**: [`MixedContentIssue`](MixedContentIssue.md)[]

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:8](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L8)

***

### score

> **score**: `number`

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:9](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L9)

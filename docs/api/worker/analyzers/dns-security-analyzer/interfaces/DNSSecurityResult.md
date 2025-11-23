[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/dns-security-analyzer](../README.md) / DNSSecurityResult

# Interface: DNSSecurityResult

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L49)

## Properties

### domain

> **domain**: `string`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L50)

***

### findings

> **findings**: [`DNSFinding`](DNSFinding.md)[]

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:51](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L51)

***

### hasDNSSEC

> **hasDNSSEC**: `boolean`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:52](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L52)

***

### hasSPF

> **hasSPF**: `boolean`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:53](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L53)

***

### hasDKIM

> **hasDKIM**: `boolean`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:54](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L54)

***

### hasDMARC

> **hasDMARC**: `boolean`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:55](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L55)

***

### hasCAA

> **hasCAA**: `boolean`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:56](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L56)

***

### score

> **score**: `number`

Defined in: [src/worker/analyzers/dns-security-analyzer.ts:57](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/dns-security-analyzer.ts#L57)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/js-libraries-analyzer](../README.md) / VulnerableLibrary

# Interface: VulnerableLibrary

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L19)

## Properties

### name

> **name**: `string`

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L20)

***

### version

> **version**: `string`

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L21)

***

### cves

> **cves**: [`CVE`](../../js-library-cve-database/interfaces/CVE.md)[]

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L22)

***

### highestSeverity

> **highestSeverity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L23)

***

### vulnerabilities?

> `optional` **vulnerabilities**: `string`[]

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L25)

***

### severity?

> `optional` **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/js-libraries-analyzer.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/js-libraries-analyzer.ts#L26)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/error-disclosure-analyzer](../README.md) / ErrorDisclosureResult

# Interface: ErrorDisclosureResult

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L22)

## Properties

### findings

> **findings**: [`ErrorDisclosureFinding`](ErrorDisclosureFinding.md)[]

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L23)

***

### hasStackTraces

> **hasStackTraces**: `boolean`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L24)

***

### hasDatabaseErrors

> **hasDatabaseErrors**: `boolean`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L25)

***

### hasDebugMode

> **hasDebugMode**: `boolean`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L26)

***

### hasFilePathDisclosure

> **hasFilePathDisclosure**: `boolean`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L27)

***

### detectedFrameworks

> **detectedFrameworks**: `string`[]

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L28)

***

### riskLevel

> **riskLevel**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L29)

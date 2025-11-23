[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm02-insecure-output](../README.md) / InsecureOutputResult

# Interface: InsecureOutputResult

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L30)

## Properties

### findings

> **findings**: [`InsecureOutputFinding`](InsecureOutputFinding.md)[]

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L31)

***

### hasDangerousDOM

> **hasDangerousDOM**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L32)

***

### hasUnsafeMarkdown

> **hasUnsafeMarkdown**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L33)

***

### hasEvalUsage

> **hasEvalUsage**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L34)

***

### cspStrength

> **cspStrength**: `"medium"` \| `"none"` \| `"very-weak"` \| `"weak"` \| `"strong"` \| `"very-strong"`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L35)

***

### sanitizationLibraries

> **sanitizationLibraries**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L36)

***

### overallRisk

> **overallRisk**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:37](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L37)

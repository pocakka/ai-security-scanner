[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm02-insecure-output](../README.md) / InsecureOutputFinding

# Interface: InsecureOutputFinding

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L16)

OWASP LLM02: Insecure Output Handling Analyzer

Detects XSS vectors and unsafe output handling in AI applications.
This is a CRITICAL security issue - AI-generated content rendered unsafely can lead to XSS attacks.

Detection focuses on:
- Dangerous DOM manipulation (innerHTML, dangerouslySetInnerHTML, eval)
- Markdown library unsafe configurations
- CSP strength correlation (from Security Headers analyzer)

OWASP Reference: https://owasp.org/www-project-top-10-for-large-language-model-applications/
Priority: CRITICAL (Weight: 25/100 in OWASP scoring)

## Properties

### type

> **type**: `"dangerous-dom"` \| `"markdown-unsafe"` \| `"eval-usage"` \| `"csp-weakness"` \| `"combined-risk"`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L17)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L18)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L19)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L20)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L21)

***

### location?

> `optional` **location**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L22)

***

### codeSnippet?

> `optional` **codeSnippet**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L23)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L24)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L25)

***

### cspMitigation?

> `optional` **cspMitigation**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L26)

***

### sanitizationDetected?

> `optional` **sanitizationDetected**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L27)

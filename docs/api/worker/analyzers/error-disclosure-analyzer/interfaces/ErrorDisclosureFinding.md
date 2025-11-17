[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/error-disclosure-analyzer](../README.md) / ErrorDisclosureFinding

# Interface: ErrorDisclosureFinding

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:10](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L10)

Error Disclosure Analyzer

Detects information disclosure through error messages, stack traces, and debug output.
This is a critical security issue (OWASP A05:2021 - Security Misconfiguration).

Fully passive - analyzes only the HTML content returned by the server.

## Properties

### type

> **type**: `"stack-trace"` \| `"database-error"` \| `"debug-mode"` \| `"file-path"` \| `"exception"` \| `"warning"`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:11](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L11)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L12)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L13)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L14)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L15)

***

### framework?

> `optional` **framework**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L16)

***

### location?

> `optional` **location**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L17)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L18)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/error-disclosure-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/error-disclosure-analyzer.ts#L19)

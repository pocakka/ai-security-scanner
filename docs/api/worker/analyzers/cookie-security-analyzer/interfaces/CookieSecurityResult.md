[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-analyzer](../README.md) / CookieSecurityResult

# Interface: CookieSecurityResult

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L13)

## Properties

### totalCookies

> **totalCookies**: `number`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L14)

***

### secureCookies

> **secureCookies**: `number`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L15)

***

### insecureCookies

> **insecureCookies**: `number`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L16)

***

### findings

> **findings**: [`CookieFinding`](CookieFinding.md)[]

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L17)

***

### thirdPartyCookies

> **thirdPartyCookies**: [`ThirdPartyCookie`](ThirdPartyCookie.md)[]

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L18)

***

### enhancedFindings?

> `optional` **enhancedFindings**: [`EnhancedCookieFinding`](../../cookie-security-enhanced/interfaces/EnhancedCookieFinding.md)[]

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L19)

***

### score

> **score**: `number`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L20)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-enhanced](../README.md) / analyzeCookieDomainScope

# Function: analyzeCookieDomainScope()

> **analyzeCookieDomainScope**(`cookies`, `currentDomain`): [`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:95](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L95)

2. Cookie Domain Scope Analysis
Checks for overly broad domain settings

## Parameters

### cookies

[`CookieData`](../../../../lib/types/crawler-types/interfaces/CookieData.md)[]

### currentDomain

`string`

## Returns

[`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

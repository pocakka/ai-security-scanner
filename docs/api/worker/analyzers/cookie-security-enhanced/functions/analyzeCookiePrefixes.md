[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-enhanced](../README.md) / analyzeCookiePrefixes

# Function: analyzeCookiePrefixes()

> **analyzeCookiePrefixes**(`cookies`, `currentDomain`): [`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L29)

1. Cookie Prefix Validation
Checks __Secure- and __Host- prefixes compliance

## Parameters

### cookies

[`CookieData`](../../../../lib/types/crawler-types/interfaces/CookieData.md)[]

### currentDomain

`string`

## Returns

[`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

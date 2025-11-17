[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-enhanced](../README.md) / analyzeEnhancedCookieSecurity

# Function: analyzeEnhancedCookieSecurity()

> **analyzeEnhancedCookieSecurity**(`cookies`, `currentDomain`, `html`): [`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:540](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L540)

Main enhanced cookie analysis function

## Parameters

### cookies

[`CookieData`](../../../../lib/types/crawler-types/interfaces/CookieData.md)[]

### currentDomain

`string`

### html

`string`

## Returns

[`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-enhanced](../README.md) / detectSessionFixation

# Function: detectSessionFixation()

> **detectSessionFixation**(`cookies`, `html`): [`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:287](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L287)

5. Session Fixation Detection
Detects potential session fixation vulnerabilities

## Parameters

### cookies

[`CookieData`](../../../../lib/types/crawler-types/interfaces/CookieData.md)[]

### html

`string`

## Returns

[`EnhancedCookieFinding`](../interfaces/EnhancedCookieFinding.md)[]

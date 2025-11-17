[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-analyzer](../README.md) / analyzeCookieSecurity

# Function: analyzeCookieSecurity()

> **analyzeCookieSecurity**(`crawlResult`): [`CookieSecurityResult`](../interfaces/CookieSecurityResult.md)

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L48)

Analyze cookie security configuration
Nov 17, 2025: Reduced false positive rate from ~15-20% to <5%

Checks:
- Secure flag presence
- HttpOnly flag presence
- SameSite attribute
- Third-party cookies inventory
- Cookie expiration

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

[`CookieSecurityResult`](../interfaces/CookieSecurityResult.md)

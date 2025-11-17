[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/rate-limiting-analyzer](../README.md) / RateLimitResult

# Interface: RateLimitResult

Defined in: [src/worker/analyzers/rate-limiting-analyzer.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/rate-limiting-analyzer.ts#L27)

## Properties

### findings

> **findings**: `RateLimitFinding`[]

Defined in: [src/worker/analyzers/rate-limiting-analyzer.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/rate-limiting-analyzer.ts#L28)

***

### hasRateLimit

> **hasRateLimit**: `boolean`

Defined in: [src/worker/analyzers/rate-limiting-analyzer.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/rate-limiting-analyzer.ts#L29)

***

### hasBotProtection

> **hasBotProtection**: `boolean`

Defined in: [src/worker/analyzers/rate-limiting-analyzer.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/rate-limiting-analyzer.ts#L30)

***

### botProtectionProviders

> **botProtectionProviders**: `string`[]

Defined in: [src/worker/analyzers/rate-limiting-analyzer.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/rate-limiting-analyzer.ts#L31)

***

### rateLimitHeaders

> **rateLimitHeaders**: `Record`\<`string`, `string`\>

Defined in: [src/worker/analyzers/rate-limiting-analyzer.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/rate-limiting-analyzer.ts#L32)

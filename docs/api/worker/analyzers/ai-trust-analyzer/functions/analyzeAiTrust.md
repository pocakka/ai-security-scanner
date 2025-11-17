[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ai-trust-analyzer](../README.md) / analyzeAiTrust

# Function: analyzeAiTrust()

> **analyzeAiTrust**(`crawlResult`, `securityScore`): [`AiTrustResult`](../interfaces/AiTrustResult.md)

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:1194](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L1194)

Analyze AI Trust Score

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

Result from crawler

### securityScore

`number` = `0`

Overall security score from other analyzers

## Returns

[`AiTrustResult`](../interfaces/AiTrustResult.md)

AI Trust analysis result

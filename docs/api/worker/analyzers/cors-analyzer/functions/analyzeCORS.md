[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cors-analyzer](../README.md) / analyzeCORS

# Function: analyzeCORS()

> **analyzeCORS**(`crawlResult`): [`CORSResult`](../interfaces/CORSResult.md)

Defined in: [src/worker/analyzers/cors-analyzer.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L33)

Main CORS analysis function
Nov 17, 2025: Reduced false positives by adding context awareness (50% FP → <10%)

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

[`CORSResult`](../interfaces/CORSResult.md)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cors-analyzer](../README.md) / checkCORSBypassPatterns

# Function: checkCORSBypassPatterns()

> **checkCORSBypassPatterns**(`crawlResult`): [`CORSFinding`](../interfaces/CORSFinding.md)[]

Defined in: [src/worker/analyzers/cors-analyzer.ts:324](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cors-analyzer.ts#L324)

Check for potential CORS bypass techniques
Nov 17, 2025: Reduced false positives with context-aware detection (30% FP → <5%)

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

[`CORSFinding`](../interfaces/CORSFinding.md)[]

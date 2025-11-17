[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/reconnaissance-analyzer](../README.md) / analyzeReconnaissance

# Function: analyzeReconnaissance()

> **analyzeReconnaissance**(`crawlResult`): `Promise`\<[`ReconnaissanceResult`](../interfaces/ReconnaissanceResult.md)\>

Defined in: [src/worker/analyzers/reconnaissance-analyzer.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/reconnaissance-analyzer.ts#L32)

Analyzes reconnaissance and information disclosure vulnerabilities
Checks for exposed files, directories, and sensitive information

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

`Promise`\<[`ReconnaissanceResult`](../interfaces/ReconnaissanceResult.md)\>

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/admin-detection-analyzer](../README.md) / analyzeAdminDetection

# Function: analyzeAdminDetection()

> **analyzeAdminDetection**(`crawlResult`): `Promise`\<[`AdminDetectionResult`](../interfaces/AdminDetectionResult.md)\>

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L34)

Detects admin panels, login forms, and management interfaces

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

`Promise`\<[`AdminDetectionResult`](../interfaces/AdminDetectionResult.md)\>

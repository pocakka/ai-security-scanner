[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/admin-discovery-analyzer](../README.md) / analyzeAdminDiscovery

# Function: analyzeAdminDiscovery()

> **analyzeAdminDiscovery**(`crawlResult`): `Promise`\<[`AdminDiscoveryResult`](../interfaces/AdminDiscoveryResult.md)\>

Defined in: [src/worker/analyzers/admin-discovery-analyzer.ts:44](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-discovery-analyzer.ts#L44)

Enhanced Admin Discovery Analyzer

Implements comprehensive admin panel, API documentation, and GraphQL endpoint discovery
Based on IMPLEMENTATION_1_VERY_EASY.md section 3

Features:
- Common admin path checking (HEAD requests with redirect: manual)
- Custom admin detection via HTML analysis
- API documentation discovery (Swagger, OpenAPI)
- GraphQL introspection checking
- Login form detection

Timeout: 5 seconds max for entire analyzer

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

`Promise`\<[`AdminDiscoveryResult`](../interfaces/AdminDiscoveryResult.md)\>

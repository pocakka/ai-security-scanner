[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/tech-stack-analyzer](../README.md) / analyzeTechStack

# Function: analyzeTechStack()

> **analyzeTechStack**(`crawlResult`): [`TechStackResult`](../interfaces/TechStackResult.md)

Defined in: [src/worker/analyzers/tech-stack-analyzer.ts:181](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/tech-stack-analyzer.ts#L181)

Tech Stack Analyzer

Detects technologies used on a website similar to Wappalyzer.
Uses configurable rules from tech-detection-rules.ts

Lists ALL individual matches (plugins, tracking IDs, etc.)

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

[`TechStackResult`](../interfaces/TechStackResult.md)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/advanced-ai-detection-rules](../README.md) / AIDetectionPattern

# Interface: AIDetectionPattern

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L20)

Advanced AI Detection Rules Database

Comprehensive detection patterns for AI services, frameworks, libraries,
and security vulnerabilities based on AI Red Teaming documentation.

Categories:
- AI API Providers (12+)
- Client-side ML Frameworks (10+)
- AI Development Frameworks (8+)
- Vector Databases & RAG (10+)
- Chatbot Platforms (15+)
- Voice/Speech Services (9+)
- Image AI Services (10+)
- Security & Monitoring Tools (7+)
- AI Search Services (4+)
- Model Serving Platforms (10+)

## Properties

### name

> **name**: `string`

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L21)

***

### category

> **category**: `string`

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L22)

***

### patterns

> **patterns**: `object`[]

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L23)

#### type

> **type**: `"script"` \| `"html"` \| `"js-global"` \| `"header"` \| `"api-endpoint"` \| `"file"` \| `"port"`

#### match

> **match**: `RegExp`

#### description?

> `optional` **description**: `string`

***

### apiKeyPatterns?

> `optional` **apiKeyPatterns**: `RegExp`[]

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L28)

***

### riskLevel

> **riskLevel**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L29)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/advanced-ai-detection-rules.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/advanced-ai-detection-rules.ts#L30)

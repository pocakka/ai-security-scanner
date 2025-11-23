[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [app/api/knowledge-base/route](../README.md) / GET

# Function: GET()

> **GET**(): `Promise`\<`NextResponse`\<`object`[]\> \| `NextResponse`\<\{ `error`: `string`; \}\>\>

Defined in: [src/app/api/knowledge-base/route.ts:9](https://github.com/yourorg/ai-security-scanner/blob/main/src/app/api/knowledge-base/route.ts#L9)

GET /api/knowledge-base
Returns all knowledge base finding explanations
Used by frontend to enrich findings with E-E-A-T content

## Returns

`Promise`\<`NextResponse`\<`object`[]\> \| `NextResponse`\<\{ `error`: `string`; \}\>\>

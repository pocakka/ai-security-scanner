[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../../modules.md) / [app/api/scan/\[id\]/route](../README.md) / GET

# Function: GET()

> **GET**(`request`, `__namedParameters`): `Promise`\<`NextResponse`\<\{ `error`: `string`; \}\> \| `NextResponse`\<\{ `detectedTech`: `any`; `findings`: `any`; `metadata`: `any`; `aiTrustScorecard`: \{ `categoryScores`: `any`; `evidenceData`: `any`; `detailedChecks`: `any`; `summary`: `any`; \} \| `null`; \}\>\>

Defined in: [src/app/api/scan/\[id\]/route.ts:4](https://github.com/yourorg/ai-security-scanner/blob/main/src/app/api/scan/[id]/route.ts#L4)

## Parameters

### request

`NextRequest`

### \_\_namedParameters

#### params

`Promise`\<\{ `id`: `string`; \}\>

## Returns

`Promise`\<`NextResponse`\<\{ `error`: `string`; \}\> \| `NextResponse`\<\{ `detectedTech`: `any`; `findings`: `any`; `metadata`: `any`; `aiTrustScorecard`: \{ `categoryScores`: `any`; `evidenceData`: `any`; `detailedChecks`: `any`; `summary`: `any`; \} \| `null`; \}\>\>

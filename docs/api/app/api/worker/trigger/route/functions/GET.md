[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../../modules.md) / [app/api/worker/trigger/route](../README.md) / GET

# Function: GET()

> **GET**(`request`): `Promise`\<`NextResponse`\<\{ `success`: `boolean`; `stats`: \{ `pending`: `number`; `scanning`: `number`; `completed`: `number`; `failed`: `number`; \}; \}\> \| `NextResponse`\<\{ `success`: `boolean`; `error`: `string`; \}\>\>

Defined in: [src/app/api/worker/trigger/route.ts:108](https://github.com/yourorg/ai-security-scanner/blob/main/src/app/api/worker/trigger/route.ts#L108)

## Parameters

### request

`Request`

## Returns

`Promise`\<`NextResponse`\<\{ `success`: `boolean`; `stats`: \{ `pending`: `number`; `scanning`: `number`; `completed`: `number`; `failed`: `number`; \}; \}\> \| `NextResponse`\<\{ `success`: `boolean`; `error`: `string`; \}\>\>

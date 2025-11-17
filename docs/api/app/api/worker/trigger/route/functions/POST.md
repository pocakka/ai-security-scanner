[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../../modules.md) / [app/api/worker/trigger/route](../README.md) / POST

# Function: POST()

> **POST**(`request`): `Promise`\<`NextResponse`\<\{ `success`: `boolean`; `message`: `string`; `stats`: \{ `pending`: `number`; `scanning`: `number`; \}; \}\> \| `NextResponse`\<\{ `success`: `boolean`; `error`: `string`; `message`: `string`; \}\>\>

Defined in: [src/app/api/worker/trigger/route.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/app/api/worker/trigger/route.ts#L14)

## Parameters

### request

`Request`

## Returns

`Promise`\<`NextResponse`\<\{ `success`: `boolean`; `message`: `string`; `stats`: \{ `pending`: `number`; `scanning`: `number`; \}; \}\> \| `NextResponse`\<\{ `success`: `boolean`; `error`: `string`; `message`: `string`; \}\>\>

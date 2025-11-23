[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../../modules.md) / [app/api/workers/trigger/route](../README.md) / POST

# Function: POST()

> **POST**(`request`): `Promise`\<`NextResponse`\<\{ `success`: `boolean`; `message`: `string`; `pendingJobs`: `number`; \}\> \| `NextResponse`\<\{ `success`: `boolean`; `error`: `string`; `details`: `string`; \}\>\>

Defined in: [src/app/api/workers/trigger/route.ts:12](https://github.com/yourorg/ai-security-scanner/blob/main/src/app/api/workers/trigger/route.ts#L12)

Trigger Worker API

Manually spawns a worker to process PENDING jobs
Useful when auto-spawn fails or workers exit prematurely

## Parameters

### request

`NextRequest`

## Returns

`Promise`\<`NextResponse`\<\{ `success`: `boolean`; `message`: `string`; `pendingJobs`: `number`; \}\> \| `NextResponse`\<\{ `success`: `boolean`; `error`: `string`; `details`: `string`; \}\>\>

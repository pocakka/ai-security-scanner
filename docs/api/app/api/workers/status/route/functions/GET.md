[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../../modules.md) / [app/api/workers/status/route](../README.md) / GET

# Function: GET()

> **GET**(`request`): `Promise`\<`NextResponse`\<\{ `maxWorkers`: `number`; `activeWorkers`: `number`; `staleWorkers`: `number`; `availableSlots`: `number`; `workers`: `WorkerInfo`[]; `queue`: \{ `pending`: `number`; `processing`: `number`; `completedLastHour`: `number`; `failedLastHour`: `number`; \}; `scans`: \{ `pending`: `number`; `scanning`: `number`; `completedLastHour`: `number`; `failedLastHour`: `number`; \}; `timestamp`: `number`; \}\> \| `NextResponse`\<\{ `error`: `string`; `details`: `string`; \}\>\>

Defined in: [src/app/api/workers/status/route.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/app/api/workers/status/route.ts#L25)

Worker Status API

Returns current worker pool status and job queue statistics

## Parameters

### request

`NextRequest`

## Returns

`Promise`\<`NextResponse`\<\{ `maxWorkers`: `number`; `activeWorkers`: `number`; `staleWorkers`: `number`; `availableSlots`: `number`; `workers`: `WorkerInfo`[]; `queue`: \{ `pending`: `number`; `processing`: `number`; `completedLastHour`: `number`; `failedLastHour`: `number`; \}; `scans`: \{ `pending`: `number`; `scanning`: `number`; `completedLastHour`: `number`; `failedLastHour`: `number`; \}; `timestamp`: `number`; \}\> \| `NextResponse`\<\{ `error`: `string`; `details`: `string`; \}\>\>

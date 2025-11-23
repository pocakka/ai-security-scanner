[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [lib/queue-sqlite](../README.md) / SQLiteQueue

# Class: SQLiteQueue

Defined in: [src/lib/queue-sqlite.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/queue-sqlite.ts#L15)

## Constructors

### Constructor

> **new SQLiteQueue**(): `SQLiteQueue`

#### Returns

`SQLiteQueue`

## Methods

### add()

> **add**(`type`, `data`): `Promise`\<`string`\>

Defined in: [src/lib/queue-sqlite.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/queue-sqlite.ts#L19)

Add a new job to the queue

#### Parameters

##### type

`string`

##### data

`any`

#### Returns

`Promise`\<`string`\>

***

### getNext()

> **getNext**(): `Promise`\<\{ `id`: `string`; `type`: `string`; `data`: `any`; \} \| `null`\>

Defined in: [src/lib/queue-sqlite.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/queue-sqlite.ts#L36)

Get next pending job (for worker processing)

#### Returns

`Promise`\<\{ `id`: `string`; `type`: `string`; `data`: `any`; \} \| `null`\>

***

### complete()

> **complete**(`jobId`): `Promise`\<`void`\>

Defined in: [src/lib/queue-sqlite.ts:76](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/queue-sqlite.ts#L76)

Mark job as completed

#### Parameters

##### jobId

`string`

#### Returns

`Promise`\<`void`\>

***

### fail()

> **fail**(`jobId`, `error`): `Promise`\<`void`\>

Defined in: [src/lib/queue-sqlite.ts:91](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/queue-sqlite.ts#L91)

Mark job as failed

#### Parameters

##### jobId

`string`

##### error

`string`

#### Returns

`Promise`\<`void`\>

***

### cleanup()

> **cleanup**(`olderThanDays`): `Promise`\<`number`\>

Defined in: [src/lib/queue-sqlite.ts:117](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/queue-sqlite.ts#L117)

Clean up old completed/failed jobs (optional maintenance)

#### Parameters

##### olderThanDays

`number` = `7`

#### Returns

`Promise`\<`number`\>

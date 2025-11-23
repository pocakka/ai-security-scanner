[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/worker-manager](../README.md) / WorkerManager

# Class: WorkerManager

Defined in: [src/worker/worker-manager.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L20)

## Methods

### getInstance()

> `static` **getInstance**(): `WorkerManager`

Defined in: [src/worker/worker-manager.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L32)

#### Returns

`WorkerManager`

***

### checkExistingWorker()

> **checkExistingWorker**(): `Promise`\<`boolean`\>

Defined in: [src/worker/worker-manager.ts:112](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L112)

Check if we can start a new worker

#### Returns

`Promise`\<`boolean`\>

***

### start()

> **start**(): `Promise`\<`boolean`\>

Defined in: [src/worker/worker-manager.ts:132](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L132)

Start worker with lock

#### Returns

`Promise`\<`boolean`\>

***

### cleanup()

> **cleanup**(): `void`

Defined in: [src/worker/worker-manager.ts:196](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L196)

Clean up lock and PID files for this worker

#### Returns

`void`

***

### shutdown()

> **shutdown**(): `Promise`\<`void`\>

Defined in: [src/worker/worker-manager.ts:210](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L210)

Graceful shutdown

#### Returns

`Promise`\<`void`\>

***

### jobComplete()

> **jobComplete**(): `void`

Defined in: [src/worker/worker-manager.ts:261](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L261)

Mark job as complete and check if should continue

#### Returns

`void`

***

### shouldContinue()

> **shouldContinue**(): `boolean`

Defined in: [src/worker/worker-manager.ts:278](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/worker-manager.ts#L278)

Check if worker should continue running

#### Returns

`boolean`

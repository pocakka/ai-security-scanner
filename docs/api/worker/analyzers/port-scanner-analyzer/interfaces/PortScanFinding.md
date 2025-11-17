[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/port-scanner-analyzer](../README.md) / PortScanFinding

# Interface: PortScanFinding

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L13)

## Properties

### type

> **type**: `"database-port"` \| `"web-interface"` \| `"dev-server"` \| `"nosql-port"`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L14)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L15)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L16)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L17)

***

### port?

> `optional` **port**: `number`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L18)

***

### service?

> `optional` **service**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L19)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L20)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L21)

***

### evidence?

> `optional` **evidence**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L22)

***

### confidence?

> `optional` **confidence**: `"low"` \| `"medium"` \| `"high"`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L23)

***

### legitimateUseCase?

> `optional` **legitimateUseCase**: `string`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L24)

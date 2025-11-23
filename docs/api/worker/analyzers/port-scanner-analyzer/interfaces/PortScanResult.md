[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/port-scanner-analyzer](../README.md) / PortScanResult

# Interface: PortScanResult

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L27)

## Properties

### findings

> **findings**: [`PortScanFinding`](PortScanFinding.md)[]

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L28)

***

### exposedDatabases

> **exposedDatabases**: `number`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L29)

***

### exposedInterfaces

> **exposedInterfaces**: `number`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L30)

***

### exposedDevServers

> **exposedDevServers**: `number`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L31)

***

### score

> **score**: `number`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L32)

***

### summary

> **summary**: `object`

Defined in: [src/worker/analyzers/port-scanner-analyzer.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/port-scanner-analyzer.ts#L33)

#### critical

> **critical**: `number`

#### high

> **high**: `number`

#### medium

> **medium**: `number`

#### low

> **low**: `number`

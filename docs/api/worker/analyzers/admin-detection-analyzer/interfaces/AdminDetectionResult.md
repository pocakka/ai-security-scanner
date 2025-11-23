[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/admin-detection-analyzer](../README.md) / AdminDetectionResult

# Interface: AdminDetectionResult

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L19)

## Properties

### findings

> **findings**: [`AdminDetectionFinding`](AdminDetectionFinding.md)[]

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L20)

***

### hasAdminPanel

> **hasAdminPanel**: `boolean`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L21)

***

### hasLoginForm

> **hasLoginForm**: `boolean`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L22)

***

### score

> **score**: `number`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L23)

***

### summary

> **summary**: `object`

Defined in: [src/worker/analyzers/admin-detection-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/admin-detection-analyzer.ts#L24)

#### adminPanels

> **adminPanels**: `number`

#### loginForms

> **loginForms**: `number`

#### authEndpoints

> **authEndpoints**: `number`

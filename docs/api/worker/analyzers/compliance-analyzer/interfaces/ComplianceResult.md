[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/compliance-analyzer](../README.md) / ComplianceResult

# Interface: ComplianceResult

Defined in: [src/worker/analyzers/compliance-analyzer.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L48)

## Properties

### findings

> **findings**: `ComplianceFinding`[]

Defined in: [src/worker/analyzers/compliance-analyzer.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L49)

***

### gdprScore

> **gdprScore**: `number`

Defined in: [src/worker/analyzers/compliance-analyzer.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L50)

***

### ccpaScore

> **ccpaScore**: `number`

Defined in: [src/worker/analyzers/compliance-analyzer.ts:51](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L51)

***

### pciDssIndicators

> **pciDssIndicators**: `string`[]

Defined in: [src/worker/analyzers/compliance-analyzer.ts:52](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L52)

***

### hipaaIndicators

> **hipaaIndicators**: `string`[]

Defined in: [src/worker/analyzers/compliance-analyzer.ts:53](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L53)

***

### overallCompliance

> **overallCompliance**: `"low"` \| `"excellent"` \| `"good"` \| `"partial"`

Defined in: [src/worker/analyzers/compliance-analyzer.ts:54](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/compliance-analyzer.ts#L54)

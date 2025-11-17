[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/client-risks](../README.md) / ClientRisksResult

# Interface: ClientRisksResult

Defined in: [src/worker/analyzers/client-risks.ts:4](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/client-risks.ts#L4)

## Properties

### apiKeysFound

> **apiKeysFound**: [`APIKeyFinding`](APIKeyFinding.md)[]

Defined in: [src/worker/analyzers/client-risks.ts:5](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/client-risks.ts#L5)

***

### findings

> **findings**: [`ClientRiskFinding`](ClientRiskFinding.md)[]

Defined in: [src/worker/analyzers/client-risks.ts:6](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/client-risks.ts#L6)

***

### exposedEnvVars?

> `optional` **exposedEnvVars**: `string`[]

Defined in: [src/worker/analyzers/client-risks.ts:7](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/client-risks.ts#L7)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/scoring-v3](../README.md) / calculateSecurityScore

# Function: calculateSecurityScore()

> **calculateSecurityScore**(`findings`, `metadata?`): [`ScoringBreakdown`](../interfaces/ScoringBreakdown.md)

Defined in: [src/worker/scoring-v3.ts:237](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L237)

Main scoring function
Calculates transparent, weighted security score

## Parameters

### findings

[`Finding`](../interfaces/Finding.md)[]

### metadata?

#### hasAI?

`boolean`

#### sslCertificate?

`any`

## Returns

[`ScoringBreakdown`](../interfaces/ScoringBreakdown.md)

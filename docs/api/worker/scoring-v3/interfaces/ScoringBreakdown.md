[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/scoring-v3](../README.md) / ScoringBreakdown

# Interface: ScoringBreakdown

Defined in: [src/worker/scoring-v3.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L32)

## Properties

### overallScore

> **overallScore**: `number`

Defined in: [src/worker/scoring-v3.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L34)

***

### riskLevel

> **riskLevel**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"CRITICAL"`

Defined in: [src/worker/scoring-v3.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L35)

***

### grade

> **grade**: `string`

Defined in: [src/worker/scoring-v3.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L36)

***

### categories

> **categories**: `object`

Defined in: [src/worker/scoring-v3.ts:39](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L39)

#### criticalInfrastructure

> **criticalInfrastructure**: [`CategoryScore`](CategoryScore.md)

#### authentication

> **authentication**: [`CategoryScore`](CategoryScore.md)

#### dataProtection

> **dataProtection**: [`CategoryScore`](CategoryScore.md)

#### aiSecurity

> **aiSecurity**: [`CategoryScore`](CategoryScore.md)

#### codeQuality

> **codeQuality**: [`CategoryScore`](CategoryScore.md)

***

### penalties

> **penalties**: [`ScoringPenalty`](ScoringPenalty.md)[]

Defined in: [src/worker/scoring-v3.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L48)

***

### bonuses

> **bonuses**: [`ScoringBonus`](ScoringBonus.md)[]

Defined in: [src/worker/scoring-v3.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L49)

***

### summary

> **summary**: `object`

Defined in: [src/worker/scoring-v3.ts:52](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L52)

#### totalFindings

> **totalFindings**: `number`

#### criticalFindings

> **criticalFindings**: `number`

#### highFindings

> **highFindings**: `number`

#### mediumFindings

> **mediumFindings**: `number`

#### lowFindings

> **lowFindings**: `number`

#### infoFindings

> **infoFindings**: `number`

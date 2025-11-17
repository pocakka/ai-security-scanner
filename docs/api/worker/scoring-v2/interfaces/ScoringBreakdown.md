[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/scoring-v2](../README.md) / ScoringBreakdown

# Interface: ScoringBreakdown

Defined in: [src/worker/scoring-v2.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L18)

Professional Security Risk Scoring System v2.0

Based on industry standards:
- CVSS 3.1 (Common Vulnerability Scoring System)
- OWASP Risk Rating Methodology
- NIST Cybersecurity Framework
- CIS Controls

Key improvements over v1:
1. Category-based weighted scoring (not all findings are equal)
2. Transparent score breakdown for glass-box auditing
3. Realistic risk levels based on actual exploitability
4. Diminishing returns (10 low findings != 1 critical)
5. Positive scoring for good security practices

## Properties

### categories

> **categories**: `object`

Defined in: [src/worker/scoring-v2.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L20)

#### criticalInfrastructure

> **criticalInfrastructure**: [`CategoryScore`](CategoryScore.md)

#### authentication

> **authentication**: [`CategoryScore`](CategoryScore.md)

#### dataProtection

> **dataProtection**: [`CategoryScore`](CategoryScore.md)

#### codeQuality

> **codeQuality**: [`CategoryScore`](CategoryScore.md)

#### aiSecurity

> **aiSecurity**: [`CategoryScore`](CategoryScore.md)

#### compliance

> **compliance**: [`CategoryScore`](CategoryScore.md)

***

### overallScore

> **overallScore**: `number`

Defined in: [src/worker/scoring-v2.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L30)

***

### riskLevel

> **riskLevel**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"CRITICAL"`

Defined in: [src/worker/scoring-v2.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L31)

***

### grade

> **grade**: `string`

Defined in: [src/worker/scoring-v2.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L32)

***

### penalties

> **penalties**: [`ScoringPenalty`](ScoringPenalty.md)[]

Defined in: [src/worker/scoring-v2.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L35)

***

### bonuses

> **bonuses**: [`ScoringBonus`](ScoringBonus.md)[]

Defined in: [src/worker/scoring-v2.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L36)

***

### summary

> **summary**: `object`

Defined in: [src/worker/scoring-v2.ts:39](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v2.ts#L39)

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

#### passedChecks

> **passedChecks**: `number`

#### failedChecks

> **failedChecks**: `number`

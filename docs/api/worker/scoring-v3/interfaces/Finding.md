[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/scoring-v3](../README.md) / Finding

# Interface: Finding

Defined in: [src/worker/scoring-v3.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L23)

Professional Security Scoring System v3.0

INTUITIVE SCALE: 100 = Perfect Security, 0 = Critical Failure
"Higher is Better" - easy to understand for clients

Based on industry standards:
- OWASP Risk Rating Methodology v4.0
- CVSS 3.1 (Common Vulnerability Scoring System)
- NIST Cybersecurity Framework 2.0
- CIS Controls v8

Key Design Principles:
1. Start at 100 points (perfect security)
2. Deduct points for findings (transparent penalties)
3. Category-based weighted scoring (SSL > JS libraries)
4. Diminishing returns (10 low ≠ 1 critical)
5. Clear grade system (A+ to F)

## Properties

### category

> **category**: `string`

Defined in: [src/worker/scoring-v3.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L24)

***

### severity

> **severity**: `"info"` \| `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/scoring-v3.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L25)

***

### title

> **title**: `string`

Defined in: [src/worker/scoring-v3.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L26)

***

### description

> **description**: `string`

Defined in: [src/worker/scoring-v3.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L27)

***

### impact?

> `optional` **impact**: `string`

Defined in: [src/worker/scoring-v3.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L28)

***

### recommendation?

> `optional` **recommendation**: `string`

Defined in: [src/worker/scoring-v3.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring-v3.ts#L29)

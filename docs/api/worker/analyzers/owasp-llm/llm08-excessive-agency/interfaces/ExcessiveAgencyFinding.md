[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm08-excessive-agency](../README.md) / ExcessiveAgencyFinding

# Interface: ExcessiveAgencyFinding

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L16)

OWASP LLM08: Excessive Agency Analyzer

Detects AI agents with excessive permissions or autonomy that could be exploited
through prompt injection to perform unauthorized actions without human oversight.

Detection Strategy (Passive Only):
1. Dangerous Function Detection - Shell, file system, database operations
2. Sandbox Analysis - VM isolation, permission systems, rate limiting
3. Auto-Execute Detection - Tools run without human approval
4. Privilege Escalation - User context ignored, admin access unrestricted

OWASP Priority: MEDIUM (Weight: 12/100)

## Properties

### type

> **type**: `"no-approval"` \| `"no-sandbox"` \| `"privilege-escalation"` \| `"auto-execute"` \| `"missing-controls"`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L17)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L18)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L19)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L20)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L21)

***

### mitigations?

> `optional` **mitigations**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L22)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L23)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L24)

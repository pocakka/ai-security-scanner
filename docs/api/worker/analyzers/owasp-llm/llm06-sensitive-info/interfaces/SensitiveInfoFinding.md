[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm06-sensitive-info](../README.md) / SensitiveInfoFinding

# Interface: SensitiveInfoFinding

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L25)

OWASP LLM06: Sensitive Information Disclosure Analyzer

Detects sensitive information leaks in AI applications:
1. Training data exposure (prompts, examples, fine-tuning data)
2. System prompts in client-side code
3. PII (Personally Identifiable Information) in code/comments
4. Internal API endpoints and infrastructure details
5. Model architecture and hyperparameters
6. Business logic and proprietary algorithms

Risk Levels:
- CRITICAL: API keys, passwords, authentication tokens
- HIGH: System prompts, training data, PII, internal endpoints
- MEDIUM: Model architecture, hyperparameters, business logic
- LOW: Verbose error messages, debug information

Passive Detection Only:
- Analyzes JavaScript, HTML comments, and inline data
- Pattern matching for sensitive data types
- Entropy analysis for high-entropy strings (potential secrets)
- Context-aware false positive reduction

## Properties

### type

> **type**: `"api-key"` \| `"system-prompt"` \| `"training-data"` \| `"pii"` \| `"internal-endpoint"` \| `"model-info"` \| `"business-logic"` \| `"debug-info"`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L26)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L27)

***

### confidence

> **confidence**: `"low"` \| `"medium"` \| `"high"` \| `"confirmed"`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L28)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L29)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L30)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L31)

***

### dataType?

> `optional` **dataType**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L32)

***

### redactedValue?

> `optional` **redactedValue**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L33)

***

### location

> **location**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L34)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L35)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L36)

***

### confidenceReason?

> `optional` **confidenceReason**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts:37](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm06-sensitive-info.ts#L37)

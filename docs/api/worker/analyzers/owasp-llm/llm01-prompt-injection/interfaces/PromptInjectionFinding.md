[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm01-prompt-injection](../README.md) / PromptInjectionFinding

# Interface: PromptInjectionFinding

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L16)

OWASP LLM01: Prompt Injection Risk Analyzer

Detects vulnerabilities where user input can manipulate AI system prompts,
potentially causing the AI to ignore safety guidelines or reveal sensitive information.

Detection Strategy (Passive Only):
1. System Prompt Leaks - hardcoded prompts in client-side code
2. Risky Prompt Assembly - user input concatenation without sanitization
3. Input Sanitization Analysis - checks if proper input validation exists
4. AI Context Correlation - proximity to AI API calls

OWASP Priority: HIGH (Weight: 20/100)

## Properties

### type

> **type**: `"system-prompt-leak"` \| `"risky-prompt-assembly"` \| `"missing-sanitization"` \| `"ai-context-risk"`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L17)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L18)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L19)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L20)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L21)

***

### location?

> `optional` **location**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L22)

***

### codeSnippet?

> `optional` **codeSnippet**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L23)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L24)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L25)

***

### hasAIContext?

> `optional` **hasAIContext**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L26)

***

### hasSanitization?

> `optional` **hasSanitization**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L27)

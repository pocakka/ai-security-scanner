[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm01-prompt-injection](../README.md) / PromptInjectionResult

# Interface: PromptInjectionResult

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L30)

## Properties

### findings

> **findings**: [`PromptInjectionFinding`](PromptInjectionFinding.md)[]

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L31)

***

### hasSystemPromptLeaks

> **hasSystemPromptLeaks**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L32)

***

### hasRiskyPromptAssembly

> **hasRiskyPromptAssembly**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L33)

***

### hasMissingSanitization

> **hasMissingSanitization**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L34)

***

### hasAIContext

> **hasAIContext**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L35)

***

### sanitizationMethods

> **sanitizationMethods**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L36)

***

### overallRisk

> **overallRisk**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:37](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L37)

***

### aiEndpointsDetected

> **aiEndpointsDetected**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:38](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L38)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ai-prompt-exposure](../README.md) / SystemPromptFinding

# Interface: SystemPromptFinding

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:13](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L13)

## Properties

### type

> **type**: `"system_prompt_exposure"`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L14)

***

### severity

> **severity**: `"critical"`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:15](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L15)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L16)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L17)

***

### evidence

> **evidence**: `object`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L18)

#### prompt

> **prompt**: `string`

#### file

> **file**: `string` \| `null`

#### context

> **context**: `string`

#### confidence

> **confidence**: `"low"` \| `"medium"` \| `"high"`

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L24)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/ai-prompt-exposure.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-prompt-exposure.ts#L25)

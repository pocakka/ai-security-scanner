[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm01-prompt-injection](../README.md) / analyzeLLM01PromptInjection

# Function: analyzeLLM01PromptInjection()

> **analyzeLLM01PromptInjection**(`html`, `responseHeaders`): `Promise`\<[`PromptInjectionResult`](../interfaces/PromptInjectionResult.md)\>

Defined in: [src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts:44](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm01-prompt-injection.ts#L44)

Analyze HTML for prompt injection vulnerabilities

## Parameters

### html

`string`

### responseHeaders

`Record`\<`string`, `string`\>

## Returns

`Promise`\<[`PromptInjectionResult`](../interfaces/PromptInjectionResult.md)\>

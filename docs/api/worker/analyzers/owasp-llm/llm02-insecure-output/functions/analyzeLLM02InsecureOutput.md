[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm02-insecure-output](../README.md) / analyzeLLM02InsecureOutput

# Function: analyzeLLM02InsecureOutput()

> **analyzeLLM02InsecureOutput**(`html`, `responseHeaders`): `Promise`\<[`InsecureOutputResult`](../interfaces/InsecureOutputResult.md)\>

Defined in: [src/worker/analyzers/owasp-llm/llm02-insecure-output.ts:291](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm02-insecure-output.ts#L291)

## Parameters

### html

`string`

### responseHeaders

`Record`\<`string`, `string`\> = `{}`

## Returns

`Promise`\<[`InsecureOutputResult`](../interfaces/InsecureOutputResult.md)\>

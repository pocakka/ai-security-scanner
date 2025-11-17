[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm08-excessive-agency](../README.md) / analyzeLLM08ExcessiveAgency

# Function: analyzeLLM08ExcessiveAgency()

> **analyzeLLM08ExcessiveAgency**(`html`, `responseHeaders`): `Promise`\<[`ExcessiveAgencyResult`](../interfaces/ExcessiveAgencyResult.md)\>

Defined in: [src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts:40](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm08-excessive-agency.ts#L40)

Analyze HTML for excessive agency vulnerabilities

## Parameters

### html

`string`

### responseHeaders

`Record`\<`string`, `string`\>

## Returns

`Promise`\<[`ExcessiveAgencyResult`](../interfaces/ExcessiveAgencyResult.md)\>

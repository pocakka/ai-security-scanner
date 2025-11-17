[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm07-plugin-design](../README.md) / analyzeLLM07PluginDesign

# Function: analyzeLLM07PluginDesign()

> **analyzeLLM07PluginDesign**(`html`, `responseHeaders`): `Promise`\<[`PluginDesignResult`](../interfaces/PluginDesignResult.md)\>

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:58](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L58)

Analyze HTML for insecure plugin/tool definitions

## Parameters

### html

`string`

### responseHeaders

`Record`\<`string`, `string`\>

## Returns

`Promise`\<[`PluginDesignResult`](../interfaces/PluginDesignResult.md)\>

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm07-plugin-design](../README.md) / PluginDesignFinding

# Interface: PluginDesignFinding

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L16)

OWASP LLM07: Insecure Plugin Design Analyzer

Detects vulnerable AI plugin/tool definitions that grant excessive permissions
or enable dangerous operations (code execution, file system access, etc.)

Detection Strategy (Passive Only):
1. Tool Definition Detection - OpenAI, LangChain, custom tool schemas
2. Risk Categorization - CRITICAL/HIGH/MEDIUM/LOW based on capability
3. Plugin Architecture Analysis - Variable names, object structures
4. Dangerous Function Detection - eval, exec, shell, file system access

OWASP Priority: HIGH (Weight: 15/100)

## Properties

### type

> **type**: `"critical-tool"` \| `"high-risk-tool"` \| `"medium-risk-tool"` \| `"insecure-definition"`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L17)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L18)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L19)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L20)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L21)

***

### toolName?

> `optional` **toolName**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L22)

***

### riskCategory?

> `optional` **riskCategory**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L23)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L24)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L25)

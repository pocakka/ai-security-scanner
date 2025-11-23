[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm07-plugin-design](../README.md) / PluginDesignResult

# Interface: PluginDesignResult

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L28)

## Properties

### findings

> **findings**: [`PluginDesignFinding`](PluginDesignFinding.md)[]

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L29)

***

### hasCriticalTools

> **hasCriticalTools**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L30)

***

### hasHighRiskTools

> **hasHighRiskTools**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L31)

***

### detectedTools

> **detectedTools**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L32)

***

### toolArchitectures

> **toolArchitectures**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L33)

***

### overallRisk

> **overallRisk**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/owasp-llm/llm07-plugin-design.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm07-plugin-design.ts#L34)

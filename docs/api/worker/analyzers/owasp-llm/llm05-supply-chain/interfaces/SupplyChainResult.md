[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm05-supply-chain](../README.md) / SupplyChainResult

# Interface: SupplyChainResult

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:39](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L39)

## Properties

### findings

> **findings**: [`SupplyChainFinding`](SupplyChainFinding.md)[]

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:40](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L40)

***

### hasVulnerablePackages

> **hasVulnerablePackages**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:41](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L41)

***

### hasMissingSRI

> **hasMissingSRI**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:42](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L42)

***

### hasUntrustedModels

> **hasUntrustedModels**: `boolean`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:43](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L43)

***

### vulnerablePackages

> **vulnerablePackages**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:44](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L44)

***

### missingIntegrity

> **missingIntegrity**: `number`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:45](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L45)

***

### untrustedModelSources

> **untrustedModelSources**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:46](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L46)

***

### overallRisk

> **overallRisk**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L47)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../../modules.md) / [worker/analyzers/owasp-llm/llm05-supply-chain](../README.md) / SupplyChainFinding

# Interface: SupplyChainFinding

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L24)

OWASP LLM05: Supply Chain Vulnerabilities Analyzer

Detects supply chain security risks in AI/ML applications:
1. Vulnerable npm packages (outdated, known CVEs)
2. CDN integrity issues (missing SRI hashes)
3. Untrusted model sources (HuggingFace, custom URLs)
4. Dependency confusion risks
5. Outdated AI libraries (transformers, langchain, openai)

Risk Levels:
- CRITICAL: Known CVEs in AI libraries, compromised model sources
- HIGH: Missing SRI on CDN, outdated packages with security issues
- MEDIUM: Untrusted model sources, dependency confusion risks
- LOW: Minor version updates available

Passive Detection Only:
- Analyzes package.json references
- Checks script tags for SRI attributes
- Detects model loading patterns
- Version comparison with known vulnerable versions

## Properties

### type

> **type**: `"vulnerable-package"` \| `"missing-sri"` \| `"untrusted-model"` \| `"outdated-ai-lib"` \| `"dependency-confusion"`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L25)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L26)

***

### title

> **title**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L27)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L28)

***

### evidence

> **evidence**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L29)

***

### packageName?

> `optional` **packageName**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L30)

***

### currentVersion?

> `optional` **currentVersion**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L31)

***

### recommendedVersion?

> `optional` **recommendedVersion**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L32)

***

### cveIds?

> `optional` **cveIds**: `string`[]

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L33)

***

### modelSource?

> `optional` **modelSource**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L34)

***

### impact

> **impact**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L35)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/owasp-llm/llm05-supply-chain.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/owasp-llm/llm05-supply-chain.ts#L36)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/report-generator](../README.md) / ScanReport

# Interface: ScanReport

Defined in: [src/worker/report-generator.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L33)

## Properties

### summary

> **summary**: `object`

Defined in: [src/worker/report-generator.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L34)

#### hasAI

> **hasAI**: `boolean`

#### riskScore

> **riskScore**: [`RiskScore`](../../scoring/interfaces/RiskScore.md)

#### criticalIssues

> **criticalIssues**: `number`

#### highIssues

> **highIssues**: `number`

#### mediumIssues

> **mediumIssues**: `number`

#### lowIssues

> **lowIssues**: `number`

***

### detectedTech

> **detectedTech**: `object`

Defined in: [src/worker/report-generator.ts:42](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L42)

#### aiProviders

> **aiProviders**: `string`[]

#### chatWidgets

> **chatWidgets**: `string`[]

***

### techStack?

> `optional` **techStack**: [`TechStackResult`](../../analyzers/tech-stack-analyzer/interfaces/TechStackResult.md)

Defined in: [src/worker/report-generator.ts:46](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L46)

***

### sslTLS?

> `optional` **sslTLS**: [`SSLTLSResult`](../../analyzers/ssl-tls-analyzer/interfaces/SSLTLSResult.md)

Defined in: [src/worker/report-generator.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L47)

***

### cookieSecurity?

> `optional` **cookieSecurity**: [`CookieSecurityResult`](../../analyzers/cookie-security-analyzer/interfaces/CookieSecurityResult.md)

Defined in: [src/worker/report-generator.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L48)

***

### jsLibraries?

> `optional` **jsLibraries**: [`JSLibrariesResult`](../../analyzers/js-libraries-analyzer/interfaces/JSLibrariesResult.md)

Defined in: [src/worker/report-generator.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L49)

***

### reconnaissance?

> `optional` **reconnaissance**: [`ReconnaissanceResult`](../../analyzers/reconnaissance-analyzer/interfaces/ReconnaissanceResult.md)

Defined in: [src/worker/report-generator.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L50)

***

### adminDiscovery?

> `optional` **adminDiscovery**: [`AdminDiscoveryResult`](../../analyzers/admin-discovery-analyzer/interfaces/AdminDiscoveryResult.md)

Defined in: [src/worker/report-generator.ts:51](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L51)

***

### corsAnalysis?

> `optional` **corsAnalysis**: [`CORSResult`](../../analyzers/cors-analyzer/interfaces/CORSResult.md)

Defined in: [src/worker/report-generator.ts:52](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L52)

***

### dnsAnalysis?

> `optional` **dnsAnalysis**: [`DNSSecurityResult`](../../analyzers/dns-security-analyzer/interfaces/DNSSecurityResult.md)

Defined in: [src/worker/report-generator.ts:53](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L53)

***

### portScan?

> `optional` **portScan**: [`PortScanResult`](../../analyzers/port-scanner-analyzer/interfaces/PortScanResult.md)

Defined in: [src/worker/report-generator.ts:54](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L54)

***

### compliance?

> `optional` **compliance**: [`ComplianceResult`](../../analyzers/compliance-analyzer/interfaces/ComplianceResult.md)

Defined in: [src/worker/report-generator.ts:55](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L55)

***

### wafDetection?

> `optional` **wafDetection**: [`WAFResult`](../../analyzers/waf-detection-analyzer/interfaces/WAFResult.md)

Defined in: [src/worker/report-generator.ts:56](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L56)

***

### mfaDetection?

> `optional` **mfaDetection**: [`MFAResult`](../../analyzers/mfa-detection-analyzer/interfaces/MFAResult.md)

Defined in: [src/worker/report-generator.ts:57](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L57)

***

### rateLimiting?

> `optional` **rateLimiting**: [`RateLimitResult`](../../analyzers/rate-limiting-analyzer/interfaces/RateLimitResult.md)

Defined in: [src/worker/report-generator.ts:58](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L58)

***

### graphqlSecurity?

> `optional` **graphqlSecurity**: [`GraphQLResult`](../../analyzers/graphql-analyzer/interfaces/GraphQLResult.md)

Defined in: [src/worker/report-generator.ts:59](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L59)

***

### errorDisclosure?

> `optional` **errorDisclosure**: [`ErrorDisclosureResult`](../../analyzers/error-disclosure-analyzer/interfaces/ErrorDisclosureResult.md)

Defined in: [src/worker/report-generator.ts:60](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L60)

***

### spaApi?

> `optional` **spaApi**: [`SpaApiResult`](../../analyzers/spa-api-analyzer/interfaces/SpaApiResult.md)

Defined in: [src/worker/report-generator.ts:61](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L61)

***

### llm01PromptInjection?

> `optional` **llm01PromptInjection**: [`PromptInjectionResult`](../../analyzers/owasp-llm/llm01-prompt-injection/interfaces/PromptInjectionResult.md)

Defined in: [src/worker/report-generator.ts:62](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L62)

***

### llm02InsecureOutput?

> `optional` **llm02InsecureOutput**: [`InsecureOutputResult`](../../analyzers/owasp-llm/llm02-insecure-output/interfaces/InsecureOutputResult.md)

Defined in: [src/worker/report-generator.ts:63](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L63)

***

### llm05SupplyChain?

> `optional` **llm05SupplyChain**: [`SupplyChainResult`](../../analyzers/owasp-llm/llm05-supply-chain/interfaces/SupplyChainResult.md)

Defined in: [src/worker/report-generator.ts:64](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L64)

***

### llm06SensitiveInfo?

> `optional` **llm06SensitiveInfo**: [`SensitiveInfoResult`](../../analyzers/owasp-llm/llm06-sensitive-info/interfaces/SensitiveInfoResult.md)

Defined in: [src/worker/report-generator.ts:65](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L65)

***

### llm07PluginDesign?

> `optional` **llm07PluginDesign**: [`PluginDesignResult`](../../analyzers/owasp-llm/llm07-plugin-design/interfaces/PluginDesignResult.md)

Defined in: [src/worker/report-generator.ts:66](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L66)

***

### llm08ExcessiveAgency?

> `optional` **llm08ExcessiveAgency**: [`ExcessiveAgencyResult`](../../analyzers/owasp-llm/llm08-excessive-agency/interfaces/ExcessiveAgencyResult.md)

Defined in: [src/worker/report-generator.ts:67](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L67)

***

### backendFramework?

> `optional` **backendFramework**: [`BackendFrameworkResult`](../../analyzers/backend-framework-detector/interfaces/BackendFrameworkResult.md)

Defined in: [src/worker/report-generator.ts:68](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L68)

***

### webServer?

> `optional` **webServer**: [`WebServerResult`](../../analyzers/web-server-security-analyzer/interfaces/WebServerResult.md)

Defined in: [src/worker/report-generator.ts:69](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L69)

***

### frontendFramework?

> `optional` **frontendFramework**: [`FrontendFrameworkResult`](../../analyzers/frontend-framework-security-analyzer/interfaces/FrontendFrameworkResult.md)

Defined in: [src/worker/report-generator.ts:70](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L70)

***

### passiveAPI?

> `optional` **passiveAPI**: [`PassiveAPIDiscoveryResult`](../../analyzers/passive-api-discovery-analyzer/interfaces/PassiveAPIDiscoveryResult.md)

Defined in: [src/worker/report-generator.ts:71](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L71)

***

### scoreBreakdown?

> `optional` **scoreBreakdown**: `any`

Defined in: [src/worker/report-generator.ts:72](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L72)

***

### findings

> **findings**: [`Finding`](Finding.md)[]

Defined in: [src/worker/report-generator.ts:73](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L73)

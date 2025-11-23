[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/report-generator](../README.md) / generateReport

# Function: generateReport()

> **generateReport**(`aiDetection`, `securityHeaders`, `clientRisks`, `riskScore`, `sslTLS?`, `cookieSecurity?`, `jsLibraries?`, `techStack?`, `reconnaissance?`, `adminDetection?`, `adminDiscovery?`, `corsAnalysis?`, `dnsAnalysis?`, `portScan?`, `compliance?`, `wafDetection?`, `mfaDetection?`, `rateLimiting?`, `graphqlSecurity?`, `errorDisclosure?`, `spaApi?`, `llm01PromptInjection?`, `llm02InsecureOutput?`, `llm05SupplyChain?`, `llm06SensitiveInfo?`, `llm07PluginDesign?`, `llm08ExcessiveAgency?`, `backendFramework?`, `webServer?`, `frontendFramework?`, `passiveAPI?`): [`ScanReport`](../interfaces/ScanReport.md)

Defined in: [src/worker/report-generator.ts:87](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L87)

## Parameters

### aiDetection

[`AIDetectionResult`](../../analyzers/ai-detection/interfaces/AIDetectionResult.md)

### securityHeaders

[`SecurityHeadersResult`](../../analyzers/security-headers/interfaces/SecurityHeadersResult.md)

### clientRisks

[`ClientRisksResult`](../../analyzers/client-risks/interfaces/ClientRisksResult.md)

### riskScore

[`RiskScore`](../../scoring/interfaces/RiskScore.md)

### sslTLS?

[`SSLTLSResult`](../../analyzers/ssl-tls-analyzer/interfaces/SSLTLSResult.md)

### cookieSecurity?

[`CookieSecurityResult`](../../analyzers/cookie-security-analyzer/interfaces/CookieSecurityResult.md)

### jsLibraries?

[`JSLibrariesResult`](../../analyzers/js-libraries-analyzer/interfaces/JSLibrariesResult.md)

### techStack?

[`TechStackResult`](../../analyzers/tech-stack-analyzer/interfaces/TechStackResult.md)

### reconnaissance?

[`ReconnaissanceResult`](../../analyzers/reconnaissance-analyzer/interfaces/ReconnaissanceResult.md)

### adminDetection?

[`AdminDetectionResult`](../../analyzers/admin-detection-analyzer/interfaces/AdminDetectionResult.md)

### adminDiscovery?

[`AdminDiscoveryResult`](../../analyzers/admin-discovery-analyzer/interfaces/AdminDiscoveryResult.md)

### corsAnalysis?

[`CORSResult`](../../analyzers/cors-analyzer/interfaces/CORSResult.md) & `object`

### dnsAnalysis?

[`DNSSecurityResult`](../../analyzers/dns-security-analyzer/interfaces/DNSSecurityResult.md)

### portScan?

[`PortScanResult`](../../analyzers/port-scanner-analyzer/interfaces/PortScanResult.md)

### compliance?

[`ComplianceResult`](../../analyzers/compliance-analyzer/interfaces/ComplianceResult.md)

### wafDetection?

[`WAFResult`](../../analyzers/waf-detection-analyzer/interfaces/WAFResult.md)

### mfaDetection?

[`MFAResult`](../../analyzers/mfa-detection-analyzer/interfaces/MFAResult.md)

### rateLimiting?

[`RateLimitResult`](../../analyzers/rate-limiting-analyzer/interfaces/RateLimitResult.md)

### graphqlSecurity?

[`GraphQLResult`](../../analyzers/graphql-analyzer/interfaces/GraphQLResult.md)

### errorDisclosure?

[`ErrorDisclosureResult`](../../analyzers/error-disclosure-analyzer/interfaces/ErrorDisclosureResult.md)

### spaApi?

[`SpaApiResult`](../../analyzers/spa-api-analyzer/interfaces/SpaApiResult.md)

### llm01PromptInjection?

[`PromptInjectionResult`](../../analyzers/owasp-llm/llm01-prompt-injection/interfaces/PromptInjectionResult.md)

### llm02InsecureOutput?

[`InsecureOutputResult`](../../analyzers/owasp-llm/llm02-insecure-output/interfaces/InsecureOutputResult.md)

### llm05SupplyChain?

[`SupplyChainResult`](../../analyzers/owasp-llm/llm05-supply-chain/interfaces/SupplyChainResult.md)

### llm06SensitiveInfo?

[`SensitiveInfoResult`](../../analyzers/owasp-llm/llm06-sensitive-info/interfaces/SensitiveInfoResult.md)

### llm07PluginDesign?

[`PluginDesignResult`](../../analyzers/owasp-llm/llm07-plugin-design/interfaces/PluginDesignResult.md)

### llm08ExcessiveAgency?

[`ExcessiveAgencyResult`](../../analyzers/owasp-llm/llm08-excessive-agency/interfaces/ExcessiveAgencyResult.md)

### backendFramework?

[`BackendFrameworkResult`](../../analyzers/backend-framework-detector/interfaces/BackendFrameworkResult.md)

### webServer?

[`WebServerResult`](../../analyzers/web-server-security-analyzer/interfaces/WebServerResult.md)

### frontendFramework?

[`FrontendFrameworkResult`](../../analyzers/frontend-framework-security-analyzer/interfaces/FrontendFrameworkResult.md)

### passiveAPI?

[`PassiveAPIDiscoveryResult`](../../analyzers/passive-api-discovery-analyzer/interfaces/PassiveAPIDiscoveryResult.md)

## Returns

[`ScanReport`](../interfaces/ScanReport.md)

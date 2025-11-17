[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/scoring](../README.md) / calculateRiskScore

# Function: calculateRiskScore()

> **calculateRiskScore**(`aiDetection`, `securityHeaders`, `clientRisks`, `sslTLS?`, `cookieSecurity?`, `jsLibraries?`): [`RiskScore`](../interfaces/RiskScore.md)

Defined in: [src/worker/scoring.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/scoring.ts#L14)

## Parameters

### aiDetection

[`AIDetectionResult`](../../analyzers/ai-detection/interfaces/AIDetectionResult.md)

### securityHeaders

[`SecurityHeadersResult`](../../analyzers/security-headers/interfaces/SecurityHeadersResult.md)

### clientRisks

[`ClientRisksResult`](../../analyzers/client-risks/interfaces/ClientRisksResult.md)

### sslTLS?

[`SSLTLSResult`](../../analyzers/ssl-tls-analyzer/interfaces/SSLTLSResult.md)

### cookieSecurity?

[`CookieSecurityResult`](../../analyzers/cookie-security-analyzer/interfaces/CookieSecurityResult.md)

### jsLibraries?

[`JSLibrariesResult`](../../analyzers/js-libraries-analyzer/interfaces/JSLibrariesResult.md)

## Returns

[`RiskScore`](../interfaces/RiskScore.md)

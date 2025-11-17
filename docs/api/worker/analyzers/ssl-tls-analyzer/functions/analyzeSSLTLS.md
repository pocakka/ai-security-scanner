[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ssl-tls-analyzer](../README.md) / analyzeSSLTLS

# Function: analyzeSSLTLS()

> **analyzeSSLTLS**(`crawlResult`): [`SSLTLSResult`](../interfaces/SSLTLSResult.md)

Defined in: [src/worker/analyzers/ssl-tls-analyzer.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ssl-tls-analyzer.ts#L48)

Analyze SSL/TLS configuration and certificate information

Checks:
- HTTPS usage
- Certificate validity and expiry
- Certificate issuer (self-signed detection)
- Protocol version (TLS 1.0-1.3)
- Mixed content (HTTP resources on HTTPS pages)
- Weak cipher detection

## Parameters

### crawlResult

[`CrawlerResult`](../../../../lib/types/crawler-types/interfaces/CrawlerResult.md)

## Returns

[`SSLTLSResult`](../interfaces/SSLTLSResult.md)

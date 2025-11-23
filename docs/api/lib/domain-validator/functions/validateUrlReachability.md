[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [lib/domain-validator](../README.md) / validateUrlReachability

# Function: validateUrlReachability()

> **validateUrlReachability**(`url`, `timeout`): `Promise`\<[`DomainValidationResult`](../interfaces/DomainValidationResult.md)\>

Defined in: [src/lib/domain-validator.ts:156](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/domain-validator.ts#L156)

Validate domain and check if it's accessible via HTTP/HTTPS

More thorough check that attempts to connect to the domain.
Use this for additional validation before expensive scans.

## Parameters

### url

`string`

Full URL (e.g., "https://example.com")

### timeout

`number` = `10000`

HTTP timeout in milliseconds (default: 10000)

## Returns

`Promise`\<[`DomainValidationResult`](../interfaces/DomainValidationResult.md)\>

DomainValidationResult

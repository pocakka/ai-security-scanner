[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [lib/domain-validator](../README.md) / validateDomain

# Function: validateDomain()

> **validateDomain**(`domain`, `timeout`): `Promise`\<[`DomainValidationResult`](../interfaces/DomainValidationResult.md)\>

Defined in: [src/lib/domain-validator.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/domain-validator.ts#L27)

Validate that a domain exists and is reachable

Performs DNS lookup to check if domain has DNS records.
This is a quick check before expensive browser crawling.

## Parameters

### domain

`string`

Domain name (e.g., "example.com")

### timeout

`number` = `5000`

DNS timeout in milliseconds (default: 5000)

## Returns

`Promise`\<[`DomainValidationResult`](../interfaces/DomainValidationResult.md)\>

DomainValidationResult

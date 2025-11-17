[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/cookie-security-enhanced](../README.md) / EnhancedCookieFinding

# Interface: EnhancedCookieFinding

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L20)

## Hierarchy

[View Summary](../../../../hierarchy.md)

### Extends

- [`CookieFinding`](../../cookie-security-analyzer/interfaces/CookieFinding.md)

## Properties

### cookieName

> **cookieName**: `string`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L24)

#### Inherited from

[`CookieFinding`](../../cookie-security-analyzer/interfaces/CookieFinding.md).[`cookieName`](../../cookie-security-analyzer/interfaces/CookieFinding.md#cookiename)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L25)

#### Inherited from

[`CookieFinding`](../../cookie-security-analyzer/interfaces/CookieFinding.md).[`severity`](../../cookie-security-analyzer/interfaces/CookieFinding.md#severity)

***

### issue

> **issue**: `string`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L26)

#### Inherited from

[`CookieFinding`](../../cookie-security-analyzer/interfaces/CookieFinding.md).[`issue`](../../cookie-security-analyzer/interfaces/CookieFinding.md#issue)

***

### description

> **description**: `string`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L27)

#### Inherited from

[`CookieFinding`](../../cookie-security-analyzer/interfaces/CookieFinding.md).[`description`](../../cookie-security-analyzer/interfaces/CookieFinding.md#description)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/analyzers/cookie-security-analyzer.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-analyzer.ts#L28)

#### Inherited from

[`CookieFinding`](../../cookie-security-analyzer/interfaces/CookieFinding.md).[`recommendation`](../../cookie-security-analyzer/interfaces/CookieFinding.md#recommendation)

***

### category

> **category**: `"domain"` \| `"prefix"` \| `"path"` \| `"expiry"` \| `"session"` \| `"size"` \| `"poisoning"`

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L21)

***

### metadata?

> `optional` **metadata**: `any`

Defined in: [src/worker/analyzers/cookie-security-enhanced.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/cookie-security-enhanced.ts#L22)

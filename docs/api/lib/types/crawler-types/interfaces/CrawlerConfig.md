[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [lib/types/crawler-types](../README.md) / CrawlerConfig

# Interface: CrawlerConfig

Defined in: [src/lib/types/crawler-types.ts:114](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L114)

Configuration for Playwright crawler

## Properties

### headless

> **headless**: `boolean`

Defined in: [src/lib/types/crawler-types.ts:116](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L116)

***

### userAgent?

> `optional` **userAgent**: `string`

Defined in: [src/lib/types/crawler-types.ts:117](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L117)

***

### viewport?

> `optional` **viewport**: `object`

Defined in: [src/lib/types/crawler-types.ts:118](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L118)

#### width

> **width**: `number`

#### height

> **height**: `number`

***

### timeout

> **timeout**: `number`

Defined in: [src/lib/types/crawler-types.ts:124](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L124)

***

### waitUntil

> **waitUntil**: `"load"` \| `"domcontentloaded"` \| `"networkidle"`

Defined in: [src/lib/types/crawler-types.ts:125](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L125)

***

### captureScreenshot

> **captureScreenshot**: `boolean`

Defined in: [src/lib/types/crawler-types.ts:128](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L128)

***

### blockResources

> **blockResources**: `string`[]

Defined in: [src/lib/types/crawler-types.ts:129](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L129)

***

### evaluateJavaScript

> **evaluateJavaScript**: `boolean`

Defined in: [src/lib/types/crawler-types.ts:130](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L130)

***

### bypassCSP

> **bypassCSP**: `boolean`

Defined in: [src/lib/types/crawler-types.ts:133](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L133)

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [lib/types/crawler-types](../README.md) / CrawlerResult

# Interface: CrawlerResult

Defined in: [src/lib/types/crawler-types.ts:70](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L70)

Complete result from Playwright crawler
Extended to be compatible with CrawlResult from crawler-mock

## Properties

### url

> **url**: `string`

Defined in: [src/lib/types/crawler-types.ts:72](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L72)

***

### finalUrl

> **finalUrl**: `string`

Defined in: [src/lib/types/crawler-types.ts:73](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L73)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [src/lib/types/crawler-types.ts:74](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L74)

***

### success?

> `optional` **success**: `boolean`

Defined in: [src/lib/types/crawler-types.ts:75](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L75)

***

### requests?

> `optional` **requests**: [`NetworkRequest`](NetworkRequest.md)[]

Defined in: [src/lib/types/crawler-types.ts:78](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L78)

***

### responses?

> `optional` **responses**: [`NetworkResponse`](NetworkResponse.md)[]

Defined in: [src/lib/types/crawler-types.ts:79](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L79)

***

### networkRequests?

> `optional` **networkRequests**: [`NetworkRequest`](NetworkRequest.md)[]

Defined in: [src/lib/types/crawler-types.ts:82](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L82)

***

### scripts?

> `optional` **scripts**: `string`[]

Defined in: [src/lib/types/crawler-types.ts:83](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L83)

***

### domain?

> `optional` **domain**: `string`

Defined in: [src/lib/types/crawler-types.ts:84](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L84)

***

### responseHeaders?

> `optional` **responseHeaders**: `Record`\<`string`, `string`\>

Defined in: [src/lib/types/crawler-types.ts:85](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L85)

***

### html

> **html**: `string`

Defined in: [src/lib/types/crawler-types.ts:88](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L88)

***

### title?

> `optional` **title**: `string`

Defined in: [src/lib/types/crawler-types.ts:89](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L89)

***

### cookies?

> `optional` **cookies**: [`CookieData`](CookieData.md)[]

Defined in: [src/lib/types/crawler-types.ts:90](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L90)

***

### screenshot?

> `optional` **screenshot**: `Buffer`\<`ArrayBufferLike`\>

Defined in: [src/lib/types/crawler-types.ts:91](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L91)

***

### sslCertificate?

> `optional` **sslCertificate**: `any`

Defined in: [src/lib/types/crawler-types.ts:94](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L94)

***

### jsEvaluation?

> `optional` **jsEvaluation**: [`JavaScriptEvaluation`](JavaScriptEvaluation.md)

Defined in: [src/lib/types/crawler-types.ts:97](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L97)

***

### loadTime

> **loadTime**: `number`

Defined in: [src/lib/types/crawler-types.ts:100](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L100)

***

### timingBreakdown?

> `optional` **timingBreakdown**: `Record`\<`string`, `number`\>

Defined in: [src/lib/types/crawler-types.ts:101](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L101)

***

### timestamp?

> `optional` **timestamp**: `Date`

Defined in: [src/lib/types/crawler-types.ts:102](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L102)

***

### error?

> `optional` **error**: `string`

Defined in: [src/lib/types/crawler-types.ts:103](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L103)

***

### userAgent?

> `optional` **userAgent**: `string`

Defined in: [src/lib/types/crawler-types.ts:104](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L104)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [src/lib/types/crawler-types.ts:105](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/types/crawler-types.ts#L105)

#### Index Signature

\[`key`: `string`\]: `any`

#### certificate?

> `optional` **certificate**: `any`

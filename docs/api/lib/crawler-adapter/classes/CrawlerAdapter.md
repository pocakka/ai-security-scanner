[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [lib/crawler-adapter](../README.md) / CrawlerAdapter

# Class: CrawlerAdapter

Defined in: [src/lib/crawler-adapter.ts:11](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/crawler-adapter.ts#L11)

## Constructors

### Constructor

> **new CrawlerAdapter**(): `CrawlerAdapter`

Defined in: [src/lib/crawler-adapter.ts:14](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/crawler-adapter.ts#L14)

#### Returns

`CrawlerAdapter`

## Methods

### crawl()

> **crawl**(`url`): `Promise`\<[`CrawlerResult`](../../types/crawler-types/interfaces/CrawlerResult.md)\>

Defined in: [src/lib/crawler-adapter.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/crawler-adapter.ts#L25)

Crawl URL and convert result to MockCrawler format

#### Parameters

##### url

`string`

#### Returns

`Promise`\<[`CrawlerResult`](../../types/crawler-types/interfaces/CrawlerResult.md)\>

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [src/lib/crawler-adapter.ts:128](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/crawler-adapter.ts#L128)

Close browser resources

#### Returns

`Promise`\<`void`\>

[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [lib/playwright-crawler](../README.md) / PlaywrightCrawler

# Class: PlaywrightCrawler

Defined in: [src/lib/playwright-crawler.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/playwright-crawler.ts#L22)

## Constructors

### Constructor

> **new PlaywrightCrawler**(`config?`): `PlaywrightCrawler`

Defined in: [src/lib/playwright-crawler.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/playwright-crawler.ts#L32)

#### Parameters

##### config?

`Partial`\<[`CrawlerConfig`](../../types/crawler-types/interfaces/CrawlerConfig.md)\>

#### Returns

`PlaywrightCrawler`

## Methods

### crawl()

> **crawl**(`url`): `Promise`\<[`CrawlerResult`](../../types/crawler-types/interfaces/CrawlerResult.md)\>

Defined in: [src/lib/playwright-crawler.ts:39](https://github.com/yourorg/ai-security-scanner/blob/main/src/lib/playwright-crawler.ts#L39)

Main crawl method - orchestrates the entire scanning process

#### Parameters

##### url

`string`

#### Returns

`Promise`\<[`CrawlerResult`](../../types/crawler-types/interfaces/CrawlerResult.md)\>

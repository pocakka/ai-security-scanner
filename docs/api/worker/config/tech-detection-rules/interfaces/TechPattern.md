[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/config/tech-detection-rules](../README.md) / TechPattern

# Interface: TechPattern

Defined in: [src/worker/config/tech-detection-rules.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L16)

Tech Detection Rules Configuration

User-editable technology detection patterns.
Add or modify rules to detect CMS, Analytics, Ads, CDN, and Social integrations.

Pattern Types:
- dom: HTML content regex match
- script: <script src="..."> URL pattern
- link: <link href="..."> URL pattern
- html: Full HTML source regex match
- header: HTTP response header check
- meta: <meta> tag check

## Properties

### name

> **name**: `string`

Defined in: [src/worker/config/tech-detection-rules.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L17)

***

### category

> **category**: `"framework"` \| `"analytics"` \| `"cms"` \| `"ads"` \| `"cdn"` \| `"social"` \| `"ecommerce"` \| `"hosting"`

Defined in: [src/worker/config/tech-detection-rules.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L18)

***

### confidence

> **confidence**: `"low"` \| `"medium"` \| `"high"`

Defined in: [src/worker/config/tech-detection-rules.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L19)

***

### patterns

> **patterns**: `object`[]

Defined in: [src/worker/config/tech-detection-rules.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L20)

#### type

> **type**: `"meta"` \| `"link"` \| `"url"` \| `"script"` \| `"html"` \| `"js-global"` \| `"header"` \| `"cookie"` \| `"dom"` \| `"ip"`

#### match

> **match**: `string` \| `RegExp`

#### version?

> `optional` **version**: `RegExp`

***

### description?

> `optional` **description**: `string`

Defined in: [src/worker/config/tech-detection-rules.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L25)

***

### website?

> `optional` **website**: `string`

Defined in: [src/worker/config/tech-detection-rules.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/config/tech-detection-rules.ts#L26)

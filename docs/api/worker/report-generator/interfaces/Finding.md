[**AI Security Scanner - Technical Documentation v0.1.0**](../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../modules.md) / [worker/report-generator](../README.md) / Finding

# Interface: Finding

Defined in: [src/worker/report-generator.ts:76](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L76)

## Properties

### id

> **id**: `string`

Defined in: [src/worker/report-generator.ts:77](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L77)

***

### category

> **category**: `"client"` \| `"cors"` \| `"port"` \| `"cookie"` \| `"reconnaissance"` \| `"ai"` \| `"security"` \| `"ssl"` \| `"library"` \| `"admin"` \| `"dns"` \| `"compliance"` \| `"waf"` \| `"mfa"` \| `"rate-limit"` \| `"graphql"` \| `"error-disclosure"` \| `"spa-api"` \| `"owasp-llm01"` \| `"owasp-llm02"` \| `"owasp-llm05"` \| `"owasp-llm06"` \| `"owasp-llm07"` \| `"owasp-llm08"` \| `"backend-framework"` \| `"web-server"` \| `"frontend-framework"` \| `"api-security"`

Defined in: [src/worker/report-generator.ts:78](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L78)

***

### severity

> **severity**: `"info"` \| `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [src/worker/report-generator.ts:79](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L79)

***

### title

> **title**: `string`

Defined in: [src/worker/report-generator.ts:80](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L80)

***

### description

> **description**: `string`

Defined in: [src/worker/report-generator.ts:81](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L81)

***

### evidence?

> `optional` **evidence**: `string`

Defined in: [src/worker/report-generator.ts:82](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L82)

***

### impact

> **impact**: `string`

Defined in: [src/worker/report-generator.ts:83](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L83)

***

### recommendation

> **recommendation**: `string`

Defined in: [src/worker/report-generator.ts:84](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/report-generator.ts#L84)

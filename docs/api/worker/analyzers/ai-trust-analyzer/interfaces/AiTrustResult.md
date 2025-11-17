[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/ai-trust-analyzer](../README.md) / AiTrustResult

# Interface: AiTrustResult

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L47)

## Properties

### score

> **score**: `number` \| `null`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L49)

***

### weightedScore

> **weightedScore**: `number` \| `null`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L50)

***

### categoryScores

> **categoryScores**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:51](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L51)

#### transparency

> **transparency**: `number`

#### userControl

> **userControl**: `number`

#### compliance

> **compliance**: `number`

#### security

> **security**: `number`

#### ethicalAi

> **ethicalAi**: `number`

***

### passedChecks

> **passedChecks**: `number`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:58](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L58)

***

### totalChecks

> **totalChecks**: `number`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:59](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L59)

***

### relevantChecks

> **relevantChecks**: `number`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:60](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L60)

***

### grade

> **grade**: `"excellent"` \| `"good"` \| `"fair"` \| `"poor"` \| `"not-applicable"`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:61](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L61)

***

### hasAiImplementation

> **hasAiImplementation**: `boolean`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:64](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L64)

***

### aiConfidenceLevel

> **aiConfidenceLevel**: `"low"` \| `"medium"` \| `"high"` \| `"none"`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:65](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L65)

***

### detectedAiProvider?

> `optional` **detectedAiProvider**: `string`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:66](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L66)

***

### detectedModel?

> `optional` **detectedModel**: `string`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:67](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L67)

***

### detectedChatFramework?

> `optional` **detectedChatFramework**: `string`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:68](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L68)

***

### detailedChecks

> **detailedChecks**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:71](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L71)

#### isProviderDisclosed

> **isProviderDisclosed**: [`CheckResult`](CheckResult.md)

#### isIdentityDisclosed

> **isIdentityDisclosed**: [`CheckResult`](CheckResult.md)

#### isAiPolicyLinked

> **isAiPolicyLinked**: [`CheckResult`](CheckResult.md)

#### isModelVersionDisclosed

> **isModelVersionDisclosed**: [`CheckResult`](CheckResult.md)

#### isLimitationsDisclosed

> **isLimitationsDisclosed**: [`CheckResult`](CheckResult.md)

#### hasDataUsageDisclosure

> **hasDataUsageDisclosure**: [`CheckResult`](CheckResult.md)

#### hasFeedbackMechanism

> **hasFeedbackMechanism**: [`CheckResult`](CheckResult.md)

#### hasConversationReset

> **hasConversationReset**: [`CheckResult`](CheckResult.md)

#### hasHumanEscalation

> **hasHumanEscalation**: [`CheckResult`](CheckResult.md)

#### hasConversationExport

> **hasConversationExport**: [`CheckResult`](CheckResult.md)

#### hasDataDeletionOption

> **hasDataDeletionOption**: [`CheckResult`](CheckResult.md)

#### hasDpoContact

> **hasDpoContact**: [`CheckResult`](CheckResult.md)

#### hasCookieBanner

> **hasCookieBanner**: [`CheckResult`](CheckResult.md)

#### hasPrivacyPolicyLink

> **hasPrivacyPolicyLink**: [`CheckResult`](CheckResult.md)

#### hasTermsOfServiceLink

> **hasTermsOfServiceLink**: [`CheckResult`](CheckResult.md)

#### hasGdprCompliance

> **hasGdprCompliance**: [`CheckResult`](CheckResult.md)

#### hasBotProtection

> **hasBotProtection**: [`CheckResult`](CheckResult.md)

#### hasAiRateLimitHeaders

> **hasAiRateLimitHeaders**: [`CheckResult`](CheckResult.md)

#### hasBasicWebSecurity

> **hasBasicWebSecurity**: [`CheckResult`](CheckResult.md)

#### hasInputLengthLimit

> **hasInputLengthLimit**: [`CheckResult`](CheckResult.md)

#### usesInputSanitization

> **usesInputSanitization**: [`CheckResult`](CheckResult.md)

#### hasErrorHandling

> **hasErrorHandling**: [`CheckResult`](CheckResult.md)

#### hasSessionManagement

> **hasSessionManagement**: [`CheckResult`](CheckResult.md)

#### hasBiasDisclosure

> **hasBiasDisclosure**: [`CheckResult`](CheckResult.md)

#### hasContentModeration

> **hasContentModeration**: [`CheckResult`](CheckResult.md)

#### hasAgeVerification

> **hasAgeVerification**: [`CheckResult`](CheckResult.md)

#### hasAccessibilitySupport

> **hasAccessibilitySupport**: [`CheckResult`](CheckResult.md)

***

### checks

> **checks**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:111](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L111)

#### isProviderDisclosed

> **isProviderDisclosed**: `boolean`

#### isIdentityDisclosed

> **isIdentityDisclosed**: `boolean`

#### isAiPolicyLinked

> **isAiPolicyLinked**: `boolean`

#### isModelVersionDisclosed

> **isModelVersionDisclosed**: `boolean`

#### isLimitationsDisclosed

> **isLimitationsDisclosed**: `boolean`

#### hasDataUsageDisclosure

> **hasDataUsageDisclosure**: `boolean`

#### hasFeedbackMechanism

> **hasFeedbackMechanism**: `boolean`

#### hasConversationReset

> **hasConversationReset**: `boolean`

#### hasHumanEscalation

> **hasHumanEscalation**: `boolean`

#### hasConversationExport

> **hasConversationExport**: `boolean`

#### hasDataDeletionOption

> **hasDataDeletionOption**: `boolean`

#### hasDpoContact

> **hasDpoContact**: `boolean`

#### hasCookieBanner

> **hasCookieBanner**: `boolean`

#### hasPrivacyPolicyLink

> **hasPrivacyPolicyLink**: `boolean`

#### hasTermsOfServiceLink

> **hasTermsOfServiceLink**: `boolean`

#### hasGdprCompliance

> **hasGdprCompliance**: `boolean`

#### hasBotProtection

> **hasBotProtection**: `boolean`

#### hasAiRateLimitHeaders

> **hasAiRateLimitHeaders**: `boolean`

#### hasBasicWebSecurity

> **hasBasicWebSecurity**: `boolean`

#### hasInputLengthLimit

> **hasInputLengthLimit**: `boolean`

#### usesInputSanitization

> **usesInputSanitization**: `boolean`

#### hasErrorHandling

> **hasErrorHandling**: `boolean`

#### hasSessionManagement

> **hasSessionManagement**: `boolean`

#### hasBiasDisclosure

> **hasBiasDisclosure**: `boolean`

#### hasContentModeration

> **hasContentModeration**: `boolean`

#### hasAgeVerification

> **hasAgeVerification**: `boolean`

#### hasAccessibilitySupport

> **hasAccessibilitySupport**: `boolean`

***

### evidenceData

> **evidenceData**: `Record`\<`string`, `string`[]\>

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:141](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L141)

***

### voiceAI?

> `optional` **voiceAI**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:144](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L144)

#### hasVoiceAI

> **hasVoiceAI**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

***

### translationAI?

> `optional` **translationAI**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:149](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L149)

#### hasTranslationAI

> **hasTranslationAI**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

***

### searchAI?

> `optional` **searchAI**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:154](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L154)

#### hasSearchAI

> **hasSearchAI**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

#### criticalRiskCount

> **criticalRiskCount**: `number`

***

### personalizationAI?

> `optional` **personalizationAI**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:160](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L160)

#### hasPersonalizationAI

> **hasPersonalizationAI**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

#### sessionRecordingDetected

> **sessionRecordingDetected**: `boolean`

***

### analyticsAI?

> `optional` **analyticsAI**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:166](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L166)

#### hasAnalyticsAI

> **hasAnalyticsAI**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

#### sessionReplayDetected

> **sessionReplayDetected**: `boolean`

#### criticalRiskCount

> **criticalRiskCount**: `number`

***

### imageVideoAI?

> `optional` **imageVideoAI**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:173](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L173)

#### hasImageVideoAI

> **hasImageVideoAI**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

#### generativeAIDetected

> **generativeAIDetected**: `boolean`

***

### contentModeration?

> `optional` **contentModeration**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:179](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L179)

#### hasContentModeration

> **hasContentModeration**: `boolean`

#### detections

> **detections**: `any`[]

#### totalProviders

> **totalProviders**: `number`

#### highConfidenceCount

> **highConfidenceCount**: `number`

***

### summary

> **summary**: `object`

Defined in: [src/worker/analyzers/ai-trust-analyzer.ts:187](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/ai-trust-analyzer.ts#L187)

#### message

> **message**: `string`

#### strengths

> **strengths**: `string`[]

#### weaknesses

> **weaknesses**: `string`[]

#### criticalIssues

> **criticalIssues**: `string`[]

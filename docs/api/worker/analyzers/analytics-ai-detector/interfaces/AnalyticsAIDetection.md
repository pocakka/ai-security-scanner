[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/analytics-ai-detector](../README.md) / AnalyticsAIDetection

# Interface: AnalyticsAIDetection

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L26)

## Properties

### provider

> **provider**: `string`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L27)

***

### category

> **category**: `"Analytics AI (Session Replay)"` \| `"Analytics AI (Event Tracking)"` \| `"Analytics AI (Heatmaps)"`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L28)

***

### confidence

> **confidence**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L29)

***

### scriptFound?

> `optional` **scriptFound**: `boolean`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L30)

***

### globalObjectFound?

> `optional` **globalObjectFound**: `boolean`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L31)

***

### cookieFound?

> `optional` **cookieFound**: `boolean`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:32](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L32)

***

### apiEndpointFound?

> `optional` **apiEndpointFound**: `boolean`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:33](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L33)

***

### sessionReplayEnabled?

> `optional` **sessionReplayEnabled**: `boolean`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:34](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L34)

***

### detectionPatterns

> **detectionPatterns**: `string`[]

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:35](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L35)

***

### attackSurface

> **attackSurface**: `string`[]

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:36](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L36)

***

### riskLevel

> **riskLevel**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"CRITICAL"`

Defined in: [src/worker/analyzers/analytics-ai-detector.ts:37](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/analytics-ai-detector.ts#L37)

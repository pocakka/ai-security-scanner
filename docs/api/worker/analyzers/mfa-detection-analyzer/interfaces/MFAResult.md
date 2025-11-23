[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/mfa-detection-analyzer](../README.md) / MFAResult

# Interface: MFAResult

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:42](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L42)

## Properties

### findings

> **findings**: `MFAFinding`[]

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:43](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L43)

***

### detectedMethods

> **detectedMethods**: `MFAMethod`[]

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:44](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L44)

***

### hasMFA

> **hasMFA**: `boolean`

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:45](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L45)

***

### hasOAuth

> **hasOAuth**: `boolean`

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:46](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L46)

***

### hasSAML

> **hasSAML**: `boolean`

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:47](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L47)

***

### hasWebAuthn

> **hasWebAuthn**: `boolean`

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:48](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L48)

***

### hasTOTP

> **hasTOTP**: `boolean`

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:49](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L49)

***

### recommendedMethods

> **recommendedMethods**: `string`[]

Defined in: [src/worker/analyzers/mfa-detection-analyzer.ts:50](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/mfa-detection-analyzer.ts#L50)

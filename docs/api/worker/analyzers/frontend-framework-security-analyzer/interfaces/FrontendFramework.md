[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/frontend-framework-security-analyzer](../README.md) / FrontendFramework

# Interface: FrontendFramework

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:16](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L16)

Frontend Framework Security Analyzer

Detects frontend frameworks (React, Vue, Angular, Next.js, Svelte, etc.)
and identifies development/debug modes that should NOT be enabled in production.

CRITICAL Security Checks:
- React DevTools detection (development build)
- Vue dev mode detection (__VUE_PROD_DEVTOOLS__)
- Angular source maps exposure
- Next.js development mode indicators
- Svelte dev mode detection
- Source map exposure (reveals original source code)

## Properties

### name

> **name**: `string`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:17](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L17)

***

### detected

> **detected**: `boolean`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:18](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L18)

***

### version?

> `optional` **version**: `string`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L19)

***

### confidence

> **confidence**: `"low"` \| `"medium"` \| `"high"`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L20)

***

### evidence

> **evidence**: `string`[]

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L21)

***

### devModeEnabled?

> `optional` **devModeEnabled**: `boolean`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L22)

***

### hasSourceMaps?

> `optional` **hasSourceMaps**: `boolean`

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L23)

***

### securityIssues

> **securityIssues**: [`SecurityIssue`](SecurityIssue.md)[]

Defined in: [src/worker/analyzers/frontend-framework-security-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/frontend-framework-security-analyzer.ts#L24)

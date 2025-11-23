[**AI Security Scanner - Technical Documentation v0.1.0**](../../../../README.md)

***

[AI Security Scanner - Technical Documentation](../../../../modules.md) / [worker/analyzers/passive-api-discovery-analyzer](../README.md) / PassiveAPIDiscoveryResult

# Interface: PassiveAPIDiscoveryResult

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:19](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L19)

Passive API Discovery Analyzer

Discovers API endpoints, authentication tokens, and security issues through PASSIVE analysis
of client-side code (HTML, JavaScript) WITHOUT making active requests or attacks.

CRITICAL Security Checks:
- JWT tokens in localStorage/sessionStorage/cookies
- API keys exposed in client code
- SQL error messages (database info disclosure)
- Stack traces (reveals file paths and code structure)
- Debug mode indicators (exposes internal data)
- API endpoint discovery (REST, GraphQL)
- Authentication patterns

All detection is PASSIVE - we only analyze what the server already sent to us.

## Properties

### findings

> **findings**: [`Finding`](Finding.md)[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:20](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L20)

***

### discoveredAPIs

> **discoveredAPIs**: [`DiscoveredAPI`](DiscoveredAPI.md)[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:21](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L21)

***

### exposedTokens

> **exposedTokens**: [`ExposedToken`](ExposedToken.md)[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:22](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L22)

***

### sqlErrors

> **sqlErrors**: [`SQLError`](SQLError.md)[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:23](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L23)

***

### stackTraces

> **stackTraces**: [`StackTrace`](StackTrace.md)[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:24](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L24)

***

### debugIndicators

> **debugIndicators**: [`DebugIndicator`](DebugIndicator.md)[]

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:25](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L25)

***

### hasJWT

> **hasJWT**: `boolean`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:26](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L26)

***

### hasAPIKeys

> **hasAPIKeys**: `boolean`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:27](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L27)

***

### hasSQLErrors

> **hasSQLErrors**: `boolean`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:28](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L28)

***

### hasStackTraces

> **hasStackTraces**: `boolean`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:29](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L29)

***

### hasDebugMode

> **hasDebugMode**: `boolean`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:30](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L30)

***

### riskLevel

> **riskLevel**: `"low"` \| `"medium"` \| `"high"` \| `"critical"` \| `"none"`

Defined in: [src/worker/analyzers/passive-api-discovery-analyzer.ts:31](https://github.com/yourorg/ai-security-scanner/blob/main/src/worker/analyzers/passive-api-discovery-analyzer.ts#L31)

# AI Security Scanner - Complete Documentation Guide

This file serves as the master guide to all documentation in this project.

## 📚 Documentation Types

This project has **two types of documentation**:

### 1. Manual Documentation (Written)
Located in [`docs/`](docs/) - These are handwritten guides explaining architecture and flows.

### 2. Auto-Generated API Documentation (TypeDoc)
Located in [`docs/api/`](docs/api/) - Auto-generated from TypeScript source code.

---

## 🗂️ Manual Documentation Structure

### Core Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) | **Complete end-to-end scan flow** from user input to rendered results | 2087 |
| [docs/README.md](docs/README.md) | Documentation overview and navigation guide | 146 |

### What's Covered

The `SCAN_FLOW.md` is the **most comprehensive document** and covers:

1. **Phase 1: Scan Request (Frontend)**
   - User interaction flow
   - Form submission
   - API request creation

2. **Phase 2: Scan Creation (API Layer)**
   - URL normalization and validation
   - DNS domain verification
   - Database record creation
   - Worker process spawning

3. **Phase 3: Job Queue (Database)**
   - SQLite-based job queue
   - FIFO ordering
   - Retry logic (up to 3 attempts)

4. **Phase 4: Worker Processing** (Main processing engine)
   - Worker startup and lock management
   - Playwright web crawling
   - **41 security analyzers** execution:
     - Security headers
     - SSL/TLS certificate
     - Cookie security
     - Client-side risks (API keys, secrets)
     - JavaScript libraries
     - Technology stack detection
     - Reconnaissance analysis
     - Admin panel detection
     - CORS misconfiguration
     - DNS security (DNSSEC, SPF, DKIM, DMARC)
     - Port scanning
     - Compliance (GDPR, CCPA, PCI DSS, HIPAA)
     - WAF detection
     - MFA detection
     - Rate limiting
     - GraphQL security
     - Error disclosure
     - SPA/API detection
     - Backend framework security
     - Web server security
     - Frontend framework security
     - Passive API discovery
     - **AI Trust Score (27 checks)**
     - **OWASP LLM Top 10 (6 analyzers)** - only if AI detected
   - Professional security scoring (v3 system, 100-point scale)
   - Report generation
   - Database persistence

5. **Phase 5: Result Polling (Frontend)**
   - 2-second polling interval
   - Status transitions (PENDING → SCANNING → COMPLETED)
   - Real-time UI updates

6. **Phase 6: Report Rendering**
   - Risk score visualization (A+ to F grade)
   - AI Trust Score section (priority placement)
   - Technology stack display
   - Security findings grouped by category
   - Interactive collapsible sections

7. **Error Handling & Edge Cases**
   - Invalid URL format
   - Non-existent domains (DNS lookup failure)
   - Stuck scans (worker crashes)
   - Analyzer timeouts
   - 404 scan not found

8. **Performance Metrics**
   - Typical scan timeline: 9-50 seconds (median: 25s)
   - Breakdown by site complexity
   - Per-phase timing analysis

---

## 🤖 Auto-Generated TypeDoc Documentation

### Location
All TypeDoc-generated docs are in: [`docs/api/`](docs/api/)

### What's Included

TypeDoc automatically generates documentation for:

- **API Routes** (`src/app/api/`)
  - Scan creation endpoint
  - Scan retrieval endpoint
  - Admin endpoints
  - Lead capture endpoints
  - Settings management

- **Worker Layer** (`src/worker/`)
  - Main worker process ([index-sqlite.ts](src/worker/index-sqlite.ts))
  - All 41 analyzers with their interfaces
  - Report generator
  - Scoring systems (v1, v2, v3)
  - Worker manager

- **Core Libraries** (`src/lib/`)
  - Database client (Prisma)
  - Job queue (SQLite-based)
  - Crawler adapter (Playwright wrapper)
  - URL validator (with DNS lookup)
  - PDF generator
  - Email service

- **Type Definitions**
  - Interfaces for all analyzers
  - Scan report structure
  - Finding interface
  - Crawler result types

### How to Read TypeDoc Documentation

1. Start with [docs/api/README.md](docs/api/README.md) - Overview
2. Browse [docs/api/modules.md](docs/api/modules.md) - All modules index
3. Navigate by layer:
   - API: [docs/api/app/](docs/api/app/)
   - Worker: [docs/api/worker/](docs/api/worker/)
   - Libraries: [docs/api/lib/](docs/api/lib/)

---

## 🚀 Generating Documentation

### Prerequisites
```bash
npm install
```

### Commands

| Command | Purpose |
|---------|---------|
| `npm run docs` | Generate TypeDoc documentation once |
| `npm run docs:watch` | Generate and watch for changes (auto-regenerate) |
| `npm run docs:serve` | Generate and serve on http://localhost:8080 |

### Example Usage

```bash
# Generate fresh documentation
npm run docs

# Open in browser (manual)
open docs/api/README.md

# Serve with live preview (Python server)
npm run docs:serve
# Then visit: http://localhost:8080
```

---

## 📖 Documentation Usage Guide

### For New Developers

**Start here:**
1. Read [docs/README.md](docs/README.md) - Get oriented
2. Read [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Understand the complete flow
3. Browse [docs/api/modules.md](docs/api/modules.md) - See all available modules

**Then explore:**
- API endpoints: [docs/api/app/api/](docs/api/app/api/)
- Worker process: [docs/api/worker/](docs/api/worker/)
- Analyzers: [docs/api/worker/analyzers/](docs/api/worker/analyzers/)

### For Backend Engineers

**Focus on:**
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phases 2-4 (API + Worker + Analyzers)
2. [docs/api/worker/](docs/api/worker/) - Worker implementation details
3. [docs/api/lib/queue-sqlite/](docs/api/lib/queue-sqlite/) - Job queue system

**Key files to study:**
- [src/worker/index-sqlite.ts](src/worker/index-sqlite.ts) - Main worker loop
- [src/worker/report-generator.ts](src/worker/report-generator.ts) - Report assembly
- [src/worker/scoring-v3.ts](src/worker/scoring-v3.ts) - Security scoring algorithm

### For Frontend Engineers

**Focus on:**
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phases 1, 5, 6 (User interaction)
2. [docs/api/app/api/](docs/api/app/api/) - API contracts (request/response)

**Key files to study:**
- `src/app/scan/[id]/page.tsx` - Main results page (not in TypeDoc, React component)
- [docs/api/app/api/scan/route/](docs/api/app/api/scan/route/) - Scan creation API
- [docs/api/app/api/scan/[id]/route/](docs/api/app/api/scan/[id]/route/) - Scan retrieval API

### For DevOps/Infrastructure

**Focus on:**
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phase 4 (Worker processing)
2. [docs/api/worker/worker-manager/](docs/api/worker/worker-manager/) - Worker lifecycle
3. [docs/api/lib/queue-sqlite/](docs/api/lib/queue-sqlite/) - Job queue persistence

**Key concepts:**
- Worker processes are **short-lived** (one job per process)
- SQLite job queue for persistence
- Playwright browser automation (headless Chromium)
- Lock file prevents duplicate workers

### For Security Auditors

**Focus on:**
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phase 4 (All 41 analyzers)
2. [docs/api/worker/analyzers/](docs/api/worker/analyzers/) - Individual analyzer implementations
3. [docs/api/worker/scoring-v3/](docs/api/worker/scoring-v3/) - Scoring methodology

**Analyzer categories:**
- **Core Security** (26 analyzers): Headers, SSL, cookies, client risks, etc.
- **AI Trust Score** (27 checks): Transparency, user control, compliance, ethical AI
- **OWASP LLM** (6 analyzers): Prompt injection, insecure output, supply chain, etc.

---

## 🔍 Quick Reference

### Key Interfaces

| Interface | File | Purpose |
|-----------|------|---------|
| `CrawlerResult` | [src/lib/crawler-adapter.ts](src/lib/crawler-adapter.ts) | Output from Playwright crawler |
| `ScanReport` | [src/worker/report-generator.ts](src/worker/report-generator.ts) | Final report structure |
| `Finding` | [src/worker/report-generator.ts](src/worker/report-generator.ts) | Individual security issue |
| `SecurityScoreBreakdown` | [src/worker/scoring-v3.ts](src/worker/scoring-v3.ts) | Scoring system output |
| `AITrustResult` | [src/worker/analyzers/ai-trust-analyzer.ts](src/worker/analyzers/ai-trust-analyzer.ts) | AI Trust Score output |

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `processOneJob()` | [src/worker/index-sqlite.ts](src/worker/index-sqlite.ts) | Main worker entry point |
| `processScanJob()` | [src/worker/index-sqlite.ts](src/worker/index-sqlite.ts) | Process single scan |
| `generateReport()` | [src/worker/report-generator.ts](src/worker/report-generator.ts) | Aggregate analyzer results |
| `calculateSecurityScore()` | [src/worker/scoring-v3.ts](src/worker/scoring-v3.ts) | Calculate professional score |
| `analyzeAiTrust()` | [src/worker/analyzers/ai-trust-analyzer.ts](src/worker/analyzers/ai-trust-analyzer.ts) | AI Trust Score (27 checks) |

### Configuration Files

| File | Purpose |
|------|---------|
| [typedoc.json](typedoc.json) | TypeDoc configuration |
| [tsconfig.json](tsconfig.json) | TypeScript compiler config |
| [prisma/schema.prisma](prisma/schema.prisma) | Database schema |
| [package.json](package.json) | Dependencies & scripts |

---

## 🛠️ Common Tasks

### Updating Documentation

**When you change code:**
1. Update JSDoc comments in your TypeScript files
2. Run `npm run docs` to regenerate TypeDoc documentation
3. Update [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) if you changed the flow
4. Commit both code changes and documentation updates

**When you add a new analyzer:**
1. Create analyzer file: `src/worker/analyzers/my-analyzer.ts`
2. Add JSDoc comments to the analyzer function
3. Update [src/worker/index-sqlite.ts](src/worker/index-sqlite.ts) to call it
4. Run `npm run docs` to regenerate
5. Update [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) if it's a major analyzer

### Finding Information

**"How does X work?"**
1. Check [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Most flows are documented there
2. Search TypeDoc: [docs/api/modules.md](docs/api/modules.md)
3. Use `grep` to search source code

**"What does this function do?"**
1. Check TypeDoc: [docs/api/modules.md](docs/api/modules.md)
2. Read JSDoc comments in source file
3. Check [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) for context

**"What's the data structure?"**
1. Check TypeDoc interfaces: [docs/api/](docs/api/)
2. Look at Prisma schema: [prisma/schema.prisma](prisma/schema.prisma)
3. Read type definitions in analyzer files

---

## 📊 Documentation Statistics

### Manual Documentation
- **Total pages:** 2
- **Total lines:** 2,233 lines
- **Key document:** SCAN_FLOW.md (2,087 lines - comprehensive flow trace)

### Auto-Generated Documentation
- **Modules documented:** ~50+
- **Interfaces:** 100+
- **Functions:** 200+
- **Files covered:** All TypeScript files in `src/`

### Coverage
- ✅ API Layer: 100% (all endpoints documented)
- ✅ Worker Layer: 100% (all analyzers documented)
- ✅ Core Libraries: 100% (all utilities documented)
- ✅ Type Definitions: 100% (all interfaces exported)

---

## 🎯 Documentation Philosophy

**Our approach:**
1. **Manual docs** explain *why* and *how things flow*
2. **TypeDoc** documents *what* each function/interface does
3. **Code comments** explain *tricky implementation details*

**When to update:**
- ✅ Always update when changing public APIs
- ✅ Always update when adding new features
- ✅ Always update when fixing critical bugs
- ⚠️ Optional for minor refactoring (unless it changes behavior)

---

## 📞 Getting Help

**If documentation is unclear:**
1. File an issue describing what's confusing
2. Suggest improvements via pull request
3. Ask in team chat for clarification

**If you find outdated docs:**
1. Run `npm run docs` to regenerate TypeDoc
2. Update manual docs in `docs/`
3. Submit a pull request

---

**Last Updated:** November 17, 2025
**TypeDoc Version:** 0.28.14
**Documentation Coverage:** 100% of public API surface

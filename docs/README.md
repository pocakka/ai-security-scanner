# AI Security Scanner - Developer Documentation

Complete technical documentation for the AI Security Scanner system.

## 📚 Documentation Structure

### 🚀 Start Here
- **[QUICK_START_DOCS.md](QUICK_START_DOCS.md)** - ⚡ 5-minute quick start guide
- **[DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md)** - 🚨 **Debugging & File Map** ⭐ NEW!

### 📖 Core Documentation
1. **[SCAN_FLOW.md](SCAN_FLOW.md)** - 📋 Complete scan flow (end-to-end, 2,087 lines)
2. **[DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md)** - 🛠️ File-by-file developer guide with regex patterns
3. **[api/](api/)** - 🤖 Auto-generated TypeDoc API documentation (346 files)
   - [API endpoints](api/app/api/) - REST API documentation
   - [Worker & analyzers](api/worker/) - 41 security analyzers
   - [Core libraries](api/lib/) - Utilities and helpers

### 📚 Additional Resources
- **[../DOCUMENTATION.md](../DOCUMENTATION.md)** - Master documentation guide
- **[../DOCUMENTATION_CHEATSHEET.md](../DOCUMENTATION_CHEATSHEET.md)** - Quick reference

## 🚀 Quick Start for Developers

### Understanding a Scan Request

When a user scans a URL, this is what happens:

```
USER → Frontend (scan/[id]/page.tsx)
     ↓ POST /api/scan
API → Create Scan + Job records
     ↓ Spawn Worker
WORKER → Poll Job Queue
       ↓ Pick up Job
       ↓ Crawl Website (Playwright)
       ↓ Run 41 Analyzers (parallel with timeout)
       ↓ Calculate Security Score
       ↓ Generate Report
       ↓ Save to Database
FRONTEND ← Poll /api/scan/[id] (every 2s)
        ← Render Results
```

### Key Files to Know

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/scan/[id]/page.tsx` | Scan results page (Frontend) | 1407 |
| `src/app/api/scan/route.ts` | Create scan endpoint (API) | 137 |
| `src/app/api/scan/[id]/route.ts` | Get scan results (API) | ~100 |
| `src/worker/index-sqlite.ts` | Main worker process | ~900 |
| `src/lib/crawler-adapter.ts` | Playwright browser automation | ~400 |
| `src/worker/analyzers/*` | 41 security analyzers | ~15000+ |
| `src/worker/scoring-v3.ts` | Security score calculation | ~500 |
| `src/worker/report-generator.ts` | Report assembly | ~300 |

### Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** SQLite (development), PostgreSQL (production-ready)
- **Worker:** Node.js background process with job queue
- **Crawler:** Playwright (headless Chromium browser)
- **Type Safety:** TypeScript 5.x
- **Validation:** Zod schemas

## 📖 Reading Guide

### For New Developers

Start here:
1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for the big picture
2. Follow [SCAN_FLOW.md](SCAN_FLOW.md) to understand the complete flow
3. Dive into [API_LAYER.md](API_LAYER.md) for API endpoints

### For Backend Developers

Focus on:
1. [WORKER_LAYER.md](WORKER_LAYER.md) - Job processing
2. [ANALYZER_LAYER.md](ANALYZER_LAYER.md) - Security analyzers
3. [DATABASE.md](DATABASE.md) - Data models

### For Frontend Developers

Focus on:
1. [SCAN_FLOW.md](SCAN_FLOW.md) - User flow
2. [API_LAYER.md](API_LAYER.md) - API contracts
3. `src/app/scan/[id]/page.tsx` - Main results page

### For DevOps/Infrastructure

Focus on:
1. [ARCHITECTURE.md](ARCHITECTURE.md) - System design
2. [WORKER_LAYER.md](WORKER_LAYER.md) - Background jobs
3. Environment variables and configuration

## 🔍 Common Tasks

### Adding a New Analyzer

1. Create `src/worker/analyzers/my-analyzer.ts`
2. Export interface `MyAnalyzerResult`
3. Export function `analyzeMyCheck(crawlResult: CrawlerResult): Promise<MyAnalyzerResult>`
4. Import and call in `src/worker/index-sqlite.ts`
5. Add result to report in `src/worker/report-generator.ts`
6. Update scoring logic if needed in `src/worker/scoring-v3.ts`

### Debugging a Stuck Scan

1. Check scan status: `sqlite3 prisma/dev.db "SELECT * FROM Scan WHERE id = 'scan-id'"`
2. Check job status: `sqlite3 prisma/dev.db "SELECT * FROM Job WHERE data LIKE '%scan-id%'"`
3. Check worker logs: `tail -f logs/worker-*.log`
4. If stuck in SCANNING: Reset to PENDING (see [WORKER_LAYER.md](WORKER_LAYER.md))

### Understanding Type Errors

All types are documented in [TYPES.md](TYPES.md). Key interfaces:
- `Scan` - Database model for scans
- `CrawlerResult` - Output from Playwright crawler
- `ScanReport` - Final report structure
- `Finding` - Individual security issue

## 📝 Contributing

When adding features:
1. **Read the relevant docs first** to understand existing patterns
2. **Follow type safety** - use TypeScript strictly
3. **Test analyzers** with real websites before committing
4. **Document changes** in the appropriate doc file
5. **Update this README** if adding new major components

## 🐛 Known Issues & Workarounds

See individual doc files for component-specific issues:
- API layer issues: [API_LAYER.md](API_LAYER.md#known-issues)
- Worker issues: [WORKER_LAYER.md](WORKER_LAYER.md#troubleshooting)
- Analyzer false positives: [ANALYZER_STATUS.md](../ANALYZER_STATUS.md)

## 📞 Getting Help

1. Check the relevant documentation file first
2. Search for similar issues in git history: `git log --all --grep="keyword"`
3. Check analyzer status: `cat ANALYZER_STATUS.md`
4. Review recent commits: `git log --oneline -20`

---

**Last Updated:** November 17, 2025
**Documentation Version:** 1.0
**Code Version:** See `package.json`

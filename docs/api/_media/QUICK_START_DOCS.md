# Quick Start - Documentation Guide

5-minute guide to navigating the AI Security Scanner documentation.

## 🎯 I want to...

### ...understand how a scan works (end-to-end)
→ Read **[SCAN_FLOW.md](SCAN_FLOW.md)** (10-15 min read)

Start with **Phase 1** and follow through **Phase 6**. This document traces every step from when the user clicks "Scan" to when results are rendered.

### ...add a new security analyzer
→ Follow this checklist:

1. **Create analyzer file:**
   ```bash
   touch src/worker/analyzers/my-new-analyzer.ts
   ```

2. **Define interface & function:**
   ```typescript
   export interface MyAnalyzerResult {
     findings: MyFinding[]
     score: number
   }

   export async function analyzeMyCheck(
     crawlResult: CrawlerResult
   ): Promise<MyAnalyzerResult> {
     // Your logic here
   }
   ```

3. **Import in worker:** ([src/worker/index-sqlite.ts](../src/worker/index-sqlite.ts))
   ```typescript
   import { analyzeMyCheck } from './analyzers/my-new-analyzer'
   ```

4. **Call analyzer:**
   ```typescript
   const myResult = await analyzeMyCheck(crawlResult)
   ```

5. **Add to report:** ([src/worker/report-generator.ts](../src/worker/report-generator.ts))
   ```typescript
   export function generateReport(
     // ... existing params
     myAnalyzer?: MyAnalyzerResult
   ): ScanReport {
     // Add findings to report
   }
   ```

6. **Update docs:**
   ```bash
   npm run docs
   ```

### ...understand the API endpoints
→ Browse **[docs/api/app/api/](api/app/api/)**

Key endpoints:
- [POST /api/scan](api/app/api/scan/route/functions/POST.md) - Create scan
- [GET /api/scan/:id](api/app/api/scan/[id]/route/functions/GET.md) - Get results
- [POST /api/leads](api/app/api/leads/route/functions/POST.md) - Capture lead

### ...modify the security scoring system
→ Read **[docs/api/worker/scoring-v3/](api/worker/scoring-v3/)**

The scoring system uses:
- **OWASP Risk Rating** methodology
- **CVSS 3.1** scoring
- **NIST Cybersecurity Framework**
- Category-based weighted scoring

See: [src/worker/scoring-v3.ts](../src/worker/scoring-v3.ts)

### ...debug a stuck scan
→ Follow the troubleshooting guide in **[SCAN_FLOW.md](SCAN_FLOW.md#error-handling--edge-cases)**

Quick fix:
```bash
# Check scan status
sqlite3 prisma/dev.db "SELECT id, status FROM Scan ORDER BY createdAt DESC LIMIT 5"

# Reset stuck scan
sqlite3 prisma/dev.db "UPDATE Scan SET status = 'PENDING' WHERE id = 'YOUR_SCAN_ID'"

# Check worker logs
tail -f logs/worker-*.log
```

### ...understand the database schema
→ View **[prisma/schema.prisma](../prisma/schema.prisma)**

Main tables:
- `Scan` - Scan results and metadata
- `Job` - Job queue (pending/processing/completed)
- `Lead` - Captured leads
- `AiTrustScorecard` - AI Trust Score (1:1 with Scan)

Visual tool:
```bash
npx prisma studio
```

### ...work with the Playwright crawler
→ Read **[docs/api/lib/crawler-adapter/](api/lib/crawler-adapter/)**

The crawler captures:
- Full HTML source
- Network requests/responses
- Cookies with all attributes
- SSL/TLS certificates
- JavaScript evaluation results
- Screenshots (optional)

See: [src/lib/crawler-adapter.ts](../src/lib/crawler-adapter.ts)

### ...understand the worker process
→ Read **[docs/api/worker/index-sqlite/](api/worker/index-sqlite/)**

Key concepts:
- **One worker per scan** (fresh code, no cache issues)
- **Auto-spawn** from API layer
- **SQLite job queue** for persistence
- **Lock file** prevents duplicate workers
- **Timeout protection** on slow analyzers

See: [src/worker/index-sqlite.ts](../src/worker/index-sqlite.ts)

### ...find type definitions
→ Browse **[docs/api/modules.md](api/modules.md)**

Search for "interface" to find all type definitions.

Common interfaces:
- [CrawlerResult](api/lib/types/crawler-types/interfaces/CrawlerResult.md)
- [ScanReport](api/worker/report-generator/interfaces/ScanReport.md)
- [Finding](api/worker/report-generator/interfaces/Finding.md)
- [AiTrustResult](api/worker/analyzers/ai-trust-analyzer/interfaces/AiTrustResult.md)

### ...contribute to the project
→ Read **[../DOCUMENTATION.md#contributing](../DOCUMENTATION.md#contributing)**

Checklist:
1. ✅ Read relevant docs first
2. ✅ Follow TypeScript strict mode
3. ✅ Test with real websites
4. ✅ Add JSDoc comments
5. ✅ Run `npm run docs` before commit
6. ✅ Update SCAN_FLOW.md if needed

## 📚 Documentation Map

```
docs/
├── QUICK_START_DOCS.md          ← You are here
├── SCAN_FLOW.md                 ← Complete flow (2,087 lines)
├── README.md                    ← Documentation overview
│
└── api/                         ← TypeDoc generated (346 files)
    ├── README.md                ← API docs overview
    ├── modules.md               ← All modules index
    │
    ├── app/api/                 ← API endpoints
    ├── worker/                  ← Worker & analyzers
    └── lib/                     ← Core libraries
```

## 🔍 Search Tips

### Find a specific analyzer
```bash
# List all analyzers
ls src/worker/analyzers/

# Or browse TypeDoc
open docs/api/worker/analyzers/
```

### Find where a function is called
```bash
grep -r "functionName" src/
```

### Find all usages of an interface
```bash
grep -r "InterfaceName" src/ --include="*.ts"
```

### Search TypeDoc
```bash
# Open modules page and use Cmd+F
open docs/api/modules.md
```

## 💡 Pro Tips

1. **Start with SCAN_FLOW.md** - It's the Rosetta Stone of this project
2. **Use TypeDoc for reference** - Always up-to-date with code
3. **Follow type chains** - Click through interfaces in TypeDoc
4. **Check examples** - SCAN_FLOW.md has real code snippets
5. **Regenerate docs** - Run `npm run docs` after code changes

## 🎓 Learning Path

### Beginner (Day 1)
1. Read [../README.md](../README.md) - Project overview
2. Read [SCAN_FLOW.md](SCAN_FLOW.md) - Phases 1-6
3. Browse [api/modules.md](api/modules.md) - See what's available

### Intermediate (Week 1)
1. Deep dive: [SCAN_FLOW.md](SCAN_FLOW.md) - All phases
2. Study: [api/worker/](api/worker/) - Worker implementation
3. Explore: [api/worker/analyzers/](api/worker/analyzers/) - All analyzers

### Advanced (Week 2+)
1. Read source code: [src/worker/index-sqlite.ts](../src/worker/index-sqlite.ts)
2. Study scoring: [src/worker/scoring-v3.ts](../src/worker/scoring-v3.ts)
3. Understand crawling: [src/lib/crawler-adapter.ts](../src/lib/crawler-adapter.ts)

## 🚀 Commands Reference

```bash
# Generate documentation
npm run docs

# Watch for changes (auto-regenerate)
npm run docs:watch

# Serve documentation locally
npm run docs:serve
# Then visit: http://localhost:8080

# View database
npx prisma studio

# Run development server
npm run dev

# Run worker (dev mode)
npm run worker
```

## ❓ Still Stuck?

1. **Check master guide:** [../DOCUMENTATION.md](../DOCUMENTATION.md)
2. **Use cheat sheet:** [../DOCUMENTATION_CHEATSHEET.md](../DOCUMENTATION_CHEATSHEET.md)
3. **Search SCAN_FLOW.md:** It has answers to 90% of questions
4. **Browse TypeDoc:** [api/modules.md](api/modules.md)
5. **Read source code:** When in doubt, read the code!

---

**Estimated reading time:**
- This guide: 5 minutes
- SCAN_FLOW.md: 15-20 minutes
- Full documentation: 2-3 hours

**Last Updated:** November 17, 2025

# AI Security Scanner - Documentation Cheat Sheet

Quick reference guide for navigating the documentation.

## 🚀 Quick Links

| What do you need? | Go here |
|-------------------|---------|
| **🚨 Fix/Debug something** | [docs/DEVELOPER_REFERENCE.md](docs/DEVELOPER_REFERENCE.md) ⭐ NEW! |
| **Overall documentation guide** | [DOCUMENTATION.md](DOCUMENTATION.md) |
| **Complete scan flow (end-to-end)** | [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) |
| **API documentation (auto-generated)** | [docs/api/README.md](docs/api/README.md) |
| **All modules index** | [docs/api/modules.md](docs/api/modules.md) |
| **Development setup** | [LOCALHOST_SETUP.md](LOCALHOST_SETUP.md) |
| **Project progress** | [PROGRESS.md](PROGRESS.md) |

## 📋 Common Tasks

### I want to understand how a scan works
→ Read [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) sections 1-6

### I want to add a new analyzer
→ Read [DOCUMENTATION.md - Adding a New Analyzer](DOCUMENTATION.md#adding-a-new-analyzer)

### I want to understand the API endpoints
→ Browse [docs/api/app/api/](docs/api/app/api/)

### I want to see all available TypeScript types
→ Check [docs/api/modules.md](docs/api/modules.md) and search for "interface"

### I want to regenerate documentation
```bash
npm run docs
```

### I want to debug a stuck scan
→ Read [docs/SCAN_FLOW.md - Error Handling](docs/SCAN_FLOW.md#error-handling--edge-cases)

## 🗺️ Documentation Map

```
ai-security-scanner/
│
├── README.md                    # Project overview & quick start
├── DOCUMENTATION.md             # Master documentation guide
├── DOCUMENTATION_CHEATSHEET.md  # This file
│
├── docs/
│   ├── README.md                # Documentation structure overview
│   ├── SCAN_FLOW.md             # 2,087 lines - Complete flow trace
│   │
│   └── api/                     # TypeDoc auto-generated docs
│       ├── README.md            # API docs overview
│       ├── modules.md           # All modules index
│       ├── hierarchy.md         # Type hierarchy
│       │
│       ├── app/api/             # API endpoints documentation
│       │   ├── scan/
│       │   ├── leads/
│       │   └── admin/
│       │
│       ├── worker/              # Worker & analyzers documentation
│       │   ├── analyzers/       # All 41 analyzers
│       │   ├── scoring-v3/
│       │   └── report-generator/
│       │
│       └── lib/                 # Core libraries documentation
│           ├── crawler-adapter/
│           ├── queue-sqlite/
│           └── db/
│
├── src/                         # Source code (TypeDoc reads from here)
│   ├── app/api/                 # API routes
│   ├── worker/                  # Worker & analyzers
│   └── lib/                     # Core libraries
│
└── typedoc.json                 # TypeDoc configuration
```

## 🎯 By Role

### Frontend Developer
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phases 1, 5, 6
2. [docs/api/app/api/scan/](docs/api/app/api/scan/) - API contracts

### Backend Developer
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phases 2, 3, 4
2. [docs/api/worker/](docs/api/worker/) - Worker implementation
3. [docs/api/lib/](docs/api/lib/) - Core libraries

### DevOps
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phase 4 (Worker)
2. [docs/api/worker/worker-manager/](docs/api/worker/worker-manager/) - Worker lifecycle
3. [LOCALHOST_SETUP.md](LOCALHOST_SETUP.md) - Environment setup

### Security Auditor
1. [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Phase 4 (All 41 analyzers)
2. [docs/api/worker/analyzers/](docs/api/worker/analyzers/) - Analyzer implementations
3. [docs/api/worker/scoring-v3/](docs/api/worker/scoring-v3/) - Scoring methodology

## 🔍 Finding Specific Information

### "How does X analyzer work?"
```bash
# Search TypeDoc
open docs/api/worker/analyzers/[analyzer-name]/

# Or search source code
grep -r "analyze[AnalyzerName]" src/worker/analyzers/
```

### "What does this function return?"
```bash
# Check TypeDoc interface docs
open docs/api/modules.md
# Then search for the interface name
```

### "What are all the API endpoints?"
```bash
# Browse TypeDoc API layer
open docs/api/app/api/
```

### "How do I run the worker?"
```bash
# Check setup guide
open LOCALHOST_SETUP.md
```

## 📊 Documentation Statistics

| Metric | Count |
|--------|-------|
| Manual docs lines | 2,233 |
| Auto-generated modules | 91 |
| Documented analyzers | 41 |
| API endpoints documented | 13 |
| TypeScript interfaces | 100+ |
| Functions documented | 200+ |

## 🛠️ Maintenance

### When to update documentation

| Change Type | Update Required |
|-------------|-----------------|
| New analyzer added | ✅ Run `npm run docs` |
| API endpoint changed | ✅ Run `npm run docs` + update SCAN_FLOW.md |
| New library function | ✅ Run `npm run docs` |
| Bug fix (no API change) | ⚠️ Optional |
| UI change (no logic) | ❌ Not needed |

### Documentation commands
```bash
# Regenerate TypeDoc
npm run docs

# Watch for changes (auto-regenerate)
npm run docs:watch

# Serve documentation locally
npm run docs:serve
# Then visit: http://localhost:8080
```

## 💡 Tips

1. **Start with SCAN_FLOW.md** - It's the most comprehensive document
2. **Use TypeDoc for API reference** - It's always up-to-date with source code
3. **Search is your friend** - Use Cmd+F in browser or `grep` in terminal
4. **Follow type chains** - Click on interface links in TypeDoc to understand data structures
5. **Check examples in SCAN_FLOW.md** - Contains real code snippets and flows

## ❓ Still Lost?

1. Read [DOCUMENTATION.md](DOCUMENTATION.md) - Master guide
2. Check [docs/SCAN_FLOW.md](docs/SCAN_FLOW.md) - Complete flow trace
3. Browse [docs/api/modules.md](docs/api/modules.md) - All modules
4. Search source code: `grep -r "keyword" src/`

---

**Quick command reference:**
```bash
npm run docs        # Generate documentation
npm run docs:watch  # Auto-regenerate on changes
npm run docs:serve  # Serve on localhost:8080
```

**Last Updated:** November 17, 2025

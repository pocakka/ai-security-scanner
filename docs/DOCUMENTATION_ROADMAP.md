# Documentation Roadmap - Visual Guide

Visual navigation map for all documentation in the AI Security Scanner project.

## 🗺️ Documentation Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    📚 DOCUMENTATION ROOT                        │
│                                                                 │
│  START HERE → README.md (Project overview)                      │
│            → DOCUMENTATION.md (Master guide)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│  Quick Guides  │                    │  Deep Dive Docs │
└───────┬────────┘                    └────────┬────────┘
        │                                       │
        ├─→ QUICK_START_DOCS.md                ├─→ SCAN_FLOW.md
        │   (5-min guide)                      │   (2,087 lines - Complete flow)
        │                                      │
        └─→ DOCUMENTATION_CHEATSHEET.md        └─→ api/ (TypeDoc - 346 files)
            (Quick reference)                      │
                                                   ├─→ app/api/ (API endpoints)
                                                   ├─→ worker/ (Analyzers)
                                                   └─→ lib/ (Libraries)
```

## 📊 By Learning Path

### Path 1: First-Time Developer (Day 1)
```
START → README.md (10 min)
     ↓
     QUICK_START_DOCS.md (5 min)
     ↓
     SCAN_FLOW.md - Phase 1-2 (15 min)
     ↓
     api/modules.md (Browse 5 min)
     ↓
     DONE ✓
```

### Path 2: Backend Engineer (Week 1)
```
START → README.md
     ↓
     DOCUMENTATION.md - Backend section
     ↓
     SCAN_FLOW.md - Phase 2-4 (Worker)
     ↓
     api/worker/index-sqlite/
     ↓
     api/worker/analyzers/ (Browse all 41)
     ↓
     api/lib/queue-sqlite/
     ↓
     DONE ✓
```

### Path 3: Frontend Engineer (Week 1)
```
START → README.md
     ↓
     SCAN_FLOW.md - Phase 1, 5, 6
     ↓
     api/app/api/scan/ (API contracts)
     ↓
     src/app/scan/[id]/page.tsx (Source code)
     ↓
     DONE ✓
```

### Path 4: DevOps/Infrastructure (Week 1)
```
START → README.md
     ↓
     SCAN_FLOW.md - Phase 3-4 (Queue + Worker)
     ↓
     api/worker/worker-manager/
     ↓
     api/lib/queue-sqlite/
     ↓
     prisma/schema.prisma (DB schema)
     ↓
     LOCALHOST_SETUP.md
     ↓
     DONE ✓
```

### Path 5: Security Auditor (Week 1-2)
```
START → README.md
     ↓
     SCAN_FLOW.md - Phase 4 (All analyzers)
     ↓
     api/worker/analyzers/ (All 41 analyzers)
     ↓
     api/worker/scoring-v3/ (Scoring methodology)
     ↓
     Source code review (src/worker/analyzers/)
     ↓
     DONE ✓
```

## 🎯 By Task Type

### Task: Add New Analyzer
```
1. Read: QUICK_START_DOCS.md → "add a new analyzer"
2. Template: src/worker/analyzers/template-example.ts
3. Reference: api/worker/analyzers/ (Pick similar analyzer)
4. Integration: SCAN_FLOW.md - Phase 4.5
5. Testing: Run scan with new analyzer
6. Docs: npm run docs
```

### Task: Modify Scoring System
```
1. Read: api/worker/scoring-v3/
2. Study: src/worker/scoring-v3.ts (source code)
3. Understand: SCAN_FLOW.md - Phase 4.7
4. Reference: OWASP Risk Rating + CVSS 3.1
5. Test: Verify score changes
6. Docs: npm run docs
```

### Task: Debug Stuck Scan
```
1. Check: SCAN_FLOW.md → Error Handling section
2. Database: sqlite3 prisma/dev.db
3. Logs: tail -f logs/worker-*.log
4. Worker: api/worker/worker-manager/
5. Reset: Follow troubleshooting guide
```

### Task: Understand API Endpoints
```
1. Overview: api/app/api/
2. Scan creation: api/app/api/scan/route/functions/POST.md
3. Scan retrieval: api/app/api/scan/[id]/route/functions/GET.md
4. Flow: SCAN_FLOW.md - Phase 2
```

### Task: Work with Crawler
```
1. Adapter: api/lib/crawler-adapter/
2. Playwright: api/lib/playwright-crawler/
3. Types: api/lib/types/crawler-types/
4. Flow: SCAN_FLOW.md - Phase 4.4
5. Source: src/lib/crawler-adapter.ts
```

## 📁 File Organization Map

```
ai-security-scanner/
│
├── 📄 README.md ────────────────────── Project overview & quick start
├── 📄 DOCUMENTATION.md ──────────────── Master documentation guide
├── 📄 DOCUMENTATION_CHEATSHEET.md ───── Quick reference card
│
├── 📁 docs/ ─────────────────────────── All documentation
│   │
│   ├── 📄 README.md ─────────────────── Documentation overview
│   ├── 📄 QUICK_START_DOCS.md ───────── 5-minute quick start ⚡
│   ├── 📄 DOCUMENTATION_ROADMAP.md ──── This file
│   ├── 📄 SCAN_FLOW.md ──────────────── Complete flow (2,087 lines)
│   │
│   └── 📁 api/ ──────────────────────── TypeDoc generated (346 files)
│       ├── 📄 README.md
│       ├── 📄 modules.md ────────────── All modules index
│       ├── 📄 hierarchy.md ──────────── Type hierarchy
│       │
│       ├── 📁 app/api/ ──────────────── API endpoints docs
│       │   ├── scan/
│       │   ├── leads/
│       │   └── admin/
│       │
│       ├── 📁 worker/ ───────────────── Worker & analyzers docs
│       │   ├── analyzers/ (41 analyzers)
│       │   ├── scoring-v3/
│       │   └── report-generator/
│       │
│       └── 📁 lib/ ──────────────────── Core libraries docs
│           ├── crawler-adapter/
│           ├── queue-sqlite/
│           └── db/
│
├── 📁 src/ ──────────────────────────── Source code (TypeDoc reads from here)
│   ├── app/api/
│   ├── worker/
│   └── lib/
│
└── 📄 typedoc.json ──────────────────── TypeDoc configuration
```

## 🎨 Documentation Types & When to Use

### 1. Quick Start Guide (QUICK_START_DOCS.md)
**Use when:** You need quick answers to common tasks
**Reading time:** 5 minutes
**Format:** Task-based, concise

### 2. Complete Flow Trace (SCAN_FLOW.md)
**Use when:** You need to understand the full lifecycle
**Reading time:** 15-20 minutes
**Format:** Step-by-step narrative with code examples

### 3. TypeDoc API Reference (api/)
**Use when:** You need type definitions or function signatures
**Reading time:** On-demand (search as needed)
**Format:** Auto-generated, always up-to-date

### 4. Master Guide (DOCUMENTATION.md)
**Use when:** You need comprehensive overview
**Reading time:** 30 minutes
**Format:** Structured, role-based

### 5. Cheat Sheet (DOCUMENTATION_CHEATSHEET.md)
**Use when:** You need quick reference links
**Reading time:** 2 minutes
**Format:** Tables and lists

## 🔄 Documentation Update Flow

```
Code Changes
     ↓
Add/Update JSDoc Comments
     ↓
Run: npm run docs
     ↓
TypeDoc Regenerates api/
     ↓
Manual Update: SCAN_FLOW.md (if flow changed)
     ↓
Manual Update: DOCUMENTATION.md (if major change)
     ↓
Git Commit (both code + docs)
     ↓
DONE ✓
```

## 📊 Documentation Statistics by Type

| Type | Files | Lines | Auto-Gen? | Update Frequency |
|------|-------|-------|-----------|------------------|
| Quick Start | 1 | 250 | ❌ Manual | As needed |
| Master Guides | 2 | 558 | ❌ Manual | As needed |
| Flow Trace | 1 | 2,087 | ❌ Manual | When flow changes |
| TypeDoc API | 346 | ~15,000 | ✅ Auto | On code change |
| Roadmaps | 2 | 400 | ❌ Manual | Rarely |
| **Total** | **352** | **~18,295** | 98% auto | Continuous |

## 🎯 Find Information Fast

### "How does X work?"
```
1. DOCUMENTATION_CHEATSHEET.md → Find section
2. Follow link to detailed doc
3. If code-level: api/modules.md → Search
```

### "What's the data structure?"
```
1. api/modules.md → Search for interface name
2. Click through type links
3. Or: grep -r "interface X" src/
```

### "Where is function X called?"
```
1. grep -r "functionName" src/
2. Or: IDE "Find All References"
3. Or: api/modules.md → Search function
```

### "How do I do Y?"
```
1. QUICK_START_DOCS.md → "I want to..."
2. Follow task-specific guide
3. Reference: SCAN_FLOW.md for context
```

## 💡 Pro Tips

1. **Bookmark these files:**
   - QUICK_START_DOCS.md (daily use)
   - DOCUMENTATION_CHEATSHEET.md (quick links)
   - api/modules.md (type reference)

2. **Use browser search (Cmd+F)** extensively in:
   - SCAN_FLOW.md (2,087 lines - search is essential)
   - api/modules.md (346 files indexed)

3. **Follow the links** in TypeDoc:
   - Click on interface names
   - Trace type definitions
   - Find all usages

4. **Regenerate docs frequently:**
   ```bash
   npm run docs
   # Or use watch mode during development:
   npm run docs:watch
   ```

5. **Use the right doc for the job:**
   - Quick answer? → QUICK_START_DOCS.md
   - Deep dive? → SCAN_FLOW.md
   - Type reference? → api/
   - Overview? → DOCUMENTATION.md

## 🚀 Next Steps

After reading this roadmap:

1. **Pick your learning path** above
2. **Start with QUICK_START_DOCS.md** for orientation
3. **Dive into SCAN_FLOW.md** for deep understanding
4. **Bookmark api/modules.md** for daily reference

---

**This roadmap covers:** 352 documentation files, ~18,295 lines of documentation
**Last Updated:** November 17, 2025
**Maintenance:** Update when major documentation structure changes

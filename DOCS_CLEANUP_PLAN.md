# Documentation Cleanup Plan

**Date**: November 16, 2025
**Purpose**: Organize documentation files - archive obsolete ones, keep current/relevant ones

---

## 📁 Current Documentation Structure

### ✅ KEEP - Active & Essential Documents

These documents are **up-to-date, actively used, and essential** for the project:

#### Core Documentation (Root of ai-security-scanner/)
1. **README.md** - Project overview ✅
2. **CLAUDE.md** - Main AI assistant context (38 analyzers, Sprint summary) ✅
3. **SYSTEM_ARCHITECTURE.md** - v2.1 - Complete architecture (updated Nov 12) ✅
4. **DEVELOPMENT_SPEC_COMPLETE.md** - Full feature spec with Sprint #1-12 ✅
5. **PROGRESS.md** - Sprint progress tracker (last: Sprint #12) ✅
6. **TESTING_PROTOCOL.md** - **NEW** Testing framework (Nov 16, 2025) ✅
7. **SITE_STRUCTURE.md** - **NEW** Page inventory & testing guide (Nov 16, 2025) ✅
8. **REPORT_PAGE_LAYOUT_DESIGN.md** - UI/UX specification for report page ✅

#### Technical Documentation
9. **WORKER_POOL_TECHNICAL_DOCUMENTATION.md** - Worker pool architecture ✅
10. **AI_RED_TEAMING_FULL_ANALYSIS.md** - OWASP LLM Top 10 analysis ✅

---

### 🗄️ ARCHIVE - Outdated/Redundant Documents

These documents are **historical, outdated, or superseded** by newer docs:

#### ai-security-scanner/ root (MOVE TO archived_files/docs_nov_2025/)

1. **AI_DETECTION_EXPANSION.md**
   - Date: Nov 13, 2025
   - Content: Plan for expanding AI detection (100+ services)
   - Status: ⚠️ **OUTDATED** - Implementation already done in Sprint #10-12
   - Action: Archive ➜ `archived_files/docs_nov_2025/planning/`

2. **COMMIT.md**
   - Date: Nov 13, 2025
   - Content: Sprint 9 commit history
   - Status: ⚠️ **HISTORICAL** - Sprint 9 is complete, use git log instead
   - Action: Archive ➜ `archived_files/docs_nov_2025/sprint_notes/`

3. **COMPARISON_TXT_VS_IMPLEMENTED.md**
   - Date: Nov 14, 2025
   - Content: Comparison of TXT files vs implemented chat widgets
   - Status: ⚠️ **OUTDATED** - Already implemented, no longer needed
   - Action: Archive ➜ `archived_files/docs_nov_2025/planning/`

4. **CURRENT_IMPLEMENTATION_STATUS.md**
   - Date: Nov 14, 2025 (mentions LLM API detector)
   - Content: Implementation status of AI detection
   - Status: ⚠️ **REDUNDANT** - Superseded by CLAUDE.md and DEVELOPMENT_SPEC_COMPLETE.md
   - Action: Archive ➜ `archived_files/docs_nov_2025/planning/`

5. **AI_WEB_TECHNOLOGIES_COMPREHENSIVE_RESEARCH.md**
   - Date: Nov 14, 2025
   - Content: Catalog of 150+ AI services
   - Status: ⚠️ **REFERENCE** - Useful for future but not actively used
   - Action: Archive ➜ `archived_files/docs_nov_2025/research/`

6. **CURRENT_ANALYZERS_DOCUMENTATION.md**
   - Content: Analyzer documentation
   - Status: ⚠️ **REDUNDANT** - Superseded by SYSTEM_ARCHITECTURE.md
   - Action: Archive ➜ `archived_files/docs_nov_2025/legacy/`

7. **FEATURE_ENHANCEMENT_PLAN.md**
   - Content: Feature enhancement roadmap
   - Status: ⚠️ **OUTDATED** - Most features already implemented
   - Action: Archive ➜ `archived_files/docs_nov_2025/planning/`

8. **IMPLEMENTATION_PRIORITY.md**
   - Content: Implementation priority list
   - Status: ⚠️ **OUTDATED** - Sprint #1-12 complete
   - Action: Archive ➜ `archived_files/docs_nov_2025/planning/`

9. **NEWLY_IMPLEMENTED_CHAT_WIDGETS.md**
   - Content: List of newly implemented chat widgets
   - Status: ⚠️ **OUTDATED** - Already in SYSTEM_ARCHITECTURE.md
   - Action: Archive ➜ `archived_files/docs_nov_2025/legacy/`

10. **P1_DETECTOR_TEST_REPORT.md**
    - Content: Test report for P1 detector
    - Status: ⚠️ **HISTORICAL** - Test already passed
    - Action: Archive ➜ `archived_files/docs_nov_2025/testing/`

11. **SCORING_SYSTEM_V2_PROFESSIONAL.md**
    - Content: V2 scoring system design
    - Status: ⚠️ **OBSOLETE** - V3 is now implemented
    - Action: Archive ➜ `archived_files/docs_nov_2025/legacy/`

12. **SCORING_V3_MATHEMATICS.md**
    - Content: V3 scoring system mathematics
    - Status: ✅ **KEEP** - Current scoring system (actually keep this!)
    - Action: **KEEP in root**

13. **SESSION_2025-11-13.md**
    - Content: Session notes from Nov 13
    - Status: ⚠️ **HISTORICAL** - Session already complete
    - Action: Archive ➜ `archived_files/docs_nov_2025/session_notes/`

14. **SESSION_2025-11-14_AI_DETECTION_PHASE1.md**
    - Content: Session notes from Nov 14
    - Status: ⚠️ **HISTORICAL** - Session already complete
    - Action: Archive ➜ `archived_files/docs_nov_2025/session_notes/`

15. **SYSTEM_ARCHITECTURE_DOCUMENTATION.md**
    - Content: System architecture (older version)
    - Status: ⚠️ **OBSOLETE** - Superseded by SYSTEM_ARCHITECTURE.md v2.1
    - Action: Archive ➜ `archived_files/docs_nov_2025/legacy/`

16. **tartalek.md**
    - Content: Backup/reserve file
    - Status: ⚠️ **UNKNOWN** - Need to check if contains anything valuable
    - Action: Review then Archive ➜ `archived_files/docs_nov_2025/misc/`

#### Root directory (10_M_USD/) - MOVE TO archived_files/root_docs_nov_2025/

17. **AI_DETECTION_UNIFICATION.md**
    - Status: ⚠️ **OUTDATED** - Already unified in ai-security-scanner/
    - Action: Archive ➜ `archived_files/root_docs_nov_2025/`

18. **AI_TRUST_SCORE_DOCUMENTATION.md**
    - Status: ⚠️ **REDUNDANT** - Already in SYSTEM_ARCHITECTURE.md
    - Action: Archive ➜ `archived_files/root_docs_nov_2025/`

19. **OWASP_LLM_AI_DETECTION_PREREQUISITE.md**
    - Status: ⚠️ **REDUNDANT** - Covered in AI_RED_TEAMING_FULL_ANALYSIS.md
    - Action: Archive ➜ `archived_files/root_docs_nov_2025/`

20. **OWASP_LLM_CONFIDENCE_LEVELS.md**
    - Status: ⚠️ **REDUNDANT** - Covered in SYSTEM_ARCHITECTURE.md
    - Action: Archive ➜ `archived_files/root_docs_nov_2025/`

21. **PROGRESS.md** (root, NOT ai-security-scanner/PROGRESS.md)
    - Status: ⚠️ **DUPLICATE** - Same as ai-security-scanner/PROGRESS.md
    - Action: DELETE (keep the one in ai-security-scanner/)

22. **test-vulnerable-ai-app-README.md**
    - Status: ✅ **KEEP** - Test app documentation (still useful for testing)
    - Action: **KEEP in root**

---

## 📂 Proposed Archive Structure

```
archived_files/
├── docs_nov_2025/                    # NEW: Nov 2025 archive
│   ├── planning/                     # Implementation planning docs
│   │   ├── AI_DETECTION_EXPANSION.md
│   │   ├── COMPARISON_TXT_VS_IMPLEMENTED.md
│   │   ├── CURRENT_IMPLEMENTATION_STATUS.md
│   │   ├── FEATURE_ENHANCEMENT_PLAN.md
│   │   └── IMPLEMENTATION_PRIORITY.md
│   ├── research/                     # Research documents
│   │   └── AI_WEB_TECHNOLOGIES_COMPREHENSIVE_RESEARCH.md
│   ├── sprint_notes/                 # Sprint commit histories
│   │   └── COMMIT.md
│   ├── session_notes/                # Session notes
│   │   ├── SESSION_2025-11-13.md
│   │   └── SESSION_2025-11-14_AI_DETECTION_PHASE1.md
│   ├── testing/                      # Historical test reports
│   │   └── P1_DETECTOR_TEST_REPORT.md
│   ├── legacy/                       # Superseded documents
│   │   ├── CURRENT_ANALYZERS_DOCUMENTATION.md
│   │   ├── NEWLY_IMPLEMENTED_CHAT_WIDGETS.md
│   │   ├── SCORING_SYSTEM_V2_PROFESSIONAL.md
│   │   └── SYSTEM_ARCHITECTURE_DOCUMENTATION.md
│   └── misc/                         # Miscellaneous
│       └── tartalek.md
├── root_docs_nov_2025/               # NEW: Root-level docs archive
│   ├── AI_DETECTION_UNIFICATION.md
│   ├── AI_TRUST_SCORE_DOCUMENTATION.md
│   ├── OWASP_LLM_AI_DETECTION_PREREQUISITE.md
│   └── OWASP_LLM_CONFIDENCE_LEVELS.md
└── (existing archives...)
```

---

## 🎯 Final Active Documentation List (10 files)

After cleanup, these will be the **ONLY** documentation files in the active project:

### ai-security-scanner/ (9 files)
1. README.md
2. CLAUDE.md
3. SYSTEM_ARCHITECTURE.md
4. DEVELOPMENT_SPEC_COMPLETE.md
5. PROGRESS.md
6. TESTING_PROTOCOL.md ⭐ NEW
7. SITE_STRUCTURE.md ⭐ NEW
8. REPORT_PAGE_LAYOUT_DESIGN.md
9. WORKER_POOL_TECHNICAL_DOCUMENTATION.md
10. AI_RED_TEAMING_FULL_ANALYSIS.md
11. SCORING_V3_MATHEMATICS.md

### Root (10_M_USD/) (1 file)
1. test-vulnerable-ai-app-README.md

**Total Active Docs**: 12 files (down from 28 files)

---

## ✅ Cleanup Commands

Run these commands to execute the cleanup:

```bash
# Create archive directory structure
mkdir -p archived_files/docs_nov_2025/{planning,research,sprint_notes,session_notes,testing,legacy,misc}
mkdir -p archived_files/root_docs_nov_2025

# Move ai-security-scanner/ docs
cd ai-security-scanner

# Planning docs
mv AI_DETECTION_EXPANSION.md archived_files/docs_nov_2025/planning/
mv COMPARISON_TXT_VS_IMPLEMENTED.md archived_files/docs_nov_2025/planning/
mv CURRENT_IMPLEMENTATION_STATUS.md archived_files/docs_nov_2025/planning/
mv FEATURE_ENHANCEMENT_PLAN.md archived_files/docs_nov_2025/planning/
mv IMPLEMENTATION_PRIORITY.md archived_files/docs_nov_2025/planning/

# Research docs
mv AI_WEB_TECHNOLOGIES_COMPREHENSIVE_RESEARCH.md archived_files/docs_nov_2025/research/

# Sprint notes
mv COMMIT.md archived_files/docs_nov_2025/sprint_notes/

# Session notes
mv SESSION_2025-11-13.md archived_files/docs_nov_2025/session_notes/
mv SESSION_2025-11-14_AI_DETECTION_PHASE1.md archived_files/docs_nov_2025/session_notes/

# Testing
mv P1_DETECTOR_TEST_REPORT.md archived_files/docs_nov_2025/testing/

# Legacy
mv CURRENT_ANALYZERS_DOCUMENTATION.md archived_files/docs_nov_2025/legacy/
mv NEWLY_IMPLEMENTED_CHAT_WIDGETS.md archived_files/docs_nov_2025/legacy/
mv SCORING_SYSTEM_V2_PROFESSIONAL.md archived_files/docs_nov_2025/legacy/
mv SYSTEM_ARCHITECTURE_DOCUMENTATION.md archived_files/docs_nov_2025/legacy/

# Misc
mv tartalek.md archived_files/docs_nov_2025/misc/

# Move root-level docs
cd ..
mv AI_DETECTION_UNIFICATION.md archived_files/root_docs_nov_2025/
mv AI_TRUST_SCORE_DOCUMENTATION.md archived_files/root_docs_nov_2025/
mv OWASP_LLM_AI_DETECTION_PREREQUISITE.md archived_files/root_docs_nov_2025/
mv OWASP_LLM_CONFIDENCE_LEVELS.md archived_files/root_docs_nov_2025/

# Delete duplicate
rm PROGRESS.md  # (keep ai-security-scanner/PROGRESS.md)
```

---

## 📋 Verification Checklist

After running cleanup:

- [ ] ai-security-scanner/ has exactly 11 MD files
- [ ] Root (10_M_USD/) has exactly 1 MD file (test-vulnerable-ai-app-README.md)
- [ ] All archived files are in archived_files/docs_nov_2025/
- [ ] All essential docs are still accessible
- [ ] Git status shows only archived file movements

---

## 🚀 Next Steps After Cleanup

1. **Commit the cleanup**:
   ```bash
   git add -A
   git commit -m "docs: Archive obsolete documentation (Nov 2025 cleanup)

   - Moved 16 outdated docs to archived_files/docs_nov_2025/
   - Moved 4 root-level docs to archived_files/root_docs_nov_2025/
   - Deleted duplicate PROGRESS.md from root
   - Active docs reduced from 28 to 12 files
   - Improves documentation discoverability and maintenance
   "
   ```

2. **Update CLAUDE.md** to reference new TESTING_PROTOCOL.md and SITE_STRUCTURE.md

3. **Create .github/CONTRIBUTING.md** pointing to active documentation

---

**Reason for cleanup**: Too many overlapping/outdated docs makes it hard to find the "source of truth". This cleanup establishes clear, non-redundant documentation structure.

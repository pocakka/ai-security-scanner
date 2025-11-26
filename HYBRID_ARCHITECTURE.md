# Hybrid PHP+Playwright Scanning Architecture

## Overview

Two-tier scanning system for massive scale:
- **Fast Lane**: PHP curl for 95% of domains (0.5-1s/scan)
- **Deep Lane**: Playwright for 5% JS-heavy domains (8-15s/scan)

## Architecture

```
User Request → API (/api/scan)
                 ↓
            Create PENDING scan
                 ↓
            Job Queue (SQLite)
                 ↓
         ┌──────────────────┐
         │  Hybrid Router   │
         │  (TypeScript)    │
         └──────────────────┘
                 ↓
        ┌────────┴────────┐
        ↓                 ↓
   Fast Lane          Deep Lane
   (PHP curl)         (Playwright)
   95% domains        5% domains
   0.5-1s/scan       8-15s/scan
        ↓                 ↓
        └────────┬────────┘
                 ↓
       TypeScript Analyzers
       (unchanged - work with both)
                 ↓
          Database (PostgreSQL)
```

## Decision Logic

**Fast Lane** (PHP curl) for:
- Static websites
- Corporate sites
- Blogs, portfolios
- E-commerce (Shopify, WooCommerce)
- Most government/education sites
- 95% of all domains

**Deep Lane** (Playwright) for:
- Single-page apps (React/Vue/Angular)
- AI chatbot interfaces
- Dynamic search/recommendation engines
- Client-side rendered content
- User-initiated scans (always deep)
- Domains that failed fast scan
- 5% of all domains

## Implementation Files

### 1. PHP Fast Scanner
**File**: `workers/fast-scanner/scanner.php`
- curl-based HTML fetching
- Extract headers, HTML, meta tags, scripts
- Return JSON output
- No JS execution

### 2. Hybrid Worker Router
**File**: `src/worker/index-hybrid.ts`
- Read job from queue
- Decide: fast vs deep scan
- Execute appropriate scanner
- Call TypeScript analyzers
- Save results to database

### 3. Database Schema Update
**File**: `prisma/schema.prisma`
- Add `scanType` field: FAST | DEEP
- Add `scanDuration` field: milliseconds
- Add `workerType` field: PHP | PLAYWRIGHT

### 4. Fast Scanner CLI Wrapper
**File**: `src/worker/fast-scanner-wrapper.ts`
- Execute PHP scanner via child_process
- Parse JSON output
- Format for analyzers

## Data Flow

### Fast Lane Flow
```
1. Router: Determine domain needs fast scan
2. PHP Scanner: curl fetch HTML + headers
3. PHP Output: JSON with {html, headers, meta, scripts}
4. TS Wrapper: Parse PHP output
5. TS Analyzers: Run all 50+ analyzers (unchanged)
6. Database: Save results with scanType=FAST
```

### Deep Lane Flow
```
1. Router: Determine domain needs deep scan
2. Playwright: Full browser rendering
3. Page Object: Extract HTML + headers + network logs
4. TS Analyzers: Run all 50+ analyzers (unchanged)
5. Database: Save results with scanType=DEEP
```

## Performance Comparison

| Metric | Fast Lane (PHP) | Deep Lane (Playwright) | Improvement |
|--------|----------------|------------------------|-------------|
| Speed | 0.5-1s | 8-15s | 10-15x faster |
| Memory | 10-20 MB | 400-800 MB | 40x less RAM |
| CPU | 5-10% | 50-80% | 8x less CPU |
| Concurrency | 500 workers | 50 workers | 10x more workers |

## Batch Scanning Performance

**Current System (Playwright only)**:
- 50 PM2 workers
- 8s average/scan
- = 22,500 scans/day

**Hybrid System (95% fast, 5% deep)**:
- 500 fast workers (PHP)
- 50 deep workers (Playwright)
- 1s average for fast lane
- 10s average for deep lane
- = **450,000 scans/day** (20x improvement)

## User-Initiated vs Batch Scans

### User-Initiated (via UI)
- Always use Playwright (deep scan)
- Full JS rendering
- Complete network analysis
- Best quality results
- Real-time progress updates

### Batch Scans (bulk processing)
- Use hybrid routing
- 95% fast lane, 5% deep lane
- Massive throughput
- Identical analyzer quality for 95% of cases

## Intelligent Routing Rules

**Fast Lane Criteria** (if ANY match → use fast):
1. Domain matches known patterns:
   - `*.wordpress.com`
   - `*.shopify.com`
   - `*.wix.com`
   - `*.squarespace.com`
   - `*.gov`, `*.edu`
2. No AI-related keywords in domain
3. Not in "known JS-heavy domains" list
4. Batch scan (not user-initiated)

**Deep Lane Criteria** (if ANY match → use deep):
1. User-initiated scan (always)
2. Domain contains AI keywords: `ai`, `chat`, `gpt`, `bot`, `assistant`
3. Known SPA frameworks detected in fast scan
4. Fast scan returned < 50KB HTML (likely SPA)
5. Domain in "known JS-heavy domains" list
6. Fast scan failed or timed out

## Rollback Plan

If hybrid system has issues:
1. Feature flag in database: `useHybridScanning = false`
2. Router falls back to Playwright for all scans
3. No data loss, system continues working
4. Can toggle per domain or globally

## Success Metrics

- **Performance**: 20x faster batch scanning (22.5K → 450K/day)
- **Quality**: 95% identical analyzer results
- **Cost**: 10x lower infrastructure costs
- **Scalability**: Can handle millions of domains/day with multi-server setup

## Next Steps

1. ✅ Design architecture (this document)
2. ⏳ Implement PHP fast scanner
3. ⏳ Implement TypeScript router
4. ⏳ Update database schema
5. ⏳ Test with sample domains
6. ⏳ Deploy to production

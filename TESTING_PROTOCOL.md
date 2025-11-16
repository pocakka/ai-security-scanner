# Testing Protocol & Stabilization Constitution
**AI Security Scanner - Comprehensive Testing Framework**

Version: 1.0
Last Updated: November 16, 2025

---

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Pre-Release Checklist](#pre-release-checklist)
3. [Test Categories](#test-categories)
4. [Known Issues & Mitigation](#known-issues--mitigation)
5. [Performance Benchmarks](#performance-benchmarks)
6. [False Positive Prevention](#false-positive-prevention)
7. [Worker Stability Rules](#worker-stability-rules)
8. [Regression Testing](#regression-testing)

---

## Testing Philosophy

### Core Principles
1. **Stability over Features** - Never ship a new analyzer if it crashes the worker
2. **Real-World Testing** - Always test with production-like domains (not localhost/example.com)
3. **Performance First** - Timeout protection on every analyzer (max 30s per analyzer)
4. **False Positive Awareness** - Better to miss a finding than report false positives
5. **Incremental Validation** - Test each analyzer individually before integration

### Testing Mindset
- **Test like a user** - Always test from UI (http://localhost:3000), not just API
- **Test edge cases** - Large HTML (>5MB), slow domains, AI-heavy sites, non-AI sites
- **Test failure modes** - What happens when DNS fails? When worker crashes? When DB locks?
- **Monitor resource usage** - Check memory, CPU, database locks during scans

---

## Pre-Release Checklist

### Before ANY Commit
- [ ] Worker completes at least 3 scans without hanging
- [ ] No infinite loops in new code (especially regex.exec!)
- [ ] No database schema changes without migration
- [ ] DELETE functionality works from dashboard
- [ ] No processes left running after testing

### Before Pushing to Production
- [ ] All 10 test domains completed successfully (see Test Suite #1)
- [ ] False positive rate < 10% on AI Trust checks
- [ ] Average scan time < 3 minutes for medium-sized sites
- [ ] Worker auto-recovery after crash works
- [ ] Dashboard shows real-time scan status correctly
- [ ] Lead generation form captures emails properly

---

## Test Categories

### Test Suite #1: Domain Diversity Test (10 URLs)

**Purpose:** Ensure scanner handles different site types, sizes, and technologies.

| # | Domain | Type | Expected Behavior | Key Checks |
|---|--------|------|-------------------|------------|
| 1 | https://github.com | Large SPA | Completes in <4min | Tech stack detection, no false AI positives |
| 2 | https://openai.com | AI-heavy | Completes in <3min | High AI Trust score, detects GPT |
| 3 | https://harvard.edu | Large traditional | Completes in <5min | No worker timeout, handles large HTML |
| 4 | https://hashnode.com | Blog platform | Completes in <2min | Detects AI features, no regex hang |
| 5 | https://aws.amazon.com | Mega-site | Completes in <6min | No infinite loop, handles JS-heavy |
| 6 | https://example.com | Minimal | Completes in <30s | Fast path, minimal findings |
| 7 | https://stripe.com | API-focused | Completes in <3min | API discovery accurate, no false keys |
| 8 | https://shopify.com | E-commerce | Completes in <3min | Cookie security, client-side checks |
| 9 | https://vercel.com | Tech company | Completes in <2min | SSL/TLS perfect, modern stack |
| 10 | https://anthropic.com | AI company | Completes in <2min | High AI Trust, detects Claude |

**Test Command:**
```bash
for url in "https://github.com" "https://openai.com" "https://harvard.edu" "https://hashnode.com" "https://aws.amazon.com" "https://example.com" "https://stripe.com" "https://shopify.com" "https://vercel.com" "https://anthropic.com"; do
  echo "Testing: $url"
  curl -s http://localhost:3000/api/scan -X POST -H "Content-Type: application/json" -d "{\"url\":\"$url\"}" | jq '{scanId, message}'
  sleep 2
done
```

### Test Suite #2: Edge Cases (5 URLs)

**Purpose:** Test failure modes and edge cases.

| # | Test Case | URL | Expected Behavior |
|---|-----------|-----|-------------------|
| 1 | DNS timeout | https://nonexistent-domain-12345.com | Fails gracefully, clear error message |
| 2 | Redirect loop | (create test redirect) | Timeout after 10s, reports error |
| 3 | 404 page | https://github.com/nonexistent-repo-xyz | Scans 404 page, low findings |
| 4 | Very slow site | (use throttled connection) | Timeout protection works, scan completes |
| 5 | Malformed HTML | (create test HTML) | Parser doesn't crash, completes scan |

### Test Suite #3: Analyzer-Specific Tests

**Purpose:** Validate each critical analyzer individually.

#### A) Passive API Discovery
```bash
# Test URLs: hashnode.com, stripe.com, github.com
# Expected: No infinite loop, max 100 endpoints per pattern
# Monitor: Worker log should show "Analyzing Passive API Discovery..." completes in <5s
```

#### B) API Key Detection
```bash
# Test URLs: Public GitHub repos with .env examples
# Expected: Detects real keys, ignores Passport.js, no false positives from docs
# False Positive Check: Should NOT flag "passport.authenticate" as API key
```

#### C) AI Trust Scorecard
```bash
# Test URLs: openai.com (high), github.com (low/none)
# Expected: Accurate AI detection, confidence levels correct
# openai.com should score >70, github.com should score <30
```

#### D) Tech Stack Detection
```bash
# Test URLs: nextjs.org (Next.js), svelte.dev (Svelte)
# Expected: Detects framework correctly, version if available
# Should detect: React, Vue, Angular, Next.js, Nuxt, Svelte, etc.
```

---

## Known Issues & Mitigation

### Issue #1: Regex.exec() Infinite Loop
**Symptoms:** Worker hangs at "Analyzing [analyzer name]..." indefinitely

**Root Cause:** Using `while ((match = regex.exec(html)) !== null)` with global flag

**Fix Pattern:**
```typescript
// ❌ NEVER DO THIS:
while ((match = regex.exec(html)) !== null) {
  // process match
}

// ✅ ALWAYS DO THIS:
for (const match of html.matchAll(regex)) {
  // process match
  if (matchCount++ > MAX_MATCHES) break // Add limit!
}
```

**Prevention:**
- Search codebase for `regex.exec` before every commit: `grep -r "regex.exec\|\.exec(" src/worker/analyzers/`
- Add unit tests for large HTML (>1MB)

### Issue #2: Database Lock (SQLite)
**Symptoms:** `attempt to write a readonly database` error, DELETE returns 500

**Root Cause:** Multiple Node processes accessing SQLite, wrong permissions, stale lock files

**Fix:**
```bash
# Kill all processes
killall -9 node npm tsx

# Clean locks
rm -f prisma/*.db-shm prisma/*.db-wal

# Fix permissions
chmod 664 prisma/dev.db
chmod 775 prisma

# Regenerate Prisma client
npx prisma generate

# Clean Next.js cache
rm -rf .next
```

**Prevention:**
- Only run ONE dev server + ONE worker at a time
- Check `lsof prisma/dev.db` before committing
- Never commit `dev.db` changes

### Issue #3: False Positives - API Key Detection
**Symptoms:** Reports "passport", "session", "config" as API keys

**Root Cause:** Overly aggressive regex patterns matching code snippets

**Mitigation Strategy:**
```typescript
const FALSE_POSITIVE_PATTERNS = [
  /passport\.authenticate/i,
  /passport\.use/i,
  /session\.save/i,
  /config\.get/i,
  // Add more as discovered
]

// Check finding against false positive list
if (FALSE_POSITIVE_PATTERNS.some(pattern => finding.match(pattern))) {
  continue // Skip this finding
}
```

**Testing:** After every API key detector change, run:
```bash
# Should NOT flag these as API keys:
curl -s https://www.passportjs.org/docs/ | grep -i "passport.authenticate"
```

### Issue #4: Worker Crashes on Large HTML
**Symptoms:** Worker stops processing, scan stuck at "SCANNING" status

**Root Cause:** Memory exhaustion, regex catastrophic backtracking

**Mitigation:**
- Limit HTML size to 5MB: `const html = await response.text().substring(0, 5_000_000)`
- Use non-backtracking regex: `/(pattern)/` instead of `/(pattern.*?another)/`
- Add timeout wrapper around each analyzer (30s max)

---

## Performance Benchmarks

### Acceptable Performance Targets
| Site Size | Expected Scan Time | Max Acceptable |
|-----------|-------------------|----------------|
| Small (<500KB HTML) | 30-60s | 2 min |
| Medium (500KB-2MB) | 1-2 min | 4 min |
| Large (2MB-5MB) | 2-4 min | 8 min |
| Mega (>5MB) | 4-6 min | 10 min |

### Analyzer Performance Targets
Each analyzer should complete in <30s. If any analyzer takes >30s, investigate:
1. Is regex pattern optimized?
2. Is there unnecessary HTML parsing?
3. Can we add early exit conditions?

### Worker Pool Performance
- **Concurrency:** 3 workers (adjustable via WORKER_POOL_SIZE)
- **Job processing rate:** 1 scan every 2-3 minutes (avg)
- **Memory usage:** <500MB per worker
- **CPU usage:** <50% per worker

---

## False Positive Prevention

### Golden Rules
1. **Context matters** - Don't flag code examples/documentation as real findings
2. **Confidence levels** - Use LOW/MEDIUM/HIGH confidence, not just binary yes/no
3. **Allowlists** - Maintain lists of known false positives per analyzer
4. **Manual verification** - Before adding new detection pattern, verify on 10+ sites

### False Positive Testing Checklist
After modifying any analyzer:
- [ ] Test on documentation sites (passport.js, express.js docs)
- [ ] Test on GitHub (public repos often have .env.example files)
- [ ] Test on tutorial sites (often show API keys in examples)
- [ ] Check if confidence level is appropriate
- [ ] Verify evidence data is helpful for manual review

### Confidence Level Guidelines
```typescript
// HIGH confidence (>90% sure it's a real issue)
- SSL certificate expired (verified via date check)
- Missing Content-Security-Policy header (binary check)
- API key in URL parameter (aikey=sk-proj-...)

// MEDIUM confidence (70-90% sure)
- Suspicious pattern matches known API key format
- Cookie without HttpOnly (could be intentional)
- No AI policy link (might use different URL structure)

// LOW confidence (<70% - possibly false positive)
- Generic string matches API key regex
- AI detection based on single keyword
- Tech stack detection from common library name
```

---

## Worker Stability Rules

### Architecture Rules
1. **One worker process at a time** (unless using worker pool)
2. **Graceful shutdown** - Handle SIGTERM/SIGINT properly
3. **Error boundaries** - Each analyzer wrapped in try/catch
4. **Timeout protection** - Every network call has timeout
5. **Memory limits** - Restart worker if memory >1GB

### Error Handling Standards
```typescript
// ✅ Good: Analyzer with proper error handling
async function analyzeXYZ(scan: Scan): Promise<AnalyzerResult> {
  try {
    const result = await Promise.race([
      actualAnalysis(scan),
      timeout(30000) // 30s timeout
    ])
    return result
  } catch (error) {
    console.error('[XYZ Analyzer] Error:', error.message)
    return {
      findings: [],
      error: 'Analysis failed - timeout or error',
      completed: false
    }
  }
}

// ❌ Bad: No error handling, no timeout
async function analyzeXYZ(scan: Scan): Promise<AnalyzerResult> {
  const data = await fetch(scan.url) // Can hang forever!
  const regex = /pattern/g
  while ((match = regex.exec(data)) !== null) { // Infinite loop!
    // ...
  }
}
```

### Recovery Mechanisms
1. **Auto-restart on crash** - Use PM2 or systemd
2. **Stuck scan detection** - If scan is "SCANNING" for >15 minutes, mark as FAILED
3. **Database cleanup** - Scheduled job to clean up stuck scans
4. **Health check endpoint** - `/api/workers/status` should show worker health

---

## Regression Testing

### After Every Major Change
Run the full test suite (Test Suite #1 + #2 + #3) and verify:
- [ ] All 10 diverse domains complete successfully
- [ ] No worker hangs or crashes
- [ ] False positive rate unchanged or improved
- [ ] Performance unchanged or improved
- [ ] Dashboard DELETE works
- [ ] New scans can be created from UI

### Automated Regression Tests (Future)
```bash
# Planned: Automated test suite
npm run test:integration

# Should test:
# - Worker completes scan end-to-end
# - All analyzers run without errors
# - Database operations (create, read, update, delete)
# - API endpoints return correct status codes
# - False positive rate on known test cases
```

### Manual Smoke Test (5 minutes)
1. Create scan from UI: http://localhost:3000
2. Watch worker logs: `npm run worker`
3. Verify scan completes in dashboard: http://localhost:3000/aiq_beleges_mrd/dashboard
4. View report: http://localhost:3000/scan/[id]
5. Delete scan from dashboard
6. Verify deletion worked

---

## Testing Workflow Example

### Example: Testing a New Analyzer

**Step 1: Unit Test (Isolated)**
```typescript
// Test with small HTML snippet
const testHtml = '<div>test content</div>'
const result = await newAnalyzer.analyze(testHtml)
console.assert(result.findings.length >= 0, 'Should return findings array')
```

**Step 2: Integration Test (Small Site)**
```bash
# Test with small, fast site
curl -X POST http://localhost:3000/api/scan -d '{"url":"https://example.com"}'
# Watch worker logs for errors
```

**Step 3: Stress Test (Large Site)**
```bash
# Test with large, complex site
curl -X POST http://localhost:3000/api/scan -d '{"url":"https://aws.amazon.com"}'
# Monitor: Should complete in <6 minutes without hanging
```

**Step 4: False Positive Check**
```bash
# Test with sites that might trigger false positives
# (docs sites, tutorial sites, GitHub repos)
```

**Step 5: Production-Like Test**
```bash
# Test with actual target audience sites (AI-heavy sites)
curl -X POST http://localhost:3000/api/scan -d '{"url":"https://openai.com"}'
```

---

## Appendix: Common Test Commands

### Check Worker Status
```bash
ps aux | grep -E "npm run worker|tsx.*worker"
```

### Monitor Scan Progress
```bash
# Get scan status
curl -s http://localhost:3000/api/scan/[SCAN_ID] | jq '{status, riskScore}'

# Watch worker logs
tail -f /tmp/worker-output.log
```

### Database Queries
```bash
# Count scans by status
sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM Scan GROUP BY status"

# Find stuck scans (SCANNING for >15 min)
sqlite3 prisma/dev.db "SELECT id, url, status, datetime(startedAt) FROM Scan WHERE status='SCANNING' AND startedAt < datetime('now', '-15 minutes')"

# Clean up old test scans
sqlite3 prisma/dev.db "DELETE FROM Scan WHERE url LIKE '%example.com%'"
```

### Performance Monitoring
```bash
# Check memory usage
ps aux | grep "tsx.*worker" | awk '{print $4 "%", $11}'

# Monitor database size
ls -lh prisma/dev.db

# Check running Node processes
lsof -ti:3000
```

---

## Version History
- **v1.0** (Nov 16, 2025) - Initial testing protocol based on Sprint #1-12 learnings
  - Added regex.exec() infinite loop prevention
  - Database lock mitigation strategies
  - False positive prevention guidelines
  - Worker stability rules

---

**Remember:** Stability > Features. A scanner that crashes 10% of the time is worthless. A scanner that gives 30% false positives loses trust. Test thoroughly, test realistically, test before you ship.

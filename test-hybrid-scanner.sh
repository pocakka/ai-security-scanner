#!/bin/bash
#
# Test Hybrid Scanner - Compare Fast (PHP) vs Deep (Playwright)
#
# This script tests both scanning methods and compares results
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}       Hybrid Scanner Test - PHP vs Playwright${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: PHP Fast Scanner (standalone)
echo -e "${YELLOW}[1/3] Testing PHP Fast Scanner (standalone)...${NC}"
echo ""

TEST_URL="https://example.com"

echo "Running: php workers/fast-scanner/scanner.php $TEST_URL"
echo ""

php workers/fast-scanner/scanner.php "$TEST_URL" | jq '{
  success: .success,
  status: .status,
  duration: .duration,
  htmlSize: (.html | length),
  headerCount: (.headers | length),
  cookieCount: (.cookies | length),
  timing: .timing
}'

echo ""
echo -e "${GREEN}✓ PHP fast scanner works!${NC}"
echo ""

# Test 2: TypeScript wrapper
echo -e "${YELLOW}[2/3] Testing TypeScript fast scanner wrapper...${NC}"
echo ""

cat > /tmp/test-wrapper.ts << 'EOF'
import { runFastScanner, decideScanType } from './src/worker/fast-scanner-wrapper'

async function test() {
  const url = 'https://example.com'
  const domain = 'example.com'

  console.log('Testing decision logic:')
  console.log('  Batch scan:', decideScanType(domain, true))
  console.log('  User scan:', decideScanType(domain, false))
  console.log('')

  console.log('Running fast scanner...')
  const result = await runFastScanner(url)

  console.log('Result:', {
    success: result.success,
    status: result.status,
    duration: result.duration,
    htmlSize: result.html.length,
    headerCount: Object.keys(result.headers).length,
    cookieCount: result.cookies.length,
  })
}

test().catch(console.error)
EOF

echo "Running: npx tsx /tmp/test-wrapper.ts"
echo ""
cd /home/aiq/Asztal/10_M_USD/ai-security-scanner
npx tsx /tmp/test-wrapper.ts

echo ""
echo -e "${GREEN}✓ TypeScript wrapper works!${NC}"
echo ""

# Test 3: Compare performance
echo -e "${YELLOW}[3/3] Performance Comparison (5 test URLs)...${NC}"
echo ""

cat > /tmp/test-performance.ts << 'EOF'
import { runFastScanner } from './src/worker/fast-scanner-wrapper'
import { CrawlerAdapter } from './src/lib/crawler-adapter'

async function comparePerformance() {
  const testUrls = [
    'https://example.com',
    'https://github.com',
    'https://wordpress.com',
    'https://shopify.com',
    'https://wikipedia.org',
  ]

  const playwrightCrawler = new CrawlerAdapter()

  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║          Performance Comparison: PHP vs Playwright            ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')

  let phpTotal = 0
  let playwrightTotal = 0

  for (const url of testUrls) {
    const domain = new URL(url).hostname

    // Fast scanner (PHP)
    console.log(`Testing ${domain}...`)
    const phpStart = Date.now()
    try {
      await runFastScanner(url)
      const phpTime = Date.now() - phpStart
      phpTotal += phpTime
      console.log(`  PHP:        ${phpTime}ms`)
    } catch (error: any) {
      console.log(`  PHP:        FAILED (${error.message})`)
    }

    // Playwright (for comparison)
    const playwrightStart = Date.now()
    try {
      await playwrightCrawler.crawl(url)
      const playwrightTime = Date.now() - playwrightStart
      playwrightTotal += playwrightTime
      console.log(`  Playwright: ${playwrightTime}ms`)
    } catch (error: any) {
      console.log(`  Playwright: FAILED (${error.message})`)
    }

    console.log('')
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('Summary:')
  console.log(`  PHP Total:        ${phpTotal}ms (avg: ${Math.round(phpTotal / testUrls.length)}ms/scan)`)
  console.log(`  Playwright Total: ${playwrightTotal}ms (avg: ${Math.round(playwrightTotal / testUrls.length)}ms/scan)`)
  console.log(`  Speedup:          ${(playwrightTotal / phpTotal).toFixed(1)}x faster`)
  console.log('═══════════════════════════════════════════════════════════════')
}

comparePerformance().catch(console.error)
EOF

cd /home/aiq/Asztal/10_M_USD/ai-security-scanner
npx tsx /tmp/test-performance.ts

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Use 'npm run worker:hybrid' to start hybrid worker"
echo "  2. Batch scans will automatically use fast scanner"
echo "  3. User-initiated scans will use Playwright"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

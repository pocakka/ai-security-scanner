#!/bin/bash
#
# START AI BATCH SCANNER
#
# CRITICAL: This is for BATCH MODE ONLY!
# UI scanning continues to use the normal workers!
#
# USAGE:
#   ./scripts/start-ai-batch.sh domains.txt
#

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "  ⚡ AI BATCH SCANNER - Optimized for AI Red Teaming"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  🚀 OPTIMIZATIONS:"
echo "    - PHP crawler (80ms vs 3700ms Playwright)"
echo "    - AI-only analyzers (skip reconnaissance, admin, port scan, etc)"
echo "    - 100 workers (vs 50 normal)"
echo "    - 3.3s/scan vs 22s/scan = 6.7x faster!"
echo ""
echo "  ✅ UI UNCHANGED:"
echo "    - Next.js dev server: http://localhost:3000 (normal Playwright)"
echo "    - Normal workers keep running (ecosystem-optimized.config.js)"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check if domain file provided
if [ -z "$1" ]; then
  echo "❌ Error: No domain file specified"
  echo ""
  echo "Usage: ./scripts/start-ai-batch.sh domains.txt"
  exit 1
fi

DOMAIN_FILE="$1"

# Check if file exists
if [ ! -f "$DOMAIN_FILE" ]; then
  echo "❌ Error: File not found: $DOMAIN_FILE"
  exit 1
fi

# Count domains
DOMAIN_COUNT=$(wc -l < "$DOMAIN_FILE")
echo "📂 Domain file: $DOMAIN_FILE"
echo "📊 Domains to scan: $DOMAIN_COUNT"
echo ""

# Calculate estimated time
# 100 workers, 200 parallel scans, 3.3s/scan
# Throughput = 200 / 3.3 = 60.6 scans/sec = 3636 scans/min = 218,160 scans/hour
ESTIMATED_HOURS=$(echo "scale=1; $DOMAIN_COUNT / 76000" | bc)
echo "⏱️  Estimated time: ~${ESTIMATED_HOURS}h (at 76,000 scans/hour)"
echo ""

# Ask for confirmation
read -p "▶️  Start AI Batch Scanner? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  STEP 1: Starting Auto-Cleanup Daemon"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Start auto-cleanup daemon in background
./scripts/auto-cleanup-daemon.sh > ./logs/cleanup-daemon.log 2>&1 &
CLEANUP_PID=$!
echo "✅ Cleanup daemon started (PID: $CLEANUP_PID)"
echo "   - Timeout: 60s (scans older than this = FAILED)"
echo "   - Check interval: 30s"
echo "   - Log: ./logs/cleanup-daemon.log"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  STEP 2: Starting AI Batch Workers (100 workers)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Stop any existing batch workers first
pm2 delete ai-batch-worker 2>/dev/null || true
sleep 2

# Start AI batch workers
pm2 start ecosystem-ai-batch.config.js

echo ""
echo "⏳ Waiting 5s for workers to initialize..."
sleep 5

echo ""
pm2 list | grep ai-batch-worker

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  STEP 3: Starting Parallel Scanner (200 parallel scans)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Run parallel scanner with AI batch optimized settings
python3 scripts/parallel-scanner.py "$DOMAIN_FILE"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ BATCH SCAN COMPLETE!"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Stop cleanup daemon
echo "🛑 Stopping cleanup daemon (PID: $CLEANUP_PID)..."
kill $CLEANUP_PID 2>/dev/null || true
echo ""

# Show summary
echo "📊 Final Statistics:"
echo ""

# Get scan counts from database
PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -t -c "
  SELECT
    'Total Scans: ' || COUNT(*) || '
Completed: ' || COUNT(*) FILTER (WHERE status = 'COMPLETED') || '
Failed: ' || COUNT(*) FILTER (WHERE status = 'FAILED') || '
AI Detected: ' || COUNT(*) FILTER (WHERE \"hasAI\" = true) || '
High Risk: ' || COUNT(*) FILTER (WHERE \"riskLevel\" = 'HIGH' OR \"riskLevel\" = 'CRITICAL')
  FROM \"Scan\"
  WHERE \"createdAt\" > NOW() - INTERVAL '24 hours'
"

echo ""
echo "🎯 AI Red Teaming Leads:"
echo ""

# Get AI companies with high risk
PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -t -c "
  SELECT url, \"riskScore\", \"riskLevel\", \"hasAI\"
  FROM \"Scan\"
  WHERE \"hasAI\" = true
    AND (\"riskLevel\" = 'HIGH' OR \"riskLevel\" = 'CRITICAL')
    AND \"createdAt\" > NOW() - INTERVAL '24 hours'
  ORDER BY \"riskScore\" ASC
  LIMIT 20
"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Next steps:"
echo "    1. Review AI leads in database"
echo "    2. Export results: psql ... -c 'SELECT * FROM \"Scan\" WHERE \"hasAI\" = true'"
echo "    3. Stop batch workers: pm2 delete ai-batch-worker"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

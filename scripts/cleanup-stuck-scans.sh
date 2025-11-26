#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# CLEANUP STUCK SCANS
# ════════════════════════════════════════════════════════════════════
#
# Finds and cleans up scans that have been stuck in SCANNING status
# for more than 3 minutes (180 seconds = scan timeout).
#
# Usage:
#   ./cleanup-stuck-scans.sh [timeout_seconds]
#
# Default timeout: 180 seconds (3 minutes)
# ════════════════════════════════════════════════════════════════════

TIMEOUT_SECONDS=${1:-180}
DB_URL="postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"

echo "════════════════════════════════════════════════════════════════════"
echo "  🧹 CLEANUP STUCK SCANS"
echo "════════════════════════════════════════════════════════════════════"
echo "  Timeout: ${TIMEOUT_SECONDS}s (scans older than this will be marked FAILED)"
echo ""

# Count stuck scans
STUCK_COUNT=$(PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -t -c "
  SELECT COUNT(*)
  FROM \"Scan\"
  WHERE status = 'SCANNING'
  AND \"createdAt\" < NOW() - make_interval(secs => ${TIMEOUT_SECONDS});
")

echo "📊 Found $STUCK_COUNT stuck SCANNING scans"

if [ "$STUCK_COUNT" -eq 0 ]; then
  echo "✅ No stuck scans found!"
  exit 0
fi

echo ""
echo "🔍 Stuck scans:"
PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "
  SELECT
    id,
    domain,
    status,
    \"createdAt\",
    EXTRACT(EPOCH FROM (NOW() - \"createdAt\"))::INTEGER as age_seconds
  FROM \"Scan\"
  WHERE status = 'SCANNING'
  AND \"createdAt\" < NOW() - make_interval(secs => ${TIMEOUT_SECONDS})
  ORDER BY \"createdAt\" ASC
  LIMIT 20;
"

echo ""
echo "🧹 Cleaning up stuck scans..."

# Update stuck scans to FAILED
PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "
  UPDATE \"Scan\"
  SET
    status = 'FAILED',
    \"completedAt\" = NOW(),
    error = jsonb_build_object(
      'error', 'Scan timeout',
      'message', 'Scan exceeded maximum allowed time (${TIMEOUT_SECONDS}s) and was automatically cleaned up',
      'cleanedUpAt', NOW()::text
    )
  WHERE status = 'SCANNING'
  AND \"createdAt\" < NOW() - make_interval(secs => ${TIMEOUT_SECONDS});
"

echo ""
echo "✅ Cleanup complete!"
echo "════════════════════════════════════════════════════════════════════"

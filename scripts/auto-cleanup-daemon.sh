#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# AUTO CLEANUP DAEMON
# ════════════════════════════════════════════════════════════════════
#
# Continuously monitors and cleans up stuck scans while batch scanning.
# Runs in background and checks every 30 seconds.
#
# Usage:
#   ./auto-cleanup-daemon.sh &
#   PID=$!
#   # ... do batch scanning ...
#   kill $PID  # Stop daemon when done
# ════════════════════════════════════════════════════════════════════

TIMEOUT_SECONDS=60  # Scans older than 60s are considered stuck
CHECK_INTERVAL=30   # Check every 30 seconds
DB_URL="postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"

echo "════════════════════════════════════════════════════════════════════"
echo "  🤖 AUTO CLEANUP DAEMON STARTED"
echo "════════════════════════════════════════════════════════════════════"
echo "  Timeout: ${TIMEOUT_SECONDS}s"
echo "  Check interval: ${CHECK_INTERVAL}s"
echo "  PID: $$"
echo ""
echo "  Press Ctrl+C to stop"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Cleanup function
cleanup_stuck_scans() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  # Count stuck scans
  local stuck_count=$(PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -t -c "
    SELECT COUNT(*)
    FROM \"Scan\"
    WHERE status = 'SCANNING'
    AND \"createdAt\" < NOW() - make_interval(secs => ${TIMEOUT_SECONDS});
  " 2>/dev/null | tr -d ' ')

  if [ "$stuck_count" -gt 0 ]; then
    echo "[$timestamp] 🧹 Found $stuck_count stuck scans, cleaning up..."

    # Mark as FAILED
    PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c "
      UPDATE \"Scan\"
      SET
        status = 'FAILED',
        \"completedAt\" = NOW(),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'error', 'Scan timeout',
          'message', 'Scan exceeded ${TIMEOUT_SECONDS}s and was auto-cleaned',
          'cleanedUpAt', NOW()::text
        )
      WHERE status = 'SCANNING'
      AND \"createdAt\" < NOW() - make_interval(secs => ${TIMEOUT_SECONDS});
    " > /dev/null 2>&1

    echo "[$timestamp] ✅ Cleaned up $stuck_count stuck scans"
  else
    echo "[$timestamp] ✓ No stuck scans (all healthy)"
  fi
}

# Trap Ctrl+C
trap 'echo ""; echo "🛑 Cleanup daemon stopped"; exit 0' INT TERM

# Main loop
while true; do
  cleanup_stuck_scans
  sleep $CHECK_INTERVAL
done

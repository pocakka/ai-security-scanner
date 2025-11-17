#!/bin/bash

# Cleanup old logs (keep last 10)
LOG_DIR="$(dirname "$0")/../logs"

echo "🧹 Cleaning up old logs in $LOG_DIR..."
echo ""

# Count total logs
TOTAL=$(ls -1 "$LOG_DIR"/worker-*.log 2>/dev/null | wc -l | tr -d ' ')

if [ "$TOTAL" -eq 0 ]; then
  echo "✅ No logs to clean"
  exit 0
fi

echo "Total logs: $TOTAL"

# Keep only last 10
if [ "$TOTAL" -gt 10 ]; then
  TO_DELETE=$((TOTAL - 10))
  echo "Deleting $TO_DELETE old logs..."
  
  ls -t "$LOG_DIR"/worker-*.log | tail -n "$TO_DELETE" | xargs rm
  
  echo "✅ Cleanup complete!"
  echo "Remaining logs: 10"
else
  echo "✅ Only $TOTAL logs, no cleanup needed (keeping last 10)"
fi

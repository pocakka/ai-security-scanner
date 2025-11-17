#!/bin/bash

# Tail the latest worker log
LOG_DIR="$(dirname "$0")/../logs"

LATEST_LOG=$(ls -t "$LOG_DIR"/worker-*.log 2>/dev/null | head -1)

if [ -z "$LATEST_LOG" ]; then
  echo "❌ No worker logs found in $LOG_DIR"
  exit 1
fi

echo "📝 Tailing: $LATEST_LOG"
echo ""
tail -f "$LATEST_LOG"

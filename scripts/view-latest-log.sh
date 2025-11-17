#!/bin/bash

# View the latest worker log
LOG_DIR="$(dirname "$0")/../logs"

LATEST_LOG=$(ls -t "$LOG_DIR"/worker-*.log 2>/dev/null | head -1)

if [ -z "$LATEST_LOG" ]; then
  echo "❌ No worker logs found in $LOG_DIR"
  exit 1
fi

echo "📝 Viewing: $LATEST_LOG"
echo ""
less "$LATEST_LOG"

#!/bin/bash

# Worker starter script with logging
LOG_DIR="$(dirname "$0")/../logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/worker-$(date +%Y%m%d-%H%M%S).log"

echo "🚀 Starting worker with logging..."
echo "📝 Log file: $LOG_FILE"
echo ""

USE_REAL_CRAWLER=true npm run worker 2>&1 | tee "$LOG_FILE"

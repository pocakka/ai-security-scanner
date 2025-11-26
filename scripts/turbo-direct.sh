#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# TURBO DIRECT MODE - 2016 style, no queue, no workers!
# ════════════════════════════════════════════════════════════════════
#
# Direct spawn mode - each scan runs as independent process
# ALL 31 analyzers included - NO FUNCTIONALITY LOSS!
#
# Usage:
#   ./turbo-direct.sh domains.txt [max_parallel]
# ════════════════════════════════════════════════════════════════════

DOMAIN_FILE=${1:-"domains.txt"}
MAX_PARALLEL=${2:-20}  # Max concurrent processes (csökkentve 20-ra)
MAX_DOMAINS=${3:-0}     # Max domains to process (0 = unlimited)
API_URL="http://localhost:3000/api/scan/direct"

if [ ! -f "$DOMAIN_FILE" ]; then
    echo "❌ Domain file not found: $DOMAIN_FILE"
    exit 1
fi

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 TURBO DIRECT MODE SCANNER"
echo "════════════════════════════════════════════════════════════════════"
echo "  Mode: DIRECT (no queue, no workers)"
echo "  Domain file: $DOMAIN_FILE"
echo "  Max parallel: $MAX_PARALLEL processes"
echo "  API: $API_URL"
echo "  Analyzers: ALL 31 ACTIVE"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Count total domains
TOTAL_DOMAINS=$(grep -c "^[^#]" "$DOMAIN_FILE" || echo "0")
echo "📊 Total domains to scan: $TOTAL_DOMAINS"
echo ""

# Browser headers
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

# Counters
FIRED=0
BATCH=0
start_time=$(date +%s)

# Log file for debugging
LOG_FILE="/tmp/turbo-direct-$(date +%Y%m%d_%H%M%S).log"
echo "📝 Log file: $LOG_FILE"
echo ""

echo "🚀 Starting scan dispatch..."
echo "────────────────────────────────────────────────────────────────────"

# Process domains
while IFS= read -r domain || [ -n "$domain" ]; do
    # Skip empty lines and comments
    [[ -z "$domain" || "$domain" == \#* ]] && continue

    # Check if we reached max domains limit
    if [ "$MAX_DOMAINS" -gt 0 ] && [ "$FIRED" -ge "$MAX_DOMAINS" ]; then
        echo ""
        echo "⚠️  Reached max domains limit: $MAX_DOMAINS"
        break
    fi

    # Add https:// if missing
    if [[ ! "$domain" =~ ^https?:// ]]; then
        url="https://$domain"
    else
        url="$domain"
    fi

    # Fire request in background (DON'T WAIT!)
    {
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            --max-time 5 \
            -X POST \
            -H "Content-Type: application/json" \
            -H "User-Agent: $USER_AGENT" \
            -d "{\"url\":\"$url\"}" \
            "$API_URL" 2>&1)

        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)

        if [ "$HTTP_CODE" = "202" ]; then
            PID=$(echo "$BODY" | grep -o '"pid":[0-9]*' | grep -o '[0-9]*')
            echo "[$(date +%H:%M:%S)] ✅ $url → PID $PID" >> "$LOG_FILE"
        else
            echo "[$(date +%H:%M:%S)] ❌ $url → HTTP $HTTP_CODE" >> "$LOG_FILE"
        fi
    } &

    ((FIRED++))
    ((BATCH++))

    # Add delay between each request (0.5 seconds)
    sleep 0.5

    # Show progress every 10
    if [ $((FIRED % 10)) -eq 0 ]; then
        echo -ne "\r⚡ Dispatched: $FIRED/$TOTAL_DOMAINS ($(date +%H:%M:%S))"
    fi

    # Limit concurrent processes
    if [ "$BATCH" -ge "$MAX_PARALLEL" ]; then
        # Wait for current batch to spawn
        wait

        # Check process count (using -f for full command match)
        RUNNING=$(pgrep -fc "direct-processor" || echo "0")
        echo -ne "\r⚡ Dispatched: $FIRED/$TOTAL_DOMAINS | Running: $RUNNING processes"

        # Wait if too many processes
        while [ "$RUNNING" -gt "$MAX_PARALLEL" ]; do
            sleep 1
            RUNNING=$(pgrep -fc "direct-processor" || echo "0")
            echo -ne "\r⚡ Dispatched: $FIRED/$TOTAL_DOMAINS | Waiting (running: $RUNNING)..."
        done

        BATCH=0
    fi
done < "$DOMAIN_FILE"

# Wait for last batch
wait

end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "────────────────────────────────────────────────────────────────────"
echo ""

# Show final stats
RUNNING=$(pgrep -fc "direct-processor" || echo "0")
COMPLETED=$(grep -c "✅" "$LOG_FILE" || echo "0")
FAILED=$(grep -c "❌" "$LOG_FILE" || echo "0")

echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ DISPATCH COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo "  Total dispatched: $FIRED scans"
echo "  Successfully started: $COMPLETED"
echo "  Failed to start: $FAILED"
echo "  Currently running: $RUNNING processes"
echo "  Duration: ${duration}s"
if [ "$duration" -gt 0 ]; then
    echo "  Speed: $((FIRED * 3600 / duration)) scans/hour dispatched"
fi
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Monitor progress:"
echo "  Watch processes: watch -n 1 'pgrep -c direct-processor'"
echo "  Watch database:  watch -n 5 'psql ... -c \"SELECT status, COUNT(*) FROM \\\"Scan\\\" GROUP BY status\"'"
echo "  View logs:       tail -f $LOG_FILE"
echo ""
echo "Note: Scans are running as independent processes!"
echo "Each process runs ALL 31 analyzers - NO FUNCTIONALITY LOSS!"
echo "════════════════════════════════════════════════════════════════════"
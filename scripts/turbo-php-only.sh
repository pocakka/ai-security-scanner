#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# TURBO PHP-ONLY SCANNER - Maximum Speed Version
# ════════════════════════════════════════════════════════════════════
#
# No Playwright, No Queue, Pure PHP + Direct Processing
# ALL 31 analyzers included - NO FUNCTIONALITY LOSS!
#
# Usage:
#   ./turbo-php-only.sh domains.txt [max_parallel] [max_domains]
# ════════════════════════════════════════════════════════════════════

DOMAIN_FILE=${1:-"domains.txt"}
MAX_PARALLEL=${2:-30}  # More aggressive default
MAX_DOMAINS=${3:-0}     # Max domains to process (0 = unlimited)
DELAY=${4:-0.2}         # Delay between spawns (seconds)

if [ ! -f "$DOMAIN_FILE" ]; then
    echo "❌ Domain file not found: $DOMAIN_FILE"
    exit 1
fi

echo "════════════════════════════════════════════════════════════════════"
echo "  ⚡ TURBO PHP-ONLY SCANNER"
echo "════════════════════════════════════════════════════════════════════"
echo "  Mode: TURBO (PHP curl only, no Playwright)"
echo "  Domain file: $DOMAIN_FILE"
echo "  Max parallel: $MAX_PARALLEL processes"
echo "  Delay: ${DELAY}s between spawns"
echo "  Analyzers: ALL 31 ACTIVE"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Count total domains
TOTAL_DOMAINS=$(grep -c "^[^#]" "$DOMAIN_FILE" || echo "0")
echo "📊 Total domains to scan: $TOTAL_DOMAINS"
[ "$MAX_DOMAINS" -gt 0 ] && echo "⚠️  Limited to: $MAX_DOMAINS domains"
echo ""

# Counters
FIRED=0
start_time=$(date +%s)

# Log file
LOG_FILE="/tmp/turbo-php-$(date +%Y%m%d_%H%M%S).log"
echo "📝 Log file: $LOG_FILE"
echo ""

echo "🚀 Starting turbo scan..."
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

    # Spawn turbo-processor directly (no API call)
    {
        npx tsx /home/aiq/Asztal/10_M_USD/ai-security-scanner/src/worker/turbo-processor.ts "$url" >> "$LOG_FILE" 2>&1
    } &

    ((FIRED++))

    # Show progress every 10
    if [ $((FIRED % 10)) -eq 0 ]; then
        RUNNING=$(pgrep -fc "turbo-processor" || echo "0")
        echo -ne "\r⚡ Spawned: $FIRED/$TOTAL_DOMAINS | Running: $RUNNING processes"
    fi

    # Control spawning rate
    if [ "$DELAY" != "0" ]; then
        sleep "$DELAY"
    fi

    # Limit concurrent processes
    RUNNING=$(pgrep -fc "turbo-processor" || echo "0")
    while [ "$RUNNING" -ge "$MAX_PARALLEL" ]; do
        sleep 1
        RUNNING=$(pgrep -fc "turbo-processor" || echo "0")
        echo -ne "\r⚡ Spawned: $FIRED/$TOTAL_DOMAINS | Waiting (running: $RUNNING)..."
    done
done < "$DOMAIN_FILE"

# Final wait
echo ""
echo "⏳ Waiting for remaining processes..."
wait

end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo "────────────────────────────────────────────────────────────────────"
echo ""

# Count results
COMPLETED=$(grep -c "✅" "$LOG_FILE" || echo "0")
FAILED=$(grep -c "❌" "$LOG_FILE" || echo "0")

echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ TURBO SCAN COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo "  Total spawned: $FIRED scans"
echo "  Completed: $COMPLETED"
echo "  Failed: $FAILED"
echo "  Duration: ${duration}s"
if [ "$duration" -gt 0 ]; then
    echo "  Speed: $((FIRED * 3600 / duration)) scans/hour"
fi
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Check database:"
echo "  PGPASSWORD=ai_scanner_2025 psql -h localhost -p 6432 -U scanner -d ai_security_scanner -c \"SELECT status, COUNT(*) FROM \\\"Scan\\\" WHERE \\\"createdAt\\\" > NOW() - INTERVAL '1 hour' GROUP BY status;\""
echo ""
echo "📝 View logs:"
echo "  tail -f $LOG_FILE"
echo "  grep '✅' $LOG_FILE | wc -l  # Count successful"
echo "  grep '❌' $LOG_FILE | wc -l  # Count failed"
echo ""
echo "Note: PHP-only mode - 10-50x faster than Playwright!"
echo "════════════════════════════════════════════════════════════════════"
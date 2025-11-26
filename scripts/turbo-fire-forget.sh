#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# TURBO FIRE-AND-FORGET SCANNER
# Based on 2016 akka_ultimate_pentakill.sh concept
# ════════════════════════════════════════════════════════════════════
#
# Creates scans WITHOUT WAITING for response
# Expected speed: 10,000+ scans/hour
#
# Usage:
#   ./turbo-fire-forget.sh domains.txt [parallel_count]
# ════════════════════════════════════════════════════════════════════

DOMAIN_FILE=${1:-"domains.txt"}
PARALLEL_COUNT=${2:-20}  # How many curls run in parallel
API_URL="http://localhost:3000/api/scan"

if [ ! -f "$DOMAIN_FILE" ]; then
    echo "❌ Domain file not found: $DOMAIN_FILE"
    exit 1
fi

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 TURBO FIRE-AND-FORGET SCANNER"
echo "════════════════════════════════════════════════════════════════════"
echo "  Domain file: $DOMAIN_FILE"
echo "  Parallel count: $PARALLEL_COUNT"
echo "  API: $API_URL"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Browser headers for better success rate
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

j=1
start_time=$(date +%s)

# Read domains and fire requests
while IFS= read -r domain || [ -n "$domain" ]; do
    # Skip empty lines and comments
    [[ -z "$domain" || "$domain" == \#* ]] && continue

    # Add https:// if no protocol
    if [[ ! "$domain" =~ ^https?:// ]]; then
        url="https://$domain"
    else
        url="$domain"
    fi

    # Fire curl in background (don't wait!)
    curl -s -S \
        --ipv4 \
        --max-time 10 \
        -X POST \
        -H "Content-Type: application/json" \
        -H "User-Agent: $USER_AGENT" \
        -H "Accept: application/json" \
        -d "{\"url\":\"$url\"}" \
        "$API_URL" \
        > /dev/null 2>&1 &

    # Rate limiting - sleep after every N parallel requests
    if [ $((j % PARALLEL_COUNT)) -eq 0 ]; then
        # Show progress
        echo -ne "\r⚡ Fired: $j scans ($(date +%H:%M:%S))"

        # Brief pause to avoid overwhelming
        sleep 0.5
    fi

    ((j++))
done < "$DOMAIN_FILE"

# Wait for last batch to complete
echo ""
echo "⏳ Waiting for last batch..."
wait

end_time=$(date +%s)
duration=$((end_time - start_time))
total=$((j - 1))

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  ✅ FIRE-AND-FORGET COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo "  Total fired: $total scans"
echo "  Duration: ${duration}s"
echo "  Speed: $((total * 3600 / duration)) scans/hour"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Note: Scans are being processed by PM2 workers in background!"
echo "Check status: pm2 list"
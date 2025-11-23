#!/bin/bash
# ════════════════════════════════════════════════════════════════════
# BATCH SCANNER - Process domains in configurable batches
# ════════════════════════════════════════════════════════════════════
#
# Usage:
#   ./batch-scanner.sh [batch_size] [domains_file]
#   ./batch-scanner.sh 1000 ../domains.txt
#
# Features:
#   - Process domains in batches (default: 1000)
#   - Auto-resume from last position
#   - Wait for workers to finish each batch before next
#   - Progress tracking & statistics
#
# ════════════════════════════════════════════════════════════════════

# Configuration
BATCH_SIZE=${1:-1000}  # Default: 1000 domains per batch
DOMAINS_FILE=${2:-"/home/aiq/Asztal/10_M_USD/ai-security-scanner/domains.txt"}
DATABASE_URL=${DATABASE_URL:-"postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"}
PROGRESS_FILE="/tmp/batch-scanner-progress.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ════════════════════════════════════════════════════════════════════
# FUNCTIONS
# ════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "${CYAN}"
    echo "════════════════════════════════════════════════════════════════════"
    echo "  BATCH SCANNER - Intelligent Batch Processing"
    echo "════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

get_last_position() {
    if [ -f "$PROGRESS_FILE" ]; then
        jq -r '.last_line // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

save_progress() {
    local current_line=$1
    local total_lines=$2
    local batch_num=$3

    cat > "$PROGRESS_FILE" <<EOF
{
  "last_line": $current_line,
  "total_lines": $total_lines,
  "batch_number": $batch_num,
  "batch_size": $BATCH_SIZE,
  "timestamp": "$(date -Iseconds)",
  "progress_percent": $(awk "BEGIN {printf \"%.2f\", ($current_line / $total_lines) * 100}")
}
EOF
}

wait_for_workers() {
    local threshold=100  # Start next batch when PENDING < 100

    echo -e "${YELLOW}⏳ Waiting for workers to process batch...${NC}"

    while true; do
        PENDING=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Scan\" WHERE status='PENDING'" 2>/dev/null | xargs)
        SCANNING=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Scan\" WHERE status='SCANNING'" 2>/dev/null | xargs)

        if [ "$PENDING" -lt "$threshold" ] && [ "$SCANNING" -lt 10 ]; then
            echo -e "${GREEN}✓ Workers ready (PENDING: $PENDING, SCANNING: $SCANNING)${NC}"
            break
        fi

        echo -e "  Queue: ${CYAN}PENDING=$PENDING${NC}, ${BLUE}SCANNING=$SCANNING${NC}"
        sleep 10
    done
}

print_stats() {
    echo -e "\n${CYAN}═══ Database Statistics ═══${NC}"
    psql "$DATABASE_URL" -c "SELECT status, COUNT(*) as count FROM \"Scan\" GROUP BY status ORDER BY count DESC;" 2>/dev/null
}

# ════════════════════════════════════════════════════════════════════
# MAIN SCRIPT
# ════════════════════════════════════════════════════════════════════

print_header

# Validate domains file
if [ ! -f "$DOMAINS_FILE" ]; then
    echo -e "${RED}✗ Error: Domains file not found: $DOMAINS_FILE${NC}"
    exit 1
fi

TOTAL_DOMAINS=$(wc -l < "$DOMAINS_FILE")
CURRENT=$(get_last_position)

echo -e "${GREEN}Configuration:${NC}"
echo -e "  Domains file: ${CYAN}$DOMAINS_FILE${NC}"
echo -e "  Total domains: ${CYAN}$TOTAL_DOMAINS${NC}"
echo -e "  Batch size: ${CYAN}$BATCH_SIZE${NC}"
echo -e "  Starting from line: ${CYAN}$CURRENT${NC}"
echo ""

if [ "$CURRENT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Resuming from previous run (line $CURRENT)${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

BATCH_NUM=0
START_TIME=$(date +%s)

# Main batch processing loop
while [ "$CURRENT" -lt "$TOTAL_DOMAINS" ]; do
    BATCH_NUM=$((BATCH_NUM + 1))
    NEXT=$((CURRENT + BATCH_SIZE))

    # Don't exceed total
    if [ "$NEXT" -gt "$TOTAL_DOMAINS" ]; then
        NEXT=$TOTAL_DOMAINS
    fi

    BATCH_COUNT=$((NEXT - CURRENT))
    PROGRESS=$(awk "BEGIN {printf \"%.1f\", ($NEXT / $TOTAL_DOMAINS) * 100}")

    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}📦 Batch #$BATCH_NUM${NC}"
    echo -e "  Lines: ${CYAN}$((CURRENT+1)) - $NEXT${NC} (${YELLOW}$BATCH_COUNT domains${NC})"
    echo -e "  Progress: ${YELLOW}$PROGRESS%${NC} (${CYAN}$NEXT${NC}/${CYAN}$TOTAL_DOMAINS${NC})"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════════${NC}"

    # Extract batch to temp file
    BATCH_FILE="/tmp/batch-$BATCH_NUM.txt"
    sed -n "$((CURRENT+1)),${NEXT}p" "$DOMAINS_FILE" > "$BATCH_FILE"

    echo -e "${BLUE}⚙️  Queuing batch to database...${NC}"

    # Run Python scanner for this batch
    cd "$SCRIPT_DIR"
    export DATABASE_URL
    python3 master-scanner_speed.py "$BATCH_FILE"

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Error processing batch $BATCH_NUM${NC}"
        exit 1
    fi

    # Save progress
    save_progress "$NEXT" "$TOTAL_DOMAINS" "$BATCH_NUM"

    # Clean up temp file
    rm -f "$BATCH_FILE"

    # Wait for workers to process before next batch
    if [ "$NEXT" -lt "$TOTAL_DOMAINS" ]; then
        wait_for_workers
    fi

    CURRENT=$NEXT
done

# ════════════════════════════════════════════════════════════════════
# COMPLETION
# ════════════════════════════════════════════════════════════════════

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
ELAPSED_MIN=$((ELAPSED / 60))

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ ALL BATCHES QUEUED SUCCESSFULLY!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "  Total batches: ${CYAN}$BATCH_NUM${NC}"
echo -e "  Total domains: ${CYAN}$TOTAL_DOMAINS${NC}"
echo -e "  Elapsed time: ${CYAN}${ELAPSED_MIN} minutes${NC}"
echo ""
echo -e "${YELLOW}⏳ Workers are still processing the queue...${NC}"
echo -e "   Monitor with: ${CYAN}pm2 logs analyzer-worker${NC}"
echo ""

print_stats

echo ""
echo -e "${GREEN}Done!${NC}"

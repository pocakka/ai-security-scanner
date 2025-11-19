#!/bin/bash

# ================================================
# BULK SCAN STARTER - All-in-one startup script
# ================================================
# Starts everything needed for bulk scanning:
# - Next.js dev server
# - Worker monitor (1-minute timeout enforcement)
# - Multiple workers (5 parallel)
# - Bulk scan script
# ================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Default values
DOMAINS_FILE="${1:-domains.txt}"
NUM_WORKERS=5

# Print header
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       AI SECURITY SCANNER - BULK MODE${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if domains file exists
if [ ! -f "$DOMAINS_FILE" ]; then
    echo -e "${RED}❌ Error: Domains file not found: $DOMAINS_FILE${NC}"
    echo -e "${YELLOW}Usage: ./start-bulk-scan.sh [domains-file]${NC}"
    echo -e "${YELLOW}Default: ./start-bulk-scan.sh domains.txt${NC}"
    exit 1
fi

# Count domains
DOMAIN_COUNT=$(wc -l < "$DOMAINS_FILE" | tr -d ' ')
echo -e "${GREEN}📋 Domains file: ${NC}$DOMAINS_FILE"
echo -e "${GREEN}📊 Total domains: ${NC}$DOMAIN_COUNT"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down all services...${NC}"

    # Kill all background jobs
    jobs -p | xargs -r kill 2>/dev/null || true

    # Kill any remaining node processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm run worker" 2>/dev/null || true
    pkill -f "worker:monitor" 2>/dev/null || true
    pkill -f "bulk-scan-v2-clean.py" 2>/dev/null || true

    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Check if dev server is already running
if lsof -i:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Dev server already running on port 3000${NC}"
else
    echo -e "${BLUE}1️⃣  Starting Next.js dev server...${NC}"
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!

    # Wait for server to be ready
    echo -n "   Waiting for server"
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done

    if ! curl -s http://localhost:3000 >/dev/null; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}❌ Failed to start dev server${NC}"
        exit 1
    fi
fi

# Start worker monitor
echo -e "${BLUE}2️⃣  Starting Worker Monitor (60s timeout enforcement)...${NC}"
npm run worker:monitor > logs/monitor-$(date +%Y%m%d_%H%M%S).log 2>&1 &
MONITOR_PID=$!
echo -e "   ${GREEN}✓${NC} Monitor started (PID: $MONITOR_PID)"

# Wait a moment for monitor to initialize
sleep 2

# Start workers
echo -e "${BLUE}3️⃣  Starting $NUM_WORKERS workers...${NC}"
for i in $(seq 1 $NUM_WORKERS); do
    npm run worker > logs/worker-$i-$(date +%Y%m%d_%H%M%S).log 2>&1 &
    WORKER_PID=$!
    echo -e "   ${GREEN}✓${NC} Worker #$i started (PID: $WORKER_PID)"
    sleep 1
done

# Give workers time to fully start
sleep 3

# Clean up any old stuck scans before starting
echo -e "${BLUE}4️⃣  Cleaning up old scans...${NC}"
npm run cleanup > /dev/null 2>&1 || true
echo -e "   ${GREEN}✓${NC} Database cleaned"

# Start bulk scan
echo ""
echo -e "${BLUE}5️⃣  Starting bulk scan...${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Run the bulk scan (in foreground so we can see progress)
python3 scripts/bulk-scan-v2-clean.py "$DOMAINS_FILE"

# When bulk scan completes
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}       BULK SCAN COMPLETED!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Services still running in background:${NC}"
echo -e "  - Dev server: ${GREEN}http://localhost:3000${NC}"
echo -e "  - Worker monitor: Enforcing 60s timeout"
echo -e "  - $NUM_WORKERS workers: Processing remaining scans"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait indefinitely (until Ctrl+C)
wait
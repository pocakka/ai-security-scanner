#!/bin/bash
#
# PM2 BULK SCANNER - Complete Workflow
# Usage: ./pm2-bulk-scan.sh domains.txt
#
# This script:
# 1. Kills all existing processes (clean start)
# 2. Starts Next.js dev server
# 3. Starts PM2 worker pool (100 workers)
# 4. Creates PENDING scans from domain file
# 5. PM2 workers automatically process them
#

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}       PM2 BULK SCANNER - Complete Workflow${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check domain file
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Domain file not specified!${NC}"
    echo ""
    echo "Usage: ./pm2-bulk-scan.sh domains.txt"
    echo ""
    exit 1
fi

DOMAIN_FILE="$1"

if [ ! -f "$DOMAIN_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $DOMAIN_FILE${NC}"
    exit 1
fi

DOMAIN_COUNT=$(grep -v '^#' "$DOMAIN_FILE" | grep -v '^$' | wc -l)
echo -e "${GREEN}✓ Domain file found: $DOMAIN_FILE ($DOMAIN_COUNT domains)${NC}"
echo ""

# Step 1: Clean start (kill all processes)
echo -e "${YELLOW}[1/5] Killing all existing processes...${NC}"
pkill -9 node 2>/dev/null || true
pkill -9 npm 2>/dev/null || true
pkill -9 tsx 2>/dev/null || true
pkill -9 python 2>/dev/null || true
pkill -9 python3 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ All processes killed${NC}"
echo ""

# Step 2: Clean locks
echo -e "${YELLOW}[2/5] Cleaning locks...${NC}"
rm -rf /home/aiq/Asztal/10_M_USD/ai-security-scanner/.next/dev/lock 2>/dev/null || true
rm -rf /tmp/ai-scanner-workers/* 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
echo -e "${GREEN}✓ Locks cleaned${NC}"
echo ""

# Step 3: Start Next.js dev server
echo -e "${YELLOW}[3/5] Starting Next.js dev server...${NC}"
cd /home/aiq/Asztal/10_M_USD/ai-security-scanner
npm run dev > /tmp/nextjs-dev.log 2>&1 &
NEXTJS_PID=$!

# Wait for Next.js to start
echo -n "Waiting for Next.js"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Next.js started (http://localhost:3000)${NC}"
        break
    fi
    echo -n "."
    sleep 1

    if [ $i -eq 30 ]; then
        echo ""
        echo -e "${RED}❌ Error: Next.js failed to start!${NC}"
        echo "Check logs: tail -f /tmp/nextjs-dev.log"
        exit 1
    fi
done
echo ""

# Step 4: Start PM2 worker pool
echo -e "${YELLOW}[4/5] Starting PM2 worker pool (100 workers)...${NC}"
pm2 start ecosystem.config.js
sleep 3

PM2_COUNT=$(pm2 list | grep -c "analyzer-worker.*online" || true)
echo -e "${GREEN}✓ PM2 workers started: $PM2_COUNT/100${NC}"
echo ""

# Step 5: Create PENDING scans (in batches)
echo -e "${YELLOW}[5/5] Creating PENDING scans from domain file (100 per batch)...${NC}"
echo ""
python3 scripts/batch-create-scans-chunked.py "$DOMAIN_FILE" --batch-size 100 --delay 3
echo ""

# Summary
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ BULK SCAN STARTED!${NC}"
echo ""
echo -e "Next.js:      ${GREEN}http://localhost:3000${NC}"
echo -e "PM2 Workers:  ${GREEN}$PM2_COUNT workers processing${NC}"
echo -e "Domains:      ${GREEN}$DOMAIN_COUNT from $DOMAIN_FILE${NC}"
echo ""
echo -e "${CYAN}Monitoring Commands:${NC}"
echo "  pm2 list                    # Worker status"
echo "  pm2 logs analyzer-worker    # Real-time logs"
echo "  pm2 monit                   # Interactive dashboard"
echo ""
echo "  # Database progress:"
echo "  psql \"\$DATABASE_URL\" -c \"SELECT status, COUNT(*) FROM \\\"Scan\\\" GROUP BY status;\""
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"

#!/bin/bash
#
# 🚀 BULK SCAN STARTER WITH LIVE MONITORING
#
# Usage: ./start-bulk-scan.sh [domains_file]
# Example: ./start-bulk-scan.sh ../domains.txt
#
# Opens 3 terminal windows:
#   1. Python scanner progress (JSON updates)
#   2. PM2 worker logs (real-time processing)
#   3. Database statistics (refreshes every 10s)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOMAINS_FILE="${1:-$PROJECT_ROOT/domains.txt}"
LOG_FILE="/tmp/bulk-scan.log"
PID_FILE="/tmp/bulk-scan.pid"
PROGRESS_FILE="$SCRIPT_DIR/master-scanner-speed-progress.json"

# Check if domains file exists
if [ ! -f "$DOMAINS_FILE" ]; then
    echo -e "${RED}❌ Domains file not found: $DOMAINS_FILE${RESET}"
    echo "Usage: $0 [domains_file]"
    exit 1
fi

# Count domains
DOMAIN_COUNT=$(wc -l < "$DOMAINS_FILE")

echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${BLUE}   🚀 BULK SCAN STARTER - Queue-Based Architecture   ${RESET}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "${YELLOW}Configuration:${RESET}"
echo -e "  📂 Domains file: ${CYAN}$DOMAINS_FILE${RESET}"
echo -e "  📊 Total domains: ${CYAN}$DOMAIN_COUNT${RESET}"
echo -e "  📝 Log file: ${CYAN}$LOG_FILE${RESET}"
echo -e "  💾 Progress file: ${CYAN}$PROGRESS_FILE${RESET}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, using default${RESET}"
    export DATABASE_URL="postgresql://scanner:ai_scanner_2025@localhost:6432/ai_security_scanner"
fi

# Check if PM2 workers are running
WORKER_COUNT=$(pm2 list | grep -c "analyzer-worker.*online" || true)
if [ "$WORKER_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No PM2 workers running!${RESET}"
    echo -e "${YELLOW}Starting 40 workers...${RESET}"
    cd "$PROJECT_ROOT"
    pm2 start npx --name analyzer-worker -i 40 -- tsx src/worker/index-sqlite.ts
    pm2 save
    echo -e "${GREEN}✅ Workers started${RESET}"
else
    echo -e "${GREEN}✅ PM2 workers: ${WORKER_COUNT} online${RESET}"
fi

echo ""
echo -e "${GREEN}Starting Python scanner in background...${RESET}"

# Start Python scanner in background
cd "$SCRIPT_DIR"
nohup python3 master-scanner_speed.py "$DOMAINS_FILE" > "$LOG_FILE" 2>&1 &
SCANNER_PID=$!
echo $SCANNER_PID > "$PID_FILE"

echo -e "${GREEN}✅ Scanner started (PID: $SCANNER_PID)${RESET}"
echo ""

# Wait a moment for scanner to initialize
sleep 2

# Detect terminal emulator
if command -v gnome-terminal &> /dev/null; then
    TERMINAL="gnome-terminal"
elif command -v konsole &> /dev/null; then
    TERMINAL="konsole"
elif command -v xterm &> /dev/null; then
    TERMINAL="xterm"
else
    echo -e "${YELLOW}⚠️  No GUI terminal detected, showing inline monitoring...${RESET}"
    echo ""
    echo -e "${CYAN}Press Ctrl+C to stop monitoring (scanner continues in background)${RESET}"
    echo ""

    # Inline monitoring (fallback)
    trap 'echo -e "\n${YELLOW}Monitoring stopped. Scanner still running (PID: $SCANNER_PID)${RESET}"; exit 0' INT

    while true; do
        clear
        echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"
        echo -e "${BOLD}   BULK SCAN MONITOR (Ctrl+C to exit)   ${RESET}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"
        echo ""

        # Python progress
        echo -e "${YELLOW}📊 PYTHON SCANNER PROGRESS:${RESET}"
        if [ -f "$PROGRESS_FILE" ]; then
            cat "$PROGRESS_FILE" | jq -r '
                "  Processed: \(.stats.processed // 0) / \(.stats.total // 0)",
                "  Success: \(.stats.success // 0)  Failed: \(.stats.failed // 0)  Skipped: \(.stats.skipped // 0)",
                "  Last update: \(.timestamp // "N/A")"
            ' 2>/dev/null || echo "  (Progress file not ready yet)"
        else
            echo "  (Initializing...)"
        fi

        echo ""
        echo -e "${YELLOW}🔧 DATABASE STATUS:${RESET}"
        psql "$DATABASE_URL" -t -c "
            SELECT
                '  PENDING: ' || COUNT(*) FILTER (WHERE status = 'PENDING') ||
                '  SCANNING: ' || COUNT(*) FILTER (WHERE status = 'SCANNING') ||
                '  COMPLETED: ' || COUNT(*) FILTER (WHERE status = 'COMPLETED') ||
                '  FAILED: ' || COUNT(*) FILTER (WHERE status = 'FAILED')
            FROM \"Scan\"
        " 2>/dev/null || echo "  (Database not accessible)"

        echo ""
        echo -e "${YELLOW}📝 RECENT LOG (last 5 lines):${RESET}"
        tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /' || echo "  (No logs yet)"

        echo ""
        echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"

        sleep 10
    done

    exit 0
fi

# GUI terminal detected - open 3 monitoring windows
echo -e "${CYAN}Opening 3 monitoring terminals...${RESET}"
echo ""

if [ "$TERMINAL" = "gnome-terminal" ]; then
    # GNOME Terminal (Ubuntu default)
    gnome-terminal --title="📊 Python Scanner Progress" -- bash -c "
        echo -e '${CYAN}═══════════════════════════════════════════════════════════${RESET}'
        echo -e '${BOLD}  📊 PYTHON SCANNER PROGRESS (auto-refresh)${RESET}'
        echo -e '${CYAN}═══════════════════════════════════════════════════════════${RESET}'
        echo ''
        watch -n 5 -c 'cat $PROGRESS_FILE 2>/dev/null | jq -C . || echo \"Initializing...\"'
    " &

    gnome-terminal --title="🔧 PM2 Worker Logs" -- bash -c "
        echo -e '${CYAN}═══════════════════════════════════════════════════════════${RESET}'
        echo -e '${BOLD}  🔧 PM2 WORKER LOGS (live stream)${RESET}'
        echo -e '${CYAN}═══════════════════════════════════════════════════════════${RESET}'
        echo ''
        cd $PROJECT_ROOT
        pm2 logs analyzer-worker --lines 50
    " &

    gnome-terminal --title="💾 Database Statistics" -- bash -c "
        echo -e '${CYAN}═══════════════════════════════════════════════════════════${RESET}'
        echo -e '${BOLD}  💾 DATABASE STATISTICS (10s refresh)${RESET}'
        echo -e '${CYAN}═══════════════════════════════════════════════════════════${RESET}'
        echo ''
        watch -n 10 -c 'export DATABASE_URL=\"$DATABASE_URL\" && psql \"\$DATABASE_URL\" -c \"
            SELECT
                status,
                COUNT(*) as count,
                ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM \\\"Scan\\\"), 1) as percent
            FROM \\\"Scan\\\"
            GROUP BY status
            ORDER BY count DESC;
        \" && echo \"\" && psql \"\$DATABASE_URL\" -c \"
            SELECT
                domain,
                \\\"riskScore\\\",
                status
            FROM \\\"Scan\\\"
            WHERE \\\"createdAt\\\" > NOW() - INTERVAL '\''5 minutes'\''
            ORDER BY \\\"createdAt\\\" DESC
            LIMIT 10;
        \"'
    " &

elif [ "$TERMINAL" = "konsole" ]; then
    # KDE Konsole
    konsole --new-tab -e bash -c "watch -n 5 -c 'cat $PROGRESS_FILE 2>/dev/null | jq -C . || echo \"Initializing...\"'" &
    konsole --new-tab -e bash -c "cd $PROJECT_ROOT && pm2 logs analyzer-worker --lines 50" &
    konsole --new-tab -e bash -c "watch -n 10 'psql \"$DATABASE_URL\" -c \"SELECT status, COUNT(*) FROM \\\"Scan\\\" GROUP BY status;\"'" &

else
    # xterm fallback
    xterm -title "Python Progress" -e "watch -n 5 'cat $PROGRESS_FILE 2>/dev/null | jq . || echo Initializing'" &
    xterm -title "PM2 Logs" -e "cd $PROJECT_ROOT && pm2 logs analyzer-worker --lines 50" &
    xterm -title "Database Stats" -e "watch -n 10 'psql \"$DATABASE_URL\" -c \"SELECT status, COUNT(*) FROM \\\"Scan\\\" GROUP BY status;\"'" &
fi

echo -e "${GREEN}✅ 3 monitoring windows opened!${RESET}"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}   SCAN RUNNING!   ${RESET}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "${YELLOW}Scanner PID: ${CYAN}$SCANNER_PID${RESET}"
echo -e "${YELLOW}Log file: ${CYAN}$LOG_FILE${RESET}"
echo ""
echo -e "${YELLOW}Commands:${RESET}"
echo -e "  ${CYAN}# View main log${RESET}"
echo -e "  tail -f $LOG_FILE"
echo ""
echo -e "  ${CYAN}# Stop scanner${RESET}"
echo -e "  kill $SCANNER_PID"
echo ""
echo -e "  ${CYAN}# Check progress${RESET}"
echo -e "  cat $PROGRESS_FILE | jq ."
echo ""
echo -e "${GREEN}Happy scanning! 🚀${RESET}"

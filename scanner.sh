#!/bin/bash

# ================================================
# AI SECURITY SCANNER - Management Script
# ================================================
# Usage: ./scanner.sh [command] [options]
# Commands:
#   start    - Start all services
#   stop     - Stop all services
#   status   - Show status of all services
#   bulk     - Start bulk scan mode
#   clean    - Clean database and reset
#   monitor  - Show live monitor output
# ================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Change to script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to show usage
show_usage() {
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN}    AI SECURITY SCANNER - Management Tool${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC} $0 [command] [options]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}    - Start all services (dev server, monitor, workers)"
    echo -e "  ${GREEN}stop${NC}     - Stop all services"
    echo -e "  ${GREEN}status${NC}   - Show status of all services"
    echo -e "  ${GREEN}bulk${NC}     - Start bulk scan mode (requires domains file)"
    echo -e "  ${GREEN}clean${NC}    - Clean database (remove stuck/old scans)"
    echo -e "  ${GREEN}monitor${NC}  - Show live monitor output"
    echo -e "  ${GREEN}workers${NC}  - Start additional workers (default: 5)"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 start              # Start all services"
    echo -e "  $0 bulk domains.txt   # Start bulk scan with domains file"
    echo -e "  $0 workers 10         # Start 10 workers"
    echo -e "  $0 status             # Check service status"
    echo ""
}

# Function to check if service is running
is_running() {
    local service=$1
    case $service in
        "dev")
            lsof -i:3000 >/dev/null 2>&1
            ;;
        "monitor")
            pgrep -f "worker:monitor" >/dev/null 2>&1
            ;;
        "worker")
            pgrep -f "npm run worker" >/dev/null 2>&1
            ;;
        "bulk")
            pgrep -f "bulk-scan-v2-clean.py" >/dev/null 2>&1
            ;;
        *)
            false
            ;;
    esac
}

# Function to start services
start_services() {
    echo -e "${BLUE}🚀 Starting AI Security Scanner services...${NC}"
    echo ""

    # Start dev server if not running
    if is_running "dev"; then
        echo -e "${YELLOW}⚠️  Dev server already running${NC}"
    else
        echo -e "${GREEN}▶️  Starting Next.js dev server...${NC}"
        npm run dev > logs/dev-$(date +%Y%m%d_%H%M%S).log 2>&1 &

        echo -n "   Waiting for server"
        for i in {1..30}; do
            if curl -s http://localhost:3000 >/dev/null; then
                echo -e " ${GREEN}✓${NC}"
                break
            fi
            echo -n "."
            sleep 1
        done
    fi

    # Start worker monitor if not running
    if is_running "monitor"; then
        echo -e "${YELLOW}⚠️  Worker monitor already running${NC}"
    else
        echo -e "${GREEN}▶️  Starting Worker Monitor...${NC}"
        npm run worker:monitor > logs/monitor-$(date +%Y%m%d_%H%M%S).log 2>&1 &
        sleep 1
        echo -e "   ${GREEN}✓${NC} Monitor started (60s timeout enforcement)"
    fi

    # Start workers if not running
    if is_running "worker"; then
        WORKER_COUNT=$(pgrep -f "npm run worker" | wc -l)
        echo -e "${YELLOW}⚠️  $WORKER_COUNT workers already running${NC}"
    else
        start_workers 5
    fi

    echo ""
    echo -e "${GREEN}✅ All services started!${NC}"
    echo -e "   Web UI: ${CYAN}http://localhost:3000${NC}"
    echo ""
}

# Function to start workers
start_workers() {
    local count=${1:-5}
    echo -e "${GREEN}▶️  Starting $count workers...${NC}"

    for i in $(seq 1 $count); do
        npm run worker > logs/worker-$i-$(date +%Y%m%d_%H%M%S).log 2>&1 &
        echo -e "   ${GREEN}✓${NC} Worker #$i started"
        sleep 0.5
    done
}

# Function to stop services
stop_services() {
    echo -e "${RED}🛑 Stopping all services...${NC}"
    echo ""

    # Kill bulk scan
    if is_running "bulk"; then
        pkill -f "bulk-scan-v2-clean.py" 2>/dev/null || true
        echo -e "   ${GREEN}✓${NC} Bulk scan stopped"
    fi

    # Kill workers
    if is_running "worker"; then
        pkill -f "npm run worker" 2>/dev/null || true
        echo -e "   ${GREEN}✓${NC} Workers stopped"
    fi

    # Kill monitor
    if is_running "monitor"; then
        pkill -f "worker:monitor" 2>/dev/null || true
        echo -e "   ${GREEN}✓${NC} Monitor stopped"
    fi

    # Kill dev server
    if is_running "dev"; then
        pkill -f "npm run dev" 2>/dev/null || true
        pkill -f "next dev" 2>/dev/null || true
        echo -e "   ${GREEN}✓${NC} Dev server stopped"
    fi

    # Clean up any orphaned processes
    pkill -f "tsx src/worker" 2>/dev/null || true
    pkill -f "tsx scripts/worker-monitor" 2>/dev/null || true

    echo ""
    echo -e "${GREEN}✅ All services stopped${NC}"
    echo ""
}

# Function to show status
show_status() {
    echo -e "${CYAN}================================================${NC}"
    echo -e "${CYAN}          SERVICE STATUS${NC}"
    echo -e "${CYAN}================================================${NC}"
    echo ""

    # Dev server status
    if is_running "dev"; then
        echo -e "🌐 Dev Server:      ${GREEN}● Running${NC} (http://localhost:3000)"
    else
        echo -e "🌐 Dev Server:      ${RED}○ Stopped${NC}"
    fi

    # Monitor status
    if is_running "monitor"; then
        echo -e "👁️  Worker Monitor:  ${GREEN}● Running${NC} (60s timeout enforcement)"
    else
        echo -e "👁️  Worker Monitor:  ${RED}○ Stopped${NC}"
    fi

    # Workers status
    if is_running "worker"; then
        WORKER_COUNT=$(pgrep -f "npm run worker" | wc -l)
        echo -e "⚙️  Workers:         ${GREEN}● Running${NC} ($WORKER_COUNT active)"
    else
        echo -e "⚙️  Workers:         ${RED}○ Stopped${NC}"
    fi

    # Bulk scan status
    if is_running "bulk"; then
        echo -e "📊 Bulk Scanner:    ${GREEN}● Running${NC}"
    else
        echo -e "📊 Bulk Scanner:    ${RED}○ Not running${NC}"
    fi

    # Database status
    echo ""
    echo -e "${CYAN}DATABASE STATUS:${NC}"

    # Get scan counts from database
    STATS=$(npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient();
        async function stats() {
            const pending = await prisma.scan.count({ where: { status: 'PENDING' }});
            const scanning = await prisma.scan.count({ where: { status: 'SCANNING' }});
            const completed = await prisma.scan.count({ where: { status: 'COMPLETED' }});
            const failed = await prisma.scan.count({ where: { status: 'FAILED' }});
            console.log(\`\${pending}:\${scanning}:\${completed}:\${failed}\`);
            process.exit(0);
        }
        stats();
    " 2>/dev/null || echo "0:0:0:0")

    IFS=':' read -r PENDING SCANNING COMPLETED FAILED <<< "$STATS"

    echo -e "  📋 PENDING:    ${YELLOW}$PENDING${NC}"
    echo -e "  ⏳ SCANNING:   ${BLUE}$SCANNING${NC}"
    echo -e "  ✅ COMPLETED:  ${GREEN}$COMPLETED${NC}"
    echo -e "  ❌ FAILED:     ${RED}$FAILED${NC}"

    echo ""
}

# Function to clean database
clean_database() {
    echo -e "${YELLOW}🧹 Cleaning database...${NC}"
    echo ""

    # Run cleanup script
    npm run cleanup 2>&1 | while read line; do
        echo -e "   $line"
    done

    echo ""
    echo -e "${GREEN}✅ Database cleaned${NC}"
    echo ""
}

# Function to start bulk scan
start_bulk_scan() {
    local domains_file=${1:-domains.txt}

    if [ ! -f "$domains_file" ]; then
        echo -e "${RED}❌ Error: Domains file not found: $domains_file${NC}"
        echo -e "${YELLOW}Usage: $0 bulk [domains-file]${NC}"
        exit 1
    fi

    # First ensure services are running
    echo -e "${BLUE}🔄 Ensuring services are running...${NC}"
    start_services

    # Clean database before starting
    clean_database

    # Start bulk scan
    echo -e "${BLUE}📊 Starting bulk scan from $domains_file${NC}"
    echo ""

    python3 scripts/bulk-scan-v2-clean.py "$domains_file"
}

# Function to show monitor output
show_monitor() {
    if ! is_running "monitor"; then
        echo -e "${RED}❌ Worker monitor is not running${NC}"
        echo -e "${YELLOW}Start it with: $0 start${NC}"
        exit 1
    fi

    echo -e "${CYAN}📊 Worker Monitor Output (Press Ctrl+C to exit)${NC}"
    echo -e "${CYAN}================================================${NC}"

    # Find the latest monitor log
    LATEST_LOG=$(ls -t logs/monitor-*.log 2>/dev/null | head -1)

    if [ -z "$LATEST_LOG" ]; then
        echo -e "${RED}No monitor log found${NC}"
        exit 1
    fi

    tail -f "$LATEST_LOG"
}

# Main command handler
case "${1:-}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    bulk)
        start_bulk_scan "${2:-domains.txt}"
        ;;
    clean)
        clean_database
        ;;
    monitor)
        show_monitor
        ;;
    workers)
        COUNT=${2:-5}
        start_workers $COUNT
        ;;
    *)
        show_usage
        ;;
esac
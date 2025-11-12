#!/bin/bash

# Worker Management Script for AI Security Scanner
# This script helps manage worker processes and prevent them from hanging

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill all existing workers
kill_all_workers() {
    echo -e "${YELLOW}🧹 Cleaning up existing worker processes...${NC}"

    # Find and kill all tsx worker processes
    pids=$(ps aux | grep "tsx src/worker" | grep -v grep | awk '{print $2}')

    if [ -z "$pids" ]; then
        echo -e "${GREEN}✅ No worker processes found${NC}"
    else
        for pid in $pids; do
            echo -e "${RED}⚠️  Killing worker process: $pid${NC}"
            kill -9 $pid 2>/dev/null
        done
        echo -e "${GREEN}✅ All worker processes killed${NC}"
    fi

    # Also kill any npm run worker processes
    pkill -f "npm run worker" 2>/dev/null
}

# Function to start a single worker
start_worker() {
    echo -e "${YELLOW}🚀 Starting new worker process...${NC}"
    cd /Users/racz-akacosiattila/Desktop/10_M_USD/ai-security-scanner
    npm run worker &
    WORKER_PID=$!
    echo -e "${GREEN}✅ Worker started with PID: $WORKER_PID${NC}"
    echo $WORKER_PID > /tmp/ai-scanner-worker.pid
}

# Function to check worker status
check_worker() {
    if [ -f /tmp/ai-scanner-worker.pid ]; then
        PID=$(cat /tmp/ai-scanner-worker.pid)
        if ps -p $PID > /dev/null; then
            echo -e "${GREEN}✅ Worker is running (PID: $PID)${NC}"
            return 0
        else
            echo -e "${RED}❌ Worker is not running${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ No worker PID file found${NC}"
        return 1
    fi
}

# Function to restart worker
restart_worker() {
    echo -e "${YELLOW}🔄 Restarting worker...${NC}"
    kill_all_workers
    sleep 2
    start_worker
}

# Main command handler
case "$1" in
    start)
        kill_all_workers
        start_worker
        ;;
    stop)
        kill_all_workers
        ;;
    restart)
        restart_worker
        ;;
    status)
        check_worker
        # Also show all worker processes
        echo -e "\n${YELLOW}All worker processes:${NC}"
        ps aux | grep "tsx src/worker" | grep -v grep || echo "None found"
        ;;
    cleanup)
        # Emergency cleanup - kills all node processes related to worker
        echo -e "${RED}🚨 Emergency cleanup - killing all worker-related processes${NC}"
        killall -9 tsx 2>/dev/null
        pkill -f "npm run worker" 2>/dev/null
        pkill -f "tsx src/worker" 2>/dev/null
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start   - Kill all workers and start a single new one"
        echo "  stop    - Stop all worker processes"
        echo "  restart - Restart the worker"
        echo "  status  - Check worker status"
        echo "  cleanup - Emergency cleanup (kills all related processes)"
        exit 1
        ;;
esac

exit 0
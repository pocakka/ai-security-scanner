#!/bin/bash

# Worker Management Script
# Usage: ./manage-worker.sh [start|stop|restart|status]

WORKER_PID_FILE="/tmp/ai-scanner-worker.pid"
DEV_PID_FILE="/tmp/ai-scanner-dev.pid"

case "$1" in
  start)
    echo "🚀 Starting services..."

    # Check if already running
    if [ -f "$DEV_PID_FILE" ] && kill -0 $(cat "$DEV_PID_FILE") 2>/dev/null; then
      echo "✅ Dev server already running (PID: $(cat $DEV_PID_FILE))"
    else
      # Start dev server
      echo "  Starting dev server..."
      nohup npm run dev > /tmp/dev-server.log 2>&1 &
      echo $! > "$DEV_PID_FILE"
      sleep 5
      echo "✅ Dev server started (PID: $(cat $DEV_PID_FILE))"
    fi

    if [ -f "$WORKER_PID_FILE" ] && kill -0 $(cat "$WORKER_PID_FILE") 2>/dev/null; then
      echo "✅ Worker already running (PID: $(cat $WORKER_PID_FILE))"
    else
      # Start worker
      echo "  Starting worker..."
      USE_REAL_CRAWLER=true nohup npm run worker > /tmp/worker.log 2>&1 &
      echo $! > "$WORKER_PID_FILE"
      sleep 3
      echo "✅ Worker started (PID: $(cat $WORKER_PID_FILE))"
    fi

    echo ""
    echo "✅ All services running!"
    echo "   Dev server: http://localhost:3000"
    echo "   Logs:"
    echo "     Dev: tail -f /tmp/dev-server.log"
    echo "     Worker: tail -f /tmp/worker.log"
    ;;

  stop)
    echo "🛑 Stopping services..."

    # Stop worker
    if [ -f "$WORKER_PID_FILE" ]; then
      PID=$(cat "$WORKER_PID_FILE")
      if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo "✅ Worker stopped (PID: $PID)"
      fi
      rm -f "$WORKER_PID_FILE"
    fi

    # Stop dev server
    if [ -f "$DEV_PID_FILE" ]; then
      PID=$(cat "$DEV_PID_FILE")
      if kill -0 $PID 2>/dev/null; then
        kill $PID 2>/dev/null
        echo "✅ Dev server stopped (PID: $PID)"
      fi
      rm -f "$DEV_PID_FILE"
    fi

    # Kill any remaining processes
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "npm run worker" 2>/dev/null
    pkill -f "worker/index-sqlite" 2>/dev/null

    echo "✅ All services stopped"
    ;;

  restart)
    $0 stop
    sleep 3
    $0 start
    ;;

  status)
    echo "📊 Service Status:"
    echo ""

    # Dev server status
    if [ -f "$DEV_PID_FILE" ] && kill -0 $(cat "$DEV_PID_FILE") 2>/dev/null; then
      echo "✅ Dev server: RUNNING (PID: $(cat $DEV_PID_FILE))"
      curl -s http://localhost:3000/api/health > /dev/null && echo "   HTTP check: OK" || echo "   HTTP check: FAILED"
    else
      echo "❌ Dev server: STOPPED"
    fi

    # Worker status
    if [ -f "$WORKER_PID_FILE" ] && kill -0 $(cat "$WORKER_PID_FILE") 2>/dev/null; then
      echo "✅ Worker: RUNNING (PID: $(cat $WORKER_PID_FILE))"
    else
      echo "❌ Worker: STOPPED"
    fi

    echo ""
    echo "All Node processes:"
    ps aux | grep -E "(npm|node|tsx)" | grep -v grep | grep -E "(dev|worker)" | head -5
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

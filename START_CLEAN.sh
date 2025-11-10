#!/bin/bash

# AI Security Scanner - Clean Startup Script
# This script ensures NO old processes are running and starts fresh

echo "🧹 Cleaning up old processes..."
pkill -9 -f "node|npm|tsx|next" 2>/dev/null || true
sleep 2

echo "✅ All old processes killed"
echo ""
echo "📦 Regenerating Prisma Client..."
cd /Users/racz-akacosiattila/Desktop/10_M_USD/ai-security-scanner
npx prisma generate

echo ""
echo "🚀 Starting services..."
echo ""
echo "================================================"
echo " FONTOS: Nyiss 2 KÜLÖN TERMINÁL ABLAKOT!"
echo "================================================"
echo ""
echo "TERMINÁL 1 - Dev server:"
echo "  cd ~/Desktop/10_M_USD/ai-security-scanner"
echo "  npm run dev"
echo ""
echo "TERMINÁL 2 - Worker:"
echo "  cd ~/Desktop/10_M_USD/ai-security-scanner"
echo "  npm run worker"
echo ""
echo "================================================"
echo ""
echo "Ezután menj: http://localhost:3000"
echo "És indíts ÚJ SCAN-T (pl. anthropic.com)"
echo ""
echo "✅ A worker log-ban LÁTNI KELL ezt:"
echo "   [Worker] Analyzing AI Trust Score..."
echo "   [Worker] AI Trust Score: XX/100 (grade)"
echo ""

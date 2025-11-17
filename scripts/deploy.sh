#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment to production..."

# Configuration (módosítsd ezeket!)
SERVER_USER="root"
SERVER_IP="your-server-ip"
APP_PATH="/var/www/ai-security-scanner"
PM2_APP_NAME="ai-scanner"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Step 1: Checking local changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}⚠️  You have uncommitted changes!${NC}"
    git status -s
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}📤 Step 2: Pushing to GitHub...${NC}"
git push origin main

echo -e "${YELLOW}🔄 Step 3: Deploying to server...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
    set -e
    echo "📂 Navigating to app directory..."
    cd $APP_PATH

    echo "📥 Pulling latest code..."
    git pull origin main

    echo "📦 Installing dependencies..."
    npm install --production

    echo "🔨 Building application..."
    npm run build

    echo "🔄 Restarting PM2 process..."
    pm2 restart $PM2_APP_NAME

    echo "✅ Deployment successful!"
EOF

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Check: https://yourdomain.com${NC}"

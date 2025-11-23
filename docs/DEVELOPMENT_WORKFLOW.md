# Development Workflow Guide

## 📋 Overview

This document describes how to develop and deploy the AI Security Scanner application.

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Local (MacBook)│  ← Development environment
│   localhost:3000│  ← VS Code + Claude
└────────┬────────┘
         │
         │ git push
         ▼
┌─────────────────┐
│  GitHub         │  ← Central repository
│   main branch   │
└────────┬────────┘
         │
         │ deploy
         ▼
┌─────────────────┐
│  Production     │  ← Live server
│  Hetzner VPS    │
└─────────────────┘
```

---

## 🌿 Branch Strategy

### **Two-Branch Model**

- **`main`** - Production branch (stable, deployed to live server)
- **`dev`** - Development branch (active development)

### **Workflow**

```bash
# Start new feature
git checkout dev
git pull origin dev

# Develop & test
npm run dev  # localhost:3000

# Commit changes
git add .
git commit -m "feat: description"
git push origin dev

# When ready for production
git checkout main
git merge dev
git push origin main

# Deploy
./scripts/deploy.sh
```

---

## 💻 Local Development

### **Setup**

```bash
# Clone repository
git clone https://github.com/username/ai-security-scanner.git
cd ai-security-scanner

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start development server
npm run dev
```

### **Environment Variables**

**`.env.local`** (local development):
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV=development
```

### **Development Commands**

```bash
# Start dev server (with hot reload)
npm run dev

# Run type checking
npm run type-check

# Build for production (test locally)
npm run build
npm start

# Run worker (background jobs)
npm run worker

# Database migrations
npx prisma migrate dev
npx prisma studio  # Database GUI
```

---

## 🚀 Deployment

### **Option 1: Automated Script (Recommended)**

```bash
# Make sure you're on main branch
git checkout main
git merge dev
git push origin main

# Deploy to production
./scripts/deploy.sh
```

The script will:
1. Check for uncommitted changes
2. Push to GitHub
3. SSH into production server
4. Pull latest code
5. Install dependencies
6. Build application
7. Restart PM2 process

### **Option 2: Manual Deployment**

```bash
# SSH into production server
ssh root@your-server-ip

# Navigate to app directory
cd /var/www/ai-security-scanner

# Pull latest changes
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build

# Restart PM2
pm2 restart ai-scanner

# Check status
pm2 status
pm2 logs ai-scanner
```

### **Option 3: CI/CD (GitHub Actions)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/ai-security-scanner
            git pull origin main
            npm install --production
            npm run build
            pm2 restart ai-scanner
```

---

## 🧪 Testing Before Deploy

### **Local Production Test**

```bash
# Build production version
npm run build

# Start production server locally
npm start

# Test on http://localhost:3000
# - Test all features
# - Check console for errors
# - Verify API endpoints
```

### **Staging Environment (Optional)**

If you have a staging server:

```bash
# Deploy to staging first
git push origin staging

# SSH to staging server
ssh root@staging-server-ip
cd /var/www/ai-security-scanner
git pull origin staging
npm run build
pm2 restart ai-scanner-staging

# Test on https://staging.yourdomain.com
```

---

## 📝 Git Commit Conventions

Use conventional commits for clear history:

```bash
# Features
git commit -m "feat: add OWASP LLM 11 detection"

# Bug fixes
git commit -m "fix: resolve cookie security false positives"

# Documentation
git commit -m "docs: update deployment guide"

# Refactoring
git commit -m "refactor: simplify PDF generator code"

# Performance
git commit -m "perf: optimize scan worker pool"

# Tests
git commit -m "test: add unit tests for AI detection"
```

---

## 🔧 Development with Claude

### **Claude can help with:**

✅ Reading/writing files
✅ Running terminal commands
✅ Testing on localhost:3000
✅ Creating git commits
✅ Debugging errors
✅ Code refactoring

### **Typical Session**

```bash
# 1. Start dev server
npm run dev

# 2. Ask Claude to implement feature
# "Add new OWASP LLM vulnerability check"

# 3. Claude creates/modifies files
# - Edits analyzers
# - Updates UI components
# - Adds tests

# 4. Test on localhost:3000

# 5. Commit changes
git add .
git commit -m "feat: add LLM vulnerability check"
git push origin dev
```

---

## 🐛 Troubleshooting

### **Local Issues**

```bash
# Port 3000 already in use
lsof -ti:3000 | xargs kill

# Database locked
rm prisma/dev.db
npx prisma migrate dev

# Dependency issues
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

### **Production Issues**

```bash
# SSH into server
ssh root@your-server-ip

# Check PM2 status
pm2 status
pm2 logs ai-scanner --lines 100

# Restart application
pm2 restart ai-scanner

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory
free -h
```

---

## 🔐 Security Best Practices

### **1. Never commit sensitive data**

```bash
# Add to .gitignore
.env.local
.env.production
*.db
*.log
```

### **2. Use environment variables**

```bash
# Local
DATABASE_URL=file:./dev.db

# Production (on server)
DATABASE_URL=postgresql://user:pass@localhost/db
```

### **3. Keep dependencies updated**

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit for vulnerabilities
npm audit
npm audit fix
```

---

## 📊 Monitoring

### **Production Health Checks**

```bash
# PM2 monitoring
pm2 monit

# Application logs
pm2 logs ai-scanner

# System resources
htop

# Database status
sudo systemctl status postgresql
```

### **Key Metrics to Watch**

- **Response Time**: < 2 seconds
- **Memory Usage**: < 80% of available RAM
- **CPU Usage**: < 70% average
- **Disk Space**: > 20% free
- **Error Rate**: < 1%

---

## 🚦 Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] No console errors in browser
- [ ] Build completes successfully (`npm run build`)
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Git commits pushed to main branch
- [ ] Deployment script configured
- [ ] Backup created (optional)
- [ ] Rollback plan ready

After deployment:

- [ ] Check PM2 status (`pm2 status`)
- [ ] Verify website loads (https://yourdomain.com)
- [ ] Test critical features (scan, PDF export)
- [ ] Check logs for errors (`pm2 logs`)
- [ ] Monitor for 15 minutes

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# SSH into server
ssh root@your-server-ip

cd /var/www/ai-security-scanner

# Revert to previous commit
git log --oneline -5  # Find last good commit
git reset --hard <commit-hash>

# Rebuild & restart
npm run build
pm2 restart ai-scanner

# Verify
pm2 logs ai-scanner
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 🆘 Getting Help

**Local Development Issues:**
- Check console errors in browser (F12)
- Review terminal output
- Check `npm run dev` logs

**Production Issues:**
- SSH into server
- Check PM2 logs: `pm2 logs ai-scanner`
- Check Nginx logs: `/var/log/nginx/error.log`
- Check system resources: `htop`, `df -h`

**Git Issues:**
- `git status` - Check current state
- `git log` - Review commit history
- `git diff` - See changes

---

## 📝 Notes

- Always develop on `dev` branch
- Test locally before pushing to `main`
- Use deployment script for consistency
- Monitor logs after deployment
- Keep backups of production database
- Document any custom configurations

---

**Last Updated:** 2025-11-17
**Version:** 1.0

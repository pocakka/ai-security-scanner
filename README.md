# 🛡️ AI Security Scanner

> **Passive AI security analysis platform** that generates qualified leads by offering free, automated security scans.

A lead generation tool disguised as a security scanner. Think "WooRank for AI Systems" - provides instant value while capturing high-quality leads for manual security audits ($2,000-$10,000).

---

## 🎯 Project Status

**Sprint 4A In Progress** - Real browser automation + AI expansion!

✅ All core features implemented
✅ Modern dark-themed UI
✅ PDF report generation
✅ Email simulation
✅ Admin dashboard with metrics
✅ **Playwright real browser crawler** (NEW!)
✅ GitHub repository with version control

**Latest:** Sprint 4A Day 1 complete - Playwright crawler integrated with mock/real toggle!  

---

## 🚀 Quick Start (Localhost)

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pocakka/ai-security-scanner.git
cd ai-security-scanner

# Install dependencies
npm install

# Install Playwright browser (for real scanning mode)
npx playwright install chromium

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000** (or 3001/3002 if 3000 is taken)

### 🔄 Crawler Modes

The scanner supports two modes via environment variable:

**Mock Mode (default)** - Fast, predefined test data
```bash
# In .env file:
USE_REAL_CRAWLER="false"
```

**Real Mode** - Playwright browser automation with real data
```bash
# In .env file:
USE_REAL_CRAWLER="true"
```

Real mode provides:
- ✅ Actual network traffic monitoring
- ✅ Real cookie analysis
- ✅ JavaScript framework detection
- ✅ Live security header checks
- ⚠️ Slower (5-10s vs 1-2s per scan)

---

## 🎨 Features

### 🏠 Landing Page
- Modern dark theme with blue gradient
- Hero section with compelling copy  
- Feature cards highlighting key benefits
- Instant scan form with validation

### 📊 Security Scanning
- **Passive analysis** (no active attacks)
- **AI technology detection** (OpenAI, Anthropic, Google AI, etc.)
- **Security headers** check (CSP, HSTS, X-Frame-Options)
- **Client-side risk** detection (exposed API keys)
- **Risk scoring** 0-100 with grades A+ to F

### 📄 Results Page
- Risk score card with color-coded visualization
- Issue breakdown by severity
- Detected AI technologies display  
- Detailed findings with recommendations
- **PDF download** button
- **Lead capture modal** (auto-popup)

### 📧 Lead Capture & Email
- Email collection with name field
- Professional HTML email template  
- **Email simulation** (saves to `/emails` directory)
- Automatic trigger after scan completion

### 📋 PDF Reports
- Professional design with blue gradient header
- Large colored score number (60pt)
- Colored badges for grades and risk levels
- Issue summary cards  
- Detailed findings with severity indicators
- Multi-page support

### 👨‍💼 Admin Dashboard
- Statistics cards (Scans, Leads, Avg Risk, High Risk Sites)
- Conversion metrics calculation
- Scans table with risk scores
- Recent leads section
- Modern glassmorphic design

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **UI Icons** | Lucide React |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | SQLite (Prisma ORM) |
| **Queue** | In-memory (BullMQ-style) |
| **PDF** | jsPDF + jspdf-autotable |
| **Validation** | Zod |

---

## 📡 API Endpoints

```
POST   /api/scan           Create new scan
GET    /api/scan           List recent scans
GET    /api/scan/:id       Get scan details
GET    /api/scan/:id/pdf   Download PDF report

POST   /api/leads          Capture lead + send email
GET    /api/leads          List all leads (admin)
```

---

## 🎯 User Flow

1. **Landing Page** → User enters website URL
2. **Loading State** → Animated spinner
3. **Scan Processing** → Mock crawler + analyzers (1-2 sec)
4. **Results Page** → Full security report
5. **Lead Modal** → Auto-popup after 2 seconds
6. **Email Sent** → HTML email saved to `/emails/`
7. **Admin Dashboard** → Track metrics

---

## 🧪 Testing

### Basic Test Flow

1. Open http://localhost:3000
2. Enter test URL: `https://openai.com`
3. Watch loading animation
4. View results page → Risk score, findings
5. Download PDF → Click button
6. Lead capture → Fill form  
7. Check email: `ls -la emails/ && cat emails/*.txt`
8. Admin dashboard: http://localhost:3000/admin

### Test URLs
- `https://openai.com` → Detects OpenAI + Intercom
- `https://github.com` → Detects Google AI
- `https://example.com` → Generic scan

---

## 📝 Development Commands

```bash
# Development
npm run dev

# Database
npx prisma studio
npx prisma generate
npx prisma db push

# Build
npm run build
npm start

# Clean
rm -rf .next
```

---

## 🚨 Localhost Limitations

⚠️ **This is a development version. Some features are simulated:**

1. **Mock Crawler** → Predefined test data (not real crawling)
2. **In-Memory Queue** → Doesn't persist across restarts
3. **Email Simulation** → Saves to files (doesn't send)
4. **SQLite** → Not production-ready
5. **No Auth** → Admin publicly accessible

---

## 📧 Email Simulation

Emails are saved to `/emails` directory:

```
emails/
├── 2025-11-07T19-30-00-000Z_john_example_com.html
└── 2025-11-07T19-30-00-000Z_john_example_com.txt
```

Console output:
```
📧 [EMAIL SIMULATION] Email saved to file system:
   To: john@example.com
   Subject: Your AI Security Scan Results...
   HTML: /path/to/emails/xxx.html
```

---

## 🚀 Production Roadmap

### Phase 1: Real Infrastructure
- [ ] Playwright (real browser crawling)
- [ ] Redis + BullMQ (persistent queues)
- [ ] PostgreSQL (Supabase/Neon)
- [ ] Resend (actual emails)
- [ ] Claude Haiku API

### Phase 2: Security
- [ ] Admin authentication
- [ ] Rate limiting
- [ ] Caching
- [ ] Error tracking (Sentry)

### Phase 3: Deployment
- [ ] Vercel (frontend)
- [ ] Railway/Fly.io (workers)
- [ ] Custom domain + SSL
- [ ] CI/CD

---

## 🐛 Troubleshooting

### Port in use
Next.js auto-assigns next available port (3000/3001/3002)

### Database issues
```bash
rm prisma/dev.db
npx prisma db push
```

### Cache issues
```bash
rm -rf .next
npm run dev
```

---

## 📖 Documentation

- **[PROGRESS.md](./PROGRESS.md)** - Development progress
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant context
- **[LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md)** - Setup guide

---

## 📞 Repository

**GitHub:** https://github.com/pocakka/ai-security-scanner  
**Branch:** main  
**Status:** ✅ MVP Complete  

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0 (MVP - Localhost)  

Made with ❤️ using [Claude Code](https://claude.com/claude-code)

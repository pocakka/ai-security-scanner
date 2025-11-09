# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Security Scanner** - A lead generation platform that performs passive security analysis of websites' AI implementations. Think "WooRank for AI Systems."

### Core Concept
- **Primary Goal**: Generate qualified leads by offering free, automated AI security scans
- **Business Model**: Free passive scan → Email capture → Upsell manual security audits ($2,000-$10,000)
- **Key Differentiator**: 100% legal passive analysis (no active attacks), avoiding legal/technical risks

### Value Proposition
Delivers a 30-second automated security assessment that identifies potential AI-specific vulnerabilities without performing intrusive testing. Creates a "curiosity gap" that drives leads toward professional audit services.

## Project Status

**Current Phase**: ✅ MVP Development - ACTIVE
- **Status**: Functional MVP with core scanning capabilities
- **Backend**: SQLite-based worker queue with Playwright crawler
- **Frontend**: Next.js 14 with real-time scan results
- **Recent Updates**:
  - Technology detection with early exit optimization
  - Cookie security filtering (3rd party vs 1st party)
  - Admin performance debug bar with detailed timing breakdown
  - WordPress plugin detection
  - Comprehensive tech stack analyzer (120+ technologies)
- **Next Steps**: Lead capture flow, PDF report generation, deployment

## Architecture & Tech Stack

### Frontend (✅ Implemented)
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS with custom gradient designs
- **Components**: Custom-built security-focused UI
- **State Management**: React hooks (useState, useEffect)
- **Real-time Updates**: Polling-based scan status updates

### Backend (✅ Implemented)
- **API**: Next.js API Routes
- **Workers**: SQLite-based job queue with automatic spawning
- **Crawler**: Playwright (headless Chromium browser)
- **Analyzers**: 7 specialized security analyzers
  - AI Detection (providers, chatbots, frameworks)
  - Security Headers (CSP, HSTS, X-Frame-Options)
  - Client Risks (exposed API keys, secrets)
  - SSL/TLS (certificate validation)
  - Cookie Security (1st party only, with security flags)
  - JS Libraries (version detection, vulnerability scanning)
  - Tech Stack (120+ technologies across 8 categories)

### Data Layer (✅ Implemented)
- **Primary DB**: SQLite with Prisma ORM
- **Queue**: Custom SQLite-based job queue
- **Schema**: Scans, Jobs, Leads (ready for production)
- **Metadata**: Performance timing breakdown stored in JSON

### Infrastructure (Current - Local Development)
- **Frontend**: http://localhost:3000 (Next.js dev server)
- **Worker**: Automatic spawn on scan request
- **Database**: Local SQLite file (prisma/dev.db)
- **Monitoring**: Console logs + Admin Performance Debug Bar

### Infrastructure (Planned - Production)
- **Frontend**: Vercel
- **Workers**: Railway or Fly.io
- **Database**: PostgreSQL (Supabase/Neon)
- **Queue**: Redis + BullMQ (Upstash)
- **Monitoring**: Sentry + Custom admin dashboard

## What the Scanner Analyzes (Passive Only)

### 1. AI Technology Detection
- Network requests to AI providers (openai.com, anthropic.com, etc.)
- DOM elements indicating chatbots (Intercom, Drift, custom widgets)
- JavaScript imports (openai, langchain, transformers, etc.)
- API endpoints patterns (/api/chat, /v1/completions)

### 2. Security Headers
- Content-Security-Policy (CSP)
- X-Frame-Options
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options

### 3. Client-Side Risks
- API key patterns in JavaScript files (sk-[a-zA-Z0-9]{48}, etc.)
- Exposed sensitive data
- Cookie security flags

### 4. Infrastructure Assessment
- TLS/SSL configuration
- Certificate validity
- Hosting provider detection
- CDN security features

## Database Schema (Planned)

```sql
-- Core tables
scans (
  id UUID PRIMARY KEY,
  url VARCHAR(255),
  domain VARCHAR(255),
  status ENUM('pending', 'scanning', 'completed', 'failed'),
  risk_score INTEGER,
  risk_level ENUM('low', 'medium', 'high', 'critical'),
  detected_tech JSONB,
  findings JSONB,
  metadata JSONB
)

leads (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  scan_id UUID REFERENCES scans(id),
  company VARCHAR(255),
  lead_score INTEGER,
  lifecycle_stage ENUM('subscriber', 'lead', 'mql', 'sql', 'customer'),
  source VARCHAR(100)
)

audit_requests (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  scan_id UUID REFERENCES scans(id),
  audit_type ENUM('basic', 'comprehensive', 'enterprise'),
  status ENUM('requested', 'scheduled', 'in_progress', 'completed'),
  quoted_price DECIMAL(10,2)
)
```

## API Endpoints (Planned)

```typescript
POST /api/scan
// Body: { url: string }
// Return: { scanId: string }
// Validates URL, queues scan job, returns scan ID

GET /api/scan/:id
// Return: { status, findings, riskMatrix }
// Polls scan status and returns results when complete

POST /api/lead
// Body: { email, scanId }
// Return: { success: true }
// Captures lead information for email gating
```

## Development Roadmap

### Phase 1: MVP (Weeks 1-2)
- Landing page with URL input
- Basic scan queue system (Redis + BullMQ)
- Playwright crawler with passive detection
- Results page with risk matrix
- Email capture modal
- PDF generation (basic)

### Phase 2: Enhancement (Weeks 3-4)
- Detailed AI detection logic
- Comprehensive security analysis
- Report design improvements
- Email automation
- Lead scoring

### Phase 3: Growth (Weeks 5-8)
- Blog platform & content marketing
- SEO optimization
- Payment integration
- Monitoring features
- Analytics & A/B testing

### Phase 4: Scale (Month 3+)
- Chrome extension
- Integrations (Slack, GitHub Actions)
- White-label option
- Partner program
- Advanced analytics

## Strategic Constraints

### What We DON'T Do (Critical)
- **No active attacks**: No prompt injection tests, no automated exploitation
- **No legal gray area**: Only passive observation (equivalent to "View Source")
- **No scoring**: Instead of "65/100", show risk matrix with specific findings
- **No false security**: Clear disclaimers that this is reconnaissance, not full audit

### Why These Constraints Matter
1. **Legal Safety**: Passive analysis = zero legal risk
2. **Technical Simplicity**: No need to build universal chatbot interactor
3. **Higher Conversion**: Curiosity gap drives manual audit sales better than scores
4. **Ethical Positioning**: Builds trust, enables faster market entry

## Business Model

### Free Tier
- Unlimited passive scans
- Public summary with top risks
- Technology fingerprint
- CTA for detailed audit

### Paid Services
- **Basic Audit**: $2,000 (10 hours with Garak testing)
- **Comprehensive Audit**: $5,000 (25 hours with PyRIT + Promptfoo)
- **Enterprise Audit**: $10,000+ (50+ hours with MITRE ATLAS)
- **Monitoring** (future): $99-999/month

### Unit Economics
- Lead acquisition cost: $5
- Average audit value: $3,500
- Customer acquisition cost: $150
- Lifetime value: $8,000
- **LTV/CAC ratio: 53x**

## Key Success Metrics

### Funnel Metrics
- **Scan completion rate**: Target 80%
- **Email capture rate**: Target 35%
- **Lead to opportunity**: Target 5%
- **Opportunity to customer**: Target 30%

### Technical Metrics
- **Scan time**: < 60 seconds
- **Success rate**: > 95%
- **API uptime**: 99.9%
- **False positive rate**: < 5%

### Business Metrics (6 months)
- 5,000 scans/month
- 2,000 leads/month
- 35 paid audits/month
- $150,000 ARR

## Important Documentation Files

1. **[ai-scanner-final.md](ai-scanner-final.md)** - Consolidated final project plan
2. **[elemzo_claude_v2.md](elemzo_claude_v2.md)** - Detailed technical specification
3. **[elemzo_gemini_v2.md](elemzo_gemini_v2.md)** - Lead-gen focused strategy
4. **[elemzo_gpt_v2.md](elemzo_gpt_v2.md)** - High-level architecture spec

## Implemented Features (Current Session)

### Performance Optimizations
1. **Technology Detection Early Exit**
   - Stops checking patterns after first match per technology
   - Prevents duplicate listings (e.g., 4× Google Analytics → 1× Google Analytics)
   - Exception: WordPress plugins still collect all matches
   - Files: `src/worker/analyzers/tech-stack-analyzer.ts`

2. **Cookie Security Filtering**
   - Only analyzes 1st party cookies (under website owner's control)
   - Skips 3rd party cookies (Google Analytics, Facebook Pixel, etc.)
   - Reduced false positives from ~175 to ~5-10 actionable findings
   - Files: `src/worker/analyzers/cookie-security-analyzer.ts`

3. **Admin Performance Debug Bar**
   - Shows detailed timing breakdown for administrators only
   - Authentication: `localStorage.setItem('admin_auth', 'authenticated')`
   - Displays:
     - Total scan time
     - Crawler breakdown (browser init, navigation, page load, data collection)
     - Individual analyzer execution times
     - Color-coded performance indicators (green < 100ms, red > 1s)
   - Non-fixed positioning (doesn't overlap content)
   - Files: `src/app/scan/[id]/AdminDebugBar.tsx`, `src/app/scan/[id]/page.tsx`

4. **Crawler Timing Breakdown**
   - Browser initialization timing
   - Navigation timing (DNS + TCP + TLS + HTTP request)
   - Page load timing (DOM ready + JS execution)
   - Data collection timing (cookies, SSL, screenshots)
   - Stored in scan metadata for admin visibility
   - Files: `src/lib/playwright-crawler.ts`, `src/lib/types/crawler-types.ts`, `src/lib/crawler-adapter.ts`, `src/worker/index-sqlite.ts`

### Technology Detection
- 120+ technologies across 8 categories:
  - CMS (WordPress, Drupal, Joomla, etc.)
  - Analytics (Google Analytics, Mixpanel, Heap, etc.)
  - Advertising (Google Ads, Facebook Pixel, etc.)
  - CDN (Cloudflare, Fastly, Akamai, etc.)
  - Social (Facebook, Twitter, LinkedIn widgets)
  - E-commerce (Shopify, WooCommerce, Magento, etc.)
  - JavaScript Libraries (jQuery, React, Vue, Angular, etc.)
  - Hosting Providers

### WordPress Specific Features
- Plugin detection with version extraction
- Admin panel exposure detection
- xmlrpc.php exposure warnings
- wp-json API endpoint discovery
- Theme detection

## Developer Guide

### Running Locally
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev  # http://localhost:3000

# In another terminal, start worker
npm run worker
```

### Admin Access
To enable the admin performance debug bar:
```javascript
// In browser console
localStorage.setItem('admin_auth', 'authenticated')
// Then refresh the scan page
```

### Project Structure
```
src/
├── app/                    # Next.js pages (App Router)
│   ├── page.tsx           # Homepage with scan form
│   ├── scan/[id]/         # Scan results page
│   │   ├── page.tsx       # Main scan display
│   │   └── AdminDebugBar.tsx  # Performance monitor (admin only)
│   └── api/               # API routes
│       ├── scan/          # Scan endpoints
│       └── leads/         # Lead capture
├── lib/                   # Shared libraries
│   ├── playwright-crawler.ts  # Real browser crawler
│   ├── crawler-adapter.ts     # Adapter pattern for crawler
│   └── types/             # TypeScript interfaces
├── worker/                # Background job processing
│   ├── index-sqlite.ts    # SQLite-based worker
│   ├── analyzers/         # Security analyzers
│   │   ├── ai-detection-analyzer.ts
│   │   ├── security-headers-analyzer.ts
│   │   ├── client-risks-analyzer.ts
│   │   ├── ssl-tls-analyzer.ts
│   │   ├── cookie-security-analyzer.ts
│   │   ├── js-libraries-analyzer.ts
│   │   └── tech-stack-analyzer.ts
│   ├── scoring/           # Risk calculation
│   └── report-generator/  # Report formatting
└── prisma/                # Database schema
    └── schema.prisma
```

## When Continuing Development

1. **Current working directory**: `/Users/racz-akacosiattila/Desktop/10_M_USD/ai-security-scanner`
2. **Database**: SQLite at `prisma/dev.db`
3. **Development URL**: http://localhost:3000
4. **Worker spawns automatically** when scan is requested via API

## Critical Principles

1. **Ship Fast**: 2-week MVP maximum, no feature creep
2. **Passive Only**: Never cross into active testing without explicit user consent
3. **Lead Focus**: Every feature serves the conversion funnel
4. **Educational**: Teach users about AI security risks, don't just scare them
5. **Clear Disclaimers**: Always communicate limitations of automated scanning

## Security & Legal Considerations

- Only public, passive observation (equivalent to viewing page source)
- Clear Terms of Service stating limitations
- GDPR compliance for data collection
- Responsible disclosure process for vulnerabilities found
- No destructive testing without explicit written consent
- Professional liability insurance recommended

## Future Expansion Opportunities

- Chrome extension for instant scanning
- GitHub Action for CI/CD integration
- API access for developers
- White-label solution for security firms
- Training/certification programs
- Continuous monitoring subscriptions

---

**Note for Claude Code**: This is currently a planning repository. When beginning implementation, scaffold the Next.js frontend first, then build the worker infrastructure. The passive analysis engine is the core differentiator - focus on making it accurate and fast before adding features.

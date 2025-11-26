# Fejlesztői Dokumentáció: Scan Report Page (page.tsx)

**Fájl**: `src/app/s/[scanNumber]/[domain]/page.tsx`
**Típus**: Next.js 14+ App Router - Client Component ('use client')
**Sorok száma**: 1646
**Készült**: 2025-11-26
**Verzió**: 1.0.0

---

## TARTALOMJEGYZÉK

1. [Áttekintés](#1-áttekintés)
2. [Fájl Struktúra](#2-fájl-struktúra)
3. [Importok és Függőségek](#3-importok-és-függőségek)
4. [TypeScript Interfészek](#4-typescript-interfészek)
5. [Helper Funkciók (Utility Functions)](#5-helper-funkciók)
6. [CATEGORY_META Konstans](#6-category_meta-konstans)
7. [Fő Komponens: ScanResultPage](#7-fő-komponens-scanresultpage)
   - 7.1 [State Management](#71-state-management)
   - 7.2 [useEffect Hookok](#72-useeffect-hookok)
   - 7.3 [API Hívások](#73-api-hívások)
   - 7.4 [Event Handlerek](#74-event-handlerek)
   - 7.5 [Render Logika](#75-render-logika)
8. [Segéd Komponensek](#8-segéd-komponensek)
9. [API Endpoint-ok és Adatfolyam](#9-api-endpoint-ok-és-adatfolyam)
10. [SEO és Meta Tag Kezelés](#10-seo-és-meta-tag-kezelés)
11. [Hibakezelés](#11-hibakezelés)
12. [Teljesítmény Megfontolások](#12-teljesítmény-megfontolások)

---

## 1. ÁTTEKINTÉS

### Mi ez a fájl?
Ez a komponens felelős a **biztonsági scan eredmények megjelenítéséért**. Egy SEO-barát URL-ről érhető el: `/s/{scanNumber}/{domain-slug}`

### Fő Feladatok:
- Scan adatok lekérése és megjelenítése
- Real-time polling (2 másodpercenként) amíg a scan fut
- SEO meta tag-ek dinamikus frissítése
- Lead capture modal kezelése
- Új scan indítása az oldalról
- PDF letöltés
- Report regenerálás

### Architektúra:
```
┌─────────────────────────────────────────────────────────┐
│                    page.tsx (Client)                     │
├─────────────────────────────────────────────────────────┤
│  useParams() ─► scanNumber, domain                       │
│       │                                                  │
│       ▼                                                  │
│  fetchScan() ─► /api/s/{scanNumber}/{domain}            │
│       │                                                  │
│       ▼                                                  │
│  setScan(data) ─► React State                           │
│       │                                                  │
│       ▼                                                  │
│  render() ─► UI Components                               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. FÁJL STRUKTÚRA

```
1-9       Importok
10-35     TypeScript Interfészek (Scan, KnowledgeBaseEntry)
37-71     Helper Functions (getDomainTitle, calculateGrade, stb.)
73-243    CATEGORY_META konstans (26 biztonsági kategória meta-adatai)
245-1286  ScanResultPage fő komponens
1288-1308 RiskBadge helper komponens
1311-1324 IssueCount helper komponens
1327-1400 findKnowledgeBaseEntry helper funkció
1402-1555 FindingCard komponens
1557-1644 TechCategory komponens
```

---

## 3. IMPORTOK ÉS FÜGGŐSÉGEK

### React Hookok (Line 3)
```typescript
import { useEffect, useState } from 'react'
```
- **useEffect**: Side effect-ek kezelése (API hívások, polling, SEO)
- **useState**: Komponens állapot kezelése

### Next.js Navigation (Line 4)
```typescript
import { useParams, useRouter, useSearchParams } from 'next/navigation'
```
- **useParams**: URL paraméterek kiolvasása (`scanNumber`, `domain`)
- **useRouter**: Programmatikus navigáció (`router.push()`)
- **useSearchParams**: Query paraméterek (`?report=full_report`)

### Lucide React Ikonok (Line 5)
```typescript
import { Shield, AlertTriangle, CheckCircle, XCircle, Mail, ArrowLeft,
         ArrowRight, TrendingUp, Download, Lock, Cookie, Code, Globe,
         RefreshCw, Lightbulb, Search } from 'lucide-react'
```
| Ikon | Használat |
|------|-----------|
| Shield | Logo, Scan gomb |
| AlertTriangle | Hibaüzenetek, figyelmeztetések |
| CheckCircle | Sikeres műveletek |
| XCircle | Sikertelen scan, modal bezárás |
| Mail | Lead modal |
| ArrowLeft/Right | Navigáció, expand |
| TrendingUp | Risk score |
| Download | PDF letöltés |
| RefreshCw | Regenerate, loading |
| Lightbulb | Security tip |
| Search | Új scan input |

### Belső Modulok (Lines 6-8)
```typescript
import AdminDebugBar from './AdminDebugBar'
import { getRandomSecurityTip } from '@/data/ai-security-tips'
import { AiTrustScore } from '@/components/AiTrustScore'
```
- **AdminDebugBar**: Admin-only debug információk (metadata)
- **getRandomSecurityTip**: Random biztonsági tipp loading közben
- **AiTrustScore**: AI Trust Score megjelenítő komponens

---

## 4. TYPESCRIPT INTERFÉSZEK

### Scan Interface (Lines 10-23)
```typescript
interface Scan {
  id: string              // UUID - belső azonosító
  scanNumber?: number     // Publikus scan szám (SEO-hoz)
  url: string             // Scan-elt URL
  domain?: string         // Kinyert domain
  status: string          // 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED'
  riskScore?: number      // 0-100 pontszám
  riskLevel?: string      // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  findings?: any          // Teljes ScanReport objektum
  detectedTech?: any      // Detektált technológiák
  metadata?: any          // Worker metadata (timing, stb.)
  completedAt?: string    // ISO timestamp
  aiTrustScorecard?: any  // AI Trust Score adatok
}
```

**Fontos**: A `findings` mező valójában egy teljes `ScanReport` objektum, nem csak egy findings tömb!

### KnowledgeBaseEntry Interface (Lines 25-35)
```typescript
interface KnowledgeBaseEntry {
  findingKey: string        // Egyedi azonosító (pl. "missing-content-security-policy")
  category: string          // Kategória (pl. "security")
  severity: string          // 'critical' | 'high' | 'medium' | 'low'
  title: string             // Megjelenített cím
  explanation: string       // Mit jelent ez a probléma?
  impact: string            // Miért veszélyes?
  solution: string          // Hogyan javítsuk?
  technicalDetails?: string // Technikai részletek (opcionális)
  references: string[]      // Külső linkek (OWASP, MDN, stb.)
}
```

**Cél**: E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) tartalom biztosítása a finding-okhoz.

---

## 5. HELPER FUNKCIÓK

### getDomainTitle (Lines 38-47)
```typescript
function getDomainTitle(url: string): string
```
**Cél**: URL-ből elegáns domain nevet készít a fejlécbe.

**Működés**:
1. URL parse-olás (`new URL()`)
2. `www.` prefix eltávolítása
3. Első betű nagybetűsítése

**Példák**:
- `https://www.openai.com/` → `"Openai.com"`
- `https://api.github.com` → `"Api.github.com"`

**Hiba esetén**: `"Website"` (fallback)

---

### getDomainFromUrl (Lines 49-57)
```typescript
function getDomainFromUrl(url: string): string
```
**Cél**: Tiszta domain kinyerése URL-ből.

**Példa**: `https://www.example.com/path` → `"example.com"`

---

### domainToSlug (Lines 59-62)
```typescript
function domainToSlug(domain: string): string
```
**Cél**: Domain konvertálása URL-safe slug-ra.

**Működés**: Pontokat cseréli kötőjelekre.

**Példa**: `openai.com` → `openai-com`

**Használat**: SEO-barát URL generáláshoz (`/s/123/openai-com`)

---

### calculateGrade (Lines 64-71)
```typescript
function calculateGrade(score: number): string
```
**Cél**: Risk score-ból betűjegy számítása.

**Skála**:
| Score | Grade |
|-------|-------|
| 90-100 | A+ |
| 80-89 | A |
| 70-79 | B |
| 60-69 | C |
| 50-59 | D |
| 0-49 | F |

---

## 6. CATEGORY_META KONSTANS

**Sorok**: 73-243 (170 sor)
**Típus**: `Record<string, CategoryMeta>`

### Struktúra
```typescript
const CATEGORY_META = {
  'category-key': {
    icon: string,        // Emoji ikon
    title: string,       // Magyar/angol cím
    description: string, // Rövid leírás (1 sor)
    explanation: string  // Részletes magyarázat (E-E-A-T)
  }
}
```

### Összes Kategória (26 db)

| Key | Icon | Cím |
|-----|------|-----|
| ai | 🤖 | Artificial Intelligence |
| security | 🛡️ | Security Headers |
| client | 🔑 | Client-Side Risks |
| ssl | 🔒 | SSL/TLS Encryption |
| cookie | 🍪 | Cookie Security |
| library | 📚 | JavaScript Libraries & CVE Detection |
| reconnaissance | 🔍 | Information Disclosure |
| admin | ⚠️ | Admin & Authentication |
| cors | 🌐 | Cross-Origin Resource Sharing |
| dns | 🌍 | DNS & Email Security |
| port | 🔌 | Network Ports & Services |
| compliance | 📋 | Privacy & Compliance |
| waf | 🛡️ | Web Application Firewall |
| mfa | 🔐 | Multi-Factor Authentication |
| rate-limit | ⏱️ | Rate Limiting & Bot Protection |
| graphql | 🔮 | GraphQL Security |
| error-disclosure | ❌ | Error & Debug Information |
| spa-api | ⚡ | SPA & API Architecture |
| owasp-llm01 | 💉 | Prompt Injection Risk |
| owasp-llm02 | 🚨 | Insecure Output Handling |
| owasp-llm05 | 📦 | Supply Chain Vulnerabilities |
| owasp-llm06 | 🔐 | Sensitive Information Disclosure |
| owasp-llm07 | 🔌 | Insecure Plugin Design |
| owasp-llm08 | 🤖 | Excessive Agency |
| backend-framework | ⚙️ | Backend Framework Security |
| web-server | 🖥️ | Web Server Security |
| frontend-framework | ⚛️ | Frontend Framework Security |
| api-security | 🔌 | API Security & Exposure |

### OWASP LLM Top 10 Lefedettség
A komponens implementálja az **OWASP LLM Top 10** kategóriákat:
- LLM01: Prompt Injection
- LLM02: Insecure Output Handling
- LLM05: Supply Chain
- LLM06: Sensitive Information Disclosure
- LLM07: Insecure Plugin Design
- LLM08: Excessive Agency

---

## 7. FŐ KOMPONENS: ScanResultPage

### 7.1 STATE MANAGEMENT

**Sorok**: 246-285

```typescript
// URL Paraméterek
const params = useParams()
const scanNumberParam = params.scanNumber as string  // "123"
const domainSlug = params.domain as string           // "openai-com"

// Query Paraméterek
const searchParams = useSearchParams()
const isFullReport = searchParams.get('report') === 'full_report'

// React Router
const router = useRouter()
```

#### State Változók

| State | Típus | Alapérték | Cél |
|-------|-------|-----------|-----|
| scan | Scan \| null | null | Scan adatok |
| scanId | string | '' | Belső UUID |
| loading | boolean | true | Loading state |
| error | string | '' | Hibaüzenet |
| knowledgeBase | KnowledgeBaseEntry[] | [] | E-E-A-T tartalom |
| siteSettings | any | null | Site konfiguráció |
| showLeadModal | boolean | false | Lead modal láthatóság |
| leadEmail | string | '' | Lead email input |
| leadName | string | '' | Lead név input |
| leadSubmitting | boolean | false | Lead form loading |
| leadSubmitted | boolean | false | Lead sikeres mentés |
| regenerating | boolean | false | Report regenerálás |
| securityTip | string | '' | Random biztonsági tipp |
| newScanUrl | string | '' | Új scan URL input |
| newScanLoading | boolean | false | Új scan loading |
| newScanError | string | '' | Új scan hiba |
| isAdmin | boolean | false | Admin autentikáció |

---

### 7.2 useEffect HOOKOK

#### Első useEffect: Inicializálás és Polling (Lines 287-310)
```typescript
useEffect(() => {
  // 1. Random tipp beállítása (csak client-side)
  setSecurityTip(getRandomSecurityTip())

  // 2. Admin ellenőrzés localStorage-ból
  const authToken = localStorage.getItem('admin_auth')
  setIsAdmin(authToken === 'authenticated')

  // 3. Knowledge Base lekérése
  fetchKnowledgeBase()

  // 4. Site Settings lekérése
  fetchSiteSettings()

  // 5. Scan adatok lekérése
  fetchScan()

  // 6. Polling indítása (2 másodpercenként)
  const interval = setInterval(() => {
    if (scan?.status !== 'COMPLETED' && scan?.status !== 'FAILED') {
      fetchScan()
    }
  }, 2000)

  // 7. Cleanup
  return () => clearInterval(interval)
}, [domainSlug, scanNumberParam, scan?.status])
```

**Függőségek**: `[domainSlug, scanNumberParam, scan?.status]`
- URL változáskor újra lefut
- Status változáskor újra lefut (polling leállításhoz)

---

#### Második useEffect: SEO Meta Tags (Lines 312-401)
```typescript
useEffect(() => {
  if (!scan || !scan.url) return
  // ... meta tag kezelés
}, [scan, scanId, siteSettings])
```

**Részletes leírás**: Lásd [10. SEO és Meta Tag Kezelés](#10-seo-és-meta-tag-kezelés)

---

### 7.3 API HÍVÁSOK

#### fetchKnowledgeBase() (Lines 403-413)
```typescript
const fetchKnowledgeBase = async () => {
  const response = await fetch('/api/knowledge-base')
  if (response.ok) {
    const data = await response.json()
    setKnowledgeBase(data)
  }
}
```
**Endpoint**: `GET /api/knowledge-base`
**Visszatérés**: `KnowledgeBaseEntry[]`
**Cél**: E-E-A-T tartalom a finding-okhoz

---

#### fetchSiteSettings() (Lines 415-425)
```typescript
const fetchSiteSettings = async () => {
  const response = await fetch('/api/settings')
  if (response.ok) {
    const data = await response.json()
    setSiteSettings(data)
  }
}
```
**Endpoint**: `GET /api/settings`
**Visszatérés**: Site konfiguráció (Twitter handle, popup beállítások, stb.)

---

#### fetchScan() (Lines 427-452)
```typescript
const fetchScan = async () => {
  try {
    const response = await fetch(`/api/s/${scanNumberParam}/${domainSlug}`)
    if (!response.ok) throw new Error('Scan not found')

    const data = await response.json()
    setScanId(data.id)
    setScan(data)

    if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      setLoading(false)
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Something went wrong')
    setLoading(false)
  }
}
```
**Endpoint**: `GET /api/s/{scanNumber}/{domain}`
**Példa**: `GET /api/s/123/openai-com`

**Fontos**: Ez az endpoint a **teljes scan adatot** visszaadja, beleértve:
- findings (ScanReport objektum)
- detectedTech
- metadata (timing, worker info)
- aiTrustScorecard

---

### 7.4 EVENT HANDLEREK

#### handleLeadSubmit() (Lines 454-480)
```typescript
const handleLeadSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLeadSubmitting(true)

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scanId,
        email: leadEmail,
        name: leadName,
      }),
    })

    if (!response.ok) throw new Error('Failed to save lead')
    setLeadSubmitted(true)
    setTimeout(() => setShowLeadModal(false), 2000)
  } catch (err) {
    console.error('Lead submission error:', err)
  } finally {
    setLeadSubmitting(false)
  }
}
```
**Endpoint**: `POST /api/leads`
**Body**: `{ scanId, email, name }`
**Cél**: Expert audit érdeklődő mentése CRM-be

---

#### handleRegenerateReport() (Lines 482-504)
```typescript
const handleRegenerateReport = async () => {
  if (!scan?.url || regenerating) return

  setRegenerating(true)
  try {
    const response = await fetch('/api/scan/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: scan.url }),
    })

    if (!response.ok) throw new Error('Failed to create new scan')

    const data = await response.json()
    const domainSlug = data.domain?.toLowerCase().replace(/\./g, '-') || 'scan'
    window.location.href = `/s/${data.scanNumber}/${domainSlug}`
  } catch (err) {
    console.error('Regenerate error:', err)
    alert('Failed to regenerate report. Please try again.')
    setRegenerating(false)
  }
}
```
**Endpoint**: `POST /api/scan/regenerate`
**Body**: `{ url: string }`

**FONTOS**: Ez az endpoint **bypass-olja a 24 órás duplikáció ellenőrzést**!
- Mindig új scant hoz létre
- Nincs "már van ilyen scan" hiba
- A felhasználó bármikor frissítheti a reportot

**Redirect**: `window.location.href` (teljes oldal újratöltés, nem router.push)

---

#### handleNewScan() (Lines 507-538)
```typescript
const handleNewScan = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!newScanUrl || newScanLoading) return

  setNewScanLoading(true)
  setNewScanError('')
  try {
    // ALWAYS use /api/scan/regenerate to force a NEW scan
    const response = await fetch('/api/scan/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newScanUrl }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Failed to create new scan'
      throw new Error(errorMessage)
    }

    const domainSlug = data.domain?.toLowerCase().replace(/\./g, '-') || 'scan'
    router.push(`/s/${data.scanNumber}/${domainSlug}`)
  } catch (err) {
    console.error('New scan error:', err)
    setNewScanError(err instanceof Error ? err.message : 'Failed to create new scan')
    setNewScanLoading(false)
  }
}
```
**Endpoint**: `POST /api/scan/regenerate`
**Redirect**: `router.push()` (SPA navigáció)

**Különbség a handleRegenerateReport-tól**:
- Ez új URL-re készít scant (newScanUrl state-ből)
- router.push() használ (gyorsabb, SPA)
- A másik ugyanarra az URL-re készít új scant
- window.location.href használ (teljes újratöltés)

---

### 7.5 RENDER LOGIKA

#### Hiba Állapot (Lines 540-671)
```typescript
if (error) {
  if (error.includes('not found') || error.includes('404')) {
    // 404 oldal - szép UI
    return (...)
  }
  // Egyéb hiba - egyszerű piros doboz
  return (...)
}
```

A 404 oldal tartalma:
- Logo és cím
- "Scan Not Found" üzenet
- Kért URL megjelenítése
- "Go Home" és "Browse All Scans" gombok
- Új scan form
- Popular domains linkek

---

#### Loading Állapot (Lines 673-698)
```typescript
if (loading || !scan) {
  return (
    <div className="...">
      <div className="spinner..."></div>
      <p>Scanning website security...</p>
      {scan?.url && <p className="font-mono">{scan.url}</p>}
      <p>This may take a few moments</p>

      {/* Random Security Tip */}
      {securityTip && (
        <div className="tip-box">
          <Lightbulb />
          <p>{securityTip}</p>
        </div>
      )}
    </div>
  )
}
```

**Security Tip**:
- Csak client-side renderelés után jelenik meg
- `getRandomSecurityTip()` hívás useEffect-ben
- Elkerüli a hydration mismatch hibát

---

#### Failed Állapot (Lines 700-718)
```typescript
if (scan.status === 'FAILED') {
  return (
    <div className="...">
      <XCircle className="w-16 h-16 text-red-400" />
      <h2>Scan Failed</h2>
      <p>Please try again with a different URL.</p>
      <a href="/">Try Again</a>
    </div>
  )
}
```

---

#### Completed Állapot - Fő Render (Lines 720-1285)

**Adatok Előkészítése** (Lines 720-757):
```typescript
// Report struktura parse-olása
const report = scan.findings || { summary: {}, detectedTech: {}, findings: [] }
const findings = report.findings || []
const detectedTech = report.detectedTech || scan.detectedTech || {}

// Summary fallback ha nincs riskScore property
const summary = (report.summary && report.summary.riskScore)
  ? report.summary
  : {
      hasAI: detectedTech?.aiProviders?.length > 0,
      riskScore: { score: scan.riskScore || 0, level: scan.riskLevel || 'UNKNOWN', grade: calculateGrade(scan.riskScore || 0) },
      criticalIssues: findings.filter(f => f.severity === 'critical').length,
      // ... stb.
    }

// Findings csoportosítása kategória szerint
const findingsByCategory = findings.reduce((acc, finding) => {
  const cat = finding.category || 'security'
  if (!acc[cat]) acc[cat] = []
  acc[cat].push(finding)
  return acc
}, {})

// AI findings külön kezelése
const aiFindings = findingsByCategory['ai'] || []

// Kategória sorrend (OWASP LLM prioritás)
const categoryOrder = ['owasp-llm01', 'owasp-llm02', ...]

// Full report módban minden kategória, egyébként csak amelyikben van finding
const nonAICategories = isFullReport
  ? categoryOrder.filter(cat => cat !== 'ai')
  : categoryOrder.filter(cat => findingsByCategory[cat] && cat !== 'ai')
```

---

**UI Struktúra**:
```
┌─ Header (Lines 767-817) ─────────────────────────────────┐
│  Logo, Domain Title, Regenerate Button, PDF Download     │
└──────────────────────────────────────────────────────────┘

┌─ New Scan Form (Lines 819-854) ──────────────────────────┐
│  URL Input + "Start New Scan" Button                     │
└──────────────────────────────────────────────────────────┘

┌─ URL Badge (Lines 856-863) ──────────────────────────────┐
│  "Scanned: https://example.com"                          │
└──────────────────────────────────────────────────────────┘

┌─ Risk Score Card (Lines 865-896) ────────────────────────┐
│  Score (0-100) | Grade | Risk Level | Issue Counts       │
└──────────────────────────────────────────────────────────┘

┌─ AI Trust Score (Lines 898-915) ─────────────────────────┐
│  AiTrustScore komponens (ha van aiTrustScorecard)        │
└──────────────────────────────────────────────────────────┘

┌─ AI Detection Section (Lines 917-1028) ──────────────────┐
│  AI Provider, Chat Framework, Security Findings          │
└──────────────────────────────────────────────────────────┘

┌─ Technology Stack (Lines 1030-1134) ─────────────────────┐
│  CMS, E-commerce, Analytics, CDN, stb. kategóriák        │
└──────────────────────────────────────────────────────────┘

┌─ Security Findings by Category (Lines 1136-1194) ────────┐
│  Minden kategória külön blokkban                         │
│  - OWASP LLM kategóriák először                          │
│  - Full report: minden kategória (üres is)               │
│  - Normal: csak amelyikben van finding                   │
└──────────────────────────────────────────────────────────┘

┌─ CTA (Lines 1196-1209) ──────────────────────────────────┐
│  "Want a Deeper Security Audit?" - $2000 gomb            │
└──────────────────────────────────────────────────────────┘

┌─ Lead Capture Modal (Lines 1213-1283) ───────────────────┐
│  Név + Email form → /api/leads                           │
└──────────────────────────────────────────────────────────┘
```

---

## 8. SEGÉD KOMPONENSEK

### RiskBadge (Lines 1288-1308)
```typescript
function RiskBadge({ level }: { level?: string })
```
**Props**: `level` - 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

**Megjelenítés**:
| Level | Szín | Szöveg |
|-------|------|--------|
| LOW | Zöld | LOW RISK |
| MEDIUM | Sárga | MEDIUM RISK |
| HIGH | Narancs | HIGH RISK |
| CRITICAL | Piros | CRITICAL RISK |

---

### IssueCount (Lines 1311-1324)
```typescript
function IssueCount({ label, count, color }: {
  label: string,
  count: number,
  color: 'red' | 'orange' | 'yellow' | 'blue'
})
```
**Megjelenítés**: Nagy szám + kis label (pl. "5 Critical")

---

### findKnowledgeBaseEntry (Lines 1327-1400)
```typescript
function findKnowledgeBaseEntry(
  finding: any,
  knowledgeBase: KnowledgeBaseEntry[]
): KnowledgeBaseEntry | null
```

**Pairing Logika**:

1. **Security Headers** (prefix matching):
   - `"Missing: Content-Security-Policy"` → `"missing-content-security-policy"`

2. **SSL/TLS** (direkt mapping):
   ```typescript
   const sslMapping = {
     'no https encryption': 'no-https-encryption',
     'ssl certificate expired': 'ssl-certificate-expired',
     // ...
   }
   ```

3. **Cookie Security** (keyword matching):
   - `title.includes('cookie') && title.includes('httponly')` → `"cookie-missing-httponly"`

4. **JavaScript Libraries** (keyword matching):
   - CDN + integrity → `"cdn-missing-sri"`
   - deprecated library → `"deprecated-library"`

5. **AI Detection**:
   - `"ai technology detected"` → `"ai-technology-detected"`

6. **Client Risks**:
   - exposed + api key → `"exposed-api-key"`

**Return**: `KnowledgeBaseEntry | null`

---

### FindingCard (Lines 1402-1555)
```typescript
function FindingCard({
  finding,
  knowledgeBase
}: {
  finding: any
  knowledgeBase: KnowledgeBaseEntry[]
})
```

**Struktúra**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 Finding Title                    [CRITICAL RISK]     │
├─────────────────────────────────────────────────────────┤
│ Description text...                                     │
├─────────────────────────────────────────────────────────┤
│ Evidence: [code/url]  HTTP Status: 200                  │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Why is this a problem?                               │
│ Impact text from finding...                             │
├─────────────────────────────────────────────────────────┤
│ ▶ How to fix this                    [expand/collapse]  │
├─────────────────────────────────────────────────────────┤
│ (Expanded: E-E-A-T content from Knowledge Base)         │
│ - What is this issue?                                   │
│ - Why is this dangerous?                                │
│ - How to fix it                                         │
│ - Technical Details (optional)                          │
│ - References (external links)                           │
└─────────────────────────────────────────────────────────┘
```

**Severity Színek**:
| Severity | Border | Background |
|----------|--------|------------|
| critical | red-500/50 | red-500/10 |
| high | orange-500/50 | orange-500/10 |
| medium | yellow-500/50 | yellow-500/10 |
| low | blue-500/50 | blue-500/10 |

---

### TechCategory (Lines 1557-1644)
```typescript
function TechCategory({
  title,      // "CMS"
  icon,       // "📝"
  color,      // "purple"
  technologies // Array of detected tech
}: { ... })
```

**Technology Item**:
- Name (link if website exists)
- Version badge
- Confidence badge (Confirmed/Likely/Possible)
- Evidence (if available)

**Confidence Színek**:
| Confidence | Megjelenítés |
|------------|--------------|
| high | ✓ Confirmed (zöld) |
| medium | ✓ Likely (sárga) |
| low | ✓ Possible (szürke) |

---

## 9. API ENDPOINT-OK ÉS ADATFOLYAM

### Használt Endpoint-ok

| Endpoint | Metódus | Cél | Hívás Helye |
|----------|---------|-----|-------------|
| `/api/s/{scanNumber}/{domain}` | GET | Scan adatok lekérése | fetchScan() |
| `/api/knowledge-base` | GET | E-E-A-T tartalom | fetchKnowledgeBase() |
| `/api/settings` | GET | Site konfiguráció | fetchSiteSettings() |
| `/api/scan/regenerate` | POST | Új scan (bypass duplicate) | handleRegenerateReport(), handleNewScan() |
| `/api/leads` | POST | Lead mentése | handleLeadSubmit() |
| `/api/scan/{id}/pdf` | GET | PDF letöltés | Download gomb href |

### Adatfolyam Diagram

```
┌─ User navigates to /s/123/openai-com ─┐
│                                        │
▼                                        │
useParams() → scanNumber, domain         │
│                                        │
▼                                        │
useEffect() trigger                      │
│                                        │
├──► fetchScan() ──► /api/s/123/openai-com
│         │
│         ▼
│    setScan(data)
│         │
│         ▼
│    if (PENDING/SCANNING):
│         │
│         ▼
│    setInterval(fetchScan, 2000) ◄──────┘ [POLLING]
│         │
│         ▼
│    if (COMPLETED/FAILED):
│         │
│         ▼
│    setLoading(false)
│         │
│         ▼
│    render completed UI
│
├──► fetchKnowledgeBase() ──► /api/knowledge-base
│         │
│         ▼
│    setKnowledgeBase(data)
│
└──► fetchSiteSettings() ──► /api/settings
          │
          ▼
     setSiteSettings(data)
```

---

## 10. SEO ÉS META TAG KEZELÉS

### Dinamikus Meta Tag-ek (Lines 312-401)

A komponens a következő meta tag-eket kezeli dinamikusan:

#### Standard Meta Tags
| Tag | Példa Érték |
|-----|-------------|
| title | "Openai.com AI Security Scan - Score 85/100 (A) \| Free Report" |
| description | "Free AI security analysis of https://openai.com. Risk Score: 85/100 (A grade, LOW risk)..." |

#### Open Graph Tags (Facebook, LinkedIn)
| Tag | Cél |
|-----|-----|
| og:type | website |
| og:title | Hosszabb, részletesebb cím |
| og:description | Részletes leírás social share-hez |
| og:url | Canonical URL |
| og:site_name | "AI Security Scanner" |

#### Twitter Card Tags (opcionális)
Csak ha `siteSettings.enableTwitterCards === true` és `siteSettings.twitterHandle` be van állítva:

| Tag | Cél |
|-----|-----|
| twitter:card | summary_large_image |
| twitter:title | Rövid Twitter-optimalizált cím |
| twitter:description | 160 karakter limit |
| twitter:site | @handle |
| twitter:creator | @handle |

#### Canonical URL
```typescript
const canonicalUrl = `${window.location.origin}/s/${scan.scanNumber}/${domainSlug}`
```
Biztosítja, hogy a keresőmotorok a SEO-barát URL-t indexeljék.

#### setMetaTag Helper
```typescript
const setMetaTag = (property: string, content: string, isProperty = false) => {
  const attribute = isProperty ? 'property' : 'name'
  let metaTag = document.querySelector(`meta[${attribute}="${property}"]`)

  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute(attribute, property)
    document.head.appendChild(metaTag)
  }

  metaTag.setAttribute('content', content)
}
```
- Létrehozza a tag-et ha nem létezik
- Frissíti ha már létezik
- `isProperty=true`: `property="og:title"` (OG tags)
- `isProperty=false`: `name="description"` (standard tags)

---

## 11. HIBAKEZELÉS

### Error Handling Stratégia

1. **API Hívás Hibák**:
   ```typescript
   try {
     const response = await fetch(...)
     if (!response.ok) throw new Error('...')
   } catch (err) {
     setError(err.message)
     setLoading(false)
   }
   ```

2. **404 Kezelés**:
   - Külön szép UI a "Scan not found" esetére
   - Megjeleníti a kért URL-t
   - Ajánl alternatív műveleteket

3. **Form Validation**:
   - `required` attribútum az input-okon
   - Error state megjelenítése (`newScanError`)
   - API error üzenet továbbítása a felhasználónak

4. **Graceful Degradation**:
   - Ha nincs `aiTrustScorecard` → nem jelenik meg az AI Trust Score blokk
   - Ha nincs `techStack` → nem jelenik meg a Technology Stack
   - Ha nincs `kbEntry` → fallback a `finding.recommendation`-re

---

## 12. TELJESÍTMÉNY MEGFONTOLÁSOK

### Polling Optimalizáció
```typescript
const interval = setInterval(() => {
  if (scan?.status !== 'COMPLETED' && scan?.status !== 'FAILED') {
    fetchScan()
  }
}, 2000)
```
- **2 másodperces intervallum**: Elég gyors a UX-hez, de nem terheli túl a szervert
- **Automatikus leállás**: COMPLETED vagy FAILED státusznál megáll
- **Cleanup**: useEffect return-ben clearInterval

### Hydration Mismatch Elkerülése
```typescript
const [securityTip, setSecurityTip] = useState<string>('')

useEffect(() => {
  setSecurityTip(getRandomSecurityTip()) // Csak client-side
}, [])
```
A random tipp **nem server-side rendereződik**, így nincs mismatch.

### Lazy Loading Lehetőségek (jövőbeli)
- Knowledge Base betöltése csak expand-nél
- Kategória blokkok lazy renderelése
- PDF generálás on-demand

### Bundle Size
- Lucide React: Tree-shaking támogatott, csak a használt ikonok kerülnek a bundle-be
- CATEGORY_META: Statikus objektum, nem okoz re-render-t

---

## FÜGGELÉK: API Response Példák

### GET /api/s/{scanNumber}/{domain}
```json
{
  "id": "uuid",
  "scanNumber": 123,
  "url": "https://openai.com",
  "domain": "openai.com",
  "status": "COMPLETED",
  "riskScore": 85,
  "riskLevel": "LOW",
  "findings": {
    "summary": { ... },
    "findings": [ ... ],
    "detectedTech": { ... },
    "techStack": { ... }
  },
  "metadata": {
    "crawl": "2500",
    "passiveAPI": "1200",
    "aiTrust": "450"
  },
  "aiTrustScorecard": {
    "score": 78,
    "hasAiImplementation": true,
    "detectedAiProvider": "OpenAI",
    "detectedModel": "GPT-4",
    ...
  },
  "completedAt": "2025-11-26T12:00:00.000Z"
}
```

### POST /api/scan/regenerate
**Request**:
```json
{ "url": "https://openai.com" }
```
**Response**:
```json
{
  "scanId": "new-uuid",
  "scanNumber": 124,
  "domain": "openai.com",
  "message": "Scan queued successfully",
  "isRegenerate": true
}
```

---

## CHANGELOG

| Dátum | Verzió | Változás |
|-------|--------|----------|
| 2025-11-26 | 1.0.0 | Dokumentáció elkészítése |

---

**Készítette**: Claude Code
**Projekt**: AI Security Scanner
**Licenc**: Proprietary

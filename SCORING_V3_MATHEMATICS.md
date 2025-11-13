# 🎯 Professional Security Scoring System v3.0 - Teljes Matematika

**Verzió**: v3.0
**Dátum**: 2025-11-13
**Alapelv**: 100 = Tökéletes Biztonság, 0 = Katasztrofális Hiba
**Skála**: Intuitív "higher is better"

---

## 📐 1. ALAPKÉPLET

```
Final Score = min(100, Weighted Category Score + Bonuses)

Weighted Category Score = Σ (Category Score × Category Weight)

Category Score = max(0, 100 - Total Penalties)
```

---

## 🎚️ 2. KATEGÓRIA SÚLYOK (Összesen: 100%)

| Kategória | Súly | Mivel foglalkozik | Miért fontos |
|-----------|------|-------------------|--------------|
| **Critical Infrastructure** | 30% | SSL/TLS, DNS, DNSSEC, hosting | Alapvető infrastruktúra, teljes kiesés kockázata |
| **Authentication** | 25% | Sessions, cookies, auth tokens, MFA | Közvetlen támadási vektor, felhasználói adatok |
| **Data Protection** | 20% | Headers (CSP, HSTS, CORS), XSS, secrets | Adatszivárgás, kliensoldali támadások |
| **AI Security** | 15% | OWASP LLM Top 10, prompt injection | Új, feltörekvő kockázat |
| **Code Quality** | 10% | JS libraries, dependencies, supply chain | Láncreakciók, harmadik féltől származó sebezhetőségek |

**Megjegyzés**: Ha nincs AI (N/A), akkor az AI Security 15%-a arányosan átkerül a többi kategóriába:
```
Ha AI Security = N/A:
  Critical Infrastructure: 30% → 35.3%
  Authentication: 25% → 29.4%
  Data Protection: 20% → 23.5%
  Code Quality: 10% → 11.8%
```

---

## ⚖️ 3. LEVONÁSOK (PENALTY POINTS)

### 3.1 Severity-alapú Pontlevonások

| Severity | 1. Finding | 2+ Findings (egyenként) | Maximum/Category |
|----------|------------|-------------------------|------------------|
| **Critical** | -10 pont | -7 pont | -40 pont cap |
| **High** | -6 pont | -4 pont | -30 pont cap |
| **Medium** | -3 pont | -2 pont | -20 pont cap |
| **Low** | -1 pont | -0.5 pont | -10 pont cap |
| **Info** | 0 pont | 0 pont | 0 pont |

**Logika**:
- **Diminishing Returns**: Az első hiba teljes súllyal számít, a többiek kevesebb súllyal (elkerüli az összeomlást)
- **Cap per Category**: Minden kategóriában maximum X pont vonódhat le (megakadályozza, hogy 1 kategória tönkretegye az egész score-t)

### 3.2 Példa Számítás (Data Protection kategória)

**Példa oldal hibái:**
- 0 critical
- 3 high findings
- 10 medium findings
- 5 low findings

**Számítás:**
```
High penalties:
  - 1st high: -6 pont
  - 2nd high: -4 pont
  - 3rd high: -4 pont
  Subtotal: -14 pont

Medium penalties:
  - 1st medium: -3 pont
  - 9× additional: 9 × (-2) = -18 pont
  Subtotal: -21 pont

Low penalties:
  - 1st low: -1 pont
  - 4× additional: 4 × (-0.5) = -2 pont
  Subtotal: -3 pont

Total Deduction: -14 -21 -3 = -38 pont
Category Score: 100 - 38 = 62/100
```

---

## ✨ 4. BÓNUSZOK (BONUS POINTS)

### 4.1 Elérhető Bónuszok

| Bónusz | Pontok | Kategória | Feltétel |
|--------|--------|-----------|----------|
| **HTTPS Enabled** | +5 | Critical Infrastructure | SSL certificate properly configured |
| **No Secrets Exposed** | +10 | Data Protection | Nincs API key/credential a kliensoldali kódban |
| **DNSSEC Enabled** | +5 | Critical Infrastructure | DNSSEC validation active |
| **HSTS Enabled** | +3 | Data Protection | Strict-Transport-Security header configured |
| **Strong CSP** | +5 | Data Protection | Content-Security-Policy with nonce/hash |
| **Secure Cookies** | +3 | Authentication | Minden cookie Secure + HttpOnly flag-gel |
| **No Obsolete Libraries** | +3 | Code Quality | Minden JS library naprakész |
| **Email Security** | +3 | Critical Infrastructure | SPF + DKIM + DMARC configured |

**Maximum Bonus**: +25 pont (megakadályozza a "gaming the system"-et)

### 4.2 Bónusz Logika

```typescript
// Példa: HTTPS Enabled
if (metadata?.sslCertificate) {
  bonuses.push({ points: +5, category: 'Critical Infrastructure' })
  totalBonusPoints += 5
}

// Példa: No Secrets Exposed
const hasSecrets = findings.some(f =>
  f.category.includes('api-key') || f.category.includes('secret')
)
if (!hasSecrets) {
  bonuses.push({ points: +10, category: 'Data Protection' })
  totalBonusPoints += 10
}

// Cap alkalmazása
totalBonusPoints = Math.min(totalBonusPoints, 25)
```

---

## 🎯 5. TELJES SZÁMÍTÁSI PÉLDA

### Példa Website: `example.com`

**Findings:**
- Critical Infrastructure: 0 critical, 2 high, 5 medium, 2 low
- Authentication: 0 critical, 1 high, 3 medium, 1 low
- Data Protection: 0 critical, 3 high, 10 medium, 5 low
- Code Quality: 0 critical, 1 high, 0 medium, 0 low
- AI Security: N/A (nincs AI)

**Bónuszok:**
- HTTPS Enabled: ✅ (+5)
- No Secrets Exposed: ✅ (+10)
- DNSSEC: ❌ (0)
- HSTS: ✅ (+3)
- Strong CSP: ❌ (0)
- Secure Cookies: ✅ (+3)
- No Obsolete Libraries: ✅ (+3)
- Email Security: ❌ (0)
Total Bonuses: +24 (cap = +25)

---

### STEP 1: Kategória Súlyok (AI N/A)

```
Critical Infrastructure: 30% → 35.3%
Authentication: 25% → 29.4%
Data Protection: 20% → 23.5%
Code Quality: 10% → 11.8%
```

---

### STEP 2: Kategória Pontszámok

#### Critical Infrastructure (35.3% súly)
```
Penalties:
- 2 high: -6 -4 = -10
- 5 medium: -3 + 4×(-2) = -11
- 2 low: -1 + 1×(-0.5) = -1.5
Total: -22.5

Category Score: 100 - 22.5 = 77.5/100
```

#### Authentication (29.4% súly)
```
Penalties:
- 1 high: -6
- 3 medium: -3 + 2×(-2) = -7
- 1 low: -1
Total: -14

Category Score: 100 - 14 = 86/100
```

#### Data Protection (23.5% súly)
```
Penalties:
- 3 high: -6 -4 -4 = -14
- 10 medium: -3 + 9×(-2) = -21 (cap: -20)
- 5 low: -1 + 4×(-0.5) = -3
Total: -37 (capped at -40 per category)

Category Score: 100 - 37 = 63/100
```

#### Code Quality (11.8% súly)
```
Penalties:
- 1 high: -6
Total: -6

Category Score: 100 - 6 = 94/100
```

---

### STEP 3: Weighted Score Calculation

```
Weighted Score = Σ (Category Score × Weight)

= (77.5 × 0.353) + (86 × 0.294) + (63 × 0.235) + (94 × 0.118)
= 27.36 + 25.28 + 14.81 + 11.09
= 78.54
```

---

### STEP 4: Bónuszok Hozzáadása

```
Final Score = min(100, 78.54 + 24)
           = min(100, 102.54)
           = 100
```

**⚠️ Figyelem**: Ha a weighted score + bonuses > 100, akkor 100-ra cap-eljük!

---

### STEP 5: Risk Level & Grade

| Score Range | Risk Level | Grade |
|-------------|------------|-------|
| 70-100 | LOW | B- to A+ |
| 50-69 | MEDIUM | D+ to C+ |
| 30-49 | HIGH | D- to D+ |
| 0-29 | CRITICAL | F |

**Ebben a példában:**
```
Final Score: 100/100
Risk Level: LOW
Grade: A+
```

---

## 🧮 6. REÁLIS PÉLDÁK

### Példa 1: Jól Védett Oldal (GitHub, Stripe)

```
Findings: 0 critical, 1 high, 5 medium, 3 low
Bonuses: HTTPS (+5), No Secrets (+10), HSTS (+3), Secure Cookies (+3) = +21

Weighted Score: ~92
Final Score: 92 + 21 = 100 (capped)
Grade: A+ (LOW RISK)
```

---

### Példa 2: Átlagos Vállalati Oldal

```
Findings: 0 critical, 7 high, 18 medium, 8 low
Bonuses: HTTPS (+5), HSTS (+3) = +8

Weighted Score: ~60
Final Score: 60 + 8 = 68
Grade: C+ (MEDIUM RISK)
```

---

### Példa 3: Rossz Biztonságú Oldal

```
Findings: 2 critical, 10 high, 20 medium, 15 low
Bonuses: 0 (sok hiba miatt nincs bonus)

Weighted Score: ~25
Final Score: 25
Grade: F (CRITICAL RISK)
```

---

## 📊 7. KATEGÓRIA MAPPING (Findings → Categories)

| Finding Category | Maps to Scoring Category |
|------------------|-------------------------|
| `ssl`, `tls`, `certificate`, `dns`, `hosting`, `infrastructure` | **Critical Infrastructure** |
| `auth`, `cookie`, `session`, `login`, `credential` | **Authentication** |
| `header`, `csp`, `xss`, `leak`, `secret`, `api-key`, `cors` | **Data Protection** |
| `ai`, `llm`, `owasp-llm` | **AI Security** |
| `library`, `librarie`, `dependency`, `code`, `tech` | **Code Quality** |

**Default**: Ha nem illik egyik kategóriába sem → Data Protection

---

## 🎓 8. IPARÁGI SZTENDERDEK

### CVSS 3.1 Severity Ratings
- **Critical**: 9.0-10.0 (azonnal kihasználható, súlyos üzleti hatás)
- **High**: 7.0-8.9 (könnyen kihasználható, jelentős hatás)
- **Medium**: 4.0-6.9 (kihasználható, mérsékelt hatás)
- **Low**: 0.1-3.9 (nehezen kihasználható, alacsony hatás)

### OWASP Risk Rating Methodology
```
Risk = Likelihood × Impact

Likelihood factors:
- Threat Agent Factors
- Vulnerability Factors

Impact factors:
- Technical Impact
- Business Impact
```

### NIST Cybersecurity Framework v2.0
- **Identify**: Asset management, risk assessment
- **Protect**: Access control, data security
- **Detect**: Continuous monitoring
- **Respond**: Incident response
- **Recover**: Recovery planning

---

## 🔄 9. DINAMIKUS WEIGHT REDISTRIBUTION (N/A Categories)

Ha egy kategória nem alkalmazható (pl. nincs AI), akkor a súlyát átcsoportosítjuk:

```typescript
// Step 1: Azonosítás
if (!metadata?.hasAI) {
  categoryScores.aiSecurity.applicable = false
}

// Step 2: Összes alkalmazható súly összegzése
const totalApplicableWeight =
  categories.filter(c => c.applicable)
           .reduce((sum, c) => sum + c.weight, 0)

// Step 3: Normalizálás (sum = 1.0)
for (const category of applicableCategories) {
  category.weight = category.weight / totalApplicableWeight
}
```

**Példa:**
```
Eredeti:
- Critical Infrastructure: 30%
- Authentication: 25%
- Data Protection: 20%
- AI Security: 15% (N/A!)
- Code Quality: 10%

Összeg: 85% (15% hiányzik)

Normalizált:
- Critical Infrastructure: 30/85 = 35.3%
- Authentication: 25/85 = 29.4%
- Data Protection: 20/85 = 23.5%
- Code Quality: 10/85 = 11.8%

Összeg: 100%
```

---

## ✅ 10. ÁTLÁTHATÓSÁG (Glass-Box Logic)

A scoring v3.0 **teljes átláthatóságot** biztosít:

### 10.1 Penalties Array
```json
{
  "penalties": [
    {
      "category": "Data Protection",
      "severity": "high",
      "finding": "Missing Content-Security-Policy header",
      "points": -6,
      "rationale": "First high finding in Data Protection"
    },
    {
      "category": "Authentication",
      "severity": "medium",
      "finding": "Cookie without Secure flag",
      "points": -3,
      "rationale": "First medium finding in Authentication"
    }
  ]
}
```

### 10.2 Bonuses Array
```json
{
  "bonuses": [
    {
      "category": "Critical Infrastructure",
      "practice": "HTTPS/TLS enabled",
      "points": 5,
      "rationale": "SSL/TLS certificate properly configured"
    },
    {
      "category": "Data Protection",
      "practice": "No exposed secrets",
      "points": 10,
      "rationale": "No API keys or credentials found in client-side code"
    }
  ]
}
```

### 10.3 Category Breakdown
```json
{
  "categories": {
    "criticalInfrastructure": {
      "score": 77,
      "weight": 0.353,
      "findings": 9,
      "pointsDeducted": 23,
      "description": "Critical Infrastructure",
      "applicable": true
    }
  }
}
```

---

## 🚀 11. KÖVETKEZTETÉSEK

### ✅ Mi működik jól?
1. **Intuitív skála**: 100 = jó, 0 = rossz (nem fordítva!)
2. **Diminishing returns**: Sok kis hiba ≠ 1 nagy hiba
3. **Category caps**: 1 kategória nem dönti le az egész score-t
4. **Bonus rendszer**: Jutalom a jó gyakorlatokért (+25 max)
5. **N/A handling**: Ha nincs AI, nem húzza le a score-t
6. **Átlátható**: Minden levonás/bónusz indoklással

### 🎯 Használati Útmutató
- **90-100**: Kiváló biztonság (GitHub, Stripe szint)
- **70-89**: Jó biztonság, kisebb hibák (bankok, nagy cégek)
- **50-69**: Átlagos, több javítandó (kis-közép vállalatok)
- **30-49**: Gyenge, sürgős javítás szükséges
- **0-29**: Kritikus, azonnal intézkedés kell!

---

**Verzió**: v3.0
**Készítette**: Claude + Attila
**Utolsó frissítés**: 2025-11-13

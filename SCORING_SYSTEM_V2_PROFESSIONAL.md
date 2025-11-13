# Professional Security Scoring System v2.0

## Executive Summary

Az új scoring rendszer az iparági sztenderdeken alapul (CVSS 3.1, OWASP Risk Rating) és teljesen transzparens, üvegdoboz-szerű betekintést nyújt a pontozás logikájába.

## Problémák a v1 rendszerrel

### 1. **Nem reális pontozás**
- **Probléma**: 7 high + 15 medium + 11 low = 30/100 (CRITICAL) túl szigorú
- **Példa**: Egy WordPress site 15 medium severity finding-gel (pl. cookie-k SameSite flag nélkül) egyből CRITICAL lett
- **Valóság**: Ezek a problémák valóban komoly rizikót jelentenek, DE nem kritikusak

### 2. **Lineáris büntetés**
- **Probléma**: 10 low severity = 1 critical severity (10 × 5pt = 50pt vs 40pt)
- **Valóság**: 10 apró biztonsági hiány NEM ugyanaz, mint 1 kritikus sérülékenység
- **Megoldás**: Diminishing returns (csökkenő hozam)

### 3. **Nincs kontextus**
- **Probléma**: Minden kategória egyformán számít
- **Valóság**: Exposed API key (critical) sokkal rosszabb, mint missing HSTS header (medium)
- **Megoldás**: Súlyozott kategóriák

### 4. **Nincs pozitív értékelés**
- **Probléma**: Csak büntetések vannak, nincs bónusz jó gyakorlatokért
- **Valóság**: Ha egy site HTTPS-t használ, CSP-je van, DNS biztonság = elismerés
- **Megoldás**: Bonus points (+25 max)

### 5. **Nem transzparens**
- **Probléma**: User nem látja, miből áll a pontszám
- **Valóság**: "30/100" semmit nem mond, hogy MI a probléma
- **Megoldás**: Category breakdown + penalty/bonus lista

## Az új v2.0 scoring rendszer

### Kategóriák és súlyok (összesen: 100%)

| Kategória | Alapértelmezett súly | Leírás | Példák |
|-----------|---------------------|--------|--------|
| **Critical Infrastructure** | 30% | SSL/TLS, DNS, hálózati biztonság | Certificate expiry, DNSSEC, open ports |
| **Authentication** | 25% | Session kezelés, cookie-k, login | Cookie security, MFA, rate limiting |
| **Data Protection** | 20% | Headers, CSP, data leakage | CSP, exposed secrets, reconnaissance |
| **Code Quality** | 10% | Függőségek, könyvtárak | Vulnerable libraries, SRI |
| **AI Security** | 10% | OWASP LLM Top 10 | Prompt injection, data leakage |
| **Compliance** | 5% | Privacy, GDPR, policies | Privacy policy, cookie consent |

#### Dinamikus súlyozás (N/A kategóriák kezelése)

**FONTOS**: Ha egy kategória nem alkalmazható (pl. nincs AI → AI Security N/A), akkor:
1. A kategória súlya **0%-ra** csökken
2. A többi kategória súlyai **arányosan növekednek**, hogy továbbra is 100%-ot adjanak

**Példa: Nincs AI a website-on**

| Kategória | Eredeti súly | AI N/A után | Számítás |
|-----------|--------------|-------------|----------|
| Critical Infrastructure | 30% | **33.3%** | 30% / 90% = 0.333 |
| Authentication | 25% | **27.8%** | 25% / 90% = 0.278 |
| Data Protection | 20% | **22.2%** | 20% / 90% = 0.222 |
| Code Quality | 10% | **11.1%** | 10% / 90% = 0.111 |
| **AI Security** | 10% | **0%** (N/A) | - |
| Compliance | 5% | **5.6%** | 5% / 90% = 0.056 |
| **ÖSSZESEN** | 100% | **100%** | ✓ |

Ez biztosítja, hogy:
- ✅ Nem büntetjük a website-ot azért, mert nincs AI-ja
- ✅ A scoring továbbra is 0-100 skálán mozog
- ✅ A kategóriák arányai megmaradnak (Critical Infrastructure még mindig a legfontosabb)

### Severity pontok (diminishing returns)

| Severity | 1. finding | További findings | Max cap |
|----------|-----------|------------------|----------|
| **Critical** | -35 pont | -20 pont/db | -100 pont |
| **High** | -20 pont | -10 pont/db | -60 pont |
| **Medium** | -10 pont | -4 pont/db | -40 pont |
| **Low** | -3 pont | -1 pont/db | -15 pont |

**Példa**:
- 1 critical finding = -35 pont
- 2 critical findings = -35 + (-20) = -55 pont
- 3 critical findings = -35 + (-20) + (-20) = -75 pont
- 10 critical findings = max -100 pont (cap)

### Bónusz pontok (max +25)

| Gyakorlat | Bónusz | Feltétel |
|-----------|--------|----------|
| HTTPS enabled | +5 | Valid SSL certificate |
| Strong CSP | +5 | CSP header implemented |
| Secure cookies | +3 | HttpOnly, Secure, SameSite |
| No exposed secrets | +10 | No API keys in client code |
| DNS security | +5 | DNSSEC, SPF, DKIM, DMARC |

### Risk levels (CVSS alapján)

| Score | Grade | Risk Level | Jelentés |
|-------|-------|------------|----------|
| 97-100 | A+ | LOW | Kiváló biztonság |
| 93-96 | A | LOW | Nagyon jó biztonság |
| 90-92 | A- | LOW | Jó biztonság |
| 87-89 | B+ | LOW | Megfelelő biztonság |
| 83-86 | B | LOW | Átlagos biztonság |
| 80-82 | B- | LOW | Elfogadható biztonság |
| 77-79 | C+ | MEDIUM | Javítandó területek |
| 73-76 | C | MEDIUM | Több javítás szükséges |
| 70-72 | C- | MEDIUM | Komoly javítások szükségesek |
| 67-69 | D+ | MEDIUM | Jelentős hiányosságok |
| 63-66 | D | MEDIUM | Sok hiányosság |
| 60-62 | D- | MEDIUM | Kritikus hiányosságok |
| 40-59 | F | HIGH | Magas kockázat |
| 0-39 | F | CRITICAL | Kritikus kockázat |

## Átláthatóság: Score breakdown

A következő adatokat látja a felhasználó:

### 1. Overall Score Card
```
Score: 68/100 (C+)
Risk Level: MEDIUM
```

### 2. Category Breakdown
```
Critical Infrastructure: 75/100 (Weight: 30%) → Impact: 22.5
Authentication: 60/100 (Weight: 25%) → Impact: 15.0
Data Protection: 70/100 (Weight: 20%) → Impact: 14.0
Code Quality: 80/100 (Weight: 10%) → Impact: 8.0
AI Security: 85/100 (Weight: 10%) → Impact: 8.5
Compliance: 100/100 (Weight: 5%) → Impact: 5.0
----------------------------------------------------------
Weighted Score: 73/100
Bonuses: -5 (no HTTPS)
Final Score: 68/100
```

### 3. Penalties List
```
- Critical Infrastructure (SSL): Missing HTTPS encryption (-20 pts)
  Rationale: Transport layer encryption protects data in transit

- Authentication (Cookies): Cookie missing Secure flag (-10 pts)
  Rationale: First high finding in authentication category

- Authentication (Cookies): Cookie missing SameSite flag (-4 pts)
  Rationale: Additional medium finding (diminishing returns)
```

### 4. Bonuses List
```
+ Data Protection: No exposed API keys (+10 pts)
  Rationale: Credentials properly secured

+ Critical Infrastructure: DNS security features (+5 pts)
  Rationale: DNSSEC, SPF, DKIM protect against spoofing
```

### 5. Summary Stats
```
Total Findings: 33
├─ Critical: 0
├─ High: 7
├─ Medium: 15
└─ Low: 11

Passed Checks: 2
Failed Checks: 33
```

## Összehasonlítás: v1 vs v2

### Példa scan: 7 high + 15 medium + 11 low

**v1 rendszer:**
- Client risks: 7 high × 25 = 175
- Security headers: 15 medium × 10 = 150
- Cookie security: 11 low × 5 = 55
- **Total penalty**: 380
- **Score**: 100 - 380 = **-280** → capped to **0/100**
- **Result**: F grade, CRITICAL risk

**v2 rendszer:**
- Authentication (7 high): -20 (first) + 6×(-10) = **-80** (capped at -60)
- Data Protection (15 medium): -10 (first) + 14×(-4) = **-66** (capped at -40)
- Compliance (11 low): -3 (first) + 10×(-1) = **-13** (capped at -15)
- **Weighted penalties**: Apply category weights
- **Bonuses**: +10 (no secrets) + +5 (DNS) = **+15**
- **Score**: **~65/100**
- **Result**: C+ grade, MEDIUM risk

**Eredmény**: Realisztikusabb, kontextusba helyezett értékelés!

## Implementáció

### Backend
```typescript
// src/worker/scoring-v2.ts
import { calculateSecurityScore } from './scoring-v2'

const breakdown = calculateSecurityScore(findings, metadata)
// Returns full ScoringBreakdown object
```

### Frontend
```typescript
// src/components/SecurityScoreBreakdown.tsx
<SecurityScoreBreakdown breakdown={scan.scoreBreakdown} />
```

### Database
```typescript
// Add to Scan model
scoreBreakdown: String? // JSON: ScoringBreakdown object
```

## Következő lépések

1. ✅ Scoring v2 algoritmus elkészítése
2. ⏳ Worker integrálás (calculateSecurityScore használata)
3. ⏳ Database mező hozzáadása (scoreBreakdown)
4. ⏳ UI komponens (SecurityScoreBreakdown)
5. ⏳ Tesztelés (5-10 különböző site)
6. ⏳ Dokumentáció frissítése

## Hivatkozások

- [CVSS 3.1 Specification](https://www.first.org/cvss/v3.1/specification-document)
- [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls v8](https://www.cisecurity.org/controls/v8)

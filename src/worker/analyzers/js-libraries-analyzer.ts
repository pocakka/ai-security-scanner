import { CrawlResult } from '../crawler-mock'
import { findCVEsForLibrary, CVE } from './js-library-cve-database'

export interface JSLibrariesResult {
  detected: DetectedLibrary[]
  vulnerable: VulnerableLibrary[]
  findings: LibraryFinding[]
  sriMissing: string[] // Scripts without Subresource Integrity
  score: number // 0-100
}

export interface DetectedLibrary {
  name: string
  version: string | null
  source: string // CDN URL or 'bundled'
  category: 'framework' | 'utility' | 'ui' | 'analytics' | 'other'
}

export interface VulnerableLibrary {
  name: string
  version: string
  cves: CVE[] // Full CVE objects with details
  highestSeverity: 'low' | 'medium' | 'high' | 'critical'
  // Deprecated - keeping for backwards compatibility
  vulnerabilities?: string[]
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface LibraryFinding {
  library: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  issue: string
  description: string
  recommendation: string
}

// Known library patterns with version detection
const LIBRARY_PATTERNS = [
  // Frameworks
  { name: 'React', patterns: ['react@', 'react.', '/react/', 'react.production', 'react.development'], category: 'framework' },
  { name: 'Vue.js', patterns: ['vue@', 'vue.js', 'vue.min.js', '/vue/', 'vue.global'], category: 'framework' },
  { name: 'Angular', patterns: ['angular@', 'angular.js', 'angular.min.js', '@angular/'], category: 'framework' },
  { name: 'Svelte', patterns: ['svelte@', 'svelte.js', '/svelte/'], category: 'framework' },

  // jQuery and plugins
  { name: 'jQuery', patterns: ['jquery@', 'jquery.js', 'jquery.min.js', 'jquery-'], category: 'utility' },
  { name: 'jQuery UI', patterns: ['jquery-ui@', 'jquery-ui.js', 'jquery-ui.min.js'], category: 'ui' },

  // Utility libraries
  { name: 'Lodash', patterns: ['lodash@', 'lodash.js', 'lodash.min.js', '/lodash/'], category: 'utility' },
  { name: 'Moment.js', patterns: ['moment@', 'moment.js', 'moment.min.js', '/moment/'], category: 'utility' },
  { name: 'Axios', patterns: ['axios@', 'axios.js', 'axios.min.js', '/axios/'], category: 'utility' },

  // UI Libraries
  { name: 'Bootstrap', patterns: ['bootstrap@', 'bootstrap.js', 'bootstrap.min.js', '/bootstrap/'], category: 'ui' },
  { name: 'Tailwind CSS', patterns: ['tailwindcss@', 'tailwind.css', '/tailwindcss/'], category: 'ui' },

  // Analytics
  { name: 'Google Analytics', patterns: ['google-analytics', 'gtag/js', 'analytics.js'], category: 'analytics' },
  { name: 'Google Tag Manager', patterns: ['googletagmanager.com/gtm.js'], category: 'analytics' },
  { name: 'Hotjar', patterns: ['hotjar.com', 'static.hotjar.com'], category: 'analytics' },
  { name: 'Mixpanel', patterns: ['mixpanel.com', 'cdn.mxpnl.com'], category: 'analytics' },
]

/**
 * CVE database is now imported from js-library-cve-database.ts
 * This provides 52 CVEs for 15 popular JavaScript libraries with full details
 * including severity, CVSS scores, affected versions, and remediation guidance.
 */

/**
 * Detect JavaScript libraries and check for known CVEs
 */
export function analyzeJSLibraries(crawlResult: CrawlResult): JSLibrariesResult {
  const result: JSLibrariesResult = {
    detected: [],
    vulnerable: [],
    findings: [],
    sriMissing: [],
    score: 100,
  }

  let scoreDeduction = 0
  const detectedSet = new Set<string>() // Avoid duplicates

  // Check scripts for library detection
  for (const script of crawlResult.scripts) {
    for (const libPattern of LIBRARY_PATTERNS) {
      const scriptLower = script.toLowerCase()

      if (libPattern.patterns.some(pattern => scriptLower.includes(pattern))) {
        const key = libPattern.name

        if (!detectedSet.has(key)) {
          detectedSet.add(key)

          const version = extractVersion(script, libPattern.name)

          result.detected.push({
            name: libPattern.name,
            version,
            source: script.startsWith('http') ? script : 'bundled',
            category: libPattern.category as any,
          })

          // ⭐ NEW: Check for CVEs using comprehensive database
          if (version) {
            const cves = findCVEsForLibrary(libPattern.name, version)

            if (cves.length > 0) {
              // Determine highest severity
              const highestSeverity = cves.reduce((highest, cve) => {
                const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
                const currentLevel = severityLevels[cve.severity]
                const highestLevel = severityLevels[highest]
                return currentLevel > highestLevel ? cve.severity : highest
              }, 'low' as 'low' | 'medium' | 'high' | 'critical')

              result.vulnerable.push({
                name: libPattern.name,
                version,
                cves,
                highestSeverity,
                // Backwards compatibility
                vulnerabilities: cves.map(cve => cve.id),
                severity: highestSeverity
              })

              // Add detailed findings for each CVE
              for (const cve of cves) {
                result.findings.push({
                  library: libPattern.name,
                  severity: cve.severity,
                  issue: `${cve.id}: ${cve.title}`,
                  description: `${cve.description}${cve.cvssScore ? ` (CVSS: ${cve.cvssScore})` : ''}${cve.fixedIn ? ` Fixed in version ${cve.fixedIn}.` : ''}`,
                  recommendation: cve.fixedIn
                    ? `Update ${libPattern.name} from ${version} to ${cve.fixedIn} or later. ${cve.references[0] ? `More info: ${cve.references[0]}` : ''}`
                    : `Review ${libPattern.name} security advisory. ${cve.references[0] || ''}`,
                })

                // Score deduction based on severity
                scoreDeduction += cve.severity === 'critical' ? 30 :
                                  cve.severity === 'high' ? 20 :
                                  cve.severity === 'medium' ? 10 : 5
              }
            }
          }
        }
      }
    }

    // Check for CDN scripts without SRI
    if (isCDNScript(script) && !hasSubresourceIntegrity(script, crawlResult.html)) {
      result.sriMissing.push(script)
    }
  }

  // Add finding for missing SRI
  if (result.sriMissing.length > 0) {
    result.findings.push({
      library: 'CDN Scripts',
      severity: 'medium',
      issue: `${result.sriMissing.length} CDN scripts without Subresource Integrity (SRI)`,
      description: 'CDN scripts loaded without integrity checks are vulnerable to supply chain attacks',
      recommendation: 'Add integrity attributes to <script> tags loading from CDNs.',
    })

    scoreDeduction += Math.min(15, result.sriMissing.length * 3)
  }

  // Check for deprecated libraries
  const deprecated = result.detected.filter(lib =>
    lib.name === 'Moment.js' ||
    (lib.name === 'Angular' && lib.version?.startsWith('1.'))
  )

  if (deprecated.length > 0) {
    result.findings.push({
      library: deprecated.map(d => d.name).join(', '),
      severity: 'low',
      issue: 'Deprecated library detected',
      description: `Using deprecated libraries: ${deprecated.map(d => d.name).join(', ')}`,
      recommendation: 'Migrate to actively maintained alternatives (e.g., date-fns instead of Moment.js).',
    })

    scoreDeduction += 5
  }

  result.score = Math.max(0, 100 - scoreDeduction)

  return result
}

/**
 * Extract version number from script URL or content
 */
function extractVersion(script: string, libName: string): string | null {
  // Try to extract from URL patterns like jquery-3.6.0.min.js or jquery@3.6.0
  const versionPatterns = [
    /[\/@-](\d+\.\d+\.\d+)/,  // 3.6.0
    /[\/@-](\d+\.\d+)/,       // 3.6
    /[\/@]v(\d+\.\d+\.\d+)/,  // v3.6.0
  ]

  for (const pattern of versionPatterns) {
    const match = script.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Check if script is loaded from a CDN
 */
function isCDNScript(script: string): boolean {
  const cdnDomains = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'code.jquery.com',
    'ajax.googleapis.com',
    'stackpath.bootstrapcdn.com',
    'maxcdn.bootstrapcdn.com',
  ]

  return cdnDomains.some(cdn => script.includes(cdn))
}

/**
 * Check if script has Subresource Integrity attribute
 */
function hasSubresourceIntegrity(scriptURL: string, html: string): boolean {
  // Look for script tag with this URL and integrity attribute
  const scriptTagPattern = new RegExp(`<script[^>]*src=["']${scriptURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*integrity=["'][^"']+["']`, 'i')
  return scriptTagPattern.test(html)
}

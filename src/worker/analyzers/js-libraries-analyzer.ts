import { CrawlResult } from '../crawler-mock'

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
  vulnerabilities: string[] // CVE IDs or descriptions
  severity: 'low' | 'medium' | 'high' | 'critical'
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

// Known vulnerable versions (simplified - in production, use CVE database API)
const KNOWN_VULNERABILITIES: Record<string, { version: string; cve: string; severity: 'low' | 'medium' | 'high' | 'critical' }[]> = {
  'jQuery': [
    { version: '1.', cve: 'XSS vulnerability in jQuery < 3.0', severity: 'high' },
    { version: '2.', cve: 'XSS vulnerability in jQuery < 3.0', severity: 'high' },
    { version: '3.0', cve: 'Prototype pollution in jQuery 3.0-3.4', severity: 'medium' },
    { version: '3.1', cve: 'Prototype pollution in jQuery 3.0-3.4', severity: 'medium' },
    { version: '3.2', cve: 'Prototype pollution in jQuery 3.0-3.4', severity: 'medium' },
    { version: '3.3', cve: 'Prototype pollution in jQuery 3.0-3.4', severity: 'medium' },
  ],
  'Moment.js': [
    { version: 'any', cve: 'Deprecated - no longer maintained', severity: 'low' },
  ],
  'Angular': [
    { version: '1.', cve: 'AngularJS (1.x) EOL - security issues unfixed', severity: 'high' },
  ],
}

/**
 * Detect JavaScript libraries and check for known vulnerabilities
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

          // Check for vulnerabilities
          if (version && KNOWN_VULNERABILITIES[libPattern.name]) {
            const vulns = KNOWN_VULNERABILITIES[libPattern.name]
            const matchingVuln = vulns.find(v =>
              v.version === 'any' || version.startsWith(v.version)
            )

            if (matchingVuln) {
              result.vulnerable.push({
                name: libPattern.name,
                version,
                vulnerabilities: [matchingVuln.cve],
                severity: matchingVuln.severity,
              })

              result.findings.push({
                library: libPattern.name,
                severity: matchingVuln.severity,
                issue: `Vulnerable version detected: ${version}`,
                description: matchingVuln.cve,
                recommendation: `Update ${libPattern.name} to the latest secure version.`,
              })

              scoreDeduction += matchingVuln.severity === 'critical' ? 30 :
                                matchingVuln.severity === 'high' ? 20 :
                                matchingVuln.severity === 'medium' ? 10 : 5
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

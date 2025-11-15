/**
 * Frontend Framework Security Analyzer
 *
 * Detects frontend frameworks (React, Vue, Angular, Next.js, Svelte, etc.)
 * and identifies development/debug modes that should NOT be enabled in production.
 *
 * CRITICAL Security Checks:
 * - React DevTools detection (development build)
 * - Vue dev mode detection (__VUE_PROD_DEVTOOLS__)
 * - Angular source maps exposure
 * - Next.js development mode indicators
 * - Svelte dev mode detection
 * - Source map exposure (reveals original source code)
 */

export interface FrontendFramework {
  name: string
  detected: boolean
  version?: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  devModeEnabled?: boolean
  hasSourceMaps?: boolean
  securityIssues: SecurityIssue[]
}

export interface SecurityIssue {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
}

export interface FrontendFrameworkResult {
  detectedFrameworks: FrontendFramework[]
  findings: Array<{
    type: string
    category: string
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    impact: string
    recommendation: string
    evidence?: string
  }>
  hasFramework: boolean
  primaryFramework?: string
  hasDevMode: boolean
  hasSourceMaps: boolean
}

interface FrameworkPattern {
  type: 'html' | 'script' | 'header'
  match: RegExp
  confidence: 'low' | 'medium' | 'high'
}

interface FrameworkDefinition {
  name: string
  patterns: FrameworkPattern[]
  versionRegex?: RegExp
  devModeChecks?: Array<{
    name: string
    check: (html: string, scripts?: string[]) => SecurityIssue | null
  }>
}

/**
 * Frontend Framework Detection Patterns
 */
const FRONTEND_FRAMEWORKS: FrameworkDefinition[] = [
  // React
  {
    name: 'React',
    patterns: [
      { type: 'html', match: /data-reactroot|data-reactid/i, confidence: 'high' },
      { type: 'html', match: /__REACT_DEVTOOLS_GLOBAL_HOOK__/i, confidence: 'high' },
      { type: 'script', match: /react\.development\.js|react-dom\.development\.js/i, confidence: 'high' },
      { type: 'html', match: /_app-?[a-f0-9]{8}\.js/i, confidence: 'medium' }, // Next.js pattern
      { type: 'html', match: /react/i, confidence: 'low' },
    ],
    versionRegex: /React version (\d+\.\d+\.\d+)/i,
    devModeChecks: [
      {
        name: 'react_devtools',
        check: (html) => {
          if (/__REACT_DEVTOOLS_GLOBAL_HOOK__/.test(html)) {
            return {
              severity: 'medium',
              title: 'React DevTools Detected',
              description: 'React DevTools global hook is present in production build.',
              impact: 'React DevTools allows inspecting component state, props, and hierarchy. In production, this reveals application architecture, component names, data structures, and internal logic to attackers. It can also expose sensitive data in component state (API keys, user info, business logic).',
              recommendation: 'Use production build of React. Run "npm run build" or set NODE_ENV=production. Production builds remove DevTools hooks, are smaller, and faster. Verify with: if (process.env.NODE_ENV !== "production") in your code.',
              evidence: '__REACT_DEVTOOLS_GLOBAL_HOOK__ found in HTML'
            }
          }
          return null
        }
      },
      {
        name: 'react_development_build',
        check: (html) => {
          if (/react\.development\.js|react-dom\.development\.js/.test(html)) {
            return {
              severity: 'high',
              title: 'React Development Build in Production',
              description: 'Development build of React is deployed to production.',
              impact: 'CRITICAL: Development builds are 3-5x larger and slower than production builds. They include extensive debugging information, verbose error messages with stack traces, and development warnings that expose internal implementation details. Performance is significantly degraded. This reveals React version, component structure, and provides detailed error information to attackers.',
              recommendation: 'IMMEDIATELY replace with production build. Run "npm run build" to create optimized production bundle. Use react.production.min.js instead of react.development.js. Set NODE_ENV=production in your build process. Production builds strip out dev warnings, minify code, and improve performance by 3-5x.',
              evidence: 'react.development.js or react-dom.development.js detected'
            }
          }
          return null
        }
      },
    ]
  },

  // Next.js (React-based framework)
  {
    name: 'Next.js',
    patterns: [
      { type: 'html', match: /__NEXT_DATA__|next-route-announcer/i, confidence: 'high' },
      { type: 'script', match: /_next\/static\/chunks/i, confidence: 'high' },
      { type: 'html', match: /next\.js/i, confidence: 'medium' },
    ],
    versionRegex: /"buildId":"([^"]+)"/i,
    devModeChecks: [
      {
        name: 'nextjs_dev_mode',
        check: (html) => {
          // Next.js dev mode indicators
          if (/__NEXT_DATA__/.test(html)) {
            const nextDataMatch = html.match(/__NEXT_DATA__[^{]*({[^}]*"dev":\s*true[^}]*})/i)
            if (nextDataMatch) {
              return {
                severity: 'high',
                title: 'Next.js Development Mode Enabled',
                description: 'Next.js is running in development mode in production.',
                impact: 'Development mode exposes detailed error messages with stack traces, file paths, and source code snippets. It includes HMR (Hot Module Replacement) which can expose internal application structure. Performance is degraded, bundle sizes are larger, and security warnings are disabled. Error overlay reveals sensitive implementation details.',
                recommendation: 'Deploy with production build. Run "npm run build" followed by "npm start" (NOT "npm run dev"). Set NODE_ENV=production. Next.js production builds enable optimizations, remove dev warnings, and hide sensitive error details. Verify deployment script uses "next build && next start".',
                evidence: '__NEXT_DATA__ contains "dev": true'
              }
            }
          }

          // Check for Next.js development server indicators
          if (/localhost:3000|127\.0\.0\.1:3000/.test(html)) {
            return {
              severity: 'critical',
              title: 'Next.js Development Server in Production',
              description: 'Next.js development server (localhost:3000) references found.',
              impact: 'CRITICAL: The application may be running the Next.js development server instead of production build. Development server is NOT suitable for production - it has no security hardening, serves unoptimized code, exposes source maps, and has no protection against attacks. This indicates a serious deployment misconfiguration.',
              recommendation: 'IMMEDIATELY stop using "npm run dev" in production. Use proper production deployment: 1) Run "npm run build", 2) Run "npm start" or use a production-grade hosting (Vercel, AWS, Docker). Development server should NEVER be exposed to the internet.',
              evidence: 'localhost:3000 or 127.0.0.1:3000 references found'
            }
          }
          return null
        }
      },
    ]
  },

  // Vue.js
  {
    name: 'Vue.js',
    patterns: [
      { type: 'html', match: /data-v-[a-f0-9]{8}|v-cloak/i, confidence: 'high' },
      { type: 'html', match: /__VUE__|vue\.esm-browser\.js/i, confidence: 'high' },
      { type: 'script', match: /vue\.js|vue\.runtime\.js/i, confidence: 'medium' },
      { type: 'html', match: /vue/i, confidence: 'low' },
    ],
    versionRegex: /Vue\.version.*?"(\d+\.\d+\.\d+)"/i,
    devModeChecks: [
      {
        name: 'vue_devtools',
        check: (html) => {
          if (/__VUE_PROD_DEVTOOLS__\s*=\s*true/.test(html)) {
            return {
              severity: 'medium',
              title: 'Vue DevTools Enabled in Production',
              description: 'Vue production devtools are explicitly enabled.',
              impact: 'Vue DevTools allows inspecting component data, Vuex store state, emitted events, and component hierarchy. In production, this exposes sensitive application state, API responses stored in Vuex, user data in components, and internal event flow. Attackers can monitor data flow and extract sensitive information.',
              recommendation: 'Disable production devtools by removing "__VUE_PROD_DEVTOOLS__ = true" from your code. Production builds should NOT enable devtools. Use process.env.NODE_ENV checks to ensure devtools are only enabled in development. Set "productionTip: false" in Vue config.',
              evidence: '__VUE_PROD_DEVTOOLS__ = true found'
            }
          }

          if (/vue\.js[^"']*\.js/.test(html) && !/vue\.min\.js|vue\.runtime\.min\.js/.test(html)) {
            return {
              severity: 'medium',
              title: 'Vue.js Development Build in Production',
              description: 'Non-minified Vue.js build detected in production.',
              impact: 'Development builds include verbose warnings, development-only error messages, and are significantly larger. They expose Vue version, provide detailed error traces, and include helpful but sensitive debugging information. Performance is slower due to additional runtime checks.',
              recommendation: 'Use production build (vue.min.js or vue.runtime.min.js). Run build process with NODE_ENV=production. Vue CLI automatically creates production builds with "npm run build". Production builds strip warnings, minify code, and improve performance.',
              evidence: 'vue.js detected (not minified)'
            }
          }
          return null
        }
      },
    ]
  },

  // Angular
  {
    name: 'Angular',
    patterns: [
      { type: 'html', match: /ng-version|_nghost-|_ngcontent-/i, confidence: 'high' },
      { type: 'html', match: /angular|@angular\/core/i, confidence: 'medium' },
      { type: 'script', match: /angular\.js|@angular/i, confidence: 'medium' },
    ],
    versionRegex: /ng-version="(\d+\.\d+\.\d+)"/i,
    devModeChecks: [
      {
        name: 'angular_source_maps',
        check: (html) => {
          // Check for .map file references
          if (/\.js\.map|sourceMappingURL=/.test(html)) {
            return {
              severity: 'high',
              title: 'Angular Source Maps Exposed',
              description: 'Source map files (.js.map) are exposed in production.',
              impact: 'HIGH: Source maps reveal your ENTIRE original TypeScript source code, including comments, variable names, file structure, business logic, and internal APIs. Attackers can reverse-engineer your application, find vulnerabilities in source code, understand authentication flows, and discover API endpoints. This completely defeats code obfuscation.',
              recommendation: 'DISABLE source maps in production Angular builds. In angular.json, set "sourceMap": false for production configuration. If you need source maps for error tracking (Sentry, etc.), use private source map upload instead of public exposure. Run "ng build --prod" which disables source maps by default.',
              evidence: '.js.map or sourceMappingURL detected'
            }
          }
          return null
        }
      },
      {
        name: 'angular_dev_mode',
        check: (html) => {
          // Angular development mode indicators
          if (/enableDebugTools|enableProdMode\(\)\s*\/\//.test(html)) {
            return {
              severity: 'medium',
              title: 'Angular Development Mode Indicators',
              description: 'Angular development mode code detected in production.',
              impact: 'Development mode includes Angular DevTools, detailed error messages, change detection profiling, and performance debugging. This exposes component structure, data binding patterns, and internal state management. It also degrades performance due to extra runtime checks.',
              recommendation: 'Ensure enableProdMode() is called in main.ts. Build with "ng build --prod" which automatically enables production mode, disables debugging tools, and optimizes bundle size. Verify that angular.json production configuration is correctly set.',
              evidence: 'enableDebugTools or commented enableProdMode() found'
            }
          }
          return null
        }
      },
    ]
  },

  // Svelte
  {
    name: 'Svelte',
    patterns: [
      { type: 'html', match: /svelte-[a-z0-9]+|class="svelte-/i, confidence: 'high' },
      { type: 'script', match: /svelte/i, confidence: 'medium' },
    ],
    versionRegex: /Svelte v(\d+\.\d+\.\d+)/i,
    devModeChecks: [
      {
        name: 'svelte_dev_mode',
        check: (html) => {
          if (/svelte\/internal/.test(html) && /dev:\s*true/.test(html)) {
            return {
              severity: 'medium',
              title: 'Svelte Development Mode Enabled',
              description: 'Svelte is compiled with development mode enabled.',
              impact: 'Development builds include runtime checks, warnings, and debugging helpers that expose component logic and internal state. Bundle size is larger, performance is slower due to validation checks, and error messages reveal implementation details.',
              recommendation: 'Build with production mode. Set "dev: false" in Svelte compiler options or use proper build tool configuration (Vite, Rollup, webpack). Production builds remove runtime checks, optimize bundle size, and improve performance.',
              evidence: 'svelte/internal with dev: true detected'
            }
          }
          return null
        }
      },
    ]
  },

  // Nuxt.js (Vue-based framework)
  {
    name: 'Nuxt.js',
    patterns: [
      { type: 'html', match: /__NUXT__|nuxt-link/i, confidence: 'high' },
      { type: 'script', match: /_nuxt\//i, confidence: 'high' },
    ],
    versionRegex: /Nuxt\.js v(\d+\.\d+\.\d+)/i,
    devModeChecks: [
      {
        name: 'nuxt_dev_mode',
        check: (html) => {
          if (/__NUXT__/.test(html) && /dev:\s*true/.test(html)) {
            return {
              severity: 'high',
              title: 'Nuxt.js Development Mode Enabled',
              description: 'Nuxt.js is running in development mode.',
              impact: 'Development mode exposes detailed error pages with stack traces, enables Vue DevTools, includes HMR (Hot Module Replacement), and serves unoptimized bundles. Source maps are enabled revealing full source code. Performance is degraded and security warnings are disabled.',
              recommendation: 'Deploy with production build. Run "npm run build" followed by "npm start". Set NODE_ENV=production. Nuxt production builds enable SSR optimizations, remove dev tools, minify code, and hide error details. Never use "npm run dev" in production.',
              evidence: '__NUXT__ with dev: true detected'
            }
          }
          return null
        }
      },
    ]
  },

  // Ember.js
  {
    name: 'Ember.js',
    patterns: [
      { type: 'html', match: /ember-application|data-ember-/i, confidence: 'high' },
      { type: 'script', match: /ember\.js|ember\.debug\.js/i, confidence: 'high' },
    ],
    versionRegex: /Ember\.VERSION.*?(\d+\.\d+\.\d+)/i,
    devModeChecks: [
      {
        name: 'ember_debug_build',
        check: (html) => {
          if (/ember\.debug\.js/.test(html)) {
            return {
              severity: 'medium',
              title: 'Ember.js Debug Build in Production',
              description: 'Ember debug build (ember.debug.js) is being used in production.',
              impact: 'Debug builds include Ember Inspector support, verbose deprecation warnings, and extensive runtime assertions. This exposes application structure, routing configuration, and internal state. Bundle size is larger and performance is slower.',
              recommendation: 'Use production build (ember.prod.js or ember.min.js). Build with "ember build --environment=production". Production builds strip debug code, disable Ember Inspector, and optimize performance.',
              evidence: 'ember.debug.js detected'
            }
          }
          return null
        }
      },
    ]
  },
]

/**
 * Analyze frontend frameworks and detect development/debug modes
 */
export async function analyzeFrontendFramework(
  html: string,
  scripts: string[] = []
): Promise<FrontendFrameworkResult> {
  const detectedFrameworks: FrontendFramework[] = []
  const findings: FrontendFrameworkResult['findings'] = []

  let hasDevMode = false
  let hasSourceMaps = false

  // Check each framework
  for (const framework of FRONTEND_FRAMEWORKS) {
    const evidence: string[] = []
    let detected = false
    let confidence: 'low' | 'medium' | 'high' = 'low'
    let version: string | undefined
    let devModeEnabled = false
    const securityIssues: SecurityIssue[] = []

    // Check patterns in HTML
    for (const pattern of framework.patterns) {
      let matchFound = false

      if (pattern.type === 'html') {
        if (pattern.match.test(html)) {
          evidence.push(`HTML pattern: ${pattern.match.source}`)
          detected = true
          matchFound = true
          if (pattern.confidence === 'high') confidence = 'high'
          else if (pattern.confidence === 'medium' && confidence !== 'high') confidence = 'medium'
        }
      } else if (pattern.type === 'script') {
        for (const script of scripts) {
          if (pattern.match.test(script)) {
            evidence.push(`Script: ${script}`)
            detected = true
            matchFound = true
            if (pattern.confidence === 'high') confidence = 'high'
            else if (pattern.confidence === 'medium' && confidence !== 'high') confidence = 'medium'
            break
          }
        }
      }

      // Extract version if pattern matched
      if (matchFound && framework.versionRegex && !version) {
        const versionMatch = html.match(framework.versionRegex)
        if (versionMatch && versionMatch[1]) {
          version = versionMatch[1]
          evidence.push(`Version: ${version}`)
        }
      }
    }

    // Run security checks if framework detected
    if (detected && framework.devModeChecks) {
      for (const devCheck of framework.devModeChecks) {
        const issue = devCheck.check(html, scripts)
        if (issue) {
          devModeEnabled = true
          hasDevMode = true
          securityIssues.push(issue)

          findings.push({
            type: `frontend-framework-${devCheck.name}`,
            category: 'frontend-framework',
            ...issue
          })
        }
      }
    }

    if (detected) {
      detectedFrameworks.push({
        name: framework.name,
        detected: true,
        version,
        confidence,
        evidence,
        devModeEnabled,
        hasSourceMaps: /\.js\.map|sourceMappingURL/.test(html),
        securityIssues
      })

      if (/\.js\.map|sourceMappingURL/.test(html)) {
        hasSourceMaps = true
      }
    }
  }

  // Global source map check (applies to all frameworks)
  if (hasSourceMaps && findings.every(f => f.type !== 'frontend-framework-angular_source_maps')) {
    findings.push({
      type: 'frontend-framework-source-maps',
      category: 'frontend-framework',
      severity: 'high',
      title: 'Source Maps Exposed',
      description: 'JavaScript source map files (.js.map) are publicly accessible.',
      impact: 'HIGH: Source maps reveal your original source code including TypeScript/ES6 code, comments, variable names, file structure, and business logic. Attackers can reverse-engineer your entire application, discover vulnerabilities, understand authentication mechanisms, and find hidden API endpoints. This completely negates code minification and obfuscation.',
      recommendation: 'REMOVE source maps from production builds. Configure your build tool (webpack, Vite, Rollup) to disable source maps for production. If source maps are needed for error tracking services (Sentry, Bugsnag), upload them privately to the service instead of serving them publicly. Check build configuration files (webpack.config.js, vite.config.js) and set "devtool: false" or "sourcemap: false".',
      evidence: 'sourceMappingURL or .js.map references found in HTML/scripts'
    })
  }

  return {
    detectedFrameworks,
    findings,
    hasFramework: detectedFrameworks.length > 0,
    primaryFramework: detectedFrameworks[0]?.name,
    hasDevMode,
    hasSourceMaps
  }
}

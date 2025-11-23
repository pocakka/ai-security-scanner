import { CrawlResult } from '../crawler-mock'

export interface ReconnaissanceFinding {
  type: 'information-disclosure' | 'critical-exposure' | 'reconnaissance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  evidence?: string | string[]
  impact?: string
  recommendation: string
  metadata?: {
    paths?: string[]
    urlCount?: number
    endpoints?: string[]
  }
}

export interface ReconnaissanceResult {
  findings: ReconnaissanceFinding[]
  score: number // 0-100, higher is better (less exposed)
  summary: {
    criticalExposures: number
    informationDisclosures: number
    totalFindings: number
  }
}

/**
 * Analyzes reconnaissance and information disclosure vulnerabilities
 * Checks for exposed files, directories, and sensitive information
 */
export async function analyzeReconnaissance(crawlResult: CrawlResult): Promise<ReconnaissanceResult> {
  const findings: ReconnaissanceFinding[] = []
  const baseUrl = new URL(crawlResult.url)

  // 1. Check robots.txt
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href
    const robotsResponse = await fetch(robotsUrl)

    if (robotsResponse.ok) {
      const content = await robotsResponse.text()

      // Parse Disallow entries
      const disallowMatches = content.match(/Disallow:\s*(.+)/gi) || []
      const disallowedPaths = disallowMatches.map(match =>
        match.replace(/Disallow:\s*/i, '').trim()
      ).filter(path => path && path !== '/')

      // Check for sensitive paths (Nov 16, 2025: More specific patterns to reduce FPs)
      // Require path to START with sensitive pattern or be exact match
      const sensitivePaths = [
        '/admin',      // Admin panels
        '/backup',     // Backup files
        '/config',     // Configuration
        '/staging',    // Staging environment
        '/private',    // Private directories
        '/.env',       // Environment files (CRITICAL)
        '/.git',       // Git repository (CRITICAL)
        '/db',         // Database dumps
        '/sql',        // SQL files
      ]

      // More specific check - path must START with sensitive pattern
      const exposedSensitive = disallowedPaths.filter(path => {
        const lowerPath = path.toLowerCase()
        return sensitivePaths.some(sensitive =>
          lowerPath.startsWith(sensitive) || lowerPath === sensitive
        )
      })

      // ❌ REMOVED /api/ - too many public APIs (GitHub, Stripe, etc.)
      // ❌ REMOVED /test/ - common in public test endpoints
      // ❌ REMOVED /dev/ - common in developer documentation

      if (disallowedPaths.length > 0) {
        findings.push({
          type: 'information-disclosure',
          severity: exposedSensitive.length > 0 ? 'medium' : 'low',
          title: 'robots.txt exposes site structure',
          description: `Found ${disallowedPaths.length} disallowed paths${exposedSensitive.length > 0 ? ' including sensitive directories' : ''}`,
          evidence: exposedSensitive.length > 0 ? exposedSensitive : disallowedPaths.slice(0, 5),
          impact: 'Attackers can discover hidden paths and functionality',
          recommendation: 'Review robots.txt entries and avoid listing sensitive paths. Use authentication instead of robots.txt for access control.',
          metadata: {
            paths: disallowedPaths,
            endpoints: exposedSensitive
          }
        })
      }
    }
  } catch (error) {
    // robots.txt not found or error - this is actually good
    console.log('[Reconnaissance] robots.txt not accessible')
  }

  // 2. Check sitemap.xml
  try {
    const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap.xml.gz']

    for (const path of sitemapPaths) {
      const sitemapUrl = new URL(path, baseUrl).href
      const response = await fetch(sitemapUrl)

      if (response.ok) {
        const content = await response.text()
        const urls = content.match(/<loc>(.+?)<\/loc>/gi) || []

        // Check for sensitive URLs in sitemap (Nov 16, 2025: More specific patterns)
        // Only flag TRULY sensitive paths, not public APIs
        const sensitiveUrls = urls.filter(url => {
          const lower = url.toLowerCase()
          // Must START with sensitive path or contain specific patterns
          return lower.includes('/admin/') ||   // Admin panels (with trailing slash)
                 lower.includes('/backup/') ||  // Backup directories
                 lower.includes('/staging/') || // Staging environment
                 lower.includes('/private/') || // Private content
                 lower.includes('/.env') ||     // Environment files
                 lower.includes('/.git')        // Git repository
          // ❌ REMOVED /api/ - too many false positives (public APIs)
          // ❌ REMOVED /test/ - common in public test endpoints
          // ❌ REMOVED /dev/ - common in developer docs
        })

        if (urls.length > 0) {
          findings.push({
            type: 'information-disclosure',
            severity: sensitiveUrls.length > 0 ? 'medium' : 'low',
            title: 'Sitemap exposes site structure',
            description: `Sitemap contains ${urls.length} URLs${sensitiveUrls.length > 0 ? ' including sensitive endpoints' : ''}`,
            evidence: sensitiveUrls.length > 0 ? sensitiveUrls.slice(0, 3) : [`${urls.length} URLs indexed`],
            impact: 'Complete site structure is enumerable',
            recommendation: 'Review sitemap contents and exclude sensitive or administrative URLs',
            metadata: {
              urlCount: urls.length,
              endpoints: sensitiveUrls
            }
          })
        }
        break // Found a sitemap, no need to check others
      }
    }
  } catch (error) {
    console.log('[Reconnaissance] Sitemap not accessible')
  }

  // 3. Check for .git folder exposure
  try {
    const gitPaths = ['/.git/HEAD', '/.git/config', '/.git/index']

    for (const path of gitPaths) {
      const gitUrl = new URL(path, baseUrl).href
      const response = await fetch(gitUrl, {
        method: 'HEAD',
        redirect: 'manual' // Don't follow redirects
      })

      // ✅ ONLY 200 OK = real vulnerability (file is ACCESSIBLE)
      // ❌ 403 Forbidden = GOOD! Server is blocking access (not a vulnerability)
      // ❌ 404 Not Found = GOOD! File doesn't exist
      // ❌ 301/302 Redirect = Not conclusive (may redirect to 404 or homepage)
      if (response.ok) {  // Only 200-299 status codes
        findings.push({
          type: 'critical-exposure',
          severity: 'critical',
          title: 'Git repository exposed',
          description: 'Git repository files are accessible, potentially exposing source code and history',
          evidence: gitUrl,
          impact: 'Complete source code disclosure including credentials, API keys, and development history',
          recommendation: 'Immediately block access to .git folder in web server configuration. Add: "location ~ /\\.git { deny all; }" to nginx or "RedirectMatch 404 /\\.git" to Apache config',
          metadata: {
            paths: [path]
          }
        })
        break // One confirmation is enough
      }
    }
  } catch (error) {
    console.log('[Reconnaissance] .git folder not accessible (good)')
  }

  // 4. Check for .env file exposure
  try {
    const envPaths = ['/.env', '/.env.local', '/.env.production', '/config/.env', '/.env.example']

    for (const path of envPaths) {
      const envUrl = new URL(path, baseUrl).href
      const response = await fetch(envUrl, {
        method: 'HEAD',
        redirect: 'manual'
      })

      if (response.ok) {
        findings.push({
          type: 'critical-exposure',
          severity: 'critical',
          title: 'Environment variables file exposed',
          description: '.env file is publicly accessible, likely containing sensitive configuration',
          evidence: envUrl,
          impact: 'API keys, database credentials, and other secrets may be exposed',
          recommendation: 'Immediately remove .env files from public directory and add to .gitignore. Block access in web server config.',
          metadata: {
            paths: [path]
          }
        })
        break
      }
    }
  } catch (error) {
    console.log('[Reconnaissance] .env files not accessible (good)')
  }

  // 5. Check for backup files
  try {
    const backupExtensions = ['.bak', '.old', '.backup', '~', '.save', '.orig', '.copy']
    const commonFiles = ['index', 'config', 'database', 'settings', 'wp-config', 'configuration']
    const backupPaths = ['backup/', 'backups/', 'old/', 'temp/', '_backup/', 'archive/']

    // Check common backup files
    for (const file of commonFiles) {
      for (const ext of backupExtensions) {
        const backupUrl = new URL(`/${file}${ext}`, baseUrl).href
        const response = await fetch(backupUrl, {
          method: 'HEAD',
          redirect: 'manual'
        })

        if (response.ok) {
          findings.push({
            type: 'critical-exposure',
            severity: 'high',
            title: 'Backup file accessible',
            description: `Backup file ${file}${ext} is publicly accessible`,
            evidence: backupUrl,
            impact: 'May contain sensitive configuration, passwords, or source code',
            recommendation: 'Remove all backup files from web root. Use proper backup storage outside of public directories.',
            metadata: {
              paths: [`/${file}${ext}`]
            }
          })
          break // One backup file is enough evidence
        }
      }
    }

    // Check for backup directories
    for (const dir of backupPaths) {
      const backupUrl = new URL(dir, baseUrl).href
      const response = await fetch(backupUrl, {
        method: 'HEAD',
        redirect: 'manual'
      })

      // ✅ ONLY 200 OK = real vulnerability (directory is ACCESSIBLE)
      // ❌ 403 Forbidden = GOOD! Server is blocking access
      if (response.ok) {
        findings.push({
          type: 'information-disclosure',
          severity: 'medium',
          title: 'Backup directory exposed',
          description: `Backup directory ${dir} exists and may be accessible`,
          evidence: backupUrl,
          impact: 'Backup files may be enumerable or accessible',
          recommendation: 'Remove backup directories from web root or properly restrict access',
          metadata: {
            paths: [dir]
          }
        })
        break
      }
    }

    // Check for SQL dumps
    const sqlDumps = ['backup.sql', 'db.sql', 'dump.sql', 'database.sql', 'mysql.sql', 'data.sql']
    for (const dump of sqlDumps) {
      const dumpUrl = new URL(`/${dump}`, baseUrl).href
      const response = await fetch(dumpUrl, {
        method: 'HEAD',
        redirect: 'manual'
      })

      if (response.ok) {
        findings.push({
          type: 'critical-exposure',
          severity: 'critical',
          title: 'Database dump exposed',
          description: `SQL dump file ${dump} is publicly accessible`,
          evidence: dumpUrl,
          impact: 'Complete database including user credentials may be exposed',
          recommendation: 'IMMEDIATELY remove SQL dumps from web root. This is a critical security issue.',
          metadata: {
            paths: [`/${dump}`]
          }
        })
        break
      }
    }
  } catch (error) {
    console.log('[Reconnaissance] Backup files check completed')
  }

  // 6. Check for package.json exposure
  try {
    const packageUrl = new URL('/package.json', baseUrl).href
    const response = await fetch(packageUrl)

    if (response.ok) {
      const content = await response.json()
      const depCount = Object.keys(content.dependencies || {}).length
      const devDepCount = Object.keys(content.devDependencies || {}).length

      findings.push({
        type: 'information-disclosure',
        severity: 'low',
        title: 'package.json exposed',
        description: `Node.js package.json file is accessible, exposing ${depCount} dependencies and ${devDepCount} dev dependencies`,
        evidence: packageUrl,
        impact: 'Dependency versions visible, enabling targeted supply chain attacks',
        recommendation: 'Block access to package.json in production environments',
        metadata: {
          paths: ['/package.json']
        }
      })
    }
  } catch (error) {
    console.log('[Reconnaissance] package.json not accessible')
  }

  // 7. Check for composer.json (PHP)
  try {
    const composerUrl = new URL('/composer.json', baseUrl).href
    const response = await fetch(composerUrl)

    if (response.ok) {
      const content = await response.json()
      const packages = Object.keys(content.require || {}).length

      findings.push({
        type: 'information-disclosure',
        severity: 'low',
        title: 'composer.json exposed',
        description: `PHP composer.json file is accessible, exposing ${packages} package dependencies`,
        evidence: composerUrl,
        impact: 'PHP framework and library versions visible for targeted attacks',
        recommendation: 'Block access to composer.json in production',
        metadata: {
          paths: ['/composer.json']
        }
      })
    }
  } catch (error) {
    console.log('[Reconnaissance] composer.json not accessible')
  }

  // 8. Check for IDE files
  try {
    const idePaths = [
      '/.idea/',
      '/.vscode/',
      '/.vs/',
      '/project.xml',
      '/workspace.xml',
      '/.project',
      '/.classpath',
      '/.settings/'
    ]

    for (const path of idePaths) {
      const ideUrl = new URL(path, baseUrl).href
      const response = await fetch(ideUrl, {
        method: 'HEAD',
        redirect: 'manual'
      })

      // ✅ ONLY 200 OK = real vulnerability (IDE files are ACCESSIBLE)
      // ❌ 403 Forbidden = GOOD! Server is blocking access
      if (response.ok) {
        findings.push({
          type: 'information-disclosure',
          severity: 'low',
          title: 'IDE configuration files exposed',
          description: `IDE files/folders found at ${path}`,
          evidence: ideUrl,
          impact: 'Project structure, settings, and development environment details visible',
          recommendation: 'Add IDE directories to .gitignore and block access in web server',
          metadata: {
            paths: [path]
          }
        })
        break
      }
    }
  } catch (error) {
    console.log('[Reconnaissance] IDE files check completed')
  }

  // 9. Check for source map files
  // Note: We check if .map files are accessible by trying common patterns
  if (crawlResult.scripts && crawlResult.scripts.length > 0) {
    const sourceMapFindings: string[] = []

    // Check if .map files exist for the scripts
    for (const scriptUrl of crawlResult.scripts.slice(0, 5)) { // Check first 5 scripts only
      try {
        // Try to access the .map file
        const mapUrl = scriptUrl + '.map'
        const response = await fetch(mapUrl, {
          method: 'HEAD',
          redirect: 'manual'
        })

        if (response.ok) {
          sourceMapFindings.push(mapUrl)
        }
      } catch (error) {
        // Map file not accessible - good
      }
    }

    if (sourceMapFindings.length > 0) {
      findings.push({
        type: 'information-disclosure',
        severity: 'medium',
        title: 'Source maps expose original code',
        description: `Found ${sourceMapFindings.length} accessible JavaScript source maps that expose original TypeScript/JSX code`,
        evidence: sourceMapFindings.slice(0, 3),
        impact: 'Original source code including comments and development details are visible',
        recommendation: 'Disable source map generation for production builds or block access to .map files',
        metadata: {
          paths: sourceMapFindings
        }
      })
    }
  }

  // 10. Check for humans.txt
  try {
    const humansUrl = new URL('/humans.txt', baseUrl).href
    const response = await fetch(humansUrl)

    if (response.ok) {
      const content = await response.text()

      // Extract email addresses
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
      const emails = content.match(emailRegex) || []

      // Extract names (lines with "Team:" or names followed by contact info)
      const nameMatches = content.match(/(?:Team:|Name:|Developer:|Designer:)\s*(.+)/gi) || []

      findings.push({
        type: 'information-disclosure',
        severity: 'low',
        title: 'humans.txt found',
        description: `Developer information file found with ${emails.length} email addresses`,
        evidence: emails.length > 0 ? emails.slice(0, 3) : ['humans.txt exists'],
        impact: 'Developer contact information and team structure exposed',
        recommendation: 'Consider if this information should be public. Remove sensitive contact details.',
        metadata: {
          paths: ['/humans.txt'],
          endpoints: emails
        }
      })
    }
  } catch (error) {
    console.log('[Reconnaissance] humans.txt not accessible')
  }

  // Calculate score (100 = no issues, 0 = critical issues)
  let score = 100
  const summary = {
    criticalExposures: 0,
    informationDisclosures: 0,
    totalFindings: findings.length
  }

  findings.forEach(finding => {
    switch (finding.severity) {
      case 'critical':
        score -= 40
        summary.criticalExposures++
        break
      case 'high':
        score -= 25
        break
      case 'medium':
        score -= 15
        summary.informationDisclosures++
        break
      case 'low':
        score -= 5
        summary.informationDisclosures++
        break
    }
  })

  score = Math.max(0, score)

  return {
    findings,
    score,
    summary
  }
}
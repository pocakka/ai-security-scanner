/**
 * Web Server Security Analyzer
 *
 * Detects web servers (Nginx, Apache, IIS, LiteSpeed, Caddy) and analyzes:
 * - Version disclosure
 * - Outdated versions (CVE mapping potential)
 * - Module/OS information disclosure (Apache)
 * - Security misconfigurations
 *
 * @category web-server
 */

interface SecurityIssue {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  recommendation: string
  evidence?: string
}

interface WebServer {
  name: string
  detected: boolean
  version?: string
  modules?: string[]
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  securityIssues: SecurityIssue[]
}

export interface WebServerResult {
  detectedServers: WebServer[]
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
  hasServer: boolean
  primaryServer?: string
}

interface DetectionPattern {
  type: 'header'
  match: RegExp
  confidence: 'low' | 'medium' | 'high'
}

interface SecurityCheck {
  name: string
  check: (version?: string, serverHeader?: string, modules?: string[]) => SecurityIssue | null
}

interface ServerDefinition {
  name: string
  patterns: DetectionPattern[]
  versionRegex?: RegExp
  modulesRegex?: RegExp
  securityChecks: SecurityCheck[]
}

const WEB_SERVERS: ServerDefinition[] = [
  // ==================== Nginx ====================
  {
    name: 'Nginx',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*nginx/i,
        confidence: 'high',
      },
    ],
    versionRegex: /nginx\/(\d+\.\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'nginx_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low',
              title: 'Nginx Version Disclosure',
              description: `Nginx version ${version} is exposed in Server header.`,
              impact: 'Server version disclosure helps attackers identify specific vulnerabilities (CVEs) for this Nginx version. This information aids in reconnaissance and targeted attacks.',
              recommendation: 'Hide Nginx version by adding "server_tokens off;" in nginx.conf http block. This will display only "nginx" without version number.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
      {
        name: 'nginx_outdated',
        check: (version?: string) => {
          if (!version) return null
          const [major, minor] = version.split('.').map(Number)
          // Nginx < 1.20 is outdated (as of 2025)
          if (major < 1 || (major === 1 && minor < 20)) {
            return {
              severity: 'high',
              title: 'Outdated Nginx Version',
              description: `Nginx ${version} is outdated and may contain known vulnerabilities.`,
              impact: 'Outdated Nginx versions have known CVEs that attackers can exploit. Security patches are not available for old versions. Known vulnerabilities include request smuggling, buffer overflows, and DoS attacks.',
              recommendation: `Upgrade to Nginx 1.24+ (stable) or 1.25+ (mainline). Review changelog for breaking changes. Test in staging before production deployment.`,
              evidence: version,
            }
          }
          // Nginx 1.20-1.23 - recommend upgrade
          if (major === 1 && minor >= 20 && minor < 24) {
            return {
              severity: 'medium',
              title: 'Nginx Version Should Be Updated',
              description: `Nginx ${version} should be updated to the latest stable version.`,
              impact: 'While still receiving security updates, newer Nginx versions include performance improvements and additional security features.',
              recommendation: `Consider upgrading to Nginx 1.24+ for latest security patches and features.`,
              evidence: version,
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Apache ====================
  {
    name: 'Apache',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*Apache/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Apache\/(\d+\.\d+\.?\d*)/i,
    modulesRegex: /\(([^)]+)\)/g, // Extract modules from "Apache/2.4.41 (Ubuntu) OpenSSL/1.1.1"
    securityChecks: [
      {
        name: 'apache_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low',
              title: 'Apache Version Disclosure',
              description: `Apache version ${version} is exposed in Server header.`,
              impact: 'Apache version disclosure enables attackers to search for version-specific CVEs and known exploits.',
              recommendation: 'Hide Apache version by setting "ServerTokens Prod" and "ServerSignature Off" in apache2.conf or httpd.conf. This will display only "Apache" without version.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
      {
        name: 'apache_module_disclosure',
        check: (version?: string, serverHeader?: string, modules?: string[]) => {
          if (modules && modules.length > 0) {
            return {
              severity: 'medium',
              title: 'Apache Modules Disclosed',
              description: `Apache modules/OS information is exposed: ${modules.join(', ')}`,
              impact: 'Module and OS disclosure reveals the attack surface. Attackers can identify vulnerable modules (e.g., mod_php, OpenSSL versions) and target specific exploits.',
              recommendation: 'Set "ServerTokens Prod" to hide module information. Review exposed modules for known vulnerabilities.',
              evidence: modules.join(', '),
            }
          }
          return null
        },
      },
      {
        name: 'apache_outdated',
        check: (version?: string) => {
          if (!version) return null
          const [major, minor] = version.split('.').map(Number)
          // Apache < 2.4 is very outdated
          if (major < 2 || (major === 2 && minor < 4)) {
            return {
              severity: 'high',
              title: 'Severely Outdated Apache Version',
              description: `Apache ${version} is severely outdated (Apache 2.4 released in 2012).`,
              impact: 'Apache 2.2 and older contain numerous known CVEs and are no longer supported. Critical vulnerabilities include remote code execution, privilege escalation, and DoS.',
              recommendation: `Upgrade to Apache 2.4.58+ immediately. Review migration guide at https://httpd.apache.org/docs/2.4/upgrading.html`,
              evidence: version,
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== IIS ====================
  {
    name: 'IIS',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*Microsoft-IIS/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Microsoft-IIS\/(\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'iis_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'medium',
              title: 'IIS Version Disclosure',
              description: `Microsoft IIS version ${version} is exposed in Server header.`,
              impact: 'IIS version disclosure reveals the Windows Server version and enables targeted attacks against known IIS vulnerabilities.',
              recommendation: 'Remove Server header using URL Rewrite module or custom HTTP headers. Add <requestFiltering removeServerHeader="true" /> in web.config.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== LiteSpeed ====================
  {
    name: 'LiteSpeed',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*LiteSpeed/i,
        confidence: 'high',
      },
    ],
    versionRegex: /LiteSpeed\/(\d+\.\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'litespeed_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low',
              title: 'LiteSpeed Version Disclosure',
              description: `LiteSpeed version ${version} is exposed.`,
              impact: 'Version disclosure helps attackers identify vulnerabilities specific to this LiteSpeed version.',
              recommendation: 'Hide server signature in LiteSpeed Web Admin Console: Server > General > Server Signature > Hide.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
    ],
  },

  // ==================== Caddy ====================
  {
    name: 'Caddy',
    patterns: [
      {
        type: 'header',
        match: /Server:\s*Caddy/i,
        confidence: 'high',
      },
    ],
    versionRegex: /Caddy\/v?(\d+\.\d+\.?\d*)/i,
    securityChecks: [
      {
        name: 'caddy_version_disclosure',
        check: (version?: string, serverHeader?: string) => {
          if (version) {
            return {
              severity: 'low',
              title: 'Caddy Version Disclosure',
              description: `Caddy version ${version} is exposed.`,
              impact: 'Version disclosure aids in identifying known vulnerabilities.',
              recommendation: 'Hide server header in Caddyfile: "header / { -Server }" or disable server tokens.',
              evidence: serverHeader,
            }
          }
          return null
        },
      },
    ],
  },
]

export async function analyzeWebServer(
  headers: Record<string, string>
): Promise<WebServerResult> {
  const detectedServers: WebServer[] = []
  const findings: WebServerResult['findings'] = []

  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(key => {
    normalizedHeaders[key.toLowerCase()] = headers[key]
  })

  const serverHeader = normalizedHeaders['server'] || ''

  for (const server of WEB_SERVERS) {
    const evidence: string[] = []
    let detected = false
    let confidence: 'low' | 'medium' | 'high' = 'low'
    let version: string | undefined
    let modules: string[] = []

    // Check patterns
    for (const pattern of server.patterns) {
      if (pattern.type === 'header' && pattern.match.test(serverHeader)) {
        evidence.push(`Server header: ${serverHeader}`)
        detected = true
        confidence = pattern.confidence
      }
    }

    if (detected) {
      // Extract version
      if (server.versionRegex) {
        const versionMatch = serverHeader.match(server.versionRegex)
        if (versionMatch && versionMatch[1]) {
          version = versionMatch[1]
          evidence.push(`Version: ${version}`)
        }
      }

      // Extract modules (Apache)
      if (server.modulesRegex) {
        const moduleMatches = [...serverHeader.matchAll(server.modulesRegex)]
        modules = moduleMatches.map(match => match[1]).filter(m => m && m !== version)
        if (modules.length > 0) {
          evidence.push(`Modules: ${modules.join(', ')}`)
        }
      }

      // Run security checks
      const securityIssues: SecurityIssue[] = []

      for (const securityCheck of server.securityChecks || []) {
        const issue = securityCheck.check(version, serverHeader, modules)
        if (issue) {
          securityIssues.push(issue)
          findings.push({
            type: `web-server-${securityCheck.name}`,
            category: 'web-server',
            ...issue,
          })
        }
      }

      detectedServers.push({
        name: server.name,
        detected: true,
        version,
        modules: modules.length > 0 ? modules : undefined,
        confidence,
        evidence,
        securityIssues,
      })
    }
  }

  let primaryServer: string | undefined
  if (detectedServers.length > 0) {
    primaryServer = detectedServers[0].name
  }

  return {
    detectedServers,
    findings,
    hasServer: detectedServers.length > 0,
    primaryServer,
  }
}

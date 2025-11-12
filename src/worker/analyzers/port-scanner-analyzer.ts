/**
 * Port Scanner Analyzer
 *
 * Detects exposed database ports, web management interfaces, and development servers.
 * Uses timeout-protected fetch requests to check for open ports without direct port scanning.
 *
 * IMPORTANT: Due to browser CORS restrictions, this analyzer checks for HTTP/HTTPS services
 * on common ports rather than performing actual port scanning.
 */

import { CrawlResult } from '../crawler-mock'

export interface PortScanFinding {
  type: 'database-port' | 'web-interface' | 'dev-server' | 'nosql-port'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  port?: number
  service?: string
  impact: string
  recommendation: string
  evidence?: string
}

export interface PortScanResult {
  findings: PortScanFinding[]
  exposedDatabases: number
  exposedInterfaces: number
  exposedDevServers: number
  score: number
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

/**
 * Helper function to fetch with timeout using AbortController
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 1000): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // Avoid CORS preflight
      redirect: 'manual'
    })
    clearTimeout(timeout)
    return response
  } catch (error: any) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      return null // Timeout
    }
    return null // Other errors
  }
}

/**
 * Check for exposed database web interfaces
 */
async function checkDatabaseInterfaces(baseUrl: URL): Promise<PortScanFinding[]> {
  const findings: PortScanFinding[] = []

  // Database web management interfaces
  const interfaces = [
    { path: ':8080/phpmyadmin', service: 'phpMyAdmin', port: 8080, severity: 'critical' as const },
    { path: '/phpmyadmin', service: 'phpMyAdmin', port: 80, severity: 'critical' as const },
    { path: ':8080/adminer', service: 'Adminer', port: 8080, severity: 'critical' as const },
    { path: '/adminer', service: 'Adminer', port: 80, severity: 'critical' as const },
    { path: ':5984/_utils', service: 'CouchDB Fauxton', port: 5984, severity: 'critical' as const },
    { path: ':9200/_plugin/head', service: 'Elasticsearch Head', port: 9200, severity: 'high' as const },
    { path: ':9200', service: 'Elasticsearch', port: 9200, severity: 'high' as const },
    { path: ':15672', service: 'RabbitMQ Management', port: 15672, severity: 'high' as const },
    { path: ':8086', service: 'InfluxDB Admin', port: 8086, severity: 'high' as const },
    { path: ':27017', service: 'MongoDB', port: 27017, severity: 'critical' as const },
    { path: ':6379', service: 'Redis', port: 6379, severity: 'critical' as const },
  ]

  for (const iface of interfaces) {
    try {
      // Build URL - handle port notation
      let testUrl: string
      if (iface.path.startsWith(':')) {
        // Port-based path like ":8080/phpmyadmin"
        const portPath = iface.path.substring(1) // Remove leading ':'
        testUrl = `${baseUrl.protocol}//${baseUrl.hostname}:${portPath}`
      } else {
        // Regular path like "/phpmyadmin"
        testUrl = `${baseUrl.protocol}//${baseUrl.host}${iface.path}`
      }

      const response = await fetchWithTimeout(testUrl, 1000)

      // Due to no-cors mode, we can't check response.ok, but we can detect if request completed
      // In practice, if the service is not available, the request will timeout or fail
      if (response) {
        findings.push({
          type: 'web-interface',
          severity: iface.severity,
          title: `${iface.service} interface potentially exposed`,
          description: `Database management interface ${iface.service} may be accessible at ${iface.path}`,
          port: iface.port,
          service: iface.service,
          impact: iface.severity === 'critical'
            ? `CRITICAL: Direct database access interface exposed to public internet. Attackers can potentially access, modify, or delete all database contents.`
            : `Database management interface exposed. Provides administrative access to sensitive data.`,
          recommendation: iface.severity === 'critical'
            ? `IMMEDIATELY restrict ${iface.service} access to specific IP addresses only. Never expose database management to public internet.`
            : `Restrict ${iface.service} access to internal networks or VPN only. Implement strong authentication and IP whitelisting.`,
          evidence: testUrl
        })
      }
    } catch (error) {
      // Service not accessible - this is good
      continue
    }
  }

  return findings
}

/**
 * Check for exposed development servers
 */
async function checkDevelopmentServers(baseUrl: URL): Promise<PortScanFinding[]> {
  const findings: PortScanFinding[] = []

  // Common development server ports
  const devServers = [
    { port: 3000, service: 'Node.js/React Dev Server', paths: ['/', '/__webpack_hmr', '/sockjs-node'] },
    { port: 4200, service: 'Angular Dev Server', paths: ['/', '/sockjs-node'] },
    { port: 8080, service: 'Vue/Webpack Dev Server', paths: ['/', '/__webpack_hmr'] },
    { port: 5000, service: 'Flask Dev Server', paths: ['/'] },
    { port: 8000, service: 'Django Dev Server', paths: ['/admin'] },
    { port: 9000, service: 'PHP Built-in Server', paths: ['/'] },
    { port: 8888, service: 'Jupyter Notebook', paths: ['/tree', '/notebooks'] },
    { port: 3001, service: 'Node.js Alt Port', paths: ['/'] },
  ]

  for (const server of devServers) {
    for (const path of server.paths) {
      try {
        const testUrl = `${baseUrl.protocol}//${baseUrl.hostname}:${server.port}${path}`
        const response = await fetchWithTimeout(testUrl, 1000)

        if (response) {
          findings.push({
            type: 'dev-server',
            severity: 'medium',
            title: `Development server detected on port ${server.port}`,
            description: `${server.service} appears to be running and accessible`,
            port: server.port,
            service: server.service,
            impact: `Development servers often have debug features enabled, verbose error messages, and weaker security. They may expose source code, environment variables, or internal application structure.`,
            recommendation: `NEVER run development servers in production. Use production builds with proper security configurations. Disable debug mode and verbose error messages.`,
            evidence: testUrl
          })
          break // Found one path, no need to check others
        }
      } catch (error) {
        continue
      }
    }
  }

  return findings
}

/**
 * Check for exposed database ports (note: direct port checking will fail due to CORS/browser limitations)
 */
async function checkDatabasePorts(baseUrl: URL): Promise<PortScanFinding[]> {
  const findings: PortScanFinding[] = []

  // Note: Direct database port checks will fail in browser environment
  // This is here for completeness but will be skipped
  // In a real implementation, this would run server-side

  const databasePorts = [
    { port: 3306, service: 'MySQL', severity: 'critical' as const },
    { port: 5432, service: 'PostgreSQL', severity: 'critical' as const },
    { port: 1433, service: 'MSSQL', severity: 'critical' as const },
    { port: 27017, service: 'MongoDB', severity: 'critical' as const },
    { port: 6379, service: 'Redis', severity: 'critical' as const },
    { port: 9200, service: 'Elasticsearch', severity: 'high' as const },
    { port: 5984, service: 'CouchDB', severity: 'high' as const },
    { port: 8086, service: 'InfluxDB', severity: 'high' as const },
  ]

  // Browser environment cannot check raw TCP ports
  // This function is included for documentation purposes
  // In production, this would require server-side scanning

  return findings
}

/**
 * Main port scanner analysis function
 */
export async function analyzePortScan(crawlResult: CrawlResult): Promise<PortScanResult> {
  const findings: PortScanFinding[] = []
  const baseUrl = new URL(crawlResult.url)

  // Start timing
  const startTime = Date.now()
  const maxDuration = 5000 // 5 second overall timeout

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Port scan timeout')), maxDuration)
    })

    // Run checks with overall timeout
    const scanPromise = async () => {
      // Check 1: Database web interfaces (most critical)
      const interfaceFindings = await checkDatabaseInterfaces(baseUrl)
      findings.push(...interfaceFindings)

      // Check 2: Development servers (if we still have time)
      const elapsed = Date.now() - startTime
      if (elapsed < maxDuration - 1000) {
        const devFindings = await checkDevelopmentServers(baseUrl)
        findings.push(...devFindings)
      }

      // Check 3: Database ports (will be empty in browser environment)
      // Included for completeness
      const portFindings = await checkDatabasePorts(baseUrl)
      findings.push(...portFindings)
    }

    // Race between scan and timeout
    await Promise.race([scanPromise(), timeoutPromise])

  } catch (error) {
    // Timeout or other error - return what we found so far
    console.log(`[PortScan] Scan stopped: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Count findings by type
  let exposedDatabases = 0
  let exposedInterfaces = 0
  let exposedDevServers = 0

  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  }

  findings.forEach(finding => {
    if (finding.type === 'database-port') exposedDatabases++
    if (finding.type === 'web-interface') exposedInterfaces++
    if (finding.type === 'dev-server') exposedDevServers++

    summary[finding.severity]++
  })

  // Calculate score
  let score = 100
  findings.forEach(finding => {
    switch (finding.severity) {
      case 'critical':
        score -= 30
        break
      case 'high':
        score -= 20
        break
      case 'medium':
        score -= 10
        break
      case 'low':
        score -= 5
        break
    }
  })

  score = Math.max(0, score)

  return {
    findings,
    exposedDatabases,
    exposedInterfaces,
    exposedDevServers,
    score,
    summary
  }
}

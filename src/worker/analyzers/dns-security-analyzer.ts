/**
 * DNS & Domain Security Analyzer
 *
 * Comprehensive DNS security checks including:
 * - DNSSEC validation
 * - CAA (Certificate Authority Authorization) records
 * - SPF (Sender Policy Framework) validation
 * - DKIM (DomainKeys Identified Mail) checks
 * - DMARC (Domain-based Message Authentication) validation
 * - MX record security
 * - TXT record analysis
 */

import { CrawlResult } from '../crawler-mock'

/**
 * Helper function to fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 3000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeout)
    return response
  } catch (error: any) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error(`DNS query timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

export interface DNSFinding {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description?: string
  impact?: string
  recommendation?: string
  details?: any
}

export interface DNSSecurityResult {
  domain: string
  findings: DNSFinding[]
  hasDNSSEC: boolean
  hasSPF: boolean
  hasDKIM: boolean
  hasDMARC: boolean
  hasCAA: boolean
  score: number
}

/**
 * Main DNS security analysis function
 */
export async function analyzeDNSSecurity(crawlResult: CrawlResult): Promise<DNSSecurityResult> {
  const url = new URL(crawlResult.url)
  const domain = url.hostname

  const findings: DNSFinding[] = []
  let score = 100

  // Run all DNS security checks
  const dnssecFindings = await validateDNSSEC(domain)
  const caaFindings = await checkCAARecords(domain)
  const spfFindings = await validateSPF(domain)
  const dkimFindings = await checkDKIM(domain)
  const dmarcFindings = await validateDMARC(domain)
  const mxFindings = await analyzeMXRecords(domain)
  const txtFindings = await analyzeTXTRecords(domain)

  // Combine all findings
  findings.push(...dnssecFindings, ...caaFindings, ...spfFindings,
                ...dkimFindings, ...dmarcFindings, ...mxFindings, ...txtFindings)

  // Calculate score based on findings
  for (const finding of findings) {
    switch (finding.severity) {
      case 'critical':
        score -= 20
        break
      case 'high':
        score -= 15
        break
      case 'medium':
        score -= 10
        break
      case 'low':
        score -= 5
        break
    }
  }

  score = Math.max(0, score)

  // Check what security features are present
  const hasDNSSEC = dnssecFindings.some(f => f.type === 'dnssec-enabled')
  const hasSPF = !spfFindings.some(f => f.type === 'spf-missing')
  const hasDKIM = dkimFindings.some(f => f.type === 'dkim-configured')
  const hasDMARC = !dmarcFindings.some(f => f.type === 'dmarc-missing')
  const hasCAA = caaFindings.some(f => f.type === 'caa-records-found')

  return {
    domain,
    findings,
    hasDNSSEC,
    hasSPF,
    hasDKIM,
    hasDMARC,
    hasCAA,
    score
  }
}

/**
 * 1. DNSSEC Validation
 */
export async function validateDNSSEC(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  try {
    // Use DNS over HTTPS to check DNSSEC
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`
    const response = await fetchWithTimeout(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    }, 3000)

    const data = await response.json()

    // Check AD (Authenticated Data) flag
    if (data.AD === false) {
      findings.push({
        type: 'dnssec-not-enabled',
        severity: 'medium',
        title: 'DNSSEC not enabled',
        description: `Domain ${domain} does not have DNSSEC enabled`,
        impact: 'DNS responses can be spoofed, enabling cache poisoning attacks',
        recommendation: 'Enable DNSSEC at your domain registrar and DNS provider'
      })
    } else if (data.AD === true) {
      findings.push({
        type: 'dnssec-enabled',
        severity: 'info',
        title: 'DNSSEC properly configured',
        description: `Domain ${domain} has DNSSEC enabled and validated`,
        impact: 'DNS responses are cryptographically authenticated'
      })
    }

    // Check for DNSSEC validation errors
    if (data.Status === 2) { // SERVFAIL
      findings.push({
        type: 'dnssec-validation-error',
        severity: 'high',
        title: 'DNSSEC validation failed',
        description: 'DNSSEC signatures are invalid or misconfigured',
        impact: 'DNS resolution may fail for validating resolvers',
        recommendation: 'Fix DNSSEC configuration immediately'
      })
    }

  } catch (error) {
    findings.push({
      type: 'dnssec-check-failed',
      severity: 'info',
      title: 'Could not verify DNSSEC status',
      description: 'Unable to check DNSSEC configuration',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
  }

  return findings
}

/**
 * 2. CAA Records Check
 */
export async function checkCAARecords(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  try {
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=CAA`
    const response = await fetchWithTimeout(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    })

    const data = await response.json()

    if (!data.Answer || data.Answer.length === 0) {
      findings.push({
        type: 'caa-records-missing',
        severity: 'medium',
        title: 'No CAA records found',
        description: `Domain ${domain} has no CAA records configured`,
        impact: 'Any Certificate Authority can issue certificates for this domain',
        recommendation: 'Add CAA records to restrict which CAs can issue certificates'
      })
    } else {
      // Parse CAA records
      const caaRecords = data.Answer.map((record: any) => {
        const parts = record.data.match(/(\d+)\s+(\w+)\s+"([^"]+)"/)
        return {
          flags: parts?.[1],
          tag: parts?.[2],
          value: parts?.[3]
        }
      }).filter((r: any) => r.tag) // Filter out null entries

      // Check for issue/issuewild tags
      const issueTags = caaRecords.filter((r: any) => r.tag === 'issue')
      const issueWildTags = caaRecords.filter((r: any) => r.tag === 'issuewild')

      if (issueTags.length === 0) {
        findings.push({
          type: 'caa-no-issue-tag',
          severity: 'medium',
          title: 'CAA records without issue tag',
          description: 'CAA records exist but no issue tag is defined',
          impact: 'CAA policy is not properly enforced',
          recommendation: 'Add issue tag to specify allowed Certificate Authorities'
        })
      }

      // Check for wildcard certificates
      if (issueWildTags.length === 0 && issueTags.length > 0) {
        findings.push({
          type: 'caa-no-issuewild',
          severity: 'info',
          title: 'No wildcard certificate control',
          description: 'CAA does not explicitly control wildcard certificate issuance',
          recommendation: 'Add issuewild tag to control wildcard certificates'
        })
      }

      // Check for iodef (incident reporting)
      const iodefTags = caaRecords.filter((r: any) => r.tag === 'iodef')
      if (iodefTags.length === 0) {
        findings.push({
          type: 'caa-no-iodef',
          severity: 'info',
          title: 'No CAA violation reporting',
          description: 'No email/URL configured for CAA violation reports',
          recommendation: 'Add iodef tag to receive reports of policy violations'
        })
      }

      findings.push({
        type: 'caa-records-found',
        severity: 'info',
        title: 'CAA records configured',
        description: `${caaRecords.length} CAA record(s) found`,
        details: { records: caaRecords }
      })
    }

  } catch (error) {
    findings.push({
      type: 'caa-check-failed',
      severity: 'info',
      title: 'Could not check CAA records',
      details: { error: error instanceof Error ? error.message : "Unknown error" }
    })
  }

  return findings
}

/**
 * 3. SPF Record Validation
 */
export async function validateSPF(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  try {
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`
    const response = await fetchWithTimeout(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    })

    const data = await response.json()
    const spfRecords = data.Answer?.filter((r: any) =>
      r.data.includes('v=spf1')
    ) || []

    if (spfRecords.length === 0) {
      findings.push({
        type: 'spf-missing',
        severity: 'medium',
        title: 'No SPF record found',
        description: `Domain ${domain} has no SPF record`,
        impact: 'Email spoofing is possible',
        recommendation: 'Add SPF record to prevent email forgery'
      })
    } else if (spfRecords.length > 1) {
      findings.push({
        type: 'spf-multiple',
        severity: 'high',
        title: 'Multiple SPF records found',
        description: `${spfRecords.length} SPF records detected`,
        impact: 'SPF validation will fail - only one SPF record is allowed',
        recommendation: 'Merge all SPF records into a single record'
      })
    } else {
      const spf = spfRecords[0].data

      // Check for dangerous configurations
      if (spf.includes('+all')) {
        findings.push({
          type: 'spf-allow-all',
          severity: 'critical',
          title: 'SPF allows all senders',
          description: 'SPF record contains +all mechanism',
          impact: 'No email protection - anyone can send emails',
          recommendation: 'Change +all to -all (fail) or ~all (softfail)',
          details: { spf }
        })
      }

      // Check for neutral policy
      if (spf.includes('?all')) {
        findings.push({
          type: 'spf-neutral-policy',
          severity: 'medium',
          title: 'SPF has neutral policy',
          description: 'SPF record ends with ?all (neutral)',
          impact: 'Provides minimal protection against spoofing',
          recommendation: 'Use -all (fail) or ~all (softfail) for better protection'
        })
      }

      // Check for too many DNS lookups
      const lookups = (spf.match(/(?:include:|a:|mx:|ptr:|exists:|redirect=)/g) || []).length
      if (lookups > 10) {
        findings.push({
          type: 'spf-too-many-lookups',
          severity: 'high',
          title: 'SPF exceeds 10 DNS lookups',
          description: `SPF record requires ${lookups} DNS lookups`,
          impact: 'SPF validation will fail (permerror)',
          recommendation: 'Reduce number of includes and lookups to 10 or less'
        })
      }

      // Check for deprecated mechanisms
      if (spf.includes('ptr:') || spf.includes('ptr ')) {
        findings.push({
          type: 'spf-deprecated-ptr',
          severity: 'low',
          title: 'SPF uses deprecated PTR mechanism',
          description: 'PTR mechanism is deprecated and slow',
          recommendation: 'Replace PTR with A or MX mechanisms'
        })
      }

      if (spf.includes('-all') || spf.includes('~all')) {
        findings.push({
          type: 'spf-configured',
          severity: 'info',
          title: 'SPF properly configured',
          description: 'SPF record is present with restrictive policy',
          details: { spf }
        })
      }
    }

  } catch (error) {
    // DNS query failed - silent fail
  }

  return findings
}

/**
 * 4. DKIM Record Check
 */
export async function checkDKIM(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  // Common DKIM selectors to check
  const selectors = [
    'default', 'google', 'k1', 'k2', 'selector1', 'selector2',
    's1', 's2', 'email', 'mail', 'smtp', 'dkim', 'mandrill',
    'mailgun', 'sendgrid', 'amazonses', 'pm', 'zendesk1', 'zendesk2'
  ]

  let foundDkim = false
  const foundSelectors: string[] = []

  for (const selector of selectors) {
    try {
      const dkimDomain = `${selector}._domainkey.${domain}`
      const dohUrl = `https://cloudflare-dns.com/dns-query?name=${dkimDomain}&type=TXT`

      const response = await fetchWithTimeout(dohUrl, {
        headers: { 'Accept': 'application/dns-json' }
      })

      const data = await response.json()

      if (data.Answer && data.Answer.length > 0) {
        const dkimRecord = data.Answer[0].data

        if (dkimRecord.includes('v=DKIM1')) {
          foundDkim = true
          foundSelectors.push(selector)

          // Check key strength (rough estimate)
          const keyMatch = dkimRecord.match(/p=([^;]+)/)
          if (keyMatch && keyMatch[1].length > 10) {
            const keyLength = keyMatch[1].length * 6 // Base64 to bits estimate

            if (keyLength < 1024) {
              findings.push({
                type: 'dkim-weak-key',
                severity: 'medium',
                title: `DKIM key too short (selector: ${selector})`,
                description: `Estimated key length: ${keyLength} bits`,
                impact: 'Weak keys can be broken',
                recommendation: 'Use at least 2048-bit keys for DKIM'
              })
            }
          }

          // Check for testing mode
          if (dkimRecord.includes('t=y')) {
            findings.push({
              type: 'dkim-testing-mode',
              severity: 'info',
              title: `DKIM in testing mode (selector: ${selector})`,
              description: 'DKIM record has t=y flag',
              recommendation: 'Remove t=y flag when testing is complete'
            })
          }
        }
      }
    } catch (error) {
      // Selector not found - continue checking others
    }
  }

  if (!foundDkim) {
    findings.push({
      type: 'dkim-not-found',
      severity: 'medium',
      title: 'No DKIM records found',
      description: `Checked ${selectors.length} common DKIM selectors`,
      impact: 'Emails cannot be cryptographically authenticated',
      recommendation: 'Configure DKIM with your email service provider'
    })
  } else {
    findings.push({
      type: 'dkim-configured',
      severity: 'info',
      title: 'DKIM records found',
      description: `DKIM configured with selector(s): ${foundSelectors.join(', ')}`,
      impact: 'Email authentication enabled'
    })
  }

  return findings
}

/**
 * 5. DMARC Record Validation
 */
export async function validateDMARC(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  try {
    const dmarcDomain = `_dmarc.${domain}`
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${dmarcDomain}&type=TXT`

    const response = await fetchWithTimeout(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    })

    const data = await response.json()
    const dmarcRecords = data.Answer?.filter((r: any) =>
      r.data.includes('v=DMARC1')
    ) || []

    if (dmarcRecords.length === 0) {
      findings.push({
        type: 'dmarc-missing',
        severity: 'medium',
        title: 'No DMARC record found',
        description: `Domain ${domain} has no DMARC policy`,
        impact: 'No email authentication policy enforcement',
        recommendation: 'Add DMARC record to enforce SPF and DKIM'
      })
    } else {
      const dmarc = dmarcRecords[0].data

      // Parse DMARC tags
      const policy = dmarc.match(/p=([^;]+)/)?.[1]
      const subdomainPolicy = dmarc.match(/sp=([^;]+)/)?.[1]
      const percentage = dmarc.match(/pct=([^;]+)/)?.[1]
      const rua = dmarc.match(/rua=([^;]+)/)?.[1]
      const ruf = dmarc.match(/ruf=([^;]+)/)?.[1]
      const aspf = dmarc.match(/aspf=([^;]+)/)?.[1]
      const adkim = dmarc.match(/adkim=([^;]+)/)?.[1]

      // Check policy strength
      if (policy === 'none') {
        findings.push({
          type: 'dmarc-policy-none',
          severity: 'medium',
          title: 'DMARC in monitoring mode only',
          description: 'DMARC policy is set to none',
          impact: 'Failed emails are not rejected or quarantined',
          recommendation: 'Progress to p=quarantine then p=reject'
        })
      } else if (policy === 'quarantine') {
        findings.push({
          type: 'dmarc-policy-quarantine',
          severity: 'info',
          title: 'DMARC quarantines failed emails',
          description: 'DMARC policy is set to quarantine',
          recommendation: 'Consider moving to p=reject for full protection'
        })
      } else if (policy === 'reject') {
        findings.push({
          type: 'dmarc-policy-reject',
          severity: 'info',
          title: 'DMARC fully enforced',
          description: 'DMARC policy is set to reject - maximum protection'
        })
      }

      // Check percentage
      if (percentage && parseInt(percentage) < 100) {
        findings.push({
          type: 'dmarc-partial-enforcement',
          severity: 'medium',
          title: 'DMARC partially enforced',
          description: `Policy applies to only ${percentage}% of messages`,
          impact: 'Some malicious emails may pass through',
          recommendation: 'Increase pct to 100 for full coverage'
        })
      }

      // Check reporting
      if (!rua && !ruf) {
        findings.push({
          type: 'dmarc-no-reporting',
          severity: 'low',
          title: 'No DMARC reporting configured',
          description: 'No aggregate (rua) or forensic (ruf) reports configured',
          recommendation: 'Add rua tag to receive DMARC reports'
        })
      }

      // Check subdomain policy
      if (!subdomainPolicy || subdomainPolicy === 'none') {
        findings.push({
          type: 'dmarc-weak-subdomain-policy',
          severity: 'medium',
          title: 'Weak subdomain policy',
          description: 'Subdomains have weaker or no DMARC policy',
          recommendation: 'Set sp= to match or exceed main domain policy'
        })
      }

      // Check alignment
      if (aspf === 'r' || adkim === 'r') {
        findings.push({
          type: 'dmarc-relaxed-alignment',
          severity: 'info',
          title: 'DMARC uses relaxed alignment',
          description: 'SPF or DKIM alignment is set to relaxed mode',
          recommendation: 'Consider strict alignment (aspf=s, adkim=s) for better security'
        })
      }
    }

  } catch (error) {
    // DNS query failed - silent
  }

  return findings
}

/**
 * 6. MX Record Security Analysis
 */
export async function analyzeMXRecords(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  try {
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`
    const response = await fetchWithTimeout(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    })

    const data = await response.json()

    if (!data.Answer || data.Answer.length === 0) {
      findings.push({
        type: 'mx-no-records',
        severity: 'info',
        title: 'No MX records found',
        description: `Domain ${domain} has no mail servers configured`,
        impact: 'Domain cannot receive email'
      })
    } else {
      const mxRecords = data.Answer.map((r: any) => {
        const parts = r.data.split(' ')
        return {
          priority: parseInt(parts[0]),
          host: parts[1]
        }
      })

      // Check for suspicious MX configurations
      for (const mx of mxRecords) {
        // Check for IP address as MX (RFC violation)
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(mx.host)) {
          findings.push({
            type: 'mx-ip-address',
            severity: 'high',
            title: 'MX record points to IP address',
            description: `MX record points to ${mx.host}`,
            impact: 'Violates RFC standards, may not work',
            recommendation: 'Use hostname instead of IP address'
          })
        }

        // Check for localhost/null MX
        if (mx.host.includes('localhost') || mx.host === '.' || mx.host === '0.0.0.0') {
          findings.push({
            type: 'mx-localhost',
            severity: 'high',
            title: 'MX points to localhost/null',
            description: `MX record points to ${mx.host}`,
            impact: 'Email will not be delivered',
            recommendation: 'Configure proper mail server'
          })
        }
      }

      // Check for all same priority (no failover)
      const priorities = [...new Set(mxRecords.map((r: any) => r.priority))]
      if (priorities.length === 1 && mxRecords.length > 1) {
        findings.push({
          type: 'mx-same-priority',
          severity: 'info',
          title: 'All MX records have same priority',
          description: `${mxRecords.length} MX records with priority ${priorities[0]}`,
          recommendation: 'Use different priorities for proper failover'
        })
      }

      // Check for too many MX records
      if (mxRecords.length > 10) {
        findings.push({
          type: 'mx-too-many',
          severity: 'info',
          title: 'Many MX records configured',
          description: `${mxRecords.length} MX records found`,
          recommendation: 'Consider consolidating mail servers'
        })
      }
    }

  } catch (error) {
    // DNS query failed - silent
  }

  return findings
}

/**
 * 7. TXT Record Analysis for Security Issues
 */
export async function analyzeTXTRecords(domain: string): Promise<DNSFinding[]> {
  const findings: DNSFinding[] = []

  try {
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`
    const response = await fetchWithTimeout(dohUrl, {
      headers: { 'Accept': 'application/dns-json' }
    })

    const data = await response.json()
    const txtRecords = data.Answer?.map((r: any) => r.data) || []

    // Check for sensitive information in TXT records
    const sensitivePatterns = [
      { pattern: /password|passwd|pwd/i, type: 'password' },
      { pattern: /api[_-]?key/i, type: 'API key' },
      { pattern: /secret/i, type: 'secret' },
      { pattern: /token/i, type: 'token' },
      { pattern: /private[_-]?key/i, type: 'private key' }
    ]

    for (const txt of txtRecords) {
      for (const { pattern, type } of sensitivePatterns) {
        if (pattern.test(txt)) {
          findings.push({
            type: 'txt-sensitive-data',
            severity: 'high',
            title: `Possible ${type} in TXT record`,
            description: 'Sensitive information may be exposed in DNS',
            impact: 'Credentials could be discovered via DNS queries',
            recommendation: 'Remove sensitive data from TXT records',
            details: { record: txt.substring(0, 50) + '...' }
          })
        }
      }

      // Check for very long TXT records (can cause issues)
      if (txt.length > 255) {
        findings.push({
          type: 'txt-long-record',
          severity: 'info',
          title: 'Long TXT record detected',
          description: `TXT record is ${txt.length} characters`,
          impact: 'May cause compatibility issues with some DNS servers',
          recommendation: 'Consider splitting into multiple records'
        })
      }
    }

    // Check total number of TXT records
    if (txtRecords.length > 15) {
      findings.push({
        type: 'txt-many-records',
        severity: 'info',
        title: 'Many TXT records',
        description: `${txtRecords.length} TXT records found`,
        recommendation: 'Consider consolidating TXT records'
      })
    }

  } catch (error) {
    // DNS query failed - silent
  }

  return findings
}
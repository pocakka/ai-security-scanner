/**
 * Domain Validator
 *
 * Validates domain existence before scanning to prevent wasted resources
 * on non-existent domains.
 */

import { promises as dns } from 'dns'

export interface DomainValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
  resolvedAddresses?: string[]
}

/**
 * Validate that a domain exists and is reachable
 *
 * Performs DNS lookup to check if domain has DNS records.
 * This is a quick check before expensive browser crawling.
 *
 * @param domain - Domain name (e.g., "example.com")
 * @param timeout - DNS timeout in milliseconds (default: 5000)
 * @returns DomainValidationResult
 */
export async function validateDomain(
  domain: string,
  timeout: number = 5000
): Promise<DomainValidationResult> {
  try {
    // Remove protocol, port, and path if present
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/:\d+$/, '')
      .split('/')[0]
      .toLowerCase()
      .trim()

    // Basic domain format validation
    if (!cleanDomain || cleanDomain.length === 0) {
      return {
        valid: false,
        error: 'Empty domain name',
        errorCode: 'EMPTY_DOMAIN'
      }
    }

    // Check for invalid characters
    if (!/^[a-z0-9.-]+$/i.test(cleanDomain)) {
      return {
        valid: false,
        error: 'Domain contains invalid characters',
        errorCode: 'INVALID_CHARS'
      }
    }

    // Check for localhost/private IPs (optional - might want to allow for testing)
    if (
      cleanDomain === 'localhost' ||
      cleanDomain.startsWith('127.') ||
      cleanDomain.startsWith('192.168.') ||
      cleanDomain.startsWith('10.') ||
      cleanDomain.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      // Allow localhost for development
      return {
        valid: true,
        resolvedAddresses: ['127.0.0.1']
      }
    }

    // DNS lookup with timeout
    const lookupPromise = dns.resolve4(cleanDomain)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), timeout)
    })

    const addresses = await Promise.race([lookupPromise, timeoutPromise])

    if (!addresses || addresses.length === 0) {
      return {
        valid: false,
        error: 'Domain has no DNS records',
        errorCode: 'NO_DNS_RECORDS'
      }
    }

    return {
      valid: true,
      resolvedAddresses: addresses
    }

  } catch (error: any) {
    // Handle specific DNS errors
    const errorCode = error.code || error.message

    switch (errorCode) {
      case 'ENOTFOUND':
        return {
          valid: false,
          error: 'Domain does not exist (DNS lookup failed)',
          errorCode: 'DOMAIN_NOT_FOUND'
        }

      case 'ENODATA':
      case 'ENOENT':
        return {
          valid: false,
          error: 'Domain has no DNS records',
          errorCode: 'NO_DNS_RECORDS'
        }

      case 'ETIMEOUT':
      case 'DNS_TIMEOUT':
        return {
          valid: false,
          error: 'DNS lookup timeout - domain may be unreachable',
          errorCode: 'DNS_TIMEOUT'
        }

      case 'ESERVFAIL':
        return {
          valid: false,
          error: 'DNS server failure',
          errorCode: 'DNS_SERVER_ERROR'
        }

      case 'EREFUSED':
        return {
          valid: false,
          error: 'DNS query refused',
          errorCode: 'DNS_REFUSED'
        }

      default:
        return {
          valid: false,
          error: `DNS error: ${error.message || 'Unknown error'}`,
          errorCode: 'DNS_ERROR'
        }
    }
  }
}

/**
 * Validate domain and check if it's accessible via HTTP/HTTPS
 *
 * More thorough check that attempts to connect to the domain.
 * Use this for additional validation before expensive scans.
 *
 * @param url - Full URL (e.g., "https://example.com")
 * @param timeout - HTTP timeout in milliseconds (default: 10000)
 * @returns DomainValidationResult
 */
export async function validateUrlReachability(
  url: string,
  timeout: number = 10000
): Promise<DomainValidationResult> {
  try {
    const urlObj = new URL(url)

    // First check DNS
    const dnsResult = await validateDomain(urlObj.hostname)
    if (!dnsResult.valid) {
      return dnsResult
    }

    // Then attempt HTTP connection (HEAD request - lightweight)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow' // Follow redirects
      })

      clearTimeout(timeoutId)

      // Accept any response (even errors) as "reachable"
      // We just want to know the domain responds
      return {
        valid: true,
        resolvedAddresses: dnsResult.resolvedAddresses
      }

    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        return {
          valid: false,
          error: 'Connection timeout - website not responding',
          errorCode: 'HTTP_TIMEOUT'
        }
      }

      // DNS passed but HTTP failed - domain exists but might not have web server
      // Still allow the scan (might be API-only, etc.)
      return {
        valid: true,
        resolvedAddresses: dnsResult.resolvedAddresses
      }
    }

  } catch (error: any) {
    return {
      valid: false,
      error: `URL validation error: ${error.message}`,
      errorCode: 'VALIDATION_ERROR'
    }
  }
}

/**
 * User-friendly error messages for display
 */
export function getDomainValidationErrorMessage(result: DomainValidationResult): string {
  if (result.valid) {
    return 'Domain is valid and reachable'
  }

  switch (result.errorCode) {
    case 'EMPTY_DOMAIN':
      return 'Please enter a valid domain name'

    case 'INVALID_CHARS':
      return 'Domain name contains invalid characters'

    case 'DOMAIN_NOT_FOUND':
      return 'This domain does not exist. Please check the spelling and try again.'

    case 'NO_DNS_RECORDS':
      return 'This domain has no DNS records. It may not exist or be configured incorrectly.'

    case 'DNS_TIMEOUT':
      return 'Unable to reach this domain (timeout). It may be offline or unreachable.'

    case 'DNS_SERVER_ERROR':
    case 'DNS_REFUSED':
      return 'DNS server error. Please try again later.'

    case 'HTTP_TIMEOUT':
      return 'Website is not responding. It may be offline or very slow.'

    default:
      return result.error || 'Unable to validate this domain. Please try a different URL.'
  }
}

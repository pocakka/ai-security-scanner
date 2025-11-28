/**
 * SSL Certificate Fetcher - Lightweight TLS-only certificate retrieval
 *
 * Uses Node.js TLS module to fetch SSL certificate info
 * WITHOUT launching a full browser (Playwright).
 *
 * Performance:
 * - CPU: ~0.1%
 * - RAM: ~5MB
 * - Time: ~100-200ms
 *
 * vs Playwright:
 * - CPU: ~100%
 * - RAM: ~300MB
 * - Time: ~3-5 sec
 */

import * as tls from 'tls'
import * as net from 'net'

export interface SSLCertificateInfo {
  valid: boolean
  secure: boolean
  protocol: string
  issuer: string
  subject: string
  valid_from: string
  valid_to: string
  daysUntilExpiry: number
  isExpired: boolean
  isSelfSigned: boolean
  serialNumber?: string
  fingerprint?: string
  error?: string
}

/**
 * Fetch SSL certificate info using Node.js TLS module
 * @param hostname Domain to check (e.g., "example.com")
 * @param port HTTPS port (default: 443)
 * @param timeoutMs Timeout in milliseconds (default: 5000)
 */
export async function fetchSSLCertificate(
  hostname: string,
  port: number = 443,
  timeoutMs: number = 5000
): Promise<SSLCertificateInfo> {
  return new Promise((resolve) => {
    const startTime = Date.now()

    // Default error result
    const errorResult = (error: string): SSLCertificateInfo => ({
      valid: false,
      secure: false,
      protocol: 'unknown',
      issuer: 'Unknown',
      subject: 'Unknown',
      valid_from: 'Unknown',
      valid_to: 'Unknown',
      daysUntilExpiry: 0,
      isExpired: true,
      isSelfSigned: false,
      error,
    })

    // Timeout handler
    const timeout = setTimeout(() => {
      resolve(errorResult(`Timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    try {
      const socket = tls.connect(
        {
          host: hostname,
          port: port,
          servername: hostname, // SNI support
          rejectUnauthorized: false, // Accept self-signed certs for analysis
          timeout: timeoutMs,
        },
        () => {
          clearTimeout(timeout)

          try {
            const cert = socket.getPeerCertificate(true)
            const cipher = socket.getCipher()
            const protocol = socket.getProtocol()

            if (!cert || !cert.valid_from) {
              socket.destroy()
              resolve(errorResult('No certificate returned'))
              return
            }

            // Parse dates
            const validFrom = new Date(cert.valid_from)
            const validTo = new Date(cert.valid_to)
            const now = new Date()

            // Calculate days until expiry
            const msPerDay = 24 * 60 * 60 * 1000
            const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / msPerDay)
            const isExpired = daysUntilExpiry < 0

            // Check if self-signed (issuer === subject)
            const issuerCN = cert.issuer?.CN || cert.issuer?.O || 'Unknown'
            const subjectCN = cert.subject?.CN || cert.subject?.O || 'Unknown'
            const isSelfSigned = issuerCN === subjectCN

            // Format issuer string
            const issuer = cert.issuer
              ? `${cert.issuer.CN || ''}${cert.issuer.O ? ` (${cert.issuer.O})` : ''}`
              : 'Unknown'

            // Format subject string
            const subject = cert.subject
              ? `${cert.subject.CN || ''}${cert.subject.O ? ` (${cert.subject.O})` : ''}`
              : 'Unknown'

            const elapsed = Date.now() - startTime
            console.log(`[SSLFetcher] ✅ ${hostname} cert fetched in ${elapsed}ms (expires in ${daysUntilExpiry} days)`)

            socket.destroy()

            resolve({
              valid: !isExpired,
              secure: true,
              protocol: protocol || 'TLSv1.2',
              issuer: issuer.trim() || 'Unknown',
              subject: subject.trim() || hostname,
              valid_from: cert.valid_from,
              valid_to: cert.valid_to,
              daysUntilExpiry,
              isExpired,
              isSelfSigned,
              serialNumber: cert.serialNumber,
              fingerprint: cert.fingerprint,
            })
          } catch (certError) {
            socket.destroy()
            resolve(errorResult(`Certificate parse error: ${certError}`))
          }
        }
      )

      socket.on('error', (err) => {
        clearTimeout(timeout)
        socket.destroy()
        resolve(errorResult(`TLS error: ${err.message}`))
      })

      socket.on('timeout', () => {
        clearTimeout(timeout)
        socket.destroy()
        resolve(errorResult('Socket timeout'))
      })
    } catch (err) {
      clearTimeout(timeout)
      resolve(errorResult(`Connection error: ${err}`))
    }
  })
}

/**
 * Extract hostname from URL
 */
export function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    // Fallback: remove protocol and path
    return url.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
  }
}

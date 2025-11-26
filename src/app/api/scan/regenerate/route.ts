/**
 * POST /api/scan/regenerate
 * Force regenerate a scan (bypasses duplicate check)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { jobQueue } from '@/lib/queue-sqlite'
import { validateDomain } from '@/lib/domain-validator'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Normalize URL (remove trailing slash, ensure https)
    let normalizedUrl = url.trim()
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1)
    }

    // Extract domain
    const urlObj = new URL(normalizedUrl)
    const domain = urlObj.hostname

    // Validate domain - BLOCK scan if domain doesn't exist
    const domainValidation = await validateDomain(domain)
    if (!domainValidation.valid) {
      console.log(`[API] ❌ Domain validation failed for ${domain}: ${domainValidation.error}`)

      // Return user-friendly error message
      const userMessage = domainValidation.errorCode === 'DOMAIN_NOT_FOUND' || domainValidation.errorCode === 'NO_DNS_RECORDS'
        ? 'This domain does not exist or is not reachable. Please check the spelling and try again.'
        : domainValidation.error || 'Unable to validate this domain'

      return NextResponse.json(
        { error: userMessage, errorCode: domainValidation.errorCode },
        { status: 400 }
      )
    }

    console.log(`[API] ✅ Domain validated: ${domain}`)
    console.log(`[API] 🔄 REGENERATE scan requested for: ${normalizedUrl}`)

    // Create new scan (no duplicate check!)
    const scan = await prisma.scan.create({
      data: {
        url: normalizedUrl,
        domain,
        status: 'PENDING',
      },
    })

    // Queue the scan job in SQLite
    await jobQueue.add('scan', {
      scanId: scan.id,
      url: normalizedUrl,
    })

    console.log(`[API] ✅ Scan #${scan.scanNumber} created and queued (REGENERATE - bypassed duplicate check)`)

    return NextResponse.json({
      scanId: scan.id,
      scanNumber: scan.scanNumber,
      domain: scan.domain,
      message: 'Scan queued successfully',
      isRegenerate: true
    })
  } catch (error) {
    console.error('[API] ❌ Error creating regenerate scan:', error)
    return NextResponse.json(
      { error: 'Failed to create scan' },
      { status: 500 }
    )
  }
}

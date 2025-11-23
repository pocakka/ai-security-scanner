import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/settings
 * Fetch current site settings
 */
export async function GET() {
  try {
    console.log('[Settings API] Fetching settings...') // DEBUG
    // Fetch or create default settings
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'global' },
    })

    console.log('[Settings API] Found settings:', settings) // DEBUG

    // If no settings exist, create default
    if (!settings) {
      console.log('[Settings API] Creating default settings...') // DEBUG
      settings = await prisma.siteSettings.create({
        data: {
          id: 'global',
          siteName: 'AI Security Scanner',
          enableOgTags: true,
          enableTwitterCards: false,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('[Settings API] ERROR:', error.message, error.stack) // DEBUG
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update site settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Settings API PUT] Received body:', JSON.stringify(body, null, 2))

    // Update or create settings (upsert)
    console.log('[Settings API PUT] Attempting upsert...')
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: {
        // Social Media
        twitterHandle: body.twitterHandle || null,
        facebookUrl: body.facebookUrl || null,
        linkedinUrl: body.linkedinUrl || null,
        instagramHandle: body.instagramHandle || null,
        youtubeUrl: body.youtubeUrl || null,
        githubUrl: body.githubUrl || null,

        // SEO & Branding
        siteName: body.siteName || 'AI Security Scanner',
        siteDescription: body.siteDescription || null,
        siteUrl: body.siteUrl || null,
        ogImageUrl: body.ogImageUrl || null,
        faviconUrl: body.faviconUrl || null,

        // Contact & Business
        supportEmail: body.supportEmail || null,
        salesEmail: body.salesEmail || null,
        companyName: body.companyName || null,
        companyAddress: body.companyAddress || null,

        // Feature Flags
        enableTwitterCards: body.enableTwitterCards ?? false,
        enableOgTags: body.enableOgTags ?? true,
        enableAnalytics: body.enableAnalytics ?? false,
        showExpertAuditPopup: body.showExpertAuditPopup ?? true,
      },
      create: {
        id: 'global',
        ...body,
      },
    })

    console.log('[Settings API PUT] ✅ Upsert successful')
    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error: any) {
    console.error('[Settings API PUT] ❌ Error:', error)
    console.error('[Settings API PUT] Error message:', error.message)
    console.error('[Settings API PUT] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}

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

    // Update or create settings (upsert)
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
      },
      create: {
        id: 'global',
        ...body,
      },
    })

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

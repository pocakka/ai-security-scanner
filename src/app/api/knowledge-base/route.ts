import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/knowledge-base
 * Returns all knowledge base finding explanations
 * Used by frontend to enrich findings with E-E-A-T content
 */
export async function GET() {
  try {
    const knowledgeBase = await prisma.knowledgeBaseFinding.findMany({
      select: {
        findingKey: true,
        category: true,
        severity: true,
        title: true,
        explanation: true,
        impact: true,
        solution: true,
        technicalDetails: true,
        references: true,
      },
    })

    // Convert references from JSON strings to arrays
    const formatted = knowledgeBase.map(kb => ({
      ...kb,
      references: kb.references ? JSON.parse(kb.references) : [],
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('[Knowledge Base API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    )
  }
}

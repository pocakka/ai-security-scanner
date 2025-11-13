import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const scans = await prisma.scan.findMany({
      where: {
        status: 'COMPLETED', // Only show completed scans
      },
      select: {
        id: true,
        url: true,
        domain: true,
        status: true,
        riskScore: true,
        riskLevel: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 scans
    })

    return NextResponse.json({ scans })
  } catch (error) {
    console.error('Error fetching recent scans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    )
  }
}

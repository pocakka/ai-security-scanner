import { NextResponse } from 'next/server'

const ADMIN_USERNAME = 'aiq'
const ADMIN_PASSWORD = '!!P1r0t3chn1ka!!'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[Admin Login] Error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  return timingSafeEqual(bufA, bufB)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, provider } = body

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (provider) {
      // OAuth login simulation
      return NextResponse.json({
        success: true,
        user: {
          id: '2',
          email: `user@${provider}.com`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop&crop=face',
          role: 'developer',
          permissions: ['read', 'write', 'deploy']
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      })
    }

    // Use environment variables for credentials
    const validEmail = process.env.DEMO_EMAIL || 'demo@kriya.dev'
    const validPassword = process.env.DEMO_PASSWORD || 'demo123'

    // Timing-safe comparison
    const emailValid = constantTimeCompare(email || '', validEmail)
    const passwordValid = constantTimeCompare(password || '', validPassword)

    if (emailValid && passwordValid) {
      return NextResponse.json({
        success: true,
        user: {
          id: '1',
          email,
          name: 'Demo User',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
          role: 'developer',
          permissions: ['read', 'write', 'deploy', 'admin']
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Logout endpoint
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
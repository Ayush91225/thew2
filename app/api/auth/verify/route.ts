import { NextRequest, NextResponse } from 'next/server'
import { users, companies, verifyJWT } from '@/lib/auth-storage'

/**
 * GET /api/auth/verify - Verify JWT token
 * Returns user data if token is valid
 * 
 * This is a separate route handler from /api/auth because GET
 * requests in Next.js can have routing issues when in the same file
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const payload = verifyJWT(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Try to get full user data from storage, fallback to token payload
    const user = users.get(payload.sub)
    
    const company = user ? companies.get(user.companyId) : companies.get(payload.companyId)

    // Return user data from either the stored user or the token payload
    return NextResponse.json({
      success: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: user?.name || payload.email.split('@')[0], // Fallback to email prefix
        role: payload.role,
        companyId: payload.companyId,
        companyName: company?.name || '',
        avatar: user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${payload.email}`,
        permissions: user?.permissions || (payload.role === 'OWNER' ? ['all'] : ['view', 'edit', 'collaborate']),
        createdAt: user?.createdAt || new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    )
  }
}

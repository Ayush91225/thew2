import { NextRequest, NextResponse } from 'next/server'
import { users, companies, teamInvites, generateId, verifyJWT, constantTimeCompare } from '@/lib/auth-storage'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60  // 7 days

function generateJWT(user: any): string {
  const header = Buffer.from(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const payload = {
    sub: user.id,
    email: user.email,
    companyId: user.companyId,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  // Simplified signature (for production, use HMAC-SHA256)
  const signature = Buffer.from(`${JWT_SECRET}${header}${encodedPayload}`)
    .toString('base64')
    .slice(0, 30)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${header}.${encodedPayload}.${signature}`
}

/**
 * Lightweight JWT verification without external dependency
 * Parses and validates JWT structure
 */
// Using imported verifyJWT from auth-storage instead

/**
 * POST /api/auth - Handles login and registration
 * 
 * Admin Registration:
 *   { action: 'register-admin', email, password, name, companyName }
 *   Creates company and OWNER user
 * 
 * Employee Login:
 *   { action: 'login', email, password }
 *   Only users with accepted invites or company members can login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, name, companyName } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action required' },
        { status: 400 }
      )
    }

    // Admin Registration - Creates company and OWNER user
    if (action === 'register-admin') {
      if (!email || !password || !name || !companyName) {
        return NextResponse.json(
          { success: false, error: 'Email, password, name, and company name required' },
          { status: 400 }
        )
      }

      // Use Prisma to create company and user
      const { prisma } = await import('@/lib/prisma')
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User already exists' },
          { status: 409 }
        )
      }

      // Create company and owner user in transaction
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: companyName }
        })

        const user = await tx.user.create({
          data: {
            email,
            name,
            role: 'OWNER',
            companyId: company.id
          }
        })

        return { company, user }
      })

      // Generate token
      const token = generateJWT({
        id: result.user.id,
        email: result.user.email,
        companyId: result.user.companyId,
        role: result.user.role
      })

      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          companyId: result.user.companyId,
          companyName: result.company.name,
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`,
          permissions: ['all'],
          createdAt: result.user.createdAt.toISOString()
        },
        token,
        message: 'Company and admin account created successfully'
      })
    }

    // Employee Login
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password required' },
          { status: 400 }
        )
      }

      // Use Prisma to find user
      const { prisma } = await import('@/lib/prisma')
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: { company: true }
      })

      console.log('[Auth] Login attempt for:', email)
      console.log('[Auth] User found:', user ? user.id : 'none')

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found. Contact your company administrator.' },
          { status: 401 }
        )
      }

      // For now, skip password check (add bcrypt later)
      // In production, compare hashed passwords

      // Generate token
      const token = generateJWT({
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role
      })

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company.name,
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`,
          permissions: user.role === 'OWNER' ? ['all'] : ['view', 'edit', 'collaborate'],
          createdAt: user.createdAt.toISOString()
        },
        token
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/verify - Verify JWT token
 * Returns user data if token is valid
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

    return NextResponse.json({
      success: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: user?.name || payload.email.split('@')[0],
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

/**
 * DELETE /api/auth - Logout (clear token client-side)
 */
export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  })
}
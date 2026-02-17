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

      // Check if user already exists
      const existingUser = Array.from(users.values()).find(u => u.email === email)
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User already exists' },
          { status: 409 }
        )
      }

      // Create company
      const companyId = generateId('comp')
      
      // Create OWNER user first
      const userId = generateId('user')
      const user = {
        id: userId,
        email,
        name,
        password, // ✅ Store password for login
        companyId,
        role: 'OWNER' as const,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`,
        permissions: ['all'],  // OWNER has all permissions
        createdAt: new Date().toISOString()
      }

      // Save company with owner ID
      const company = {
        id: companyId,
        name: companyName,
        ownerId: userId,
        ownerEmail: email,
        createdAt: new Date().toISOString()
      }
      companies.set(companyId, company)
      users.set(userId, user)

      // Generate token
      const token = generateJWT(user)

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: company.name,
          avatar: user.avatar,
          permissions: user.permissions,
          createdAt: user.createdAt
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

        // Find user by email
        const user = Array.from(users.values()).find(u => u.email === email)

        console.log('[Auth] Login attempt for:', email)
        console.log('[Auth] Users count:', users.size)
        console.log('[Auth] User found:', user ? user.id : 'none')

        if (!user) {
          return NextResponse.json(
            { success: false, error: 'User not found. Contact your company administrator.' },
            { status: 401 }
          )
        }

        // Note: In production, passwords should be hashed with bcrypt, not compared directly
        // This is a simplified version for demonstration
        const passwordMatch = constantTimeCompare(password, user.password || '')
        console.log('[Auth] Password match:', passwordMatch)

        if (!passwordMatch) {
          return NextResponse.json(
            { success: false, error: 'Invalid password' },
            { status: 401 }
          )
        }

      // Check if employee has accepted invite (only if created via invite system)
      // Employees created directly via API don't need to accept invites
      if (user.role === 'EMPLOYEE' && user.inviteStatus && user.inviteStatus !== 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Please accept your team invite to login' },
          { status: 403 }
        )
      }

      // Generate token
      const token = generateJWT(user)
      const company = companies.get(user.companyId)

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: company?.name || '',
          avatar: user.avatar,
          permissions: user.permissions,
          createdAt: user.createdAt
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
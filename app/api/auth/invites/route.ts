import { NextRequest, NextResponse } from 'next/server'
import { users, companies, teamInvites, generateId, verifyJWT } from '@/lib/auth-storage'

/**
 * POST /api/auth/invites
 * OWNER creates team invites for employees
 * 
 * Body: { action: 'create', emails: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    const payload = verifyJWT(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user from payload
    const user = users.get(payload.sub)
    
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only company owners can create invites' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, emails } = body

    // Create invite(s)
    if (action === 'create') {
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Emails array required' },
          { status: 400 }
        )
      }

      const createdInvites = []

      for (const email of emails) {
        // Check if user already exists
        const existingUser = Array.from(users.values()).find(u => u.email === email)
        if (existingUser) {
          continue  // User already in company, skip
        }

        const inviteId = generateId('inv')
        const invite = {
          id: inviteId,
          companyId: user.companyId,
          email,
          status: 'pending',
          createdAt: new Date().toISOString(),
          acceptedAt: null
        }

        teamInvites.set(inviteId, invite)
        createdInvites.push(invite)
      }

      return NextResponse.json({
        success: true,
        invites: createdInvites,
        message: `Invited ${createdInvites.length} user(s)`
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Invite creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invites' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/invites?email=user@company.com
 * Check if user has pending invite
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      )
    }

    const invite = Array.from(teamInvites.values()).find(i => i.email === email && i.status === 'pending')

    if (!invite) {
      return NextResponse.json({
        success: false,
        error: 'No pending invite found'
      })
    }

    // Get company info
    const company = companies.get(invite.companyId)

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        companyId: invite.companyId,
        companyName: company?.name || '',
        email: invite.email,
        status: invite.status,
        createdAt: invite.createdAt
      }
    })
  } catch (error) {
    console.error('Invite check error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check invite' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/invites/:id
 * Accept team invite and create employee account
 * 
 * Body: { action: 'accept', password, name }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, password, name, inviteId } = body

    if (action === 'accept') {
      if (!inviteId || !password || !name) {
        return NextResponse.json(
          { success: false, error: 'Invite ID, password, and name required' },
          { status: 400 }
        )
      }

      const invite = teamInvites.get(inviteId)

      if (!invite) {
        return NextResponse.json(
          { success: false, error: 'Invite not found' },
          { status: 404 }
        )
      }

      if (invite.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Invite already used' },
          { status: 410 }
        )
      }

      // Create employee user
      const userId = generateId('user')
      const user = {
        id: userId,
        email: invite.email,
        name,
        password, // Store password for login
        companyId: invite.companyId,
        role: 'EMPLOYEE' as const,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${invite.email}`,
        permissions: ['read', 'write'],  // EMPLOYEE default permissions
        inviteStatus: 'accepted',
        createdAt: new Date().toISOString()
      }

      // Store user and update invite
      users.set(userId, user)
      invite.status = 'accepted'
      invite.acceptedAt = new Date().toISOString()

      const company = companies.get(invite.companyId)

      return NextResponse.json({
        success: true,
        message: 'Invite accepted. You can now login.',
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
        }
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Invite acceptance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept invite' },
      { status: 500 }
    )
  }
}

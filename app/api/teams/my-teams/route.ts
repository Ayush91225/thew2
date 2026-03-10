import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth-storage'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyJWT(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    // Get teams where user is a member
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId: payload.sub },
      include: {
        team: {
          include: {
            company: true,
            members: {
              include: { user: true }
            }
          }
        }
      }
    })

    const teams = teamMembers.map(tm => ({
      id: tm.team.id,
      name: tm.team.name,
      role: tm.role,
      joinedAt: tm.joinedAt,
      memberCount: tm.team.members.length,
      members: tm.team.members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role
      }))
    }))

    return NextResponse.json({ success: true, teams })
  } catch (error) {
    console.error('My teams error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch teams' }, { status: 500 })
  }
}

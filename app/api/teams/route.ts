import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth-storage'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        company: true,
        teamHead: true,
        members: {
          include: { user: true }
        }
      }
    })
    
    // Transform to match expected format
    const formattedTeams = teams.map(team => ({
      id: team.id,
      name: team.name,
      description: '',
      members: team.members.map(m => ({
        id: m.user.id,
        name: m.user.name || '',
        email: m.user.email,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${m.user.email}`,
        role: m.role as 'lead' | 'developer' | 'designer',
        status: 'offline' as const,
        lastSeen: m.joinedAt.toISOString()
      })),
      workspace: {
        id: `workspace-${team.id}`,
        teamId: team.id,
        files: [],
        activeFiles: [],
        sharedState: {
          mode: 'SOLO' as const,
          activeMembers: []
        }
      },
      createdAt: team.createdAt.toISOString(),
      lastActivity: team.createdAt.toISOString()
    }))
    
    return NextResponse.json({ success: true, teams: formattedTeams })
  } catch (error) {
    console.error('Teams API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only owners can create teams' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Team name required' },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: {
        name,
        companyId: payload.companyId
      },
      include: {
        company: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team
    })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    )
  }
}

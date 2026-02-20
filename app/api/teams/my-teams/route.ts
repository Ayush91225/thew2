import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth-storage'
import { teamService } from '@/lib/team-service'

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
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const allTeams = teamService.getAllTeams()
    const myTeams = allTeams.filter(team =>
      team.members.some(member => member.id === payload.sub)
    )

    return NextResponse.json({
      success: true,
      teams: myTeams
    })
  } catch (error) {
    console.error('Get employee teams error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

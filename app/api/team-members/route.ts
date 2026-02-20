import { NextRequest, NextResponse } from 'next/server'
import { users, verifyJWT, teamNotifications, generateId } from '@/lib/auth-storage'
import { teamService } from '@/lib/team-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { teamId, employeeId } = await request.json()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyJWT(token)

    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Only company owners can add team members' }, { status: 403 })
    }

    if (!employeeId || !teamId) {
      return NextResponse.json({ success: false, error: 'Employee ID and Team ID required' }, { status: 400 })
    }

    const employee = users.get(employeeId)
    if (!employee || employee.companyId !== payload.companyId) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    const team = teamService.getTeam(teamId)
    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 })
    }

    const member = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      avatar: employee.avatar,
      status: 'offline' as const,
      role: 'developer' as const
    }

    teamService.addMember(teamId, member)

    const notificationId = generateId('notif')
    teamNotifications.set(notificationId, {
      id: notificationId,
      userId: employee.id,
      teamId,
      teamName: team.name,
      type: 'team_added',
      message: `You have been added to ${team.name}`,
      read: false,
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true, message: 'Employee added to team', member })
  } catch (error) {
    console.error('Add team member error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add team member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const teamId = url.searchParams.get('teamId')
    const memberId = url.searchParams.get('memberId')
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyJWT(token)

    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Only company owners can remove team members' }, { status: 403 })
    }

    if (!memberId || !teamId) {
      return NextResponse.json({ success: false, error: 'Member ID and Team ID required' }, { status: 400 })
    }

    teamService.removeMember(teamId, memberId)

    const employee = users.get(memberId)
    if (employee) {
      const team = teamService.getTeam(teamId)
      if (team) {
        const notificationId = generateId('notif')
        teamNotifications.set(notificationId, {
          id: notificationId,
          userId: employee.id,
          teamId,
          teamName: team.name,
          type: 'team_removed',
          message: `You have been removed from ${team.name}`,
          read: false,
          createdAt: new Date().toISOString()
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Member removed from team' })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove team member' }, { status: 500 })
  }
}

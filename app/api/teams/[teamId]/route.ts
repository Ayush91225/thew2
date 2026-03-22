import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await context.params
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: { include: { user: true } }
      }
    })
    if (!team) return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 })
    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        members: team.members.map(m => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role
        }))
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch team' }, { status: 500 })
  }
}

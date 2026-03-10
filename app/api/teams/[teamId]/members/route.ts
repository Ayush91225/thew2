import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth-storage'

export async function POST(request: NextRequest, context: { params: Promise<{ teamId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyJWT(token)

    if (!payload || payload.role !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Only owners can add members' }, { status: 403 })
    }

    const { userId, role = 'developer' } = await request.json()
    const params = await context.params
    const teamId = params.teamId

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    // Check if member already exists
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'User already in team' }, { status: 409 })
    }

    // Add member
    const member = await prisma.teamMember.create({
      data: { teamId, userId, role },
      include: { user: true, team: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
      member
    })
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add member' }, { status: 500 })
  }
}

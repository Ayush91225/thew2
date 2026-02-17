import { NextRequest, NextResponse } from 'next/server'
import { users, verifyJWT } from '@/lib/auth-storage'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * DELETE /api/auth/employees/:id - Delete employee (OWNER only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const employeeId = params.id

    // Verify OWNER authorization
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

    // Get requesting user (should be OWNER)
    const admin = users.get(payload.sub)
    if (!admin || admin.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only company owners can delete employees' },
        { status: 403 }
      )
    }

    // Get employee
    const employee = users.get(employeeId)
    if (!employee || employee.companyId !== admin.companyId) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Prevent deleting other owners
    if (employee.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete company owner' },
        { status: 400 }
      )
    }

    users.delete(employeeId)

    return NextResponse.json({
      success: true,
      message: 'Employee removed successfully'
    })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

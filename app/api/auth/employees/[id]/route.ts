import { NextRequest, NextResponse } from 'next/server'
import { users, verifyJWT } from '@/lib/auth-storage'

// Use inline typing for route params to satisfy Next.js types

/**
 * DELETE /api/auth/employees/:id - Delete employee (OWNER only)
 */
export async function DELETE(request: NextRequest, context: any) {
  try {
    const employeeId = context?.params?.id

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

    // Check authorization directly from token payload
    if (payload.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only company owners can delete employees' },
        { status: 403 }
      )
    }

    // Get employee
    const employee = users.get(employeeId)
    if (!employee || employee.companyId !== payload.companyId) {
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

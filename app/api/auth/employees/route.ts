import { NextRequest, NextResponse } from 'next/server'
import { users, companies, generateId, verifyJWT } from '@/lib/auth-storage'

/**
 * POST /api/auth/employees - Create new employee (OWNER only)
 * Body: { email, password, name }
 * Returns new employee user with credentials
 */
export async function POST(request: NextRequest) {
  try {
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
    console.log('[Create Employee] Looking for user with ID:', payload.sub)
    const admin = Array.from(users.values()).find(u => u.id === payload.sub)
    
    if (!admin) {
      console.log('[Create Employee] User not found. Available users:', Array.from(users.keys()))
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (admin.role !== 'OWNER') {
      console.log('[Create Employee] User role is:', admin.role)
      return NextResponse.json(
        { success: false, error: 'Only company owners can create employees' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if employee already exists
    const existingUser = Array.from(users.values()).find(
      u => u.email === email && u.companyId === admin.companyId
    )
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Employee with this email already exists' },
        { status: 409 }
      )
    }

    // Create new employee
    const employeeId = generateId('user')
    const employee = {
      id: employeeId,
      email,
      name,
      password, // In production, hash this with bcrypt!
      companyId: admin.companyId,
      role: 'EMPLOYEE' as const,
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`,
      permissions: ['view', 'edit', 'collaborate'],
      status: 'active',
      createdBy: admin.id,
      createdAt: new Date().toISOString()
    }

    users.set(employeeId, employee)
    console.log('[Create Employee] Employee created:', employeeId)

    const company = companies.get(admin.companyId)

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        companyId: employee.companyId,
        companyName: company?.name || '',
        avatar: employee.avatar,
        permissions: employee.permissions,
        status: employee.status,
        createdAt: employee.createdAt
      }
    })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/employees - List employees in company (OWNER only)
 */
export async function GET(request: NextRequest) {
  try {
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
    const admin = Array.from(users.values()).find(u => u.id === payload.sub)
    if (!admin || admin.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only company owners can view employees' },
        { status: 403 }
      )
    }

    // Get all employees in company
    const employees = Array.from(users.values()).filter(
      u => u.companyId === admin.companyId && u.role === 'EMPLOYEE'
    )

    return NextResponse.json({
      success: true,
      count: employees.length,
      employees: employees.map(e => ({
        id: e.id,
        email: e.email,
        name: e.name,
        role: e.role,
        status: e.status,
        createdAt: e.createdAt
      }))
    })
  } catch (error) {
    console.error('List employees error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/employees/:id - Remove employee (OWNER only)
 */
export async function DELETE(request: NextRequest) {
  try {
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
    const admin = Array.from(users.values()).find(u => u.id === payload.sub)
    if (!admin || admin.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only company owners can delete employees' },
        { status: 403 }
      )
    }

    // Get employee ID from URL
    const url = new URL(request.url)
    const employeeId = url.pathname.split('/').pop()

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID required' },
        { status: 400 }
      )
    }

    const employee = users.get(employeeId)
    if (!employee || employee.companyId !== admin.companyId) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
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

# Employee Management System - Implementation Guide

## Overview

The employee management system allows company **owners** to create and manage employee accounts directly in the database. Employees can then login with their credentials and access the **Employee Dashboard** (/employee).

---

## Architecture

### Key Components

1. **Backend API** (`/api/auth/employees`)
   - POST: Create new employee
   - GET: List all employees
   - DELETE: Remove employee

2. **Frontend Components**
   - `EmployeeManagement.tsx` - Admin UI for managing employees
   - `app/employee/page.tsx` - Employee dashboard

3. **Data Storage**
   - `/lib/auth-storage.ts` - Shared authentication storage (in-memory, ready for database migration)

---

## Core Features

### 1. **Admin Creates Employee**

**Flow:**
```
Admin (OWNER) → Admin Dashboard → Employees Section
→ Click "Add Employee" → Fill Form (Name, Email, Password)
→ Employee Created → Added to database
```

**API Endpoint:**
```bash
POST /api/auth/employees
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "employee": {
    "id": "user_1771230...",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "EMPLOYEE",
    "companyId": "comp_1771230...",
    "companyName": "Test Company Inc",
    "status": "active",
    "createdAt": "2026-02-16T..."
  }
}
```

### 2. **Employee Login**

**Flow:**
```
Employee → Login Page (/login)
→ Enter Email → No invite detected
→ Enter Password → Login successful  
→ Redirected to /employee dashboard
```

**API Endpoint:**
```bash
POST /api/auth
Content-Type: application/json

{
  "action": "login",
  "email": "john@company.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_1771230...",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "EMPLOYEE",
    "companyId": "comp_1771230...",
    "companyName": "Test Company Inc",
    "avatar": "https://api.dicebear.com/...",
    "permissions": ["view", "edit", "collaborate"],
    "createdAt": "2026-02-16T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. **Employee Dashboard**

Employees are automatically redirected to `/employee` after login, which displays:
- Welcome message with company name
- Quick stats (Company, Role, Join date)
- Assigned tasks section
- Recent activity
- User profile information
- Logout button

---

## Admin Interface

### Location
`/admin` → **Employees** tab

### Features

#### Add Employee
- Form with Name, Email, Password fields
- Password minimum 6 characters
- Email uniqueness validation per company
- Real-time list update after creation

#### View Employees
- Table with all active employees
- Shows: Name, Email, Status, Join Date
- Sortable and searchable

#### Delete Employee
- Confirmation dialog
- Removes employee from system
- Cannot be undone

### Component: `EmployeeManagement.tsx`

Located at: `/components/admin/EmployeeManagement.tsx`

```tsx
// Key Features
- Fetches employee list on mount
- Token-based API authentication
- Error/success notifications
- Loading states
- Form validation
```

---

## Authentication & Authorization

### Requirements

✅ **Admin (OWNER)**
- Can create employees ✓
- Can view all employees ✓
- Can delete employees ✓

❌ **Employee**
- Cannot create employees ✓
- Cannot delete employees ✓
- Can only view their own profile ✓

### Authorization Check

All employee management endpoints verify:
1. User has valid JWT token
2. Token is not expired
3. User role is OWNER

```typescript
// From /api/auth/employees/route.ts
const admin = Array.from(users.values()).find(u => u.id === payload.sub)
if (!admin || admin.role !== 'OWNER') {
  return NextResponse.json(
    { success: false, error: 'Only company owners can create employees' },
    { status: 403 }
  )
}
```

---

## Database Schema (Ready for Migration)

### Users Table
```typescript
interface User {
  id: string                    // "user_" + timestamp + random
  email: string                 // unique per company
  name: string
  password: string              // MUST hash with bcrypt in production
  companyId: string
  role: 'OWNER' | 'EMPLOYEE'
  avatar?: string
  permissions: string[]
  status?: string              // 'active', 'inactive', 'suspended'
  inviteStatus?: string        // 'pending', 'accepted' (for invite flow)
  createdBy?: string           // admin who created this user
  createdAt: string            // ISO timestamp
}
```

### Companies Table
```typescript
interface Company {
  id: string                    // "comp_" + timestamp + random
  name: string
  ownerId: string              // references Users.id
  ownerEmail: string
  createdAt: string
}
```

---

## API Endpoints

### POST /api/auth/employees
**Create new employee (OWNER only)**

| Parameter | Type | Required | Validation |
|-----------|------|----------|-----------|
| name | string | ✓ | Non-empty |
| email | string | ✓ | Valid email, unique per company |
| password | string | ✓ | Min 6 characters |

**Status Codes:**
- `200`: Success
- `400`: Validation error
- `401`: No/invalid token
- `403`: Not authorized (not OWNER)
- `409`: Email already exists in company
- `500`: Server error

---

### GET /api/auth/employees
**List all employees in company (OWNER only)**

**Response:**
```json
{
  "success": true,
  "count": 5,
  "employees": [
    {
      "id": "user_...",
      "email": "emp1@company.com",
      "name": "Employee 1",
      "role": "EMPLOYEE",
      "status": "active",
      "createdAt": "2026-02-16T..."
    }
  ]
}
```

---

### DELETE /api/auth/employees/:id
**Remove employee (OWNER only)**

**Response:**
```json
{
  "success": true,
  "message": "Employee removed successfully"
}
```

---

## Login Flow Logic

The login system automatically detects:
1. **Pending Invite** → Show invite acceptance flow
2. **Direct Employee** → Show credentials form
3. **Admin/Owner** → Show credentials form

```typescript
// From app/login/page.tsx
const handleEmailSubmit = async (e: React.FormEvent) => {
  // Check if user has pending invite
  const pendingInvite = await checkInvite(email)

  if (pendingInvite) {
    // Invite flow
    setStep('accept-invite')
  } else {
    // Direct login
    setStep('credentials')
  }
}
```

---

## Redirect Logic

**After Login:**
```typescript
if (user.role === 'OWNER') {
  router.push('/admin')        // Admin dashboard
} else if (user.role === 'EMPLOYEE') {
  router.push('/employee')     // Employee dashboard
} else {
  router.push('/login')        // Invalid role
}
```

---

## Security Considerations

⚠️ **Current Implementation (Development Only)**
- Passwords stored as plaintext
- JWT secret hardcoded in code
- Token expires in 7 days

✅ **Production Requirements**
- Hash passwords with bcrypt (min cost factor 12)
- Use environment variables for JWT_SECRET
- Implement token refresh mechanism
- Add rate limiting on auth endpoints
- Use HTTPS everywhere
- Add CORS properly configured
- Implement audit logging
- Add email verification
- Add password strength requirements

---

## Testing

### Manual Test Flow

```bash
# 1. Register Admin
POST /api/auth
{
  "action": "register-admin",
  "email": "admin@test.com",
  "password": "AdminPass123",
  "name": "Admin",
  "companyName": "TestCorp"
}
→ Get: token, user with OWNER role

# 2. Create Employee
POST /api/auth/employees
Authorization: Bearer {admin_token}
{
  "name": "John",
  "email": "john@test.com",
  "password": "JohnPass123"
}
→ Get: employee created response

# 3. List Employees
GET /api/auth/employees
Authorization: Bearer {admin_token}
→ Get: list with 1 employee

# 4. Employee Login
POST /api/auth
{
  "action": "login",
  "email": "john@test.com",
  "password": "JohnPass123"
}
→ Get: token, user with EMPLOYEE role

# 5. Access Employee Dashboard
GET /employee?token=...
→ See employee dashboard
```

### Automated Test Script

See `/tmp/test_employee_flow.py` for complete test suite.

```bash
python3 test_employee_flow.py
```

---

## File Structure

```
app/
├── api/
│   └── auth/
│       ├── route.ts              # Main auth endpoints
│       ├── employees/
│       │   └── route.ts          # Employee management endpoints
│       └── invites/
│           └── route.ts          # Team invites
├── employee/
│   └── page.tsx                  # Employee dashboard
└── admin/
    └── page.tsx                  # Admin dashboard

components/
├── admin/
│   ├── EmployeeManagement.tsx    # Employee management UI
│   └── AdminLayout.tsx           # Admin sidebar with "Employees" tab
└── auth/
    └── AuthGuard.tsx             # Protected route

lib/
└── auth-storage.ts              # Shared auth storage & utilities
```

---

## Next Steps / Enhancements

### Phase 2
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Password hashing with bcrypt
- [ ] Email verification for new employees
- [ ] Password reset flow
- [ ] Employee profile editing
- [ ] Bulk employee import (CSV)
- [ ] Employee deactivation (soft delete)
- [ ] Activity logging

### Phase 3
- [ ] Two-factor authentication
- [ ] SSO integration (OAuth2/SAML)
- [ ] Team/department management
- [ ] Role-based permissions system
- [ ] Employee directory
- [ ] Time tracking
- [ ] Leave management

---

## Troubleshooting

### Employee Can't Login
- **Check**: Employee exists in database
- **Check**: Password is correct
- **Check**: Email matches exactly
- **Check**: User role is EMPLOYEE

### Admin Can't Create Employees
- **Check**: User role is OWNER
- **Check**: JWT token is valid
- **Check**: Token not expired

### Employee Sees Admin Dashboard
- **Check**: Login redirects to correct page based on role
- **Check**: No cached redirect in browser

---

## Version Info

- Created: February 16, 2026
- Status: Production Ready (with caveats)
- Last Updated: February 16, 2026

---

**Questions?** Check the authentication guide at `/docs/BACKEND_AUTH_SYSTEM.md`

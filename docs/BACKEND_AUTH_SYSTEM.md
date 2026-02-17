# Backend-Driven Authentication System

## Overview

KRIYA v2.0 now uses a **backend-driven authentication system** where the backend is the single source of truth for all user authentication, authorization, and role management. This replaces the previous client-side role selection model.

## Key Principles

### 1. **Backend is Single Source of Truth**
- All authentication decisions are made by the backend
- Frontend only consumes backend-verified state
- JWT tokens are issued and verified server-side
- User roles and permissions are determined by backend

### 2. **Company-Based User Model**
- Every user belongs to exactly one company
- Only one OWNER exists per company (created during admin registration)
- All other users are EMPLOYEES by default
- Employees need team invites before they can log in

### 3. **Role-Based Access Control**

#### OWNER Role
- Created during company registration
- Full system access
- Can invite employees to company
- Permissions: `['all']`

#### EMPLOYEE Role
- Added to company via team invite
- Cannot self-register
- Can only log in after accepting team invite
- Default permissions: `['read', 'write']`

## Authentication Flow

### Admin (OWNER) Registration

```
1. User visits /register
2. User fills in: company name, name, email, password
3. Frontend POST to /api/auth with 'register-admin' action
4. Backend:
   - Creates company entry
   - Creates OWNER user
   - Issues JWT token
   - Stores in database/storage
5. Frontend:
   - Stores JWT in localStorage
   - Stores user data in Zustand
   - Redirects to /admin dashboard
```

### Employee Invitation & Signup

```
1. OWNER visits /admin team management
2. OWNER enters employee email addresses
3. Frontend POST to /api/auth/invites with emails
4. Backend:
   - Creates invite entries with 'pending' status
   - Stores invites in database
   - (Optional: sends email with invite link)
5. Employee:
   - Receives invite notification/email
   - Visits /login and enters email
   - Frontend checks /api/auth/invites?email=user@company.com
   - Backend returns pending invite details
   - Employee sees accept invite form
   - Fills in name and password
   - Frontend PUT to /api/auth/invites with 'accept' action
6. Backend:
   - Creates EMPLOYEE user
   - Marks invite as 'accepted'
   - Employee can now login
```

### Employee Login

```
1. User visits /login
2. Enters email
3. Frontend checks /api/auth/invites?email=user@company.com
   - If pending invite: show accept-invite flow
   - If no invite: show credentials form
4. User enters password
5. Frontend POST to /api/auth with 'login' action
6. Backend:
   - Validates credentials
   - Verifies user has accepted invite (if EMPLOYEE)
   - Issues JWT token
   - Returns user data
7. Frontend stores token and redirects
```

### Token Verification

```
1. When app loads or user navigates:
2. AuthGuard checks localStorage for token
3. If token exists:
   - Frontend GET /api/auth/verify with Bearer token
   - Backend verifies JWT signature
   - Backend returns verified user data
   - Frontend updates Zustand store
   - If token invalid: redirect to login
4. All subsequent API calls include Authorization: Bearer <token>
```

## API Endpoints

### Authentication

#### POST /api/auth
**Admin Registration**
```json
{
  "action": "register-admin",
  "email": "admin@company.com",
  "password": "secure-password",
  "name": "John Doe",
  "companyName": "Acme Corp"
}
```

Response: User + JWT token

**Employee Login**
```json
{
  "action": "login",
  "email": "employee@company.com",
  "password": "password"
}
```

Response: User + JWT token

#### GET /api/auth/verify
**Verify JWT Token**
```
Authorization: Bearer <token>
```

Response: Verified user data

#### DELETE /api/auth
**Logout**
```
Clears token on frontend (backend doesn't maintain sessions)
```

### Team Invites

#### POST /api/auth/invites
**Create Invites (OWNER only)**
```json
{
  "action": "create",
  "emails": ["emp1@company.com", "emp2@company.com"]
}
Authorization: Bearer <token>
```

Response: Created invites

#### GET /api/auth/invites?email=user@company.com
**Check Pending Invite**

Response: Invite details if pending exists

#### PUT /api/auth/invites
**Accept Invite & Create Account**
```json
{
  "action": "accept",
  "inviteId": "inv_...",
  "password": "new-password",
  "name": "Employee Name"
}
```

Response: Created user + success message

## Data Types

### User
```typescript
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'OWNER' | 'EMPLOYEE'
  companyId: string
  companyName: string
  permissions: string[]
  createdAt: string
}
```

### Company
```typescript
interface Company {
  id: string
  name: string
  ownerId: string
  ownerEmail: string
  createdAt: string
}
```

### TeamInvite
```typescript
interface TeamInvite {
  id: string
  companyId: string
  email: string
  status: 'pending' | 'accepted'
  createdAt: string
  acceptedAt?: string
}
```

### JWT Payload
```typescript
interface JWTPayload {
  sub: string          // user ID
  email: string
  companyId: string
  role: 'OWNER' | 'EMPLOYEE'
  iat: number
  exp: number
}
```

## Frontend Services

### AuthService (lib/auth-service.ts)
Singleton service managing authentication operations:

**Methods:**
- `registerAdmin(email, password, name, companyName)` - Register as admin
- `login(email, password)` - Login with credentials
- `checkInvite(email)` - Check if email has pending invite
- `acceptInvite(inviteId, password, name)` - Accept invite
- `verifyToken(token)` - Verify JWT with backend
- `logout()` - Clear auth state
- `createTeamInvites(emails)` - Create invites (OWNER only)
- `isOwner()` - Check if current user is OWNER
- `isEmployee()` - Check if current user is EMPLOYEE

### Zustand Store (stores/slices/auth-slice.ts)
State management for auth:

**State:**
- `user` - Current logged in user
- `isAuthenticated` - Auth status
- `token` - JWT token
- `error` - Error message
- `isLoading` - Loading state

**Actions:**
- `registerAdmin()` - Register admin
- `login()` - Login user
- `checkInvite()` - Check invite
- `acceptInvite()` - Accept invite
- `verifyToken()` - Verify token
- `logout()` - Logout user
- `clearError()` - Clear error state

## UI Components

### AuthGuard (components/auth/AuthGuard.tsx)
Protects routes by verifying:
- Token with backend
- User authentication status
- Role-based access (optional)

### TeamInviteManager (components/TeamInviteManager.tsx)
Allows OWNER to:
- Enter employee email addresses
- Send batch invites
- See invite creation status

### Login Page (app/login/page.tsx)
Handles:
- Email entry
- Invite checking
- Invite acceptance (with name & password)
- Credential-based login
- Error handling

### Register Page (app/register/page.tsx)
Handles admin registration:
- Company name
- Admin name & email
- Password creation
- Company + admin account creation

## Storage

### Client-Side (localStorage)
```javascript
// Token stored in localStorage
localStorage.setItem('KRIYA_TOKEN', jwtToken)

// Optional: User data for quick access
localStorage.setItem('kriya-auth', JSON.stringify({
  user,
  token,
  isAuthenticated: true
}))
```

### Server-Side (Backend Database)
- Companies table
- Users table
- TeamInvites table
- JWT secret for signature verification

## Security Considerations

### ✅ Implemented
1. **Backend validation** - All auth decisions made by backend
2. **JWT tokens** - Secure token-based authentication
3. **Constant-time comparison** - Prevent timing attacks on passwords
4. **No client-side role assignment** - Roles come from backend only
5. **Token verification** - Every request includes token verification

### ⚠️ For Production (Not Yet Implemented)
1. **Password hashing** - Use bcrypt instead of plaintext
2. **HTTPS only** - Enforce secure token transmission
3. **HTTP-only cookies** - Store tokens in http-only cookies (optional)
4. **Rate limiting** - Limit login attempts per IP/email
5. **Email verification** - Verify email before accepting invite
6. **Password reset flow** - Secure password recovery
7. **Token refresh** - Implement refresh token rotation
8. **CORS configuration** - Restrict to known domains
9. **CSP headers** - Content Security Policy
10. **Audit logging** - Log all auth events

## Error Scenarios

### Registration Errors
- Email already exists → 409 Conflict
- Missing required fields → 400 Bad Request
- Invalid email format → 400 Bad Request

### Login Errors
- User not found → 401 Unauthorized
- Wrong password → 401 Unauthorized
- Invite not accepted → 403 Forbidden
- Invalid token → 401 Unauthorized

### Invite Errors
- No pending invite → Can't accept
- Invite already used → 410 Gone
- Only OWNER can create invites → 403 Forbidden

## Workflow Examples

### Example 1: Company Admin Creates Account

```
1. Go to /register
2. Enter: Company Name "Acme", Name "John", Email "john@acme.com", Password "secure123"
3. System creates:
   - Company {id: "comp_123", name: "Acme", ownerId: "user_456"}
   - User {id: "user_456", email: "john@acme.com", role: "OWNER", companyId: "comp_123"}
   - Issues JWT token
4. Redirected to /admin dashboard
```

### Example 2: Admin Invites Employee

```
1. In /admin/team, admin enters emails: ["emp1@acme.com", "emp2@acme.com"]
2. Frontend sends POST /api/auth/invites with Bearer token
3. Backend creates:
   - TeamInvite {id: "inv_789", email: "emp1@acme.com", status: "pending"}
   - TeamInvite {id: "inv_790", email: "emp2@acme.com", status: "pending"}
4. Admin gets confirmation message
```

### Example 3: Employee Accepts Invite & Logs In

```
1. Employee goes to /login and enters "emp1@acme.com"
2. Frontend GET /api/auth/invites?email=emp1@acme.com
3. Backend returns pending invite
4. Frontend shows "Accept this invite" form
5. Employee enters: Name "Alice", Password "password123"
6. Frontend PUT /api/auth/invites with invite acceptance
7. Backend creates:
   - User {id: "user_999", email: "emp1@acme.com", role: "EMPLOYEE", companyId: "comp_123"}
   - Updates invite status to "accepted"
8. Employee can now login with credentials
```

## Testing the System

### Test Credentials
Current development mode uses simplified auth. For testing:

1. **Register Admin:**
   - Visit `/register`
   - Fill in company details
   - Create account

2. **Invite Employees:**
   - In admin dashboard
   - Use TeamInviteManager component
   - Enter employee emails

3. **Accept Invite:**
   - Share invite with employees
   - Employees visit `/login`
   - Check invite → Accept form
   - Set password and name

4. **Login:**
   - Use email and password set during registration/invite acceptance

## Migration from Old System

### What Changed
- ❌ Client-side role selection removed
- ❌ Mock user login removed
- ✅ Backend-driven auth implemented
- ✅ JWT token validation implemented
- ✅ Company-based user model implemented
- ✅ Team invite system implemented

### Components Not Deleted (Refactored)
- `AuthService` - Now calls backend endpoints
- `auth-slice` - Now manages backend auth state
- `AuthGuard` - Now verifies tokens with backend
- Login page - Now handles backend-driven flow
- Auth types - Updated for new model

### New Components
- `/register` page - Admin registration
- `TeamInviteManager` - Invite management
- `/api/auth/invites` - Invite endpoints
- JWT verification logic - Token validation

## Debugging

### Check Local Storage
```javascript
// In browser console
JSON.parse(localStorage.getItem('kriya-auth'))
// or
localStorage.getItem('KRIYA_TOKEN')
```

### Test Backend Endpoints
```bash
# Check backend is running
curl http://localhost:8080/health

# Test registration
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register-admin",
    "email": "admin@test.com",
    "password": "test123",
    "name": "Test Admin",
    "companyName": "Test Corp"
  }'

# Test verify token
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer <token>"
```

### Check Auth Store
```javascript
// In React component
const { user, isAuthenticated, token } = useIDEStore()
console.log('Current user:', user)
console.log('Is authenticated:', isAuthenticated)
console.log('Token:', token)
```

## Future Improvements

1. **Email verification** - Send verification emails for invites
2. **Two-factor authentication** - Add 2FA for additional security
3. **SSO integration** - Support SAML/OAuth for enterprise
4. **Password reset** - Forgot password flow  
5. **Role customization** - Custom roles beyond OWNER/EMPLOYEE
6. **Team hierarchies** - Department/team management
7. **Activity audit** - Log all authentication events
8. **Device management** - Manage trusted devices
9. **Session management** - Multiple concurrent sessions
10. **Delegation** - OWNER delegate to admin roles

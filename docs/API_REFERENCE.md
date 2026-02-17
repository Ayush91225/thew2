# API Reference - Authentication & Employee Management

> **Base URL**: `http://localhost:3000/api`  
> **Authentication**: Bearer token in `Authorization` header  
> **Content-Type**: `application/json`

---

## Authentication Endpoints

### POST /auth - Register Admin

Register a new company and create the OWNER account.

**Request**:
```http
POST /api/auth
Content-Type: application/json

{
  "action": "register-admin",
  "email": "admin@company.com",
  "password": "SecurePass123",
  "name": "Admin Name",
  "companyName": "Company Inc"
}
```

**Parameters**:

| Parameter | Type | Required | Validation |
|-----------|------|----------|-----------|
| action | string | ✓ | Must be `"register-admin"` |
| email | string | ✓ | Valid email format, unique globally |
| password | string | ✓ | Min 6 characters |
| name | string | ✓ | Non-empty |
| companyName | string | ✓ | Min 2 characters |

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "user_1771230931874_abc123",
    "email": "admin@company.com",
    "name": "Admin Name",
    "role": "OWNER",
    "companyId": "comp_1771230931874_xyz789",
    "companyName": "Company Inc",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin@company.com",
    "permissions": ["all"],
    "status": "active",
    "createdAt": "2026-02-16T10:30:45.123Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzE3NzEyMzA5MzE4NzRfYWJjMTIzIiwiZW1haWwiOiJhZG1pbkBjb21wYW55LmNvbSIsImNvbXBhbnlJZCI6ImNvbXBfMTc3MTIzMDkzMTg3NF94eXo3ODkiLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3Mzk2NjQ2NDUsImV4cCI6MTc0MDI2OTQ0NX0.abc123signature...",
  "redirect": "/admin"
}
```

**Error Responses**:

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid email format | Email not valid |
| 400 | Password must be at least 6 characters | Password too short |
| 400 | Name required | Empty name |
| 400 | Company name required | Empty company name |
| 409 | Email already exists | Email taken |
| 500 | Server error | Unexpected error |

---

### POST /auth - Login

Login with email and password.

**Request**:
```http
POST /api/auth
Content-Type: application/json

{
  "action": "login",
  "email": "user@company.com",
  "password": "UserPass123"
}
```

**Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| action | string | ✓ |
| email | string | ✓ |
| password | string | ✓ |

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "user_1771230931874_def456",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "EMPLOYEE",
    "companyId": "comp_1771230931874_xyz789",
    "companyName": "Company Inc",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john@company.com",
    "permissions": ["view", "edit", "collaborate"],
    "status": "active",
    "createdAt": "2026-02-16T11:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirect": "/employee"
}
```

**Login Detection**:
- **OWNER role** → `redirect: "/admin"`
- **EMPLOYEE role** → `redirect: "/employee"`

**Error Responses**:

| Status | Error | Cause |
|--------|-------|-------|
| 401 | User not found | Email not in system |
| 401 | Invalid password | Wrong password |
| 403 | Please accept your invite first | Pending invite (invite flow) |

---

### POST /auth - Logout

Logout and invalidate session.

**Request**:
```http
POST /api/auth
Content-Type: application/json

{
  "action": "logout"
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Employee Management Endpoints

### POST /auth/employees - Create Employee

Create a new employee account. **OWNER only**.

**Request**:
```http
POST /api/auth/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "EmployeePass123"
}
```

**Headers**:

| Header | Required | Format |
|--------|----------|--------|
| Authorization | ✓ | `Bearer {jwt_token}` |
| Content-Type | ✓ | `application/json` |

**Parameters**:

| Parameter | Type | Required | Validation |
|-----------|------|----------|-----------|
| name | string | ✓ | Non-empty |
| email | string | ✓ | Valid format, unique per company |
| password | string | ✓ | Min 6 characters |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Employee created successfully",
  "employee": {
    "id": "user_1771230931874_ghi789",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "EMPLOYEE",
    "companyId": "comp_1771230931874_xyz789",
    "companyName": "Company Inc",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john@company.com",
    "status": "active",
    "createdAt": "2026-02-16T12:00:00.000Z"
  }
}
```

**Error Responses**:

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Email is required | Missing email |
| 400 | Password must be at least 6 characters | Password too short |
| 401 | Missing or invalid token | No/invalid auth header |
| 403 | Only company owners can create employees | Not OWNER role |
| 409 | Email already exists in company | Duplicate email |
| 500 | Server error | Unexpected error |

---

### GET /auth/employees - List Employees

Get all employees in company. **OWNER only**.

**Request**:
```http
GET /api/auth/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 3,
  "employees": [
    {
      "id": "user_1771230931874_ghi789",
      "email": "john@company.com",
      "name": "John Doe",
      "role": "EMPLOYEE",
      "companyId": "comp_1771230931874_xyz789",
      "companyName": "Company Inc",
      "status": "active",
      "createdAt": "2026-02-16T12:00:00.000Z"
    },
    {
      "id": "user_1771230931874_jkl012",
      "email": "jane@company.com",
      "name": "Jane Smith",
      "role": "EMPLOYEE",
      "companyId": "comp_1771230931874_xyz789",
      "companyName": "Company Inc",
      "status": "active",
      "createdAt": "2026-02-16T12:30:00.000Z"
    }
  ]
}
```

**Query Parameters**: None

**Error Responses**:

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Missing or invalid token | No/invalid auth header |
| 403 | Unauthorized | EMPLOYEE role |

---

### DELETE /auth/employees/:id - Delete Employee

Remove an employee. **OWNER only**.

**Request**:
```http
DELETE /api/auth/employees/user_1771230931874_ghi789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| id | string | ✓ |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Employee removed successfully"
}
```

**Error Responses**:

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Missing or invalid token | No/invalid auth header |
| 403 | Unauthorized | EMPLOYEE role |
| 404 | Employee not found | Invalid ID |

---

## Team Invite Endpoints (Partial Implementation)

### POST /auth/invites - Create Invite

Send team invite to new employee. **OWNER only**.

**Request**:
```http
POST /api/auth/invites
Authorization: Bearer ...
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "EMPLOYEE"
}
```

**Parameters**:

| Parameter | Type | Required |
|-----------|------|----------|
| email | string | ✓ |
| role | string | ✓ |

**Response** (200 OK):
```json
{
  "success": true,
  "inviteToken": "invite_1771230931874_abc123",
  "inviteLink": "http://localhost:3000/login?invite=invite_1771230931874_abc123"
}
```

---

### POST /auth/invites/check - Check Pending Invite

Check if email has pending invite.

**Request**:
```http
POST /api/auth/invites/check
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

**Response**:
```json
{
  "hasPendingInvite": true,
  "inviteToken": "invite_1771230931874_abc123"
}
```

---

### POST /auth/invites/accept - Accept Invite

Accept team invite and set password.

**Request**:
```http
POST /api/auth/invites/accept
Content-Type: application/json

{
  "inviteToken": "invite_1771230931874_abc123",
  "password": "NewPassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "user_1771230931874_mno345",
    "email": "newuser@example.com",
    "role": "EMPLOYEE",
    "companyId": "comp_1771230931874_xyz789"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirect": "/employee"
}
```

---

## Authentication Pattern

### 1. **Get Token on Login**

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "user@company.com",
    "password": "password123"
  }'

# Response includes: token, user, redirect
```

### 2. **Store Token in Client**

```javascript
const data = response.json()
localStorage.setItem('auth_token', data.token)
localStorage.setItem('user', JSON.stringify(data.user))
```

### 3. **Send Token on Protected Requests**

```bash
curl -X GET http://localhost:3000/api/auth/employees \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. **Handle Token Expiration**

```javascript
const response = await fetch('/api/auth/employees', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

if (response.status === 401) {
  // Token expired or invalid
  localStorage.removeItem('auth_token')
  router.push('/login')
}
```

---

## JWT Structure

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "user_1771230931874_abc123",
  "email": "user@company.com",
  "companyId": "comp_1771230931874_xyz789",
  "role": "OWNER",
  "iat": 1739664645,
  "exp": 1740269445
}
```

### Signature
```
HMACSHA256(base64(header).base64(payload), secret)
```

### Token Lifespan
- **Valid for**: 7 days (604800 seconds)
- **Issued at**: `iat` timestamp
- **Expires at**: `exp` timestamp (iat + 604800)

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "E001"
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 409 | Conflict (resource exists) |
| 500 | Server error |

---

## Rate Limiting

⚠️ **Currently**: No rate limiting implemented  
✅ **Planned**: Add rate limiting to prevent abuse

Recommended limits:
- Login attempts: 5 per minute per IP
- API requests: 100 per minute per token
- Register: 1 per hour per IP

---

## Testing Examples

### cURL

**Register Admin**:
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register-admin",
    "email": "admin@test.com",
    "password": "AdminPass123",
    "name": "Admin",
    "companyName": "Test Corp"
  }'
```

**Create Employee**:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/api/auth/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "JohnPass123"
  }'
```

**List Employees**:
```bash
curl -X GET http://localhost:3000/api/auth/employees \
  -H "Authorization: Bearer $TOKEN"
```

### Python

```python
import requests
import json

BASE_URL = "http://localhost:3000/api"

# Register
response = requests.post(
  f"{BASE_URL}/auth",
  json={
    "action": "register-admin",
    "email": "admin@test.com",
    "password": "AdminPass123",
    "name": "Admin",
    "companyName": "Test Corp"
  }
)

data = response.json()
token = data['token']

# Create Employee
response = requests.post(
  f"{BASE_URL}/auth/employees",
  headers={"Authorization": f"Bearer {token}"},
  json={
    "name": "John",
    "email": "john@test.com",
    "password": "JohnPass123"
  }
)

print(response.json())
```

### JavaScript/Fetch

```javascript
const BASE_URL = "http://localhost:3000/api"

// Register
const registerRes = await fetch(`${BASE_URL}/auth`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "register-admin",
    email: "admin@test.com",
    password: "AdminPass123",
    name: "Admin",
    companyName: "Test Corp"
  })
})

const registerData = await registerRes.json()
const token = registerData.token

// Create Employee
const employeeRes = await fetch(`${BASE_URL}/auth/employees`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "John",
    email: "john@test.com",
    password: "JohnPass123"
  })
})

console.log(await employeeRes.json())
```

---

## Changelog

### v1.0 - February 16, 2026
- ✅ Initial implementation
- ✅ Admin registration
- ✅ Employee creation/listing/deletion
- ✅ Employee login with redirect
- ✅ JWT authentication
- ✅ OWNER/EMPLOYEE roles
- ✅ Authorization checks
- ⚠️ Team invites (partial)

---

## Support

For issues or questions:
1. Check the [Employee Management Guide](EMPLOYEE_MANAGEMENT_COMPLETE.md)
2. Review the [Backend Auth System](BACKEND_AUTH_SYSTEM.md)
3. Check the logs in browser console or server
4. Verify Bearer token is valid and not expired

---

**Version**: 1.0  
**Last Updated**: February 16, 2026  
**Maintained By**: KRIYA Dev Team

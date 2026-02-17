# Authentication & Roles – How It Works (Which File Does What)

This file describes how authentication works today and which files handle what. It also lists whether Admin, Employee, and Team Member models exist and where they are defined.

---

## Part 1: How Authentication Is Done (Step by Step)

### 1. User opens the app

| Step | What happens | File(s) involved |
|------|----------------|------------------|
| User goes to `/` | Root page redirects to `/login`. | **app/page.tsx** – `router.replace('/login')` |
| User sees login screen | Role selection (Admin / Employee) then email + password form. | **app/login/page.tsx** – UI only; no API call. |

### 2. User submits login

| Step | What happens | File(s) involved |
|------|----------------|------------------|
| User clicks “Sign In” | Form submit handler runs. | **app/login/page.tsx** – `handleSubmit()` |
| Validation | Checks `email`, `password`, and `selectedRole` are present. | **app/login/page.tsx** |
| “Login” action | Builds a user object and calls the store’s `login()`. **No request to the server.** | **app/login/page.tsx** – `login({ id, email, name, avatar, role, permissions })` from `useIDEStore()` |
| State update | Store sets `user` and `isAuthenticated`. | **stores/ide-store-new.ts** (exposes auth) → **stores/slices/auth-slice.ts** – `login(userData)` sets `user`, `isAuthenticated: true` |
| Redirect | User is sent to `/admin` or `/employee` based on role. | **app/login/page.tsx** – `router.push(selectedRole === 'admin' ? '/admin' : '/employee')` |

So: **login is fully client-side**. The only file that “does” login in the UI is **app/login/page.tsx**; the only place that stores the logged-in user is **stores/slices/auth-slice.ts** (via **stores/ide-store-new.ts**).

### 3. After login (showing user / logout)

| What | Where it’s handled |
|------|--------------------|
| Show current user (name, avatar, role) | **components/TopBar.tsx**, **components/admin/AdminLayout.tsx**, **components/employee/EmployeeLayout.tsx** – they read `user` from `useIDEStore()` (ide-store-new). |
| Logout button | Same components call `logout()` from the store and then redirect to `/login` (e.g. `window.location.href = '/login'`). |
| Clearing auth state | **stores/slices/auth-slice.ts** – `logout()` sets `user: null`, `isAuthenticated: false`. |

### 4. Auth API (exists but is not used by the login form)

| What | File | Used by login form? |
|------|------|----------------------|
| POST /api/auth (email + password → user + token) | **app/api/auth/route.ts** | **No** – login page never calls this. |
| DELETE /api/auth (logout) | **app/api/auth/route.ts** | **No** – logout only clears the store. |
| Mock users | **app/api/auth/route.ts** – hardcoded checks for `admin@kriya.dev`, `head@kriya.dev`, `employee@kriya.dev` and fixed passwords. | Only if something else called POST /api/auth. |

### 5. Route protection

| What | File | Used? |
|------|------|--------|
| Guard that redirects to `/login` if not authenticated and can check `requiredRole` | **components/auth/AuthGuard.tsx** – uses `user`, `isAuthenticated` from `useIDEStore()`, and `UserRole` from **types/auth.ts**. | **No** – AuthGuard is never imported anywhere, so no route is actually protected. |

### 6. Other auth-related code (not in the main flow)

| File | Purpose |
|------|--------|
| **lib/auth-service.ts** | Full auth service (tokens, localStorage key `kriya-auth`, token expiry). Not used by the current login or logout. |
| **components/DebugPanel.tsx** | Can “switch role” by calling `login(MOCK_USERS[role])` for testing (admin, project_head, employee). Uses **types/auth.ts** `MOCK_USERS`. |

---

## Part 2: Which File Handles What (Quick Reference)

| Responsibility | File(s) |
|----------------|--------|
| Login UI (role picker, email, password, submit) | **app/login/page.tsx** |
| Login action (store user, set isAuthenticated) | **stores/slices/auth-slice.ts** (used via **stores/ide-store-new.ts**) |
| Exposing `user`, `login`, `logout`, `isAuthenticated` to the app | **stores/ide-store-new.ts** |
| Auth API (POST/DELETE /api/auth) – mock, unused by login | **app/api/auth/route.ts** |
| User and role types; mock users for API and DebugPanel | **types/auth.ts** |
| Route guard (redirect if not logged in / wrong role) | **components/auth/AuthGuard.tsx** (not used) |
| Showing user and logout in UI | **components/TopBar.tsx**, **components/admin/AdminLayout.tsx**, **components/employee/EmployeeLayout.tsx** |
| Token-based auth service (optional, not wired) | **lib/auth-service.ts** |

---

## Part 3: Admin, Employee, and Team Member “Models”

### 3.1 Are there Admin / Employee / Team Member models?

- **Admin** and **Employee** are not separate models. They are the **same `User` type** with different **`role`** values.
- **Team Member** in the codebase has two meanings:
  1. **Auth role “employee”** – a user with `role: 'employee'` (from **types/auth.ts**).
  2. **Member inside a Team** – a **TeamMember** type in **lib/team-service.ts** (id, name, email, avatar, role: lead | developer | designer, status, etc.). Used for team workspaces and member list, not for login.

So:
- **Yes**, the app has **role concepts** for admin and employee (and project_head), and a **Team + TeamMember** model for teams.
- **No** separate “Admin” or “Employee” data models – they are the same **User** with different **UserRole**.

---

### 3.2 Where each “model” is defined

#### User (logged-in person) and roles (admin, employee, project_head)

| What | Where | Definition |
|------|--------|------------|
| **User** | **types/auth.ts** | `interface User { id, email, name, avatar?, role, permissions }` |
| **UserRole** | **types/auth.ts** | `type UserRole = 'admin' | 'project_head' | 'employee'` |
| **MOCK_USERS** | **types/auth.ts** | One object per role (admin, project_head, employee) for API and DebugPanel. |

So: **Admin** and **Employee** (and **Project Head**) are **User** with `role: 'admin'`, `role: 'employee'`, or `role: 'project_head'`. No separate Admin/Employee interfaces.

#### Team and Team Member (for teams and workspace)

| What | Where | Definition |
|------|--------|------------|
| **Team** | **lib/team-service.ts** | `interface Team { id, name, description, members, workspace, createdAt, lastActivity }` |
| **TeamMember** | **lib/team-service.ts** | `interface TeamMember { id, name, email, avatar, role: 'lead' | 'developer' | 'designer', status, lastSeen, currentFile?, cursor? }` |
| **TeamWorkspace** | **lib/team-service.ts** | Workspace per team (files, activeFiles, sharedState). |

Used by:
- **stores/admin-store.ts** – `Team[]`, `refreshTeams()` from `teamService`, add/update/delete team.
- **components/admin/TeamsView.tsx** – list/create teams.
- **components/admin/InviteUserModal.tsx** – “Invite Team Member” with role dropdown: `employee`, `project_head`, `admin` (these are **auth** roles, not TeamMember.role).

So: **Team** and **TeamMember** are specified in **lib/team-service.ts**. TeamMember.role is for **workspace role** (lead/developer/designer), not for login.

---

### 3.3 Summary table: models and roles

| Concept | Defined in | Type / values | Used for |
|--------|------------|----------------|----------|
| **User** | types/auth.ts | `User` | Logged-in user (admin, employee, or project_head). |
| **UserRole** | types/auth.ts | `'admin' \| 'project_head' \| 'employee'` | Who can access /admin vs /employee; permissions. |
| **Admin** | Same as User | `User` with `role: 'admin'` | /admin dashboard, full access. |
| **Employee** | Same as User | `User` with `role: 'employee'` | /employee layout, limited permissions. |
| **Project head** | Same as User | `User` with `role: 'project_head'` | In types and API; login UI only offers admin/employee. |
| **Team** | lib/team-service.ts | `Team` | Admin teams list, workspace. |
| **Team member** (in a team) | lib/team-service.ts | `TeamMember` (role: lead/developer/designer) | Team roster and workspace; not login identity. |

---

## Part 4: Flow diagram (current auth)

```
User visits /
    → app/page.tsx
    → redirect to /login

User on /login (app/login/page.tsx)
    → selects Admin or Employee
    → enters email + password
    → clicks Sign In
    → handleSubmit():
        - login({ id, email, name, avatar, role, permissions })  [ide-store-new]
        - auth-slice sets user, isAuthenticated = true
        - router.push('/admin' or '/employee')

User on /admin or /employee
    - AdminLayout / EmployeeLayout read user from useIDEStore()
    - Show user name, avatar, Logout
    - Logout → logout() in store → redirect to /login

(app/api/auth/route.ts is never called by this flow.)
(AuthGuard is never used, so routes are not protected.)
```

---

*This document reflects the current codebase: client-only login, no use of the auth API from the login form, and Admin/Employee as roles on the same User model, with Team/TeamMember defined in lib/team-service.ts.*

# Authentication in KRIYA

## Summary

**Yes, there is authentication** in the app, but it is **client-side / mock** only. The login form does **not** call the backend API; it only updates the store and redirects. An API route with mock credentials exists but is **not used** by the login page.

---

## Files & Folders Involved

| Location | Purpose |
|----------|--------|
| **app/login/page.tsx** | Login UI: role selection (admin/employee), email, password. On submit calls **store `login()`** with a constructed user (no API call), then redirects to `/admin` or `/employee`. |
| **app/api/auth/route.ts** | Auth API: **POST** – accepts `email`, `password`, optional `provider`; validates against **hardcoded mock users**; returns `user` + `token` + `refreshToken`. **DELETE** – logout (mock). **Not called by the current login form.** |
| **stores/slices/auth-slice.ts** | Auth state: `user`, `isAuthenticated`, `isLoading`, `login(userData)`, `logout()`, `checkAuth()`. Used by `ide-store-new`. |
| **stores/ide-store-new.ts** | Composes `createAuthSlice`; exposes `user`, `login`, `logout`, `isAuthenticated` to the app (login page, TopBar, AdminLayout, EmployeeLayout). |
| **components/auth/AuthGuard.tsx** | Route guard: redirects to `/login` if not authenticated; optional `requiredRole`. **Not used** anywhere (never imported). |
| **lib/auth-service.ts** | Full auth service class: token/refreshToken, localStorage (`kriya-auth`), `login(email, password)` calling backend, token expiry. **Not wired** to the current login flow. |
| **types/auth.ts** | Types: `User`, `UserRole` (`admin` \| `project_head` \| `employee`), `MOCK_USERS`. |

---

## Current Flow

1. **Login**  
   User opens `/login` → selects role (admin/employee) → enters email + password → submits.  
   `app/login/page.tsx` calls `login({ id, email, name, avatar, role, permissions })` from **ide-store-new** (no server check).  
   Then `router.push(selectedRole === 'admin' ? '/admin' : '/employee')`.

2. **After login**  
   `user` and `isAuthenticated` live in Zustand (ide-store-new). TopBar, AdminLayout, EmployeeLayout show user and a Logout button.

3. **Logout**  
   TopBar / AdminLayout / EmployeeLayout call `logout()` from the store and redirect to `/login` (e.g. `window.location.href = '/login'`).

4. **Protection**  
   There is **no route protection** in place: `AuthGuard` is not used, so `/admin` and `/employee` are reachable without logging in if the user types the URL.

---

## API Auth Route (Unused by Login Form)

**POST /api/auth**

- **Mock users** (in `app/api/auth/route.ts`):
  - `admin@kriya.dev` / `admin123` → admin
  - `head@kriya.dev` / `head123` → project_head
  - `employee@kriya.dev` / `emp123` → employee
- Returns: `{ success, user, token, refreshToken }` or `401 Invalid credentials`.
- OAuth-style `provider` returns a mock user and tokens.

**DELETE /api/auth**  
Mock logout; returns `{ success, message }`.

---

## Summary Table

| What | Where | Used? |
|------|--------|--------|
| Login UI | app/login/page.tsx | Yes |
| Login action | Store (ide-store-new + auth-slice) | Yes (no API) |
| Logout action | Store + TopBar, AdminLayout, EmployeeLayout | Yes |
| Auth API (mock) | app/api/auth/route.ts | No (login form doesn’t call it) |
| Auth types | types/auth.ts | Yes |
| Route guard | components/auth/AuthGuard.tsx | No (never imported) |
| Auth service (lib) | lib/auth-service.ts | No (not wired to login) |

---

## To Make Auth “Real”

1. **Use the auth API from the login page**  
   In `app/login/page.tsx`, on submit call `POST /api/auth` with `email` and `password`; on success call store `login(response.user)` and store the token (e.g. in state or via `lib/auth-service.ts`), then redirect.

2. **Use AuthGuard**  
   Wrap `/admin` and `/employee` (e.g. in layout or page) with `<AuthGuard requiredRole="admin">` or `<AuthGuard requiredRole="employee">` so unauthenticated users are redirected to `/login`.

3. **Optional**  
   Wire `lib/auth-service.ts` into the login flow and use it for token storage, refresh, and logout API call.

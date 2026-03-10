# KRIYA Codebase Overview – Files, Code Modules, and Responsibilities

This document answers three questions:

1. **How many files are in the project?**  
2. **How many are “real code” files vs docs/config/etc.?**  
3. **What are the main modules and which file handles what?**

_All counts below exclude `node_modules/`, `.next/`, and `cdk.out/`._

---

## 1. File & Module Counts

### 1.1 Total files (project)

```text
232  total project files (excluding node_modules/.next/cdk.out/.git)
```

These include:
- Source code (TS/TSX/JS/JSX)
- Docs (`.md`)
- Config (JSON, config JS)
- Data (JSON/SQL)

### 1.2 Code modules (TS/TSX/JS/JSX)

```text
157  total code files (.ts/.tsx/.js/.jsx) across the repo
152  code modules in main app dirs (app, components, stores, lib, backend, hooks, types, test, database)
```

Breakdown by area (code modules):

```text
app/       37   pages + API route handlers
components/47   React UI components (IDE, admin, employee, etc.)
stores/    13   Zustand stores + slices
lib/       37   Services, utilities, integrations
backend/   13   Local + AWS collaboration backend (excluding backend/node_modules, cdk.out)
hooks/      2   React hooks
types/      1   Shared TS types
test/       1   Jest test
database/   3   DB seed scripts (seed-mongo.js, seed.sql, schema.sql)
```

So the **core application logic** lives in about **150 modules**, concentrated in `app/`, `components/`, `stores/`, and `lib/`.

---

## 2. Code Modules by Layer

### 2.1 App Router (Routing + API surface) – `app/`

**Page modules** (UI entry points):

- `app/layout.tsx` – Global layout (fonts, metadata, `<body>`) for all pages.
- `app/page.tsx` – `/` → redirects to `/login`.
- `app/login/page.tsx` – `/login` – role picker (admin/employee) + email/password; calls store `login()` and redirects.
- `app/admin/page.tsx` – `/admin` – admin dashboard shell; uses `useAdminStore` and renders `AdminLayout`.
- `app/employee/page.tsx` – `/employee` – employee shell; renders `EmployeeLayout`.
- `app/ide/page.tsx` – `/ide` – the main IDE screen; wires together TopBar, Sidebar, CodeEditor, StatusBar, CommandPalette, AIChat, Terminal, etc.
- `app/register/page.tsx` – `/register` – registration UI (stub/optional depending on use).
- `app/not-found.tsx` – 404 page.

**API route modules** – `app/api/**/route.ts`

Each folder under `app/api/` defines one or more **backend endpoints**. All are standard Next.js **route handlers**.

Authentication & users:
- `app/api/auth/route.ts` – Login/logout with **mock users** and mock tokens.
- `app/api/auth/verify/route.ts` – Token/verification endpoint.
- `app/api/auth/employees/route.ts` & `[id]/route.ts` – Employee CRUD for auth.
- `app/api/auth/invites/route.ts` – Invitation endpoints.
- `app/api/users/route.ts` – User listing/management.

Teams & team members:
- `app/api/teams/route.ts` – Team list/create.
- `app/api/teams/[teamId]/route.ts` – Single team operations.
- `app/api/teams/[teamId]/members/route.ts` – Team member operations for one team.
- `app/api/teams/my-teams/route.ts` – Teams for the current user.
- `app/api/team-members/route.ts` – Cross-team member view.

IDE & workspace operations:
- `app/api/files/route.ts` – File tree + read/write/rename/delete in `workspace/` (path validation, size limits).
- `app/api/terminal/route.ts` – Execute shell commands for the IDE terminal.
- `app/api/execute/route.ts` – Code execution endpoint.
- `app/api/search/route.ts` – Global code/search endpoint.
- `app/api/extensions/route.ts` – Extensions list/install/remove via `lib/extension-manager`.
- `app/api/packages/route.ts` – Package lookup.
- `app/api/install/route.ts` – Install npm packages / dependencies.
- `app/api/server/route.ts` – Server status/config.
- `app/api/proxy/route.ts` – HTTP proxy for external APIs.
- `app/api/debug/route.ts` – Debug utilities.
- `app/api/dev/start/route.ts` – Start a dev server in a given path.

Database & environments:
- `app/api/database/route.ts` – In-memory DB connection/query API; uses `lib/database-manager`.
- `app/api/environments/route.ts` – API environment configuration.

Notifications:
- `app/api/notifications/route.ts` – Notification read/list/etc.

Collections:
- `app/api/collections/route.ts` – API collections CRUD.
- `app/api/collections/[id]/route.ts` – Single collection endpoints.

**Role of `app/`:**
- Defines the **routing surface** (pages + API endpoints).
- For pages: orchestrates high-level screens (`/login`, `/admin`, `/employee`, `/ide`).
- For API: exposes a unified HTTP interface used by the IDE front-end and sometimes by the backend.

---

### 2.2 UI Components – `components/`

Core IDE shell:
- `components/TopBar.tsx` – Top navigation: file name, mode toggle (Solo/Live), user info, logout, backend status.
- `components/Sidebar.tsx` – Left sidebar: file tree, panels (API, DB, etc.).
- `components/FileTabs.tsx` – File tab strip (open files, close/switch tabs).
- `components/CodeEditor.tsx` – Monaco editor instance; loads/saves file content and syncs with store.
- `components/StatusBar.tsx` – Bottom bar: cursor position, status indicators.
- `components/IDELayout.tsx` – Wraps sidebar + main editor layout.
- `components/MainEditor.tsx` – Editor area (tabs + editor) composition.

Supporting panels:
- `components/CommandPalette.tsx` – ⌘K palette; uses IDE store actions.
- `components/Terminal.tsx` – Integrated terminal; talks to `/api/terminal`.
- `components/GlobalSearch.tsx` – Search UI; uses `/api/search`.
- `components/DatabaseView.tsx` – Database UI; uses `lib/database-service` / `/api/database`.
- `components/DeploymentDashboard.tsx` – Deployment view; uses deploy APIs.
- `components/LogsView.tsx` – Logs viewer.
- `components/SettingsView.tsx` / `SettingsPanel.tsx` / `SettingsModal.tsx` – Settings UI.
- `components/AnalyticsView.tsx` – Analytics panel.
- `components/SystemStatus.tsx` – System health / connection info.

Collaboration & AI:
- `components/CollaborationManager.tsx` – Manages collaborative sessions; uses `lib/collaboration-service` and IDE store.
- `components/CollaborationStatus.tsx` – Shows collaborators, connection state.
- `components/CollaborationToggle.tsx` – Solo/Live toggle.
- `components/AIAssistant.tsx` – AI assistant trigger.
- `components/AIChatPanel.tsx` / `AIChatEnhanced.tsx` – AI chat UI.

Admin & team UI:
- `components/admin/AdminLayout.tsx` – Shell for admin area; sidebar, top nav for admin pages.
- `components/admin/DashboardView.tsx` – Admin metrics dashboard.
- `components/admin/TeamsView.tsx` – Team list/detail; uses `useAdminStore`.
- `components/admin/ActivityView.tsx` – Activity feed for teams/users.
- `components/admin/StatsCard.tsx` – Statistic widget.
- `components/admin/InviteUserModal.tsx` – Invite team member modal.
- `components/admin/AddMemberModal.tsx` / `EmployeeManagement.tsx` – Team member management.

Employee shell:
- `components/employee/EmployeeLayout.tsx` – Employee shell layout.
- `components/employee/TeamsSection.tsx` – Teams view for employees.

Utility components:
- `components/ErrorBoundary.tsx` – Error boundary wrapper.
- `components/LoadingScreen.tsx` – Centered loader.
- `components/Toast.tsx` – Toast notifications.
- `components/Logo.tsx` – App logo component.
- `components/FileCreator.tsx` / `NewFileDialog.tsx` – New file UI.
- `components/FolderCreator.tsx` / `NewFolderDialog.tsx` – New folder UI.
- `components/TeamInviteManager.tsx` – High-level team invite flow.
- `components/YamlEditor.tsx` – YAML editor panel.
- `components/PerformanceMonitor.tsx` – Debug/perf overhead display.

**Role of `components/`:** Pure UI and interactions; they **delegate** data/state to `stores/` and `lib/`.

---

### 2.3 State Management – `stores/`

Top-level stores:
- `stores/ide-store-fast.ts`
  - Fast, focused IDE state: `tabs`, `activeTab`, `view`, `activePanel`, `commandPalette`, `aiChatOpen`, `terminalOpen`, etc.
  - Core actions: `addTab`, `closeTab`, `updateTabContent`, `setView`, `setActivePanel`, `saveFile`, `runCurrentFile`, etc.
- `stores/ide-store-new.ts`
  - Combines slices for **auth**, **settings**, **database**, **API**, **UI**, etc.
  - Provides `user`, `isAuthenticated`, `login`, `logout`, `settings`, and collaboration flags to UI.
- `stores/ide-store.ts`
  - Legacy/compat combined store; still used by `useIDEHotkeys` and some compatibility features.
- `stores/admin-store.ts`
  - `teams: Team[]`, `activities: Activity[]`, and actions for `addTeam`, `updateTeam`, `deleteTeam`, `addActivity`, `refreshTeams`, `syncWithIDE`.
- `stores/store.ts`
  - Primary combined store built from **editor-slice** and **ui-slice** with `persist` + `devtools`.

Slices:
- `stores/slices/editor-slice.ts` – Editor state (tabs, recent files, fontSize, tabSize, minimap, autoSave).
- `stores/slices/ui-slice.ts` – UI state (view, activePanel, terminalOpen, overlays, etc.).
- `stores/slices/auth-slice.ts` – Auth: `user`, `isAuthenticated`, `login`, `logout`, `checkAuth`.
- `stores/slices/database-slice.ts` – DB connections/query state.
- `stores/slices/api-slice.ts` – API call state and collections.
- `stores/slices/settings-slice.ts` – User/editor settings.

Helpers:
- `stores/hooks.ts` – Store helper hooks.
- `stores/utils.ts` – Misc store utilities.

**Role of `stores/`:** Single source of truth for front-end state: auth, IDE UI, DB panel state, admin teams, etc.

---

### 2.4 Services & Utilities – `lib/`

Core integrations and services:

Backend & API:
- `lib/backend-client.ts` – HTTP/WS client for collaboration backend; wraps REST and WebSocket calls (documents, operations, cursors).
- `lib/api-service.ts` – Generic fetch wrapper (base URL, error handling).
- `lib/api-file-system.ts` – File operations via `/api/files`.

Collaboration:
- `lib/collaboration-service.ts` – Real-time collaboration abstraction; uses localStorage (multi-tab) and can talk to WebSocket backend.
- `lib/operational-transform.ts` – Operational transform types/logic for conflict-free text edits.

Files & workspace:
- `lib/file-system.ts` – Local file helpers.
- `lib/file-tree.ts` – Manages file tree layout and persistence (`kriya-file-tree` in localStorage).
- `lib/file-types.ts` – Helpers for languages/file types.

Database:
- `lib/database-manager.ts` – In-memory DB “connections”; returns empty results but models connection lifecycle.
- `lib/database-service.ts` – Frontend wrapper around `/api/database`.
- `lib/db-types.ts` – Type helpers for DB.

Team & extensions:
- `lib/team-service.ts` – In-memory team + workspace model; used by admin views.
- `lib/extension-manager.ts` – Manages extensions lifecycle.
- `lib/extension-service.ts` – Extension metadata and helper functions.

Auth & storage:
- `lib/auth-storage.ts` – Helpers to persist/clear auth/token data (localStorage).

Prisma / DB tooling:
- `lib/prisma.ts` / `lib/mongodb.ts` / `lib/generated/prisma/**` – Generated/client code and helpers for DB integration (tooling; not heavily used by the main IDE flow yet).

Other utilities:
- `lib/utils.ts` – General-purpose helpers.
- `lib/rate-limit.ts` – Rate limiting helpers.
- `lib/debug-service.ts` – Debug utilities.

**Role of `lib/`:** Encapsulates all non-UI logic: API clients, collaboration, file system abstraction, DB abstraction, teams, and misc utilities.

---

### 2.5 Backend Collaboration Services – `backend/`

Local backend (for dev):
- `backend/local-server.js` – Express + Socket.IO server on port 8080.
  - In-memory Maps for `documents`, `activeSessions`, `userSessions`.
  - Persists docs to `backend/data/` (JSON) for basic durability.
  - WebSocket events: join-document, operation, cursor-update.

AWS backend (serverless collaboration):
- `backend/main/server.js` – Node + Express + AWS SDK; uses DynamoDB to store documents and sessions.
- `backend/main/api.js` – REST API handler for documents.
- `backend/main/websocket.js` – WebSocket API for collaboration; persists via DynamoDB.

AWS WebSocket infrastructure:
- `backend/aws-websocket/bin/app.ts/js` – CDK app entry.
- `backend/aws-websocket/lib/kriya-websocket-stack.ts/js/d.ts` – CDK stack defining WebSocket API, Lambda, DynamoDB tables.
- `backend/aws-websocket/lambda/connect.js` – WebSocket `$connect` handler.
- `backend/aws-websocket/lambda/disconnect.js` – WebSocket `$disconnect` handler.
- `backend/aws-websocket/lambda/message.js` – WebSocket message/operation handler.

**Role of `backend/`:** Implements the real-time collaboration backend for local dev and AWS production.

---

### 2.6 Hooks – `hooks/`

- `hooks/useIDEHotkeys.ts` – Registers global hotkeys (⌘K, ⌘S, etc.); interacts with IDE store actions.
- `hooks/useCollaborativeEditor.ts` – Hook to wire the editor to `collaboration-service`.

---

### 2.7 Types & Tests

- `types/auth.ts` – `UserRole`, `User`, `MOCK_USERS` – the only global type module.
- `test/extension-service.test.ts` – Jest test for `lib/extension-service`.

---

### 2.8 Database tooling – `database/`

Code-ish files:
- `database/seed-mongo.js` – Script to seed a MongoDB instance.
- `database/schema.sql` – SQL schema definition.
- `database/seed.sql` – SQL seed data.

Docs:
- `database/README.md`, `COMPARISON.md`, `MONGODB_SETUP.md`, `USAGE.md` – explain how to set up and compare DB options for the IDE.

**Role of `database/`:** Optional tooling/documentation for connecting this IDE to real databases; not directly in the main runtime path.

---

## 3. Summary – “What Is Handling What?”

- **Routing & API surface** – `app/`  
  Defines all pages (`/login`, `/admin`, `/employee`, `/ide`) and API routes (`/api/...`).

- **UI & UX** – `components/`  
  All visual pieces: editor, sidebar, tabs, terminal, AI chat, admin dashboards, employee views.

- **State management** – `stores/`  
  Zustand stores and slices for auth, IDE state, UI, DB panel, admin teams.

- **Services & domain logic** – `lib/`  
  Collaboration, file system, DB abstraction, extensions, teams, utilities, API clients.

- **Collaboration backend** – `backend/`  
  Local Express + Socket.IO server and AWS serverless stack using DynamoDB.

- **Glue & helpers** – `hooks/`, `types/`, `test/`, `database/`  
  Hooks wire UI to stores/services, `types/` shares types, `test/` covers services, `database/` provides DB seeds and docs.

This overview, combined with `docs/ARCHITECTURE_FLOW.md`, gives you both the **high-level diagrams** and a **concrete map of every major module** and what it is responsible for.


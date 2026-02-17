# KRIYA IDE – Architecture

For **detailed flow, Mermaid diagrams, and a full file/folder responsibility map**, see [ARCHITECTURE_FLOW.md](./ARCHITECTURE_FLOW.md).

## High-level structure

```
KRIYA/
├── app/                    # Next.js App Router (pages & API)
├── components/             # React UI components
├── stores/                 # Zustand state
├── lib/                    # Shared services & utilities
├── hooks/                  # React hooks
├── types/                  # Shared TypeScript types
├── public/                 # Static assets
├── data/                   # API collections, environments
├── backend/                # Node backend (local + AWS)
├── docs/                   # Project documentation
├── scripts/                # Shell scripts (deploy, start)
├── test/                   # Tests
└── workspace/              # User workspace (runtime)
```

## App (`app/`)

- **Routes**
  - `/` → redirect to `/login`
  - `/login` – role selection and sign-in
  - `/admin` – admin dashboard (teams, activity)
  - `/employee` – employee layout
  - `/ide` – main IDE (editor, sidebar, terminal, etc.)
- **API** – `app/api/*` – one folder per route group (e.g. `files`, `database`, `terminal`). Route handlers live in `route.ts` per segment.
- **Global** – `layout.tsx`, `globals.css`, `favicon.ico`.

## Components (`components/`)

- **IDE** – Editor, Sidebar, FileTabs, TopBar, StatusBar, CommandPalette, Terminal, etc.
- **Feature** – DatabaseView, DeploymentDashboard, SettingsView, AIChatEnhanced, etc.
- **Shared** – Logo, ErrorBoundary, Toast.
- **Domain**
  - `admin/` – AdminLayout, DashboardView, TeamsView, ActivityView
  - `employee/` – EmployeeLayout
  - `auth/` – AuthGuard

Use `@/components/...` for imports.

## State (`stores/`)

- **ide-store-fast.ts** – Core IDE: tabs, editor, sidebar, panels (used by `/ide`, CodeEditor, FileTabs, Sidebar, StatusBar).
- **ide-store-new.ts** – Auth, settings, collaboration, AI (used by login, admin, employee, and most feature components).
- **ide-store.ts** – Legacy/combined store; used by `useIDEHotkeys` and store composition.
- **admin-store.ts** – Teams and admin data.
- **slices/** – editor, ui, auth, database, api, settings (used by `store.ts`).

Prefer `@/stores/...` for imports.

## Lib (`lib/`)

Shared, non-UI logic: backend client, collaboration, file tree, database, extensions, auth, utils. See `lib/README.md` for the file list and roles.

## Backend (`backend/`)

- **local-server.js** – Local dev server (Express + Socket.IO) on port 8080.
- **main/** – AWS serverless (Lambda, API Gateway, DynamoDB).
- **aws-websocket/** – CDK stack for WebSocket API.

Frontend target is set via `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_COLLABORATION_WS_URL` (see `lib/backend-client.ts`).

## Scripts (`scripts/`)

- **start-full-stack.sh** – Start backend + frontend (from repo root: `./scripts/start-full-stack.sh`).
- **deploy-*.sh** – Deployment scripts for AWS, backend, production.

Run from repo root; scripts resolve paths relative to root.

## Docs (`docs/`)

- **docs/setup/** – Local setup, production config, admin, deploy.
- **docs/architecture/** – App/backend analysis, file layout, cleanup notes.
- **docs/archive/** – Old fix/update notes.
- **docs/** – Collaboration and real-time sync guides.

## Data (`data/`)

- **api-collections/** – API collection definitions.
- **api-environments/** – API environment configs.

## Path aliases

- `@/*` → repo root (see `tsconfig.json`).
- Use `@/components/...`, `@/lib/...`, `@/stores/...`, `@/hooks/...`, `@/types/...` for imports.

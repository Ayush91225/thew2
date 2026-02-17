# Database connections in KRIYA

## Short answer

- **Next.js app (IDE “Database” feature):** No real database is connected. The database layer is a stub (in-memory only; no MySQL/Postgres/MongoDB drivers).
- **Backend (AWS):** DynamoDB is used for collaboration (documents and WebSocket sessions), not for the IDE’s “Database” UI.
- **Backend (local):** No database; uses in-memory Maps and JSON files under `backend/data/`.

---

## 1. IDE “Database” feature (no real DB)

The app has a Database view and API to “connect” and “run queries,” but nothing talks to a real DB.

| Location | What it does |
|----------|----------------|
| **lib/database-manager.ts** | In-memory only. `createConnection()` stores config in a Map (no DB client). `executeQuery()` always returns `{ rows: [], rowCount: 0 }`. `getTables()` returns `[]`. No `mysql`, `pg`, or `mongodb` usage. |
| **app/api/database/route.ts** | Uses `database-manager`: connect/query/disconnect/tables. So “connect” succeeds and “query” returns empty result; no real DB. |
| **lib/database-service.ts** | Client that calls `/api/database` (connect, query, disconnect). |
| **package.json** (root) | No `mysql2`, `pg`, `mongodb`, etc. So the Next.js app has no DB driver. |

So: **no DB is connected** for the IDE’s Database feature; it’s UI + stub API only.

---

## 2. Backend – AWS (DynamoDB)

When the backend runs on AWS, it uses **DynamoDB** for collaboration only (documents and WebSocket sessions), not for the IDE Database UI.

| Location | What it does |
|----------|----------------|
| **backend/main/server.js** | `AWS.DynamoDB.DocumentClient()` – documents/sessions. |
| **backend/main/api.js** | DynamoDB for document CRUD. |
| **backend/main/websocket.js** | DynamoDB for connection/session state. |
| **backend/aws-websocket/lambda/connect.js** | DynamoDB put for connection id. |
| **backend/aws-websocket/lambda/disconnect.js** | DynamoDB delete. |
| **backend/aws-websocket/lambda/message.js** | DynamoDB get/query/update/delete for sessions and documents. |

So: **DynamoDB is connected** only in the AWS backend, and only for collaboration (documents + sessions).

---

## 3. Backend – local (no DB)

| Location | What it does |
|----------|----------------|
| **backend/local-server.js** | In-memory `documents`, `activeSessions`, `userSessions` Maps; persistence via JSON files in `backend/data/`. No database. |
| **backend/package.json** | No DB libraries (express, socket.io, cors, uuid only). |

So: **no database** for the local backend.

---

## Summary table

| Component | Database? | Where | Purpose |
|-----------|-----------|--------|---------|
| Next.js app (Database UI) | No | lib/database-manager.ts, app/api/database | Stub only; no real connect/query. |
| Backend (AWS) | Yes – DynamoDB | backend/main/*, backend/aws-websocket/lambda/* | Collaboration docs + WebSocket sessions. |
| Backend (local) | No | backend/local-server.js | In-memory + JSON files. |

---

## If you want a real DB for the IDE Database feature

1. Add a driver in the Next.js app (e.g. `mysql2`, `pg`, or `mongodb`) or in a separate backend service.
2. In **lib/database-manager.ts** (or a new module used by `app/api/database/route.ts`), open real connections and run real queries.
3. Keep credentials and connection strings server-side only (e.g. env vars, not in client bundle).

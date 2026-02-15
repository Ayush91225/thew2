# Lib – Shared logic and services

| File | Purpose |
|------|---------|
| **Backend & API** | |
| `backend-client.ts` | HTTP/WS client for collaboration backend |
| `api-service.ts` | API request helpers |
| `api-file-system.ts` | File system operations via API |
| **Collaboration** | |
| `collaboration-service.ts` | Real-time collaboration (localStorage / multi-tab sync) |
| `operational-transform.ts` | OT for conflict-free collaborative editing |
| **Files & workspace** | |
| `file-system.ts` | Local file system utilities |
| `file-tree.ts` | File tree data and helpers |
| `file-types.ts` | File type / extension helpers |
| **Data & infra** | |
| `database-manager.ts` | DB connection and queries |
| `database-service.ts` | Database service layer |
| `team-service.ts` | Team management |
| **Auth & extensions** | |
| `auth-service.ts` | Auth helpers |
| `extension-manager.ts` | Extension lifecycle |
| `extension-service.ts` | Extension discovery/loading |
| **Utils** | |
| `utils.ts` | General helpers |
| `rate-limit.ts` | Rate limiting |
| `debug-service.ts` | Debug utilities |

Import with `@/lib/<filename>` (no extension).

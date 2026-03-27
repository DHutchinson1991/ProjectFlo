# Clients

## What this module does
Client management for a brand — CRUD operations on clients (contacts linked to the brand). Clients are created when an inquiry converts or added manually.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed endpoint bindings for `/api/clients` |
| `hooks/useClients.ts` | React Query hooks for fetching client list and detail |
| `hooks/useClientMutations.ts` | Mutations for create, update, delete |
| `types/index.ts` | `Client`, `ClientListItem`, `CreateClientData`, `UpdateClientData` |
| `constants/query-keys.ts` | Brand-scoped query key factory |
| `screens/ClientsListScreen.tsx` | Client list table with CRUD dialogs |

## Business rules / invariants
- All client queries are brand-scoped via `X-Brand-Context` header (automatic).
- Creating a client upserts the underlying `Contact` record by email.
- Deleting a client is a soft-delete (archive).
- Query keys include `brandId` for tenant isolation.

## Related modules
- **Backend**: `packages/backend/src/workflow/clients/` — `ClientsController` + `ClientsService`
- **Frontend**: `features/workflow/inquiries` — inquiries reference clients
- **Frontend**: `features/workflow/projects` — projects belong to clients

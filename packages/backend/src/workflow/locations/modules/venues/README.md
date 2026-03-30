# Venues

## What this module does
CRUD and management of venues (locations). Handles venue creation, lookup, update, and soft deletion.

## Key files
| File | Purpose |
|------|---------|
| `venues.controller.ts` | REST endpoints under `api/locations` for venue CRUD |
| `venues.service.ts` | Business logic for venue management |
| `venues.module.ts` | NestJS module registration |

## Business rules / invariants
- Venues are top-level location entities.
- Venues are brand-scoped (filtered by `brandId` from query or header).

## Related modules
- **Frontend**: `features/workflow/locations/` — location management UI

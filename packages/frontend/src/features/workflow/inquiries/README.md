# Inquiries

## What this module does
Owns studio inquiry API bindings and workflow-facing inquiry helpers outside the frozen monolith. It covers inquiry CRUD, welcome-pack sending, discovery and availability endpoints, and inquiry schedule snapshot/sync access.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed inquiry CRUD, availability, snapshot, and schedule-sync bindings |
| `hooks/use-inquiry-apis.ts` | Stable feature hook exposing inquiry-owned API factories |
| `types/index.ts` | Inquiry schedule and status types local to this feature |
| `README.md` | Business invariants and ownership map |

## Business rules / invariants
- All inquiry requests flow through the shared authenticated API client; no route or card should call `inquiriesService` or `api.inquiries` directly.
- Inquiry schedule snapshots are read-only package clones owned by the inquiry and must be read through this feature.
- Schedule sync for inquiries is destructive re-cloning from the selected package and must stay explicit.
- Inquiry wizard ownership stays in `features/workflow/inquiry-wizard`; this feature only owns the core inquiry domain.

## Related modules
- **Backend**: `packages/backend/src/workflow/inquiries` and related inquiry endpoints under `/api/inquiries/*`
- **Frontend**: `features/workflow/inquiry-wizard` for needs-assessment and wizard flows
- **Finance**: `features/finance/*` for estimates, quotes, contracts, invoices, and payment config tied to inquiries

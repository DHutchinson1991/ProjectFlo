# Payment Brackets Module

## What this module does

Manages hourly rate brackets per job role per brand. Brackets define what rate a crew assignment is paid based on role. The pricing module uses brackets in its 4-tier rate fallback chain.

## Key files

| File | Purpose |
|------|---------|
| `payment-brackets.service.ts` | CRUD for brackets (findAll, findById, findByJobRole, create, update, delete) |
| `services/payment-bracket-assignments.service.ts` | Assign/unassign brackets, toggle unmanned, get effective rate, group by role |
| `payment-brackets.controller.ts` | REST endpoints for bracket management + assignments |
| `dto/payment-bracket.dto.ts` | Create, update, and assign bracket DTOs |

## Business rules / invariants

- Brackets are brand-scoped — a bracket belongs to one brand via `brand_id`.
- The pricing fallback chain in `pricing.service.ts` queries brackets in order: matched-role → primary → any.
- Deleting a bracket that is referenced by active pricing may break rate resolution.
- Controller supports both legacy `crew/*` routes and new `crew/*` aliases while clients migrate.
- DTO and DB payload keys still include legacy `crew_*` fields and require a coordinated contract + schema migration.

## Keep docs up to date

After ANY code change in this module, update `PRICING_TOTALS_REFERENCE.md` (root) and this README if business rules, key files, or cross-references changed.

## Related modules

- **Backend**: `../business/pricing` — consumes brackets for rate fallback
- **Frontend**: Settings UI for managing crew rates
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root) — rate fallback chain

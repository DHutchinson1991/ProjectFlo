# Estimates Module

## What this module does

CRUD for estimates scoped to an inquiry. An estimate is a line-item document with a server-computed `total_amount`. Estimates can be auto-generated from the task-library preview or manually created. When an estimate is accepted, it can trigger project creation via `ProjectPackageSnapshotService`.

## Key files

| File | Purpose |
|------|---------|
| `estimates.service.ts` | Create, update, delete estimates; auto-generate from task preview |
| `estimates.controller.ts` | `POST/GET/PATCH/DELETE /api/inquiries/:inquiryId/estimates` |
| `dto/create-estimate.dto.ts` | Validation: items array, status enum, dates |
| `dto/update-estimate.dto.ts` | Partial update DTO |
| `entities/estimate.entity.ts` | TypeScript interfaces for Estimate and EstimateItem |

## Business rules / invariants

- `total_amount` is computed server-side via `items.reduce(qty × unit_price)` — frontend never sends `total_amount`.
- `total_amount` stored in DB is PRE-TAX (pure items sum).
- Updating without sending `items[]` preserves `total_amount` as-is.
- Milestone `.amount` is a resolved currency value — do NOT multiply by `total_amount`.

## Keep docs up to date

After ANY code change in this module, update `PRICING_TOTALS_REFERENCE.md` (root) and this README if business rules, key files, or cross-references changed.

## Related modules

- **Backend**: `../business/task-library` — `previewAutoGeneration` feeds auto-estimate generation
- **Backend**: `../payment-schedules` — applies milestone schedules to estimates
- **Backend**: `../inquiry-tasks` — estimate acceptance can update inquiry task status
- **Backend**: `../projects` — `ProjectPackageSnapshotService` for project creation on acceptance
- **Frontend**: `EstimatesCard.tsx` in inquiry detail — displays and manages estimates
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root)

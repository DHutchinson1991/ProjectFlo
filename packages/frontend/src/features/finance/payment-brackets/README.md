# Payment Brackets — Frontend Feature

## What this feature does

Provides API bindings and React Query hooks for managing payment brackets — hourly rate tiers assigned to job roles. Used to view, create, update, and delete brackets, assign brackets to contributors, and resolve effective rates.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | Typed API client methods — all endpoints use `skipBrandContext: true` (brackets are global) |
| `hooks/use-payment-brackets.ts` | React Query hooks for all bracket queries and mutations |
| `hooks/queryKeys.ts` | Query key factory for bracket cache keys |
| `types/index.ts` | `PaymentBracket`, `ContributorBracketAssignment`, `EffectiveRate`, and related types |
| `index.ts` | Public barrel — import from here, never from sub-folders |

## Business rules / invariants

- Brackets are globally defined (not brand-scoped) — all API calls use `skipBrandContext: true`.
- `getByRole` accepts an optional `brandId` to filter the contributor list returned within each bracket.
- Delete is a soft-delete on the backend (`is_active: false`); deleted brackets are also unlinked from any `contributor_job_roles`.
- Effective rate priority: bracket `hourly_rate` > `"none"`.
- An inactive bracket cannot be assigned to a contributor.

## Related modules

- **Backend**: `packages/backend/src/finance/payment-brackets` — REST API, assignment logic, rate resolution
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root) — rate fallback chain context

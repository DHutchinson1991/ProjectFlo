# Payment Brackets — Frontend Feature

## What this feature does

Provides API bindings and React Query hooks for managing payment brackets — hourly rate tiers assigned to job roles. Used to view, create, update, and delete brackets, assign brackets to crew, and resolve effective rates.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | Typed API client methods — all endpoints use `skipBrandContext: true` and prefer `/crew/*` route variants |
| `hooks/use-payment-brackets.ts` | React Query query hooks for active bracket list and role-grouped brackets |
| `hooks/queryKeys.ts` | Query key factory for bracket cache keys |
| `types/index.ts` | `PaymentBracket`, `CrewBracketAssignment`, `EffectiveRate`, and related types |
| `index.ts` | Public barrel — import from here, never from sub-folders |

## Business rules / invariants

- Brackets are globally defined (not brand-scoped) — all API calls use `skipBrandContext: true`.
- `getByRole` accepts an optional `brandId` to filter the crew list returned within each bracket.
- Delete is a soft-delete on the backend (`is_active: false`); deleted brackets are also unlinked from any `crew_job_roles`.
- Effective rate priority: bracket `hourly_rate` > `"none"`.
- An inactive bracket cannot be assigned to crew.
- Frontend bindings now target `/crew/*` assignment routes; backend keeps legacy `/crew/*` aliases during migration.
- Mutation operations are currently consumed via feature API methods; the public hook surface is query-focused.

## Related modules

- **Backend**: `packages/backend/src/finance/payment-brackets` — REST API, assignment logic, rate resolution
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root) — rate fallback chain context

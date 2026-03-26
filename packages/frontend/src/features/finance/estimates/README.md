# Estimates

## What this module does
Owns inquiry estimate endpoint bindings and estimate-facing feature exports for inquiry pricing workflows.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed estimate CRUD, send, revise, refresh, and snapshot bindings |
| `hooks/use-estimates-api.ts` | Hook wrapper for estimate API access |
| `types/index.ts` | Estimate type exports for feature consumers |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Estimates are always inquiry-scoped under `/api/inquiries/:inquiryId/estimates/*`.
- Refresh, revise, send, and snapshot history are part of the same estimate lifecycle and stay in one feature-owned API.
- Consumers must import from this feature, not `estimatesService` or `api.estimates`.
- Estimate totals and milestone application remain behavior-compatible during migration.

## Related modules
- **Backend**: `packages/backend/src/finance/estimates`
- **Frontend**: `features/finance/payment-schedules` for milestone application and status updates
- **Workflow**: `features/workflow/inquiries` for the parent inquiry surface
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

# Payment Schedules

## What this module does
Owns payment schedule template and milestone API bindings used by estimates, quotes, and settings.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Payment schedule and milestone endpoint bindings |
| `hooks/use-payment-schedules-api.ts` | Hook wrapper for payment schedule API access |
| `types/index.ts` | Payment schedule and milestone type exports |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Estimate and quote milestone actions go through this feature API.
- Brand-scoped template operations remain unchanged during migration.
- Consumers stop referencing `api.paymentSchedules` directly.

## Related modules
- **Backend**: `packages/backend/src/finance/payment-schedules` — payment schedule endpoints
- **Frontend**: `features/finance/estimates`, `features/finance/quotes`
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

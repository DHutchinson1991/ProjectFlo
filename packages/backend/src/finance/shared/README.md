# Finance Shared

## What this module does
Shared pricing utilities for backend finance modules. Re-exports core pricing functions from `@projectflo/shared` and adds a Prisma `Decimal`-safe variant for database persistence.

## Key files
| File | Purpose |
|------|---------|
| `pricing.utils.ts` | Re-exports `roundMoney`, `computeLineTotal`, `computeItemsTotal`, `computeTaxBreakdown` from shared; adds `computeItemsTotalDecimal` |

## Business rules / invariants
- All finance modules must use these helpers for pricing math — no inline arithmetic.
- `computeItemsTotalDecimal` returns a Prisma `Decimal` — required when storing computed totals in the database.
- Frontend uses `@projectflo/shared` directly; backend uses this wrapper for Decimal safety.

## Related modules
- **Shared package**: `@projectflo/shared` — canonical pricing math (shared with frontend)
- **Backend consumers**: `finance/estimates`, `finance/quotes`, `finance/invoices`, `finance/payment-schedules`

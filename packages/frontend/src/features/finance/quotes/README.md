# Quotes

## What this module does
Owns inquiry-scoped quote endpoint bindings and quote-facing feature exports for pricing workflows.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed quote CRUD bindings |
| `hooks/use-quotes-api.ts` | Hook wrapper for quote API access |
| `types/index.ts` | Quote type exports for feature consumers |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Quotes stay inquiry-scoped under `/api/inquiries/:inquiryId/quotes/*`.
- Primary quote selection is handled by quote update, not a parallel compatibility path.
- Consumers must import from this feature, not `quotesService` or `api.quotes`.
- Quote behavior remains unchanged while ownership is migrated.

## Related modules
- **Backend**: `packages/backend/src/finance/quotes`
- **Frontend**: `features/finance/payment-schedules` for quote milestones
- **Workflow**: `features/workflow/inquiries` for inquiry ownership
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

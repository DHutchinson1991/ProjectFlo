# Invoices

## What this module does
Owns invoice types used by inquiry-facing finance models during ongoing invoice frontend migration.

## Key files
| File | Purpose |
|------|---------|
| `types/index.ts` | Invoice type exports for feature consumers |

## Business rules / invariants
- Frontend currently consumes invoice typings only; API bindings were removed as unreferenced dead code.
- Existing inquiry-domain types can keep importing invoice shapes from this feature.

## Related modules
- **Backend**: `packages/backend/src/finance/invoices`
- **Frontend**: `features/workflow/inquiries/types` for inquiry aggregate typing
- **Workflow**: `features/workflow/inquiries` for inquiry ownership
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

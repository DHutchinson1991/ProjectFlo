# Invoices

## What this module does
Owns inquiry invoice endpoint bindings and invoice-facing feature exports under the finance bucket.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed invoice CRUD bindings |
| `types/index.ts` | Invoice type exports for feature consumers |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Invoices remain inquiry-scoped under `/api/inquiries/:inquiryId/invoices/*`.
- Consumers must import invoice bindings from this feature rather than `invoicesService` or `api.invoices`.
- Invoice operations stay behavior-compatible during migration.

## Related modules
- **Backend**: `packages/backend/src/finance/invoices`
- **Frontend**: `features/finance/contracts` for contract-driven billing handoff
- **Workflow**: `features/workflow/inquiries` for inquiry ownership
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

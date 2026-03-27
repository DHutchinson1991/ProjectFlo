# Quotes

## What this module does
Owns inquiry-scoped quote endpoint bindings, UI components, and feature exports for pricing workflows.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed quote CRUD bindings |
| `hooks/use-quotes-api.ts` | React Query hooks for quote operations |
| `components/QuotesCard.tsx` | Thin shell — accordion list orchestrator (~195 lines) |
| `components/QuoteListItem.tsx` | Single quote row with expand/collapse, category bar, actions |
| `components/QuoteBuilderDialog.tsx` | Full-screen dialog for create/edit with import-from-estimate support |
| `types/index.ts` | Quote type exports for feature consumers |
| `index.ts` | Public barrel exports |

## Business rules / invariants
- Quotes stay inquiry-scoped under `/api/inquiries/:inquiryId/quotes/*`.
- Primary quote selection is handled by quote update, not a parallel compatibility path.
- Consumers must import from this feature, not `quotesService` or `api.quotes`.
- New quotes auto-import the primary estimate's line items when available.
- UI components use shared primitives from `features/finance/shared/`.

## Related modules
- **Backend**: `packages/backend/src/finance/quotes`
- **Shared UI**: `features/finance/shared` — FinanceSummarySidebar, CategoryBreakdownBar, ExpandedCategoryItems, PaymentScheduleRows
- **Shared utils**: `shared/utils/pricing.ts` (computeTaxBreakdown), `shared/utils/formatUtils.ts` (getCurrencySymbol)
- **Frontend**: `features/finance/estimates` for import-from-estimate flow
- **Frontend**: `features/finance/payment-schedules` for quote milestones
- **Workflow**: `features/workflow/inquiries` for inquiry ownership
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

# Estimates

## What this module does
Owns inquiry estimate endpoint bindings, UI components, and feature exports for inquiry pricing workflows.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed estimate CRUD, send, revise, refresh, and snapshot bindings |
| `mappers/estimate-mappers.ts` | Normalizes API payloads into frontend estimate types (date parsing + item mapping) |
| `hooks/use-estimates-api.ts` | React Query hooks for estimate operations |
| `hooks/useEstimateAutoGen.ts` | Auto-generates initial line items from inquiry package |
| `components/EstimatesCard.tsx` | Thin shell — accordion list orchestrator (~220 lines) |
| `components/EstimateListItem.tsx` | Single estimate row with expand/collapse, category bar, actions |
| `components/EstimateBuilderDialog.tsx` | Full-screen dialog for create/edit with line-item editor |
| `components/EstimateVersionPopover.tsx` | Snapshot version history popover |
| `types/index.ts` | Estimate, EstimateSnapshot, CreateEstimateData, UpdateEstimateData |
| `index.ts` | Public barrel exports |

## Business rules / invariants
- Estimates are always inquiry-scoped under `/api/inquiries/:inquiryId/estimates/*`.
- Refresh, revise, send, and snapshot history are part of the same estimate lifecycle.
- Consumers must import from this feature, not `estimatesService` or `api.estimates`.
- API payloads are normalized through `mappers/estimate-mappers.ts` before hooks expose data to consumers.
- UI components use shared primitives from `features/finance/shared/`.

## Related modules
- **Backend**: `packages/backend/src/finance/estimates`
- **Shared UI**: `features/finance/shared` — FinanceSummarySidebar, CategoryBreakdownBar, ExpandedCategoryItems, PaymentScheduleRows
- **Shared utils**: `shared/utils/pricing.ts` (computeTaxBreakdown), `shared/utils/formatUtils.ts` (getCurrencySymbol)
- **Frontend**: `features/finance/payment-schedules` for milestone application and status updates
- **Workflow**: `features/workflow/inquiries` for the parent inquiry surface
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

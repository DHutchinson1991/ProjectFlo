# Pricing Module

## What this module does

Computes a full `PriceBreakdown` for a service package — crew costs, equipment costs, task costs, and grand total. This is the primary endpoint used by the Needs Assessment flow to show estimated pricing before an estimate or quote is created.

## Key files

| File | Purpose |
|------|---------|
| `pricing.service.ts` | Builds `PriceBreakdown` for packages and inquiries via shared helpers |
| `services/pricing-audit.service.ts` | Rate audit: resolves which fallback tier each operator uses |
| `types/price-breakdown.ts` | `PriceBreakdown` interface (re-exported from service for compat) |
| `pricing.controller.ts` | `GET /pricing/:brandId/package/:packageId`, inquiry pricing, audit-rates |
| `pricing.module.ts` | Imports `TaskLibraryModule` for `previewAutoGeneration` |

## Business rules / invariants

- The 3-tier rate fallback order must be preserved: matched-role bracket → primary bracket → any bracket → videographer fallback.
- Equipment cost is deduplicated by `equipment_id` — never sum per-operator.
- `previewAutoGeneration()` (in task-library) is the single source of truth for task cost; do not reimplement multiplier logic here.
- All amounts are PRE-TAX. Post-tax is computed frontend-only for display.

## Keep docs up to date

After ANY code change in this module, update `PRICING_TOTALS_REFERENCE.md` (root) and this README if business rules, key files, or cross-references changed.

## Related modules

- **Backend**: `../task-library` — provides `previewAutoGeneration` for task cost rows
- **Backend**: `../../payment-brackets` — stores hourly rate brackets used in fallback chain
- **Frontend**: Needs Assessment `SummaryScreen` consumes the breakdown
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root) — full pricing contract

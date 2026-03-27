# Payment Schedules Module

## What this module does

Manages payment schedule templates (brand-scoped rules like "50% after booking, 50% before event") and applies them to estimates or quotes to generate concrete milestones with resolved currency amounts.

## Key files

| File | Purpose |
|------|---------|
| `payment-schedules.service.ts` | Template CRUD + apply-to-estimate/quote logic |
| `payment-schedules.controller.ts` | Three controllers: templates, estimate milestones, quote milestones |
| `dto/payment-schedule.dto.ts` | Template rules, apply-to-estimate/quote DTOs |

## Business rules / invariants

- Templates are brand-scoped via `brand_id`.
- Rules define `amount_type` (PERCENT or FIXED) and `trigger_type` (AFTER_BOOKING, BEFORE_EVENT, etc.).
- Applying a schedule resolves percentages into currency amounts — milestone `.amount` is final, never multiply again.
- PERCENT rules are computed against the estimate/quote `total_amount` (PRE-TAX).

## Keep docs up to date

After ANY code change in this module, update `PRICING_TOTALS_REFERENCE.md` (root) and this README if business rules, key files, or cross-references changed.

## Related modules

- **Backend**: `../estimates` — milestones are applied to estimates
- **Backend**: `../quotes` — milestones are applied to quotes
- **Frontend**: `EstimatesCard.tsx`, `QuotesCard.tsx` — display milestones
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root)

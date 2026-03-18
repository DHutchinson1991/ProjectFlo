---
applyTo: "**"
---

# ProjectFlo — Pricing & Totals Instructions

Before writing, editing, or debugging any code related to:
- Package price estimation (the `/pricing` endpoint)
- Task auto-generation costs (`previewAutoGeneration`)
- Estimates or quotes (creation, update, totals, line items)
- Payment brackets or job role rates
- Payment schedule milestones
- The Needs Assessment builder pricing flow
- The Inquiry Package Wizard (upcoming)

**READ `PRICING_TOTALS_REFERENCE.md` at the project root FIRST.**

## Keep the reference up to date

After making ANY code change to pricing or business logic (new endpoints, formula tweaks, field additions, bug fixes, etc.), **review `PRICING_TOTALS_REFERENCE.md` and update it** so the documented behaviour matches the new code. This includes:
- Adding/removing fields, interfaces, or endpoints
- Changing computation formulas or fallback logic
- Adding new invariant rules or removing obsolete ones
- Updating the Source Files Quick Reference table if files moved or were created

The goal is for `PRICING_TOTALS_REFERENCE.md` to always be the single source of truth that any agent can read to understand current pricing behaviour without diving into code.

## Non-negotiable rules (from that document)

- `total_amount` is computed server-side via `items.reduce(qty × unit_price)` — never derive it elsewhere
- `total_amount` stored in DB is PRE-TAX (pure items sum) — `summary.subtotal` in PriceBreakdown is also PRE-TAX
- Frontend sends `items[]` only (no `total_amount` field) — backend recalculates from items
- Post-tax total is computed frontend-only for display and milestone calculation
- Payment milestone `.amount` is a resolved currency value — do NOT multiply it by `total_amount`
- `previewAutoGeneration()` is the single source of truth for task cost; do not reimplement the multiplier logic
- The 4-tier rate fallback order in `pricing.service.ts` must be preserved (matched-role bracket → primary bracket → any bracket → default_hourly_rate → videographer fallback)
- Equipment cost is deduplicated by `equipment_id` — never sum it per-operator
- Updating an estimate/quote without sending `items[]` preserves `total_amount` as-is

## Key files

| Concern | Backend | Frontend |
|---------|---------|----------|
| Package estimate | `src/business/pricing/pricing.service.ts` | `needs-assessment/page.tsx`, `SummaryScreen.tsx` |
| Task cost | `src/business/task-library/task-library.service.ts` | `EstimatesCard.tsx` |
| Estimates | `src/estimates/estimates.service.ts` | `_detail/_components/EstimatesCard.tsx` |
| Quotes | `src/quotes/quotes.service.ts` | `_detail/_components/QuotesCard.tsx` |
| Brackets | `src/payment-brackets/payment-brackets.service.ts` | — |
| Milestones | `src/payment-schedules/payment-schedules.service.ts` | `EstimatesCard.tsx`, `QuotesCard.tsx` |

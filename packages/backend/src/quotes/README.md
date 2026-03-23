# Quotes Module

## What this module does

CRUD for quotes scoped to an inquiry. A quote is a finalized line-item document sent to the client. Quotes share the same `total_amount` computation pattern as estimates but add fields like `title`, `is_primary`, `tax_rate`, `deposit_required`, and `consultation_notes`.

## Key files

| File | Purpose |
|------|---------|
| `quotes.service.ts` | Create, update, delete quotes; total computed from items |
| `quotes.controller.ts` | `POST/GET/PATCH/DELETE /api/inquiries/:inquiryId/quotes` |
| `dto/create-quote.dto.ts` | Validation: items array, status enum, dates, title, tax |
| `dto/update-quote.dto.ts` | Partial update DTO |
| `entities/quote.entity.ts` | TypeScript interfaces for Quote and QuoteItem |

## Business rules / invariants

- Same `total_amount` rules as estimates: server-computed, PRE-TAX, items-only.
- Frontend sends `items[]` only — backend recalculates `total_amount`.
- Milestone `.amount` is a resolved currency value — do NOT multiply by `total_amount`.

## Keep docs up to date

After ANY code change in this module, update `PRICING_TOTALS_REFERENCE.md` (root) and this README if business rules, key files, or cross-references changed.

## Related modules

- **Backend**: `../payment-schedules` — applies milestone schedules to quotes
- **Backend**: `../inquiry-tasks` — quote acceptance can update inquiry task status
- **Frontend**: `QuotesCard.tsx` in inquiry detail — displays and manages quotes
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root)

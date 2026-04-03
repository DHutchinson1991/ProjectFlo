# Invoices Module

## What this module does

CRUD for invoices scoped to an inquiry. Supports manual invoice creation with line items, milestone-based invoice regeneration from the primary quote, and manual payment recording (bank transfer/offline) against an invoice.

## Key files

| File | Purpose |
|------|---------|
| `invoices.service.ts` | CRUD + `autoGenerateFromQuoteMilestones` + `recordPayment` |
| `invoices.controller.ts` | `POST/GET/PATCH/DELETE /api/inquiries/:inquiryId/invoices` + `POST :id/payments` |
| `dto/create-invoice.dto.ts` | Validation: items array, dates, status |
| `dto/update-invoice.dto.ts` | Partial update DTO |
| `dto/record-payment.dto.ts` | Validation for manual payment recording payload |

## Business rules / invariants

- `amount` is computed server-side from `items.reduce(qty × unit_price)` — frontend never sends total.
- `recordPayment` rejects overpayments and updates invoice status to `Paid` or `Partially Paid` based on cumulative payments.
- `recordPayment` defaults method to `Bank Transfer` when method is omitted.
- Regeneration deletes existing `Draft` invoices only, then rebuilds invoice schedule from quote payment milestones.

## Related modules

- **Backend**: `../stripe` — Stripe webhook creates online `payments` rows for checkout completions
- **Backend**: `../../workflow/tasks` — auto-completes inquiry tasks
- **Frontend**: `features/finance/invoices` — invoice management UI
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root)

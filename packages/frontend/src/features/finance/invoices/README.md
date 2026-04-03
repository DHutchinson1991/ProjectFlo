# Invoices

## What this module does
Owns invoice data access, mutations, and invoice/payment UI used from inquiry workflow surfaces, including manual payment recording for bank transfer and other offline payment methods.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed invoice endpoint bindings (`get/create/update/delete/regenerate/recordPayment`) |
| `hooks/index.ts` | React Query hooks for invoice reads and mutations |
| `components/InvoicesCard.tsx` | Inquiry-facing invoice list, actions, and payment preview links |
| `components/RecordPaymentDialog.tsx` | Manual payment capture dialog (amount/method/date/reference) |
| `components/InvoiceDetailView.tsx` | Expanded invoice + payment history presentation |
| `types/index.ts` | Invoice, payment, and mutation payload types |

## Business rules / invariants
- Manual payment recording is studio-side only and must update invoice totals/status via backend mutation.
- `Record Payment` is available only when invoice status is not `Paid`, `Cancelled`, or `Voided`.
- Payment history display prefers enriched metadata when available (`transaction_id`, `receipt_url`, card details).
- `Send Receipt` uses the latest recorded payment for the invoice and prefers `receipt_url` when present; otherwise it falls back to the client payments portal link.

## Related modules
- **Backend**: `packages/backend/src/finance/invoices` — invoice CRUD and manual payment recording endpoint
- **Frontend**: `features/workflow/inquiries/components/tabs/PricingTab.tsx` — primary consumer surface
- **Workflow**: `features/workflow/client-portal` — public payment portal presentation
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

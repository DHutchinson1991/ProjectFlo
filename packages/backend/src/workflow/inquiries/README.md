# Inquiries Module

## What this module does
Owns inquiry lifecycle logic, public client portal data, proposal/contract portal state, package assignment, and inquiry-owned schedule snapshots.

## Key files
| File | Purpose |
|------|---------|
| `inquiries.service.ts` | Core inquiry updates, package selection, and schedule-snapshot orchestration |
| `client-portal.service.ts` | Facade/orchestration for client portal payload assembly |
| `services/client-portal-data.service.ts` | Builds tokenized portal data (proposal, invoices, payments, summary) |
| `services/client-portal-sections.service.ts` | Maps portal section payloads and normalized invoice projections |
| `public-client-portal.controller.ts` | Public token-based portal endpoints |
| `inquiry-availability.service.ts` | Availability and auto-subtask sync logic |

## Business rules / invariants
- Selecting or swapping a package must preserve inquiry-owned commercial records such as estimates, quotes, proposals, and contracts.
- Package assignment for budget-only inquiries belongs in the inquiry package scope workflow; do not force package selection in needs-assessment submission.
- Public portal, proposal review, and contract signing are one client-facing workflow and must share consistent token-driven inquiry data.
- Inquiry-owned schedule snapshots are the editable copy; package templates are only the source.
- Portal invoice payloads should include recorded payment metadata when available (`transaction_id`, `receipt_url`, `card_brand`, `card_last4`, `payer_email`, `currency`).
- `paid_date` in portal invoice responses must be derived from recorded payments for `Paid` invoices.

## Active design notes
- **Package assignment / safe swap**: studio-side package assignment belongs in the inquiry PackageScope flow. Package swaps must preserve user-entered schedule data wherever practical instead of wiping and recloning blindly.
- **Portal merge direction**: the public portal is the long-term home for proposal review and contract signing. Avoid adding new duplicated client-facing flows that fragment portal, proposal, and signing experiences.

## Related modules
- **Frontend**: `packages/frontend/src/app/(studio)/sales/inquiries/README.md` — studio inquiry screens and cards
- **Frontend**: `packages/frontend/src/app/(portal)/README.md` — client portal surfaces
- **Reference docs**: `packages/backend/src/business/pricing/README.md`
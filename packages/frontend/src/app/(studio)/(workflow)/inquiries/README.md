# Studio Inquiries Feature

## What this module does
Owns the studio-side inquiry screens: inquiry detail, package scope, estimates, quotes, proposals, contracts, availability, and needs-assessment review.

## Key files
| File | Purpose |
|------|---------|
| `page.tsx` | Inquiry list route |
| `[id]/page.tsx` | Inquiry detail route shell |
| `[id]/components/PackageScopeCard.tsx` | Package selection and package scope editing |
| `features/finance/estimates/components/EstimatesCard.tsx` | Estimate management |
| `features/finance/quotes/components/QuotesCard.tsx` | Quote management |
| `[id]/_detail/_components/ProposalsCard.tsx` | Proposal management |

## Business rules / invariants
- Budget-only inquiries must still support package assignment from the studio side.
- Package swaps must not casually destroy user-entered schedule data.
- Inquiry detail cards are part of one workflow and should not diverge in data model assumptions from backend inquiries services.

## Related modules
- **Backend**: `packages/backend/src/inquiries/README.md` — inquiry lifecycle and portal services
- **Reference docs**: `packages/backend/src/business/pricing/README.md`
# Payment Brackets

## What this module does
Owns crew payment bracket API bindings and feature exports used by crew management surfaces.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Payment bracket endpoint bindings |
| `hooks/use-payment-brackets-api.ts` | Hook wrapper for payment bracket API access |
| `types/index.ts` | Payment bracket type exports |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Crew pages consume payment brackets through this feature module.
- Bracket assignment and unassignment behavior remains unchanged.
- Consumers stop referencing `api.paymentBrackets` directly.

## Related modules
- **Backend**: `packages/backend/src/workflow/crew` — bracket and crew endpoints
- **Frontend**: `app/(studio)/manager/crew/page.tsx`, `app/(studio)/resources/crew/page.tsx`
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

# Contracts

## What this module does
Owns inquiry contract delivery plus template, clause, preview, and public signing APIs under one finance feature.

## Key files
| File | Purpose |
|------|---------|
| `api/contracts.api.ts` | Inquiry contract CRUD, send, sync, and compose operations |
| `api/templates.api.ts` | Contract template operations |
| `api/clauses.api.ts` | Clause and category operations |
| `api/signing.api.ts` | Public signing operations |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Contract delivery remains inquiry-scoped under `/api/inquiries/:inquiryId/contracts/*`.
- Public signing uses the public API client and must keep working for the portal signing route.
- Contract template and clause settings share the same finance/contracts ownership as inquiry contract composition.
- Consumers must import from this feature, not `contractsService`, `contractSigningService`, `api.contractTemplates`, or `api.contractClauses`.

## Related modules
- **Backend**: `packages/backend/src/finance/contracts`
- **Frontend**: `features/finance/payment-schedules` for default payment terms linked to templates
- **Workflow**: `features/workflow/inquiries` for inquiry-level contract entry points
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

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
| `hooks/queryKeys.ts` | Brand-scoped query key factory for all contracts cache entries |
| `hooks/use-contracts.ts` | All React Query hooks: queries + mutation groups |
| `hooks/index.ts` | Barrel export for hooks |
| `index.ts` | Public feature exports |

## Business rules / invariants
- Contract delivery remains inquiry-scoped under `/api/inquiries/:inquiryId/contracts/*`.
- Public signing uses the public API client; `useSigningContract` and `useSubmitSignature` are brand-free (no `brandId` in key).
- Contract template and clause settings share the same finance/contracts ownership as inquiry contract composition.
- All server state must go through the hooks in `hooks/use-contracts.ts` — do not call API modules directly from components.
- `ContractDetailScreen` initialises local form state from query data once (via `useRef` guard); subsequent RQ refetches must not overwrite in-progress edits.

## Related modules
- **Backend**: `packages/backend/src/finance/contracts`
- **Frontend**: `features/finance/payment-schedules` for default payment terms linked to templates
- **Workflow**: `features/workflow/inquiries` for inquiry-level contract entry points
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md`

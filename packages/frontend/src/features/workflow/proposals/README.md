# Proposals

## What this module does
Owns the frontend proposal workflow for studio inquiry proposals and the public share-view. It centralizes proposal API bindings, proposal-specific types, share-link helpers, and the feature screens used by the proposal routes.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | `createProposalsApi` and `createPublicProposalsApi` over the shared `ApiClient` |
| `types/proposal.types.ts` | Canonical proposal request, response, and public share types for this feature |
| `constants/query-keys.ts` | Brand-scoped React Query keys for studio proposal data |
| `hooks/use-inquiry-proposals.ts` | Loads and refreshes the inquiry-scoped proposal list |
| `hooks/use-proposal-detail.ts` | Loads the studio proposal detail record with a brand-scoped cache key |
| `hooks/use-public-proposal.ts` | Loads the public proposal share view with a token-scoped cache key |
| `hooks/use-proposal-share-link.ts` | Generates preview/share tokens and copy/open helpers |
| `screens/InquiryProposalsScreen.tsx` | Studio proposal list and actions for an inquiry |
| `screens/ProposalDetailScreen.tsx` | Studio single-proposal actions and status view |
| `screens/PublicProposalScreen.tsx` | Public proposal share page and response flow |
| `components/ProposalStatusChip.tsx` | Shared status chip for proposal state display |
| `index.ts` | Feature barrel for routes and components |

## Business rules / invariants
- All proposal HTTP calls flow through the feature API factory and the shared `apiClient`; no raw `fetch()`.
- Studio proposal server state uses React Query with brand-scoped query keys.
- Public proposal response contracts are owned in this feature's `types/` folder (no imports from legacy `lib/types/`).
- Studio proposal endpoints are always inquiry-scoped under `/api/inquiries/:inquiryId/proposals`.
- Public proposal share endpoints are always token-scoped under `/api/proposals/share/:token`.
- Route files are thin shells only; proposal loading, actions, and notifications live in feature `screens/`.
- Share links are generated through the feature hook and never by legacy `proposalsService` exports.

## Related modules
- **Backend**: `packages/backend/src/workflow/proposals` and related inquiry proposal controllers/services
- **Frontend**: `app/(studio)/sales/inquiries/[id]/proposals` and `app/(portal)/proposals/[token]` render this feature's screens
- **Reference docs**: `README.md` and brand proposal defaults in `app/(studio)/settings/_components/ProposalSettings.tsx`
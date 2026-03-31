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
| `hooks/use-public-proposal.ts` | Loads the public proposal share view with a token-scoped cache key (auto-polls every 30 s) |
| `hooks/use-proposal-share-link.ts` | Generates preview/share tokens and copy/open helpers |
| `screens/InquiryProposalsScreen.tsx` | Studio proposal list and actions for an inquiry |
| `screens/ProposalDetailScreen.tsx` | Studio single-proposal actions and status view |
| `screens/PublicProposalScreen.tsx` | Public proposal share page and response flow |
| `screens/ClientPortalScreen.tsx` | Client portal dashboard embedding proposal view |
| `components/ProposalView.tsx` | Orchestrator — composes all section components into the full proposal page |
| `components/SectionTracker.tsx` | Intersection + dwell-time tracker for section view and duration telemetry |
| `components/SectionNoteInput.tsx` | Inline per-section client note input on public proposal view |
| `components/ProposalAcceptanceBar.tsx` | Accept / request-changes CTA bar |
| `components/ProposalStatusChip.tsx` | Shared status chip for proposal state display |
| `components/EditorBlock.tsx` | Studio-side EditorJS rich text editor (not used in client view) |
| `components/sections/` | 11 section components + shared types/utils extracted from ProposalView |
| `components/sections/HeroSection.tsx` | Sticky header, floating orbs, monogram, title, countdown |
| `components/sections/PersonalMessageSection.tsx` | Sanitized EditorJS HTML card with accent bar |
| `components/sections/EventDetailsSection.tsx` | 3-col: date/countdown (left), deduplicated venue name list (middle), Google Maps embed with full address (right). Collapses gracefully when no locations present. |
| `components/sections/PricingSection.tsx` | Line items grid, tax, totals, deposit chip |
| `components/sections/PackageDetailsSection.tsx` | Package contents list with prices |
| `components/sections/FilmsSection.tsx` | Film deliverables with type and duration |
| `components/sections/ScheduleTimelineSection.tsx` | Day timeline with activities, moments |
| `components/sections/SubjectsSection.tsx` | Key people grid (subjects) |
| `components/sections/LocationsSection.tsx` | Location list with addresses. **No longer rendered standalone** — location data is now embedded inside `EventDetailsSection`. Component kept for reference. |
| `components/sections/TeamTiersSection.tsx` | Tiered crew org-chart (leadership/production/post-prod) with equipment bezier connectors |
| `components/sections/FooterSection.tsx` | Brand info and contact details |
| `components/sections/section-utils.tsx` | UI primitives: `SectionDivider`, `RevealBox` |
| `types/section.types.ts` | Section-specific types: `SectionBaseProps`, `PackageData`, `SlotGroup` |
| `utils/portal/section-helpers.ts` | Section logic: `buildCardSx`, `buildTeamTiers`, `isSectionVisible`, `getSectionTitle`, role matchers |
| `index.ts` | Feature barrel for routes and components |

## Business rules / invariants
- All proposal HTTP calls flow through the feature API factory and the shared `apiClient`; no raw `fetch()`.
- Studio proposal server state uses React Query with brand-scoped query keys.
- Public proposal response contracts are owned in this feature's `types/` folder (no imports from legacy `lib/types/`).
- Studio proposal endpoints are always inquiry-scoped under `/api/inquiries/:inquiryId/proposals`.
- Public proposal share endpoints are always token-scoped under `/api/proposals/share/:token`.
- Section analytics are tracked per section with one-time view markers and accumulated duration in seconds.
- Duration telemetry is displayed in studio proposal engagement UI per tracked section.
- Route files are thin shells only; proposal loading, actions, and notifications live in feature `screens/`.
- Share links are generated through the feature hook and never by legacy `proposalsService` exports.

## Related modules
- **Backend**: `packages/backend/src/workflow/proposals` and related inquiry proposal controllers/services
- **Frontend**: `app/(studio)/sales/inquiries/[id]/proposals` and `app/(portal)/proposals/[token]` render this feature's screens
- **Reference docs**: `README.md` and brand proposal defaults in `app/(studio)/settings/_components/ProposalSettings.tsx`
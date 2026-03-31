# Inquiries

## What this module does
Owns studio inquiry API bindings and workflow-facing inquiry helpers outside the frozen monolith. It covers inquiry CRUD, welcome-pack sending, discovery and availability endpoints, and inquiry schedule snapshot/sync access.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Typed inquiry CRUD, availability, snapshot, and schedule-sync bindings |
| `hooks/use-inquiry-apis.ts` | Stable feature hook exposing inquiry-owned API factories |
| `hooks/use-discovery-questionnaire-data.ts` | React Query hooks for discovery template, activities, payment schedule, wizard responses |
| `hooks/use-submit-discovery-questionnaire.ts` | React Query mutation for saving/updating discovery questionnaire submissions |
| `hooks/use-discovery-questionnaire-card.ts` | Form state, effects, script-hint interpolation, and handlers for the discovery call dialog |
| `constants/query-keys.ts` | Brand-scoped query key factory for discovery questionnaire data |
| `constants/discovery-questionnaire-config.tsx` | Step metadata, phase widgets, and accent config for the discovery call UI |
| `types/index.ts` | Inquiry schedule, status, and discovery questionnaire types |
| `types/schedule-snapshot.ts` | SnapshotActivity/SnapshotMoment types for schedule display |
| `components/discovery-questionnaire-card/DiscoveryQuestionnaireCard.tsx` | Card trigger for the discovery call dialog |
| `components/discovery-questionnaire-card/DiscoveryQuestionnaireFormDialog.tsx` | Main discovery call dialog (screen-level container) |
| `components/discovery-questionnaire-card/DiscoveryDialogLayout.tsx` | Dialog chrome: header, stepper, nav, success, transcript |
| `components/discovery-questionnaire-card/DiscoveryQuestionField.tsx` | Individual field renderer for discovery questions |
| `components/discovery-questionnaire-card/DiscoverySentimentPanel.tsx` | Right-panel phase sentiment widgets + recording consent toggle |
| `components/discovery-questionnaire-card/TagChipInput.tsx` | Chip-based tag input used inside DiscoveryQuestionField |
| `components/availability-card/AvailabilityCard.tsx` | Main availability card (JSX shell) |
| `components/availability-card/AvailabilityEmailBuilders.ts` | Pure functions for crew/equipment email drafts |
| `components/availability-card/StatusBanner.tsx` | Conflict/readiness progress banner |
| `components/availability-card/RequestBadge.tsx` | Crew availability request status chip + actions |
| `components/availability-card/ReserveBadge.tsx` | Equipment reservation status chip + actions |
| `components/availability-card/CrewRow.tsx` | Single crew slot row with conflict display + swap |
| `components/availability-card/EquipmentRow.tsx` | Single equipment assignment row with conflict display + swap |
| `hooks/use-availability-card.ts` | All state, effects, and callbacks for the availability card |
| `types/availability.ts` | RequestState, RequestMap, ReservationState, ReservationMap, dialog state types |
| `components/ProposalsCard.tsx` | Inquiry proposal card with section engagement, dwell-time badges, and client feedback panels |
| `README.md` | Business invariants and ownership map |

## Business rules / invariants
- All inquiry requests flow through the shared authenticated API client; no route or card should call `inquiriesService` or `api.inquiries` directly.
- Inquiry schedule snapshots are read-only package clones owned by the inquiry and must be read through this feature.
- Schedule sync for inquiries is destructive re-cloning from the selected package and must stay explicit.
- Inquiry wizard ownership stays in `features/workflow/inquiry-wizard`; this feature only owns the core inquiry domain.
- Proposal engagement time labels in inquiry cards are sourced from proposal section analytics (`duration_seconds`) and use threshold styling to highlight high-attention sections.

## Related modules
- **Backend**: `packages/backend/src/workflow/inquiries` and related inquiry endpoints under `/api/inquiries/*`
- **Frontend**: `features/workflow/inquiry-wizard` for needs-assessment and wizard flows
- **Finance**: `features/finance/*` for estimates, quotes, contracts, invoices, and payment config tied to inquiries

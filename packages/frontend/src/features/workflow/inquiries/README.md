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
| `components/discovery-questionnaire-card/DiscoveryQuestionnaireCard.tsx` | Summary card: call meta, completion/progress, and edit dialog trigger |
| `components/discovery-questionnaire-card/DiscoveryStoryCard.tsx` | Read-only couple card showing core narrative answers plus Story/Connection discovery signals (pills, multi-chip, and tag-chip selections) |
| `components/discovery-questionnaire-card/DiscoverySalesCard.tsx` | Internal read-only sales card showing sales notes plus Solution/Close discovery signals (pills, multi-chip, checklist, and date values) |
| `components/discovery-questionnaire-card/DiscoveryQuestionnaireFormDialog.tsx` | Main discovery call dialog (screen-level container) |
| `components/discovery-questionnaire-card/DiscoveryDialogLayout.tsx` | Dialog chrome: header, stepper, nav, success, transcript |
| `components/discovery-questionnaire-card/DiscoveryQuestionField.tsx` | Individual field renderer for discovery questions |
| `components/discovery-questionnaire-card/DiscoverySentimentPanel.tsx` | Right-panel phase sentiment widgets + recording consent toggle |
| `components/discovery-questionnaire-card/DiscoveryTranscriptCard.tsx` | Far-right column card for pasting/viewing call transcript; disabled state when recording consent not enabled |
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
| `components/inquiry-subjects-card/InquirySubjectsCard.tsx` | Editable couple card: Bride/Groom profile tiles with click-to-edit names + count steppers for group subjects; saves via instance subjects API |

## Business rules / invariants
- Discovery tab renders a 3-column layout: column 1 has summary + transcript, column 2 has `DiscoveryStoryCard`, and column 3 has `DiscoverySalesCard`. Story and Sales cards appear only once a submission exists. Submission state is lifted to `DiscoveryTab` and passed down as props.
- `DiscoveryQuestionnaireCard` is now a concise summary card and does not render the detailed sentiment signal grid.
- `DiscoveryStoryCard` renders couple-facing discovery signals from `submission.sentiment`, including pill selections and parsed JSON chip/tag arrays (for example: connection, dynamic, vibe, inspiration, must-haves/dealbreakers).
- `DiscoverySalesCard` renders internal sales/closing signals from `submission.sentiment`, including pill selections and parsed JSON checklist/chip arrays (for example: package reaction, add-on interest, urgency, next steps, blocking factor, follow-up date).
- The transcript lives in a separate far-right column (`DiscoveryTranscriptCard`). It is disabled (no-op state) when `recording_consent !== 'yes'`. The recording consent toggle remains in the questionnaire dialog's sentiment panel. Transcript can be pasted/edited directly from the card after the call.
- All inquiry requests flow through the shared authenticated API client; no route or card should call `inquiriesService` or `api.inquiries` directly.
- Inquiry schedule snapshots are read-only package clones owned by the inquiry and must be read through this feature.
- Schedule sync for inquiries is destructive re-cloning from the selected package and must stay explicit.
- Inquiry wizard ownership stays in `features/workflow/inquiry-wizard`; this feature only owns the core inquiry domain.
- Proposal engagement time labels in inquiry cards are sourced from proposal section analytics (`duration_seconds`) and use threshold styling to highlight high-attention sections.
- Inquiry tab owns early financial setup visibility via the estimates card, positioned beneath package scope.
- Estimates in the inquiry tab default to collapsed until manually expanded.
- Inquiry qualification is handled from Mission Control (`CommandCenterHeader` actions) via the `Mark Qualified` button, not an inline card inside the Inquiry tab.
- The `Client Portal` quick link is rendered in Mission Control contact info (left side, beside the inquiry name), not in the right-side primary action cluster.
- Task drawer deep links (hash section ids) must route through `SECTION_TO_TAB` aliases so clicking a task always activates the correct inquiry tab before scrolling.
- Proposal tab owns payment terms (single panel), plus quotes and invoices alongside proposals/contracts.
- Proposal tab uses a 3-column split: left = proposals, middle = payment terms + contracts, right = quotes + invoices.
- Quotes in the Proposal tab are collapsed by default (no auto-open primary quote row).
- Client approval card has been removed; once inquiry is qualified, Mission Control actions switch to `Convert` (Booked) and `Cancel` (Closed Lost).
- Inquiry subjects card highlights Bride and Groom as side-by-side profile badges with click-to-edit names (`real_name` saved via instance subject API). Other subjects show with editable names and count steppers (+/− buttons).
- Guest count is shown as a compact card to the right of Bride/Groom inside the inquiry subjects card.
- Event card shows an event-days counter (`Days to Event` / `Days Since`) next to the event date instead of guest count.
- Inquiry subjects in this screen must load from inquiry instance schedule endpoints (`/api/schedule/inquiries/{id}/subjects`), not package template subjects, so customized names are preserved.
- The schedule tab's `SubjectsCard` is `readOnly` — names, counts, and member names are edited from the inquiry subjects card, not the schedule view.

## Related modules
- **Backend**: `packages/backend/src/workflow/inquiries` and related inquiry endpoints under `/api/inquiries/*`
- **Frontend**: `features/workflow/inquiry-wizard` for needs-assessment and wizard flows
- **Finance**: `features/finance/*` for estimates, quotes, contracts, invoices, and payment config tied to inquiries

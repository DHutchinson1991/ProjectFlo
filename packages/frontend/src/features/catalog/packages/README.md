# catalog / packages

Manages service packages and package templates in a unified view. Packages are flat-listed by service type (no slot/tier grouping) and package templates are editable inline.

## Responsibilities
- Unified services & packages page with 2-column layout (60/40 split)
- Service type cards (phase-style: Weddings, Birthdays, Engagements) with active/inactive counts and enable/disable toggles
- Flat package list filtered by selected service (left column)
- Package detail summary panel with inline name/description editing (right column)
- Event type template editor (days, activities, moments, subjects) shown when no package is selected (right column)
- Package CRUD, creation wizard, and full package editor (separate route)
- React Query hooks for package library, service packages, and package templates

## Folder Shape
```
api/               — Typed API bindings (`service-packages.api.ts`, `package-sets.api.ts`)
constants/         — Query keys for package library, package sets, and package detail invalidation
components/
  unified/         — ServiceCardsGrid, PackageListPanel, PackageDetailPanel, EventTypeEditorPanel
  listing/         — Legacy: PackageSetCard, PackagePickerDialog (kept for backward compat)
  detail/          — CrewCard, PackageContentsCard, SummaryCard, etc. (full package editor)
  creation/        — PackageCreationWizard (thin shell) + decomposed subfolders:
    types/         — `wizard.types.ts` — all wizard-specific type definitions
    helpers/       — `wizard-helpers.ts` (pure functions, constants), `wizard-styles.ts` (sx factories), `equipment-preset-storage.ts` (brand-keyed equipment preset persistence)
    hooks/         — `useWizardState`, `useWizardData`, `useWizardDerived`, `useWizardHandlers`
    steps/         — EventTypeStep, BlueprintStep, ActivitiesStep, StandardGuestsStep, SubjectsStep, LocationsStep, PackageNameStep, RolesStep, CrewStep, EquipmentStep, ReviewStep
hooks/             — Package detail hooks + React Query hooks for library/mutations
screens/           — UnifiedPackagesScreen (main), PackageDetailScreen, NewPackageScreen, legacy screens
types/             — PackageSet, service package models, API DTOs
utils/             — listing-helpers, film stats, slot computations
```

## Key Files
- `screens/UnifiedPackagesScreen.tsx` — Main unified page (services + packages + event type templates)
- `components/unified/ServiceCardsGrid.tsx` — Phase-style service type cards
- `components/unified/PackageListPanel.tsx` — Left column flat package list
- `components/unified/PackageDetailPanel.tsx` — Right column package summary with inline editing
- `components/unified/EventTypeEditorPanel.tsx` — Right column package template editor
- `hooks/usePlanningProgress.ts` — Package-planning SSE hook used by the detail screen for live activity/moment/subject progress plus replayed blocking event history
- `hooks/usePackageAiRuns.ts` — React Query hooks for package AI run history and per-run logs
- `components/detail/PackageAiRunsPanel.tsx` — Bottom-floating package AI drawer while planning, plus history/log modal when idle
- `components/detail/PackageAiLiveChatFeed.tsx` — Copilot-style live prompt/response feed for the floating AI drawer, rendered newest-first from the latest run transcript
- `components/detail/PackageAiRunArtifactsView.tsx` — Extra artifacts tab content for the AI run modal, including the structured transcript and saved run payload snapshots
- `components/detail/PackageAiTranscriptView.tsx` — Structured prompt/response transcript renderer for package AI run detail, including extracted thinking fields when the run logged them
- `types/service-package.types.ts` — `ServicePackage` interface
- `components/listing/listing-helpers.ts` — Category colors, emojis, tier helpers

## Key Routes
- `/packages` — Unified services & packages page
- `/packages/[id]` — Full package editor
- `/packages/new` — Package creation wizard
- `/packages/list` — Redirects to `/packages`
- `/event-type-templates` — Redirects to `/packages`

## Notes
- Old slot/tier-based package sets view (`PackageSetsScreen`) is deprecated but kept for reference, and its set contracts now key off `event_category` instead of deleted package-category records.
- Old `PackagesListScreen` table view is deprecated; the flat list in `PackageListPanel` replaces it.
- Package templates are now embedded in the right panel of the unified page.
- Package library screens should use feature hooks from `hooks/` instead of calling APIs directly.
- In `PackageDetailScreen`, the People tab adjusts guest headcount directly from the `Guests` table row instead of showing a header-level `Standard guests` selector.
- In `PackageDetailScreen`, the People tab suggestion chips must come from the package's matching event-type subject roles, not the brand-wide subject-role catalog, and role matching normalizes spelling variants such as `Honor`/`Honour`.
- In `PackageDetailScreen`, selecting a subject while a moment is active must preserve that moment selection so the context panel can show the subject-specific action for the selected moment while still keeping the moment's generic description visible.
- In `PackageDetailScreen`, planner SSE focus metadata now tracks the active activity, moment, and subject set. The Activities column still shows an icon-only inline moment spinner, the People tab mirrors that state on matching subject rows, and live package-creator progress now lives in a compact bottom-floating AI summary widget instead of an activities-column banner or an expanded middle drawer.
- While package creation is running, the compact AI widget shows the current headline, granular status text, and a progress bar without expanding into extra chip rows. Clicking it opens the full AI runs modal directly.
- The AI run modal now uses three columns on desktop: run history, a completed-task sidebar, and a tabbed inspector. `Realtime view` is the default landing tab and now owns the detailed live progress UI that used to live in the expanded drawer, alongside the Copilot-style prompt/response feed. `Master log` and `Artifacts` remain separate tabs.
- During package blocking, the shared planning SSE stream now carries per-moment substeps (`pre-seed`, `llm-request-started`, `llm-response-received`, `parse-complete`, `guardrails-applied`, `persisted`) plus optional telemetry such as moment/space names, queue wait, AI duration, correction notices, and a final blocking summary. `PackageAiRunsPanel` turns that into an overall progress bar, an expandable moment timeline, and an on-demand trace-log viewer backed by `/api/packages/:id/planning-log`.
- When package creation is idle, the package detail page shows a floating sparkle launcher near the bottom center; opening it reveals package-scoped AI run history plus a structured prompt/response transcript and the raw `master.log` from `/api/packages/:id/ai-runs`.
- The package creation wizard exposes `Standard guests` on its own step immediately after Activities, then seeds `Guests` subject rows with that headcount when the package is created.
- Package creation wizard normalizes event-type subject payloads: it supports both legacy `subject_types` and current role-link payloads.
- Package creation surfaces only one visible service-type option per `event_category`; variant templates such as regional/traditional wedding presets are collapsed behind the canonical Wedding/Birthday/Engagement option instead of being shown as separate first-step cards.
- The wizard no longer depends on pre-seeded activity moments; it creates packages from days/activities/crew only, and activity moments are generated later by the AI planner on demand.
- In `PackageDetailScreen`, the activity sparkle button opens the AI planner only when the activity is linked to a real film scene; otherwise it is shown disabled with a hint.
- In `PackageDetailScreen`, the package timeline still enters through `workflow/scheduling/package-template`, but its visual shell is the shared `@/shared/ui/PackageTimeline` component so Day Designer and package detail use one timeline treatment.
- In `PackageDetailScreen`, the package activities column still enters through `workflow/scheduling/package-template`, but `ActivitiesCard` now adapts package data into the shared `@/shared/ui/PackageActivityTable` renderer so Day Designer and package detail use the same package-style activity/moment rows.
- In `PackageDetailScreen`, `components/detail/header/PackageHeader.tsx` adapts package name editing, version history, and saving state into the shared `@/shared/ui/PackageSurfaceHeader` renderer so Day Designer and package detail share the same top-header treatment.
- **Package creation wizard uses a roles-first workflow:** Step 6 defines required job role positions (with quantities), Step 7 optionally assigns crew to those positions. The backend creates `PackageCrewSlot` entries for all positions — assigned crew get `crew_id` set, unassigned positions have `crew_id: null`. This replaced the old crew-first flow where you picked crew members and attached roles to them.
- The wizard sends `roleSlots` (array of `{ jobRoleId, quantity }`) alongside `crewAssignments` in the creation payload. The backend `EventTypesCrewBuilderService.createCrewAssignments()` iterates roleSlots to create all positions first, then fills in any additional crew assignments not covered by roleSlots for backward compatibility.
- Package creation is now blueprint-first: Step 2 requires a published Day Blueprint selection and uses the same horizontal one-row card treatment as the old day selector, with selection shown by outline/background (no check icon).
- In blueprint mode, the Activities step becomes informational and manual template activity/day picks are not used; the selected blueprint becomes the authoritative source for days/activities/moments/actions at create time.
- **Crew presets (Step 7):** The CrewStep exposes an inline preset picker (no modal). Selecting a preset replaces `roleSlots` + `crewAssignments` with the preset's contents. "Save as preset" captures the current role list + assignments as a reusable `CrewPreset` (brand-scoped). Preset storage lives in `workflow/crew` (`features/workflow/crew/api/crew-presets.api.ts`) and is backed by the `catalog/crew-presets` backend module.
- **Equipment presets (Equipment step):** The EquipmentStep now mirrors the crew flow with an inline preset picker plus save/delete controls. Presets capture camera/audio slot order, selected gear, and linked crew assignments, and are stored per brand in browser storage through `components/creation/helpers/equipment-preset-storage.ts`.

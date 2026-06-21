# Day Blueprints (Day Designer — frontend)

Frontend surface for the Day Designer. Lets brand admins author reusable
day blueprints and publish versions that the package creation wizard can
consume.

## Structure

| Layer | File | Purpose |
| --- | --- | --- |
| Types | `types/index.ts`, `types/ai.ts` | Shape types for blueprints, versions, days, activities, moments, moment actions/placements, subject roles, space slots, lock rules, AI runs/proposals/diffs |
| API | `api/index.ts`, `api/ai.ts`, `api/authoring.ts`, `api/simulator.ts` | Typed client over `/api/day-blueprints*` (reads + authoring mutations + AI runs/proposals/preview + Simulator refine/completeness) |
| Hooks | `hooks/index.ts`, `hooks/ai.ts`, `hooks/authoring.ts`, `hooks/simulator.ts` | React Query hooks for reads (`useDayBlueprints`, `useDayBlueprintVersion`), authoring (`useCreate/Update/Delete` for days/activities/moments/actions/placements, `useCreateDayBlueprintVersion`), AI (`useGenerateDayBlueprintDay`, `useDayBlueprintAiRuns`, `useDayBlueprintAiProgress`, `useDayBlueprintAiProposals`, `useStart/FinishDayBlueprintAiRun`, `useCreate/Preview/Apply/RejectDayBlueprintAiProposal`), and Simulator (`useSimulationCompleteness`, `useRefineDayBlueprintDay`, `useGenerateDayBlueprintSpatial`) |
| UI | `components/DayBlueprintsPanel.tsx` | List shell + sectioned per-blueprint detail panel (Status Summary, Usage Impact, Readiness, Content Footprint, Version Intelligence) and per-version action rail (Edit/Open/Publish/Archive/Delete icon); the left pane now renders a single-row blueprint table (Type, Name, Days, Activities, Moments, Version) from backend row summary fields and keeps row-selection into the sticky detail panel; launches the extracted create wizard dialog |
| UI | `components/CreateDayBlueprintDialog.tsx` | Package-style multi-step create wizard with one-page-per-step flow: service type, wedding template choice, blank-wedding question steps (event days, activities, guest count), and final required naming/optional description step before creation. Day Designer AI moment density always uses backend product defaults (the wizard has no pacing step). |
| UI | `components/DayBlueprintVersionEditor.tsx` | Version editor shell that composes the shared package-style header, the extracted timeline/activity adapters, the floor-plan surface, and the right context panel. The context panel's "Generate Day/Activity Spatial" action now calls the non-destructive spatial generator (`/spatial-generate`) so placement hints are backfilled without regenerating or replacing activities/moments. |
| UI | `components/DayBlueprintTimelineSection.tsx` | Day Blueprint adapter for the shared `@/shared/ui/PackageTimeline`; maps blueprint days/activities into the common timeline surface and keeps draft-day creation local |
| UI | `components/DayBlueprintActivitiesRail.tsx` | Day Blueprint adapter for the shared `@/shared/ui/PackageActivityTable`; maps blueprint activity/moment rows, metrics, and CRUD hooks into the common activity column, and merges live pending AI moment previews so moments reveal one-by-one during generation |
| UI | `components/DayBlueprintFloorPlanTab.tsx` | Read-only middle-panel Floor plan tab. Single top info bar displays: space name, space-kind chip (Ceremony/Reception/Prep/Portraits/Cocktail), active moment or activity label, subject count, and placement status. Canvas area is frameless (no border or card background) so it blends into the page. Passes `hideLabels` to `SpaceSlotOverlay` so in-canvas text labels (zone labels + LABEL-type objects) are suppressed — space name is shown once in the top bar only. Hand tool toggle (top-bar button or Space key held) enables left-click drag pan via `togglePanMode`. Fit-to-view button resets the viewport. Controls are wired through `onControlsReady` callback from `SpaceSlotOverlay`. |
| UI | `components/simulator/simulator-steps.tsx` | Dynamic one-question-per-screen step renderers plus `buildSimulatorSteps()`, `StepRail`, `CompletenessMeter`, and brief composer. Wedding Shape collects type and event days; selecting multiple event days inserts per-day design screens before the main Activities question. Activities collects reusable main-day activity blocks such as prep, ceremony, portraits, reception, speeches, first dance, evening party, and exit. Sandbox People collects reusable subject-role pairings and guest count rather than actual names, wedding-party counts, speech planning, clock times, moments, subject actions, spatial placement, or specific venues. Sandbox location spaces, activity timings, moments, actions, and placements are generated automatically from the selected activities. An officiant role is assumed by default for ceremony simulations. |
| UI | `components/simulator/useSimulatorAnswers.ts` | Local-only Simulator answer store; derives the assumptions list sent to the AI on Refine |
| UI | `components/DayBlueprintAiRunsPanel.tsx` | Right-side **Day Designer** drawer mounted by the version editor. While a run is RUNNING it shows a live timeline (each moment streamed in via `moment-streaming`/`moment-persisted` events appears as it arrives), a Cancel button that calls `POST /versions/:versionId/ai-runs/:runId/cancel` to abort the LLM/persist transaction and roll back partial writes, and a per-subject spatial progress strip. Once a run reaches a terminal state it shows the final summary (moments / actions / placements counts, guardrail warnings, run duration) and a link to the on-disk `report.json`. The legacy "proposals" tab and the "Generate day blueprint" form inside this drawer were removed — generation is launched from the editor toolbar and there are no human-review proposals in the current flow. |
| UI | `components/DayBlueprintProposalReviewDialog.tsx` | Proposal review with guardrail preflight (POST `/versions/:id/ai-preview`) and Apply button |
| Route | `app/(studio)/(content)/day-designer/page.tsx` | Blueprint list page |
| Route | `app/(studio)/(content)/day-designer/[blueprintId]/[versionId]/page.tsx` | Version editor route (mounts editor + AI runs panel) |

## Cross-module links

- People suggestions in the version editor are scoped through catalog package templates: the blueprint `event_category` is matched to `useEventTypes()` and only that template's subject roles are suggested, with brand-wide roles used only when no matching template exists.
- Floor plan preview reuses `features/workflow/locations` `SpaceSlotOverlay`; Day Designer supplies a synthetic subject-only package-space-slot shape because blueprint slots store placement hints rather than persisted package spatial coordinates. The tab renders only the active activity/moment space, expands across the editor when selected, and seeds room portrayals (ceremony seating/aisle/altar, reception tables/dance floor/bar, prep, portraits, cocktail, or generic). Draft versions backfill activity-specific sandbox spaces (for example, `Ceremony Space`) when an activity has no named venue space, while explicitly named location-role spaces can still be shared across activities. These previews are now object/zone-driven and no longer synthesize anchor markers.
- AI day generation expects every generated moment to include subject actions and spatial placement intent. The backend persists these rows directly, falls back to deterministic coverage if the model omits a moment, and streams per-moment events through `ai-events` so the activities rail and the right-side AI drawer can reveal each moment row as generation progresses.

- **Token-streamed reveal.** The backend now drives Gemma through `chatStream()` and parses the JSON output token-by-token. As each `activities[i].name` and `moments[j].name` becomes visible the backend emits `activity-streaming` / `moment-streaming` SSE events well before the row is persisted. The version editor accepts these events alongside `moment-preview` and `moment-persisted` (resolving streaming events' `activityName` to an `activityId` via the day's existing activities) so the activities rail fills in immediately. The drawer's moments timeline includes the same streaming events, with a per-streaming-row `previewKey` that prevents duplicates when the persisted event lands later.

- **People gallery animation.** While spatial generation runs the floor-plan tab's People gallery shows a subtle reasoning shimmer for each subject the spatial post-pass is currently working on, driven by `subject-spatial-start` / `subject-spatial-result` SSE events (`subjectSpatialStatus` map in the version editor).

- **Spatial post-pass.** After the day-generator's main transaction commits, the editor automatically runs the non-destructive `DayBlueprintSpatialGeneratorService` to backfill any moment placements still missing or flagged `UNSPECIFIED`. This runs inside the same AI run row so the drawer summary and report cover both phases.

- **Package detail:** When a package has `source_day_blueprint_version_id`, the
  detail screen shows a banner and locks activity/moment list edits; instance
  timing, crew, equipment, and camera plans remain editable. Structural changes
  go through blueprint resync or Day Designer. See
  `packages/backend/docs/day-designer-package-boundaries.md`.

- Package creation wizard (`features/catalog/packages/components/creation`) reads
  `usePublishedDayBlueprintVersions()` in the **Name** step to let users pick a
  source blueprint. The selected `versionId` is passed to
  `servicePackagesApi.createFromTemplate` as `sourceDayBlueprintVersionId`, which
  the backend catalog package creator feeds into
  `DayBlueprintSnapshotService.consumeIntoPackage` after the normal build runs.
- When the backend snapshotter consumes a published version, blueprint space slots become package space slots with the same sandbox room portrayal and `SpaceActivityAssignment` links, so packages and the film builder inherit the generic location canvas as their starting point.
- Create wizard defaults now assume partner labels by service type (Wedding => Bride/Groom, other services => Partner 1/Partner 2) and no longer presents a partner-label selection step.
- Service cards in Day Designer reuse the shared card shell but override package wording to blueprint wording (`blueprint(s)` counts with `active` chips).
- Create wizard requires a final naming step (`display_name`) and supports optional `description`; both map directly to `CreateDayBlueprintInput` when creating a new blueprint.
- Create wizard auto-derives per-activity default timings (start time, default/min/max duration) from selected activity names and sends them in `initial_day_timings` / `initial_activity_timings` so the created blueprint has a schedulable timeline immediately without waiting for an AI run.
- Blueprint activity table (`DayBlueprintActivitiesRail`) shows Subjects and Locations metric columns only; Camera and Audio columns are intentionally omitted because those values are not computed in the blueprint context.
- Backend module: `packages/backend/src/content/day-blueprints/`

# Day Blueprints (Day Designer — frontend)

Frontend surface for the Day Designer. There is no standalone Day Designer
route — authoring now happens entirely inside the Package Creation wizard
(Day Design step) and, for already-created packages, on the package detail
Blueprint tab. This folder exposes the reusable types/api/hooks/simulator
pieces those surfaces consume, plus the AI runs panel embedded in the
package detail view.

## Structure

| Layer | File | Purpose |
| --- | --- | --- |
| Types | `types/index.ts`, `types/ai.ts` | Shape types for blueprints, versions, days, activities, moments, moment actions/placements, subject roles, space slots, lock rules, AI runs/proposals/diffs |
| API | `api/index.ts`, `api/ai.ts`, `api/authoring.ts`, `api/simulator.ts` | Typed client over `/api/day-blueprints*` (reads + authoring mutations + AI runs/proposals/preview + Simulator refine/completeness) |
| Hooks | `hooks/index.ts`, `hooks/ai.ts`, `hooks/authoring.ts`, `hooks/simulator.ts` | React Query hooks for reads (`useDayBlueprints`, `useDayBlueprintVersion`), authoring (`useCreate/Update/Delete` for days/activities/moments/actions/placements, `useCreateDayBlueprintVersion`), AI (`useGenerateDayBlueprintDay`, `useDayBlueprintAiRuns`, `useDayBlueprintAiProgress`, `useDayBlueprintAiProposals`, `useStart/FinishDayBlueprintAiRun`, `useCreate/Preview/Apply/RejectDayBlueprintAiProposal`), and Simulator (`useSimulationCompleteness`, `useRefineDayBlueprintDay`, `useGenerateDayBlueprintSpatial`) |
| UI | `components/simulator/simulator-steps.tsx` | Dynamic one-question-per-screen step renderers plus `buildSimulatorSteps()`, `StepRail`, `CompletenessMeter`, and brief composer. Wedding Shape collects type and event days; selecting multiple event days inserts per-day design screens before the main Activities question. Activities collects reusable main-day activity blocks such as prep, ceremony, portraits, reception, speeches, first dance, evening party, and exit. Sandbox People collects reusable subject-role pairings and guest count rather than actual names, wedding-party counts, speech planning, clock times, moments, subject actions, spatial placement, or specific venues. Sandbox location spaces, activity timings, moments, actions, and placements are generated automatically from the selected activities. An officiant role is assumed by default for ceremony simulations. Used by the package creation wizard's Day Design steps (`DayDesignGenerateStep`) and the Inquiry Wizard builder's `BuilderBlueprintSection`. |
| UI | `components/simulator/useSimulatorAnswers.ts` | Local-only Simulator answer store; derives the assumptions list sent to the AI on Refine |
| UI | `components/DayBlueprintAiRunsPanel.tsx` | AI run/progress drawer, mounted by the package detail Blueprint tab via `PackageDayDesignAiPanel.tsx` (not a standalone route). While a run is RUNNING it shows a live timeline (each moment streamed in via `moment-streaming`/`moment-persisted` events appears as it arrives), a Cancel button that calls `POST /versions/:versionId/ai-runs/:runId/cancel` to abort the LLM/persist transaction and roll back partial writes, and a per-subject spatial progress strip. Once a run reaches a terminal state it shows the final summary (moments / actions / placements counts, guardrail warnings, run duration) and a link to the on-disk `report.json`. |

The list/detail panel, standalone version editor, and proposal-review dialog
that used to live here (`DayBlueprintsPanel`, `DayBlueprintVersionEditor`,
`CreateDayBlueprintDialog`, the `version-editor/*` subtree,
`DayBlueprintProposalReviewDialog`) have been removed: they were unreachable
dead code with no route or import pointing at them. Authoring a blueprint's
days/activities/moments is done through the package creation wizard's Day
Design steps (`features/catalog/packages/components/creation/steps/DayDesign*`)
and, post-creation, through the package detail Blueprint tab.

## Cross-module links

- People suggestions are scoped through catalog package templates: the blueprint `event_category` is matched to `useEventTypes()` and only that template's subject roles are suggested, with brand-wide roles used only when no matching template exists.
- Floor plan preview reuses `features/workflow/locations` `SpaceSlotOverlay`; the package detail Blueprint tab supplies a synthetic subject-only package-space-slot shape because blueprint slots store placement hints rather than persisted package spatial coordinates.
- AI day generation expects every generated moment to include subject actions and spatial placement intent. The backend persists these rows directly, falls back to deterministic coverage if the model omits a moment, and streams per-moment events through `ai-events` so `DayBlueprintAiRunsPanel` can reveal each moment row as generation progresses.

- **Token-streamed reveal.** The backend drives Gemma through `chatStream()` and parses the JSON output token-by-token. As each `activities[i].name` and `moments[j].name` becomes visible the backend emits `activity-streaming` / `moment-streaming` SSE events well before the row is persisted. `DayBlueprintAiRunsPanel` (mounted via `PackageDayDesignAiPanel` on the package detail Blueprint tab) consumes these events alongside `moment-preview` and `moment-persisted` to render its live run timeline, with a per-streaming-row `previewKey` that prevents duplicates when the persisted event lands later.

- **Spatial post-pass progress.** While spatial generation runs, `DayBlueprintAiRunsPanel` shows a per-subject progress strip driven by `subject-spatial-start` / `subject-spatial-result` SSE events.

- **Spatial post-pass.** After the day-generator's main transaction commits, the backend automatically runs the non-destructive `DayBlueprintSpatialGeneratorService` to backfill any moment placements still missing or flagged `UNSPECIFIED`. This runs inside the same AI run row so the drawer summary and report cover both phases.

- **Package detail:** When a package has `source_day_blueprint_version_id`, the
  detail screen shows a banner and locks activity/moment list edits; instance
  timing, crew, equipment, and camera plans remain editable. Structural changes
  go through blueprint resync (`PackageBlueprintResyncService`) or by editing the
  source blueprint version and re-consuming it into a new package. See
  `packages/backend/docs/day-designer-package-boundaries.md`.

- Package creation wizard (`features/catalog/packages/components/creation`) reads
  `usePublishedDayBlueprintVersions()` in the **Day Design** step
  (`DayDesignLibraryStep`) to let users pick a source blueprint. The selected
  `versionId` is passed to `servicePackagesApi.createFromTemplate` as
  `sourceDayBlueprintVersionId`, which the backend catalog package creator feeds
  into `DayBlueprintSnapshotService.consumeIntoPackage` after the normal build
  runs.
- When the backend snapshotter consumes a published version, blueprint space slots become package space slots with the same sandbox room portrayal and `SpaceActivityAssignment` links, so packages and the film builder inherit the generic location canvas as their starting point.
- Create-blueprint flows default to partner labels by service type (Wedding => Bride/Groom, other services => Partner 1/Partner 2).
- Newly created blueprints require a final naming step (`display_name`) and support optional `description`; both map directly to `CreateDayBlueprintInput`.
- The Day Design "Create" step auto-derives per-activity default timings (start time, default/min/max duration) from selected activity names and sends them in `initial_day_timings` / `initial_activity_timings` so the created blueprint has a schedulable timeline immediately without waiting for an AI run.
- On the package detail Blueprint tab, the activity table (via the shared `PackageActivityTable`) shows Subjects and Locations metric columns only for blueprint-backed packages; Camera and Audio columns are intentionally omitted because those values are not computed in the blueprint context.
- Backend module: `packages/backend/src/content/day-blueprints/`

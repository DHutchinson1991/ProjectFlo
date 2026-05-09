# Day Blueprints (Day Designer)

Upstream authoring surface for **canonical day structures**. A
DayBlueprint answers "what does a _Civil UK Wedding Day_ look like?" —
its days, activities, moments, subject roles, spatial slots, canonical
actions, and lock rules. Package creation downstream **consumes** a
published version and snapshots it into package-scope rows; packages
then live independently so historical packages are immune to upstream
edits.

Feature bucket: `content`.

## Scope

**Owned here:**

- Day → Activity → Moment structure
- Subject roles participating in the day
- Canonical `subject → action` per moment (replaces free-form
  `subject_actions` going forward)
- Spatial blocking primitives: location roles, space slots, moment
  placements (position + facing hints)
- Lock rules (what a downstream package is allowed to vary)
- Versioning + publish lifecycle
- Day Designer AI runs + proposals (diff-first, guardrail-checked)

**Not owned here** (still owned by Package Creator AI / package
creation):

- Camera assignments, film structure, coverage lists, crew slots,
  deliverables. Blueprints are deliberately camera-agnostic.

## Data model

Tables (all prefixed `day_blueprint_*`, see `prisma/schema.prisma`):

- `day_blueprints` — brand-scoped header, `key`, `display_name`,
  `event_category`, `variant_tags`, `latest_published_version_id`.
- `day_blueprint_versions` — immutable snapshot unit; `DRAFT` →
  `PUBLISHED` → `ARCHIVED`.
- `day_blueprint_days`, `day_blueprint_activities`,
  `day_blueprint_moments` — structural hierarchy.
- `day_blueprint_subject_roles` — which subject roles apply, with
  `typical_count` / `is_primary`.
- `day_blueprint_location_roles` (brand vocabulary) +
  `day_blueprint_activity_locations` (activity ↔ role links).
- `day_blueprint_space_slots` — named sub-areas per version (e.g.
  `altar_front`, `aisle_start`).
- `day_blueprint_moment_actions` — canonical action per subject role
  per moment.
- `day_blueprint_moment_placements` — subject placed at a space slot
  with `position_hint` + `facing_hint`.
- `day_blueprint_lock_rules` — guardrails (scope: VERSION / DAY /
  ACTIVITY / MOMENT).
- `day_blueprint_ai_runs`, `day_blueprint_ai_proposals` — Day Designer
  AI audit trail.
- `day_blueprint_usages` — consumed-version ↔ package link with
  `is_current` for drift surfacing.

Package-scope lineage columns (set by the snapshotter):

- `service_packages.source_day_blueprint_id` /
  `service_packages.source_day_blueprint_version_id`
- `package_activities.source_day_blueprint_activity_id`
- `package_activity_moments.source_day_blueprint_moment_id`
- `package_space_slots.source_day_blueprint_space_slot_id`
- `package_activity_moment_actions` (new table, normalized mirror of
  blueprint actions — replaces the JSON `subject_actions` field).

## Key files

- `day-blueprints.controller.ts` — REST surface
  (`/api/day-blueprints/*`), JWT-guarded, brand from
  `X-Brand-Context`.
- `day-blueprints.module.ts` — wires services; **exports
  `DayBlueprintSnapshotService`** for `catalog/packages` consumers.
- `services/day-blueprints.service.ts` — blueprint header CRUD and list-row summary shaping (primary version + day/activity/moment counts for the Day Designer index table).
- `services/day-blueprint-versions.service.ts` — version lifecycle +
  `assertDraft()` guard used by authoring, and the canonical version-detail
  read shape for the frontend editor (days, activity locations, moments,
  actions, placements, subject roles, slots, and lock rules).
- `services/day-blueprint-authoring.service.ts` — all child-row CRUD
  (days, activities, moments, subject roles, space slots, actions,
  placements, lock rules, activity↔location-role links). Every write
  passes through `versions.assertDraft()`.
- `services/day-blueprint-defaults.service.ts` — seeds fallback sandbox
  location vocabulary and auto-creates activity location defaults from
  source `location_label`s (or sandbox fallback spaces when no label exists).
- `services/day-blueprint-location-roles.service.ts` — brand
  vocabulary CRUD.
- `services/day-blueprint-guardrails.service.ts` — publish + proposal
  invariants. Structural checks implemented; rule_key handlers
  scaffolded.
- `services/day-blueprint-snapshot.service.ts` — **consume-on-create**.
  `consumeIntoPackage({ packageId, blueprintVersionId })` materializes
  a published version into package tables, stamps lineage, creates
  package space slots + activity assignments from blueprint space slots,
  and records a `DayBlueprintUsage` row (idempotent per (version, package)).
- `services/day-blueprint-sandbox-layout.service.ts` — deterministic
  sandbox room portrayal builder used by snapshotting; emits package
  floor-plan objects/zones for ceremony, reception, prep,
  portraits, cocktail, and generic spaces.
- `services/day-blueprint-ai.service.ts` — start/finish runs, record
  proposals, enforce guardrails on apply, and read compact file-backed
  reports for generated runs.
- `services/day-blueprint-ai-runs.service.ts` — brand-scoped reader for
  Day Designer AI run artifacts. Owns safe `run_key` lookup and compact
  `report.json` retrieval from on-disk run folders.
- `services/day-blueprint-ai-run-logger.ts` — file-backed Day Designer
  AI run logger. Writes sibling logs under
  `packages/backend/logs/day-designer-ai/YYYY-MM-DD/run-*/` with
  `manifest.json`, `request.json`, `llm-response.json`, minified
  `report.json`, and `master.log`.
- `services/day-blueprint-ai-events.service.ts` — replayable per-version
  SSE event buffer for live Day Designer AI progress; backs
  `GET /api/day-blueprints/versions/:versionId/ai-events` with heartbeat
  frames and terminal `done` / `error` events. Also owns the
  per-run `AbortController` registry — `registerRun(runId)` returns a
  signal the generator polls for cooperative cancellation; the
  controller for the active run is aborted by
  `POST /versions/:versionId/ai-runs/:runId/cancel`. Event `data.eventKind`
  values include `moment-preview`, `moment-persisted`,
  `moment-streaming`, `activity-streaming`, `subject-spatial-start`,
  `subject-spatial-result`, `summary`, `cancelled`, and
  `guardrail-warning`.
- `services/day-blueprint-stream-parser.ts` — incremental JSON parser
  for the LLM's streaming Day-Plan output. Tracks bracket / string
  depth and the current property key without buffering the full
  document, then fires `onActivityStart` / `onMomentStart` callbacks
  the moment a new `activities[i].name` or `moments[j].name` becomes
  visible. Used by the generator to emit `activity-streaming` and
  `moment-streaming` SSE events token-by-token while Gemma is still
  writing — driving the live moments table and People gallery
  without waiting for the full plan to arrive.
- `services/day-blueprint-ai-generator.service.ts` — one-shot Day
  generator. Calls Gemma with a strict JSON schema (using
  `gemma.chatStream()` so the response streams) and fills moments,
  per-moment subject actions, and per-moment placement hints for the
  day's existing activities in a single transaction (no activity CRUD).
  `POST /versions/:versionId/days/:dayId/ai-generate` accepts optional
  `activity_id` to scope regeneration to one activity; write scope is
  replace-not-append for that scope only. Generated moments always keep
  subject/action coverage; spatial placement rows are written unless a
  moment is marked `no_spatial`, in which case placements are skipped.
  Generation is also duration-aware: prompts include activity duration
  targets and the service applies a quality gate (minimum moments +
  minimum duration coverage) with one automatic retry when output is too
  shallow. Records a
  `DayBlueprintAiRun` (RUNNING / SUCCESS / FAILED / CANCELLED), stores
  the on-disk run id in `run_key`, emits live SSE progress plus
  per-moment streaming/preview/persisted events for frontend live
  reveal, and writes a compact JSON knowledge report. The whole write
  flow is wrapped in a single Prisma `$transaction` so a thrown
  `Error('CANCELLED_BY_USER')` (set when the run's signal aborts)
  rolls back partial writes — leaving the day's pre-run moments,
  actions and placements intact. After the transaction the spatial
  post-pass (see below) runs to backfill any still-missing placement
  hints.
- `services/day-blueprint-ai-refiner.service.ts` — thin orchestrator
  for "The Simulator" Refine action. Loads the active day, summarizes
  it, composes an enriched brief that prepends the Simulator's plain-
  English assumptions verbatim plus the user's optional director note,
  and delegates to `DayBlueprintAiGeneratorService.generateDay()`. This
  reuses the existing logger, SSE event stream, and replace-not-append
  semantics.
- `services/day-blueprint-completeness.service.ts` — deterministic
  Simulation Completeness scorer for The Simulator. Returns a 0–100
  weighted overall plus a per-step breakdown (basics / people /
  locations / timeline / moments / actions / spatial) and the top
  missing-data assumptions per step. Used by the frontend launcher
  pill, drawer header, and step rail.
- `services/day-blueprint-spatial-generator.service.ts` —
  non-destructive spatial hint generator used by the editor context
  panel. Backfills missing moment placements from existing subject
  actions and fills `UNSPECIFIED` placement hints using deterministic
  role/moment heuristics. Does not add, remove, or reorder
  activities/moments.
- `dto/` — class-validator DTOs for every REST endpoint.

## Business rules

1. **Versions are immutable once published.** All authoring writes go
   through `DayBlueprintVersionsService.assertDraft(versionId)`.
2. **Every new blueprint starts with a DRAFT v1** so authors have a
  writable surface immediately. Wedding blueprints also auto-seed
  matching wedding subject roles plus a sandbox fallback location
  role. When create payload includes `initial_event_days` and
  `initial_activities`, v1 is also seeded with day/activity rows during
  create so first load is not an empty timeline. `initial_day_timings`
  and `initial_activity_timings` arrays may also be included to persist
  `default_start_time`, `default_duration_hours` (days) and
  `default_start_time`, `default_duration_minutes`, `duration_min_minutes`,
  `duration_max_minutes` (activities) at creation time, so the timeline is
  schedulable immediately without waiting for an AI run. Activities then
  auto-create/reuse a concrete location role + space slot from their
  source `location_label` when available, or a sandbox fallback space
  when no label exists. Duplicate `(brand_id, key)` creates return a
  `ConflictException` instead of surfacing a raw Prisma unique-
  constraint error.
  3. **List-row summary metrics are bound to one primary version.** The
    index API emits `row_summary` counts (days/activities/moments) and
    version metadata from the same selected version row (latest published,
    otherwise latest draft, otherwise newest), so the table stays
    semantically consistent.
  4. **Publish requires structural completeness** (≥1 day, ≥1 activity
   per day, ≥1 moment per activity) and passes all lock-rule handlers.
  AI day generation requires subject-action coverage for every generated
  moment. Spatial coverage is required unless a moment is explicitly
  marked `no_spatial`.
5. **Package consumption must target a PUBLISHED version.** Drafts are
   never snapshotted.
6. **Packages read their own snapshot, never the live blueprint.** The
   snapshot is the runtime source of truth.
6. **Day Blueprint sandbox rooms are object/zone-driven.** Snapshotting
  does not synthesize anchor points; semantic placement comes from room
  geometry plus moment placement hints.
7. **AI proposals cannot auto-apply past guardrails.** `applyProposal`
   runs `evaluateProposal(diff)` and `assertDraft(versionId)` before
   writing.
8. **AI day generation is fill-only and replace-not-append by scope.**
  AI never creates/deletes activity rows; it only replaces moments,
  actions, and placements for existing activities. Full-day generation
  clears/rebuilds all activities in the day; `activity_id` generation
  clears/rebuilds only that activity. Moments flagged `no_spatial` keep
  actions but skip placement writes.
9. **AI generation is duration-aware and quality-gated.**
  Prompts include per-activity duration context. The backend expects
  moment count and summed `duration_seconds` to be proportionate to the
  target activity runtime (for example, a 45m activity should not return
  a short 10-15m highlight reel). If coverage is too low, one automatic
  retry is issued with explicit correction guidance before persistence.
10. **Day Designer AI generation is file-audited.** Each one-shot run
  writes to `logs/day-designer-ai/` and the DB row's `run_key` points to
  the matching file run. `DayBlueprintAiRunsService` enforces brand-safe
  retrieval of compact reports from disk. `report.json` is the compact
  machine-first review artifact; raw request/response files are kept for
  deeper debug.
11. **Spatial regeneration replaces then rebuilds placements.**
    `POST /api/day-blueprints/versions/:versionId/days/:dayId/spatial-generate`
  clears and recreates placement hints in scope (day/activity/moment)
  from moment action coverage plus deterministic role heuristics. Moments
  flagged `no_spatial` are skipped and any existing placements for those
  moments are removed. It never regenerates day activities or moments.
12. **Refine keeps authored activities intact.**
  `DayBlueprintAiRefinerService` delegates to the fill-only generator,
  so refine enriches moments/actions/placements on existing activities
  and never mutates activity rows.

## Integration points (for follow-up work)

- **Package creation wizard** — call
  `DayBlueprintSnapshotService.consumeIntoPackage()` after package +
  event days exist, before camera/film/coverage generation. This
  replaces whatever currently seeds package activities/moments from
  EventDay primitives.
- **Package Creator AI** — prompt should be restricted to camera /
  film / coverage / crew / deliverable decisions; receive the
  materialized package day + moment list as input, do not invent
  moments.
- **Drift UI** — `day_blueprint_usages.is_current` flips to `false`
  when a newer version publishes; surface "Blueprint updated — preview
  diff" on affected packages.

## Routes cheatsheet

- `GET    /api/day-blueprints`
- `POST   /api/day-blueprints`
- `GET    /api/day-blueprints/:id`
- `PATCH  /api/day-blueprints/:id`
- `DELETE /api/day-blueprints/:id`
- `GET    /api/day-blueprints/:id/versions`
- `POST   /api/day-blueprints/:id/versions`
- `GET    /api/day-blueprints/:id/versions/:versionId`
- `POST   /api/day-blueprints/:id/versions/:versionId/publish`
- `POST   /api/day-blueprints/:id/versions/:versionId/archive`
- `POST   /api/day-blueprints/versions/:versionId/days`
- `POST   /api/day-blueprints/days/:dayId/activities`
- `POST   /api/day-blueprints/activities/:activityId/moments`
- `POST   /api/day-blueprints/activities/:activityId/locations`
- `POST   /api/day-blueprints/moments/:momentId/actions`
- `POST   /api/day-blueprints/moments/:momentId/placements`
- `POST   /api/day-blueprints/versions/:versionId/subject-roles`
- `POST   /api/day-blueprints/versions/:versionId/space-slots`
- `POST   /api/day-blueprints/versions/:versionId/lock-rules`
- `GET    /api/day-blueprints/versions/:versionId/ai-events` (SSE)
- `POST   /api/day-blueprints/versions/:versionId/ai-runs`
- `GET    /api/day-blueprints/ai-runs/:runId/report`
- `POST   /api/day-blueprints/versions/:versionId/days/:dayId/ai-generate`
- `POST   /api/day-blueprints/versions/:versionId/days/:dayId/ai-refine`
- `POST   /api/day-blueprints/versions/:versionId/days/:dayId/spatial-generate`
- `GET    /api/day-blueprints/versions/:versionId/days/:dayId/completeness`
- `POST   /api/day-blueprints/ai-proposals`
- `POST   /api/day-blueprints/ai-proposals/:proposalId/apply`
- `POST   /api/day-blueprints/ai-proposals/:proposalId/reject`
- `GET/POST/PATCH/DELETE /api/day-blueprints/location-roles[/:id]`

PATCH/DELETE equivalents exist for every `:dayId`, `:activityId`,
`:momentId`, `:slotId`, `:rowId`, `:actionId`, `:placementId`,
`:ruleId`, `:linkId`.

## Current status

- Schema: applied via `pnpm db:push` (dev DB in sync, Prisma client
  regenerated).
- Module: scaffolded, registered in `ContentModule`, zero TS errors.
- Guardrails: structural checks + lock-rule vocabulary live
  (`moment_count_min/max`, `action_subject_required`,
  `spatial_required`, `moment_required`, `duration_band`,
  `name_locked`, `order_locked`, `duration_locked`). Unknown
  rule_keys are reported as violations.
- AI diff grammar: `diff/diff-types.ts` (v1), shape-validated on
  proposal write, applied in-transaction by
  `DayBlueprintDiffApplier` with per-op version-ownership checks.
  Supported resources: `moment`, `activity`, `moment_action`,
  `moment_placement`; ops: `add`, `update`, `remove`, `reorder`.
  Days, subject roles, space slots, location roles, and lock rules
  are human-authored only.
- Package creation integration: both the `CatalogPackageCreator` and
  the `InquiryPackageCreator` accept an optional
  `sourceDayBlueprintVersionId` on their DTOs. When set,
  `DayBlueprintSnapshotService.consumeIntoPackage()` runs after the
  preset build and layers blueprint content on top with full lineage
  stamping. Failures are logged (warn) but do not abort package
  creation.
- Frontend surface: `packages/frontend/src/features/content/day-blueprints`
  exposes the Day Designer list/version UI at
  `/day-designer` (see `app/(studio)/(content)/day-designer/page.tsx`).
  The package creation wizard pulls published versions via
  `usePublishedDayBlueprintVersions()` and renders a "Designed from
  blueprint" selector in the Name step, which feeds
  `sourceDayBlueprintVersionId` into the create-from-template payload.
- Snapshotter: functional; pairs blueprint days to package event days
  positionally and materializes blueprint spaces into package
  `PackageSpaceSlot` rows with default sandbox floor-plan objects,
  zones, type tags, and `SpaceActivityAssignment` links.
  Follow-up work should let the wizard pick the day pairing explicitly.

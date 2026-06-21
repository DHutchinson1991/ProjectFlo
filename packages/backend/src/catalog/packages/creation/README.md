# Package Creation

Home of package creation. `PackageCreationService` is the single entrypoint
that controllers inject; it owns the run-logger lifecycle, error handling,
and dispatch to the right creator based on **conceptual level**:

- **Catalog-level** — admin builds a reusable package from an event-type template.
- **Inquiry-level** — client-scoped draft built from the Needs Assessment wizard.

## Entry points

- `PackageCreationService.createForCatalog(brandId, eventTypeId, dto)` — used by `POST /api/packages/from-template/:eventTypeId`.
- `PackageCreationService.createForInquiry(brandId, dto)` — used by `POST /api/packages/from-builder`.

## What it does today

1. Captures the request to a run log via `PackageCreationRunLogger`.
2. Dispatches to the right creator (catalog or inquiry).
3. The chosen creator builds the `service_packages` row and all deterministic scaffolding (event days, subjects, location slots, activities, crew/equipment).
4. `PackageCreationPipelineService` runs the shared post-create pipeline in order:
   1. `SandboxLayoutService` — default floor-plan layouts.
   2. `ActivityPlannerService` — planning orchestrator for package content. In standard mode it runs AI moments/casting/actions/timing; in blueprint mode it records a concise "use snapshot content" planner step and skips content-generation writes. During package creation it defers the terminal `READY` / SSE `done` transition so the frontend progress bar stays active through the remaining post-create work.
   3. `PackageBlockingPlannerService` — AI Blocking Director per `(activity × space slot × moment)`. Writes `SpaceSlotMomentSubject`/`SpaceSlotMomentCamera` overrides and `PackageActivityMoment.camera_subject_plan` (camera→subject targeting plan). Mirrors each package-moment AI Director trace back into the package run `master.log` while still writing the raw per-moment file under `logs/ai-director/`. Never throws — one moment's failure does not block the others or the final `planning_status = READY` transition.
5. Returns the fully populated package.

## Key files
| File | Purpose |
|------|---------|
| `package-creation.service.ts` | Facade — run-logger lifecycle, error handling, dispatch to a creator |
| `package-creation-pipeline.service.ts` | Shared post-create pipeline — layout + activity-planning + blocking, with blocking/background modes |
| `sources/catalog-package-creator.service.ts` | `CatalogPackageCreator` — builds a reusable catalog package from an event-type template |
| `sources/inquiry-package-creator.service.ts` | `InquiryPackageCreator` — builds a client-scoped draft package from the Needs Assessment wizard |
| `builders/day-content.builder.ts` | `DayContentBuilder` — deterministic day-level content (activities, subjects, locations, equipment) |
| `builders/crew.builder.ts` | `CrewBuilder` — crew-slot and equipment-assignment helpers shared by both creators |
| `dto/*.dto.ts` | Wizard DTOs (root `CreatePackageFromEventTypeDto` plus nested activity/moment/crew/equipment shapes) |
| `shared/brand-currency.resolver.ts` | `BrandCurrencyResolver` — resolves a brand's currency with a `DEFAULT_CURRENCY` fallback |
| `shared/sandbox-layout.service.ts` | `SandboxLayoutService` — shared `buildSandboxRoomLayout` geometry for empty ceremony sandbox slots; skipped when blueprint snapshot already has objects |
| `shared/normalize-blueprint-create-request.ts` | Validates `blueprintDayMappings` and normalizes consume params for catalog + inquiry |
| `run/package-creation-run-logger.ts` | Per-run manifest, request capture, summaries, and master log |

## Business rules / invariants
- `PackageCreationService` owns the run-logger lifecycle and shared failure handling for every package-creation entrypoint.
- `PackageCreationPipelineService` is the only place in this module that runs sandbox layout, activity-planning, and package blocking.
- Catalog creation is blueprint-first whenever `sourceDayBlueprintVersionId` is present: deterministic scaffolding auto-selects template days by order (when the wizard does not pass day IDs), skips template activity/moment payloads, then consumes the published Day Blueprint snapshot as the canonical source of package day/activity/moment/action structure. Multi-day wizards may send `blueprintDayMappings` (`DayBlueprintDay.id` ↔ `PackageTemplateDay.id`). The inquiry builder DTO accepts the same fields. Mappings persist on `service_packages.contents.blueprint_day_mappings` for resync fidelity.
- Post-create order: consume → planner (blueprint skip) → placement seed → layout (skip when snapshot objects exist) → blocking (cameras only, actions from `package_activity_moment_actions`).
- After consume, `DayBlueprintPlacementSeedService` seeds subject floor positions from blueprint placements; `PackageBlockingPlannerService` then runs Blocking AI for **cameras only** (subjects stay fixed).
- Blueprint-backed packages now run the post-create pipeline in `planningMode = blueprint`: content-generation planner writes are skipped and the pipeline proceeds directly to placement seed + blocking + terminal `READY`.
- Package run logs remain file-backed under `logs/package-creator-ai/`; the package detail frontend reads that history through the package module's `/api/packages/:id/ai-runs` endpoints rather than touching this module directly.
- `CatalogPackageCreator` starts the post-create pipeline in background and returns immediately; output package is `is_active: true` with `planning_status = CREATED/PLANNING`. The frontend navigates to `/packages/:id`, which streams progress via SSE (`usePlanningProgress`). Film creation is gated on `planning_status = READY`, and that terminal state is emitted only after both activity planning and package blocking complete.
- `InquiryPackageCreator` starts the same post-create pipeline in background after the base package is created; output package is `is_active: false` and named after the client.
- Creators own template/assessment resolution and deterministic package construction only.

## Related modules
- **Backend**: `../event-types` — event-type templates and day/crew builders used by catalog-level creation
- **Backend**: `../packages` — CRUD surface for created packages and the inquiry-level entrypoint
- **Backend**: `../../../content/activity-planning` — AI planning pipeline invoked after deterministic package construction

# Activity Planning

## What this module does
Owns package activity planning after deterministic package creation. It resolves package context, enriches activity descriptions, assigns subjects, estimates timing, generates moments, casts subjects into those moments, and persists subject actions/focal priority for downstream schedule and scene-preparation flows.

## Key files
| File | Purpose |
|------|---------|
| `activity-planning.module.ts` | NestJS content sub-module for planner services and reusable planning steps |
| `services/activity-planner.service.ts` | Public facade consumed by package creation and package planning controllers |
| `services/package-blocking-planner.service.ts` | Public facade that runs `BlockingDirectorService` per `(activity × space slot × moment)` at package creation time; pre-seeds subject/camera positions via `SpaceSlotSpatialSyncService.syncCamerasAndSubjects` before each moment run, then writes `PackageActivityMoment.camera_subject_plan` plus space-slot overrides so films inherit camera→subject targeting and positions |
| `services/package-planning-orchestrator.service.ts` | Package-level orchestration: summary/progress, package-wide steps, per-activity loop |
| `services/package-planning-progress.service.ts` | Emits planner SSE events, including non-summary live updates with optional telemetry payloads, and writes machine-readable planner summary entries |
| `services/package-planning-steps.service.ts` | Package-wide description, subject-assignment, and timing steps |
| `services/single-activity-planner.service.ts` | Shared single-activity moments → casting → actions pipeline |
| `services/planning-events.service.ts` | Replayable per-package planning SSE stream used by package detail progress UI; event payloads can carry blocking substep telemetry and summary data |
| `services/package-context.service.ts` | Deterministic package/activity subject and location-context loader |
| `steps/*.step.ts` | Reusable LLM planning steps shared with schedule and scene-preparation |

## Business rules / invariants
- Planning treats each activity as one narrative unit overall, even when internal casting and action-generation calls are batched per moment for latency control.
- `ActivityPlannerService` is the stable public entrypoint; the real orchestration lives behind split services.
- The package pipeline is fixed: description enrichment → subject assignment → timing → per-activity moments → casting → actions.
- Package-creation runs keep the package in `planning_status = PLANNING` until the follow-on package blocking phase finishes; only then do the shared planning SSE stream and package row flip to terminal `READY`/`done`. Direct replan runs still terminate at activity-planning completion.
- During `activity-casting` and `activity-actions`, the shared planning SSE stream emits live focus updates for the current moment plus the subject ids/names being considered. These live updates are for UI progress only and do not create extra planner summary steps.
- During package blocking, `PackageBlockingPlannerService` emits moment-level live updates on that same SSE stream for `pre-seed`, LM Studio request/response, parse completion, guardrail application, persistence, and a final blocking summary. These updates include optional telemetry such as completed/total moments, queue wait, AI duration, correction notices, and trace-log paths without creating extra planner summary steps.
- `SingleActivityPlannerService` is the only place that builds and persists package-moment `subject_actions` payloads.
- `eventType` is resolved from the package’s linked `EventSubtype → EventType` at planning start — not hardcoded.
- All 8 LLM steps implement `PipelineStep<TInput, TOutput>` with `execute()` as the entry method.
- Subject assignment applies deterministic guardrails after the LLM response: ceremony/reception stay universal, and clearly gendered prep blocks keep the correct side of the wedding party.
- For the services-page package creator flow, the planner now writes a package-scoped master log with numbered step sections, plus machine-readable request and summary JSON files under `packages/backend/logs/package-creator-ai/`.
- Planner summary entries now include per-step `metrics` and `value` payloads so runs can be judged by both cost and material impact.
- `CameraCoverageStep` should assign each active camera a distinct editorial target subset for a moment; group subjects should be used instead of dumping the full roster onto every camera.
- Locked-off / unmanned cameras can still carry static `CLOSE_UP` and `MEDIUM_SHOT` coverage; only `TRACKING` requests are coerced to a static equivalent based on the targeted subject set.

## Related modules
- **Backend**: `../../catalog/packages/creation` — owns the top-level run logger (`PackageCreationRunLogger`) and invokes `ActivityPlannerService` followed by `PackageBlockingPlannerService` after package scaffolding, deferring the package-creation terminal SSE/`READY` transition until blocking completes.
- **Backend**: `../../ai/blocking` — `BlockingDirectorService.generateBlockingForPackageMoment()` is the per-moment entry point used by `PackageBlockingPlannerService`.
- **Backend**: `content/schedule/` — provides `MomentKnowledgeService`, consumes `MomentGenerationStep`.
- **Backend**: `content/scene-preparation/` — consumes casting, actions, director, coverage outputs.
- **Backend**: `../../catalog/packages` — exposes replan/resync endpoints, planning SSE, and the authenticated `/api/packages/:id/planning-log` reader used by the package-detail trace-log viewer.
- **Backend**: `../../ai/gemma` — provides Gemma + skill loading infrastructure for the planning steps.
- **Frontend**: No direct frontend consumer; planning is triggered by backend package-creation flows.

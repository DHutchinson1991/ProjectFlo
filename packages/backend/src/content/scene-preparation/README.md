# Scene Preparation

## What this module does
Prepares camera assignments for rendering by running the full prep pipeline: loads spatial context from the floorplan, calls activity-planning LLM skills (casting, actions, director), runs the shot director for per-camera emotional direction, and generates ControlNet SVGs. Also provides prompt previewing and spatial overlay APIs.

## Key files
| File | Purpose |
|------|---------|
| `scene-preparation.module.ts` | NestJS module — exports `ScenePreparationService` + `ShotPromptBuilder` |
| `scene-preparation.controller.ts` | REST endpoints: prepare, prepare-scene, preview-prompt, composition-guide, spatial-overlay |
| `dto/generate-shot-preview.dto.ts` | Shared DTO for camera assignment + film ID input |
| `services/scene-preparation.service.ts` | Orchestrator: full prep pipeline (LLM → spatial → shot decision → ControlNet) |
| `services/shot-director.service.ts` | LLM skill: per-camera emotional tone + subject direction |
| `services/shot-decision.service.ts` | Resolves the authoritative shot type from assignment intent, coverage plan, and raw spatial evidence |
| `services/shot-prompt-builder.ts` | Deterministic prompt builder from context + spatial + director output |

## Business rules / invariants
- `prepareScene()` runs the full activity-level pipeline for all moments in a film scene.
- `prepare()` handles a single camera assignment.
- `ShotPromptBuilder` is shared with `frame-rendering` (exported from this module).
- `GenerateShotPreviewDto` is the canonical input DTO, shared across scene-preparation and frame-rendering controllers.
- Film prep SSE stays open until the final `done` event even if an intermediate stage fails; stage events include backend timestamps and per-stage durations so the frontend can show long-running local AI waits without looking frozen.
- Spatial translation and ControlNet generation are deterministic after the LLM planning stages.
- Raw spatial shot inference is treated as evidence, not automatic truth. `ShotDecisionService` resolves the final preview/persistence shot type by preferring assignment or coverage intent over a conflicting geometric guess.
- Scene prep persists `CameraCoverageStep` shot types only when the value matches the backend `ShotType` enum; coverage-only values like `TRACKING` stay in pipeline data and do not leak into `cameraSubjectAssignment.shot_type`.
- Controller routes are under `api/content/shot-previews` for backward compatibility with the frontend.

## Related modules
- **Backend**: `content/spatial-engine/` — provides floorplan data, projection, ControlNet, overlay services.
- **Backend**: `content/activity-planning/` — provides casting, actions, director, coverage outputs.
- **Backend**: `content/frame-rendering/` — consumes `ScenePreparationService` + `ShotPromptBuilder`.
- **Backend**: `content/schedule/` — triggers `prepareScene` via `SchedulePackageService`.
- **Frontend**: `features/content/shot-previews` — consumes prep and preview APIs.

# Orchestration

## What this module does
Coordinates end-to-end AI scene execution flows by sequencing deterministic and LLM steps for blocking and frame rendering.

## Key files
| File | Purpose |
|------|---------|
| `scene-orchestration.module.ts` | NestJS module wiring orchestration services/controllers |
| `scene-orchestration.service.ts` | Main orchestrator for blocking and render pipelines |
| `steps/narrative-analyst.step.ts` | Deterministic timeline/music/activity context builder |
| `pipeline-logger.ts` | Unified per-pipeline run logger and step handle utilities |
| `pipeline.interfaces.ts` | Shared contracts for pipeline steps and outputs |

## Business rules / invariants
- Blocking flow order is fixed: Narrative Analyst first, Blocking Director second.
- Render flow delegates image generation to `FrameRenderService` and logs as a single pipeline run.
- Pipeline runs must produce a persisted pipeline log file for traceability.

## Related modules
- **Backend**: `ai/blocking/` — provides `BlockingDirectorService`.
- **Backend**: `content/frame-rendering/` — provides `FrameRenderService` used for render pipeline.
- **Backend**: `platform/prisma/` — source of deterministic context reads.

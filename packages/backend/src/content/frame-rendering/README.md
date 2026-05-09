# Frame Rendering

## What this module does
Generates AI shot preview images via the ComfyUI pipeline. Takes prepared camera assignments, runs the frame compositor (LLM) and prompt stylist (LLM) to refine the prompt, validates it, then submits to ComfyUI for image generation. Also provides CRUD for generated previews and a critique-and-regenerate flow.

## Key files
| File | Purpose |
|------|---------|
| `frame-rendering.module.ts` | NestJS module — exports `FrameRenderService` |
| `frame-rendering.controller.ts` | REST endpoints: generate, health, by-assignment, by-film, CRUD, critique |
| `services/frame-render.service.ts` | Orchestrator: prep check → compositor → stylist → ComfyUI → save |
| `services/frame-compositor.service.ts` | LLM skill: produces structured `FrameScript` from spatial + director data |
| `services/prompt-stylist.service.ts` | LLM skill: refines frame script into a final image prompt |
| `services/prompt-validator.ts` | Pure function: validates and sanitises prompts (no DI) |

## Business rules / invariants
- `renderFrame()` first calls `ScenePreparationService.prepare()` if the assignment lacks `pipeline_data`.
- The compositor receives `DirectedSubject` (from activity-director), `FrameSubject` (from spatial-engine), and produces a `FrameScript`.
- ControlNet conditioning is always dynamic (generated per-shot by `DynamicControlnetService` from spatial data). Static pose templates have been removed.
- Prompt validation runs before submission to ComfyUI to catch unsafe/malformed prompts.
- Controller routes are under `api/content/shot-previews` for backward compatibility.
- Brand context (`X-Brand-Context` header) is required for generate, by-film, and critique endpoints.

## Related modules
- **Backend**: `content/scene-preparation/` — provides `ScenePreparationService` + `ShotPromptBuilder` + DTO.
- **Backend**: `content/spatial-engine/` — provides spatial translation + ControlNet services.
- **Backend**: `ai/comfyui/` — provides `ComfyUIClientService` for image generation.
- **Backend**: `ai/orchestration/` — `SceneOrchestrationService` calls `FrameRenderService.renderFrame`.
- **Frontend**: `features/content/shot-previews` — consumes generate and preview APIs.

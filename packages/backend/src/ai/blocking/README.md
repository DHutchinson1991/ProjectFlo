# Blocking

## What this module does
Owns AI-driven moment blocking: subject positions, camera positions, moment description, and duration generation for a scene moment.

## Key files
| File | Purpose |
|------|---------|
| `blocking.module.ts` | NestJS module for blocking service dependencies and exports |
| `blocking-director.service.ts` | Blocking director implementation (LLM + deterministic guardrails + persistence) |
| `blocking-director.controller.ts` | API endpoint to trigger blocking generation via orchestration |
| `dto/generate-blocking.dto.ts` | Request contract for blocking generation |
| `ai-director-logger.ts` | Per-run blocking log writer for deep diagnostics |

## Business rules / invariants
- Blocking prompts are loaded via `SkillLoaderService`; direct skill-file reads are not used.
- Subject/camera writes target package-space-slot positions and moment overrides.
- Blocking is invoked through orchestration (`runBlockingPipeline`) so narrative context is always applied first.
- Large crowd groups such as `Guests` remain fixed context in blocking: they stay in their crowd/seating area, can still receive action text, and may still appear in camera targeting.
- Blocking camera target caps are framing-aware: the close/medium/wide subject-count guardrail uses both camera distance and camera FOV, so narrow lenses cap subject lists more aggressively than wide lenses at the same position.
- Duplicate-name logs in blocking should only describe actual name collisions; fixed crowd groups are not treated as dedupe drops.

## Related modules
- **Backend**: `ai/orchestration/` — orchestrates Narrative Analyst + Blocking Director flow.
- **Backend**: `ai/gemma/` — provides model client and skill loading.
- **Backend**: `workflow/locations/modules/floor-plans/` — provides spatial context and zone/object data.

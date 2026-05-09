# AI

## What this module does
Composes shared AI infrastructure and orchestration modules used by content-generation workflows.

## Key files
| File | Purpose |
|------|---------|
| `ai.module.ts` | Root AI NestJS module imported by `AppModule` |
## Sub-modules
| Folder | Purpose |
|--------|--------|
| `gemma/` | LLM client (`GemmaService`) + skill markdown loader (`SkillLoaderService`) |
| `blocking/` | Per-moment spatial blocking (`BlockingDirectorService`) |
| `orchestration/` | Scene-level pipeline (`NarrativeAnalystStep` → `BlockingDirectorStep`) |
| `comfyui/` | Image generation client |
| `activity-planning/` | Package planning pipeline — 8 LLM steps + orchestrator |
| `context/` | Shared deterministic DB loaders (`PackageContextService`) |
## Business rules / invariants
- Shared model access lives in `ai/gemma/`.
- Blocking execution lives in `ai/blocking/`.
- End-to-end sequencing lives in `ai/orchestration/`.
- Image transport/client integration lives in `ai/comfyui/`.

## Related modules
- **Backend**: `content/frame-rendering/` — consumes orchestration + ComfyUI paths.
- **Backend**: `content/scene-preparation/` — consumes shared AI skills and providers.

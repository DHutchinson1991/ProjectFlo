# Gemma

## What this module does
Provides the direct LM Studio / Gemma chat client and shared skill-file loading utilities used by other AI modules.

## Key files
| File | Purpose |
|------|---------|
| `gemma.module.ts` | NestJS module for Gemma API + shared skill loading |
| `gemma.controller.ts` | Diagnostic/direct chat endpoint for model calls |
| `gemma.service.ts` | OpenAI-compatible chat client for LM Studio, including tool calls and image inputs |
| `skill-loader.service.ts` | Caches and loads skill markdown with `_conventions.md` prepended |

## Business rules / invariants
- `GemmaService` reads `LMSTUDIO_URL` and `GEMMA_MODEL` on module init.
- `GemmaService` also enforces a hard per-request timeout via `GEMMA_TIMEOUT_MS` (default `180000`) so stalled LM Studio calls fail with a real error instead of hanging pipeline progress forever.
- `SkillLoaderService` is the canonical way to load markdown skills; ad-hoc file loading is not allowed.
- Skill payloads always include `_conventions.md` before feature-specific skill files.

## Related modules
- **Backend**: `ai/blocking/` — blocking director consumes `GemmaService` and `SkillLoaderService`.
- **Backend**: `content/activity-planning/` and `content/scene-preparation/` — planning steps consume `SkillLoaderService`.
- **Reference docs**: Rules in `.github/instructions/backend-architecture.instructions.md`.

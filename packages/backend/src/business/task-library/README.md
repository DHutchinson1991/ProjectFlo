# Task Library Module

## What this module does

Manages the configurable task template library for a brand. Each template defines a task that can be auto-generated for an inquiry based on trigger conditions (e.g., always, per-film, per-operator). The `previewAutoGeneration` method is the single source of truth for computing task cost rows used by the pricing and estimates modules.

## Key files

| File | Purpose |
|------|---------|
| `task-library.service.ts` | Template CRUD, batch ordering, `previewAutoGeneration`, `executeAutoGeneration` |
| `task-library.controller.ts` | REST endpoints for templates + auto-generation |
| `dto/task-library.dto.ts` | DTOs with enums for phase, pricing type, trigger type |

## Business rules / invariants

- `previewAutoGeneration()` is the single source of truth for task cost — pricing and estimate auto-generation call it, never reimplementing multiplier logic.
- Task multiplier depends on `trigger_type`: `always`=1, `per_film`=film count, `per_operator`=operator count, etc.
- `effort_hours_each × multiplier × hourly_rate = estimated_cost` per task row.
- Role resolution uses `SkillRoleMappingsService` to match operators to task roles.

## Keep docs up to date

After ANY code change in this module, update `PRICING_TOTALS_REFERENCE.md` (root) and this README if business rules, key files, or cross-references changed.

## Related modules

- **Backend**: `../pricing` — calls `previewAutoGeneration` for breakdown
- **Backend**: `../../estimates` — calls `previewAutoGeneration` for auto-estimate
- **Backend**: `../skill-role-mappings` — resolves operator-to-role assignments
- **Frontend**: Task library settings UI; `EstimatesCard.tsx` for auto-generation
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root)

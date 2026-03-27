# Coverage

## What this module does
Manages a library of reusable coverage definitions (video shots and audio setups). Coverages are template-like records that describe how a specific shot or audio capture should be performed. They are referenced by `SceneCoverage` records when attached to individual scenes.

## Key files
| File | Purpose |
|------|---------|
| `coverage.controller.ts` | REST endpoints under `api/coverage` |
| `coverage.service.ts` | CRUD business logic |
| `dto/create-coverage.dto.ts` | Input shape; validates all coverage fields including Prisma enums |
| `dto/update-coverage.dto.ts` | Partial of create DTO via `PartialType` |

## Business rules / invariants
- Coverage records are library items — delete is soft (`is_active = false`), not hard-delete.
- `findAll()` only returns active records (`is_active: true`).
- `coverage_type` is required (`VIDEO` or `AUDIO`); all other fields are optional and type-specific.
- JSON columns (`equipment_assignments`, `resource_requirements`, `recording_equipment`) are passed through to Prisma as-is; validation is basic.
- All routes are JWT-protected via `AuthGuard('jwt')`.

## Data model notes
- Prisma model: `Coverage`
- Soft-delete via `is_active Boolean @default(true)`.
- Related table: `SceneCoverage` — a join between `Coverage` and `FilmScene`.

## Related modules
- **Backend**: `content/scenes` — scenes assign coverage via `SceneCoverage`
- **Frontend**: `lib/api.ts` — coverage methods under `coverageApi`

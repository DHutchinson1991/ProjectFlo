# Film Structure Templates

## What this module does
Manages brand-scoped and system-seeded templates for film structure. Each template defines an ordered list of scenes (with name, mode, suggested duration, and order index) that can be applied when creating a new film structure. System-seeded templates are read-only; brand-specific templates support full CRUD.

## Key files
| File | Purpose |
|------|---------|
| `film-structure-templates.controller.ts` | REST endpoints under `api/film-structure-templates` |
| `film-structure-templates.service.ts` | CRUD logic including nested scene upsert/delete |
| `dto/create-film-structure-template.dto.ts` | Create payload with optional nested `scenes[]` |
| `dto/update-film-structure-template.dto.ts` | Update payload; pass `scenes[]` for a full scene list replace |

## Business rules / invariants
- System-seeded templates (`is_system_seeded = true`) cannot be modified or deleted.
- `findAll` always includes system defaults (`brand_id = null`). When a `brandId` query param is passed, brand-specific templates are also included.
- Create accepts an optional `scenes[]` array for immediate scene creation.
- Update with `scenes[]` performs a full replace: scenes not present in the incoming list are deleted, existing ids are updated, new entries (no id) are created — all in a single `$transaction`.
- Update without `scenes[]` only updates the template header fields.
- All routes are JWT-protected via `AuthGuard('jwt')`.

## Data model notes
- Prisma models: `FilmStructureTemplate`, `FilmStructureTemplateScene`
- `FilmStructureTemplateScene.order_index` controls display order.
- `is_system_seeded` is set at seed time and never toggled via API.

## Related modules
- **Backend**: `content/films` — consumes templates when initialising a film structure
- **Frontend**: `lib/api.ts` — `filmStructureTemplates` methods

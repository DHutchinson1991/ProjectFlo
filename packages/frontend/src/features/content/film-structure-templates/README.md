# Film Structure Templates

## What this module does
API bindings for managing film structure templates — brand-scoped blueprints that define the default scene sequence for a given film type. Each template contains an ordered list of template scenes with mode, suggested duration, and order index.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Endpoint bindings: standard CRUD with brand/filmType filters |

## API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/film-structure-templates?brandId=&filmType=` | List templates (filterable) |
| GET | `/api/film-structure-templates/{id}` | Get by ID (includes scenes) |
| POST | `/api/film-structure-templates` | Create template |
| PATCH | `/api/film-structure-templates/{id}` | Update template |
| DELETE | `/api/film-structure-templates/{id}` | Delete template |

## Business rules / invariants
- Brand-scoped — templates belong to a specific brand.
- Types are owned by `content/films/types/film-structure-templates.ts`.
- Scene modes reference `SceneType` from `content/scenes/types`.

## Related modules
- **Backend**: `content/film-structure-templates` — controller + service
- **Frontend**: `content/films` — owns the types; `content/scenes` — provides SceneType enum

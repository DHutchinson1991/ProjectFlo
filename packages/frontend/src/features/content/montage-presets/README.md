# Montage Presets

## What this module does
API bindings for managing montage presets — brand-scoped duration templates for montage-type films (Trailer, Same-Day Edit, Highlights). Each preset defines a min/max duration range.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Endpoint bindings: standard CRUD with brandId filter |

## API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/montage-presets?brandId=` | List presets (filterable by brand) |
| GET | `/api/montage-presets/{id}` | Get by ID |
| POST | `/api/montage-presets` | Create preset |
| PATCH | `/api/montage-presets/{id}` | Update preset |
| DELETE | `/api/montage-presets/{id}` | Delete preset |

## Business rules / invariants
- Brand-scoped — presets belong to a specific brand.
- Some presets are system-seeded (`is_system_seeded: true`) and should not be deleted by users.
- Types are owned by `content/films/types/montage-presets.ts`.

## Related modules
- **Backend**: `content/montage-presets` — controller + service
- **Frontend**: `content/films` — owns the types, uses montage presets in film configuration

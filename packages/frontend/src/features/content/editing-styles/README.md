# Editing Styles

## What this module does
API bindings for managing editing styles — system-wide reference data (not brand-scoped). Used in film configuration to specify post-production editing approach.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Endpoint bindings: standard CRUD (skipBrandContext) |

## API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/editing-styles` | List all editing styles |
| GET | `/editing-styles/{id}` | Get by ID |
| POST | `/editing-styles` | Create |
| PATCH | `/editing-styles/{id}` | Update |
| DELETE | `/editing-styles/{id}` | Delete |

## Business rules / invariants
- System-wide resource — all endpoints use `skipBrandContext: true`.
- Types are owned by `content/films/types/media.ts`.

## Related modules
- **Backend**: `content/` (editing styles endpoints)
- **Frontend**: `content/films` — owns the types, uses editing styles in film config

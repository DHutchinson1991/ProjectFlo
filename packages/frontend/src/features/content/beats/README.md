# Beats

## What this module does
API bindings for managing scene beats — the timed segments within a film scene. Supports CRUD operations, reordering, and recording setup configuration per beat.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Endpoint bindings: CRUD, reorder, recording-setup |

## API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/beats/scenes/{sceneId}/beats` | List beats for a scene |
| POST | `/api/beats/scenes/{sceneId}/beats` | Create beat |
| PATCH | `/api/beats/{beatId}` | Update beat |
| DELETE | `/api/beats/{beatId}` | Delete beat |
| POST | `/api/beats/scenes/{sceneId}/reorder` | Reorder beats |
| GET/PATCH/DELETE | `/api/beats/{beatId}/recording-setup` | Recording setup CRUD |

## Business rules / invariants
- Types are owned by `content/scenes/types/beats.ts` — this feature only wraps API calls.
- Beat order is managed via explicit reorder endpoint, not inline updates.

## Related modules
- **Backend**: `content/beats` — controller + service
- **Frontend**: `content/scenes` — owns beat types, consumes beats API in scene editing

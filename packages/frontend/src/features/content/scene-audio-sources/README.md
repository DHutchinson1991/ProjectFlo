# Scene Audio Sources

## What this module does
API bindings for managing audio sources layered onto film scenes. Each audio source links to a moment, beat, scene, or activity and defines a track type (speech, ambient, music) with timing offsets.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | Endpoint bindings: CRUD + reorder per scene |

## API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/scene-audio-sources/scenes/{sceneId}/audio-sources` | List audio sources for scene |
| GET | `/api/scene-audio-sources/{id}` | Get by ID |
| POST | `/api/scene-audio-sources/scenes/{sceneId}/audio-sources` | Create audio source |
| PATCH | `/api/scene-audio-sources/{id}` | Update audio source |
| DELETE | `/api/scene-audio-sources/{id}` | Delete audio source |
| POST | `/api/scene-audio-sources/scenes/{sceneId}/audio-sources/reorder` | Reorder audio sources |

## Business rules / invariants
- Types are owned by `content/scenes/types/audio-sources.ts`.
- `AudioSourceType` enum: MOMENT, BEAT, SCENE, ACTIVITY — determines which source entity is linked.
- `AudioTrackType` enum: SPEECH, AMBIENT, MUSIC — determines the audio layer.
- Order is managed via explicit reorder endpoint.

## Related modules
- **Backend**: `content/scene-audio-sources` — controller + service
- **Frontend**: `content/scenes` — owns the types, consumes in scene audio editing

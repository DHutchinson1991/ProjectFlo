# Music

## What this module does
Manages one-to-one music assignments for film scenes and moments. Each scene can have at most one `SceneMusic` record, and each moment can have at most one `MomentMusic` record. Creating a new music entry implicitly replaces any existing one (delete-then-create). The module also provides a film-level aggregate query (`GET api/music/films/:filmId/music`) that collects all scene and moment music in a single response.

## Key files
| File | Purpose |
|------|---------|
| `music.controller.ts` | REST endpoints under `api/music` |
| `services/scene-music.service.ts` | Scene music CRUD + film-level music aggregate + music type list |
| `services/moment-music.service.ts` | Moment music CRUD |
| `dto/create-music.dto.ts` | Re-export barrel for scene/moment create DTOs |
| `dto/create-scene-music.dto.ts` | `CreateSceneMusicDto` |
| `dto/create-moment-music.dto.ts` | `CreateMomentMusicDto` |
| `dto/update-music.dto.ts` | Re-export barrel for scene/moment update DTOs |
| `dto/update-scene-music.dto.ts` | `UpdateSceneMusicDto` |
| `dto/update-moment-music.dto.ts` | `UpdateMomentMusicDto` |
| `dto/scene-music-response.dto.ts` | Response shape for scene music |
| `dto/moment-music-response.dto.ts` | Response shape for moment music |

## Business rules / invariants
- Scene music and moment music are each one-to-one unique relations. `POST` acts as an upsert — any existing record is deleted first.
- `music_type` must be a valid `MusicType` enum value; defaults to `MODERN` when not provided.
- `overrides_scene_music` on moment music defaults to `true` when not provided.
- Film-level aggregate (`getFilmMusic`) reads across all scenes and moments; it is read-only.
- All routes are JWT-protected via `AuthGuard('jwt')`.

## Data model notes
- Prisma models: `SceneMusic` (unique on `film_scene_id`), `MomentMusic` (unique on `moment_id`).
- `MusicType` enum values: `NONE`, `SCENE_MATCHED`, `ORCHESTRAL`, `PIANO`, `MODERN`, `VINTAGE`, `CLASSICAL`, `JAZZ`, `ACOUSTIC`, `ELECTRONIC`, `CUSTOM`.

## Related modules
- **Backend**: `content/scenes` — owns `FilmScene` records
- **Backend**: `content/moments` — owns `SceneMoment` records
- **Frontend**: `hooks/music/useMusic.ts` — React state hook for scene/moment music

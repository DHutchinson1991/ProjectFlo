# content/music

Music assignment management — one-to-one music assignments for film scenes and scene moments.

## Key files

| File | Purpose |
|------|---------|
| `api/music.ts` | `createMusicLibraryApi(client)` — music library CRUD and attach/detach bindings |
| `api/moments.ts` | `createMusicMomentsApi(client)` — legacy moment template + moment music bindings |
| `api/index.ts` | API barrel for music feature bindings |
| `hooks/useMusic.ts` | State-based hook for scene/moment music management |
| `types/index.ts` | `SceneMusic`, `MomentMusic`, `MusicType` enum, DTOs |
| `components/MusicTable.tsx` | Draggable music assignment table |
| `components/MusicManagement.tsx` | Full music management panel |
| `components/CreateMusicDialog.tsx` | CRUD dialog for music items |
| `components/AttachMusicToMomentDialog.tsx` | Assign music to a moment |
| `components/MusicTemplateDialog.tsx` | Template-based music creation |

## Business rules

- Each scene has at most one music assignment (1:1 via `scene_music` table).
- Each moment can have its own music that optionally overrides the parent scene's music.
- Music types: NONE, SCENE_MATCHED, ORCHESTRAL, PIANO, MODERN, VINTAGE, CLASSICAL, JAZZ, ACOUSTIC, ELECTRONIC, CUSTOM.
- Film-level music view aggregates all scene and moment music assignments.

## Migration notes

The `api/` folder now uses shared `apiClient` factories from `@/shared/api/client`. `useMusic` remains a state-based compatibility hook; when next touched, migrate it to React Query and retire the remaining legacy moment-template surface in `api/moments.ts`.

## Backend

- Controller: `packages/backend/src/content/music/music.controller.ts`
- Services: `scene-music.service.ts`, `moment-music.service.ts`
- Endpoints: `/api/music/scenes/:sceneId/music`, `/api/music/moments/:momentId/music`, `/api/music/films/:filmId/music`

## Related modules

- `content/films` — music is scoped to film scenes
- `content/scenes` — scene-level music assignment
- `content/moments` — moment-level music overrides

# Content Builder Timeline Data

## What this module does
This folder owns Content Builder timeline persistence and reload behavior. It stores timeline state locally, writes scenes and moments to the backend, deletes persisted scenes, and defines the save flow rules that keep client-side timeline state aligned with database records.

## Key files
| File | Purpose |
|------|---------|
| `useTimelineSave.ts` | Persists new scenes, moments, beats, and recording setup; returns client-to-database ID mappings |
| `useTimelineStorage.ts` | Saves timeline state locally for reloads and session continuity |
| `useTimelineState.ts` | Core local state container for scenes and tracks |
| `useSceneDelete.ts` | Deletes persisted scenes through the API and syncs local state |
| `useSaveState.ts` | Tracks save state and wraps save invocation |

## Business rules / invariants
- Scene order is authoritative from `order_index`.
- New scenes can begin with temporary client-generated IDs and must be remapped to database IDs after save.
- Moments are persisted separately from scenes and linked by `film_scene_id`.
- Reload behavior must preserve scene order before recomputing timeline start times.
- Changes to scene creation, moment creation, beat creation, or ID remapping must be reviewed together.

## Related modules
- **Backend**: `packages/backend/src/content/films` — provides the film, scene, and moment persistence APIs
- **Frontend**: `packages/frontend/src/app/(studio)/designer/components/ContentBuilder` — UI entry point that invokes this save flow
- **Reference docs**: `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/README.md`
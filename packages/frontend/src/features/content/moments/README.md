# Moments

## What this module does
Canonical home for scene-moment domain types, API bindings, hooks, and helpers. A moment is a named time segment within a `MOMENTS`-type film scene, with optional music and recording-setup overrides.

## Key files
| File | Purpose |
|------|---------|
| `types/index.ts` | `SceneMoment`, create/update DTOs, `MomentFormData`, timeline types, `formatDuration` |
| `api/index.ts` | `createMomentsApi(client)` — thin wrapper over `createScenesApi().moments` |
| `hooks/useSceneMomentInteractions.ts` | Coordinator: edit state, save, composes resize/drag/recording-setup sub-hooks |
| `hooks/useMomentResize.ts` | Moment resize interaction (drag-to-resize) |
| `hooks/useMomentDragReorder.ts` | Moment drag-to-reorder within a scene |
| `hooks/useMomentRecordingSetup.ts` | Recording setup upsert/clear for a moment |
| `hooks/useMomentOperations.ts` | Optimistic save with backend sync |
| `hooks/useMomentForm.ts` | Form state and validation for moment editor |
| `components/MomentsManagement.tsx` | UI stub (not yet implemented) |
| `index.ts` | Feature barrel |

## Business rules / invariants
- Moments belong to a scene via `film_scene_id`; a scene can have 0..n moments.
- Moment CRUD is accessed through `createScenesApi` (scenes feature), re-exported as `createMomentsApi`.
- `MusicType` and `MUSIC_TYPE_OPTIONS` live in `@/lib/types/domains/music` — not duplicated here.
- `formatDuration(seconds)` formats as `"Xm Ys"`, `"Xm"`, or `"Ys"`.
- `MomentFormData` is the loose form-layer type for moment editors; `SceneMoment` is the strict domain type.

## Related modules
- **Backend**: `packages/backend/src/content/moments/` — moments controller + service
- **Frontend scenes**: `features/content/scenes` — `createScenesApi` exposes `moments.*` methods
- **Frontend films**: `features/content/films` — enrichment pipelines consume moment types
- **ContentBuilder**: reads `TimelineSceneWithMoments` for timeline rendering

# Scenes Feature

## What this module does
Manages film scenes (Moments-type or Montage-type) within films. A scene is a named container that holds moments (for Moments scenes) or is edited as a montage block (for Montage scenes). Also covers scene templates, recording setup per scene, and the ContentBuilder ScenesLibrary representation.

## Key files
| File | Purpose |
|------|---------|
| `types/index.ts` | Canonical scene types: `FilmScene`, `SceneTemplate`, `ScenesLibrary`, `SceneGroup`, `SceneType`, `MontageStyle` |
| `api/index.ts` | `createScenesApi` factory — scenes CRUD + scene recording setup + moments CRUD + templates + coverage |
| `hooks/useSceneTemplates.ts` | Loads scene templates via React Query |
| `hooks/useFilmScenes.ts` | Manage scene list for a film — fetch, merge, deduplicate |
| `hooks/useSceneCreation.ts` | UI state for scene creation dialog (template or blank) |
| `hooks/useSceneScheduleRow.ts` | Derived state and handlers for scene schedule rows |
| `utils/enrichScenesWithBeats.ts` | Enriches film scenes with moments or beats for timeline |
| `utils/merge-film-scenes.ts` | Merge API-fetched scene data into film-embedded scenes |
| `utils/sceneTemplateLoader.ts` | Fetch and cache scene templates |
| `utils/scene-enrichment-utils.ts` | Scene color mapping and timeline normalization |
| `utils/scene-display-utils.ts` | Scene icon, display type, and color hash utilities |
| `utils/scene-data-utils.ts` | Scene media types, sorting, filtering |
| `components/archive/CrewEquipmentPanel.tsx` | Unreferenced panel — archived pending wiring |

## Business rules / invariants
- Scenes belong to a film via `film_id`.
- A `MOMENTS` scene holds individual `SceneMoment` records; a `MONTAGE` scene uses beats/music instead.
- `SceneGroup` is the ContentBuilder timeline grouping of `TimelineSceneBuilder` items (UI-only, not persisted directly).
- `ScenesLibrary` is the library/catalog representation of a scene for the timeline panel (read-only palette).
- Recording setup is optional and per-scene; moments can override at the moment level.

## Related modules
- **Backend**: `packages/backend/src/` scenes and moments controllers/services
- **Frontend moments**: `features/content/moments` — moment types and API (Phase 2 — not yet extracted)
- **ContentBuilder**: `app/(studio)/designer/components/ContentBuilder/` — primary consumer of `ScenesLibrary`, `SceneGroup`
- **Locations**: `@/lib/types/locations` — `FilmSceneLocationAssignment` used in `FilmScene`

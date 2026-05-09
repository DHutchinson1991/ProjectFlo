# Films

## What this module does
Film domain feature — CRUD for films, film detail UI (header, schedule, equipment, scenes, layers), scene enrichment pipelines, and the `FilmContentApi` adapter consumed by ContentBuilder.

## Key files
| File | Purpose |
|------|---------|
| `types/index.ts` | `Film`, `FilmType`, `TimelineLayer`, create/update DTOs |
| `api/index.ts` | `createFilmsApi` factory (films CRUD + timeline layers) |
| `hooks/useFilmData.ts` | Loads a single film with scenes, tracks, layers |
| `hooks/useFilms.ts` | Film list CRUD hook |
| `hooks/useFilmPrepProgress.ts` | Streams per-film AI prep progress over SSE until the backend emits its final completion event |
| `hooks/enrichScenesWithBeats.ts` | Enriches raw scenes into timeline-ready shapes |
| `components/FilmApiContext.tsx` | `FilmContentApi` interface + context provider |
| `components/FilmEditorShell.tsx` | Shared full-viewport shell for library and instance film editors |
| `components/FilmDetailHeader.tsx` | Film editor header with title editing, navigation, add-scenes, and save actions |
| `components/FilmSchedulePanel.tsx` | Scene schedule planner (times, presets, undo) |
| `components/FilmEquipmentPanel.tsx` | Camera/audio equipment assignment UI |

## Business rules / invariants
- A film belongs to a brand; all queries are brand-scoped.
- Films have a `FilmType` (CINEMATIC or DOCUMENTARY) that controls structure template eligibility.
- Scenes are ordered via `order_index`; enrichment pipelines normalise start-times sequentially.
- `FilmContentApi` must satisfy the same interface shape for library, project, and inquiry modes.
- Equipment assignments are synced to the backend and trigger track regeneration.
- Film prep progress rows stay subscribed to SSE until the backend sends the final `done` event; temporary parent loading flags must not terminate the stream early.
- `useFilmPrepProgress()` keeps recent stage history plus backend event timestamps/durations so package/detail UIs can show elapsed local-AI waits and recoverable stage failures instead of a single stale label.

## Related modules
- **Backend**: `packages/backend/src/catalog/films/` — films controller + service
- **Frontend scenes**: `features/content/scenes` — scene types, CRUD, templates
- **Frontend moments**: `features/content/moments` — moment types used in enrichment
- **ContentBuilder**: `app/(studio)/designer/components/ContentBuilder/` — primary consumer

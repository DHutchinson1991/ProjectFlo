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
| `hooks/enrichScenesWithBeats.ts` | Enriches raw scenes into timeline-ready shapes |
| `components/FilmApiContext.tsx` | `FilmContentApi` interface + context provider |
| `components/FilmSchedulePanel.tsx` | Scene schedule planner (times, presets, undo) |
| `components/FilmEquipmentPanel.tsx` | Camera/audio equipment assignment UI |

## Business rules / invariants
- A film belongs to a brand; all queries are brand-scoped.
- Films have a `FilmType` (CINEMATIC or DOCUMENTARY) that controls structure template eligibility.
- Scenes are ordered via `order_index`; enrichment pipelines normalise start-times sequentially.
- `FilmContentApi` must satisfy the same interface shape for library, project, and inquiry modes.
- Equipment assignments are synced to the backend and trigger track regeneration.

## Related modules
- **Backend**: `packages/backend/src/catalog/films/` — films controller + service
- **Frontend scenes**: `features/content/scenes` — scene types, CRUD, templates
- **Frontend moments**: `features/content/moments` — moment types used in enrichment
- **ContentBuilder**: `app/(studio)/designer/components/ContentBuilder/` — primary consumer

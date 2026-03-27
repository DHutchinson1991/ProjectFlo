# Instance Films

> **Bucket**: `content`
> **Owns**: Project-level instance copies of film content (scenes, moments, beats, tracks, subjects, locations, recording setups)

## Purpose

Provides CRUD operations for project/inquiry instance-level film content. These are fully independent copies of library film structures — edits never propagate to the library originals. The module also supports cloning a library film's full structure into instance tables.

## Key files

| File | Role |
|------|------|
| `instance-film-scene.controller.ts` | Scenes CRUD, reorder, scene recording setup |
| `instance-film-content.controller.ts` | Moments CRUD, reorder, moment recording setup, beats CRUD, beat recording setup |
| `instance-film-structure.controller.ts` | Clone from library, tracks, subjects, locations, scene subjects, scene locations |
| `services/instance-scene.service.ts` | Scene CRUD + recording setup logic |
| `services/instance-moment.service.ts` | Moment CRUD + recording setup + subject propagation |
| `services/instance-beat.service.ts` | Beat CRUD + recording setup logic |
| `services/instance-structure.service.ts` | Tracks, subjects, locations, scene subjects, scene locations |
| `services/instance-film-clone.service.ts` | Idempotent deep-clone of library film content into instance tables |
| `services/index.ts` | Barrel export for all services |
| `dto/instance-film.dto.ts` | Re-export barrel for all instance-film DTOs |
| `dto/upsert-recording-setup.dto.ts` | `UpsertRecordingSetupDto` (split from bundle) |

## Route prefix

`/api/instance-films`

## Dependencies

- `PrismaModule` — database access
- `ProjectsModule` — provides `ProjectFilmCloneService` for clone-from-library

## Cross-references

- Library films: `content/films/` (the source data cloned into instances)
- Subjects: `content/subjects/` (film-level subject role templates)
- Schedule: `content/schedule/` (schedule links to project-level films)

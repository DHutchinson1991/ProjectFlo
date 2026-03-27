# Scenes

**Bucket:** `content`  
**Owner:** `ScenesModule`

## Purpose

Manages the `FilmScene` entity — the primary structural block of a film. Scenes are MOMENTS-mode (direct shot coverage) or MONTAGE-mode (beat-driven assembly). Each scene belongs to a film and can optionally reference a `SceneTemplate` for rapid setup.

## Module structure

```
scenes/
  scenes.module.ts
  scenes.controller.ts        — thin route shell; dispatches to service layer
  dto/
    create-scene.dto.ts
    update-scene.dto.ts
  mappers/
    scene.mapper.ts           — static mapping helpers (toBase, toBeat, toMomentSummary, etc.)
  services/
    scenes-crud.service.ts    — CRUD, reorder, findAll/findOne with full includes
    scenes-recording.service.ts — scene-level recording setup (get/upsert/delete)
    scene-templates.service.ts  — template CRUD, getScenesByTemplate, createTemplateFromScene
  types/
    scene.types.ts            — SceneResponseDto, BeatSummary, RecordingSetupSummary, etc.
    scene-payload.type.ts     — SceneWithDetails Prisma payload type
```

## Key business rules

- `order_index` auto-assigns to the current count if not provided on create.
- `mode` derives from the template type when `scene_template_id` is supplied; defaults to MOMENTS.
- `createTemplateFromScene` generates a unique name (appends suffix if duplicate) and deduplicates suggested subjects by upsert on `brand_id_name`.
- Scene-level recording setup stores `camera_track_ids` as assignments; deleting the setup cascades via Prisma.
- `reorderScenes` is scoped to a film for safety — validates film existence before bulk update.

## API routes (under `/scenes` prefix)

| Method | Path | Service |
|--------|------|---------|
| POST | `/scenes/films/:filmId/scenes` | ScenesCrudService.create |
| GET | `/scenes/films/:filmId/scenes` | ScenesCrudService.findAll |
| GET | `/scenes/:id` | ScenesCrudService.findOne |
| PATCH | `/scenes/:id` | ScenesCrudService.update |
| DELETE | `/scenes/:id` | ScenesCrudService.remove |
| POST | `/scenes/:id/reorder` | ScenesCrudService.reorderScenes |
| GET | `/scenes/:id/recording-setup` | ScenesRecordingService.getRecordingSetup |
| PATCH | `/scenes/:id/recording-setup` | ScenesRecordingService.upsertRecordingSetup |
| DELETE | `/scenes/:id/recording-setup` | ScenesRecordingService.deleteRecordingSetup |
| GET | `/scenes/templates` | SceneTemplatesService.getSceneTemplates |
| POST | `/scenes/templates/from-scene` | SceneTemplatesService.createTemplateFromScene |
| DELETE | `/scenes/templates/:id` | SceneTemplatesService.deleteSceneTemplate |
| GET | `/scenes/template/:templateId/scenes` | SceneTemplatesService.getScenesByTemplate |

## Cross-references

- `content/moments` — scenes own moment children
- `content/beats` — scenes own beat children (MONTAGE mode)
- `content/subjects` — subject-scene assignments managed by `content/subjects`
- `content/film-structure-templates` / `catalog` — scene templates live in catalog

# Beats

**Bucket:** `content`  
**Owner:** `BeatsModule`

## Purpose

Manages `SceneBeat` entities — the internal segments of a MONTAGE-mode `FilmScene`. Beats represent discrete moments in a montage assembly, each with a name, ordering, timing, and optional recording-setup assignment.

## Module structure

```
beats/
  beats.module.ts
  beats.controller.ts            — thin route shell; dispatches to service layer
  dto/
    create-beat.dto.ts
    update-beat.dto.ts
  mappers/
    beat.mapper.ts               — BeatMapper.toResponse
  services/
    beats-crud.service.ts        — CRUD + reorder
    beats-recording.service.ts   — beat-level recording setup (get/upsert/delete)
  types/
    beat.types.ts                — BeatResponseDto, BeatRecordingSetupDto
```

## Key business rules

- `order_index` auto-assigns to the current beat count for the scene if not provided on create.
- `duration_seconds` defaults to 10 if not specified.
- Beat recording setup is a 1-to-1 relation (`beat_id` unique); upsert creates or updates.
- `reorderBeats` validates scene existence before bulk-updating `order_index`.

## API routes (under `/beats` prefix)

| Method | Path | Service |
|--------|------|---------|
| POST | `/beats/scenes/:sceneId/beats` | BeatsCrudService.create |
| GET | `/beats/scenes/:sceneId/beats` | BeatsCrudService.findAll |
| GET | `/beats/:id` | BeatsCrudService.findOne |
| PATCH | `/beats/:id` | BeatsCrudService.update |
| DELETE | `/beats/:id` | BeatsCrudService.remove |
| POST | `/beats/scenes/:sceneId/reorder` | BeatsCrudService.reorderBeats |
| GET | `/beats/:id/recording-setup` | BeatsRecordingService.getRecordingSetup |
| PATCH | `/beats/:id/recording-setup` | BeatsRecordingService.upsertRecordingSetup |
| DELETE | `/beats/:id/recording-setup` | BeatsRecordingService.deleteRecordingSetup |

## Cross-references

- `content/scenes` — parent entity (`film_scene_id`); beats are MONTAGE scene children
- `content/scene-audio-sources` — audio sources may reference beats via `source_beat_id`

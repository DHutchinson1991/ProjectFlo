# Scene Audio Sources

**Bucket:** `content`  
**Owner:** `SceneAudioSourcesModule`

## Purpose

Tracks the audio source references attached to a `FilmScene`. Each `SceneAudioSource` record declares where audio for a scene comes from — a moment, a beat, another scene, or an external activity — along with timing offsets and track-type metadata.

## Module structure

```
scene-audio-sources/
  scene-audio-sources.module.ts
  scene-audio-sources.controller.ts  — thin route shell
  scene-audio-sources.service.ts     — CRUD + reorder
  dto/
    create-scene-audio-source.dto.ts
    update-scene-audio-source.dto.ts
  mappers/
    scene-audio-source.mapper.ts     — SceneAudioSourceMapper.toResponse
```

## Key business rules

- `order_index` auto-assigns to the current count for the scene if not provided on create.
- `source_type` is an `AudioSourceType` enum: `MOMENT | BEAT | SCENE | ACTIVITY`.
- `track_type` defaults to `SPEECH` if not specified.
- Reorder is a bulk update — all `order_index` values are set in parallel.

## API routes (under `/scene-audio-sources` prefix)

| Method | Path | Handler |
|--------|------|---------|
| POST | `/scene-audio-sources/scenes/:sceneId/audio-sources` | create |
| GET | `/scene-audio-sources/scenes/:sceneId/audio-sources` | findAll |
| GET | `/scene-audio-sources/:id` | findOne |
| PATCH | `/scene-audio-sources/:id` | update |
| DELETE | `/scene-audio-sources/:id` | remove |
| POST | `/scene-audio-sources/scenes/:sceneId/audio-sources/reorder` | reorder |

## Cross-references

- `content/scenes` — parent entity (`film_scene_id`)
- `content/moments`, `content/beats` — optional source references

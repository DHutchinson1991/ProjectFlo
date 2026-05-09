# content/moments — Deep Logic Analysis

> Enhanced analysis generated from actual source code.
> Companion to the auto-generated [content-moments.md](content-moments.md) structure diagram.

---

## Request Flow Sequences

### 1. Create Moment (with auto-subject assignment)

This is the most complex operation — it validates the scene, creates the moment, then auto-populates subject assignments from the parent package.

```mermaid
sequenceDiagram
    participant FE as momentsApi.create()
    participant C as MomentsController.create
    participant S as MomentsCrudService.create
    participant DB as PrismaService

    FE->>C: POST /api/moments/scenes/:sceneId/moments<br/>{name, duration, order_index, source_activity_id}
    C->>C: Set dto.film_scene_id = sceneId (from URL)
    C->>S: create(createMomentDto)

    Note over S,DB: Phase 1 — Validate scene exists
    S->>DB: filmScene.findUnique({ id: sceneId })
    DB-->>S: scene (or null → 404)

    Note over S,DB: Phase 2 — Resolve order_index
    alt order_index provided in DTO
        S->>S: Use dto.order_index
    else order_index not provided
        S->>DB: sceneMoment.count({ film_scene_id })
        DB-->>S: count (becomes order_index)
    end

    Note over S,DB: Phase 3 — Create the moment
    S->>DB: sceneMoment.create({ film_scene_id, name, order_index, duration ∥ 60, source_activity_id })
    DB-->>S: created moment

    Note over S,DB: Phase 4 — Auto-populate subjects
    S->>DB: packageFilm.findFirst({ film_id: scene.film_id })
    DB-->>S: { package_id }
    S->>DB: packageDaySubject.findMany({ package_id })
    DB-->>S: subjects[ ] with role_template

    alt source_activity_id provided
        S->>DB: packageActivityMoment.findFirst({ activity_id, name })
        DB-->>S: template with subject_actions (JSON map)
    end

    S->>DB: filmSceneMomentSubject.createMany(subjects → moment_id)
    DB-->>S: (skipDuplicates)

    S-->>C: MomentResponseDto (id, name, order_index, duration, timestamps)
    C-->>FE: JSON response
```

### 2. Save Moment (name/duration change from popover)

Shows the optimistic-update-first pattern used by `useMomentOperations`:

```mermaid
sequenceDiagram
    participant UI as Moment Popover
    participant H as useMomentOperations
    participant A as momentsApi.update
    participant C as MomentsController.update
    participant S as MomentsCrudService.update
    participant DB as PrismaService

    UI->>H: handleSaveMoment(updatedMoment)
    H->>H: Check updatedMoment.id exists (bail if falsy)

    Note over H: Optimistic update (immediate)
    H->>H: Map moments array — merge updatedMoment into list<br/>Preserve recording_setup from either source
    H->>UI: onMomentsUpdate(updatedMoments) OR mutate scene.moments
    H->>UI: onClosePopover()

    Note over H: Conditional API call
    H->>H: Diff: did name or duration actually change?
    alt name or duration changed AND scene.id exists
        H->>A: update(momentId, { name, duration })
        A->>C: PATCH /api/moments/:id
        C->>S: update(id, updateMomentDto)
        S->>DB: sceneMoment.findUnique({ id }) — existence check
        DB-->>S: moment (or null → 404)
        S->>DB: sceneMoment.update({ where: { id }, data: dto })
        DB-->>S: updated row
        S->>S: mapToResponseDto(updated)
        S-->>C: MomentResponseDto
        C-->>A: JSON
        A-->>H: SceneMoment
    else no change or no scene.id
        Note over H: No API call — popover just closes
    end
```

### 3. Upsert Recording Setup

The most complex single operation — handles create vs update, camera+audio assignment diffing, and track deletion.

```mermaid
sequenceDiagram
    participant H as useMomentRecordingSetup
    participant A as scenesApi.moments.upsertRecordingSetup
    participant C as MomentsController.upsertRecordingSetup
    participant S as MomentRecordingSetupService.upsertRecordingSetup
    participant DB as PrismaService

    H->>A: upsertRecordingSetup(momentId, data)
    A->>C: PATCH /api/moments/:id/recording-setup
    C->>S: upsertRecordingSetup(id, data)

    Note over S: Normalize inputs
    S->>S: Merge camera_assignments + camera_track_ids → unique track list
    S->>S: Merge audio_assignments + audio_track_ids → unique audio list
    S->>S: Normalize graphics_title (trim, null if disabled)

    S->>DB: momentRecordingSetup.findUnique({ moment_id })
    DB-->>S: existing setup (or null)

    alt Setup exists (UPDATE path)
        S->>DB: cameraSubjectAssignment.findMany({ recording_setup_id })
        DB-->>S: currentAssignments[]

        Note over S,DB: Diff assignments
        S->>S: Build currentByTrack map
        S->>S: Find toDelete = tracks not in incoming list

        opt Tracks to delete
            S->>DB: cameraSubjectAssignment.deleteMany({ id in toDelete })
        end

        loop Each camera + audio assignment
            alt Track exists in current
                S->>DB: cameraSubjectAssignment.update({ subject_ids, shot_type, enabled })
            else New track
                S->>DB: cameraSubjectAssignment.create({ track_id, subject_ids, ... })
            end
        end

        S->>DB: momentRecordingSetup.update({ audio_track_ids, graphics_enabled, graphics_title })
        DB-->>S: updated setup with camera_assignments + track

    else No existing setup (CREATE path)
        S->>DB: momentRecordingSetup.create({ moment_id, audio_track_ids, graphics, camera_assignments: createMany })
        DB-->>S: created setup with assignments
    end

    S->>S: buildRecordingSetupResponse(result)
    Note over S: Mapper splits assignments into camera vs audio by track.type

    S-->>C: { id, audio_track_ids, graphics_*, camera_assignments[], audio_assignments[] }
    C-->>A: JSON

    Note over H: Post-save: refetch scene for fresh subjects
    H->>A: scenesApi.scenes.getById(sceneId)
    A-->>H: refreshed scene with moments
    H->>H: Merge refreshed moments with local state<br/>(preserve recording_setup for just-saved moment)
    H->>H: updateSceneMoments(scene, mergedMoments)
```

---

## Business Logic Notes

### Validation Rules

| Layer | Rule | Effect |
|-------|------|--------|
| DTO | `name` — `@IsString() @IsNotEmpty()` | 400 if missing or empty |
| DTO | `duration` — `@Min(1)` | 400 if ≤ 0 |
| DTO | `order_index` — `@Min(0)` | 400 if negative |
| DTO | `source_activity_id` — `@IsInt() @IsOptional()` | 400 if present but non-integer |
| Service | Scene must exist (findUnique check) | 404 NotFoundException |
| Service | Moment must exist for update/delete | 404 NotFoundException |
| Frontend | `useMomentForm` validates name non-empty | Inline error message |
| Frontend | API call skipped if `!scene.id` | Silent no-op (unsaved scene) |
| Frontend | API call skipped if name AND duration are unchanged | Optimisation — no network call |

### Side Effects

1. **Auto-subject population on create:** When a moment is created, the service looks up the parent film's package → package subjects → and creates `FilmSceneMomentSubject` records linking each subject to the moment. If `source_activity_id` is provided, it also looks up template `subject_actions` from `PackageActivityMoment` and pre-populates `action_description` per subject role.

2. **Recording setup assignment diffing:** On upsert, existing camera assignments are diff'd against incoming data. Removed tracks → `deleteMany`. Existing tracks → updated in-place (preserving IDs). New tracks → created. This avoids recreating all assignments on each save.

3. **Reorder uses parallel updates:** `reorderMoments()` fires `Promise.all` on individual `sceneMoment.update` calls — not a transaction. Race condition is unlikely since it's called once per reorder gesture, but worth noting there's no `$transaction` wrapper.

4. **Recording setup mapper splits by track type:** `buildRecordingSetupResponse()` takes the unified `camera_assignments` from DB and splits them into `camera_assignments` (non-audio) and `audio_assignments` (track.type === 'AUDIO') in the API response.

5. **Cascade delete:** `SceneMoment` has `onDelete: Cascade` from `FilmScene`. Deleting a scene deletes all its moments and their recording setups automatically via Prisma's cascade.

### Error Handling

| Scenario | Response |
|----------|----------|
| Scene not found (create, findAll, reorder) | 404 `Scene with ID ${id} not found` |
| Moment not found (findOne, update, remove, recording-setup) | 404 `Moment with ID ${id} not found` |
| Delete recording setup when none exists | 200 `{ message: 'Moment recording setup not found' }` (not 404!) |
| Duplicate order_index | Prisma unique constraint error (@@unique on [film_scene_id, order_index]) — unhandled, bubbles as 500 |
| Frontend API failure | `console.error` in catch block, no retry or toast |

---

## State Management Flow

### No React Query — Direct Mutation Pattern

The moments feature does **not** use React Query for server state management. Instead, it uses a **direct mutation + local state** pattern:

```mermaid
graph TD
    classDef state fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    classDef fn fill:#fff3e0,stroke:#e65100,color:#bf360c
    classDef api fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20

    ContentBuilder["ContentBuilder<br/>(parent state owner)"]
    SceneState["scene.moments[]<br/>(mutable array on scene object)"]
    Callback["onUpdateScene callback"]

    SCI["useSceneMomentInteractions"]
    Resize["useMomentResize"]
    Drag["useMomentDragReorder"]
    RecSetup["useMomentRecordingSetup"]
    Ops["useMomentOperations"]
    Form["useMomentForm"]

    SCI --> Resize
    SCI --> Drag
    SCI --> RecSetup

    Resize -->|"updateSceneMoments(scene, newMoments)"| SceneState
    Drag -->|"updateSceneMoments(scene, reordered)"| SceneState
    RecSetup -->|"updateSceneMoments(scene, merged)"| SceneState
    Ops -->|"onMomentsUpdate(updated)"| SceneState

    SceneState -->|"triggers"| Callback
    Callback --> ContentBuilder

    Form -.->|"pure state: editName, editDuration, errors"| Form

    class ContentBuilder,SceneState state
    class SCI,Resize,Drag,RecSetup,Ops fn
    class Form api
```

**Key pattern:** Moments are stored as a `moments[]` array directly on the `TimelineScene` object. Hooks mutate this array and call `updateSceneMoments(scene, newMoments)` which:
1. Directly assigns `scene.moments = nextMoments` (mutation!)
2. Calls `onUpdateScene({ ...scene, moments })` to propagate up

**Why no React Query?** Moments are deeply nested (Film → Scene → Moment) and tightly coupled to the ContentBuilder's timeline state. The ContentBuilder owns the full scene tree, so individual moment queries would cause sync issues.

### Hook Dependency Graph

```
useSceneMomentInteractions (orchestrator)
  ├── useMomentResize        — pixel drag → duration calc → updateSceneMoments
  ├── useMomentDragReorder   — drag/drop → splice + reindex → updateSceneMoments
  └── useMomentRecordingSetup — API save → refetch scene → merge → updateSceneMoments

useMomentOperations (standalone — used by popover)
  └── momentsApi.update() — only if name/duration actually changed

useMomentForm (pure state — no API calls)
  └── manages editName, editDuration, errors, trackIsAssigned
```

---

## Data Transformation Map

### Create moment: DTO → DB → Response

```
Frontend CreateMomentInput          Backend CreateMomentDto              DB (sceneMoment.create)
─────────────────────────           ─────────────────────                ───────────────────────
{ name, duration?, order_index?,    { film_scene_id (from URL),         { film_scene_id,
  source_activity_id? }               name, duration?, order_index?,      name,
                                       source_activity_id? }              order_index (resolved),
                                                                          duration (default: 60),
API binding applies defaults:                                             source_activity_id }
  duration ?? 10 (FE default)
  order_index ?? 0 (FE default)
                                                                        ↓
                                    MomentResponseDto (mapper)          Prisma result
                                    ────────────────────────            ─────────────
                                    { id, film_scene_id, name,         { id, film_scene_id, name,
                                      order_index, duration,             order_index, duration,
                                      created_at, updated_at }          source_activity_id,
                                                                         created_at, updated_at }
                                    NOTE: source_activity_id
                                    is STRIPPED by mapper!
```

**Key discrepancy:** Frontend default duration is `10` seconds, backend default is `60` seconds. If the frontend sends `duration: undefined`, it falls through to `data.duration ?? 10` in the API binding, so the backend default of 60 is never reached.

### findAll: DB → Enriched response

```
DB (sceneMoment.findMany with includes)      Controller response (per moment)
────────────────────────────────────         ────────────────────────────────
{ id, film_scene_id, name,                  { id, film_scene_id, name,
  order_index, duration,                      order_index, duration,
  created_at, updated_at,                     created_at, updated_at,
  recording_setup: {                          has_recording_setup: boolean,  ← ADDED
    id, audio_track_ids,                      has_music: boolean,            ← ADDED
    graphics_enabled, graphics_title,         recording_setup: {             ← RESHAPED
    camera_assignments: [{                      id, audio_track_ids,
      track_id, subject_ids, track: {...}       graphics_enabled, graphics_title,
    }]                                          camera_assignments: [{
  },                                              track_id, track_name,      ← ADDED from track.name
  moment_music: { id, music_type }                track_type,                ← ADDED from track.type
}                                                 subject_ids, shot_type
                                                }]
                                              } | null
                                            }
```

### findOne vs findAll: Different response shapes

| Field | findAll | findOne |
|-------|---------|---------|
| `scene_name` | ✗ | ✓ (from film_scene.name) |
| `has_recording_setup` | ✓ (boolean) | ✗ |
| `has_music` | ✓ (boolean) | ✗ |
| `recording_setup.camera_assignments` | Full array with track names | `camera_assignments_count` (number only!) |
| `music` | ✗ | `{ id, music_type }` |

### Recording setup response (via buildRecordingSetupResponse)

```
DB MomentRecordingSetup                        API Response
──────────────────────                         ────────────
{ id,                                          { id,
  audio_track_ids: number[],                     audio_track_ids: number[],
  graphics_enabled: boolean,                     graphics_enabled: boolean,
  graphics_title: string | null,                 graphics_title: string | null,
  camera_assignments: [                          camera_assignments: [        ← FILTERED (non-audio only)
    { id, track_id, subject_ids,                   { id, track_id,
      track: { name, type } }                        track_name,              ← FLATTENED from track.name
  ]                                                  track_type,              ← FLATTENED from track.type
}                                                    subject_ids,
                                                     shot_type, enabled }
                                                 ],
                                                 audio_assignments: [         ← SPLIT OUT (audio tracks only)
                                                   { id, track_id,
                                                     track_name,
                                                     subject_ids }
                                                 ]
                                               }
```

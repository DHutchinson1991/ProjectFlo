# Architecture Overview

**Complete specification for the Films/Scenes/Moments/Coverage refactor**

---

## Problem Statement

The current system has confusing data models:
- Multiple overlapping concepts (Coverage, Tracks, Moments, Scenes)
- Complex nested API responses
- Brittle frontend matching logic (comparing names)
- Users confused about relationships

**Example:** Edit Moment dialog shows checkboxes for "tracks" but data comes from "coverage" with name-based matching.

---

## Solution Overview

**Simple, intuitive system:**
- Equipment (cameras/audio) **configured per-film** with auto-generated names
- **Moments track which equipment is recording** via direct assignments
- **Subjects** (Bride, Groom) assigned to **specific cameras**
- **Music** at scene OR moment level
- **Flat API responses** - one call gets everything

---

## Core Concepts

### 1. Films Have Equipment
- VIDEO (Camera 1, 2, 3...)
- AUDIO (Audio 1, 2...)
- GRAPHICS (always included)
- MUSIC (always included)

### 2. Subjects Are What We Film
- **Global templates:** Bride, Groom, Officiant, Rings, Venue
- **Categories:** PEOPLE, OBJECTS, LOCATIONS
- **Film-specific:** Custom subjects added per-film
- **Assignment:** Cameras film specific subjects per moment

### 3. Moments Have Recording Setups
- **Moment:** Time segment (Vows, Ring Exchange, etc.)
- **Recording Setup:** Tracks which equipment is active
  - Which cameras + what subjects they're filming
  - Which audio tracks are active
  - Graphics enabled/disabled
  - Music assignment

### 4. Scenes Use Templates
- **SceneTemplate:** Reusable library (Ceremony, Reception, Getting Ready)
- **FilmScene:** Template applied to specific film
- Updating template doesn't affect existing instances

### 5. Music Has Flexibility
- **Scene-level:** Background for entire scene
- **Moment-level:** Overrides scene music for specific moments
- **Spanning:** Can span multiple consecutive moments

---

## Data Model (Prisma Schema)

```prisma
// FILMS & EQUIPMENT
model Film {
  id                String                @id @default(cuid())
  name              String
  brand_id          Int
  tracks            FilmTimelineTrack[]
  subjects          FilmSubject[]
  local_scenes      FilmScene[]
}

model FilmTimelineTrack {
  id                String                @id @default(cuid())
  film_id           String
  name              String                // "Camera 1", "Audio 1"
  type              TrackType             // VIDEO, AUDIO, GRAPHICS, MUSIC
  order_index       Int
  is_active         Boolean               @default(true)
  camera_assignments CameraSubjectAssignment[]
  @@unique([film_id, name])
}

enum TrackType {
  VIDEO
  AUDIO
  GRAPHICS
  MUSIC
}

// SUBJECTS
model SubjectTemplate {
  id                String                @id @default(cuid())
  name              String                @unique
  category          SubjectCategory       // PEOPLE, OBJECTS, LOCATIONS
  is_system         Boolean               @default(true)
}

model FilmSubject {
  id                String                @id @default(cuid())
  film_id           String
  name              String
  category          SubjectCategory
  is_custom         Boolean               @default(false)
  camera_assignments CameraSubjectAssignment[]
  @@unique([film_id, name])
}

enum SubjectCategory {
  PEOPLE
  OBJECTS
  LOCATIONS
}

// SCENES
model SceneTemplate {
  id                String                @id @default(cuid())
  name              String
  moments           SceneMomentTemplate[]
  suggested_subjects SceneTemplateSuggestedSubject[]
  film_scenes       FilmScene[]
}

model FilmScene {
  id                String                @id @default(cuid())
  film_id           String
  scene_template_id String?
  name              String
  order_index       Int
  scene_music       SceneMusic?
  moments           SceneMoment[]
}

// MOMENTS & RECORDING
model SceneMoment {
  id                String                @id @default(cuid())
  film_scene_id     String
  name              String
  order_index       Int
  duration          Int
  recording_setup   MomentRecordingSetup?
  moment_music      MomentMusic?
}

model MomentRecordingSetup {
  id                String                @id @default(cuid())
  moment_id         String                @unique
  camera_assignments CameraSubjectAssignment[]
  audio_track_ids   String[]              // ["295", "296"]
  graphics_enabled  Boolean               @default(false)
}

model CameraSubjectAssignment {
  id                String                @id @default(cuid())
  recording_setup_id String
  track_id          String
  subject_ids       String[]              // Multiple subjects per camera
  @@unique([recording_setup_id, track_id])
}

// MUSIC
model SceneMusic {
  id                String                @id @default(cuid())
  film_scene_id     String                @unique
  music_name        String
  artist            String?
  duration          Int
  music_type        MusicType
}

model MomentMusic {
  id                String                @id @default(cuid())
  moment_id         String                @unique
  music_name        String
  artist            String?
  duration          Int
  music_type        MusicType
  overrides_scene_music Boolean            @default(true)
}

enum MusicType {
  CLASSICAL
  MODERN
  JAZZ
  ACOUSTIC
  ORCHESTRAL
  ELECTRONIC
  CUSTOM
}
```

---

## Key API Endpoints

**Film Creation**
```
POST /films
{
  "name": "Smith Wedding",
  "equipment_config": {
    "video_cameras": 3,
    "audio_recorders": 2,
    "graphics_enabled": true
  }
}
```

**Subject Management**
```
GET /subjects/templates                 // Global subject list
POST /films/{id}/subjects               // Add subject to film
GET /films/{id}/subjects                // Get film subjects
```

**Timeline Data**
```
GET /films/{id}/timeline                // Complete film data: tracks, subjects, scenes, moments
```

**Recording Setup**
```
POST /moments/{id}/recording-setup      // Set which equipment is active
GET /moments/{id}/recording-setup       // Get setup details
```

---

## File Organization

**Backend:** Max 300 lines per file
- Services: ~200-250 lines
- Controllers: ~100-150 lines
- DTOs: ~50-100 lines

**Frontend:** Max 300 lines per file
- Components: ~200-250 lines
- Hooks: ~100-150 lines
- Types: ~100-200 lines

---

## Success Criteria

✅ Equipment auto-generates with clear names  
✅ Subjects manage globally + per-film  
✅ Moments show which cameras are recording  
✅ No name-matching logic needed  
✅ API responses are flat (one call per resource)  
✅ Frontend checkboxes match data exactly  
✅ Music can be scene-level or moment-level  
✅ All old coverage/track confusion is gone  

---

## Reference Files

- **[SEEDING_STRATEGY.md](SEEDING_STRATEGY.md)** - Seed templates and data
- **[CLEANUP_STRATEGY.md](CLEANUP_STRATEGY.md)** - Data migration and file removal

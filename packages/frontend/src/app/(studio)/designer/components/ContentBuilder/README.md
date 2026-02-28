# Content Builder - How It Works

## What is Content Builder?

Content Builder is the visual timeline editor where you plan and organize your film's recording setup. It shows you **what you're recording, when you're recording it, and with what equipment**.

Think of it like a music production timeline (like Ableton or Logic), but instead of audio samples, you're organizing **camera angles, audio sources, graphics, and music** across your film.

---

## The Big Picture: From Equipment to Moments

### 1️⃣ **Equipment Creates Tracks**
When you configure a film's equipment, the system automatically creates **timeline tracks**.

**Example:**
- You assign **3 cameras** and **2 audio devices** to your film
- The system creates:
  - `Graphics` track (always at top)
  - `Camera 3` track
  - `Camera 2` track
  - `Camera 1` track
  - `Audio 1` track
  - `Audio 2` track
  - `Music` track (always at bottom)

**How it works in code:**
```typescript
// Backend: packages/backend/src/content/films/services/film-equipment.service.ts
async configureEquipment(filmId: number, numCameras: number, numAudio: number) {
  // Creates FilmTimelineTrack records for each camera/audio device
  // Order: Graphics → Cameras (3,2,1) → Audio (1,2,...) → Music
}
```

**Database:**
```prisma
model FilmTimelineTrack {
  id          Int       @id
  film_id     Int
  name        String    // "Camera 1", "Audio 2", etc.
  type        TrackType // VIDEO, AUDIO, GRAPHICS, MUSIC
  order_index Int       // Vertical position (1 = top)
  is_active   Boolean   // Can be temporarily hidden
}
```

---

### 2️⃣ **Scenes Span Across All Tracks**
A **scene** represents a distinct part of your film (like "Ceremony", "First Dance", "Speeches").

**Important:** Scenes span **vertically across ALL tracks** - they're like a time slice of your entire production.

Each scene has:
- **Start time** (when it begins on the timeline)
- **Duration** (how long it lasts)
- **Moments** (subdivisions that control which tracks are active)

**Visual Example:**
```
Timeline:
┌─────────────────────────────────────────────────┐
│           ┃ CEREMONY (0:00-30:00)  ┃ FIRST DANCE (30:00-35:00) ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Graphics  ┃ [Title Card]           ┃                            ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Camera 3  ┃ (active during vows)   ┃ (active entire scene)      ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Camera 2  ┃ (active entire scene)  ┃ (active entire scene)      ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Camera 1  ┃ (active entire scene)  ┃ (active entire scene)      ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Audio 1   ┃ (active entire scene)  ┃ (active entire scene)      ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Audio 2   ┃ (active entire scene)  ┃ (off)                      ┃
├───────────╂────────────────────────╂────────────────────────────┤
│ Music     ┃ (off)                  ┃ [Dance Music assigned]     ┃
└───────────┴────────────────────────┴────────────────────────────┘
```

**Database:**
```prisma
model FilmScene {
  id                Int      @id
  film_id           Int
  scene_template_id Int?     // Optional: created from template
  name              String   // "Ceremony", "First Dance"
  order_index       Int      // Position in the film
  start_time        Int?     // When scene starts (seconds)
  duration          Int?     // How long scene lasts (seconds)
  
  moments           SceneMoment[]  // Broken down further (see next)
  scene_music       SceneMusic?    // Music assigned at scene level
}
```

**Key Concept:** 
- **Scene = Time period** (vertical slice across all tracks)
- **Track = Equipment** (Camera 1, Audio 2, etc.)
- **Moment = Which tracks are active** (controlled at moment level)

**How scenes work:**
- Scenes can be **dragged left/right** to change start time
- Scenes can be **resized** to change duration
- Scenes **span all tracks** automatically
- Moments within scenes control which tracks are actually recording

---

### 3️⃣ **Scenes Contain Moments (Which Control Active Tracks)**
A **moment** is a specific part within a scene. For example, the "Ceremony" scene might have moments like:
- "Processional" (5 minutes)
- "Vows" (10 minutes)
- "Ring Exchange" (3 minutes)
- "First Kiss" (1 minute)
- "Recessional" (5 minutes)

Each moment has:
- **Name** (what's happening)
- **Duration** (how long it lasts)
- **Order** (which moment comes first, second, etc.)
- **Recording Setup** (which tracks are ACTIVE - i.e., which equipment is recording)

**Critical Concept: Track = Recording Setup**
- A **track** represents a piece of physical equipment (Camera 1, Audio 2, etc.)
- When a track is **active in a moment**, that equipment is recording
- When a track is **inactive in a moment**, that equipment is off/standby
- **100% of the time**, an active video/audio track means that equipment is recording

**Database:**
```prisma
model SceneMoment {
  id            Int      @id
  film_scene_id Int
  name          String   // "Vows", "Ring Exchange"
  order_index   Int      // 1st moment, 2nd moment, etc.
  duration      Int      // In seconds (default: 60)
  
  recording_setup MomentRecordingSetup? // Which tracks are active
}
```

**Example:**
```
Scene: "Ceremony" (0:00 - 30:00)
├─ Moment 1: "Processional" (5 min)
│  ├─ Camera 1: ACTIVE
│  ├─ Camera 2: ACTIVE
│  ├─ Camera 3: OFF (not recording yet)
│  ├─ Audio 1: ACTIVE
│  └─ Audio 2: ACTIVE
│
├─ Moment 2: "Vows" (10 min)
│  ├─ Camera 1: ACTIVE
│  ├─ Camera 2: ACTIVE
│  ├─ Camera 3: ACTIVE (now recording for coverage)
│  ├─ Audio 1: ACTIVE
│  └─ Audio 2: ACTIVE
│
└─ Moment 3: "Recessional" (5 min)
   ├─ Camera 1: ACTIVE
   ├─ Camera 2: ACTIVE
   ├─ Camera 3: OFF (done recording)
   ├─ Audio 1: ACTIVE
   └─ Audio 2: OFF
```

**Why moments matter:**
- Control which equipment is recording during different parts of the scene
- Conserve battery/storage by turning off cameras when not needed
- Plan coverage - ensure important moments have all cameras active
- Coordinate team - everyone knows when their equipment should be on/off

---

### 4️⃣ **Recording Setups: What Each Active Track Is Filming**
Once you know which tracks are active in a moment, you configure **what each track is filming**.

**Database:**
```prisma
model MomentRecordingSetup {
  id               Int      @id
  moment_id        Int      @unique
  audio_track_ids  Int[]    // Which audio tracks are ACTIVE
  graphics_enabled Boolean  // Is graphics overlay on?
  
  camera_assignments CameraSubjectAssignment[]
}

model CameraSubjectAssignment {
  id                 Int   @id
  recording_setup_id Int
  track_id           Int   // Which camera track (Camera 1, 2, or 3)
  subject_ids        Int[] // Which people/subjects this camera is filming
  
  track            FilmTimelineTrack // Links to "Camera 1", etc.
}
```

**Example Recording Setup:**
```
Moment: "Vows" (within Ceremony scene)

Active Tracks (moment controls this):
├─ Camera 1 → ACTIVE → Filming: [Bride]
├─ Camera 2 → ACTIVE → Filming: [Groom]  
├─ Camera 3 → ACTIVE → Filming: [Bride, Groom] (wide shot)
├─ Audio 1  → ACTIVE
├─ Audio 2  → ACTIVE
└─ Graphics → OFF

Inactive Tracks:
└─ Music → OFF (no music during vows)
```

**Music Assignment (Scene-Level)**
Unlike video/audio tracks which are controlled at the moment level, **music is assigned at the scene level**:

```prisma
model SceneMusic {
  id            Int       @id
  film_scene_id Int       @unique
  music_name    String    // "Can't Help Falling In Love"
  artist        String?   // "Elvis Presley"
  duration      Int?      // Song duration in seconds
  start_offset  Int?      // When to start in song (seconds)
  
  film_scene    FilmScene @relation(fields: [film_scene_id], references: [id])
}
```

**Example:**
- Scene: "First Dance" (entire scene plays one song)
- Music: "Can't Help Falling In Love" by Elvis
- Duration: 3:30
- All moments within "First Dance" use this same music track

**How this helps:**
- Videographers know which equipment to turn on/off when
- Camera operators know what to film during each moment
- Audio team knows when their mics should be recording
- You can verify all important moments have proper coverage

---

## The Complete Flow

```
1. CREATE FILM
   └─> "Sarah & John's Wedding"

2. ASSIGN EQUIPMENT
   └─> 3 Cameras + 2 Audio Devices
       └─> CREATES TRACKS AUTOMATICALLY
           ├─ Graphics
           ├─ Camera 3
           ├─ Camera 2
           ├─ Camera 1
           ├─ Audio 1
           ├─ Audio 2
           └─ Music

3. ADD SCENES TO TIMELINE
   └─> Create "Ceremony" scene at 0:00 (30 min duration)
       ├─ Scene spans ALL tracks (vertical time slice)
       └─> Creates FilmScene record
   └─> Create "First Dance" scene at 30:00 (5 min duration)
       ├─ Scene spans ALL tracks
       ├─> Assign music: "Can't Help Falling In Love" (scene-level)
       └─> Creates FilmScene + SceneMusic records

4. SCENES AUTOMATICALLY INCLUDE MOMENTS
   └─> "Ceremony" scene has built-in moments:
       ├─ Processional (5 min)
       ├─ Vows (10 min)
       ├─ Ring Exchange (3 min)
       ├─ First Kiss (1 min)
       └─ Recessional (5 min)

5. CONFIGURE WHICH TRACKS ARE ACTIVE PER MOMENT
   └─> "Processional" moment:
       ├─ Camera 1 → ACTIVE
       ├─ Camera 2 → ACTIVE
       ├─ Camera 3 → OFF (not recording yet)
       ├─ Audio 1 → ACTIVE
       ├─ Audio 2 → ACTIVE
       └─> Creates MomentRecordingSetup
   
   └─> "Vows" moment:
       ├─ Camera 1 → ACTIVE → Filming: Bride
       ├─ Camera 2 → ACTIVE → Filming: Groom
       ├─ Camera 3 → ACTIVE → Filming: Wide shot
       ├─ Audio 1 → ACTIVE
       ├─ Audio 2 → ACTIVE
       └─> Creates MomentRecordingSetup + CameraSubjectAssignments

6. VIDEOGRAPHER SEES COMPLETE SHOT LIST
   └─> Timeline shows:
       ├─ When to turn each camera on/off
       ├─ What each camera should film
       ├─ When audio should be recording
       └─ Which music plays during which scenes
```

---

## Key Features

### 🎬 **Visual Timeline**
- Drag and drop scenes onto tracks
- Resize scenes to adjust duration
- See all cameras/audio at once
- Zoom in/out to see details or big picture

### 📚 **Scene Library**
- Pre-built scene templates (Ceremony, Reception, First Dance, etc.)
- Scenes come with default moments already configured
- Reusable across multiple films

### 👥 **Subject Tracking**
- Define who's in the film (Bride, Groom, Best Man, etc.)
- Assign subjects to camera angles
- Know which camera is covering which person at all times

### 🎵 **Music Integration**
- Assign music to scenes or moments
- Track song timing for First Dance, Mother-Son Dance, etc.

### 💾 **Auto-Save**
- Changes save automatically to the database
- Tracks when scenes are added/moved/deleted
- Undo/redo support (coming soon)

---

## Technical Architecture

### Frontend (Next.js + React)
```
ContentBuilder
├─ ContentBuilderProvider (state management)
│  ├─ useTimelineData (loads tracks/scenes from API)
│  ├─ usePlaybackControls (play/pause/scrub timeline)
│  ├─ useScenesLibrary (available scene templates)
│  ├─ useTimelineDragDrop (drag scenes onto tracks)
│  └─ useSaveState (auto-save to backend)
│
├─ ContentBuilderContainer (layout)
│  ├─ PlaybackPanel (play controls, timecode)
│  ├─ TimelinePanel (visual tracks with scenes)
│  └─ DetailsPanel (scene properties, moments)
│
└─ Modals
   ├─ CreateSceneDialog (add new scenes)
   └─ MomentDetailsDialog (configure recording setup)
```

### Backend (NestJS + Prisma)
```
FilmsModule
├─ FilmsController (HTTP endpoints)
├─ FilmsService (business logic)
├─ FilmEquipmentService (manages tracks)
└─ FilmScenesManagementService (manages scenes/moments)

Database Models:
├─ Film (the project)
├─ FilmTimelineTrack (camera/audio tracks)
├─ FilmScene (ceremony, reception, etc.)
├─ SceneMoment (vows, ring exchange, etc.)
├─ MomentRecordingSetup (which cameras/audio active)
└─ CameraSubjectAssignment (camera → subject mapping)
```

### API Endpoints
```
Films:
  POST   /films                    - Create new film
  GET    /films/:id                - Get film with all tracks/scenes/moments
  PATCH  /films/:id                - Update film details
  DELETE /films/:id                - Delete film

Equipment/Tracks:
  PATCH  /films/:id/equipment      - Update equipment (auto-creates tracks)
  GET    /films/:id/tracks         - Get all timeline tracks

Scenes:
  GET    /films/:id/scenes         - Get all scenes with moments
  POST   /films/:id/scenes         - Add scene from template
  PATCH  /scenes/:id                - Update scene
  DELETE /scenes/:id                - Delete scene

Moments:
  GET    /scenes/:id/moments       - Get all moments in scene
  PATCH  /moments/:id               - Update moment
  POST   /moments/:id/recording    - Configure recording setup
```

---

## Common Use Cases

### 🎥 **Setting Up a Wedding Film**
1. Create film: "Sarah & John's Wedding - June 15, 2024"
2. Assign equipment: 3 cameras, 2 wireless mics
3. Add subjects: Bride, Groom, Officiant, Best Man, Maid of Honor
4. Drag scenes onto timeline:
   - Ceremony (0:00 - 30:00)
   - Cocktail Hour (30:00 - 60:00)
   - Reception Entrance (60:00 - 65:00)
   - First Dance (65:00 - 70:00)
   - Toasts (70:00 - 85:00)
5. Configure each moment's camera angles
6. Export shot list for videographer

### 🎞️ **Planning a Multi-Camera Interview**
1. Create film: "Interview with CEO"
2. Assign equipment: 2 cameras, 1 lav mic
3. Add subjects: Interviewer, CEO
4. Create scenes:
   - Introduction (0:00 - 2:00)
   - Question 1 (2:00 - 5:00)
   - Question 2 (5:00 - 8:00)
5. Configure:
   - Camera 1: Always on CEO (close-up)
   - Camera 2: Switches between Interviewer and wide shot
   - Audio 1: CEO's lav mic

### 🎶 **Music Video Planning**
1. Create film: "Music Video - Summer Vibes"
2. Assign equipment: 4 cameras, playback system
3. Add scenes based on song sections:
   - Intro (0:00 - 0:15)
   - Verse 1 (0:15 - 0:45)
   - Chorus (0:45 - 1:15)
   - Verse 2 (1:15 - 1:45)
   - Bridge (1:45 - 2:15)
   - Final Chorus (2:15 - 3:00)
4. Assign music to entire timeline
5. Configure camera movements per section

---

## Benefits

### For Videographers
- **Clear shot lists** - Know exactly what to film when
- **Equipment planning** - Know what gear you need
- **Time estimates** - Accurate timing for scheduling
- **Coverage verification** - Ensure you're filming all important moments

### For Editors
- **Organized footage** - Know what was filmed on each camera
- **Moment markers** - Find specific moments quickly
- **Music timing** - Know exact song durations and placements

### For Clients
- **Visual timeline** - See the plan for their film
- **Coverage confirmation** - Verify all important moments are planned
- **Music integration** - See how songs fit into the timeline

---

## Future Enhancements

- [ ] **Equipment Library** - Assign specific cameras/mics (not just counts)
- [ ] **Package Templates** - Reusable equipment configurations
- [ ] **Shot Angles** - Plan specific camera movements (pan, tilt, zoom)
- [ ] **Export Shot List** - PDF/CSV for videographers
- [ ] **Time Sync** - Link to actual recorded footage
- [ ] **Real-time Collaboration** - Multiple users editing same timeline

---

## Related Documentation

- [Equipment Management Plan](../../../../../.github/refactor-films/EQUIPMENT_MANAGEMENT_PLAN.md)
- [Database Schema](../../../../backend/prisma/schema.prisma)
- [API Endpoints](../../../../backend/src/content/films/films.controller.ts)
- [Component Structure](./CONTENTBUILDER_COMPONENT_GUIDE.md)

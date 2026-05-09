# Track Naming & Equipment Assignment Analysis

## 1. Track Name Creation & Format

### Naming Pattern
Track names follow a **standardized format**:
- **Cameras**: `Camera 1`, `Camera 2`, `Camera 3`, ...
- **Audio**: `Audio 1`, `Audio 2`, ...
- **System tracks**: `Graphics`, `Music`

### Where Created
**File**: [packages/backend/src/content/films/services/film-equipment.service.ts](packages/backend/src/content/films/services/film-equipment.service.ts#L20)

Track names are **auto-generated** by `FilmEquipmentService.configureEquipment()`:

```typescript
// Video tracks (Camera 3, 2, 1 in that order — reverse order)
for (let i = numCameras; i >= 1; i--) {
  tracks.push({
    name: `Camera ${i}`,        // ← Naming pattern
    type: TrackType.VIDEO,
    order_index: tracks.length + 1,
  });
}

// Audio tracks (Audio 1, 2, ... — forward order)
for (let i = 1; i <= numAudio; i++) {
  tracks.push({
    name: `Audio ${i}`,         // ← Naming pattern
    type: TrackType.AUDIO,
    order_index: tracks.length + 1,
  });
}
```

**Triggered by**:
- Creating a film with `num_cameras` or `num_audio` in [CreateFilmDto](packages/backend/src/content/films/dto/create-film.dto.ts#L48)
- Updating equipment via `PATCH /api/films/{id}/equipment`

---

## 2. Database Schema

### FilmTimelineTrack (v2)
**File**: [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma#L2650)

```prisma
model FilmTimelineTrack {
  id             Int       @id @default(autoincrement())
  film_id        Int
  name           String                          // "Camera 1", "Audio 1", etc.
  type           TrackType                       // VIDEO, AUDIO, GRAPHICS, MUSIC
  order_index    Int
  is_active      Boolean   @default(true)
  is_unmanned    Boolean   @default(false)
  crew_id        Int?
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  film                     Film                  @relation(fields: [film_id], references: [id])
  crew                     Crew?                 @relation(fields: [crew_id], references: [id])
  camera_assignments       CameraSubjectAssignment[]
  scene_camera_assignments SceneCameraAssignment[]
  scene_camera_positions   SceneCameraPosition[]
  moment_camera_positions  MomentCameraPosition[]

  @@unique([film_id, name])                      // Name is unique per film
  @@map("film_timeline_tracks_v2")
}
```

### FilmEquipmentAssignment
**File**: [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma#L2594)

```prisma
model FilmEquipmentAssignment {
  id           Int      @id @default(autoincrement())
  film_id      Int
  equipment_id Int
  quantity     Int      @default(1)
  notes        String?                           // ← Stores slot mapping (see below)
  assigned_at  DateTime @default(now())

  film      Film      @relation(fields: [film_id])
  equipment equipment @relation(fields: [equipment_id])

  @@unique([film_id, equipment_id])
  @@map("film_equipment_assignments")
}
```

### EquipmentTemplateItem
**File**: [packages/backend/prisma/schema.prisma](packages/backend/prisma/schema.prisma#L2630)

```prisma
model EquipmentTemplateItem {
  ...
  track_name   String?                           // e.g., "Camera 1", "Camera 2", "Audio 1"
  slot_type    EquipmentTemplateSlotType         // CAMERA, AUDIO (enum)
  slot_index   Int                               // 1, 2, 3, ...
  ...
}
```

---

## 3. Equipment-to-Track Assignment Flow

### Data Flow Diagram

```
User selects equipment in UI
         ↓
filmsApi.equipmentAssignments.assign(filmId, {
  equipment_id: 123,
  notes: "slot:camera-1"              ← Slot mapping encoded in notes
})
         ↓
FilmEquipmentAssignmentsService.assignEquipment()
         ↓
FilmEquipmentAssignment.create({
  film_id,
  equipment_id,
  quantity,
  notes                              ← Stored as-is
})
         ↓
Frontend fetches via equipmentAssignments.getAll(filmId)
         ↓
parseEquipmentSlotNote(notes)         ← Extracts "slot:camera-1" → "camera-1"
         ↓
buildAssignmentsBySlot()              ← Creates FilmEquipmentAssignmentsBySlot
         ↓
Map displayed in equipment panel
```

### Where FilmEquipmentAssignmentsBySlot is Populated

**File**: [packages/frontend/src/features/content/films/utils/equipmentAssignments.ts](packages/frontend/src/features/content/films/utils/equipmentAssignments.ts#L58)

```typescript
export const buildAssignmentsBySlot = (
  assignments: FilmEquipmentAssignment[],
): FilmEquipmentAssignmentsBySlot => {
  return assignments.reduce<FilmEquipmentAssignmentsBySlot>((acc, assignment) => {
    const slotKey = parseEquipmentSlotNote(assignment.notes);  // ← Extract slot key
    if (!slotKey || !assignment.equipment) return acc;
    
    const next: FilmEquipmentSlotAssignment = {
      slotKey,                                                  // "camera-1"
      equipmentId: assignment.equipment.id,
      equipmentName: assignment.equipment.name,
      equipmentModel: assignment.equipment.model ?? undefined,
      equipmentType: assignment.equipment.type,
      equipmentCategory: assignment.equipment.category,
    };
    acc[slotKey] = next;
    return acc;
  }, {});
};
```

**Called from**:
- [useFilmEquipmentPanel](packages/frontend/src/features/content/films/hooks/useFilmEquipmentPanel.ts#L40) hook during equipment load
- Various track sync hooks (useFilmTrackSync, usePackageTrackSync)

---

## 4. Slot Encoding Convention

### Pattern: Slot Keys & Notes Field

**Slot Key Format**: `{type}-{index}` (e.g., `camera-1`, `audio-2`)

**Notes Field Format**: `slot:{type}-{index}` (e.g., `slot:camera-1`)

**File**: [packages/frontend/src/features/content/films/utils/equipmentAssignments.ts](packages/frontend/src/features/content/films/utils/equipmentAssignments.ts#L1-L35)

```typescript
const SLOT_PREFIX = "slot:";
const SLOT_PATTERN = /^slot:(camera|audio)-(\d+)$/i;
const TRACK_PATTERN = /^(Camera|Audio)\s+(\d+)$/i;

export const buildEquipmentSlotKey = (type: "camera" | "audio", index: number): EquipmentSlotKey =>
  `${type}-${index}` as EquipmentSlotKey;

export const buildEquipmentSlotNote = (slotKey: EquipmentSlotKey): string =>
  `${SLOT_PREFIX}${slotKey}`;                    // "slot:camera-1"

export const parseEquipmentSlotNote = (note?: string | null): EquipmentSlotKey | null => {
  if (!note) return null;
  const trimmed = note.trim();
  const match = trimmed.match(SLOT_PATTERN);
  if (!match) return null;
  const type = match[1].toLowerCase() as "camera" | "audio";
  const index = Number(match[2]);
  if (!Number.isFinite(index) || index <= 0) return null;
  return buildEquipmentSlotKey(type, index);
};

export const getSlotKeyFromTrackName = (trackName?: string | null): EquipmentSlotKey | null => {
  if (!trackName) return null;
  const match = trackName.trim().match(TRACK_PATTERN);  // "Camera 1" → "camera-1"
  if (!match) return null;
  const type = match[1].toLowerCase() as "camera" | "audio";
  const index = Number(match[2]);
  if (!Number.isFinite(index) || index <= 0) return null;
  return buildEquipmentSlotKey(type, index);
};
```

---

## 5. Backend Track Usage in Mappers

### Film Scene Content Mapper
**File**: [packages/backend/src/content/films/film.mapper.ts](packages/backend/src/content/films/film.mapper.ts#L289)

```typescript
// Exports track name alongside assignment
recording_setup: scene.recording_setup
  ? {
      id: scene.recording_setup.id,
      audio_track_ids: scene.recording_setup.audio_track_ids,
      graphics_enabled: scene.recording_setup.graphics_enabled,
      camera_assignments: scene.recording_setup.camera_assignments.map((a) => ({
        id: a.id,
        track_id: a.track_id,
        track_name: a.track?.name || String(a.track_id),  // ← Uses track.name
        track_type: a.track?.type ? String(a.track.type) : undefined,
        subject_ids: a.subject_ids ?? [],
      })),
    }
  : null,
```

### Moment Mapper
**File**: [packages/backend/src/content/moments/moment.mapper.ts](packages/backend/src/content/moments/moment.mapper.ts#L59)

```typescript
camera_assignments: cameraAssignments.map(a => ({
  id: a.id,
  track_id: a.track_id,
  track_name: a.track?.name || String(a.track_id),    // ← Uses track.name
  track_type: a.track?.type ? String(a.track.type) : undefined,
  subject_ids: a.subject_ids,
  shot_type: ..., 
  enabled: ...,
})),
```

---

## 6. Type Definitions

### Frontend Types
**File**: [packages/frontend/src/features/content/films/types/film-equipment.types.ts](packages/frontend/src/features/content/films/types/film-equipment.types.ts)

```typescript
export type EquipmentSlotKey = `${EquipmentSlotType}-${number}`;  // "camera-1" | "audio-1"

export interface FilmEquipmentSlotAssignment {
  slotKey: EquipmentSlotKey;
  equipmentId: number;
  equipmentName: string;
  equipmentModel?: string;
  equipmentType?: string;
  equipmentCategory?: string;
}

export type FilmEquipmentAssignmentsBySlot = Record<EquipmentSlotKey, FilmEquipmentSlotAssignment>;
```

---

## 7. Key Findings & Pattern Summary

### ✅ Consistency
- **Track creation**: Consistently uses pattern `Camera {i}`, `Audio {i}`
- **Slot mapping**: Consistently encodes in `notes` field as `slot:camera-1`
- **Pattern matching**: Both backend and frontend handle the standard formats

### 🔄 Flow Summary
1. Backend auto-generates FilmTimelineTrack records with names like `Camera 1`, `Audio 1`
2. Frontend fetches equipment assignments with `notes` field containing `slot:camera-1`
3. `buildAssignmentsBySlot()` parses the notes field to extract slot key
4. Frontend uses `getSlotKeyFromTrackName()` to reverse-map track names back to slot keys
5. Equipment panels display equipment assigned to each track

### ⚠️ Potential Issues
- **No validation**: Backend doesn't validate that assigned equipment slot matches the track number
- **Notes dependency**: The entire slot system relies on the `notes` field in FilmEquipmentAssignment
- **No cascade**: Changing track names after assignment won't update the notes field
- **Manual sync**: Frontend must manually sync assignments when tracks are added/removed

---

## 8. Related Endpoints

### Backend API
- `GET /api/films/{id}/equipment-assignments` — Fetch all equipment assignments
- `POST /api/films/{id}/equipment-assignments` — Assign equipment to film
- `PATCH /api/films/{id}/equipment-assignments/{equipmentId}` — Update assignment (notes)
- `DELETE /api/films/{id}/equipment-assignments/{equipmentId}` — Remove assignment
- `PATCH /api/films/{id}/equipment` — Create/update tracks by camera/audio count

### Frontend API (via [filmsApi](packages/frontend/src/features/content/films/api/index.ts))
- `filmsApi.equipmentAssignments.getAll(filmId)`
- `filmsApi.equipmentAssignments.assign(filmId, dto)`
- `filmsApi.equipmentAssignments.update(filmId, equipmentId, dto)`
- `filmsApi.equipmentAssignments.remove(filmId, equipmentId)`
- `filmsApi.equipment.update(filmId, { num_cameras, num_audio, allow_removal })`


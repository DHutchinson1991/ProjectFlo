# Phase 2: Backend Services - Implementation Plan

**Date:** 2026-01-30  
**Status:** Planning  
**Duration:** 2 weeks

---

## Directory Structure Analysis

### ✅ Existing Structure
```
src/
├── content/
│   ├── films/                    ← Already exists! Has services/ subfolder
│   │   ├── films.module.ts
│   │   ├── films.service.ts
│   │   ├── films.controller.ts
│   │   ├── dto/
│   │   └── services/
│   │       ├── film-equipment.service.ts
│   │       ├── film-timeline-tracks.service.ts
│   │       └── film-scenes-management.service.ts
│   ├── subjects/                 ← Already exists! Empty or legacy?
│   │   ├── subjects.module.ts
│   │   ├── subjects.service.ts
│   │   └── subjects.controller.ts
│   ├── scenes/                   ← Legacy - to be deleted
│   └── coverage/                 ← Legacy - to be deleted
├── moments/                      ← Legacy - to be deleted
├── music/                        ← Check if exists
└── common/                       ← Check if exists
```

### 🎯 Target Structure (Phase 2 Complete)
```
src/
├── content/
│   ├── films/                    ← Update existing
│   │   ├── films.module.ts
│   │   ├── films.service.ts
│   │   ├── films.controller.ts
│   │   ├── dto/
│   │   │   ├── create-film.dto.ts
│   │   │   ├── update-film.dto.ts
│   │   │   ├── update-equipment.dto.ts
│   │   │   └── film-response.dto.ts
│   │   └── services/
│   │       ├── film-equipment.service.ts      ← Update for refactor v2
│   │       ├── film-timeline-tracks.service.ts ← Update for refactor v2
│   │       └── film-scenes-management.service.ts ← Update for refactor v2
│   │
│   ├── subjects/                 ← NEW: Refactor v2 implementation
│   │   ├── subjects.module.ts
│   │   ├── subjects.service.ts
│   │   ├── subjects.controller.ts
│   │   └── dto/
│   │       ├── create-subject.dto.ts
│   │       ├── update-subject.dto.ts
│   │       └── subject-response.dto.ts
│   │
│   ├── scenes/                   ← NEW: Refactor v2 implementation
│   │   ├── scenes.module.ts
│   │   ├── scenes.service.ts
│   │   ├── scenes.controller.ts
│   │   └── dto/
│   │       ├── create-scene.dto.ts
│   │       ├── update-scene.dto.ts
│   │       └── scene-response.dto.ts
│   │
│   ├── moments/                  ← NEW: Refactor v2 implementation (move from root)
│   │   ├── moments.module.ts
│   │   ├── moments.service.ts
│   │   ├── moments.controller.ts
│   │   ├── dto/
│   │   │   ├── create-moment.dto.ts
│   │   │   ├── update-moment.dto.ts
│   │   │   └── moment-response.dto.ts
│   │   └── services/
│   │       └── recording-setup.service.ts
│   │
│   └── music/                    ← NEW: Refactor v2 implementation
│       ├── music.module.ts
│       ├── music.service.ts
│       ├── music.controller.ts
│       └── dto/
│           ├── assign-scene-music.dto.ts
│           ├── assign-moment-music.dto.ts
│           └── music-response.dto.ts
│
└── common/                       ← NEW or UPDATE
    ├── logging/
    │   ├── logger.service.ts
    │   └── request-logger.middleware.ts
    └── guards/
```

---

## Implementation Strategy

### Strategy: Hybrid Approach
- ✅ **Keep** what exists and aligns with refactor v2
- 🔄 **Update** services to use new Prisma models
- ➕ **Add** new functionality as needed
- ❌ **Delete** legacy/conflicting code

---

## Task Breakdown

### 2.1 Films Module - Update & Extend (~400 lines)

**Status:** Already exists in `src/content/films/`

**Action:** UPDATE existing files to work with refactor v2 schema

**Files to Update:**
- `films.service.ts` - Update to use `Film` model from refactor v2
- `films.controller.ts` - Add/update endpoints for new schema
- `services/film-equipment.service.ts` - Update for `FilmTimelineTrack` model
- `services/film-timeline-tracks.service.ts` - Update for new schema
- `services/film-scenes-management.service.ts` - Update for `FilmScene` model

**Files to Create:**
- `dto/create-film.dto.ts` - New DTO for creating films
- `dto/update-film.dto.ts` - New DTO for updating films
- `dto/update-equipment.dto.ts` - DTO for equipment configuration
- `dto/film-response.dto.ts` - Response shape for frontend

**New Endpoints Needed:**
```typescript
POST   /films                      // Create film with equipment
GET    /films/:id                  // Get film with all data (flat response)
PUT    /films/:id                  // Update film
DELETE /films/:id                  // Delete film
PUT    /films/:id/equipment        // Update equipment configuration
GET    /films/:id/tracks           // Get all tracks for film
```

**Key Changes:**
- Use `Film` model (refactor v2) instead of legacy `film_library`
- Equipment config creates `FilmTimelineTrack` records
- Auto-generate track names (Camera 1, 2, 3, Audio 1, 2, etc.)
- Return flat nested data (film → tracks → subjects → scenes → moments)

---

### 2.2 Subjects Module - Rebuild (~370 lines)

**Status:** Directory exists at `src/content/subjects/` - may be legacy

**Action:** REBUILD for refactor v2 (replace any legacy code)

**Files to Create/Replace:**
- `subjects.module.ts` (~50 lines)
- `subjects.service.ts` (~200 lines)
- `subjects.controller.ts` (~150 lines)
- `dto/create-subject.dto.ts` (~30 lines)
- `dto/update-subject.dto.ts` (~20 lines)
- `dto/subject-response.dto.ts` (~20 lines)

**Features:**
- List subject templates (global library)
- Add subject to film (from template or custom)
- Update subject (name, notes)
- Delete subject
- Get all subjects for a film

**Endpoints:**
```typescript
GET    /subjects/templates         // Get global templates (24)
GET    /films/:filmId/subjects     // Get all subjects for film
POST   /films/:filmId/subjects     // Add subject (template or custom)
PUT    /subjects/:id               // Update subject
DELETE /subjects/:id               // Delete subject
```

**Models Used:**
- `SubjectTemplate` (global library)
- `FilmSubject` (film-specific instances)

---

### 2.3 Scenes Module - Rebuild (~370 lines)

**Status:** Legacy directory exists at `src/content/scenes/` - TO DELETE

**Action:** REBUILD in new location for refactor v2

**Files to Create:**
- `scenes.module.ts` (~50 lines)
- `scenes.service.ts` (~200 lines)
- `scenes.controller.ts` (~150 lines)
- `dto/create-scene.dto.ts` (~40 lines)
- `dto/update-scene.dto.ts` (~30 lines)
- `dto/scene-response.dto.ts` (~20 lines)

**Features:**
- List scene templates (global library)
- Add scene to film from template
- Update scene (name, order)
- Delete scene
- Get scenes for film (with moments)
- Create moments when scene is created from template

**Endpoints:**
```typescript
GET    /scenes/templates           // Get global scene templates (3)
GET    /films/:filmId/scenes       // Get all scenes for film
POST   /films/:filmId/scenes       // Add scene from template
PUT    /scenes/:id                 // Update scene
DELETE /scenes/:id                 // Delete scene
```

**Models Used:**
- `SceneTemplate` (global library with moments)
- `FilmScene` (film-specific instances)
- `SceneMoment` (moments created from template)

---

### 2.4 Moments & Recording Setup Module (~500 lines)

**Status:** Legacy exists at `src/moments/` (root level) - TO MOVE/REBUILD

**Action:** MOVE to `src/content/moments/` and REBUILD for refactor v2

**Files to Create:**
- `moments.module.ts` (~50 lines)
- `moments.service.ts` (~200 lines)
- `moments.controller.ts` (~150 lines)
- `services/recording-setup.service.ts` (~250 lines)
- `dto/create-moment.dto.ts` (~30 lines)
- `dto/update-moment.dto.ts` (~30 lines)
- `dto/create-recording-setup.dto.ts` (~60 lines)
- `dto/update-recording-setup.dto.ts` (~50 lines)
- `dto/camera-assignment.dto.ts` (~40 lines)
- `dto/moment-response.dto.ts` (~30 lines)

**Features:**
- CRUD moments (name, duration, order)
- Create recording setup for moment
- Assign cameras to subjects
- Set active audio tracks
- Enable/disable graphics
- Get recording setup (nested with camera assignments)

**Endpoints:**
```typescript
GET    /scenes/:sceneId/moments                    // Get moments for scene
POST   /scenes/:sceneId/moments                    // Create moment
PUT    /moments/:id                                // Update moment
DELETE /moments/:id                                // Delete moment
POST   /moments/:id/recording-setup                // Create setup
GET    /moments/:id/recording-setup                // Get setup
PUT    /moments/:id/recording-setup                // Update setup
DELETE /moments/:id/recording-setup                // Delete setup
POST   /moments/:id/recording-setup/camera/:trackId // Assign camera to subjects
```

**Models Used:**
- `SceneMoment` (moments)
- `MomentRecordingSetup` (recording config)
- `CameraSubjectAssignment` (camera → subjects mapping)

---

### 2.5 Music Module - Create New (~300 lines)

**Status:** Check if exists in `src/music/` or `src/content/music/`

**Action:** CREATE NEW module for refactor v2

**Files to Create:**
- `music.module.ts` (~50 lines)
- `music.service.ts` (~150 lines)
- `music.controller.ts` (~100 lines)
- `dto/assign-scene-music.dto.ts` (~30 lines)
- `dto/assign-moment-music.dto.ts` (~40 lines)
- `dto/music-response.dto.ts` (~20 lines)

**Features:**
- Assign music to scene (background)
- Assign music to moment (override scene music)
- Support spanning (start_moment_id, end_moment_id)
- Get resolved music for moment (moment override OR scene music)
- Delete music assignments

**Endpoints:**
```typescript
POST   /scenes/:sceneId/music      // Assign scene-level music
PUT    /scenes/:sceneId/music      // Update scene music
DELETE /scenes/:sceneId/music      // Remove scene music
POST   /moments/:id/music          // Assign moment-level music
PUT    /moments/:id/music          // Update moment music
DELETE /moments/:id/music          // Remove moment music
GET    /moments/:id/music          // Get resolved music (moment or scene)
```

**Models Used:**
- `SceneMusic` (scene-level assignments)
- `MomentMusic` (moment-level overrides)
- `MusicType` enum (CEREMONY_ENTRANCE, RECEPTION_COCKTAIL, etc.)

---

### 2.6 Logging Infrastructure (~180 lines)

**Status:** Check if `src/common/logging/` exists

**Action:** CREATE if not exists, or UPDATE existing

**Files to Create:**
- `common/logging/logger.service.ts` (~100 lines)
- `common/logging/request-logger.middleware.ts` (~80 lines)

**Features:**
- Logger service with context (class name, method name)
- Colored console output (development)
- Structured JSON logging (production)
- Request/response middleware
- Log levels: debug, info, warn, error

**Usage:**
```typescript
import { LoggerService } from '../common/logging/logger.service';

@Injectable()
export class FilmsService {
  private readonly logger = new LoggerService(FilmsService.name);

  async createFilm(dto: CreateFilmDto) {
    this.logger.log('Creating film', { dto });
    // ... logic
    this.logger.log('Film created successfully', { filmId: film.id });
  }
}
```

---

### 2.7 Update app.module.ts

**Files to Update:**
- `src/app.module.ts`

**Changes:**
- Import new modules: `ScenesModule`, `MomentsModule`, `MusicModule`
- Update `SubjectsModule` import if moved
- Remove old module imports (if any legacy ones exist)
- Add `RequestLoggerMiddleware` globally

---

### 2.8 Delete Legacy Code

**Directories to DELETE:**
- ❌ `src/content/coverage/` (legacy coverage model)
- ❌ `src/content/scenes/` (legacy scenes - we'll recreate)
- ❌ `src/moments/` (root level - we'll move to content/moments)
- ❌ Any other legacy film-related modules

**Action:** Verify these are safe to delete by checking:
1. What imports them in app.module.ts
2. What other modules depend on them
3. What frontend code calls them

---

## Implementation Order

### Week 1: Core Modules
1. **Day 1-2:** Logging infrastructure + Films module updates
2. **Day 3:** Subjects module rebuild
3. **Day 4:** Scenes module rebuild
4. **Day 5:** Testing + Week 1 review

### Week 2: Advanced Modules
1. **Day 6-7:** Moments + Recording Setup modules
2. **Day 8:** Music module
3. **Day 9:** Integration testing + cleanup
4. **Day 10:** Delete legacy code + final verification

---

## Verification Checklist

### Per-Module Testing
- [ ] Module imports correctly in app.module.ts
- [ ] All endpoints return expected shapes
- [ ] DTOs validate correctly (class-validator)
- [ ] Services handle errors gracefully
- [ ] Prisma queries use correct models (refactor v2)
- [ ] No TypeScript errors
- [ ] Lint passes

### Integration Testing
- [ ] Create film → equipment tracks auto-generated
- [ ] Add subjects → templates vs custom work
- [ ] Add scene from template → moments auto-created
- [ ] Create recording setup → cameras + audio + subjects linked
- [ ] Assign music → scene vs moment override resolved
- [ ] Delete film → cascades correctly
- [ ] Get film → returns flat nested structure

### Final Checks
- [ ] `npm run build` succeeds
- [ ] `npm run start:dev` starts without errors
- [ ] No console errors on startup
- [ ] All endpoints accessible via Postman/cURL
- [ ] `npm run lint:fix` passes
- [ ] `npm run test` passes (if tests exist)

---

## Risk Assessment

### 🟢 Low Risk
- Films module already exists, just needs updates
- Database schema is solid (Phase 1 complete)
- Clear endpoint specifications

### 🟡 Medium Risk
- Existing subjects module may have legacy code to remove
- Need to coordinate music module with existing music library
- Recording setup is the most complex feature (multiple related tables)

### 🔴 High Risk
- Deleting legacy code may break existing frontend
- Need to coordinate with frontend team on endpoint changes
- Migration from old API to new API requires careful planning

**Mitigation:**
- Don't delete legacy code until Phase 3+ confirms frontend is updated
- Use feature flags or versioned endpoints if needed
- Maintain backward compatibility during transition

---

## Next Steps

1. ✅ Review this plan with team
2. ⏳ Audit existing code (what can be kept vs rebuilt)
3. ⏳ Start with Logging + Films module (Day 1)
4. ⏳ Create DTOs first, then services, then controllers
5. ⏳ Test each module in isolation before moving to next

---

## Questions to Resolve

1. **Does `src/music/` already exist?** If so, what's in it?
2. **What's in `src/content/subjects/` currently?** Legacy or empty?
3. **What's in `src/moments/` currently?** Can we move it or rebuild?
4. **Does `src/common/logging/` exist?** Or do we use NestJS built-in logger?
5. **Are there existing tests** for films/subjects/scenes/moments?
6. **Frontend dependency:** When can we safely delete legacy code?

---

**Status:** Ready to begin implementation pending answers to questions above.

# Phase 2: Backend Services (Weeks 2-3)

**Goal:** Create all backend services, controllers, and logging infrastructure  
**Duration:** 2 weeks  
**Dependency:** Phase 1 (Database)  
**Next:** Phase 3 (Frontend Infrastructure)

---

## Overview

Weeks 2-3 focus on building the NestJS services and controllers that will power the new API.

Create 5 new modules:
1. **Subjects** - Subject management (CRUD)
2. **Equipment** - Equipment configuration
3. **Recording Setup** - Moment recording setup management
4. **Music** - Music assignment (scene + moment level)
5. **Common/Logging** - Logging infrastructure

Update:
- **Films** - Add equipment configuration logic
- **app.module.ts** - Import new modules

Delete:
- Old backend code (moments, components, timeline, scenes)

---

## Task Breakdown

### 2.1 Subject Management Module (~200 lines)

**Files:**
- `src/subjects/subjects.module.ts` (~50 lines)
- `src/subjects/subjects.service.ts` (~200 lines)
- `src/subjects/subjects.controller.ts` (~150 lines)
- `src/subjects/dto/create-subject.dto.ts` (~20 lines)
- `src/subjects/dto/update-subject.dto.ts` (~20 lines)

**Features:**
- Get all subjects for a film
- Add subject (from template or custom)
- Update subject name/notes
- Delete subject
- List global subject templates

**Endpoints:**
```
GET    /subjects/templates
GET    /films/:filmId/subjects
POST   /films/:filmId/subjects
PUT    /films/:filmId/subjects/:id
DELETE /films/:filmId/subjects/:id
```

---

### 2.2 Equipment Management (~150 lines)

**Files:**
- `src/films/films.service.ts` - Update with equipment logic (~300 lines)
- `src/equipment/equipment.module.ts` (~50 lines, if separate)
- Or add to films module

**Features:**
- Create film with equipment config
- Update film equipment (add/remove cameras/audio)
- Get film equipment tracks
- Auto-generate track names

**Endpoints:**
```
POST   /films
PUT    /films/:id/equipment
GET    /films/:id/tracks
```

---

### 2.3 Recording Setup Management (~250 lines)

**Files:**
- `src/recording-setup/recording-setup.module.ts` (~50 lines)
- `src/recording-setup/recording-setup.service.ts` (~250 lines)
- `src/recording-setup/recording-setup.controller.ts` (~150 lines)
- `src/recording-setup/dto/` - Multiple DTOs (~50 lines)

**Features:**
- Create recording setup for moment
- Add camera assignments (camera → subjects)
- Set active audio tracks
- Set graphics info
- Get/update/delete recording setup

**Endpoints:**
```
POST   /moments/:id/recording-setup
GET    /moments/:id/recording-setup
PUT    /moments/:id/recording-setup
DELETE /moments/:id/recording-setup
POST   /moments/:id/recording-setup/camera-assignment
```

---

### 2.4 Music Management (~150 lines)

**Files:**
- `src/music/music.module.ts` (~50 lines)
- `src/music/music.service.ts` (~150 lines)
- `src/music/music.controller.ts` (~100 lines)

**Features:**
- Set scene-level music
- Set moment-level music (overrides)
- Handle music spanning (start_moment_id, end_moment_id)
- Get music for moment (resolved: scene music if no moment override)

**Endpoints:**
```
POST   /films/:id/scenes/:sceneId/music
PUT    /films/:id/scenes/:sceneId/music
DELETE /films/:id/scenes/:sceneId/music
POST   /moments/:id/music
PUT    /moments/:id/music
DELETE /moments/:id/music
GET    /moments/:id/music
```

---

### 2.5 Logging Infrastructure (~80 lines)

**Files:**
- `src/common/logging/logger.service.ts` (~100 lines)
- `src/common/logging/request-logger.middleware.ts` (~80 lines)

**Features:**
- Logger service with context
- Request/response logging middleware
- Structured logging output
- Environment-based log levels

---

### 2.6 Update & Cleanup

**Files to update:**
- `src/app.module.ts` - Import new modules, remove old ones

**Files to delete:**
- `src/moments/` entire folder
- `src/components/` entire folder
- `src/timeline/` entire folder
- `src/scenes/` entire folder

---

## Checklist: Phase 2

- [ ] SubjectsModule created with all endpoints
- [ ] EquipmentModule/logic created
- [ ] RecordingSetupModule created
- [ ] MusicModule created
- [ ] LoggerService created
- [ ] RequestLoggerMiddleware created
- [ ] All DTOs created
- [ ] All services tested (unit tests)
- [ ] All controllers tested (E2E tests)
- [ ] Old backend code deleted
- [ ] app.module.ts updated
- [ ] `npm run lint:fix` passes
- [ ] Backend builds without errors
- [ ] Backend starts successfully
- [ ] All new endpoints functional

---

## Next Phase

→ **Phase 3**: [PHASE_3_FRONTEND_INFRA.md](PHASE_3_FRONTEND_INFRA.md)

Frontend types, API client, hooks, and dev console.

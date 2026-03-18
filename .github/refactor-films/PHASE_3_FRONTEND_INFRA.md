# Phase 3: Frontend Infrastructure (Week 4)

**Goal:** Create types, API client, hooks, and dev console  
**Duration:** 1 week  
**Dependency:** Phase 2 (Backend Services)  
**Next:** Phase 4 (Film Management UI)

---

## Overview

Week 4 focuses on frontend infrastructure: types, API clients, logging, and custom hooks.

Creates:
1. TypeScript types for all new entities
2. API client layer with functions for each endpoint
3. Frontend logging with API monitoring
4. Dev console component for real-time debugging
5. Custom React hooks for data management

---

## Task Breakdown

### 3.1 TypeScript Types (~300 lines)

**Files:**
- `src/types/film.ts` (~80 lines)
- `src/types/subjects.ts` (~60 lines)
- `src/types/recording-setup.ts` (~100 lines)
- `src/types/music.ts` (~50 lines)
- `src/types/equipment.ts` (~50 lines)
- `src/types/index.ts` - Export all

**Includes:**
- Film, FilmTimelineTrack
- FilmSubject, SubjectTemplate
- MomentRecordingSetup, CameraSubjectAssignment
- SceneMusic, MomentMusic
- All enums

---

### 3.2 API Client (~400 lines)

**Files:**
- `src/lib/api.ts` - Update with new endpoints (~400 lines)
- `src/lib/api/subjects.api.ts` (~100 lines)
- `src/lib/api/recording-setup.api.ts` (~100 lines)
- `src/lib/api/music.api.ts` (~80 lines)
- `src/lib/api/equipment.api.ts` (~80 lines)

**Functions:**
- Film CRUD + equipment config
- Subject management
- Recording setup management
- Music assignment
- Scene templates

---

### 3.3 Logging Setup (~280 lines)

**Files:**
- `src/lib/logging/api-logger.ts` (~120 lines)
- `src/lib/logging/request-interceptor.ts` (~100 lines)
- `src/lib/logging/utils.ts` (~80 lines)

**Features:**
- Log all fetch calls
- Track request/response
- Time performance
- Capture errors

---

### 3.4 Dev Console Component (~280 lines)

**Files:**
- `src/components/dev-console/DevConsole.tsx` (~200 lines)
- `src/components/dev-console/DevConsole.module.css` (~80 lines)
- `src/lib/debug/dev-console-store.ts` (~100 lines)
- Update `src/app/layout.tsx` to include DevConsole

**Features:**
- Collapsible bottom-right panel
- Shows all API calls
- Filter: All / Success / Errors
- Expandable request/response JSON
- Color-coded status
- Duration tracking
- Development-only (not in production)

---

### 3.5 Custom Hooks (~450 lines)

**Files:**
- `src/hooks/useFilms.ts` (~120 lines)
- `src/hooks/useFilmSubjects.ts` (~120 lines)
- `src/hooks/useRecordingSetup.ts` (~150 lines)
- `src/hooks/useSceneTemplates.ts` (~100 lines)
- `src/hooks/useMusic.ts` (~100 lines)

**Features:**
- Load/manage films
- Load/manage subjects
- CRUD recording setups
- Scene template browsing
- Music assignment

---

### 3.6 Old Code Cleanup (~10 files)

**Delete:**
- `src/components/FilmCoverage/` folder
- `src/components/SceneCoverage/` folder
- `src/components/LocalSceneEditor/` folder
- `src/components/MomentsList/` folder
- `src/components/ComponentLibrary/` folder
- `src/components/TimelineLayer/` folder
- `src/types/coverage.ts`
- `src/types/sceneComponent.ts`
- `src/types/timelineLayer.ts`
- Old hooks (useCoverage.ts, useLocalScene.ts)

---

## Checklist: Phase 3

- [ ] All type files created
- [ ] Types compile without errors
- [ ] API client functions created (~500 lines)
- [ ] Test all API calls against backend
- [ ] ApiLogger created
- [ ] Request interceptor working
- [ ] DevConsole component created
- [ ] DevConsole integrated in layout
- [ ] All custom hooks created
- [ ] Hooks have logging
- [ ] Old frontend code deleted
- [ ] `npm run lint:fix` passes
- [ ] Frontend builds without errors
- [ ] DevConsole visible in dev mode

---

## Next Phase

→ **Phase 4**: [PHASE_4_FILM_UI.md](PHASE_4_FILM_UI.md)

Film creation wizard and equipment configuration UI.

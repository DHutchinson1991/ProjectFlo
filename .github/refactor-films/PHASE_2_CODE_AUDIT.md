# Phase 2 Code Audit - Existing Backend Modules

**Date:** 2026-01-30  
**Purpose:** Determine what exists, what to keep, what to rebuild

---

## Audit Results

### ✅ 1. Films Module - `src/content/films/`

**Status:** **KEEP & UPDATE**

**What exists:**
- ✅ `films.module.ts` - Already has services structure
- ✅ `films.service.ts` - Core film logic
- ✅ `films.controller.ts` - HTTP endpoints
- ✅ `dto/` folder - Has DTOs
- ✅ `services/film-equipment.service.ts` - Equipment configuration logic
- ✅ `services/film-timeline-tracks.service.ts` - Track management logic
- ✅ `services/film-scenes-management.service.ts` - Scene management logic

**Models Used (legacy):**
- Likely using old `film_library`, `film_assigned_scenes`, `coverage` models

**Action Required:**
- 🔄 **UPDATE** all services to use refactor v2 models:
  - `Film` (instead of `film_library`)
  - `FilmTimelineTrack` (instead of `coverage`?)
  - `FilmScene` (instead of `film_assigned_scenes`)
  - `FilmSubject` (new)
- 🔄 **UPDATE** DTOs to match new schema
- ➕ **ADD** new endpoints for refactor v2 features
- ✅ **KEEP** the service architecture (it's clean)

**Complexity:** Medium (existing structure is good, just needs model updates)

---

### ⚠️ 2. Subjects Module - `src/content/subjects/`

**Status:** **REBUILD** (legacy code exists)

**What exists:**
- ❌ `subjects.service.ts` - Uses legacy `subjectsLibrary` model (lines 1-50 reviewed)
- ❌ DTOs reference old schema (`CreateSubjectDto`, `AssignSubjectToSceneDto`)

**Models Used (legacy):**
- `subjectsLibrary` (old table, not in refactor v2)

**Action Required:**
- ❌ **DELETE** existing service code (incompatible with refactor v2)
- ➕ **CREATE** new service for refactor v2:
  - Use `SubjectTemplate` (global library)
  - Use `FilmSubject` (film-specific instances)
- ➕ **CREATE** new DTOs for refactor v2
- ➕ **CREATE** new endpoints

**Complexity:** Medium (clean slate rebuild, but straightforward)

---

### ⚠️ 3. Scenes Module - `src/content/scenes/`

**Status:** **DELETE & REBUILD** (legacy code exists)

**What exists:**
- ❌ Legacy scenes module (likely uses old `scenes_library`, `film_assigned_scenes`)

**Models Used (legacy):**
- Probably `scenes_library`, `film_assigned_scenes`, `scene_coverage`

**Action Required:**
- ❌ **DELETE** entire `src/content/scenes/` folder
- ➕ **CREATE** new module for refactor v2:
  - Use `SceneTemplate` (global library)
  - Use `FilmScene` (film-specific instances)
  - Use `SceneMoment` (moments within scenes)

**Complexity:** Medium (clean slate, but well-defined requirements)

---

### ⚠️ 4. Moments Module - `src/moments/`

**Status:** **MOVE & REBUILD** (legacy code exists)

**What exists:**
- ❌ `moments.service.ts` - Uses legacy models:
  - `momentTemplates` (old table)
  - `scene_moments` (old table)
  - `scene_moment_music` (old table)
- ❌ Located at **root level** `src/moments/` (should be in `src/content/moments/`)

**Models Used (legacy):**
- `momentTemplates` (not in refactor v2, we have `SceneMomentTemplate`)
- `scene_moments` (not in refactor v2, we have `SceneMoment`)
- `scene_moment_music` (not in refactor v2, we have `MomentMusic`)

**Action Required:**
- ❌ **DELETE** existing `src/moments/` folder (root level)
- ➕ **CREATE** new `src/content/moments/` folder
- ➕ **CREATE** new module for refactor v2:
  - Use `SceneMoment` (moments)
  - Use `MomentRecordingSetup` (recording config)
  - Use `CameraSubjectAssignment` (camera-subject assignments)
  - Use `MomentMusic` (music assignments)
- ➕ **CREATE** `services/recording-setup.service.ts` (new feature)

**Complexity:** High (most complex module, handles recording setups)

---

### ✅ 5. Music Module - `src/music/`

**Status:** **CHECK THEN REBUILD** (exists, but unknown purpose)

**What exists:**
- ⚠️ `music.module.ts` - Unknown if legacy or refactor v2
- ⚠️ `music.service.ts` - Need to check what models it uses
- ⚠️ `music.controller.ts` - Need to check endpoints

**Action Required:**
- 🔍 **REVIEW** existing code to determine if it's:
  - Music library management (brand-level music templates) ← Keep
  - Music assignment to scenes/moments ← Rebuild for refactor v2

**If it's music library:** Keep it, we need that
**If it's music assignment:** Rebuild for refactor v2 (SceneMusic, MomentMusic)

**Complexity:** TBD (need to review code)

---

### ❌ 6. Coverage Module - `src/content/coverage/`

**Status:** **DELETE** (legacy, replaced by FilmTimelineTrack)

**What exists:**
- ❌ Legacy coverage module

**Models Used (legacy):**
- `coverage`, `scene_coverage` (deleted in Phase 1)

**Action Required:**
- ❌ **DELETE** entire `src/content/coverage/` folder

**Complexity:** Low (just delete)

---

### ❓ 7. Common/Logging - `src/common/logging/`

**Status:** **DOES NOT EXIST**

**Action Required:**
- ➕ **CREATE** new logging infrastructure:
  - `common/logging/logger.service.ts`
  - `common/logging/request-logger.middleware.ts`

**Complexity:** Low (standard NestJS pattern)

---

## Summary Table

| Module | Location | Status | Action | Complexity | Lines |
|--------|----------|--------|--------|------------|-------|
| **Films** | `content/films/` | ✅ Keep | 🔄 Update for v2 models | Medium | ~400 |
| **Subjects** | `content/subjects/` | ❌ Legacy | ❌ Delete & ➕ Rebuild | Medium | ~370 |
| **Scenes** | `content/scenes/` | ❌ Legacy | ❌ Delete & ➕ Rebuild | Medium | ~370 |
| **Moments** | `moments/` (root) | ❌ Legacy | ❌ Delete & ➕ Rebuild | High | ~500 |
| **Music** | `music/` | ⚠️ Unknown | 🔍 Review first | TBD | ~300 |
| **Coverage** | `content/coverage/` | ❌ Legacy | ❌ Delete | Low | 0 |
| **Logging** | `common/logging/` | ❌ Missing | ➕ Create | Low | ~180 |

---

## Implementation Priority

### Phase 2A: Foundation (Week 1)
1. **Day 1:** Create logging infrastructure
2. **Day 2:** Update Films module for refactor v2
3. **Day 3:** Rebuild Subjects module
4. **Day 4:** Review Music module, decide keep/rebuild
5. **Day 5:** Testing & verification

### Phase 2B: Advanced Features (Week 2)
1. **Day 6:** Rebuild Scenes module
2. **Day 7-8:** Rebuild Moments + Recording Setup module
3. **Day 9:** Rebuild/Update Music module (assignments)
4. **Day 10:** Integration testing

### Phase 2C: Cleanup
1. Delete legacy modules: `content/coverage/`, `content/scenes/`, `moments/`
2. Update `app.module.ts`
3. Final verification

---

## Risks & Mitigation

### 🔴 High Risk: Breaking Changes
- **Risk:** Deleting legacy modules breaks existing frontend
- **Mitigation:** 
  - Don't delete until Phase 3+ confirms new endpoints work
  - Keep legacy endpoints temporarily with deprecation warnings
  - Use API versioning if needed (`/api/v2/films`)

### 🟡 Medium Risk: Music Module Unknown
- **Risk:** Music module may contain critical logic we need
- **Mitigation:**
  - Review music module code FIRST before any changes
  - If it's music library (brand-level), keep it
  - If it's assignments, rebuild for refactor v2

### 🟢 Low Risk: Films Module Structure
- **Risk:** Low, structure is already good
- **Mitigation:**
  - Update incrementally, one service at a time
  - Keep existing endpoint signatures where possible

---

## Next Actions

1. ✅ Review music module code to determine keep vs rebuild
2. ⏳ Start with logging infrastructure (Day 1)
3. ⏳ Update Films module services (Day 2)
4. ⏳ Create detailed file-by-file implementation plan
5. ⏳ Set up testing strategy for each module

---

**Conclusion:** We have a solid foundation. The Films module structure is good, we just need to update it for refactor v2 models. Other modules (Subjects, Scenes, Moments) need rebuilding from scratch, but requirements are clear. Ready to begin implementation!

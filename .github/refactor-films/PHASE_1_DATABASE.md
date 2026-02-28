# Phase 1: Database Foundation (Week 1)

**Goal:** Create new database schema and perform clean data migration  
**Duration:** 1 week  
**Dependency:** None  
**Next:** Phase 2 (Backend Services)

---

## Overview

Week 1 focuses entirely on the database. We'll:
1. Create Prisma migration with 10 new tables
2. Seed global subject templates and scene templates
3. Clean all old data (Coverage, LocalScene, Moment records)
4. Verify clean slate before moving to backend

By end of week, the database will be ready for new backend services.

**Reference:** [SEEDING_STRATEGY.md](SEEDING_STRATEGY.md) | [CLEANUP_STRATEGY.md](CLEANUP_STRATEGY.md)

---

## Task 1: Create Prisma Migration

### 1.1 Create Migration File

```bash
cd packages/backend
npx prisma migrate dev --name "refactor_films_new_schema"
```

This creates: `prisma/migrations/[timestamp]_refactor_films_new_schema/`

### 1.2 Add New Tables to schema.prisma

Using the Prisma schema from 00_ARCHITECTURE_OVERVIEW.md, add all these models:

**Equipment & Films**
- Film
- FilmTimelineTrack
- TrackType enum

**Subjects**
- SubjectTemplate
- FilmSubject
- SubjectCategory enum

**Scenes & Templates**
- SceneTemplate
- SceneTemplateSuggestedSubject
- FilmScene
- SceneMusic
- SceneType enum

**Moments & Recording**
- SceneMomentTemplate
- SceneMoment
- MomentRecordingSetup
- CameraSubjectAssignment
- CameraSubjects (many-to-many)

**Music**
- MomentMusic
- MusicType enum

### 1.3 Verify Migration

```bash
# Check syntax
npx prisma validate

# Test migration
npx prisma migrate dev
```

### 1.4 Generate Prisma Client

```bash
npx prisma generate
```

**Checklist for Task 1:**
- [ ] All 10 models added to schema.prisma
- [ ] All 4 enums defined
- [ ] All relationships correct
- [ ] `npx prisma validate` passes
- [ ] Migration executes without errors
- [ ] `npx prisma generate` completes

---

## Task 2: Seed Global Templates

### 2.1 Create Subject Templates Seed

**File:** `prisma/seeds/moonrise-00-subject-templates.seed.ts` (~100 lines)

Seed 24 global subjects in 3 categories:
- PEOPLE: Bride, Groom, Officiant, Maid of Honor, Best Man, etc. (12 subjects)
- OBJECTS: Rings, Bouquet, Cake, Decorations, Dress Details, etc. (7 subjects)
- LOCATIONS: Venue Exterior, Ceremony Space, Reception Hall, etc. (5 subjects)

Each with: name, category, is_system=true

### 2.2 Create Scene Templates Seed

**File:** `prisma/seeds/moonrise-01-scene-templates.seed.ts` (~150 lines)

Seed 3 reusable scenes:
- **Ceremony** (5 moments: Processional, Vows, Ring Exchange, First Kiss, Recessional)
- **Reception** (6 moments: Grand Entrance, First Dance, Parent Dances, Toasts, Cake, Bouquet)
- **Getting Ready** (3 moments: Bridal, Groom, Details)

Each moment has: name, estimated_duration, order_index

Each scene has suggested subjects (e.g., Ceremony suggests: Bride, Groom, Officiant, Rings)

### 2.3 Register Seeds in Runner

**File:** `prisma/seeds/index.ts`

Add the new seed files to the existing runner:
- `moonrise-00-subject-templates.seed.ts`
- `moonrise-01-scene-templates.seed.ts`

Execution command:
```bash
npx prisma db seed
```

### 2.4 Verify Seed Command

Confirm backend `package.json` has:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seeds/index.ts"
  }
}
```

### 2.5 Verify in Prisma Studio

```bash
npx prisma studio
```

Check:
- [ ] 24 SubjectTemplates exist
- [ ] 3 SceneTemplates with moments
- [ ] Suggested subjects linked correctly
- [ ] All data visible in Studio

**Checklist for Task 2:**
- [ ] moonrise-00-subject-templates.seed.ts created (24 subjects)
- [ ] moonrise-01-scene-templates.seed.ts created (3 scenes with moments)
- [ ] seeds registered in index.ts
- [ ] package.json seed command verified
- [ ] `npx prisma db seed` runs successfully
- [ ] Data verified in Prisma Studio

---

## Task 3: Clean Old Data

### 3.1 Create Cleanup Migration

**File:** `prisma/migrations/[timestamp]_cleanup_old_data/migration.sql` (~50 lines)

```sql
-- Delete old data while preserving schema (for safety, we'll delete in phases)

-- Step 1: Delete all old Coverage records
DELETE FROM "Coverage" WHERE "film_id" IS NOT NULL;

-- Step 2: Delete all old SceneCoverage records
DELETE FROM "SceneCoverage" WHERE "local_scene_id" IS NOT NULL;

-- Step 3: Delete all old LocalSceneComponent records
DELETE FROM "LocalSceneComponent" WHERE "local_scene_id" IS NOT NULL;

-- Step 4: Delete all old Moment records
DELETE FROM "Moment" WHERE "local_scene_id" IS NOT NULL;

-- Step 5: Delete all old LocalScene records
DELETE FROM "LocalScene" WHERE "film_id" IS NOT NULL;

-- Step 6: Delete all old Film records
DELETE FROM "Film" WHERE "id" IS NOT NULL;

-- Step 7: Delete old TimelineLayer records
DELETE FROM "TimelineLayer" WHERE "id" IS NOT NULL;

-- Note: DO NOT delete from Brand, Client, Project, Equipment, etc.
-- Only clean film-related data
```

### 3.2 Execute Cleanup

```bash
npx prisma migrate dev --name "cleanup_old_data"
```

**Checklist for Task 3:**
- [ ] Cleanup migration SQL created
- [ ] Migration executes without errors
- [ ] No data loss in other tables
- [ ] Old Coverage table is empty
- [ ] Old LocalScene table is empty
- [ ] Old Moment table is empty
- [ ] Old Film table is empty

---

## Task 4: Verify Clean Slate

### 4.1 Create Verification Script

**File:** `verify-clean-slate.js` (~80 lines)

Script that checks all old tables have 0 records:
- coverage
- scene_coverage
- film_local_scene_media_components
- scene_moments
- film_local_scenes
- film_assigned_scenes
- film_library

Also verify new tables:
- subject_templates: expect 24
- scene_templates: expect 3
- films: expect 0
- film_timeline_tracks_v2: expect 0
- film_subjects: expect 0
- film_scenes: expect 0
- film_scene_moments: expect 0

Note: timeline layers are system-seeded and may be non-zero.

### 4.2 Run Verification

```bash
node verify-clean-slate.js
```

Expected output:
```
✅ coverage: 0 records (expected: 0)
✅ scene_coverage: 0 records (expected: 0)
✅ film_local_scenes: 0 records (expected: 0)
✅ scene_moments: 0 records (expected: 0)
✅ subject_templates: 24 records ✅
✅ scene_templates: 3 records ✅

✅ Clean slate verified! Ready for Phase 2.
```

**Checklist for Task 4:**
- [ ] verify-clean-slate.js created
- [ ] Script runs without errors
- [ ] All old tables show 0 records
- [ ] New tables exist with correct counts
- [ ] Output clearly shows success/failure

---

## Task 5: Demo Data (Optional, for Testing)

### 5.1 Create Demo Film Structure

**File:** `prisma/seeds/moonrise-02-demo-film-structure.seed.ts` (~200 lines)

Creates one complete demo film:
- Film: "Smith Wedding"
- Equipment: 3 cameras, 2 audio, 1 graphics, 1 music track
- Scene: Ceremony (from template)
- Moments: 5 moments from template

### 5.2 Create Demo Subjects

**File:** `prisma/seeds/moonrise-03-demo-subjects.seed.ts` (~100 lines)

Subjects for demo film:
- Bride (template)
- Groom (template)
- Officiant (template)
- Rings (template)
- Bride's Dog "Max" (custom)

### 5.3 Create Demo Recording Setups

**File:** `prisma/seeds/moonrise-04-demo-recording-setups.seed.ts` (~150 lines)

Recording setup for each moment:
- **Vows:** Camera 1→Bride, Camera 2→Groom, Audio 1
- **Ring Exchange:** Camera 3→Bride+Groom, Camera 1→Rings, Audio 2
- **First Kiss:** Camera 2→Bride+Groom, Camera 3→Bride+Groom, Audio 1+2, Graphics enabled

### 5.4 Create Demo Music

**File:** `prisma/seeds/moonrise-05-demo-music.seed.ts` (~100 lines)

- Scene music: "Classical Ceremony Background"
- Moment overrides for Vows, Ring Exchange, First Kiss

### 5.5 Run Demo Seeding

```bash
SEED_DEMO_DATA=true npx prisma db seed
```

Or create npm script:
```json
{
  "scripts": {
    "prisma:seed": "prisma db seed",
    "prisma:seed:demo": "SEED_DEMO_DATA=true prisma db seed"
  }
}
```

**Checklist for Task 5:**
- [ ] moonrise-02-demo-film-structure.seed.ts created
- [ ] moonrise-03-demo-subjects.seed.ts created
- [ ] moonrise-04-demo-recording-setups.seed.ts created
- [ ] moonrise-05-demo-music.seed.ts created
- [ ] `SEED_DEMO_DATA=true npx prisma db seed` runs
- [ ] Demo data verified in Prisma Studio

---

## Task 6: Final Verification

### 6.1 Database Health Check

```bash
# Start backend
npm run start:dev

# In another terminal, verify API works
curl http://localhost:3002/health

# Verify Prisma client is correct
npx prisma generate
```

### 6.2 Backend Test

```bash
cd packages/backend
npm test -- --testPathPattern="database"
```

### 6.3 Create Completion Report

**File:** `PHASE_1_VERIFICATION.md`

Document:
- Migration timestamp
- Number of tables created: 10
- Number of enums created: 4
- Subject templates seeded: 24
- Scene templates seeded: 3
- Old data cleaned: 7 tables
- Demo data status: complete/skipped
- Any issues encountered
- Verification screenshots

**Checklist for Task 6:**
- [ ] Backend starts without database errors
- [ ] Prisma client generates without warnings
- [ ] Health check endpoint responds
- [ ] Prisma Studio shows all data correctly
- [ ] PHASE_1_VERIFICATION.md written
- [ ] All team members can run `pnpm dev`

---

## Deprecate Old Moonrise Seeds

Legacy Moonrise seed modules for subjects/scenes/moments/films/coverage are replaced by the new Moonrise template seeds.
Moonrise complete setup stays in the seed runner, but those legacy modules are removed.

Removed files:
- moonrise-coverage-library.ts
- moonrise-scenes-setup.ts
- moonrise-film-library.ts
- moonrise-subjects-library.ts
- moonrise-moment-templates.ts

Checklist:
- [ ] Keep moonrise-complete-setup in `prisma/seeds/index.ts`
- [ ] Remove legacy Moonrise seed files listed above
- [ ] Ensure moonrise-complete-setup no longer imports legacy modules

---

## Summary: Phase 1 Checklist

### Create Prisma Migration
- [ ] Schema validation passes
- [ ] Migration executes
- [ ] 10 models created
- [ ] 4 enums created
- [ ] Prisma client generated

### Seed Templates
- [ ] 24 subject templates seeded
- [ ] 3 scene templates seeded
- [ ] 24 suggested subjects linked
- [ ] Templates visible in Prisma Studio

### Clean Old Data
- [ ] Cleanup migration created
- [ ] Old data deleted (7 tables)
- [ ] Verify-clean-slate.js passes
- [ ] No data in old tables

### Demo Data
- [ ] Demo film structure created
- [ ] Demo subjects created
- [ ] Demo recording setups created
- [ ] Demo music created
- [ ] Demo data seeded (optional)

### Final Verification
- [ ] Backend starts clean
- [ ] Prisma client correct
- [ ] PHASE_1_VERIFICATION.md complete
- [ ] Team ready for Phase 2

---

## Next Phase

→ **Phase 2**: [PHASE_2_BACKEND.md](PHASE_2_BACKEND.md)

Backend services for subjects, equipment, recording setups, and music.

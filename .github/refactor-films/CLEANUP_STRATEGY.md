# Cleanup Strategy

**Complete plan for removing old data and obsolete code**

---

## Part 1: Data Cleanup (Database)

### Old Tables to Empty

During Phase 1, we delete all records from:

```sql
Coverage
SceneCoverage
LocalSceneComponent
Moment
LocalScene
Film
TimelineLayer
```

**Migration File:** `prisma/migrations/[timestamp]_cleanup_old_data/migration.sql`

```sql
-- Delete all old Coverage records
DELETE FROM "Coverage" WHERE "film_id" IS NOT NULL;

-- Delete all old SceneCoverage records
DELETE FROM "SceneCoverage" WHERE "local_scene_id" IS NOT NULL;

-- Delete all old LocalSceneComponent records
DELETE FROM "LocalSceneComponent" WHERE "local_scene_id" IS NOT NULL;

-- Delete all old Moment records
DELETE FROM "Moment" WHERE "local_scene_id" IS NOT NULL;

-- Delete all old LocalScene records
DELETE FROM "LocalScene" WHERE "film_id" IS NOT NULL;

-- Delete all old Film records
DELETE FROM "Film" WHERE "id" IS NOT NULL;

-- Delete old TimelineLayer records
DELETE FROM "TimelineLayer" WHERE "id" IS NOT NULL;
```

**Verification Script:** `packages/backend/verify-clean-slate.js`

Run after cleanup to confirm all old tables are empty.

---

## Part 2: Code Cleanup (Backend)

### Old Folders to Delete

Remove entire directories:

```
packages/backend/src/
├── moments/                    ❌ DELETE
│   └── Everything in this folder
├── components/                 ❌ DELETE
│   └── Everything in this folder
├── timeline/                   ❌ DELETE
│   └── Everything in this folder
└── scenes/                     ❌ DELETE
    └── Everything in this folder (if exists)
```

### What These Folders Contained (for reference)

**moments/** - Old moment management
- moments.module.ts
- moments.service.ts
- moments.controller.ts
- entities/
- dto/

**components/** - Old media component system
- components.module.ts
- components.service.ts
- components.controller.ts
- entities/
- dto/

**timeline/** - Old timeline layer management
- timeline.module.ts
- timeline.service.ts
- timeline.controller.ts
- dto/

**scenes/** - Old local scene management (if exists)
- scenes.module.ts
- scenes.service.ts
- scenes.controller.ts
- entities/
- dto/

### Prisma Schema Cleanup

After data is deleted, remove these models from `prisma/schema.prisma`:

```prisma
❌ DELETE model Coverage { ... }
❌ DELETE model SceneCoverage { ... }
❌ DELETE model LocalSceneComponent { ... }
❌ DELETE model TimelineLayer { ... }
❌ DELETE model LocalScene { ... }
```

**KEEP these models:**
- Film (being rewritten)
- Moment (being rewritten)
- Brand
- Client
- Project
- Equipment
- etc.

### app.module.ts Cleanup

Remove old module imports:

```typescript
// ❌ REMOVE these imports
import { MomentsModule } from './moments/moments.module';
import { ComponentsModule } from './components/components.module';
import { TimelineModule } from './timeline/timeline.module';
import { ScenesModule } from './scenes/scenes.module';

// ❌ REMOVE these from imports array
@Module({
  imports: [
    MomentsModule,      // ❌ REMOVE
    ComponentsModule,   // ❌ REMOVE
    TimelineModule,     // ❌ REMOVE
    ScenesModule,       // ❌ REMOVE
    // Keep other imports
  ],
})
```

### Test Files Cleanup

Remove old test files:

```
packages/backend/test/
├── moments.e2e-spec.ts         ❌ DELETE
├── components.e2e-spec.ts      ❌ DELETE
├── timeline.e2e-spec.ts        ❌ DELETE
└── scenes.e2e-spec.ts          ❌ DELETE
```

### Deletion Commands (Bash)

```bash
cd packages/backend

# Delete old backend code
rm -rf src/moments
rm -rf src/components
rm -rf src/timeline
rm -rf src/scenes

# Verify they're gone
ls src/
# moments/, components/, timeline/, scenes/ should NOT appear
```

---

## Part 3: Code Cleanup (Frontend)

### Old Components to Delete

Remove entire component folders:

```
packages/frontend/src/components/
├── FilmCoverage/               ❌ DELETE
│   └── FilmCoverage.tsx, .module.css, .test.ts
├── SceneCoverage/              ❌ DELETE
│   └── SceneCoverage.tsx, .module.css, .test.ts
├── LocalSceneEditor/           ❌ DELETE
│   └── LocalSceneEditor.tsx, .module.css, .test.ts
├── MomentsList/                ❌ DELETE
│   └── MomentsList.tsx, .module.css, .test.ts
├── ComponentLibrary/           ❌ DELETE
│   └── ComponentLibrary.tsx, .module.css, .test.ts
└── TimelineLayer/              ❌ DELETE
    └── TimelineLayer.tsx, .module.css, .test.ts
```

### Old Type Files to Delete

```
packages/frontend/src/types/
├── coverage.ts                 ❌ DELETE
├── sceneComponent.ts           ❌ DELETE
└── timelineLayer.ts            ❌ DELETE
```

### Old Hooks to Delete

```
packages/frontend/src/hooks/
├── useCoverage.ts              ❌ DELETE
├── useLocalScene.ts            ❌ DELETE
└── useMoment.ts                ❌ DELETE (replaced with new version)
```

### Deletion Commands (Bash)

```bash
cd packages/frontend

# Delete old components
rm -rf src/components/FilmCoverage
rm -rf src/components/SceneCoverage
rm -rf src/components/LocalSceneEditor
rm -rf src/components/MomentsList
rm -rf src/components/ComponentLibrary
rm -rf src/components/TimelineLayer

# Delete old types
rm src/types/coverage.ts
rm src/types/sceneComponent.ts
rm src/types/timelineLayer.ts

# Delete old hooks
rm src/hooks/useCoverage.ts
rm src/hooks/useLocalScene.ts
rm src/hooks/useMoment.ts

# Verify
ls src/components/ | grep -E "(FilmCoverage|SceneCoverage|LocalSceneEditor|MomentsList|ComponentLibrary|TimelineLayer)"
# Should have no results (command complete with no output)
```

---

## Part 4: Verification & Cleanup

### Run Linting to Catch Remaining References

```bash
# Backend
cd packages/backend
npm run lint

# Errors? Fix import statements that reference deleted modules

# Frontend
cd packages/frontend
npm run lint

# Errors? Fix import statements that reference deleted types/components/hooks
```

### Verify No Dead Code

```bash
# Search for imports of deleted modules
cd packages/backend
grep -r "from.*moments" src/
grep -r "from.*components" src/
grep -r "from.*timeline" src/
grep -r "from.*scenes" src/

# Should have no results

# Frontend
cd ../frontend
grep -r "FilmCoverage" src/
grep -r "SceneCoverage" src/
grep -r "useCoverage" src/
grep -r "useLocalScene" src/

# Should have no results
```

### Rebuild & Test

```bash
# Backend
cd packages/backend
npm run build
npm test

# Frontend
cd ../frontend
npm run build
npm test
```

No errors = clean deletion complete!

---

## Part 5: Execution Timeline

### Phase 1 (Week 1)
- [ ] Create backup of old data
- [ ] Create cleanup migration SQL
- [ ] Execute cleanup migration
- [ ] Verify clean-slate script passes

### Phase 2 (Weeks 2-3)
- [ ] Delete backend folders (moments, components, timeline, scenes)
- [ ] Update app.module.ts
- [ ] Remove old module imports
- [ ] Update Prisma schema
- [ ] Run `npm run lint:fix`
- [ ] Verify no import errors
- [ ] Test backend builds and starts

### Phase 3 (Week 4)
- [ ] Delete frontend components
- [ ] Delete frontend types
- [ ] Delete frontend hooks
- [ ] Run `npm run lint:fix`
- [ ] Verify no import errors
- [ ] Test frontend builds without warnings

### Phase 10 (Week 10 - Final Polish)
- [ ] Remove all TODO comments about cleanup
- [ ] Verify no dead code remains
- [ ] Final linting pass
- [ ] Update documentation to reflect removals

---

## Rollback Procedure (If Needed)

If something goes wrong, you can recover:

```bash
# 1. Restore from backup (created in Phase 0)
cd packages/backend
npx prisma db push < backup-current-schema.sql

# 2. Or reset to last good migration
npx prisma migrate resolve --rolled-back [migration_timestamp]
npx prisma migrate deploy

# 3. Restore deleted code from git
git checkout HEAD~1 -- packages/backend/src/moments
git checkout HEAD~1 -- packages/backend/src/components
# etc.
```

---

## Verification Checklist

### After Data Cleanup
- [ ] All old tables are empty (0 records)
- [ ] New tables exist with data
- [ ] verify-clean-slate.js passes
- [ ] Database file size is smaller

### After Backend Code Cleanup
- [ ] No old folders exist
- [ ] app.module.ts doesn't import old modules
- [ ] Prisma schema has old models removed
- [ ] `npm run lint:fix` returns no errors
- [ ] Backend builds successfully
- [ ] Backend starts without errors

### After Frontend Code Cleanup
- [ ] No old component folders exist
- [ ] No old type files exist
- [ ] No old hook files exist
- [ ] `npm run lint:fix` returns no errors
- [ ] Frontend builds successfully
- [ ] Frontend runs without warnings

### After Final Verification
- [ ] Full test suite passes
- [ ] No broken imports anywhere
- [ ] Documentation updated
- [ ] Team confirms working state
- [ ] Ready for Phase 2 backend work

---

## See Also

- [PHASE_1_DATABASE.md](PHASE_1_DATABASE.md) - Database setup including cleanup
- [SEEDING_STRATEGY.md](SEEDING_STRATEGY.md) - Seeding templates and demo data

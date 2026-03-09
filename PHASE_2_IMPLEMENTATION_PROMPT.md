# Phase 2: Unified Schedule Instance — Implementation Prompt

> **Supersedes** the earlier project-only Phase 2 plan.  
> **Builds on** Phase 1 (schema, clone service, snapshot service, 8 endpoints).  
> **Architecture:** Option C — single table set, polymorphic ownership (`inquiry` OR `project`).

---

## Goal

Refactor the Phase 1 `Project*` snapshot tables into **dual-owner** tables that can be owned by **either** an inquiry **or** a project. This lets the package schedule clone happen the moment a lead selects a package (during needs assessment or on the inquiry detail page), gives the videographer an editable schedule view throughout the entire sales pipeline, and seamlessly transfers that data to the project on booking — no second clone needed.

### Where the Package Editor Surfaces

| Stage | Location | What the User Sees | Editable? |
|-------|----------|-------------------|-----------|
| **Needs Assessment** | Needs assessment form sidebar | Package selection radio buttons (already exists) | Selection only |
| **Inquiry Detail** | New "Package Schedule" section on the inquiry page | Full schedule view: event days, activities, crew, subjects, locations | **Yes** — tailored for this lead |
| **Proposal / Estimate** | Can reference schedule data from the inquiry clone | Read-only data source | No |
| **Project Detail** | New "Package" tab (original Phase 2 plan) | Same schedule view — data carried forward from inquiry | **Yes** |

---

## What Phase 1 Already Built (Context)

Everything below exists and is working. Phase 2 refactors parts of it.

### Existing Backend

1. **`ProjectPackageCloneService`** (`packages/backend/src/projects/project-package-clone.service.ts`, 457 lines)
   - Method: `clonePackageToProject(projectId, packageId, tx?)` — clones 12 entity types
   - Called inside `InquiriesService.convertInquiryToProject()` when `selected_package_id` is set

2. **`ProjectPackageSnapshotService`** (`packages/backend/src/projects/project-package-snapshot.service.ts`, 339 lines)
   - 7 read methods: `getSnapshotSummary`, `getEventDays`, `getActivities`, `getOperators`, `getSubjects`, `getLocationSlots`, `getFilms`, `getActivityMoments`
   - All queries filter by `project_id`

3. **8 REST endpoints** on `ProjectsController`:
   - `GET /projects/:id/package-snapshot` (summary)
   - `GET /projects/:id/package-snapshot/event-days`
   - `GET /projects/:id/package-snapshot/activities`
   - `GET /projects/:id/package-snapshot/operators`
   - `GET /projects/:id/package-snapshot/subjects`
   - `GET /projects/:id/package-snapshot/locations`
   - `GET /projects/:id/package-snapshot/films`
   - `GET /projects/:id/package-snapshot/activities/:activityId/moments`

4. **Schema** (migrated):
   - `projects` model: `source_package_id Int?`, `package_contents_snapshot Json?`
   - 12 models with `project_id Int` (required): `ProjectEventDay`, `ProjectActivity`, `ProjectActivityMoment`, `ProjectEventDaySubject`, `ProjectLocationSlot`, `ProjectDayOperator`, `ProjectDayOperatorEquipment`, `ProjectOperatorActivityAssignment`, `ProjectSubjectActivityAssignment`, `ProjectLocationActivityAssignment`, `ProjectFilm`, `ProjectFilmSceneSchedule`

### Existing Frontend

- **Inquiry detail page** (`packages/frontend/src/app/(studio)/sales/inquiries/[id]/page.tsx`, 3144 lines): 3-column layout with workflow cards: NeedsAssessmentCard, EstimatesCard, CallsCard, ProposalsCard, ConsultationCard, QuotesCard, ContractsCard, ClientApprovalCard, ActivityLogCard. No package schedule section yet.
- **NeedsAssessmentCard**: Already has `selected_package_id` dropdown + `availablePackages` loaded from `api.servicePackages.getAll(brandId)`. Shows package **name** only.
- **Project detail page** (`packages/frontend/src/app/(studio)/projects/[id]/page.tsx`, 493 lines): 6 phase tabs (Overview → Delivery). No Package tab yet.
- **Package editor** (`packages/frontend/src/app/(studio)/designer/packages/[id]/page.tsx`): Thin container with shared components. The shared schedule cards (PackageScheduleCard, ActivitiesCard, CrewCard, SubjectsCard, LocationsCard) make direct `api.schedule.package*` calls internally.

### Existing Pipeline

```
Needs Assessment Form  ──→  Inquiry (auto-created)  ──→  Project (on booking)
       ↑                           ↑                          ↑
  Lead picks package          selected_package_id         Clone happens HERE
  (radio buttons)             stored as FK (no data)      (Phase 1)
                              Package shown as NAME only
```

---

## Phase 2 Architecture: Dual-Owner Tables

### Design Decision: Dual Nullable FKs (Not Polymorphic String)

Instead of `owner_type: enum + owner_id: int` (which loses FK constraints), use **dual nullable foreign keys**:

```
project_id  Int?   → projects.id  (Cascade)
inquiry_id  Int?   → inquiries.id (Cascade)
```

**Constraint:** Exactly one must be non-null (enforced by application code and optionally a raw SQL check constraint in the migration).

**Why this over polymorphic strings:** Prisma has full FK relation support, cascade deletes work correctly, and query patterns remain simple (`where: { inquiry_id: X }` or `where: { project_id: X }`).

### Target Pipeline (After Phase 2)

```
Needs Assessment Form  ──→  Inquiry (auto-created)  ──→  Project (on booking)
       ↑                           ↑                          ↑
  Lead picks package      CLONE HAPPENS HERE            TRANSFER (not re-clone)
  (radio buttons)         inquiry_id set on all rows    UPDATE SET project_id=X,
                          Full schedule editor visible   inquiry_id=NULL
                          throughout sales pipeline
```

---

## Implementation Steps

### Step 1: Schema Migration — Add `inquiry_id` to All Snapshot Tables

**File:** `packages/backend/prisma/schema.prisma`

Add `inquiry_id Int?` + relation to every model that currently has `project_id Int`. Make `project_id` nullable. Add the inquiry relation on the `inquiries` model.

**Tables to modify** (7 tables that have direct `project_id`):

| Model | Current | Change |
|-------|---------|--------|
| `ProjectEventDay` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |
| `ProjectActivity` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |
| `ProjectActivityMoment` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |
| `ProjectEventDaySubject` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |
| `ProjectLocationSlot` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |
| `ProjectDayOperator` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |
| `ProjectFilm` | `project_id Int` (required) | `project_id Int?`, add `inquiry_id Int?` + FK |

**Tables NOT modified** (child tables linked via parent FK — they are implicitly owned by following the parent):
- `ProjectDayOperatorEquipment` — linked via `project_day_operator_id`
- `ProjectOperatorActivityAssignment` — linked via `project_day_operator_id` + `project_activity_id`
- `ProjectSubjectActivityAssignment` — linked via `project_event_day_subject_id` + `project_activity_id`
- `ProjectLocationActivityAssignment` — linked via `project_location_slot_id` + `project_activity_id`
- `ProjectFilmSceneSchedule` — linked via `project_film_id`

**Example for `ProjectEventDay` (apply same pattern to all 7):**

```prisma
model ProjectEventDay {
  id                    Int      @id @default(autoincrement())
  project_id            Int?     // ← Was required, now nullable
  inquiry_id            Int?     // ← NEW
  event_day_template_id Int?
  name                  String
  date                  DateTime @db.Date
  start_time            String?
  end_time              String?
  order_index           Int      @default(0)
  notes                 String?
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  project            projects?                  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  inquiry            inquiries?                 @relation(fields: [inquiry_id], references: [id], onDelete: Cascade)
  event_day_template EventDayTemplate?          @relation(fields: [event_day_template_id], references: [id], onDelete: SetNull)
  scene_schedules    ProjectFilmSceneSchedule[]
  activities         ProjectActivity[]
  day_operators      ProjectDayOperator[]
  subjects           ProjectEventDaySubject[]
  location_slots     ProjectLocationSlot[]

  @@index([project_id])
  @@index([inquiry_id])
  @@index([event_day_template_id])
  @@map("project_event_days")
}
```

**Also add reverse relations on the `inquiries` model:**

```prisma
model inquiries {
  // ... existing fields ...
  
  // Schedule snapshot (owned while inquiry, transferred when booked)
  schedule_event_days        ProjectEventDay[]
  schedule_activities        ProjectActivity[]
  schedule_films             ProjectFilm[]
  schedule_day_operators     ProjectDayOperator[]
  schedule_subjects          ProjectEventDaySubject[]
  schedule_location_slots    ProjectLocationSlot[]
  schedule_activity_moments  ProjectActivityMoment[]

  @@map("inquiries")
}
```

**Also add to `inquiries` model** (matching what `projects` already has):

```prisma
  source_package_id           Int? // Which package was cloned
  package_contents_snapshot   Json? // Frozen copy of package contents at clone time
  source_package_for_inquiry  service_packages? @relation("InquirySourcePackage", fields: [source_package_id], references: [id], onDelete: SetNull)
```

**Note:** The `service_packages` model needs the reverse relation added too:
```prisma
model service_packages {
  // ... existing ...
  inquiry_source_refs   inquiries[] @relation("InquirySourcePackage")
}
```

**Unique constraint update on `ProjectFilm`:**
Change `@@unique([project_id, film_id])` → remove this unique (since `project_id` is now nullable). Add a compound index instead or use a partial unique. Simplest: remove the `@@unique` and rely on application-level dedup, or use two separate unique constraints:
```prisma
  @@unique([project_id, film_id])   // Only when project_id is set
  @@unique([inquiry_id, film_id])   // Only when inquiry_id is set
```
**Prisma note:** Prisma doesn't natively support partial/conditional unique constraints, so the above creates full unique indexes where NULL values don't conflict (PostgreSQL behavior: NULLs are distinct in unique constraints). This works correctly.

**Migration command:**
```bash
cd packages/backend
npx prisma migrate dev --name "dual_owner_inquiry_project_schedule_tables"
npx prisma generate
```

**Raw SQL check constraint** (add to migration SQL manually, after the Prisma auto-generated part):
```sql
-- Ensure exactly one owner per row (add to each of the 7 tables)
ALTER TABLE project_event_days ADD CONSTRAINT chk_event_day_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE project_activities ADD CONSTRAINT chk_activity_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE project_activity_moments ADD CONSTRAINT chk_moment_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE project_event_day_subjects ADD CONSTRAINT chk_subject_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE project_location_slots ADD CONSTRAINT chk_location_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE project_day_operators ADD CONSTRAINT chk_operator_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
ALTER TABLE project_films ADD CONSTRAINT chk_film_owner 
  CHECK (num_nonnulls(project_id, inquiry_id) = 1);
```

---

### Step 2: Refactor `ProjectPackageCloneService` → Generic Clone

**File:** `packages/backend/src/projects/project-package-clone.service.ts`

**Changes:**

1. **Rename method** (or add overload): `clonePackageToProject(projectId, packageId, tx?)` → `clonePackageToOwner(options, tx?)`

```typescript
interface CloneTarget {
  projectId?: number;
  inquiryId?: number;
  packageId: number;
}

async clonePackageToOwner(target: CloneTarget, tx?: Prisma.TransactionClient) {
  if (!target.projectId && !target.inquiryId) throw new Error('Must specify projectId or inquiryId');
  if (target.projectId && target.inquiryId) throw new Error('Cannot specify both projectId and inquiryId');
  // ...
}
```

2. **Update all `.create()` calls** inside `_clone()`: Replace `project_id: projectId` with:
```typescript
const ownerFields = target.projectId 
  ? { project_id: target.projectId } 
  : { inquiry_id: target.inquiryId };
```

Then spread `...ownerFields` into every `create()` data block instead of `project_id: projectId`.

3. **Keep backward compat**: Optionally keep the old `clonePackageToProject` as a thin wrapper:
```typescript
async clonePackageToProject(projectId: number, packageId: number, tx?: Prisma.TransactionClient) {
  return this.clonePackageToOwner({ projectId, packageId }, tx);
}

async clonePackageToInquiry(inquiryId: number, packageId: number, tx?: Prisma.TransactionClient) {
  return this.clonePackageToOwner({ inquiryId, packageId }, tx);
}
```

4. **Move service** from `ProjectsModule` → create a new shared `ScheduleSnapshotModule` (or keep in `ProjectsModule` but also export for `InquiriesModule` to import). The simplest approach: keep it in `ProjectsModule` and have `InquiriesModule` import `ProjectsModule` (this already works from Phase 1).

---

### Step 3: Refactor `ProjectPackageSnapshotService` → Generic Queries

**File:** `packages/backend/src/projects/project-package-snapshot.service.ts`

**Changes:**

Every method currently accepts `projectId: number` and filters with `where: { project_id: projectId }`.

1. Add a generic owner filter helper:

```typescript
type OwnerFilter = { projectId: number } | { inquiryId: number };

private ownerWhere(owner: OwnerFilter) {
  return 'projectId' in owner 
    ? { project_id: owner.projectId } 
    : { inquiry_id: owner.inquiryId };
}
```

2. Update every method to accept `OwnerFilter` instead of just `projectId`:

```typescript
// Before:
async getEventDays(projectId: number) {
  return this.prisma.projectEventDay.findMany({
    where: { project_id: projectId },
    // ...
  });
}

// After:
async getEventDays(owner: OwnerFilter) {
  return this.prisma.projectEventDay.findMany({
    where: this.ownerWhere(owner),
    // ...
  });
}
```

3. Keep backward-compatible overloads or update callers.

---

### Step 4: Add Clone Trigger for Inquiry Package Selection

**File:** `packages/backend/src/inquiries/inquiries.service.ts`

When `selected_package_id` is set or changed on an inquiry, trigger the clone.

**New method: `handlePackageSelection`**

```typescript
async handlePackageSelection(inquiryId: number, newPackageId: number | null, brandId: number) {
  return this.prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiries.findUnique({ where: { id: inquiryId } });
    if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);
    
    const oldPackageId = inquiry.selected_package_id;
    
    // 1. If package is being cleared (newPackageId = null), delete existing clone data
    if (!newPackageId) {
      await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
      await tx.inquiries.update({
        where: { id: inquiryId },
        data: { 
          selected_package_id: null, 
          source_package_id: null, 
          package_contents_snapshot: Prisma.DbNull,
        },
      });
      return;
    }
    
    // 2. If package changed, delete old clone first
    if (oldPackageId && oldPackageId !== newPackageId) {
      await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
    }
    
    // 3. Capture snapshot + clone
    const pkg = await tx.service_packages.findUnique({
      where: { id: newPackageId },
      select: { id: true, name: true, contents: true },
    });
    
    const snapshot = pkg ? {
      snapshot_taken_at: new Date().toISOString(),
      package_id: pkg.id,
      package_name: pkg.name,
      contents: pkg.contents,
    } : undefined;
    
    await tx.inquiries.update({
      where: { id: inquiryId },
      data: {
        selected_package_id: newPackageId,
        source_package_id: newPackageId,
        package_contents_snapshot: snapshot as Prisma.InputJsonValue,
      },
    });
    
    // 4. Clone package entities into inquiry-owned rows
    if (!oldPackageId || oldPackageId !== newPackageId) {
      await this.packageCloneService.clonePackageToInquiry(inquiryId, newPackageId, tx);
    }
  });
}
```

**New method: `deleteInquiryScheduleSnapshot`** — deletes all schedule instance rows for an inquiry (cascade via parent deletion handles children):

```typescript
private async deleteInquiryScheduleSnapshot(inquiryId: number, tx: Prisma.TransactionClient) {
  // Delete in reverse dependency order (or rely on cascade)
  // Top-level tables cascade to their children
  await tx.projectFilm.deleteMany({ where: { inquiry_id: inquiryId } });
  await tx.projectDayOperator.deleteMany({ where: { inquiry_id: inquiryId } });
  await tx.projectLocationSlot.deleteMany({ where: { inquiry_id: inquiryId } });
  await tx.projectEventDaySubject.deleteMany({ where: { inquiry_id: inquiryId } });
  await tx.projectActivityMoment.deleteMany({ where: { inquiry_id: inquiryId } });
  await tx.projectActivity.deleteMany({ where: { inquiry_id: inquiryId } });
  await tx.projectEventDay.deleteMany({ where: { inquiry_id: inquiryId } });
}
```

**Wire into existing update flow:**

In the `update()` method of `InquiriesService`, detect when `selected_package_id` changes and call `handlePackageSelection`:

```typescript
async update(id: number, dto: UpdateInquiryDto, brandId: number) {
  // ... existing update logic ...
  
  // If package selection changed, trigger clone
  if (dto.selected_package_id !== undefined) {
    const current = await this.prisma.inquiries.findUnique({ where: { id }, select: { selected_package_id: true } });
    if (current && current.selected_package_id !== dto.selected_package_id) {
      await this.handlePackageSelection(id, dto.selected_package_id, brandId);
    }
  }
  
  // ... rest of update ...
}
```

---

### Step 5: Transfer Ownership on Inquiry → Project Conversion

**File:** `packages/backend/src/inquiries/inquiries.service.ts` — `convertInquiryToProject` method

**Current behavior:** Clones package → project inside the transaction.

**New behavior:** If the inquiry already owns schedule rows (cloned in Step 4), **transfer** them to the project. If not (no package was selected), skip.

```typescript
// Inside convertInquiryToProject, REPLACE the clone block with:

// 5. Transfer or clone schedule data
if (inquiry.selected_package_id) {
  // Check if inquiry already has cloned schedule data
  const existingEventDays = await prisma.projectEventDay.count({ 
    where: { inquiry_id: inquiry.id } 
  });
  
  if (existingEventDays > 0) {
    // TRANSFER: Re-assign ownership from inquiry → project
    await this.transferScheduleOwnership(inquiry.id, project.id, prisma);
    this.logger.log(`Transferred schedule ownership from inquiry ${inquiry.id} → project ${project.id}`);
  } else {
    // FRESH CLONE: No inquiry-level data exists (edge case: direct booking without inquiry customization)
    const cloneResult = await this.packageCloneService.clonePackageToProject(
      project.id,
      inquiry.selected_package_id,
      prisma,
    );
    this.logger.log(`Fresh clone for project ${project.id}: ${cloneResult.event_days_created} days`);
  }
  
  // Copy snapshot metadata to the project
  await prisma.projects.update({
    where: { id: project.id },
    data: {
      source_package_id: inquiry.selected_package_id,
      package_contents_snapshot: inquiry.package_contents_snapshot ?? undefined,
    },
  });
}
```

**New method: `transferScheduleOwnership`**

```typescript
private async transferScheduleOwnership(
  inquiryId: number, 
  projectId: number, 
  tx: Prisma.TransactionClient,
) {
  // Update all 7 owner-bearing tables: set project_id, clear inquiry_id
  const ownerUpdate = { project_id: projectId, inquiry_id: null };
  
  await tx.projectEventDay.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
  await tx.projectActivity.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
  await tx.projectActivityMoment.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
  await tx.projectEventDaySubject.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
  await tx.projectLocationSlot.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
  await tx.projectDayOperator.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
  await tx.projectFilm.updateMany({ where: { inquiry_id: inquiryId }, data: ownerUpdate });
}
```

This is simply `UPDATE ... SET project_id = ?, inquiry_id = NULL WHERE inquiry_id = ?` for each table — instant, no data copy.

---

### Step 6: Add Inquiry-Level Schedule Endpoints

**Option A (Recommended):** Add endpoints to `InquiriesController`:

```
GET /api/inquiries/:id/schedule-snapshot          → summary
GET /api/inquiries/:id/schedule-snapshot/event-days
GET /api/inquiries/:id/schedule-snapshot/activities
GET /api/inquiries/:id/schedule-snapshot/operators
GET /api/inquiries/:id/schedule-snapshot/subjects
GET /api/inquiries/:id/schedule-snapshot/locations
GET /api/inquiries/:id/schedule-snapshot/films
GET /api/inquiries/:id/schedule-snapshot/activities/:activityId/moments
```

These call the same `ProjectPackageSnapshotService` methods but with `{ inquiryId: id }` instead of `{ projectId: id }`.

**Option B:** Reuse the existing `/projects/:id/package-snapshot/*` endpoints with a query param `?owner=inquiry&ownerId=123`. Less RESTful but fewer endpoints.

**Recommended: Option A** — it's cleaner and matches the existing URL patterns. The `InquiriesController` already exists.

**Also add:** The existing project endpoints (`/projects/:id/package-snapshot/*`) continue to work as-is — they just pass `{ projectId: id }`.

---

### Step 7: Frontend API Client Methods

**File:** `packages/frontend/src/lib/api.ts`

Add two new namespaces:

```typescript
// Project package snapshot (existing from Phase 2 plan)
projectPackageSnapshot = {
  getSummary: (projectId: number): Promise<any> =>
    this.get(`/projects/${projectId}/package-snapshot`),
  getEventDays: (projectId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/event-days`),
  getActivities: (projectId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/activities`),
  getOperators: (projectId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/operators`),
  getSubjects: (projectId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/subjects`),
  getLocations: (projectId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/locations`),
  getFilms: (projectId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/films`),
  getActivityMoments: (projectId: number, activityId: number): Promise<any[]> =>
    this.get(`/projects/${projectId}/package-snapshot/activities/${activityId}/moments`),
};

// Inquiry schedule snapshot (NEW for inquiry-level)
inquiryScheduleSnapshot = {
  getSummary: (inquiryId: number): Promise<any> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot`),
  getEventDays: (inquiryId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/event-days`),
  getActivities: (inquiryId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/activities`),
  getOperators: (inquiryId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/operators`),
  getSubjects: (inquiryId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/subjects`),
  getLocations: (inquiryId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/locations`),
  getFilms: (inquiryId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/films`),
  getActivityMoments: (inquiryId: number, activityId: number): Promise<any[]> =>
    this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/activities/${activityId}/moments`),
};
```

---

### Step 8: Create `useScheduleSnapshotData` Hook (Shared)

**File to create:** `packages/frontend/src/hooks/useScheduleSnapshotData.ts`

This is a **shared hook** used by both the inquiry page and the project page. It accepts a generic `owner` parameter.

```typescript
interface UseScheduleSnapshotOptions {
  owner: { type: 'inquiry'; id: number } | { type: 'project'; id: number };
}
```

Internally, it picks the right API namespace based on `owner.type`:

```typescript
const apiClient = owner.type === 'inquiry' 
  ? api.inquiryScheduleSnapshot 
  : api.projectPackageSnapshot;
```

**Return type:**

```typescript
export interface UseScheduleSnapshotDataReturn {
  isLoading: boolean;
  error: string | null;
  hasPackageData: boolean;

  // Snapshot summary
  sourcePackage: { id: number; name: string; description?: string } | null;
  packageContentsSnapshot: any;

  // Data arrays — transformed to match package editor shapes
  packageEventDays: EventDayTemplate[];
  packageActivities: PackageActivityRecord[];
  packageDayOperators: PackageDayOperatorRecord[];
  packageSubjects: PackageEventDaySubjectRecord[];
  packageLocationSlots: PackageLocationSlotRecord[];
  packageFilms: PackageFilmRecord[];

  // Counts
  counts: {
    event_days: number;
    activities: number;
    films: number;
    operators: number;
    subjects: number;
    location_slots: number;
  };

  reload: () => Promise<void>;
}
```

**Data shape transformation** (same as earlier Phase 2 plan — the snapshot endpoints return project-prefixed relations but the shared UI components expect package-prefixed names):

| Snapshot field | Component expected field |
|---------------|------------------------|
| `project_event_day_id` | `event_day_template_id` / `package_event_day_id` |
| `project_activity_id` | `package_activity_id` |
| `project_activity` (nested) | `package_activity` |

Apply these transformations in the hook's `loadData` function before setting state. See the "Data Shape Transformation" section from the original Phase 2 plan (preserved below in Appendix A) for the full field mapping.

---

### Step 9: Add Package Schedule Section to Inquiry Detail Page

**File to modify:** `packages/frontend/src/app/(studio)/sales/inquiries/[id]/page.tsx`

**What to add:** A new `PackageScheduleCard` component (NOT the shared `PackageScheduleCard` from `components/schedule/` — this is a NEW workflow card specific to the inquiry page).

**Where to add it:** In the left column, after the `NeedsAssessmentCard` and before the `EstimatesCard`:

```tsx
{/* LEFT COLUMN */}
<Grid item xs={12} md={5}>
    <Stack spacing={3}>
        <ContactDetailsCard ... />
        <NeedsAssessmentCard ... />
        
        {/* NEW: Package Schedule Section */}
        {inquiry.selected_package_id && (
            <div id="package-schedule-section">
                <InquiryPackageScheduleCard
                    inquiry={inquiry}
                    onRefresh={handleRefresh}
                    isActive={currentPhase === 'needs-assessment'}
                    activeColor={WORKFLOW_PHASES.find(p => p.id === 'needs-assessment')?.color}
                />
            </div>
        )}
        
        <EstimatesCard ... />
        <CallsCard ... />
    </Stack>
</Grid>
```

**New component: `InquiryPackageScheduleCard`**

This is a WorkflowCard-styled wrapper that uses `useScheduleSnapshotData({ type: 'inquiry', id: inquiry.id })` and renders the schedule in a compact view. For the first implementation, it can be a simplified view:

- Header: "📦 Package Schedule — [Package Name]" with expand/collapse
- Collapsed: Show counts ("3 event days · 8 activities · 4 crew · 6 subjects")
- Expanded: Show the full schedule using shared components (PackageScheduleCard, ActivitiesCard, etc.)

**Implementation approach for the inquiry page:**

For a clean first pass, the inquiry schedule card can be **read-only** — it shows the cloned data but doesn't yet offer inline editing. This is because the shared schedule components (PackageScheduleCard, ActivitiesCard, etc.) make direct `api.schedule.package*` calls which won't work for inquiry-owned data.

To make editing work (Phase 2b), the shared components need an API adapter layer. See "Shared Component API Adapter" section below.

**Alternative simpler approach:** Instead of embedding the full schedule editor, create a link-out: "View/Edit Package Schedule →" that navigates to a dedicated page like `/sales/inquiries/[id]/schedule` which hosts the full editor layout. This avoids cramming complex components into the 3-column card layout.

---

### Step 10: Add Package Tab to Project Detail Page

**File to modify:** `packages/frontend/src/app/(studio)/projects/[id]/page.tsx`

Same as the original Phase 2 plan:

1. Add `PackageIcon` import
2. Insert `{ id: 'package', name: 'Package', icon: PackageIcon, color: '#a855f7', description: 'Inherited package schedule and resources' }` into `PROJECT_PHASES` as the 2nd entry
3. Create `PackageTab.tsx` in `_tabs/` that uses `useScheduleSnapshotData({ type: 'project', id: projectId })`
4. Wire TabPanel at index 1

The project Package tab is identical to the original Phase 2 plan, except it uses the shared `useScheduleSnapshotData` hook. All the same component layout, read-only strategy, and visual design apply.

---

## Shared Component API Adapter (For Future Editable Mode)

The shared schedule components (PackageScheduleCard, ActivitiesCard, CrewCard, SubjectsCard, LocationsCard) currently hardcode `api.schedule.package*` calls. To make them work for inquiry/project-owned data, two approaches:

### Approach A: API Context Provider (Recommended for Phase 2b)

Create a React context that provides the API methods:

```typescript
interface ScheduleApiContext {
  activities: {
    getAll: (ownerId: number) => Promise<any[]>;
    create: (ownerId: number, data: any) => Promise<any>;
    update: (activityId: number, data: any) => Promise<any>;
    delete: (activityId: number) => Promise<void>;
    // ...
  };
  operators: {
    getAll: (ownerId: number) => Promise<any[]>;
    add: (ownerId: number, data: any) => Promise<any>;
    // ...
  };
  // etc.
}
```

Provide different implementations: `packageScheduleApi`, `inquiryScheduleApi`, `projectScheduleApi`. Wrap the shared components in this context. Components call `useScheduleApi()` instead of `api.schedule.package*`.

### Approach B: Pass as Props (Simpler)

Add an `apiAdapter` or `onAction` callbacks to each shared component. More explicit but more prop drilling. Already partially supported since many components accept `onSave`, `onAdd`, `onRemove` callback props.

**Neither approach is needed for the initial Phase 2.** For the first pass, pass `packageId: null` to suppress mutations and the components render read-only.

---

## File Inventory

### Files to CREATE:
| File | Purpose |
|------|---------|
| `packages/frontend/src/hooks/useScheduleSnapshotData.ts` | Shared data hook for inquiry/project schedule snapshot |
| `packages/frontend/src/app/(studio)/projects/[id]/_tabs/PackageTab.tsx` | Project Package tab container |
| `packages/frontend/src/app/(studio)/projects/[id]/_hooks/index.ts` | Barrel export |
| Inquiry schedule card component (in inquiry page or extracted) | Inquiry package schedule display |

### Files to MODIFY:
| File | Change |
|------|--------|
| `packages/backend/prisma/schema.prisma` | Add `inquiry_id` to 7 tables, make `project_id` nullable, add reverse relations on `inquiries`, add `source_package_id` + `package_contents_snapshot` to `inquiries` |
| `packages/backend/src/projects/project-package-clone.service.ts` | Refactor to accept `{ projectId?, inquiryId? }` |
| `packages/backend/src/projects/project-package-snapshot.service.ts` | Refactor to accept `OwnerFilter` |
| `packages/backend/src/projects/projects.controller.ts` | Update endpoint handlers to pass `{ projectId: id }` |
| `packages/backend/src/inquiries/inquiries.service.ts` | Add `handlePackageSelection`, `deleteInquiryScheduleSnapshot`, `transferScheduleOwnership`; refactor `convertInquiryToProject` to transfer instead of clone |
| `packages/backend/src/inquiries/inquiries.controller.ts` | Add 8 schedule-snapshot GET endpoints |
| `packages/backend/src/inquiries/inquiries.module.ts` | Ensure `ProjectPackageSnapshotService` is available |
| `packages/frontend/src/lib/api.ts` | Add `projectPackageSnapshot` + `inquiryScheduleSnapshot` namespaces |
| `packages/frontend/src/app/(studio)/projects/[id]/page.tsx` | Add Package tab |
| `packages/frontend/src/app/(studio)/sales/inquiries/[id]/page.tsx` | Add Package schedule section |

### Files REUSED (no changes):
| File | Role |
|------|------|
| `packages/frontend/src/components/schedule/PackageScheduleCard.tsx` | Timeline visualization |
| `packages/frontend/src/components/schedule/ActivitiesCard.tsx` | Activity list |
| `packages/frontend/src/app/(studio)/designer/packages/[id]/_cards/CrewCard.tsx` | Crew display |
| `packages/frontend/src/app/(studio)/designer/packages/[id]/_cards/SubjectsCard.tsx` | Subject display |
| `packages/frontend/src/app/(studio)/designer/packages/[id]/_cards/LocationsCard.tsx` | Location display |
| `packages/frontend/src/app/(studio)/designer/packages/[id]/_lib/types.ts` | Shared types |

---

## Implementation Order

| # | Step | Location | Est. Time | Dependencies |
|---|------|----------|-----------|-------------|
| 1 | Schema migration (dual-owner FKs) | Backend | 30 min | None |
| 2 | Refactor clone service (generic owner) | Backend | 20 min | Step 1 |
| 3 | Refactor snapshot service (generic queries) | Backend | 15 min | Step 1 |
| 4 | Add inquiry clone trigger | Backend | 30 min | Steps 1-2 |
| 5 | Add transfer logic in convertInquiryToProject | Backend | 20 min | Steps 1-2 |
| 6 | Add inquiry schedule endpoints | Backend | 15 min | Steps 1, 3 |
| 7 | Update project schedule endpoints | Backend | 5 min | Step 3 |
| 8 | Frontend API client methods | Frontend | 10 min | Steps 6-7 |
| 9 | Shared `useScheduleSnapshotData` hook | Frontend | 30 min | Step 8 |
| 10 | Project Package tab | Frontend | 30 min | Step 9 |
| 11 | Inquiry Package schedule section | Frontend | 45 min | Step 9 |
| 12 | Validate + test | Both | 30 min | All |

**Total estimated time:** ~4.5 hours

---

## Validation Criteria

1. **Schema migration applies cleanly** — `npx prisma migrate dev` succeeds, `npx prisma generate` succeeds
2. **Backend compiles** — `cd packages/backend && npm run build` — zero errors
3. **Frontend builds** — `cd packages/frontend && npm run build` — zero errors
4. **Inquiry clone trigger works** — Setting `selected_package_id` on an inquiry via API creates schedule rows with `inquiry_id` set and `project_id` = null
5. **Changing package on inquiry** — Selecting a different package deletes old rows and clones new ones
6. **Clearing package on inquiry** — Setting `selected_package_id` to null deletes all inquiry schedule rows
7. **Transfer on booking** — Converting inquiry → project transfers rows: `project_id` is set, `inquiry_id` is null, no new rows created
8. **Fresh clone still works** — Converting an inquiry WITHOUT pre-existing schedule data (e.g., old inquiries) falls back to the original clone behavior
9. **Inquiry page shows schedule** — Inquiry detail page renders the package schedule section when a package is selected
10. **Project page shows Package tab** — Project detail page has a Package tab that displays the inherited (and possibly customized) schedule
11. **No cross-contamination** — Inquiry schedule data is isolated from the original package; edits don't propagate
12. **Cascade deletes work** — Deleting an inquiry cascades to its schedule rows; deleting a project cascades to its schedule rows

---

## Appendix A: Data Shape Transformation (From Original Phase 2)

The snapshot endpoints return project-prefixed relation names. The shared UI components expect package-prefixed names. The `useScheduleSnapshotData` hook must transform.

**For Event Days:**
```typescript
eventDays.map(ped => ({
  id: ped.event_day_template?.id ?? ped.id,
  name: ped.name || ped.event_day_template?.name || `Day ${ped.order_index}`,
  order_index: ped.order_index,
  description: ped.event_day_template?.description,
  _joinId: ped.id,
}))
```

**For Activities:**
Map `project_event_day_id` → `package_event_day_id`.

**For Operators:**
Map `project_event_day_id` → `event_day_template_id`, `project_activity_id` → `package_activity_id`, rename `project_activity` → `package_activity`.

**For Subjects and Locations:**
Map `project_event_day_id` → `event_day_template_id`, rename `project_activity` → `package_activity`.

---

## Appendix B: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Making `project_id` nullable breaks existing queries | High | Search for all `where: { project_id: ... }` in snapshot and clone services — they all come from controlled service methods, not raw queries. Update each one. |
| Check constraint prevents valid data | Medium | Test with raw SQL inserts before applying. PostgreSQL `num_nonnulls` handles NULLs correctly. |
| Old inquiries don't have schedule data | Low | The transfer logic checks for existing data and falls back to fresh clone. |
| Package change on inquiry leaves orphan child rows | Medium | `deleteInquiryScheduleSnapshot` deletes parents first; cascade handles children. |
| Shared components break with `packageId: null` | Medium | Already analyzed: most mutations are guarded by `if (packageId)`. Test each component. |
| `ProjectFilm` unique constraint with nullable `project_id` | Low | PostgreSQL treats NULLs as distinct in unique constraints, so `@@unique([project_id, film_id])` won't conflict when `project_id` is null. Add matching `@@unique([inquiry_id, film_id])`. |

---

## Future Work (Phase 2b — NOT part of this prompt)

- **Editable mode on inquiry page** — API adapter/context for shared schedule components
- **Editable mode on project page** — Same adapter pattern
- **"Sync from Package" button** — Re-clone latest package data (with confirmation dialog)
- **Diff view** — Show what changed since the snapshot was taken
- **Needs assessment page package preview** — Show schedule summary inline on the needs assessment form before submission
- **Timeline visualization on proposals** — Pull schedule data into proposal/estimate rendering

# Phase 2: Project Package Tab — UI Reuse Plan

## Overview

Phase 2 adds a **Package** tab to the existing project detail page (`projects/[id]/page.tsx`) that displays the project-owned package snapshot data using the **same shared schedule components** already used by the package editor.

The project Package tab is **read-first, edit-later**: initially it renders the cloned data in read-only mode. Mutation endpoints can be added incrementally without any schema changes.

---

## Architecture Strategy: Mode-Aware Shared Components

The refactored package editor already uses a **thin container → hooks + cards** architecture:

```
packages/[id]/page.tsx          ← thin container
  _hooks/usePackageData.ts      ← data fetching (20+ states)
  _hooks/usePackageActions.ts   ← save/add/remove handlers
  _cards/*                      ← 7 presentation cards
  _lib/types.ts                 ← shared interfaces
  components/schedule/*         ← PackageScheduleCard, ActivitiesCard
```

For the project tab, we create a **parallel thin container** with a project-specific data hook that feeds the **same shared schedule components**:

```
projects/[id]/_tabs/PackageTab.tsx           ← thin container
  _hooks/useProjectPackageData.ts            ← fetches from /projects/:id/package-snapshot/*
  components/schedule/PackageScheduleCard    ← REUSED (already prop-driven)
  components/schedule/ActivitiesCard         ← REUSED (already prop-driven)
  packages/[id]/_cards/SummaryCard           ← REUSED or forked
  packages/[id]/_cards/CrewCard              ← REUSED (prop-driven)
  packages/[id]/_cards/SubjectsCard          ← REUSED (prop-driven)
  packages/[id]/_cards/LocationsCard         ← REUSED (prop-driven)
```

### Key Principle: No `mode` Prop Required

The shared components (PackageScheduleCard, ActivitiesCard, CrewCard, etc.) are **already prop-driven** — they take data arrays and callbacks. They don't know whether the data comes from a package or a project. The only changes needed are:

1. **Data hook**: A new `useProjectPackageData()` hook that calls the Phase 1 read endpoints
2. **Action hook**: A new `useProjectPackageActions()` (initially empty/read-only, later wraps project CRUD)
3. **Container**: A `PackageTab.tsx` that wires the hooks into the shared components

---

## Implementation Steps

### Step 1: Create `useProjectPackageData` Hook

**File:** `packages/frontend/src/app/(studio)/projects/[id]/_hooks/useProjectPackageData.ts`

This hook mirrors `usePackageData.ts` but fetches from the project snapshot endpoints:

```typescript
// Conceptual structure — mirrors usePackageData's return shape
export function useProjectPackageData(projectId: number) {
  // Fetch from Phase 1 endpoints
  const { data: summary }     = useSWR(`/projects/${projectId}/package-snapshot`);
  const { data: eventDays }   = useSWR(`/projects/${projectId}/package-snapshot/event-days`);
  const { data: activities }  = useSWR(`/projects/${projectId}/package-snapshot/activities`);
  const { data: operators }   = useSWR(`/projects/${projectId}/package-snapshot/operators`);
  const { data: subjects }    = useSWR(`/projects/${projectId}/package-snapshot/subjects`);
  const { data: locations }   = useSWR(`/projects/${projectId}/package-snapshot/locations`);
  const { data: films }       = useSWR(`/projects/${projectId}/package-snapshot/films`);

  // Return same shape as usePackageData so shared components work unchanged
  return {
    summary,
    packageEventDays: eventDays,        // Renamed from project → package shape
    packageActivities: activities,
    packageDayOperators: operators,
    packageSubjects: subjects,
    packageLocationSlots: locations,
    packageFilms: films,
    // ... plus setters (initially no-ops or local state)
  };
}
```

### Step 2: Add API Methods to `api.ts`

**File:** `packages/frontend/src/lib/api.ts`

Add a `projects.packageSnapshot` namespace:

```typescript
// Inside the api object
projects: {
  packageSnapshot: {
    getSummary:    (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot`),
    getEventDays:  (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot/event-days`),
    getActivities: (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot/activities`),
    getOperators:  (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot/operators`),
    getSubjects:   (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot/subjects`),
    getLocations:  (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot/locations`),
    getFilms:      (projectId: number) => authFetch(`/projects/${projectId}/package-snapshot/films`),
  },
}
```

### Step 3: Create `PackageTab` Container

**File:** `packages/frontend/src/app/(studio)/projects/[id]/_tabs/PackageTab.tsx`

```typescript
'use client';
import { useProjectPackageData } from '../_hooks/useProjectPackageData';
import PackageScheduleCard from '@/components/schedule/PackageScheduleCard';
import ActivitiesCard from '@/components/schedule/ActivitiesCard';
// Reuse existing cards where prop-compatible

export default function PackageTab({ projectId }: { projectId: number }) {
  const data = useProjectPackageData(projectId);

  if (!data.summary?.has_package_data) {
    return <EmptyState message="No package data for this project" />;
  }

  return (
    <Stack spacing={3}>
      {/* Summary overview */}
      <SummaryCard {...data} />

      {/* Full-width schedule card — same component as package editor */}
      <PackageScheduleCard
        packageId={projectId}  // Component uses this only for key purposes
        packageEventDays={data.packageEventDays}
        packageActivities={data.packageActivities}
        packageDayOperators={data.packageDayOperators}
        // ... same props as in packages/[id]/page.tsx
      />

      {/* Three-column grid — same layout as package editor */}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <ActivitiesCard {...data} />
        </Grid>
        <Grid item xs={4}>
          <SubjectsCard subjects={data.packageSubjects} />
          <LocationsCard locations={data.packageLocationSlots} />
        </Grid>
        <Grid item xs={4}>
          <CrewCard operators={data.packageDayOperators} />
        </Grid>
      </Grid>
    </Stack>
  );
}
```

### Step 4: Wire PackageTab into Project Detail Page

**File:** `packages/frontend/src/app/(studio)/projects/[id]/page.tsx`

Add a new tab to the existing phase-based tab system:

```typescript
// Add to tab definitions (currently: Overview, Creative, Pre-Production, etc.)
const PROJECT_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Package', value: 'package' },    // ← NEW
  { label: 'Creative', value: 'creative' },
  // ... existing tabs
];

// In the tab content switch:
{activeTab === 'package' && (
  <PackageTab projectId={projectId} />
)}
```

---

## Component Compatibility Matrix

| Shared Component                    | Package Editor Uses | Project Tab Can Reuse? | Notes                                            |
|-------------------------------------|--------------------|-----------------------|--------------------------------------------------|
| `PackageScheduleCard`               | ✅                 | ✅ Yes                | Fully prop-driven, no package API calls inside    |
| `ActivitiesCard`                    | ✅                 | ✅ Yes                | Takes activity array + callbacks                  |
| `SummaryCard` (_cards)              | ✅                 | ⚠️ Fork or adapt      | References package-specific cost calculations     |
| `CrewCard` (_cards)                 | ✅                 | ✅ Yes                | Takes operator array                              |
| `SubjectsCard` (_cards)             | ✅                 | ✅ Yes                | Takes subject array                               |
| `LocationsCard` (_cards)            | ✅                 | ✅ Yes                | Takes location slots array                        |
| `PackageContentsCard` (_cards)      | ✅                 | ❌ N/A                | Package-specific film selection                   |
| `TaskAutoGenCard` (_cards)          | ✅                 | ❌ N/A                | Package task overrides only                       |
| `ActivityFilmWizard` (dialog)       | ✅                 | ⚠️ Phase 3            | Needs project activity → project film linking     |

---

## Data Shape Mapping (Package → Project)

The Phase 1 read endpoints return data in shapes intentionally similar to the package data:

| Package Editor State Variable   | Project Snapshot Equivalent            | Shape Identical? |
|---------------------------------|---------------------------------------|-----------------|
| `packageEventDays`              | `GET .../event-days` response          | ✅ Same shape    |
| `packageActivities`             | `GET .../activities` response          | ✅ Same shape    |
| `packageDayOperators`           | `GET .../operators` response           | ✅ Same shape    |
| `packageSubjects`               | `GET .../subjects` response            | ✅ Same shape    |
| `packageLocationSlots`          | `GET .../locations` response           | ✅ Same shape    |
| `packageFilms`                  | `GET .../films` response               | ✅ Same shape    |

This shape alignment is what makes component reuse work without a `mode` prop.

---

## Incremental Mutation Enablement (Phase 2b)

Once read-only rendering works, adding edit capabilities is straightforward:

1. **Create CRUD endpoints** for project snapshot entities (mirroring `schedule.controller.ts` patterns)
2. **Create `useProjectPackageActions`** hook (mirroring `usePackageActions.ts`)
3. **Pass action callbacks** to the shared components (they already accept `onSave`, `onAdd`, `onRemove` etc.)

No component changes needed — they already have optional callback props.

---

## Risk Assessment

| Risk                                          | Mitigation                                                          |
|-----------------------------------------------|---------------------------------------------------------------------|
| Shared component has hardcoded package API call | Audit all `api.schedule.package*` calls inside components           |
| Data shape mismatch breaks rendering           | Phase 1 endpoints mirror package include patterns exactly           |
| Package tab loads slowly (many queries)         | useProjectPackageData batches calls; add React.Suspense boundaries  |
| Editing project data could accidentally call package APIs | useProjectPackageActions uses distinct `/projects/:id/...` routes |

---

## Files to Create/Modify

### New Files (Phase 2)
- `packages/frontend/src/app/(studio)/projects/[id]/_hooks/useProjectPackageData.ts`
- `packages/frontend/src/app/(studio)/projects/[id]/_tabs/PackageTab.tsx`

### Modified Files (Phase 2)
- `packages/frontend/src/lib/api.ts` — add `projects.packageSnapshot.*` methods
- `packages/frontend/src/app/(studio)/projects/[id]/page.tsx` — add Package tab

### Unchanged Files (Reused As-Is)
- `packages/frontend/src/components/schedule/PackageScheduleCard.tsx`
- `packages/frontend/src/components/schedule/ActivitiesCard.tsx`
- `packages/frontend/src/app/(studio)/designer/packages/[id]/_cards/CrewCard.tsx`
- `packages/frontend/src/app/(studio)/designer/packages/[id]/_cards/SubjectsCard.tsx`
- `packages/frontend/src/app/(studio)/designer/packages/[id]/_cards/LocationsCard.tsx`
- `packages/frontend/src/app/(studio)/designer/packages/[id]/_lib/types.ts`

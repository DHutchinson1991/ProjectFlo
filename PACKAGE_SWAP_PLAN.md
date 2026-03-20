# Package Swap & Budget-Only Assignment Plan

## Problem Statement

Two related gaps in the inquiry workflow:

1. **Budget-only inquiries** — When an inquirer skips package selection (clicks "Decide later") and only provides a budget range, there's no way for the studio to assign a package from their side within the PackageScopeCard.

2. **Package swapping destroys user data** — Changing `selected_package_id` currently nukes **all** schedule snapshot data (subjects with real names, locations with addresses, crew assignments, moments with notes) and re-clones from scratch. Estimates, quotes, contracts, and proposals survive (they're on separate FKs), but editable schedule data is lost.

---

## Current Architecture (as-is)

```
Inquiry
├── selected_package_id (nullable FK → service_packages)
├── source_package_id    (which package was cloned into schedule)
├── package_contents_snapshot (JSON — frozen at clone time)
│
├── Schedule Snapshot (inquiry-owned rows)
│   ├── ProjectEventDay          ← cloned from PackageEventDay
│   ├── ProjectActivity          ← cloned from PackageActivity
│   ├── ProjectActivityMoment    ← cloned from PackageActivityMoment
│   ├── ProjectEventDaySubject   ← has `real_name` (user-entered)
│   ├── ProjectLocationSlot      ← has `name`, `address` (user-entered)
│   ├── ProjectDayOperator       ← has `contributor_id` (crew assigned)
│   ├── ProjectFilm + scenes/tracks/beats
│   └── Assignment junction tables
│
├── Estimates[]      ← NOT deleted on swap ✅
├── Quotes[]         ← NOT deleted on swap ✅
├── Contracts[]      ← NOT deleted on swap ✅
├── Proposals[]      ← NOT deleted on swap ✅
└── NeedsAssessmentSubmissions[]   ← responses.budget_range lives here
```

**Current swap flow:**
```
handlePackageSelection()
  → deleteInquiryScheduleSnapshot()  ← WIPES everything
  → clonePackageToInquiry()          ← Fresh clone, all user fields = null
  → _prefillFromNeedsAssessment()    ← Partially restores from NA responses
```

---

## Plan Overview

### Feature A: Studio-Side Package Assignment (Budget-Only Inquiries)

**Goal:** Let the studio pick a package for the inquiry directly from the PackageScopeCard when no package is selected.

#### A1. Add inline package selector to PackageScopeCard

When `selected_package_id` is null, replace the current "No package selected" warning alert with an actionable selector:

```
┌─────────────────────────────────────────┐
│  📦 Package Scope                       │
│                                         │
│  ┌─── NA Context ─────────────────────┐ │
│  │ 💰 $5,000 – $10,000  🔨 Custom    │ │
│  │ 3 activities · 2 films · 2 ops     │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ⚠️  No package selected               │
│                                         │
│  ┌──────────────────────────┐           │
│  │ Select a package…     ▾  │           │
│  └──────────────────────────┘           │
│                                         │
│  💡 Suggested: "Essential Wedding"      │
│     based on $5k–$10k budget            │
│                                         │
│  [ Assign Package ]                     │
│                                         │
└─────────────────────────────────────────┘
```

**Implementation:**

- **Frontend** `PackageScopeCard.tsx`:
  - When `noPackageSelected`, render a `<Select>` dropdown of available brand packages (fetched from `api.servicePackages.list()`), grouped by package set/category.
  - Show a "Suggested" hint by matching `budget_range` against packages whose `base_price` falls within the parsed range.
  - "Assign Package" button calls the existing inquiry update endpoint: `api.inquiries.update(inquiry.id, { selected_package_id })`.
  - After success, invalidate/refetch the inquiry query to refresh the card.

- **Backend** — No changes needed. The existing `PUT /api/inquiries/:id` with `selected_package_id` already triggers `handlePackageSelection()` which clones the package schedule.

#### A2. Budget-aware package suggestion (nice-to-have)

Add a helper that parses the budget range string (e.g. `"$5,000 - $10,000"`) and finds packages whose `base_price` falls within that range, sorted by fit:

```typescript
// Frontend utility — parse budget string to [min, max]
function parseBudgetRange(range: string): [number, number] | null {
  const matches = range.match(/[\d,]+/g);
  if (!matches || matches.length < 2) return null;
  return [
    parseInt(matches[0].replace(/,/g, '')),
    parseInt(matches[1].replace(/,/g, '')),
  ];
}

// Filter packages by budget fit
const [min, max] = parseBudgetRange(budgetRange) ?? [0, Infinity];
const suggested = packages.filter(p => p.base_price >= min && p.base_price <= max);
```

No backend changes required — filtering happens client-side from the already-fetched package list.

---

### Feature B: Safe Package Swap (Preserve User Data)

**Goal:** Allow swapping packages without losing user-entered data (subject names, location addresses, crew assignments, notes, etc.).

This is the complex feature. Two strategies considered:

#### Strategy Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **B1: Stash & Restore** — Before delete, extract user-entered fields into a temp map keyed by role/slot; after re-clone, patch them back | Simple, no schema changes, works today | Lossy if new package has different roles/slots; matching is heuristic |
| **B2: Merge Clone** — Don't delete-and-reclone; instead diff the old vs new package and surgically add/remove/update rows | Preserves everything perfectly | Complex diffing logic; heavy to implement; edge cases with structural changes |

**Recommended: B1 (Stash & Restore)** — simpler, covers 90% of cases (most swaps are between packages of the same event type with similar structure), and can be enhanced later.

#### B1. Stash & Restore Implementation

##### B1.1 Backend: New method `swapPackage()` on `InquiriesService`

```typescript
async swapPackage(
  inquiryId: number,
  newPackageId: number,
  brandId: number,
) {
  await this.prisma.$transaction(async (tx) => {
    // ── STEP 1: Stash user-entered data before deletion ──
    const stash = await this.stashUserData(inquiryId, tx);
    
    // ── STEP 2: Delete old schedule + clone new package (existing flow) ──
    await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
    
    // Update inquiry metadata
    const pkg = await tx.service_packages.findUnique({
      where: { id: newPackageId },
      select: { id: true, name: true, base_price: true, currency: true, contents: true },
    });
    await tx.inquiries.update({
      where: { id: inquiryId },
      data: {
        selected_package_id: newPackageId,
        source_package_id: newPackageId,
        package_contents_snapshot: pkg ? {
          snapshot_taken_at: new Date().toISOString(),
          package_id: pkg.id,
          package_name: pkg.name,
          base_price: pkg.base_price ? Number(pkg.base_price) : 0,
          currency: pkg.currency ?? 'USD',
          contents: pkg.contents,
        } : Prisma.JsonNull,
      },
    });
    
    await this.packageCloneService.clonePackageToInquiry(inquiryId, newPackageId, tx);
    
    // ── STEP 3: Restore user data onto new schedule rows ──
    await this.restoreUserData(inquiryId, stash, tx);
  });
}
```

##### B1.2 The stash shape

```typescript
interface ScheduleUserDataStash {
  // Keyed by role template name (lowercase) e.g. "bride", "groom", "bridesmaids"
  subjects: Array<{
    roleName: string;         // Template name (e.g. "Bride")
    realName: string | null;  // User-entered
    notes: string | null;     // User-entered
    count: number | null;     // User-entered override
  }>;
  
  // Keyed by activity keyword + slot number
  locations: Array<{
    activityName: string | null;  // Activity this slot belongs to
    locationNumber: number;
    name: string | null;       // User-entered venue name
    address: string | null;    // User-entered address
    locationId: number | null; // Linked library location
    notes: string | null;      // User-entered
  }>;
  
  // Keyed by position_name + event day order
  crew: Array<{
    positionName: string;
    eventDayOrder: number;
    contributorId: number | null;  // Assigned crew member
    notes: string | null;
  }>;
  
  // Activity-level user customizations
  activities: Array<{
    name: string;
    eventDayOrder: number;
    startTime: string | null;  // User-adjusted time
    endTime: string | null;
    notes: string | null;
  }>;
}
```

##### B1.3 Stash extraction

```typescript
private async stashUserData(
  inquiryId: number,
  tx: Prisma.TransactionClient,
): Promise<ScheduleUserDataStash> {
  // Get subjects with real_name or notes filled
  const subjects = await tx.projectEventDaySubject.findMany({
    where: {
      inquiry_id: inquiryId,
      OR: [
        { real_name: { not: null } },
        { notes: { not: null } },
      ],
    },
    select: { name: true, real_name: true, notes: true, count: true },
  });
  
  // Get locations with user-entered data
  const locations = await tx.projectLocationSlot.findMany({
    where: {
      inquiry_id: inquiryId,
      OR: [
        { name: { not: null } },
        { address: { not: null } },
        { notes: { not: null } },
      ],
    },
    select: {
      location_number: true,
      name: true,
      address: true,
      location_id: true,
      notes: true,
      project_activity: { select: { name: true } },
    },
  });
  
  // Get crew with contributor assigned
  const crew = await tx.projectDayOperator.findMany({
    where: {
      inquiry_id: inquiryId,
      contributor_id: { not: null },
    },
    select: {
      position_name: true,
      contributor_id: true,
      notes: true,
      project_event_day: { select: { order_index: true } },
    },
  });
  
  return {
    subjects: subjects.map(s => ({
      roleName: s.name,
      realName: s.real_name,
      notes: s.notes,
      count: s.count,
    })),
    locations: locations.map(l => ({
      activityName: l.project_activity?.name ?? null,
      locationNumber: l.location_number,
      name: l.name,
      address: l.address,
      locationId: l.location_id,
      notes: l.notes,
    })),
    crew: crew.map(c => ({
      positionName: c.position_name,
      eventDayOrder: c.project_event_day?.order_index ?? 0,
      contributorId: c.contributor_id,
      notes: c.notes,
    })),
    activities: [], // Can add later if needed
  };
}
```

##### B1.4 Restore logic (best-effort matching)

```typescript
private async restoreUserData(
  inquiryId: number,
  stash: ScheduleUserDataStash,
  tx: Prisma.TransactionClient,
) {
  // ── Restore subject real_names ──
  // Match by role name (case-insensitive)
  for (const stashed of stash.subjects) {
    if (!stashed.realName && !stashed.notes) continue;
    
    const match = await tx.projectEventDaySubject.findFirst({
      where: {
        inquiry_id: inquiryId,
        name: { equals: stashed.roleName, mode: 'insensitive' },
      },
    });
    
    if (match) {
      await tx.projectEventDaySubject.update({
        where: { id: match.id },
        data: {
          ...(stashed.realName && { real_name: stashed.realName }),
          ...(stashed.notes && { notes: stashed.notes }),
        },
      });
    }
  }
  
  // ── Restore location data ──
  // Match by activity name + location number
  for (const stashed of stash.locations) {
    if (!stashed.name && !stashed.address && !stashed.notes) continue;
    
    const match = await tx.projectLocationSlot.findFirst({
      where: {
        inquiry_id: inquiryId,
        location_number: stashed.locationNumber,
        ...(stashed.activityName && {
          project_activity: {
            name: { equals: stashed.activityName, mode: 'insensitive' },
          },
        }),
      },
    });
    
    if (match) {
      await tx.projectLocationSlot.update({
        where: { id: match.id },
        data: {
          ...(stashed.name && { name: stashed.name }),
          ...(stashed.address && { address: stashed.address }),
          ...(stashed.locationId && { location_id: stashed.locationId }),
          ...(stashed.notes && { notes: stashed.notes }),
        },
      });
    }
  }
  
  // ── Restore crew assignments ──
  // Match by position name + event day order
  for (const stashed of stash.crew) {
    if (!stashed.contributorId) continue;
    
    const match = await tx.projectDayOperator.findFirst({
      where: {
        inquiry_id: inquiryId,
        position_name: { equals: stashed.positionName, mode: 'insensitive' },
        project_event_day: { order_index: stashed.eventDayOrder },
      },
    });
    
    if (match) {
      await tx.projectDayOperator.update({
        where: { id: match.id },
        data: {
          contributor_id: stashed.contributorId,
          ...(stashed.notes && { notes: stashed.notes }),
        },
      });
    }
  }
}
```

##### B1.5 Wire into the existing update flow

Change `handlePackageSelection()` to use the new stash/restore when a **previous package existed** (swap), vs. the current clean-clone when going from **no package → first package** (assign):

```typescript
async handlePackageSelection(
  inquiryId: number,
  newPackageId: number | null,
  brandId: number,
) {
  const inquiry = await this.prisma.inquiries.findUnique({
    where: { id: inquiryId },
    select: { source_package_id: true },
  });
  
  const hadPreviousPackage = !!inquiry?.source_package_id;
  
  if (newPackageId && hadPreviousPackage) {
    // SWAP — use stash & restore to preserve user data
    await this.swapPackage(inquiryId, newPackageId, brandId);
  } else if (newPackageId) {
    // FIRST ASSIGNMENT — clean clone (existing flow)
    await this.prisma.$transaction(async (tx) => {
      await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
      // ... existing clone logic ...
    });
  } else {
    // DESELECT — clear schedule
    await this.prisma.$transaction(async (tx) => {
      await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
      await tx.inquiries.update({
        where: { id: inquiryId },
        data: {
          source_package_id: null,
          package_contents_snapshot: Prisma.JsonNull,
        },
      });
    });
  }
}
```

#### B1.6 Frontend: Confirmation Dialog Before Swap

Add a confirmation dialog on the package selection page when changing from one package to another:

```
┌──────────────────────────────────────────────────┐
│  ⚠️  Swap Package?                               │
│                                                   │
│  Changing from "Premium Wedding" to "Essential    │
│  Wedding" will update the schedule structure.     │
│                                                   │
│  ✅ Preserved:                                    │
│     • Subject names (Bride: "Sarah", etc.)        │
│     • Location addresses                          │
│     • Crew assignments (where roles match)        │
│     • All estimates, quotes, and contracts        │
│                                                   │
│  ⚠️  May change:                                  │
│     • Number of event days / activities           │
│     • Film deliverables                           │
│     • Crew slots (if new package has fewer)       │
│                                                   │
│  [ Cancel ]                    [ Swap Package ]   │
└──────────────────────────────────────────────────┘
```

**Implementation:**
- In `/inquiries/[id]/package/page.tsx`, wrap the `handleSave()` in a dialog check.
- If `inquiry.source_package_id` exists and differs from the new selection, show the dialog.
- On confirm, proceed with save. On cancel, revert the select dropdown.

#### B1.7 Swap result feedback

After the swap completes, return a summary from the backend indicating what was restored:

```typescript
// Return from swapPackage()
return {
  success: true,
  restored: {
    subjects: 3,    // e.g., matched 3 of 4 subject names
    locations: 2,   // matched 2 of 3 location slots  
    crew: 1,        // matched 1 of 2 crew assignments
  },
  unmatched: {
    subjects: ['Flower Girl'],  // This role doesn't exist in new package
    crew: ['Drone Pilot'],      // This position doesn't exist in new package
  },
};
```

Display this in a snackbar or result panel so the user knows what to re-enter.

---

### Feature C: Inquiry-Level Budget Field (Optional Enhancement)

Currently budget lives only inside `needs_assessment_submissions.responses.budget_range` (JSON). If we want the studio to set/override budget independently of the NA:

#### C1. Add `budget_min` and `budget_max` to inquiries table

```prisma
model inquiries {
  // ... existing fields ...
  budget_min    Decimal?   // e.g. 5000.00
  budget_max    Decimal?   // e.g. 10000.00
}
```

**Why numeric instead of string:**
- Enables package suggestion queries: `WHERE base_price BETWEEN budget_min AND budget_max`
- Enables sorting/filtering inquiries by budget
- Cleaner than parsing "$5,000 - $10,000" strings

#### C2. Auto-populate from NA submission

When NA is submitted with `budget_range`, parse it and store on the inquiry:

```typescript
// In needs-assessments.service.ts, after inquiry creation:
const [min, max] = parseBudgetRange(responses.budget_range);
if (min !== null) {
  await tx.inquiries.update({
    where: { id: inquiryId },
    data: { budget_min: min, budget_max: max },
  });
}
```

#### C3. Editable in PackageScopeCard

When no package is selected, show budget fields that can be edited:

```
┌─────────────────────────────────────┐
│  📦 Package Scope                   │
│                                     │
│  Budget Range:                      │
│  [$5,000] — [$10,000]  ✏️          │
│                                     │
│  Select a package…  ▾              │
│  💡 2 packages match this budget    │
│                                     │
│  [ Assign Package ]                 │
└─────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Studio-Side Package Assignment (Feature A)
**Scope:** Frontend-only changes to PackageScopeCard
**Effort:** Small
**Files changed:**
- `PackageScopeCard.tsx` — add Select dropdown + Assign button in empty state
- Possibly add an API hook for fetching available packages if not already cached

### Phase 2: Safe Package Swap (Feature B)
**Scope:** Backend stash/restore + frontend confirmation dialog
**Effort:** Medium
**Files changed:**
- `packages/backend/src/inquiries/inquiries.service.ts` — add `stashUserData()`, `restoreUserData()`, modify `handlePackageSelection()`
- `packages/frontend/src/app/(studio)/sales/inquiries/[id]/package/page.tsx` — add confirmation dialog
- `packages/frontend/src/app/(studio)/sales/inquiries/[id]/components/PackageScopeCard.tsx` — swap feedback

### Phase 3: First-Class Budget Field (Feature C)
**Scope:** Schema migration + backend + frontend
**Effort:** Small-Medium
**Files changed:**
- `packages/backend/prisma/schema.prisma` — add `budget_min`, `budget_max`
- `packages/backend/src/inquiries/inquiries.service.ts` — populate from NA
- `PackageScopeCard.tsx` — editable budget display
- `UpdateInquiryDto` — add budget fields

---

## What's Already Safe (No Changes Needed)

| Data | On swap | Reason |
|------|---------|--------|
| Estimates | ✅ Preserved | Separate FK `estimates.inquiry_id`, not in schedule snapshot |
| Quotes | ✅ Preserved | Separate FK `quotes.inquiry_id` |
| Contracts | ✅ Preserved | Separate FK `contracts.inquiry_id` |
| Proposals | ✅ Preserved | Separate FK `proposals.inquiry_id` |
| Activity logs | ✅ Preserved | Separate FK `activity_logs.inquiry_id` |
| Calendar events | ✅ Preserved | Separate FK `calendar_events.inquiry_id` |
| Inquiry tasks | ✅ Preserved | Separate FK `inquiry_tasks.inquiry_id` |
| Contact info | ✅ Preserved | On `contacts` table, not schedule |
| NA submissions | ✅ Preserved | Separate FK `needs_assessment_submissions.inquiry_id` |
| Venue on inquiry | ✅ Preserved | Direct fields on `inquiries` table |
| Discovery questionnaire | ✅ Preserved | Separate FK |

---

## Edge Cases to Handle

1. **Swap to package with fewer roles** — Some stashed subjects may not match. Return these as "unmatched" so user knows to re-enter.

2. **Swap to package with different event structure** — If old package had 2 event days and new has 1, some location/crew data keyed to day 2 won't match. Best-effort is fine; the swap summary tells the user.

3. **Deselecting package entirely** — Should still stash data to `package_contents_snapshot` JSON as a safety net, even though schedule rows get deleted. This way a future re-assignment can attempt restore.

4. **Rapid successive swaps** — Each swap stashes from current state (which may be partially restored from a previous swap). This is fine — each swap builds on whatever's there.

5. **Package with same roles but different names** — e.g., "Bride" vs "Partner 1". The match is case-insensitive by `name` field, so renamed roles won't auto-match. Future enhancement: match by `role_template_id` for better accuracy.

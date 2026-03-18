# Auto Task Visual Treatment — Implementation Plan

**Status:** ✅ Complete  
**Surfaces:** PhaseOverview pipeline card · GlobalTaskDrawer · Active Tasks Dashboard  

---

## Core Principle

Auto tasks are owned by **the system**, not by any person. They fire when a business event occurs (contract signed, booking confirmed, etc.). The UI should reflect this:

- They are **not actionable** — no checkbox, no assignee
- They should be **visually quieter** than manual tasks (ghosted)
- They should be **identifiable** — amber ⚡ bolt icon replaces the checkbox
- They should be **hideable** — a toggle to filter them out when the user only wants to see their work

---

## Open Questions — **Answered & Implemented**

> **Q1 — Show/hide persistence: YES** — `localStorage` keys `pfo_drawer_show_auto` + `pfo_tasks_show_auto`

> **Q2 — Stats when auto tasks are hidden: YES** — `filteredTasks` hides rows; `tasks.length` totals always include auto tasks

> **Q3 — Hero section behaviour: Skip auto** — Hero skips auto tasks, shows next manual task. When blocking task is auto: italic amber title + "⚡ System handling · awaiting trigger" subtitle

> **Q4 — Click behaviour: No tooltip** — Ghost styling makes auto tasks self-evidently non-actionable

---

## Data Layer Changes

### Backend — `calendar.service.ts` `getActiveTasks()`

The inquiry_tasks query does not currently include the `task_library` join, so `is_auto_only` is never returned.

**Change:** Add `task_library` to the include and map `is_auto_only` onto the unified result.

```ts
// In prisma query include block for inquiry_tasks:
task_library: { select: { is_auto_only: true } }

// In the .map():
is_auto_only: t.task_library?.is_auto_only ?? false,
```

**File:** `packages/backend/src/calendar/calendar.service.ts` (~line 672)

---

### Frontend Types

| File | Change |
|---|---|
| `packages/frontend/src/lib/types/task-library.ts` | Add `is_auto_only?: boolean` to `ActiveTask` |
| `packages/frontend/src/lib/types/domains/sales.ts` | Add `is_auto_only?: boolean` to `InquiryTask.task_library` nested shape |
| `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_lib/types.ts` | Add `is_auto_only?: boolean` to `PipelineTask` |
| `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_lib/constants.ts` | `buildPipelineTasksFromInquiry()` — pass `is_auto_only: t.task_library?.is_auto_only ?? false` |

**Detection fallback:** Until the data is flowing, badge/ghost logic can fall back to the name-based map: `!!TASK_AUTO_COMPLETE[task.name]`. This will be replaced by the DB field once wired.

---

## Surface 1 — PhaseOverview Pipeline Card

**File:** `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_components/PhaseOverview.tsx`

### Stage dot bolt badge

Currently: static dot with CheckCircle / StageIcon.  
**Change:** Show amber ⚡ Bolt badge (`position: absolute, bottom: -2px, right: -2px, fontSize: 10px`) on a stage dot **only when that stage's next incomplete task is an auto task** — not permanently.

This keeps the badge meaningful: it reads as "the system is working on this right now", not just "this stage has automation somewhere".

```tsx
// Pseudocode for badge condition:
const nextTask = stage.tasks.find(t => t.status !== 'Completed');
const nextIsAuto = nextTask && (nextTask.is_auto_only || !!TASK_AUTO_COMPLETE[nextTask.name]);
// Only render badge if nextIsAuto === true
```

### Hero section `currentSubTask`

Currently: first incomplete task in the active stage, regardless of type.  
**Change:** Find the first incomplete **manual** task for normal hero rendering. If the only pending task(s) are auto, show a system-handling state.

```tsx
const currentManualTask = activeStage.tasks.find(
  t => t.status !== 'Completed' && !t.is_auto_only && !TASK_AUTO_COMPLETE[t.name]
);
const pendingAutoTask = activeStage.tasks.find(
  t => t.status !== 'Completed' && (t.is_auto_only || !!TASK_AUTO_COMPLETE[t.name])
);
```

**Hero states:**
- `currentManualTask` → render as today (task name, description, effort hours)
- `!currentManualTask && pendingAutoTask` → render "⚡ System handling — [task name]" in muted amber, italic description, no effort hours
- Neither → stage is complete, no hero task

### Tooltip auto task rows

Already shows `auto` italic text. **Change:** swap that text for a `⚡` icon + "Auto" text, consistent with the new visual language.

---

## Surface 2 — GlobalTaskDrawer

**File:** `packages/frontend/src/app/(studio)/components/GlobalTaskDrawer.tsx`

### Per-row treatment (`DrawerTaskRow`)

| Column | Manual task (today) | Auto task (new) |
|---|---|---|
| Check (col 2) | ○ UncheckedIcon or ✓ CheckCircle | ⚡ Bolt (amber, not interactive) |
| Name | Normal weight | Muted (opacity 0.5), italic |
| Status pill | Normal STATUS_CFG pill | "Auto" amber pill, same shape |
| Assignee avatar | Shows person / dashed empty | "System" — small ⚡ or hidden |

**Note on Bolt semantic conflict:** The Bolt in the current code already appears in col 7 (rightmost) as a hover-reveal history toggle. This is a different column, so no collision — bolt in col 2 = task type; bolt in col 7 = history. This is fine.

**Ghost styling (opacity + italic):**
```tsx
sx={{
  opacity: isAuto ? 0.5 : (isCompleted ? 0.55 : 1),
  // name text:
  fontStyle: isAuto ? 'italic' : 'normal',
}}
```

### Show/hide toggle

Add a small toggle in the drawer header bar (next to "Group by stage" toggle):

```
[ ⚡ Auto ] — toggles show/hide of auto task rows
```

State: `showAuto` (boolean, default `true`, persisted to localStorage key `pfo_drawer_show_auto`).

**When hidden:** `visibleTasks` filters out items where `t.task_library?.is_auto_only` (or name lookup). Stats still count them.

### Auto task count badge

When auto tasks are hidden, show a small muted pill in the header: "3 automated hidden" — so the user knows they exist.

---

## Surface 3 — Active Tasks Dashboard

**File:** `packages/frontend/src/app/(studio)/manager/active-tasks/page.tsx`

### Per-row treatment (`TaskRow`)

Matches the drawer treatment exactly:

| Column | Auto task change |
|---|---|
| Check icon | Replace `UncheckedIcon` with amber Bolt (no click handler) |
| Task name | Muted opacity (0.5), italic |
| Status pill | Replace `StatusPill` with amber "Auto" pill |
| Assignee cell (`AssigneeCell`) | Replace with "System" label — no popover, no picker |

**Ghost row background:** Add a very subtle amber tint on auto task rows:
```tsx
bgcolor: isAuto ? 'rgba(253,171,61,0.025)' : (hovered && navUrl ? 'rgba(87,155,252,0.035)' : 'transparent')
```

### Show/hide toggle

Add to the filter toolbar row (next to search, grouping toggles):

```
[ ⚡ Show automated ] — ToggleButton
```

State: `showAuto` (boolean, default `true`, localStorage key `pfo_tasks_show_auto`).

**When hidden:** filter auto tasks from the rendered list. Display counts can either include or exclude them depending on Q2 answer.

### `AssigneeCell` — block render for auto tasks

Auto tasks should not show the assignee popover at all. Simple guard:

```tsx
// In TaskRow:
{isAuto
  ? <Box sx={{ px: 1.5 }}><Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>System</Typography></Box>
  : <AssigneeCell ... />
}
```

---

## Implementation Order

| Step | Work | Risk |
|---|---|---|
| 1 | Backend: add `is_auto_only` to `getActiveTasks()` response | Low |
| 2 | Frontend types: `ActiveTask`, `InquiryTask`, `PipelineTask` | Low |
| 3 | `buildPipelineTasksFromInquiry()` passes `is_auto_only` | Low |
| 4 | `PhaseOverview` — fix hero `currentSubTask` (edge case 2) | Medium |
| 5 | `PhaseOverview` — bolt badge on stage dots | Low |
| 6 | `GlobalTaskDrawer` — row ghosting + bolt + Auto pill | Low |
| 7 | `GlobalTaskDrawer` — show/hide toggle + localStorage | Low |
| 8 | Active tasks page — row ghosting + bolt + Auto pill + System assignee | Low |
| 9 | Active tasks page — show/hide toggle + localStorage | Low |
| 10 | Verify compile, no regressions | - |

Steps 4–9 are independent of each other once the types are wired (steps 1–3). Steps 6–7 and 8–9 can be done in parallel.

---

## What We Are NOT Doing

- No `assigned_to_id` or `job_role_id` on auto tasks — system owns them, nobody to assign or nudge
- No notification/escalation system for stuck auto tasks — that's a separate future feature
- No changes to how auto completion logic fires (TASK_AUTO_COMPLETE hooks stay as-is)
- No schema migration — `is_auto_only` already exists in the DB, just not flowing to frontend yet

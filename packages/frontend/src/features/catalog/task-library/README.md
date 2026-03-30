# Task Library Feature

**Bucket:** `catalog`  
**Path:** `features/catalog/task-library/`

## Purpose

Manages the task library — the catalog of reusable task templates that can be auto-generated into inquiry tasks or project tasks. Tasks are organized by project phase (Lead, Inquiry, Booking, etc.).

## Architecture

```
api/          createTaskLibraryApi(client) — wraps /task-library backend endpoints
hooks/        useTaskLibraryData, useTaskLibraryMutations, useTaskLibraryDnd, useTaskLibraryRoleSkills, useTaskDetail
components/   17 UI components (see key files below)
  detail/     Tab panels (TaskDetailsTab, TaskPerformanceTab) — kept for reference
screens/      TaskLibraryScreen — main admin list with inline detail panel
types/        Canonical feature-owned task-library shapes and trigger enums
```

### Key component files

| File | Lines | Role |
|------|-------|------|
| `TaskTable.tsx` | ~200 | Thin shell — renders table head, iterates render items, delegates to sub-components |
| `SortableTaskRow.tsx` | ~500 | Display + inline-edit row with drag handle, expandable role/skills panel; emits onRowClick/onRowHover |
| `TaskDetailPanel.tsx` | ~350 | Right-panel showing full task details — hover = preview, click = sticky. Includes Task Workflow section for subtask templates |
| `TasksContent.tsx` | ~260 | 2-column layout: left (65%) task table + right (35%) sticky TaskDetailPanel |
| `TaskQuickAddRow.tsx` | ~350 | Quick-add form row — name, role, hours, trigger, stage selector |
| `TaskGroupHeaderRow.tsx` | ~70 | Task group header row with + button for quick-add |
| `TaskAccordion.tsx` | ~90 | Wraps shared `TaskGroupHeader` for phase accordion |
| `PhaseCardsGrid.tsx` | ~150 | Phase summary cards using `getPhaseConfig()` for colors/icons |
| `DragOverlayTask.tsx` | ~80 | Drag overlay using `getPhaseConfig()` colors |
| `DroppableZone.tsx` | ~60 | Drop zone using `getPhaseConfig()` colors |

## Key Flows

- **List view** (`TaskLibraryScreen`): Loads tasks grouped by phase via `taskLibraryApi.getGroupedByPhase()`. Phase groups render as `TaskGroupHeader` (shared UI from `shared/ui/tasks/`) with the same compact collapsible header style used by Active Tasks. Supports inline edit, quick add, delete, drag-drop reordering (cross-phase aware), and role/skills assignment.
- **Right panel** (`TaskDetailPanel`): Hover over a row to preview task details on the right. Click to pin/sticky. Click phase card or click same row again to dismiss. Shows: description, pricing, trigger, due offset, role/skills/crew, and a Task Workflow section listing automated vs manual subtask templates.
- **DnD**: `useTaskLibraryDnd` handles both same-phase reordering and cross-phase moves — it calls `batchUpdateOrder` for both source and target phases after a cross-phase drop.
- **Role/Skills**: `useTaskLibraryRoleSkills` updates `default_job_role_id` and `skills_needed` on a task. Child tasks exist in both the flat phase array AND inside parent `.children[]` — both are updated in a single pass.
- **Crew assignment**: task defaults use `default_crew_id` and the `PER_CREW` trigger value, matching the current backend schema.

## Brand Scoping

Brand context flows through the `BrandProvider` — no `brandId` params on API calls; the backend resolves brand from `X-Brand-Context` header.

## Related modules
- **Shared UI**: `shared/ui/tasks/` — TaskGroupHeader, TaskSummaryStrip, TaskColumnHeaders, phaseConfig
- **Active Tasks**: `features/workflow/tasks` — consumes the same shared primitives for visual alignment
- **Backend**: `packages/backend/src/catalog/task-library`

## Route Shells

- `/catalog/task-library` → renders `<TaskLibraryScreen />`

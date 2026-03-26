# Task Library Feature

**Bucket:** `catalog`  
**Path:** `features/catalog/task-library/`

## Purpose

Manages the task library — the catalog of reusable task templates that can be auto-generated into inquiry tasks or project tasks. Tasks are organized by project phase (Lead, Inquiry, Booking, etc.).

## Architecture

```
api/          createTaskLibraryApi(client) — wraps /task-library backend endpoints
hooks/        useTaskLibraryData, useTaskLibraryMutations, useTaskLibraryDnd, useTaskLibraryRoleSkills, useTaskDetail
components/   14 UI components (TaskTable, SortableTaskRow, TaskRoleSkillsPanel, etc.)
  detail/     Tab panels for the detail screen (TaskDetailsTab, TaskPerformanceTab)
screens/      TaskLibraryScreen — main admin list, TaskDetailScreen — per-task form
types/        (re-exports from @/lib/types for feature-owned shapes)
```

## Key Flows

- **List view** (`TaskLibraryScreen`): Loads tasks grouped by phase via `taskLibraryApi.getGroupedByPhase()`. Supports inline edit, quick add, delete, drag-drop reordering (cross-phase aware), and role/skills assignment.
- **Detail view** (`TaskDetailScreen`): Single task form with auto-save (2s debounce). Two tabs: Details and Performance.
- **DnD**: `useTaskLibraryDnd` handles both same-phase reordering and cross-phase moves — it calls `batchUpdateOrder` for both source and target phases after a cross-phase drop.
- **Role/Skills**: `useTaskLibraryRoleSkills` updates `default_job_role_id` and `skills_needed` on a task. Child tasks exist in both the flat phase array AND inside parent `.children[]` — both are updated in a single pass.

## Brand Scoping

Brand context flows through the `BrandProvider` — no `brandId` params on API calls; the backend resolves brand from `X-Brand-Context` header.

## Route Shells

- `/manager/tasks` → renders `<TaskLibraryScreen />`
- `/manager/tasks/[id]` → renders `<TaskDetailScreen taskId={id} />`

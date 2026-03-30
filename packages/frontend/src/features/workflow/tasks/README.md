# features/workflow/tasks

Active task management across all inquiries and projects.

## Purpose

Provides a unified dashboard showing all tasks from both inquiry pipelines and active projects. Supports grouping, filtering, inline assignment, status toggling, and deep-link navigation to the originating record.

## Architecture

```
features/workflow/tasks/
├── api/index.ts                  # createActiveTasksApi factory (patch-based assign/toggle)
├── constants/index.ts            # GroupMode, GRID_COLS, PHASE_*, STATUS_*, DATE_*
├── types/index.ts                # Feature type re-exports (ActiveTask, TaskGroupData)
├── utils/
│   ├── helpers.ts                # formatDueDate, getDateGroup, getInitials, avatarColor,
│   │                             #   getNavigationUrl, buildTaskTree
│   └── group-tasks.ts            # groupTasks() — pure grouping logic (no JSX)
├── components/
│   ├── GroupIcons.tsx             # Icon components for group headers (project, status, person, date)
│   ├── StatusPill.tsx            # Status badge + ColumnHeaders row
│   ├── SummaryStrip.tsx          # Count/hours stats row (wraps shared TaskSummaryStrip)
│   ├── AssigneeCell.tsx          # Clickable avatar + Popover picker
│   ├── TaskRow.tsx               # Single task row with subtask expand
│   ├── TaskGroupRow.tsx          # Collapsible task group header with progress
│   ├── TaskGroup.tsx             # Wraps shared TaskGroupHeader + tree + footer
│   ├── ActiveTasksToolbar.tsx    # Group mode, filters, search
│   └── index.ts                  # Barrel
├── screens/
│   └── ActiveTasksScreen.tsx     # Full page — state, handlers, board JSX
└── index.ts                      # Feature barrel
```

## Key Flows

### Loading
`ActiveTasksScreen` calls `activeTasksApi.getAll()` + `userAccountsApi.getAll()` in parallel on mount. Crew data is loaded from the workflow crew API surface.

### Grouping
`groupTasks(filteredTasks, groupMode)` in `utils/group-tasks.tsx` returns `TaskGroupData[]`. Supports: project (default), status, person, date, phase.

### Task Tree
`buildTaskTree(tasks)` separates task groups (with `is_task_group=true`) from regular tasks. Groups render as `TaskGroupRow` with children nested inside. Regular tasks render as `TaskRow`. Subtasks (`task_kind='subtask'`) are rendered nested inside their parent via `subtasksByParent` Map.

### Optimistic Updates
Both `handleAssign` and `handleToggle` update local state immediately, then call the API. On error, `loadTasks()` refetches. Toggle also propagates completion state up to parent tasks/stages.

### Navigation
`getNavigationUrl(task)` maps tasks back to the correct section of the inquiry or project detail page using `subtask_key` mappings and name-based keyword matching.

## Related modules
- **Shared UI**: `shared/ui/tasks/` — TaskGroupHeader, TaskSummaryStrip, TaskColumnHeaders, phaseConfig
- **Task Library**: `features/catalog/task-library` — template definitions that generate active tasks
- **Backend**: `packages/backend/src/workflow/tasks`

## API Notes
- Uses feature `activeTasksApi` from `api/index.ts` for active-task operations (getAll, assign, toggle).
- Uses `userAccountsApi.getAll()` to load crew assignees.
- `taskLibraryApi.syncCrew()` is still the current task-library sync method name (contract-level rename pending).

## Brand Scoping
No brandId needed — active tasks are brand-scoped via the `X-Brand-Context` header automatically.

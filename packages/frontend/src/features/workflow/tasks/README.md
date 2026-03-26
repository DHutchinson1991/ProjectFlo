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
│   ├── SummaryStrip.tsx          # Count/hours stats row
│   ├── AssigneeCell.tsx          # Clickable avatar + Popover picker
│   ├── TaskRow.tsx               # Single task row with subtask expand
│   ├── StageRow.tsx              # Collapsible stage header with progress
│   ├── TaskGroup.tsx             # Collapsible group header + tree + footer
│   ├── ActiveTasksToolbar.tsx    # Group mode, filters, search
│   └── index.ts                  # Barrel
├── screens/
│   └── ActiveTasksScreen.tsx     # Full page — state, handlers, board JSX
└── index.ts                      # Feature barrel
```

## Key Flows

### Loading
`ActiveTasksScreen` calls `api.activeTasks.getAll()` + `api.contributors.getAll()` in parallel on mount. Contributors use frozen `api` because no workflow feature factory is needed — contributors are shared across features.

### Grouping
`groupTasks(filteredTasks, groupMode)` in `utils/group-tasks.tsx` returns `TaskGroupData[]`. Supports: project (default), status, person, date, phase.

### Task Tree
`buildTaskTree(tasks)` separates stages (with `is_stage=true`) from regular tasks. Stages render as `StageRow` with children nested inside. Regular tasks render as `TaskRow`. Subtasks (`task_kind='subtask'`) are rendered nested inside their parent via `subtasksByParent` Map.

### Optimistic Updates
Both `handleAssign` and `handleToggle` update local state immediately, then call the API. On error, `loadTasks()` refetches. Toggle also propagates completion state up to parent tasks/stages.

### Navigation
`getNavigationUrl(task)` maps tasks back to the correct section of the inquiry or project detail page using `subtask_key` mappings and name-based keyword matching.

## API Notes
- Uses feature `activeTasksApi` from `api/index.ts` for active-task operations (getAll, assign, toggle).
- `api.contributors.getAll()` uses frozen `lib/api.ts` — contributors are a shared resource (TODO: migrate when contributors feature is created).
- `taskLibraryApi.syncContributors()` used for "Sync People" button (from catalog feature).

## Brand Scoping
No brandId needed — active tasks are brand-scoped via the `X-Brand-Context` header automatically.

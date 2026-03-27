# Tasks Module (`workflow/tasks`)

Manages all task-related functionality for the workflow bucket.

## Structure

```
workflow/tasks/
├── tasks.module.ts              # NestJS module (TasksModule)
├── active-tasks.controller.ts   # Cross-cutting active-tasks board endpoints (calendar/ prefix)
├── inquiry/                     # Inquiry-specific task management
│   ├── inquiry-tasks.controller.ts
│   ├── inquiry-subtasks.controller.ts
│   ├── constants/
│   │   └── inquiry-task-subtasks.constants.ts
│   ├── dto/
│   │   ├── toggle-inquiry-task.dto.ts
│   │   └── update-inquiry-task.dto.ts
│   └── services/
│       ├── inquiry-tasks.service.ts          # Facade (delegates to lifecycle + generator)
│       ├── inquiry-task-lifecycle.service.ts  # CRUD, toggle, status sync, side effects
│       └── inquiry-task-generator.service.ts  # Task generation, auto-complete, auto-assign
├── services/
│   └── active-tasks.service.ts   # Cross-cutting queries across inquiry + project tasks
└── mappers/
    └── active-tasks-row.mapper.ts  # Pure row-mapping functions (no DI)
```

## Key Concepts

### Inquiry Tasks
- 100% inquiry-specific: every method operates on `inquiry_tasks` or `inquiry_task_subtasks` tables
- `InquiryTasksService` is a facade preserving the class name for 27+ consumers
- Lifecycle service handles: toggle, update, subtask sync, status rollup, verification, side effects
- Generator service handles: task generation from library, auto-complete by name, auto-assign by role
- Circular dependency with `ContractsModule` via `forwardRef`

### Active Tasks
- Cross-cutting service that queries both `inquiry_tasks` and `project_tasks`
- Powers the task board and calendar task overlays
- Routes keep `calendar/` prefix for backward compatibility

## API Endpoints

### Inquiry Tasks (`api/inquiries/:inquiryId/tasks`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List tasks for inquiry |
| PATCH | `/:taskId` | Update task |
| PATCH | `/:taskId/toggle` | Toggle task completion |
| POST | `/generate` | Generate tasks from library |
| GET | `/:taskId/events` | Get task audit events |

### Inquiry Subtasks (`api/inquiries/:inquiryId/subtasks`)
| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/:subtaskId/toggle` | Toggle subtask completion |

### Active Tasks (`calendar/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | Tasks for date range |
| GET | `/active-tasks` | Active task board |
| PATCH | `/active-tasks/:taskId/assign` | Assign task |
| PATCH | `/active-tasks/:taskId/toggle` | Toggle task |

## Exports (from TasksModule)
- `InquiryTasksService` — facade for inquiry task operations
- `InquiryTaskLifecycleService` — direct lifecycle access (used by contracts)
- `ActiveTasksService` — cross-cutting task queries

# Workflows

## What this module does
Manages workflow templates — reusable sequences of tasks that can be assigned to service packages. Each template contains ordered tasks from the task library, with optional overrides for hours, assignee role, and phase.

## Key files
| File | Purpose |
|------|---------|
| `workflows.service.ts` | Template CRUD + brand access checks |
| `services/workflow-template-tasks.service.ts` | Add/remove/sync/toggle tasks within a template, preview task generation |
| `workflows.controller.ts` | REST endpoints for templates + template tasks |
| `dto/create-workflow-template.dto.ts` | Create template payload |
| `dto/update-workflow-template.dto.ts` | Update template payload |
| `dto/add-template-task.dto.ts` | Add single task to template |
| `dto/sync-template-tasks.dto.ts` | Bulk sync tasks (replace all) |
| `dto/update-template-task.dto.ts` | Update task overrides |
| `dto/toggle-template-task.dto.ts` | Toggle task on/off by library ID |

## Business rules / invariants
- Templates are brand-scoped; `checkBrandAccess` enforces ownership via user → brand membership.
- One template per brand can be `is_default: true`.
- Template tasks reference `task_library` entries; overrides (hours, role, phase) are stored per-template-task.
- Syncing tasks replaces all existing template-task links in a transaction.
- Preview generates a read-only projection of what auto-generated tasks would look like.

## Related modules
- **Backend**: `../../business/task-library` — source of task definitions
- **Backend**: `../pricing` — uses template task preview for cost estimation
- **Frontend**: `features/catalog/workflows` — workflow template builder UI

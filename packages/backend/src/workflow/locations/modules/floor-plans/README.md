# Floor Plans

## What this module does
CRUD for floor plans within location spaces. Supports creation, update, deletion, and duplication of floor plans, optionally scoped to a project.

## Key files
| File | Purpose |
|------|---------|
| `floor-plans.controller.ts` | REST endpoints under `api/locations` for floor plan CRUD |
| `floor-plans.service.ts` | Business logic for floor plan management |
| `floor-plans.module.ts` | NestJS module registration |

## Business rules / invariants
- Floor plans belong to a space (`space_id` required).
- Floor plans can optionally be scoped to a project (`project_id`).
- Duplication creates a copy of a floor plan, optionally targeting a different project.

## Related modules
- **Backend**: `workflow/locations/modules/spaces/` — parent space
- **Backend**: `workflow/locations/modules/plan-objects/` — objects placed on floor plans
- **Frontend**: `features/workflow/locations/` — location/floor plan editor UI

# Plan Objects

## What this module does
CRUD for floor plan objects (furniture, equipment, markers, etc.) that can be placed on floor plans. Includes category-based lookup.

## Key files
| File | Purpose |
|------|---------|
| `plan-objects.controller.ts` | REST endpoints under `api/locations` for plan object CRUD |
| `plan-objects.service.ts` | Business logic for plan object management |
| `plan-objects.module.ts` | NestJS module registration |

## Business rules / invariants
- Plan objects have a category (furniture, equipment, etc.) and are brand-scoped.
- Objects are reusable definitions that can be placed on any floor plan.

## Related modules
- **Backend**: `workflow/locations/modules/floor-plans/` — floor plans reference these objects
- **Frontend**: `features/workflow/locations/` — floor plan editor with object palette

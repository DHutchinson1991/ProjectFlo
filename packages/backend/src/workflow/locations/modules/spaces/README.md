# Spaces

## What this module does
CRUD for location spaces within venues. A space is a named area inside a venue (e.g., "Main Hall", "Garden Area") where events or scenes can take place.

## Key files
| File | Purpose |
|------|---------|
| `spaces.controller.ts` | REST endpoints under `api/locations` for space CRUD |
| `spaces.service.ts` | Business logic for space management |
| `spaces.module.ts` | NestJS module registration |

## Business rules / invariants
- Every space belongs to a venue (`location_id` required).
- Spaces have a category field for classification.
- Floor plans are created within spaces.

## Related modules
- **Backend**: `workflow/locations/modules/venues/` — parent venue
- **Backend**: `workflow/locations/modules/floor-plans/` — floor plans live within spaces
- **Frontend**: `features/workflow/locations/` — location management UI

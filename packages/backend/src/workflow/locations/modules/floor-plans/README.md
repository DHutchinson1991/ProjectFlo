# Floor Plans

## What this module does
Owns editable location floor plans and package space-slot floor plans. It keeps slot spatial state synced with package activity assignments, applies deterministic starter layouts, and exposes the blocking-environment context consumed by AI blocking.

## Key files
| File | Purpose |
|------|---------|
| `floor-plans.module.ts` | Registers the floor-plan controllers and split services |
| `space-slot-spatial.service.ts` | Owns slot read-side queries that do not mutate assignment-backed state |
| `space-slot-spatial-sync.service.ts` | Owns assignment-driven slot sync and sync-backed read routes |
| `space-slot-spatial-editor.service.ts` | Owns slot canvas writes, marker updates, overrides, and zone mutations |
| `space-slot-layout.service.ts` | Applies idempotent presets and ceremony starter layouts |
| `space-slot-blocking-environment.service.ts` | Builds the AI blocking environment and resolved-facing data |
| `space-slot-spatial-read.controller.ts` | Space-slot read and sync-backed routes under `api/space-slots` |
| `space-slot-spatial-editor.controller.ts` | Space-slot mutation routes under `api/space-slots` |
| `space-slot-blocking-environment.controller.ts` | AI environment routes under `api/space-slots/:slotId/blocking-environment` |

## Business rules / invariants
- Base camera and subject rows are seeded from package activity assignments before blocking runs.
- Legacy ceremony auto-seeded camera rows that still sit on the old seating-area coordinates are migrated to aisle/perimeter starter positions with per-camera base FOV values; manual floor-plan edits are preserved.
- Assignment-backed reads (`by-activity`, `by-package`) are allowed to sync slot state before returning data.
- Layout seeding is deterministic and idempotent; it must not overwrite partially edited slots.
- Blocking environment assembly reads base slot state plus moment overrides; it does not own floor-plan persistence.
- Floor-plan semantics are driven by objects and zones; anchors are no longer part of the public contract.
- Editor writes are isolated from read/sync logic so slot persistence changes do not widen the sync service.
- Read and write routes stay on the same public `api/space-slots` surface, but are implemented by separate controllers.
- Ceremony seating is encoded as `CHAIR_ROW` objects with metadata so downstream AI and overlays can address seats without per-seat rows.

## Related modules
- **Backend**: `src/ai/blocking` - consumes blocking-environment context for per-moment AI blocking.
- **Backend**: `src/catalog/packages/creation` - applies default sandbox layouts during package creation.
- **Frontend**: `features/workflow/locations` - owns the space-slot floor-plan API bindings and editor hooks.
- **Frontend**: `features/content/content-builder` - consumes package-mode spatial data while editing blocking.
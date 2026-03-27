# service-package-categories

## What this module does
Simple CRUD for service package categories — labels that group packages (e.g., "Wedding", "Birthday"). Typically auto-created when an event type is provisioned, but can also be managed manually.

## Key files
| File | Purpose |
|------|---------|
| `service-package-categories.service.ts` | CRUD (create, findAll, update, remove) |
| `service-package-categories.controller.ts` | REST endpoints at `brands/:brandId/package-categories` |
| `dto/service-package-category.dto.ts` | Create/Update DTOs |

## Business rules / invariants
- Ordered by `order_index`.
- Categories are usually auto-synced from `EventTypesService.syncPackageCategory` when event types are created, but this endpoint allows manual management.
- Linked to event types via `event_type_id`.

## Data model notes
- **service_package_categories** — brand-scoped, one per event type.

## Related modules
- **Backend**: `../event-types` — auto-syncs categories on event type CRUD
- **Frontend**: `features/catalog/service-packages`

# event-subtypes

## What this module does
Manages event subtypes — granular templates within an event type (e.g., "Traditional Wedding", "Elopement"). Each subtype includes activities, moments, locations, and subjects. Supports both system-seeded (global) and brand-specific subtypes. This module is read-only over the REST API: there is no "create package from subtype" flow — package creation is driven from event types (`../packages/creation`).

## Key files
| File | Purpose |
|------|---------|
| `event-subtypes.service.ts` | Read-only queries (findAll, findOne, system-seeded, brand-specific) |
| `event-subtypes.controller.ts` | REST endpoints (list, detail) |

## Business rules / invariants
- System-seeded subtypes (`brand_id: null`, `is_system_seeded: true`) are available to all brands.
- Brand-specific subtypes supplement system ones.
- This module does not create packages. Use `PackageCreationService.createForCatalog` via `POST /api/packages/from-template/:eventTypeId` instead.

## Data model notes
- **eventSubtype** — template with nested activities → moments, locations, subjects.

## Related modules
- **Backend**: `../event-types` — parent category of subtypes
- **Backend**: `../packages/creation` — owns all package creation (template-based or assessment-based)
- **Frontend**: `features/catalog/event-subtypes`


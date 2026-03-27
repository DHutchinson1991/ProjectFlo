# event-types

## What this module does
Manages event type templates (Wedding, Birthday, etc.) — the top-level category of events a brand offers. Supports linking event day templates and subject roles, and creating full service packages via a wizard.

## Key files
| File | Purpose |
|------|---------|
| `event-types.service.ts` | CRUD + category sync |
| `services/event-types-linking.service.ts` | Event-day and subject-role link/unlink operations |
| `services/event-types-package-builder.service.ts` | Orchestrates service package creation from wizard selections |
| `services/event-types-day-content-builder.service.ts` | Day-level content creation (activities, subjects, locations, equipment) |
| `services/event-types-crew-builder.service.ts` | Crew/equipment assignment helpers for package creation |
| `event-types.controller.ts` | REST endpoints (CRUD, day/role links, package creation) |
| `dto/create-package-from-event-type.dto.ts` | Wizard DTO (days, activities, crew, equipment) |
| `dto/*.dto.ts` | One-class-per-file DTO set for CRUD, links, and wizard nested payloads |

## Business rules / invariants
- Creating an event type auto-upserts a matching `service_package_categories` record.
- Renaming an event type keeps the linked category name in sync.
- `order_index` auto-increments when not provided.
- Duplicate day links or subject role links throw `ConflictException` (Prisma P2002).

## Data model notes
- **eventType** — top-level template, brand-scoped.
- **eventTypeDay** — junction linking event types to day templates.
- **eventTypeSubject** — junction linking event types to subject roles.
- Package builder writes to `service_packages`, `PackageEventDay`, `PackageActivity`, `PackageActivityMoment`, `PackageDaySubject`, `PackageDayOperator`, `PackageDayOperatorEquipment`.

## Related modules
- **Backend**: `../event-subtypes` — sub-templates within an event type
- **Backend**: `../service-package-categories` — categories auto-synced on event type CRUD
- **Backend**: `../service-packages` — packages created by the wizard
- **Backend**: `../../platform/brands` — provisioning writes event types on brand setup
- **Frontend**: `features/catalog/event-types`

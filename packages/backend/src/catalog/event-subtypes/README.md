# event-subtypes

## What this module does
Manages event subtypes — granular templates within an event type (e.g., "Traditional Wedding", "Elopement"). Each subtype includes activities, moments, locations, and subjects. Supports both system-seeded (global) and brand-specific subtypes. Can generate a full service package from a subtype template.

## Key files
| File | Purpose |
|------|---------|
| `event-subtypes.service.ts` | Read-only queries (findAll, findOne, system-seeded, brand-specific) |
| `services/event-subtypes-package-builder.service.ts` | Creates service packages from subtype templates |
| `event-subtypes.controller.ts` | REST endpoints (list, detail, create-package) |
| `dto/create-package-from-event-subtype.dto.ts` | Minimal DTO (packageName + description) |

## Business rules / invariants
- System-seeded subtypes (`brand_id: null`, `is_system_seeded: true`) are available to all brands.
- Brand-specific subtypes supplement system ones.
- Package builder calculates activity start times from `event_start_time` + `start_time_offset_minutes`.
- New packages inherit the brand's currency.

## Data model notes
- **eventSubtype** — template with nested activities → moments, locations, subjects.
- Package builder writes to `service_packages`, `PackageEventDay`, `PackageDaySubject`, `PackageLocationSlot`, `PackageActivity`, `PackageDaySubjectActivity`, `LocationActivityAssignment`, `PackageActivityMoment`.

## Related modules
- **Backend**: `../event-types` — parent category of subtypes
- **Backend**: `../service-packages` — packages created by the builder
- **Frontend**: `features/catalog/event-subtypes`

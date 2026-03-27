# package-sets

## What this module does
Manages package sets — groups of tiered pricing slots (Budget/Basic/Standard/Premium) that organize service packages for client presentation. Each set has up to 5 slots that can be assigned service packages.

## Key files
| File | Purpose |
|------|---------|
| `package-sets.service.ts` | Set CRUD + slot operations (add, assign, reorder, clear) |
| `package-sets.controller.ts` | REST endpoints under `/api/package-sets`, brand-scoped via `X-Brand-Context` |
| `dto/package-set.dto.ts` | Create/Update DTOs |

## Business rules / invariants
- Maximum 5 slots per set (`MAX_SLOTS_PER_SET = 5`).
- Default tier labels: `['Budget', 'Basic', 'Standard', 'Premium', 'Ultimate']`.
- Creating a set auto-creates 4 default tier slots unless `tier_labels` specified.
- Duplicate set names per brand throw `ConflictException`.
- Each set is scoped to an event type via `event_type_id`.
- Brand context is resolved from the shared `X-Brand-Context` header, not URL params.

## Data model notes
- **package_sets** — brand-scoped, linked to an event type.
- **package_set_slots** — ordered tier slots within a set, each optionally assigned a `service_packages` record.

## Related modules
- **Backend**: `../service-packages` — packages assigned to slots
- **Backend**: `../event-types` — sets are scoped per event type
- **Backend**: `../../platform/brands` — provisioning auto-creates sets on brand setup
- **Frontend**: `features/catalog/package-sets`

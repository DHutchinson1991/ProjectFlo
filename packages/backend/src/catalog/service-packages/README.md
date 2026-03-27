# service-packages

## What this module does
Core CRUD for service packages — the sellable product that includes activities, moments, crew, equipment, and pricing. Supports version history (snapshot, list, restore). Integrates with `PricingModule` for cost calculations. Also provides a builder service for creating packages from the Needs Assessment wizard.

## Key files
| File | Purpose |
|------|---------|
| `service-packages.service.ts` | CRUD + pricing enrichment |
| `services/service-packages-versions.service.ts` | Version history (snapshot, list, restore) |
| `services/service-packages-builder.service.ts` | Creates packages from Needs Assessment wizard |
| `service-packages.controller.ts` | REST endpoints scoped to `:brandId` |
| `dto/service-package.dto.ts` | Create/Update/Builder DTOs |

## Business rules / invariants
- `findAll` enriches each package with crew count, camera/audio counts, guest counts, and pricing via `PricingService.estimatePackagePrice`.
- Delete is soft-delete (`is_active: false`).
- Version restore creates a safety snapshot first ("Restored from version N"), then applies the saved state.
- Builder auto-assigns cameras round-robin to operators from the brand's equipment library.

## Data model notes
- **service_packages** — brand-scoped, linked to event type and workflow template.
- **PackageVersion** — JSON snapshots of package state at a point in time.
- Builder writes to `PackageEventDay`, `PackageActivity`, `PackageActivityMoment`, `PackageDayOperator`, `PackageDayOperatorEquipment`.

## Related modules
- **Backend**: `../../business/pricing` — `PricingService` for cost breakdown
- **Backend**: `../event-types` — packages linked to event types
- **Backend**: `../package-sets` — packages assigned to set slots
- **Frontend**: `features/catalog/service-packages`

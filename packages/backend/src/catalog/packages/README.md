# packages

## What this module does
Core CRUD for service packages — the sellable product that includes activities, moments, crew, equipment, and pricing. Supports version history (snapshot, list, restore). Integrates with `PricingModule` for cost calculations. Package creation from the Inquiry Wizard is delegated to `../package-creation` (`InquiryPackageCreator`).

## Key files
| File | Purpose |
|------|---------|
| `packages.service.ts` | CRUD + pricing enrichment |
| `services/package-versions.service.ts` | Version history (snapshot, list, restore) |
| `services/package-ai-runs.service.ts` | Reads package-creator run manifests/logs for package-scoped AI history |
| `services/package-ai-run-transcript.parser.ts` | Parses `master.log` step sections into structured prompt/response transcript blocks for the package detail modal |
| `packages.controller.ts` | CRUD, version history, and creation proxies (`from-builder`, `from-template/:eventTypeId`) to `PackageCreationService` |
| `packages-planning.controller.ts` | Package-scoped AI planning ops: `:id/replan`, `:id/resync`, `:id/planning-events` (SSE) |
| `dto/package.dto.ts` | Create/Update/Builder DTOs |

## Business rules / invariants
- `findAll` enriches each package with crew count, camera/audio counts, guest counts, and pricing via `PricingService.estimatePackagePrice`.
- Package guest count is derived from `Guests` package subject rows and uses the maximum per-day headcount rather than summing all group subjects.
- Delete is soft-delete (`is_active: false`).
- Version restore creates a safety snapshot first ("Restored from version N"), then applies the saved state.
- `GET /api/packages/:id/ai-runs` and `GET /api/packages/:id/ai-runs/:runId` expose package-scoped package-creator manifests, raw `master.log`, and a parsed per-step transcript so the package detail AI history modal can show prompt/response flow without reparsing logs in the browser; access is restricted to the current brand's package.
- Inquiry Wizard package creation now lives in `../package-creation/sources/inquiry-package-creator.service.ts` via `InquiryPackageCreator`; this module no longer hosts a builder service. The creator auto-assigns cameras + audio round-robin from the brand's equipment library.
- When package creation is started with `sourceDayBlueprintVersionId`, Day Blueprint consume-on-create is mandatory; consume failures now fail the request instead of silently continuing with a partially-seeded package.
- Legacy activity-moment cloning has been removed from builder flows; packages start with activities only, and moments are generated later by the AI planner / knowledge base.

## Data model notes
- **service_packages** — brand-scoped, linked to event type and workflow template.
- **PackageVersion** — JSON snapshots of package state at a point in time.
- Wizard source writes to `PackageEventDay`, `PackageActivity`, `PackageLocationSlot`, `PackageSpaceSlot`, `PackageCrewSlot`, `PackageCrewSlotEquipment`.

## Related modules
- **Backend**: `../../business/pricing` — `PricingService` for cost breakdown
- **Backend**: `../package-creation` — owns wizard / template / event-type package builds
- **Backend**: `../event-types` — packages linked to event types
- **Backend**: `../package-sets` — packages assigned to set slots
- **Frontend**: `features/catalog/packages`

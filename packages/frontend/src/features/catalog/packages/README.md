# catalog / packages

Manages service package sets and individual packages (tiers) available to clients during the inquiry wizard and studio booking flow.

## Responsibilities
- Package set CRUD (named collections of package tiers)
- Individual package CRUD with day coverage, location slots, equipment, and crew
- Package picker dialog (used in inquiry wizard)
- Package stats aggregation and tier color resolution
- React Query list/mutation hooks for package library and slot assignment flows

## Folder Shape
```
api/         — Typed API bindings split by resource (`service-packages.api.ts`, `package-sets.api.ts`, `package-categories.api.ts`)
constants/   — Query keys for package library, package sets, and package detail invalidation
components/  — listing/ (PackageSetCard, PackagePickerDialog), detail/ (CrewCard, PackageContentsCard, SummaryCard)
hooks/       — package detail hooks plus React Query hooks for package library/set mutations
screens/     — PackagesScreen, PackageDetailScreen
types/       — PackageSet, PackageSetSlot, service package models, and API DTOs
utils/       — package-helpers.ts (film stats, slot computations)
```

## Key Files
- `types/package-set.types.ts` — `PackageSet` and `PackageSetSlot` interfaces (imported cross-feature by inquiry-wizard)
- `components/listing/listing-helpers.ts` — tier colors, category colors, slot tier resolution, package stats

## Key Routes
- `GET /api/brands/:brandId/package-sets`
- `POST /api/brands/:brandId/package-sets`
- `GET /api/brands/:brandId/service-packages`

## Notes
- Package library screens should use feature hooks from `hooks/` instead of calling `servicePackagesApi` and `packageSetsApi` directly inside components.
- Package set assignment, slot edits, and deletion should invalidate `constants/query-keys.ts` rather than manually reloading local screen state.

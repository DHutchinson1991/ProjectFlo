# catalog / packages

Manages service package sets and individual packages (tiers) available to clients during the inquiry wizard and studio booking flow.

## Responsibilities
- Package set CRUD (named collections of package tiers)
- Individual package CRUD with day coverage, location slots, equipment, and crew
- Package picker dialog (used in inquiry wizard)
- Package stats aggregation and tier color resolution

## Folder Shape
```
api/         — Typed API bindings (package-sets, service-packages endpoints)
components/  — listing/ (PackageSetCard, PackagePickerDialog), detail/ (CrewCard, PackageContentsCard, SummaryCard)
hooks/       — usePackageSets, useServicePackages
screens/     — PackagesScreen, PackageDetailScreen
types/       — PackageSet, PackageSetSlot, package edit types
utils/       — package-helpers.ts (film stats, slot computations)
```

## Key Files
- `types/package-set.types.ts` — `PackageSet` and `PackageSetSlot` interfaces (imported cross-feature by inquiry-wizard)
- `components/listing/listing-helpers.ts` — tier colors, category colors, slot tier resolution, package stats

## Key Routes
- `GET /api/brands/:brandId/package-sets`
- `POST /api/brands/:brandId/package-sets`
- `GET /api/brands/:brandId/service-packages`

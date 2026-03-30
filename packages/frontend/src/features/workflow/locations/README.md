# Locations Feature — Frontend

## What this module does

Provides venue/location management with list/detail flows and film-location assignment hooks. Space and floor-plan editing are temporarily removed. Routes live under `app/(studio)/(workflow)/locations/`.

## Key files

| File | Purpose |
|------|---------|
| `types/index.ts` | Canonical TS types for locations, film-location assignments, and request payloads |
| `api/locations.api.ts` | `createLocationsApi` factory — typed API using `ApiClient` (auth + brand headers) for locations, film assignments, and package slots |
| `api/index.ts` | Barrel — instantiates `locationsApi` from the factory for backward compat |
| `hooks/useLocationsList.ts` | Brand-scoped list + save hook; list query accepts `search`, `city`, and `capacity` filters |
| `hooks/useLocationDetail.ts` | Detail query + update mutation for a single location |
| `hooks/useFilmLocations.ts` | React Query hook for film↔location assignments |
| `hooks/useSceneLocation.ts` | React Query hook for scene↔location assignment |
| `hooks/usePackageLocations.ts` | React Query hook for package location slots + event days |
| `components/LocationAddressCard.tsx` | Address/map editor card extracted from detail screen |
| `components/LocationContactCard.tsx` | Contact/notes/status card extracted from detail screen |
| `constants/locations-columns.tsx` | Table column definitions for list screen |
| `screens/LocationsListScreen.tsx` | Top-level screen for the locations list page |
| `screens/LocationDetailScreen.tsx` | Location detail editor (no space/floor-plan management) |
| `components/LocationCreateDialog.tsx` | Create/edit location dialog |

Film page tab ownership: `FilmLocationsTab` lives in `features/content/films/components/tabs/FilmLocationsTab.tsx`.

## Business rules / invariants

- Always call `locationsApi` (not ad-hoc `fetch`). It is the sole secure API surface for this feature.
- `useFilmLocations` and `useSceneLocation` use React Query with `locationsApi.filmLocations.*` endpoints.
- `usePackageLocations` replaces direct `api.schedule.*` calls for package location slots and event days.
- Locations list filters (`search`, `city`, `capacity`) are server-side via `/api/locations` query params; UI controls only manage query inputs.
- All `router.push` and `href` values for location routes use `/locations/` — never `/resources/locations/` or `/manager/locations/`.

## Future implementation outline (spaces + floor plans)

This feature previously supported per-venue spaces and visual floor-plan editing. The planned reintroduction should keep location CRUD stable and layer spaces/floor plans as optional capabilities.

- Scope split:
	- Spaces: named, ordered sub-areas under a location (e.g. Ceremony Hall, Prep Room, Reception).
	- Floor plans: optional visual layout per location, used for planning context, not as a hard dependency for assignment workflows.
- Data shape (high-level):
	- `LocationSpace`: `id`, `location_id`, `name`, `description?`, `order_index`, `capacity?`, `is_active`.
	- `FloorPlan`: `id`, `location_id`, `name`, `version`, `canvas`/`layout_json`, `updated_at`, `updated_by`.
	- `FloorPlanObject`: `id`, `floor_plan_id`, `type`, `label?`, `x`, `y`, `width`, `height`, `rotation?`, `metadata?`, `order_index`.
- Frontend contract (planned):
	- `locationsApi.locationSpaces.*` for CRUD + ordering.
	- `locationsApi.floorPlans.*` for plan CRUD and plan-object upserts.
	- `LocationDetailScreen` should lazy-load spaces/floor-plan panels so base location editing remains fast.
- UX invariants:
	- A location can exist with zero spaces and zero floor plans.
	- Film/scene location assignment must continue to work without spaces/floor plans.
	- Save operations should be granular: space edits and floor-plan edits do not block core location field saves.
- Rollout sequence:
	- Step 1: restore backend models/routes behind feature flag.
	- Step 2: reintroduce frontend types + API bindings.
	- Step 3: add read-only floor-plan preview in detail screen.
	- Step 4: enable floor-plan editor and object manipulation.
	- Step 5: remove feature flag after migration and QA sign-off.

## Related modules

- **Backend**: `src/workflow/locations/` — NestJS module; `/locations` route prefix (venue/location CRUD)
- **Routes**: `app/(studio)/(workflow)/locations/`, `(workflow)/crew/`, `(workflow)/equipment/`
- **Bucket**: `features/workflow/` — same bucket as inquiries, projects, staffing, equipment, calendar


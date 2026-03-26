# Locations Feature — Frontend

## What this module does

Provides venue/location management: venue list and detail, space browsing, interactive floor-plan editor, and a film-locations tab. Routes live under `app/(studio)/resources/locations/`.

## Key files

| File | Purpose |
|------|---------|
| `types/index.ts` | Canonical TS types — `LocationsLibrary`, `LocationSpace`, `FloorPlan`, `FloorPlanObject`, all request types |
| `types/floor-plan/` | Floor-plan-specific types (`editor.ts`, `WallTypes.ts`) |
| `api/locations.api.ts` | `createLocationsApi` factory — typed API using `ApiClient` (auth + brand headers) |
| `api/index.ts` | Barrel — instantiates `locationsApi` from the factory for backward compat |
| `hooks/useFilmLocations.ts` | React Query hook for film↔location assignments |
| `hooks/useSceneLocation.ts` | React Query hook for scene↔location assignment |
| `hooks/usePackageLocations.ts` | React Query hook for package location slots + event days |
| `hooks/floor-plan/` | Floor-plan editor hooks (`useFloorPlanState`, `useZoomPan`, `useIntegratedFloorPlan`, `useUndoRedo`) |
| `screens/LocationsListScreen.tsx` | Top-level screen for the locations list page |
| `components/LocationCreateDialog.tsx` | Create/edit location dialog |
| `components/floor-plan/` | Interactive floor-plan editor mounted at `resources/locations/[id]/[floorPlanId]` |
| `components/space-details/` | Space detail views including `SpaceHeader` with back-navigation |
| `components/FilmLocationsTab.tsx` | Tab embedded on a film page |
| `services/` | Floor-plan data services (geometry, analysis, export, element management) |
| `constants/` | Floor-plan constants (grid settings, element definitions) |

## Business rules / invariants

- Always call `locationsApi` (not ad-hoc `fetch`). It is the sole secure API surface for this feature.
- `useFilmLocations` and `useSceneLocation` use React Query with `locationsApi.filmLocations.*` endpoints.
- `usePackageLocations` replaces direct `api.schedule.*` calls for package location slots and event days.
- All `router.push` and `href` values for location routes use `/resources/locations/` — never `/manager/locations/`.

## Related modules

- **Backend**: `src/workflow/locations/` — NestJS module; `/locations` route prefix; four sub-modules (venues, spaces, floor-plans, plan-objects)
- **Routes**: `app/(studio)/resources/locations/`, `resources/crew/`, `resources/equipment/`
- **Bucket**: `features/workflow/` — same bucket as inquiries, projects, staffing, equipment, calendar


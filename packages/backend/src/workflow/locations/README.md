# Locations Module — Backend

## What this module does

Manages physical venues, their interior spaces, floor plans drawn on those spaces, and decorative/functional objects (furniture, equipment, décor) placed on those floor plans. Serves the Resources > Locations section of the studio UI.

## Key files

| File | Purpose |
|------|---------|
| `locations.module.ts` | Root module — imports all four sub-modules, exports `GeocodingService` |
| `geocoding.service.ts` | Nominatim OSM geocoder — resolves location names to lat/lng |
| `dto/` | Shared DTOs for all four sub-modules |

## Business rules / invariants

- A `FloorPlan` belongs to a `LocationSpace`; it may optionally be linked to a project via `projectId` (project-specific layout).
- `FloorPlan.duplicate` clones the plan record and all its `FloorPlanObject` children.
- Plan objects have a `category` field and are brand-scoped (`brandId`).
- All four controllers share the base route prefix `/locations` — sub-resources are distinguished by path segment (`/spaces`, `/floor-plans`, `/floor-plan-objects`).

## Related modules

- **Frontend**: `features/workflow/locations/` — canonical types, `locationsApi` client, hooks, and components
- **Routes**: `app/(studio)/resources/locations/` — venue/space/floor-plan pages
- **Bucket**: `src/workflow/` — same bucket as inquiries, projects, scheduling, equipment, staffing

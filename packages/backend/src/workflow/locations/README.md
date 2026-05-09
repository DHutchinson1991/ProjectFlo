# Locations Module — Backend

## What this module does

Manages venues, package planning spaces, floor-plan layouts, and geocoding support.

## Key files

| File | Purpose |
|------|---------|
| `locations.module.ts` | Root module — imports venues module, exports `GeocodingService` |
| `geocoding.service.ts` | Nominatim OSM geocoder — resolves location names to lat/lng |
| `dto/` | Shared DTOs for venue/location CRUD |
| `dto/queries/venues-query.dto.ts` | Validates list filters: `search`, `city`, `capacity` |
| `modules/venues/` | Venue/location CRUD endpoints and service |

## Business rules / invariants

- All location records are tenant-scoped by `brand_id`.
- Module route prefix remains `/api/locations`.
- `GET /api/locations` supports optional query filters: `search`, `city`, `capacity` (`small`, `medium`, `large`, `unknown`).
- Package space-slot floor plans remain activity-scoped, but when an activity is linked to a film, the visible package cameras must be normalized to that film's active video tracks.
- Stale extra package cameras should be removed during sync so blocking, preview, and track counts stay aligned.

## Related modules

- **Frontend**: `features/workflow/locations/` — canonical types, `locationsApi` client, hooks, and screens
- **Routes**: `app/(studio)/(workflow)/locations/` — location list/detail pages
- **Bucket**: `src/workflow/` — same bucket as inquiries, projects, scheduling, equipment, staffing

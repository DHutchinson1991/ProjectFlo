# Venues

## What this module does
CRUD and management of venues (locations). Handles venue creation, lookup, update, deletion, and venue-level floor plan data.

## Key files
| File | Purpose |
|------|---------|
| `venues.controller.ts` | REST endpoints under `api/locations` for venue CRUD and floor plans |
| `venues.service.ts` | Business logic for venue management |
| `venues.module.ts` | NestJS module registration |

## Business rules / invariants
- Venues are top-level location entities; spaces and floor plans are nested under them.
- Venue floor plan data is a JSON field storing layout metadata for the venue.
- Venues are brand-scoped (filtered by `brandId` from query or header).

## Related modules
- **Backend**: `workflow/locations/modules/spaces/` — spaces belong to venues
- **Backend**: `workflow/locations/modules/floor-plans/` — floor plans belong to spaces within venues
- **Frontend**: `features/workflow/locations/` — location management UI

# Film Locations

## What this module does
Manages the two-tier location assignment system for films. A `FilmLocation` associates a `LocationsLibrary` entry with a specific film. A `FilmSceneLocation` then pins one of those film-level locations to an individual scene. Removing a film-level location cascades to clear all scene-level assignments within that film inside a single transaction.

## Key files
| File | Purpose |
|------|---------|
| `film-locations.controller.ts` | REST endpoints under `api/film-locations` |
| `film-locations.service.ts` | All location assignment and query logic |
| `dto/assign-film-location.dto.ts` | Payload to add a location to a film |
| `dto/set-scene-location.dto.ts` | Payload to assign a film-level location to a scene |
| `dto/film-location-response.dto.ts` | Response shape for film-level location assignment |
| `dto/scene-location-response.dto.ts` | Response shape for scene-level location assignment |

## Business rules / invariants
- A location must be assigned to the film before it can be set on one of its scenes.
- Removing a film-level location cascades and removes all matching scene-level assignments for that film in a single `$transaction`.
- Film-level assignment is upsert (POST idempotently updates notes).
- Scene-level assignment is a one-to-one relation; `PUT` replaces the existing entry.
- All routes are JWT-protected via `AuthGuard('jwt')`.

## Data model notes
- Prisma models: `FilmLocation` (film + location), `FilmSceneLocation` (scene + location), `LocationsLibrary` (location master).
- `FilmLocation` has a unique constraint on `(film_id, location_id)`.
- `FilmSceneLocation` has a unique constraint on `scene_id`.

## Related modules
- **Backend**: `workflow/locations` — owns the `LocationsLibrary` master data
- **Backend**: `content/films` — owns `Film` records
- **Backend**: `content/scenes` — owns `FilmScene` records
- **Frontend**: `lib/api.ts` — `filmLocations` methods

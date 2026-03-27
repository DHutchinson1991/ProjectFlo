# catalog / event-types

Manages event type definitions used across the platform (weddings, elopements, corporate events, etc.).

## Responsibilities
- CRUD for event types per brand
- Category management (groups event types for filtering)
- Icon/color metadata for display purposes
- Used by: package sets (filter by event type), inquiry wizard (event type selection), calendar
- React Query hooks for event-type lists and CRUD invalidation

## Folder Shape
```
api/         — Typed API bindings split by resource (`event-types.api.ts`, `event-subtypes.api.ts`)
components/  — EventTypeCard, EventTypeForm, category UI
constants/   — Query keys for event type list/detail invalidation
hooks/       — useEventTypes plus CRUD mutation hooks
screens/     — EventTypesScreen
types/       — EventType models plus API DTOs
```

## Key Routes
- `GET /api/event-types`
- `POST /api/event-types`
- `GET /api/brands/:brandId/event-type-categories`

## Notes
- Event type screens and dialogs should consume `hooks/useEventTypes.ts` and the matching mutation hooks instead of embedding `load()` orchestration in components.
- Brand context is resolved through the shared API client header path; do not add new `brandId` query plumbing for event-type CRUD without a backend requirement.

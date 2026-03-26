# catalog / event-types

Manages event type definitions used across the platform (weddings, elopements, corporate events, etc.).

## Responsibilities
- CRUD for event types per brand
- Category management (groups event types for filtering)
- Icon/color metadata for display purposes
- Used by: package sets (filter by event type), inquiry wizard (event type selection), calendar

## Folder Shape
```
api/         — Typed API bindings (event-types endpoints)
components/  — EventTypeCard, EventTypeForm, category UI
constants/   — Query keys
hooks/       — useEventTypes, useEventTypeCategories
screens/     — EventTypesScreen
types/       — EventType, EventTypeCategory interfaces
```

## Key Routes
- `GET /api/brands/:brandId/event-types`
- `POST /api/brands/:brandId/event-types`
- `GET /api/brands/:brandId/event-type-categories`

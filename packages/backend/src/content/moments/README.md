# Moments Module

Scene-moment management and recording setup (camera/audio/graphics configuration per moment).

## Data Model

- **SceneMoment** — A moment within a film scene. Has `order_index`, `duration`, `source_activity_id`.
- **MomentRecordingSetup** — One-to-one recording configuration for a moment. Holds audio track IDs, graphics settings.
- **CameraSubjectAssignment** — Camera track + subject IDs for a recording setup moment.
- **FilmSceneMomentSubject** — Priority-based subject assignments for a moment (auto-copied from scene on moment creation).

## Module structure

```
moments/
  moments.module.ts
  moments.controller.ts           — thin route shell; dispatches to 2 services
  moments-crud.service.ts         — Moment CRUD, scene listing, reorder
  moment-recording-setup.service.ts — Recording setup get/upsert/delete
  moment.mapper.ts                — Pure mapping helpers
  dto/
    create-moment.dto.ts
    update-moment.dto.ts
  types/
    moment-payload.type.ts        — MomentWithDetails Prisma payload type
```

## Service Boundaries

| File | Service | Responsibility |
|------|---------|----------------|
| `moments-crud.service.ts` | `MomentsCrudService` | Moment CRUD, scene listing, reorder. Auto-copies scene subjects at creation. |
| `moment-recording-setup.service.ts` | `MomentRecordingSetupService` | Get, upsert, and delete recording setup (camera assignments, audio tracks, graphics). |

## Routes

All routes are under `/moments`.

### Scene-scoped moment management
- `POST   /scenes/:sceneId/moments` — create moment (auto-assigns scene subjects)
- `GET    /scenes/:sceneId/moments` — list moments with recording setup summary
- `GET    /:id` — get single moment with scene name + setup counts
- `PATCH  /:id` — update moment fields
- `DELETE /:id` — delete moment (cascades)
- `POST   /scenes/:sceneId/reorder` — batch reorder moments

### Recording setup
- `GET    /:id/recording-setup` — get full recording setup with camera assignments
- `PATCH  /:id/recording-setup` — upsert recording setup (camera assignments, audio tracks, graphics)
- `DELETE /:id/recording-setup` — delete recording setup

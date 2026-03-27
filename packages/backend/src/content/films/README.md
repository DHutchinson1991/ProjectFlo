# Films — Backend Module

**Bucket:** `content`  
**Path:** `packages/backend/src/content/films/`

## Responsibility

Manages the `Film` entity — the top-level container for a creative production. A film owns timeline tracks, scenes, moments, subjects, locations, and equipment configurations.

## Module structure

```
films/
  films.module.ts
  films.controller.ts          — Film CRUD + equipment + tracks + equipment-assignments
  timeline-layers.controller.ts — Global timeline layer CRUD
  films.service.ts              — Film CRUD, delegates equipment to split services
  film.mapper.ts                — Maps Prisma results to FilmResponseDto
  dto/
    create-film.dto.ts          — CreateFilmDto
    update-film.dto.ts          — UpdateFilmDto
    update-equipment.dto.ts     — UpdateEquipmentDto
    film-response.dto.ts        — FilmResponseDto
    assign-equipment.dto.ts     — AssignEquipmentDto
    update-equipment-assignment.dto.ts
    film-equipment-response.dto.ts
    equipment-summary.dto.ts    — EquipmentSummaryDto
  services/
    film-equipment.service.ts   — Track config (add/remove camera/audio tracks)
    film-equipment-assignments.service.ts — Equipment library ↔ film assignments
    film-timeline-tracks.service.ts      — Individual track get/update
    film-timeline-layers.service.ts      — Global timeline layer CRUD
    film-scenes-management.service.ts    — Scene get/update/delete
  types/
    film-payload.type.ts        — FilmWithDetails Prisma payload type
```

## Key data flows

- **Film creation**: `FilmsService.create` → `FilmEquipmentService.configureEquipment` → response via `mapToResponseDto`
- **Equipment update**: `FilmsService.updateEquipment` → `FilmEquipmentService.updateEquipment` (cascading track cleanup)
- **Controller wiring**: Controller injects `FilmsService`, `FilmTimelineLayersService`, `FilmTimelineTracksService`, `FilmEquipmentAssignmentsService` directly (no pass-through)

## Cross-module dependencies

- `PrismaModule` — database access
- Exported services consumed by `content/schedule` for film-schedule operations
- **Frontend**: `lib/api.ts` → `api/films/*` endpoints

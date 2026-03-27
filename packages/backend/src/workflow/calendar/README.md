# Calendar (Backend)

## What this module does
Manages calendar events, active tasks, discovery call scheduling, tags, attendees, settings, and stats for a brand. All endpoints are brand-scoped via `X-Brand-Context` header and JWT auth.

## Key files
| File | Purpose |
|------|---------|
| `calendar.controller.ts` | REST endpoints — delegates to 7 services |
| `calendar.module.ts` | NestJS module wiring |
| `dto/calendar.dto.ts` | Request/response DTOs |
| `services/calendar-events.service.ts` | Event CRUD, date-range queries, upcoming events |
| `services/active-tasks.service.ts` | Task date-range queries, assign/toggle tasks |
| `services/calendar-discovery.service.ts` | Discovery call slot availability |
| `services/calendar-attendees.service.ts` | Attendee management |
| `services/calendar-tags.service.ts` | Tag CRUD |
| `services/calendar-settings.service.ts` | Calendar settings per brand |
| `services/calendar-stats.service.ts` | Event/task statistics |

## Business rules / invariants
- Every query is scoped to `brandId` extracted from the authenticated user context.
- Events linked to inquiries via `inquiry_id` (used by discovery calls & proposal reviews).
- Route ordering: literal paths (`/stats`, `/tags`, `/today`, `/upcoming`, `/tasks`) registered before parameterized `/:id` to avoid route shadowing.
- Discovery slots honour contributor availability windows.

## Related modules
- **Frontend**: `features/workflow/calendar` — consumes all calendar API endpoints
- **Backend**: `../workflow/tasks` — `TasksModule` imported for task cross-references
- **Backend**: `../../platform/brands` — `BrandsModule` imported for brand scoping

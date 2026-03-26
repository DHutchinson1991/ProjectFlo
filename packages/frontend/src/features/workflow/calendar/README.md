# Calendar (Frontend)

## What this module does
Owns studio calendar scheduling UI and data flows (list/read/update) for month/week/day/agenda views, event modal actions, and calendar task overlays. The studio route is a thin shell that renders this feature screen.

## Key files
| File | Purpose |
|------|---------|
| `screens/calendar-screen.tsx` | Feature-owned screen orchestration rendered by the route shell |
| `hooks/use-calendar-page.ts` | Composes view, dialog, modal, and data hooks |
| `hooks/use-calendar-events.ts` | React Query list/read/update/delete flow for events |
| `hooks/use-calendar-tasks.ts` | React Query list/read flow for calendar tasks |
| `hooks/use-contributors.ts` | React Query contributor lookup for assignee selection |
| `constants/query-keys.ts` | Brand-aware tenant-scoped React Query keys |
| `api/index.ts` | Typed calendar endpoint bindings through shared API client |
| `types/calendar-api.types.ts` | Backend request/response contracts at the feature boundary |
| `mappers/calendar-event-mapper.ts` | Backend event contract -> domain model mapper |

## Business rules / invariants
- All calendar HTTP calls go through feature API bindings in `api/` and the shared API client.
- Tenant-scoped React Query keys must include brand context.
- Route files stay thin; calendar behavior belongs to feature hooks/screens/components.
- No new calendar contracts go into legacy-frozen `lib/types` or `lib/api.ts`.
- No compatibility shims or dual legacy/new implementations.

## Related modules
- **Backend**: `packages/backend/src/workflow/calendar` - calendar endpoints and scheduling domain logic.
- **Route shell**: `packages/frontend/src/app/(studio)/calendar/page.tsx` - renders the feature screen only.
- **Consumers**: inquiry workflow cards under `app/(studio)/sales/inquiries/[id]/_detail/_components`.

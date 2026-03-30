# workflow/scheduling

Schedule management — event day templates (presets), package schedules, project instance schedules, and inquiry instance schedules. Provides visual timeline, activity management, and schedule diff views.

## Key files

| File | Purpose |
|------|---------|
| `api/instance/schedule-instance.api.ts` | Typed API client for project/inquiry schedule CRUD, snapshots, sync, and diff endpoints |
| `api/shared/crew-slots.api.ts` | Typed API client for package and project crew slot CRUD (`/api/crew-slots/*`) |
| `hooks/instance/useInstanceScheduleData.ts` | Normalizes schedule data between package and project/inquiry modes |
| `hooks/instance/useScheduleSnapshotData.ts` | Snapshot data for schedule comparisons |
| `components/package-template/EventDayManager.tsx` | Event day creation and management UI |
| `components/shared/VisualTimeline.tsx` | Visual timeline rendering for schedules |
| `components/package-template/PackageScheduleCard.tsx` | Package-level schedule card |
| `components/package-template/PackageScheduleSummary.tsx` | Summary view of package schedule |
| `components/package-template/ActivitiesCard.tsx` | Activity list within an event day |
| `components/package-template/AddActivityDialog.tsx` | Dialog for adding activities to event days |
| `components/package-template/ActivityFilmWizard.tsx` | Wizard for film-linked activity creation |
| `components/instance/InstanceScheduleEditor.tsx` | Full schedule editor for project/inquiry instances |
| `components/shared/ScheduleApiContext.tsx` | Context providing schedule API methods to components |
| `components/instance/ScheduleDiffView.tsx` | Diff viewer for schedule changes |
| `components/shared/ProposalSchedulePreview.tsx` | Read-only schedule preview for proposals |
| `components/film-wizard/` | Multi-step film wizard sub-components |
| `presets/index.ts` | Preset-scope exports (preset API surface) |
| `package-template/index.ts` | Package-template scope exports (API + package schedule UI) |
| `instance/index.ts` | Project/inquiry instance exports (API + hooks + editor) |
| `shared/index.ts` | Shared scheduling primitives (crew slots API + timeline + API adapter context) |
| `film-wizard/index.ts` | Film wizard entrypoint |

## Public entrypoints

Use scope entrypoints for feature imports:

- `workflow/scheduling/presets`
- `workflow/scheduling/package-template`
- `workflow/scheduling/instance`
- `workflow/scheduling/shared`
- `workflow/scheduling/film-wizard`

The legacy barrels (`workflow/scheduling/api`, `workflow/scheduling/components`, `workflow/scheduling/hooks`) still work and now delegate to these scope entrypoints.

Scope entrypoints also expose runtime API clients for local domain usage:

- `workflow/scheduling/package-template` exports `scheduleApi` for package schedule operations
- `workflow/scheduling/instance` exports `scheduleApi` for project/inquiry instance operations
- `workflow/scheduling/shared` exports `crewSlotsApi` for crew slot operations

## Architecture

Schedules have 4 levels:
1. **Presets** — reusable event day templates (e.g., "Wedding Day", "Engagement Shoot")
2. **Package schedules** — schedule templates attached to service packages
3. **Project instances** — materialized schedules for booked projects
4. **Inquiry instances** — draft schedules attached to inquiries

The `ScheduleApiContext` injects the correct API endpoints based on the current mode (package vs project vs inquiry), allowing shared components to work across all contexts.

## Backend

- Module: `packages/backend/src/content/schedule/`
- 6 controllers: preset, package, package-resource, project, instance, instance-resource
- 10+ services for CRUD, films, presets, diff-building
- All endpoints prefixed `/api/schedule/`
- Project and inquiry cross-module schedule endpoints are also prefixed `/api/` (e.g., `/api/projects/*`, `/api/inquiries/*`) when called from schedule API clients.

## Implementation notes

- `components/PackageScheduleCard.tsx` applies explicit local response typing when consuming scheduling API methods so state updates remain strict under TypeScript.
- Keep schedule API route strings explicitly `/api/*` in frontend clients to avoid accidental relative-path regressions.
- Crew slot activity linkage is junction-table only (`*/crew-slots/:id/activities/:activityId`); slot create/update payloads no longer set direct `package_activity_id` / `project_activity_id` fields.
- Package crew-slot creation uses `package_event_day_id` payloads, and backend accepts either package-day join IDs or template IDs for compatibility.

## Related modules

- `workflow/projects` — project schedules are instances of package schedules
- `workflow/inquiries` — inquiry schedules for pre-booking customization
- `workflow/proposals` — `ProposalSchedulePreview` renders in proposals
- `content/films` — activities can link to films via the film wizard

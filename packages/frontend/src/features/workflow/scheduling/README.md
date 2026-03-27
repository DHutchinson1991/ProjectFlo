# workflow/scheduling

Schedule management — event day templates (presets), package schedules, project instance schedules, and inquiry instance schedules. Provides visual timeline, activity management, and schedule diff views.

## Key files

| File | Purpose |
|------|---------|
| `api/crew-slots.api.ts` | Typed API client for package and project crew slot CRUD (`/api/crew-slots/*`) |
| `hooks/useInstanceScheduleData.ts` | Normalizes schedule data between package and project/inquiry modes |
| `hooks/useScheduleSnapshotData.ts` | Snapshot data for schedule comparisons |
| `components/EventDayManager.tsx` | Event day creation and management UI |
| `components/VisualTimeline.tsx` | Visual timeline rendering for schedules |
| `components/PackageScheduleCard.tsx` | Package-level schedule card |
| `components/PackageScheduleSummary.tsx` | Summary view of package schedule |
| `components/ActivitiesCard.tsx` | Activity list within an event day |
| `components/AddActivityDialog.tsx` | Dialog for adding activities to event days |
| `components/ActivityFilmWizard.tsx` | Wizard for film-linked activity creation |
| `components/InstanceScheduleEditor.tsx` | Full schedule editor for project/inquiry instances |
| `components/ScheduleApiContext.tsx` | Context providing schedule API methods to components |
| `components/ScheduleDiffView.tsx` | Diff viewer for schedule changes |
| `components/ProposalSchedulePreview.tsx` | Read-only schedule preview for proposals |
| `components/film-wizard/` | Multi-step film wizard sub-components |

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

## Related modules

- `workflow/projects` — project schedules are instances of package schedules
- `workflow/inquiries` — inquiry schedules for pre-booking customization
- `workflow/proposals` — `ProposalSchedulePreview` renders in proposals
- `content/films` — activities can link to films via the film wizard

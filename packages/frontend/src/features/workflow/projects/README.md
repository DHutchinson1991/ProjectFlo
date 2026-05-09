# Projects

## What this module does
Manages studio projects — listing, detail views, phase tracking, and the inquiry → project conversion flow. A project is created by converting a won inquiry, inheriting its client, package, contact, schedule, and finance data.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | `createProjectsApi` factory — typed CRUD against `/projects` |
| `hooks/useProjects.ts` | React Query hook for project list |
| `hooks/useProject.ts` | React Query hook for single project detail |
| `hooks/useProjectMutations.ts` | `useUpdateProject`, `useDeleteProject` mutation hooks |
| `hooks/useProjectProduction.ts` | `useProjectEventDays`, `useProjectFilms`, `useSyncScheduleFromPackage`, `useDeleteProjectFilm` |
| `hooks/queryKeys.ts` | `projectKeys` factory for React Query cache keys |
| `screens/ProjectListScreen.tsx` | Project list with StudioTable, search, phase/status chips |
| `screens/ProjectDetailScreen.tsx` | Single-project view with tabbed pipeline (ProjectTab, Discovery, Proposal, Schedule, Phase) |
| `components/project-header/ProjectHeader.tsx` | Project detail page header with phase chip + status |
| `components/tabs/ProjectTab.tsx` | Overview tab — project details, contact, package snapshot |
| `components/tabs/ProjectDiscoveryTab.tsx` | Discovery tab — questionnaire answers |
| `components/tabs/ProjectProposalTab.tsx` | Proposal/contract/finance cards |
| `components/tabs/ProjectScheduleTab.tsx` | Schedule tab — event days, films, crew |
| `components/tabs/ProjectPhaseTab.tsx` | Phase tab — task groups by project phase |
| `constants/project-phases.ts` | `PROJECT_PHASE_TABS`, `PHASE_CONFIG_MAP` — tab definitions with icons/colors |
| `types/project.types.ts` | `Project`, `ProjectListItem`, `UpdateProjectRequest`, `ProjectPhase`, `ProjectStatus`, `ProjectTask` |

## Business rules / invariants
- Every project belongs to exactly one brand (scoped via `brand_id`).
- Projects are created **only** via the inquiry conversion flow (`POST /api/inquiries/:id/convert`) — there is no standalone "Create Project" action.
- Phase progression follows a fixed order: Booking → Creative_Development → Pre_Production → Production → Post_Production → Delivery.
- Project CRUD uses `/api/projects` and the backend requires `X-Brand-Context` on list/detail/mutation calls.
- Project updates use **PUT** (not PATCH) — the backend controller is `@Put(':id')`.
- The portal token moves from the inquiry to the project on conversion; the client portal resolves tokens from both tables.

## API factory
```ts
import { createProjectsApi } from '@/features/workflow/projects';
import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

const projectsApi = createProjectsApi(apiClient as ApiClient);
```

## Related modules
- **Backend**: `packages/backend/src/workflow/projects/` — ProjectsController + ProjectsService
- **Conversion**: `packages/backend/src/workflow/inquiries/services/inquiry-lifecycle.service.ts` — `convertToProject()`
- **Convert button**: `packages/frontend/src/features/workflow/inquiries/components/command-center-header/HeaderActions.tsx` — calls `inquiriesApi.convert()` and redirects to `/projects/:id`
- **Client portal**: `packages/backend/src/workflow/inquiries/services/client-portal-data.service.ts` — resolves portal token from both inquiries and projects tables

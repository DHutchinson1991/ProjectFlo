# Projects

## What this module does
Manages studio projects (films/events) — CRUD, phase tracking, and the studio-wide project selector. A project ties together a client, package, workflow template, and all downstream production phases.

## Key files
| File | Purpose |
|------|---------|
| `api/index.ts` | `createProjectsApi` factory — typed CRUD against `/projects` |
| `components/ProjectProvider.tsx` | Studio-wide context: active project, project list, CRUD actions |
| `hooks/useProjects.ts` | Context consumer for project list/detail CRUD |
| `screens/ProjectDetailScreen.tsx` | Single-project view with phase tabs |
| `screens/ProjectListScreen.tsx` | Grid of all projects for the active brand |
| `components/ProjectPhaseOverview.tsx` | Phase bar + current-phase detail card |
| `components/ProjectPhaseBar.tsx` | Horizontal phase progress indicator |
| `components/tabs/*.tsx` | Per-phase tab content (Overview, Creative, Pre/Post-Production, etc.) |
| `constants/project-phases.ts` | `PROJECT_PHASES` array — phase definitions with icons/colors |
| `types/project.types.ts` | `Project`, `CreateProjectRequest`, `UpdateProjectRequest` |

## Business rules / invariants
- Every project belongs to exactly one brand (scoped via `brand_id`).
- `ProjectProvider` is mounted at the studio layout level so the header selector can switch projects. It is **not** a route-level provider.
- Phase progression follows a fixed order: Overview → Package → Creative → Pre-Production → Production → Post-Production → Delivery.
- Project CRUD uses `/api/projects` and the backend requires `X-Brand-Context` on list/detail/mutation calls.
- Project updates use **PUT** (not PATCH) — the backend controller is `@Put(':id')`.
- Active project ID is persisted to `localStorage` so it survives page reloads.

## API factory
```ts
import { createProjectsApi } from '@/features/workflow/projects';
import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

const projectsApi = createProjectsApi(apiClient as ApiClient);
```

## Related modules
- **Backend**: `packages/backend/src/projects/` — ProjectsController + ProjectsService
- **Frontend provider mount**: `app/(studio)/layout.tsx` wraps the studio shell
- **Consumer**: `ProjectSelector.tsx` in the studio header reads `useProjects()`
- **Downstream tabs**: PackageScheduleTab and ProductionTab use the projects feature API/context instead of calling the frozen monolith directly

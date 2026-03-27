# Projects

## What this module does
Owns studio project lifecycle: list/detail CRUD, brand-scoped access, project/package snapshot endpoints, and schedule re-cloning from a source package.

## Key files
| File | Purpose |
|------|---------|
| `projects.controller.ts` | JWT-protected `/api/projects` routes |
| `projects.service.ts` | Brand-scoped CRUD and delete/archive logic |
| `project-package-snapshot.service.ts` | Read-only package snapshot data for a project |
| `project-package-clone.service.ts` | Sync a project schedule from its source package |
| `project-film-clone.service.ts` | Clone project film schedule records |

## Business rules / invariants
- Every project belongs to exactly one brand.
- List, detail, update, and delete operations must be brand-scoped.
- Projects are soft-deleted via `archived_at`.
- Project schedule sync re-clones from the source package rather than patching in place.

## Related modules
- **Frontend**: `packages/frontend/src/features/workflow/projects`
- **Backend consumers**: `inquiries`, `needs-assessments`, `estimates`, and `content/instance-films` import project services

# Subjects Module

## What this module does
Manages subject roles plus scene and moment subject assignments for films and shot previews. The canonical subject entity is now `PackageDaySubject`; scene/moment membership and action descriptions attach directly to that package-day subject instead of a duplicated `FilmSubject` roster.

## Key files
| File | Purpose |
|------|---------|
| `subjects.controller.ts` | Routes under `/subjects` for CRUD, assignments, templates, and roles |
| `subjects-crud.service.ts` | Subject CRUD and template lookup |
| `subject-scene-assignments.service.ts` | Scene-level subject queries/removal derived from moment assignments |
| `subject-moment-assignments.service.ts` | Moment subject assignment CRUD and action-description persistence |
| `subject-roles.service.ts` | Brand-scoped subject role CRUD |
| `subject.mapper.ts` | Maps Prisma payloads into API responses |

## Business rules / invariants
- `PackageDaySubject` is the source of truth for scene and moment subject assignment.
- Scene subjects are computed from moment assignments; `FilmSceneSubject` is removed.
- Removing a subject from a scene or moment must also clean `sceneCameraAssignment` / `cameraSubjectAssignment` references.
- Subject updates support both renaming and optional reassignment of `role_template_id` on the underlying `PackageDaySubject`.
- Brand-scoped role definitions live in `SubjectRole`; templates are lookup helpers, not the runtime subject entity.

## Related modules
- **Backend**: `../shot-previews` — consumes moment subjects and action descriptions for AI prompt building.
- **Backend**: `../../workflow/projects` — clones subject and assignment data into project-owned instances.
- **Frontend**: `packages/frontend/src/features/content/subjects` — consumes the `/subjects` API.

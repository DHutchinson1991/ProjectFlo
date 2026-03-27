# Subjects Module

Film-subject management, scene/moment assignment, and brand-scoped role CRUD.

## Data Model

- **SubjectTemplate** — Legacy name-only lookup table (brand-scoped). No category.
- **SubjectRole** — Brand-scoped role definitions (e.g., "Bride", "Groom"). Core domain type for all subject references.
- **FilmSubject** — Thin roster junction: links a film to a role template. `role_template_id` is **required**.
- **ProjectFilmSubject** — Instance clone of FilmSubject (project-owned). `role_template_id` is **required**.
- **PackageDaySubject** — Subject assigned to a package event day. `role_template_id` is optional.
- **ProjectDaySubject** — Instance clone of PackageDaySubject. `role_template_id` is optional.
- **FilmSceneSubject / FilmSceneMomentSubject** — Priority-based assignment of subjects to scenes and moments.

### Deprecations (removed)
- `SubjectCategory` enum (`PEOPLE`, `OBJECTS`, `LOCATIONS`) — removed. All subjects are role-linked.
- `category` column — removed from all subject models.
- `is_custom` column — removed from `FilmSubject` and `ProjectFilmSubject`.

## Module structure

```
subjects/
  subjects.module.ts
  subjects.controller.ts        — thin route shell; dispatches to 4 services
  subjects-crud.service.ts      — Film-subject CRUD + template lookup
  subject-scene-assignments.service.ts
  subject-moment-assignments.service.ts
  subject-roles.service.ts      — Brand-scoped role CRUD (single + batch)
  subject.mapper.ts             — mapToSubjectResponse, mapToSceneSubjectResponse
  dto/
    create-subject.dto.ts
    update-subject.dto.ts
    create-subject-role.dto.ts  — CreateSubjectRoleDto
    create-subject-roles.dto.ts — CreateSubjectRolesDto (batch)
  types/
    subject-payload.type.ts     — SubjectWithDetails Prisma payload type
```

## Service Boundaries

| File | Service | Responsibility |
|------|---------|----------------|
| `subjects-crud.service.ts` | `SubjectsCrudService` | Film-subject CRUD, template lookup. Auto-assigns new subjects to every scene/moment at BACKGROUND priority. |
| `subject-scene-assignments.service.ts` | `SubjectSceneAssignmentsService` | Scene-subject assignment CRUD. Cleans camera-subject references on removal. |
| `subject-moment-assignments.service.ts` | `SubjectMomentAssignmentsService` | Moment-subject assignment CRUD. Cleans camera-subject references on removal. |
| `subject-roles.service.ts` | `SubjectRolesService` | Brand-scoped subject-role CRUD (single + batch create). |

## Routes

All routes are under `/subjects`.

### Film subjects
- `POST /films/:filmId/subjects` — create subject (auto-assigns to scenes + moments)
- `GET  /films/:filmId/subjects` — list film subjects
- `GET  /:id` — get single subject
- `PATCH /:id` — update subject
- `DELETE /:id` — delete subject (cascades + cleans camera refs)

### Scene / moment assignments
- `GET    /scenes/:sceneId` — list scene subject assignments
- `POST   /scenes/:sceneId/assign` — assign / upsert subject to scene
- `PATCH  /scenes/:sceneId/subjects/:subjectId` — update priority/notes
- `DELETE /scenes/:sceneId/subjects/:subjectId` — remove + clean camera refs
- `GET    /moments/:momentId` — list moment subject assignments
- `POST   /moments/:momentId/assign` — assign / upsert subject to moment
- `PATCH  /moments/:momentId/subjects/:subjectId` — update
- `DELETE /moments/:momentId/subjects/:subjectId` — remove + clean camera refs

### Templates & roles
- `GET  /templates/library` — subject templates (brand-scoped via `@BrandId()`)
- `GET  /roles/brand/:brandId` — list roles
- `POST /roles/brand/:brandId` — create role(s)
- `PATCH /roles/:roleId` — update role
- `DELETE /roles/:roleId` — delete role

## Key Models

`filmSubject`, `filmSceneSubject`, `filmSceneMomentSubject`, `subjectRole`, `subjectTemplate`, `sceneCameraAssignment`, `cameraSubjectAssignment`.

## Mapper

`subject.mapper.ts` — pure functions `mapToSubjectResponse` and `mapToSceneSubjectResponse` shared by `SubjectsService` and `SubjectScenesService`. Input types are explicit interfaces (not `any`).

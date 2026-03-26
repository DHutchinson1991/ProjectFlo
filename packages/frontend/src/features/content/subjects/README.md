# Subjects Feature (`features/content/subjects/`)

Film-subject management, scene/moment assignment, and brand-scoped role templates.

## Structure

```
features/content/subjects/
├── index.ts              # Public barrel — import from here
├── types/index.ts        # Canonical types (enums, interfaces, DTOs)
├── api/
│   ├── subjects.api.ts   # Film subjects, scene/moment assignments, templates
│   └── roles.api.ts      # Brand-scoped subject-role CRUD
├── hooks/
│   ├── useFilmSubjects.ts   # Film subject CRUD + templates + role templates
│   └── useSceneSubjects.ts  # Scene-subject assignment (multi-scene)
└── components/
    └── SubjectsCard.tsx      # Film subject card with template picker
```

## Import Convention

```ts
import { useFilmSubjects, SubjectCategory, type FilmSubject, SubjectsCard } from '@/features/content/subjects';
import { rolesApi } from '@/features/content/subjects/api/roles.api';
```

## API Modules

Both `subjectsApi` and `rolesApi` use the shared `request()` utility from `@/shared/api/client` which handles auth headers, brand context, and base URL.

### `subjectsApi`
- `getFilmSubjects(filmId)` — `GET /subjects/films/:filmId/subjects`
- `createSubject(filmId, dto)` — `POST /subjects/films/:filmId/subjects`
- `getSubject(id)` / `updateSubject(id, dto)` / `deleteSubject(id)`
- `getTemplates()` — `GET /subjects/templates/library` (brand via header)
- `getSceneSubjects(sceneId)` / `assignToScene(...)` / `removeFromScene(...)`
- `getMomentSubjects(momentId)` / `assignToMoment(...)` / `removeFromMoment(...)`

### `rolesApi`
- `getRoles(brandId)` — `GET /subjects/roles/brand/:brandId`
- `createRole(brandId, dto)` — `POST /subjects/roles/brand/:brandId` (single or batch)
- `updateRole(roleId, dto)` / `deleteRole(roleId)`

## Consumers

| Consumer | What it imports |
|---|---|
| `designer/films/[id]/page.tsx` | `useFilmSubjects`, `SubjectCategory` |
| `designer/instance-films/[id]/page.tsx` | `useFilmSubjects`, `SubjectCategory` |
| `SceneRecordingSetupModal.tsx` | `useFilmSubjects`, `useSceneSubjects` |
| `FilmSubjectsTab.tsx` | `SubjectCategory`, `SubjectsCard` |
| `FilmRightPanel.tsx` | `SubjectCategory` |
| `designer/templates/page.tsx` | `rolesApi` |
| `designer/subjects-templates/page.tsx` | `rolesApi`, `SubjectRole` |

## Deleted Legacy Files

- `lib/types/subjects.ts` — stale types (SubjectsLibrary shape)
- `lib/types/domains/subjects.ts` — replaced by `types/index.ts`
- `lib/api/subjects.api.ts` — wrong routes, zero consumers
- `hooks/subjects/useFilmSubjects.ts` — moved here
- `hooks/content-builder/scenes/useSceneSubjects.ts` — moved here
- `hooks/content-builder/moments/useMomentSubjects.ts` — zero consumers
- `designer/components/SubjectsCard.tsx` — moved here (rewrote fetch → API)
- `designer/components/SubjectsManagerCard.tsx` — zero consumers
- `components/subjects/SubjectsManagement.tsx` — zero consumers, stale types
- `api.ts` subjects block + type imports — removed

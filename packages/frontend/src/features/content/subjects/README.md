# Subjects Feature

## What this module does
Provides the frontend bindings, hooks, and UI for managing subjects, roles, and scene/moment assignments. The UI still uses some “film subject” wording, but the data now maps directly to backend `PackageDaySubject` records plus derived scene/moment membership.

## Key files
| File | Purpose |
|------|---------|
| `api/subjects.api.ts` | Typed `/subjects` request helpers |
| `api/roles.api.ts` | Brand-scoped role CRUD helpers |
| `hooks/useSubjects.ts` | Main subject CRUD/query hook used by film editors |
| `hooks/useSceneSubjects.ts` | Scene assignment helpers |
| `components/SubjectsCard.tsx` | Subject management card and picker UI |
| `types/index.ts` | Canonical frontend subject and assignment types |

## Business rules / invariants
- Subject CRUD flows go through typed API helpers in `api/`; avoid ad-hoc `fetch` calls.
- Scene membership is derived from moment assignments, so the UI should treat scene subjects as computed data.
- Subject role/template metadata must preserve brand context from the shared API client.
- `useSubjects` / `Subject` are the canonical frontend names; any `FilmSubject` aliases are migration-only compatibility shims.

## Related modules
- **Backend**: `packages/backend/src/content/subjects` — `/subjects` controllers and services.
- **Frontend**: `../moments` and film editor screens — consume subject hooks for assignment and shot preview setup.
- **Frontend**: `@/features/platform/brand` — supplies brand context for role/template queries.

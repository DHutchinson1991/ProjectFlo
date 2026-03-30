# workflow/crew

Crew operations — profile management, role assignment, and workload visibility for brand crew.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | `crewApi`, `userAccountsApi`, and job role assignment endpoint bindings |
| `hooks/useCrew.ts` | Query hooks: `useCrewList`, `useCrewByRole`, `useCrewWorkload`, `useCrew`, `useCrewRoster` (legacy aliases kept during migration) |
| `hooks/useCrewMutations.ts` | Mutation hooks: status, profile, user-account CRUD, job role updates |
| `constants/query-keys.ts` | `crewKeys` factory — brand-scoped |
| `types/index.ts` | Crew feature-local types and aliases |
| `screens/CrewManagementScreen.tsx` | Main crew management screen |
| `screens/CrewScreen.tsx` | Crew screen wrapper |

## Business rules

- Crew is scoped to a brand via contact + crew records.
- User account credentials and system roles are managed through `user-accounts`; crew profile/activity stays in workflow crew.
- Crew status transitions: `active` ↔ `inactive` (set via `setCrewStatus`).
- Workload is computed from assigned project tasks within a date range.
- Job roles are global entities; crew job role assignments are managed from this feature UI.
- Job-role assignment API bindings use `/api/job-roles/crew/*` routes (legacy `/crew/*` aliases remain server-side during migration).

## Backend

- Controller: `packages/backend/src/workflow/crew/crew.controller.ts`
- Service: `packages/backend/src/workflow/crew/crew.service.ts`
- User accounts controller: `packages/backend/src/platform/users/user-accounts/user-accounts.controller.ts`

## Related modules

- `workflow/staffing` — assigns crew to project tasks
- `workflow/projects` — crew workload derived from project assignments
- `platform/users/user-accounts` — account credentials and system role bindings

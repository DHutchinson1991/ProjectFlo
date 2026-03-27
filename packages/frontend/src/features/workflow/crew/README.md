# workflow/crew

Crew and contributor management — recruiting, onboarding, status tracking, job role assignment, and workload visibility for brand crew members.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | `crewApi` + `contributorsApi` endpoint bindings |
| `hooks/useCrew.ts` | Query hooks: `useCrewList`, `useCrewByRole`, `useCrewWorkload`, `useCrewMember`, `useContributors` |
| `hooks/useCrewMutations.ts` | Mutation hooks: status, profile, contributor CRUD, job role updates |
| `constants/query-keys.ts` | `crewKeys` factory — brand-scoped |
| `types/index.ts` | `CrewMember`, `Contributor`, `CrewWorkload`, DTOs |
| `components/CrewManagementScreen.tsx` | Main crew management screen (legacy, pre-migration) |
| `components/SkillTreeView.tsx` | Skill/job-role tree visualization |
| `screens/CrewScreen.tsx` | Crew screen wrapper |

## Business rules

- Crew members are scoped to a brand via contributors.
- A user can be a contributor to multiple brands with different job roles per brand.
- Crew status transitions: `active` ↔ `inactive` (set via `setCrewStatus`).
- Workload is computed from assigned project tasks within a date range.
- Job roles are global entities; contributors link users to brands with specific roles.

## Backend

- Controller: `packages/backend/src/workflow/crew/crew.controller.ts`
- Service: `packages/backend/src/workflow/crew/crew.service.ts`
- Contributors controller: `packages/backend/src/workflow/crew/contributors.controller.ts`

## Related modules

- `workflow/staffing` — assigns crew to project tasks
- `workflow/projects` — crew workload derived from project assignments
- ~~`catalog/crew`~~ — removed (was a duplicate of this module)

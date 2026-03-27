# skill-role-mappings

## What this module does
Maps skill names (e.g., "Cinematography", "Drone Operation") to job roles and payment brackets. Used to auto-resolve which role + bracket a task requires based on the skills it needs. Supports brand-specific overrides over global mappings.

## Key files
| File | Purpose |
|------|---------|
| `skill-role-mappings.service.ts` | CRUD for mappings (create, bulk, update, remove) |
| `services/skill-role-mappings-resolver.service.ts` | Resolution algorithm + batch resolve + analytics |
| `types/resolver.types.ts` | Shared types for resolver results (ResolvedRoleResult, MappingEntry, ScoredRole) |
| `services/skill-role-mappings-query.service.ts` | Summary and available-skills query endpoints |
| `skill-role-mappings.controller.ts` | REST endpoints (CRUD + resolve preview + summary) |
| `dto/*.dto.ts` | Split DTO files for CRUD, query, bulk, and resolve payloads |

## Business rules / invariants
- Skill names are Title Case normalized on create/update.
- Duplicate skill → role mappings throw `ConflictException` (Prisma P2002 unique).
- Resolution prefers brand-specific mappings (+100 priority bonus) over global.
- Resolution picks the role with the most matching skills, then the highest bracket level.
- Falls back to the lowest bracket if no bracket-specific mappings exist.
- Validates that the payment bracket belongs to the specified role on create.

## Data model notes
- **skill_role_mappings** — maps a skill name to a `job_roles` + optional `payment_brackets`, optionally brand-scoped.

## Related modules
- **Backend**: `../../business/task-library` — consumes `batchResolve` for auto-assigning roles to tasks
- **Frontend**: `features/catalog/skill-role-mappings`

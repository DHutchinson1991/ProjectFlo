# Job Roles

## What this module does
Manages the catalog of job roles (e.g. Videographer, Editor, Photographer) and their assignment to crew. Job roles drive payment bracket resolution, crew scheduling, and task auto-assignment.

## Key files
| File | Purpose |
|------|---------|
| `job-roles.service.ts` | CRUD for job role catalog entries + category grouping |
| `services/job-role-assignments.service.ts` | Link/unlink crew to roles, query by crew or role |
| `job-roles.controller.ts` | REST endpoints for roles + assignment management |
| `dto/job-role.dto.ts` | Create/Update job role DTOs |
| `dto/crew-job-role.dto.ts` | Assign/Update crew-role link DTOs (legacy filename) |

## Business rules / invariants
- Each crew record can hold multiple roles; one is marked `is_primary`.
- The primary role's payment bracket is used for rate resolution when no role-specific match exists.
- Deleting a job role cascades to `crew_job_roles` assignments.
- Job roles are brand-scoped via `brand_id`.
- Controller exposes both legacy `crew/*` routes and new `crew/*` aliases during migration.

## Related modules
- **Backend**: `../pricing` — uses job role brackets for rate audit
- **Backend**: `../../workflow/tasks` — task auto-assignment references crew role assignments
- **Frontend**: `features/catalog/job-roles` — role management UI

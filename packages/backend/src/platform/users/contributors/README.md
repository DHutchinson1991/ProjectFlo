# contributors

## What this module does
Owns contributor accounts, contributor profile updates, and contributor job-role assignments for the platform user model.

## Key files
| File | Purpose |
|------|---------|
| `contributors.service.ts` | Contributor CRUD and contributor profile updates |
| `services/contributor-job-roles.service.ts` | Contributor job-role assignment, removal, and primary-role switching |
| `contributors.controller.ts` | Contributor endpoints and admin-only job-role management |
| `dto/create-contributor.dto.ts` | Contributor creation contract |
| `dto/update-contributor.dto.ts` | Contributor update contract |

## Business rules / invariants
- Contributor creation creates the linked contact and hashes passwords before persistence.
- Contributor lists are brand-scoped through the shared `BrandId` decorator.
- Global admins remain visible because they have no brand-restricted contact record.
- Job-role assignments are unique per contributor and only one role should be primary at a time.

## Related modules
- **Backend**: `../roles` — primary contributor role records
- **Backend**: `../../../catalog/job-roles` — contributor job-role assignments
- **Frontend**: `packages/frontend/src/lib/api.ts` — legacy contributor API consumer

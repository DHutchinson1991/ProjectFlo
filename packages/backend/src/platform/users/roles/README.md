# roles

## What this module does
Manages platform crew roles and exposes authenticated role CRUD endpoints for brand-scoped role administration.

## Key files
| File | Purpose |
|------|---------|
| `roles.service.ts` | Role CRUD and brand-scoped role listing |
| `roles.controller.ts` | Role endpoints and admin authorization |
| `dto/create-role.dto.ts` | Role creation contract |
| `dto/update-role.dto.ts` | Role update contract |

## Business rules / invariants
- Role list requests read brand context via the shared `BrandId` decorator.
- Missing roles fail fast with `NotFoundException`.
- Create, update, and delete operations remain admin-only.

## Related modules
- **Backend**: `../crew` — crew primary role relation
- **Frontend**: `packages/frontend/src/lib/api.ts` — legacy roles API consumer

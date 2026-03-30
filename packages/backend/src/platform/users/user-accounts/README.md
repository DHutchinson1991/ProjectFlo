# User Accounts

## What this module does
Manages account credentials and system-role bindings for crew contacts. It creates and updates `user_account` records and returns crew-linked account views for admin UIs.

## Key files
| File | Purpose |
|------|---------|
| `user-accounts.controller.ts` | HTTP routes for account CRUD (`/api/user-accounts`) |
| `user-accounts.service.ts` | Core account create/read/update/delete logic |
| `dto/create-user-account.dto.ts` | Input contract for account creation |
| `dto/update-user-account.dto.ts` | Input contract for account updates |

## Business rules / invariants
- Account creation starts from a unique contact email and creates both contact and user account records.
- Passwords are always stored as hashes.
- System role assignment is persisted on `UserAccount.system_role_id`.
- Crew profile data (status, workload, assignment activity) is owned by workflow crew services.

## Related modules
- **Backend**: `packages/backend/src/platform/auth` — validates login against user accounts
- **Backend**: `packages/backend/src/workflow/crew` — crew operational profile and assignment endpoints
- **Frontend**: `packages/frontend/src/features/workflow/crew` — management UI that calls this API

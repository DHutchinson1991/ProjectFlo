# Users

## What this module does
Parent container for user-related sub-modules. Does not expose its own controller or service — all logic lives in sub-modules: contacts, contributors, and roles.

## Key files
| File | Purpose |
|------|---------|
| `contacts/` | Contact management (clients, vendors, crew contacts) |
| `contributors/` | Contributor profiles (crew members, operators, talent) |
| `roles/` | User role definitions and permissions |

## Business rules / invariants
- A `Contact` is a person in the system (client, vendor, crew). A `Contributor` is a user who can be assigned to work.
- Contacts belong to a brand (`brand_id` required for tenant isolation).
- Sub-modules each own their own controller, service, and DTOs.

## Related modules
- **Backend**: `platform/auth/` — authentication checks user roles
- **Backend**: `workflow/crew/` — crew members are contributors with job role assignments
- **Backend**: `workflow/inquiries/` — contacts are referenced as inquiry contacts

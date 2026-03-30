# Users

## What this module does
Parent container for user-related sub-modules. Does not expose its own controller or service; logic lives in contacts, user-accounts, and roles.

## Key files
| File | Purpose |
|------|---------|
| `contacts/` | Contact management (clients, vendors, crew contacts) |
| `user-accounts/` | Login credentials + system role bindings for crew contacts |
| `roles/` | User role definitions and permissions |

## Business rules / invariants
- A `Contact` is a person in the system (client, vendor, crew).
- A `UserAccount` stores authentication credentials and platform role for a contact.
- Crew assignment/workload belongs to workflow modules, not this parent container.
- Sub-modules each own their own controller, service, and DTOs.

## Related modules
- **Backend**: `platform/auth/` — authentication checks user roles
- **Backend**: `workflow/crew/` — crew profile and operational assignment flows
- **Backend**: `workflow/inquiries/` — contacts are referenced as inquiry contacts

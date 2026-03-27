# contacts

## What this module does
Manages contact records used across inquiries, projects, and contributor-linked identities, including brand-scoped listing and submission-trigger sync updates.

## Key files
| File | Purpose |
|------|---------|
| `contacts.service.ts` | Contact CRUD and linked inquiry subtask resync logic |
| `contacts.controller.ts` | Contact endpoints and brand-context handling |
| `dto/create-contact.dto.ts` | Contact creation contract |
| `dto/update-contact.dto.ts` | Contact update contract |

## Business rules / invariants
- Contact lists are brand-scoped when `X-Brand-Context` is present.
- Updating email or phone number triggers linked inquiry auto-subtask re-evaluation.
- Missing contacts fail fast with `NotFoundException`.
- Brand context is read with the shared `BrandId` decorator.

## Related modules
- **Backend**: `../../../workflow/tasks` — inquiry task sync on contact submission changes
- **Frontend**: `packages/frontend/src/lib/api.ts` — legacy contact API consumer

# Workflow

## What this module does
Aggregates all client-to-project lifecycle modules: from initial client contact and inquiry through proposals, projects, staffing, scheduling, and equipment management.

## Key files
| File | Purpose |
|------|---------|
| `workflow.module.ts` | Aggregator module — imports and re-exports all 12 sub-modules |

## Sub-modules
| Module | Purpose |
|--------|---------|
| `calendar/` | Event scheduling, discovery calls, attendees, tags, settings |
| `clients/` | Client/contact management |
| `crew/` | Crew assignment, availability, crew-member management |
| `equipment/` | Equipment inventory, templates, availability tracking |
| `inquiries/` | Inquiry lifecycle, package management, client portal actions |
| `inquiry-wizard/` | Step-by-step inquiry creation with estimate preview |
| `locations/` | Venue/location CRUD and geocoding |
| `crew-slots/` | Package/project crew slot management |
| `projects/` | Project lifecycle, package cloning, snapshots, sync, reassignment |
| `proposals/` | Proposal CRUD, content generation, lifecycle management |
| `task-library/` | Reusable task templates, preview, auto-generation |
| `tasks/` | Active task tracking, inquiry task lifecycle/generation/status |

## Business rules / invariants
- All workflow modules are brand-scoped via `X-Brand-Context` header.
- The `tasks/` module exports `InquiryTasksService` (facade) consumed by finance and content modules.

## Related modules
- **Platform**: `../platform` — auth, users, brands, prisma
- **Catalog**: `../catalog` — pricing rules, event types, packages, skill-role mappings
- **Content**: `../content` — films, scenes, moments, schedule
- **Finance**: contracts, estimates, quotes, invoices (root-level, pending migration)

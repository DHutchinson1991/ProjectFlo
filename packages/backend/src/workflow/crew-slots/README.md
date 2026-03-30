# Crew Slots Module

## What this module does
Manages package and project crew slot records for workflow scheduling. It owns package template slot CRUD, slot equipment and activity linking, and project or inquiry crew assignment cascades.

## Key files
| File | Purpose |
|------|---------|
| `crew-slots.module.ts` | Registers the crew slots controller and services |
| `crew-slots.controller.ts` | Exposes `/api/crew-slots` package and project assignment routes |
| `services/package-crew-slots.service.ts` | Package template crew slot CRUD, equipment, and activity linking |
| `services/project-crew-slots.service.ts` | Project and inquiry slot assignment with task cascade updates |
| `dto/crew-slots.dto.ts` | Barrel export for package crew slot DTOs |
| `dto/crew-slots-day-query.dto.ts` | Query DTO for optional day filtering |

## Business rules / invariants
- Package slots are stored as `PackageDayOperator` records and remain template-scoped.
- Project and inquiry slots are stored as `ProjectDayOperator` records and carry live crew assignment.
- Assigning a crew to a project or inquiry slot must cascade matched task assignees and unset `review_estimate` auto-subtask state for inquiries.
- Slot equipment and activity links are replace-or-delete operations; no backward-compatibility shim exists for old `/api/operators` routes.

## Related modules
- **Backend**: `../tasks` — inquiry task services used for assignment cascade behavior
- **Backend**: `../../content/schedule` — instance schedule endpoints expose `instance/crew-slots/*` routes
- **Frontend**: `packages/frontend/src/features/workflow/scheduling` — schedule consumers call the crew slot APIs

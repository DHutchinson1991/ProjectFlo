# Crew Module

**Bucket**: workflow  
**Owner domain**: crew roster management and workload

## Responsibility

Manages the crew roster for a brand: who is on crew, their profiles, job roles, and workload across inquiries and projects. Handles promotion of contributors to crew status.

## Exposed Surface

| Symbol | Description |
|---|---|
| `CrewModule` | NestJS module |
| `CrewService` | Crew querying |
| `CrewManagementService` | Status management, profile updates, workload |
| `CrewController` | REST controller — `/crew` |

## Key Concepts

- A crew member is a contributor (user with a brand relationship) who has a `job_role` assignment.
- Workload is computed across `package_day_operator` and `project_event_day_operator` records.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/crew` | List crew by brand |
| GET | `/crew/contributors` | List all contributors (for promotion flows) |
| GET | `/crew/by-role` | Filter crew by job role |
| GET | `/crew/:id` | Full crew member detail |
| PATCH | `/crew/:id/status` | Promote/demote crew status |
| PATCH | `/crew/:id/profile` | Update crew profile fields |
| GET | `/crew/:id/workload` | Crew workload summary |

## Files

```
crew/
  crew.module.ts
  crew.controller.ts              ≤200 lines
  services/
    crew.service.ts               ≤250 lines — querying, detail, by-role
    crew-management.service.ts    ≤250 lines — status, profile, workload
```

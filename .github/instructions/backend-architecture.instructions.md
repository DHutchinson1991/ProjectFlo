---
description: "Use when creating new backend modules, services, controllers, or DTOs. Covers domain bucket placement, file naming, service splitting, size limits, and refactor triggers."
applyTo: "packages/backend/src/**"
---

# ProjectFlo — Backend Architecture Rules

## Domain buckets

All new backend feature code must live under exactly one of these top-level buckets:

| Bucket | Owns |
|--------|------|
| `platform` | Auth, users, tenancy, Prisma, shared framework infrastructure |
| `catalog` | Reusable definitions, templates, pricing rules, package definitions, event types, workflow definitions |
| `workflow` | Client-to-project lifecycle: clients, inquiries, discovery, proposals, projects, staffing, scheduling, equipment, locations |
| `content` | Creative/film structure: films, scenes, moments, subjects, coverage, beats, music |
| `finance` | Quotes, estimates, contracts, invoices, payment schedules, payment brackets, crew payment templates |

- Put code where it owns the lifecycle, not where it is first referenced.
- Do not create new folders directly under `packages/backend/src`; place them under one bucket.
- Do not create junk-drawer buckets (`business`, `sales`, `core`, `helpers`, `misc`, `shared`, `utils`).

## File naming

- Lowercase kebab-case folders.
- Allowed patterns: `feature.module.ts`, `feature.controller.ts`, `feature.service.ts`, `feature.mapper.ts`, `feature.types.ts`, `create-feature.dto.ts`, `update-feature.dto.ts`, `feature-response.dto.ts`, `feature-query.dto.ts`.
- One primary export per file. One DTO class per file.
- No vague names: `utils.ts`, `helpers.ts`, `misc.ts`, `shared.ts`, `common.ts`.

## Service rules

- One bounded responsibility per service file.
- Do not combine CRUD, relationship assignment, response mapping, and admin logic in one service.
- Split example: `subjects.service.ts` (CRUD), `subject-scenes.service.ts` (scene assignment), `subject.mapper.ts` (mapping).

## Size limits

| File type | Max lines |
|-----------|-----------|
| Service | 250 |
| Controller | 200 |
| DTO | 120 |
| Method | 40 target, 60 hard ceiling |

If a file exceeds the limit, refactor before adding more logic.

## Typing

- No `any` in services, controllers, or mappers.
- Use Prisma payload types, DTOs, or local explicit type aliases.

## Method naming

- Use intent-revealing names: `create*`, `find*`, `update*`, `remove*`, `assign*`, `unassign*`.
- No vague names: `getStuff`, `handleData`, `manageFeature`, `processThing`.
- Prefer fail-fast over silent fallback chains.

## Feature READMEs

Every backend module folder must contain a `README.md`. See `feature-readmes.instructions.md` for the template. Read the module's README before editing code; update it in the same change if business rules, key files, or cross-references change.

## Refactor triggers

Refactor immediately when:
- A service handles more than one subdomain.
- A file becomes difficult to name precisely.
- A mapper grows inside a service.
- A file exceeds the size limits above.

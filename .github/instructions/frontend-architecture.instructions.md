---
description: "Use when placing or moving frontend code, creating features, or deciding whether code belongs in app, features, or shared."
applyTo: "packages/frontend/src/**"
---

# ProjectFlo — Frontend Architecture Rules

## Top-level ownership
- `app/` = Next.js route shells only
- `features/` = domain UI, hooks, types, and API bindings
- `shared/` = cross-bucket primitives only

Do not create new top-level folders under `packages/frontend/src`.

## Frozen legacy folders
Never add new domain code to:
- `src/lib/types/`
- `src/types/`
- `src/components/`
- `src/hooks/`

Use feature-local folders or `shared/` instead.

## Domain buckets
All new feature code must live under exactly one bucket:
- `platform`
- `catalog`
- `workflow`
- `content`
- `finance`

Put code where it owns the lifecycle, not where it first renders.

## Route rules
Route files in `app/` should stay thin:
- read params
- compose guards or layout
- render a feature screen

Do not keep feature business logic, feature types, or large data orchestration in route files.

## Default feature shape
Use this structure when a feature grows:
- `api/`
- `components/`
- `hooks/`
- `screens/`
- `types/`
- `index.ts`

Add extra folders only when clearly needed.

## Shared rules
- `shared/` may import only external packages or other `shared/` code.
- `features/` may import from `shared/`.
- `app/` may import from `features/` and `shared/`.
- Promote code to `shared/` only when it is used across at least two unrelated buckets.

## Naming and size
- Use precise kebab-case file names.
- Avoid vague names like `helpers.ts`, `utils.ts`, or `common.ts`.
- If a component, hook, or screen grows too large or owns multiple concerns, split it before adding more logic.

## Feature READMEs
Each frontend feature folder should have a `README.md`. Update it in the same change when key files, business rules, or cross-module links change.

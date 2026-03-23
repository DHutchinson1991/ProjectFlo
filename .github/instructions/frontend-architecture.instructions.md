---
description: "Use when creating or moving frontend features, pages, hooks, components, or folders. Covers route ownership, feature buckets, shared code boundaries, file placement, and refactor triggers."
applyTo: "packages/frontend/src/**"
---

# ProjectFlo - Frontend Architecture Rules

## Top-level structure

All new frontend code must live under exactly one of these top-level buckets:

| Bucket | Owns |
|--------|------|
| `app` | Next.js routing only: route groups, `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` |
| `features` | All domain behavior, feature UI, feature hooks, feature types, and feature API bindings |
| `shared` | Cross-domain primitives only: reusable UI primitives, app-wide utilities, API client infrastructure, theme |

- Do not create new top-level buckets under `packages/frontend/src`.
- Do not place new domain code directly in `src/components`, `src/hooks`, `src/types`, or `src/lib/types`.
- Treat existing generic root folders as legacy until migrated.

## Domain buckets

All new feature code under `features` must live under exactly one of these buckets:

| Bucket | Owns |
|--------|------|
| `platform` | Auth, brand context, app shell, settings, permissions, notifications, shared app infrastructure |
| `catalog` | Reusable package definitions, templates, event types, pricing rules, task libraries, setup definitions |
| `workflow` | Client lifecycle and operations: portal, inquiries, proposals, projects, tasks, scheduling, staffing, locations, equipment |
| `content` | Creative/media structure: films, scenes, moments, subjects, beats, music, coverage, ContentBuilder |
| `finance` | Estimates, quotes, contracts, invoices, payment schedules, payment brackets |

- Put code where it owns the lifecycle, not where it is first rendered.
- Do not create new junk-drawer buckets like `common`, `helpers`, `misc`, `lib`, or `shared` inside `features`.
- Do not create frontend-only taxonomy buckets like `sales`, `designer`, `manager`, or `portal` at the `features` root. Those are route surfaces, not ownership domains.

## Route layer rules

Route folders in `app` are composition shells only.

Allowed responsibilities in route files:
- read route params and search params
- call feature hooks or feature loaders
- render a feature screen
- provide route-only composition or guards

Not allowed in route files:
- large business logic blocks
- feature-specific helper modules
- feature-owned types
- deep state machines that belong to a feature folder

- If a route needs more than a small amount of supporting code, move it to `features/<bucket>/<feature>` and keep the route file thin.
- Route groups like `(studio)` and `(portal)` own URL structure and shell composition, not business ownership.

## Feature folder shape

Use this default shape for each feature and add folders only when they earn their place:

```text
feature-name/
  api/
  components/
  hooks/
  screens/
  types/
  constants/
  mappers/
  selectors/
  index.ts
```

- Keep feature hooks, feature types, feature components, and feature API calls together in the same feature folder.
- Prefer precise names like `package-selectors.ts` or `inquiry-mappers.ts` over vague files like `helpers.ts` or `utils.ts`.
- One clear ownership path is better than a shared global bucket.

## Shared layer rules

`shared` is for cross-domain primitives only.

Allowed examples:
- `shared/ui`
- `shared/forms`
- `shared/api/client`
- `shared/api/query`
- `shared/theme`
- `shared/utils`
- `shared/types`

Not allowed in `shared`:
- package-specific UI
- inquiry-specific hooks
- film-specific types
- project-specific selectors

- If code is used by one feature only, keep it inside that feature.
- If code is reused across unrelated domains, move it to `shared`.

## Concrete target tree

```text
packages/frontend/src/
  app/
    (portal)/
      portal/[token]/page.tsx
      proposals/[token]/page.tsx
      sign/[token]/page.tsx
      needs-assessment/[token]/page.tsx
    (studio)/
      dashboard/page.tsx
      calendar/page.tsx
      settings/page.tsx
      manager/
        page.tsx
        tasks/page.tsx
        equipment/page.tsx
        locations/page.tsx
      designer/
        page.tsx
        films/page.tsx
        packages/page.tsx
      sales/
        inquiries/page.tsx
    layout.tsx
    providers.tsx

  features/
    platform/
      auth/
      brand/
      shell/
        studio-shell/
        portal-shell/
      settings/
      permissions/
      notifications/

    catalog/
      packages/
      templates/
      event-types/
      task-library/
      coverage-templates/
      recording-setup/
      pricing-rules/

    workflow/
      client-portal/
      inquiries/
      needs-assessment/
      proposals/
      projects/
      tasks/
      schedule/
      staffing/
      equipment/
      locations/
      calendar/

    content/
      films/
      scenes/
      moments/
      subjects/
      beats/
      music/
      coverage/
      content-builder/

    finance/
      estimates/
      quotes/
      contracts/
      invoices/
      payment-schedules/
      payment-brackets/

  shared/
    api/
      client/
      query/
    ui/
    forms/
    theme/
    hooks/
    utils/
    types/
```

## Placement guidance

- Client portal implementation belongs in `features/workflow/client-portal`, not a separate top-level `portal` bucket.
- Project management belongs in `features/workflow/projects`, `features/workflow/tasks`, `features/workflow/schedule`, and `features/workflow/staffing`.
- Studio and portal shells belong in `features/platform/shell`.
- ContentBuilder belongs entirely in `features/content/content-builder`.
- Package definition and package editing behavior belongs in `features/catalog/packages` unless it clearly belongs to project execution workflow.

## File naming

See `frontend-conventions.instructions.md` for component naming, barrel exports, and MUI rules.

- Use lowercase kebab-case for folders.
- Use precise file names: `package-actions.ts`, `inquiry-summary-card.tsx`, `film-query-keys.ts`.
- Avoid vague names: `helpers.ts`, `utils.ts`, `common.ts`, `shared.ts`, `misc.ts`.

## Size limits

| File type | Max lines |
|-----------|-----------|
| Route file | 150 target, 220 hard ceiling |
| Screen component | 250 |
| Hook | 150 |
| Utility or selector | 120 |

If a route file or feature file exceeds the limit, refactor before adding more logic.

## Refactor triggers

Refactor immediately when:
- a route file becomes the main owner of feature logic
- a feature cannot be named precisely
- the same feature is split across `app`, generic root folders, and multiple domains
- a file exceeds the size limits above
- a developer would reasonably have to check more than one possible home to find a feature

## Feature READMEs

Every feature folder must contain a `README.md`. See `feature-readmes.instructions.md` for the template. Read the feature's README before editing code; update it in the same change if business rules, key files, or cross-references change.

## Migration direction

- Freeze legacy generic folders for new work.
- When touching an existing feature, prefer moving newly edited code toward the target tree instead of adding more code to the legacy location.
- Keep migrations incremental: thin route first, then move hooks, components, types, and API bindings behind it.
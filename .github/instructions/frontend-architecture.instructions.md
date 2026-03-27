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

### Legacy-frozen folders (HARD RULE)

The following folders are **frozen for new code**. Never add, create, or move files into them:

| Frozen folder | What goes there instead |
|---|---|
| `src/lib/types/` | `features/<bucket>/<feature>/types/` for domain types; `shared/types/` for cross-domain primitives |
| `src/types/` | Same as `src/lib/types/` above |
| `src/components/` | `features/<bucket>/<feature>/components/` or `shared/ui/` |
| `src/hooks/` | `features/<bucket>/<feature>/hooks/` or `shared/hooks/` |

- **Do not add new type files to `lib/types/`** — not even "temporarily".
- **Do not import-and-re-export** from `lib/types/` into new feature code; define the type in the feature instead.
- Violations of this rule are logged to `error-ledger.md`.

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
- Code shared within a single bucket stays in that bucket (e.g., a hook used by `workflow/inquiries` and `workflow/projects` lives in `workflow/`, not `shared/`). Only promote to `shared/` when **≥2 unrelated buckets** need it.
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

### Feature `api/` folder

Endpoint bindings for a feature live in `<feature>/api/`. These call the shared API client — never raw `fetch()`.

```text
features/<bucket>/<feature>/api/
  index.ts          # typed endpoint functions; import and call the shared ApiClient
```

- **Authenticated endpoints**: use the shared `ApiClient` (`get<T>()`, `post<T>()`, `patch<T>()`, etc.).
- **Public endpoints** (no auth): use `publicGet`/`publicPost`/`publicPatch` methods from the shared client.
- Type every response generic — no `<any>` or `Promise<any>` return types.
- Import `ApiClient` from `@/shared/api/client` only. Do not use the legacy `shared/types/api-client.types` shim in new or migrated feature API files.

Feature API design rules:
- Keep endpoint bindings in the owning feature `api/` folder. Do not call low-level `request()` directly from feature helpers, screens, or utils when an owning feature API can express the endpoint.
- If a feature API grows beyond one coherent resource surface, split it into multiple domain files (`service-packages.api.ts`, `package-sets.api.ts`, etc.) and keep `index.ts` as a barrel or factory entry.
- Do not keep duplicate method names for the same endpoint shape (`getOne` and `getById` hitting the same route). Pick one canonical name and update all consumers in the same change.
- Inline request/response DTOs are acceptable only for very small one-off payloads. Reused or complex payloads belong in the feature `types/` folder.
- Pure re-export proxy API files are not allowed as compatibility shims. Update imports to the canonical feature API path instead.

**Concrete import:**

```ts
import { apiClient } from '@/shared/api/client';

// feature endpoint
export const getInquiry = (id: number) =>
  apiClient.get<InquiryResponse>(`/api/inquiries/${id}`);
```

## Size limits

| File type | Target | Hard ceiling |
|-----------|--------|--------------|
| Component | 200 | 300 |
| Screen / page-level container | 300 | 400 |
| Hook | 80 | 150 |
| Mapper / selector / util | 100 | 150 |
| Feature `api/index.ts` | 120 | 200 |

### Method / JSX block limits

| Scope | Target | Hard ceiling |
|-------|--------|--------------|
| Single function / handler | 40 | 60 |
| Single JSX return block | 50 | 80 |

**Enforcement:**
- If a file exceeds its **hard ceiling**, it must be split before any new logic is added.
- If a file exceeds its **target**, flag it in code review and plan a split.
- Violations are logged to `error-ledger.md`.

## Refactor triggers

Refactor immediately (do not defer) when any of these are true:

- A component renders **more than one conceptual panel** (e.g., a list view AND a full dialog AND a popover). Each distinct UI surface should be its own component file.
- A component contains **data-fetching / assembly logic** that exceeds 20 lines. Extract it into a hook.
- A component contains **business logic** (rate resolution, cost computation, line-item generation) that is not UI rendering. Extract it into a hook, mapper, or selector.
- A file **exceeds the hard ceiling** for its type.
- You **cannot name the file precisely** — if a component does too many things to have a clear name, it needs splitting.
- A handler function **builds or transforms data** (not just calling a mutation and closing a dialog). Move the data assembly into a hook or mapper and keep the handler thin.

### Split patterns (cheat sheet)

| Smell | Fix |
|-------|-----|
| Component has a large dialog inside it | Extract `<FeatureDialog />` into its own file |
| Component has accordion/list items with action buttons | Extract `<FeatureListItem />` |
| Component has a popover with its own load + render logic | Extract `<FeaturePopover />` |
| Component has 50+ lines building initial data for a form | Extract `useFeatureBuilder()` hook |
| Component has inline category color maps, status maps | Move to `constants/` |
| Component repeats the same 3-line MUI sx pattern | Extract a thin styled wrapper in the same `components/` folder |

## Shared layer rules

`shared` is for cross-domain primitives only. This section owns all structural rules, placement decisions, and naming conventions. Each `shared/` subfolder has a `README.md` with its file inventory, business invariants, and related modules — do not duplicate those details here.

### Import direction (HARD RULE)

- `shared/` → external packages only. **Never** import from `features/` or `app/`.
- `features/` → may import from `shared/` and from other features.
- `app/` → may import from `features/` and `shared/`.
- Violations are logged to `error-ledger.md`.

### Promotion threshold

Code must be used by **≥ 2 unrelated domain buckets** to live in `shared/`. Two features inside the same bucket (e.g., `workflow/inquiries` and `workflow/projects`) does **not** qualify — keep it in `workflow/` instead.

### No empty folders

Every `shared/` subfolder must contain at least one real file at creation time. A `README.md` that documents the folder's purpose satisfies this rule.

### Current subfolders

| Folder | Purpose |
|--------|--------|
| `shared/api/client/` | HTTP client, auth headers, brand context injection |
| `shared/debug/` | Runtime dev logging toggles (feature flags for console output) |
| `shared/theme/` | Design tokens, MUI ThemeProvider, global CSS |
| `shared/types/` | Ambient type declarations (`.d.ts`) and types consumed by `shared/` internals |
| `shared/ui/` | Reusable UI components used across ≥2 unrelated feature buckets |

Create new subfolders (e.g., `shared/hooks/`, `shared/forms/`) only when the first real file needs a home — not speculatively.

### Not allowed in `shared`

- Package-specific UI
- Inquiry-specific hooks
- Film-specific types
- Project-specific selectors
- Domain entity types (`Inquiry`, `Film`, `Package`) — these belong in the owning feature's `types/`

### Naming conventions

| Subfolder | Convention | Example |
|-----------|------------|--------|
| `shared/ui/` | `PascalCase/` folder, `ComponentName.tsx` + `index.ts` barrel | `EmptyState/EmptyState.tsx` |
| `shared/types/` | `kebab-case.d.ts` or `kebab-case.ts` | `css.d.ts` |
| `shared/theme/` | `kebab-case.ts` for tokens, `PascalCase.tsx` for providers | `tokens.ts`, `ThemeProvider.tsx` |
| `shared/api/client/` | `kebab-case.ts` | `api-client.ts`, `token-provider.ts` |
| `shared/debug/` | `kebab-case.ts` | `log-flags.ts` |

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
      client/         # HTTP client + auth + brand context
    theme/             # design tokens, ThemeProvider, global CSS
    types/             # ambient declarations (.d.ts) only
    ui/                # cross-bucket UI primitives (PascalCase folders)
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

## Feature migration status

Track which features are fully migrated to the bucketed architecture. A feature is **complete** when it has: `api/`, `hooks/`, `types/`, `components/`, and `README.md`.

### Incomplete features (TODO — migrate when next touched)

No incomplete features remaining. All features are either fully migrated or deleted.

### Recently completed migrations

| Feature | Status | Notes |
|---------|--------|-------|
| `platform/auth` | **Complete** | api/, constants/query-keys added (provider-based, no React Query hooks needed) |
| `platform/brand` | **Complete** | api/, constants/query-keys added (provider-based, no React Query hooks needed) |
| `platform/settings` | **Complete** | api/, hooks/, constants/query-keys, README |
| `platform/studio-layout` | **Complete** | README added (presentation-only, no data fetching) |
| `workflow/clients` | **Complete** | api/, hooks/, types/, constants/query-keys, README |
| `workflow/crew` | **Complete** | api/, hooks/, types/, constants/query-keys, README |
| `workflow/resources` | **Complete** | README added (navigation hub only, no data fetching) |
| `workflow/scheduling` | **Complete** | README added |
| `content/coverage` | **Complete** | api/, hooks/, constants/query-keys, README |
| `content/music` | **Complete** | README added (api/ uses raw fetch — migrate to apiClient when next touched) |
| `catalog/crew` | **Deleted** | Duplicate of `workflow/crew` — removed, route updated |

### queryKeys standardization (TODO)

`workflow/calendar`, `workflow/proposals`, `workflow/clients`, `workflow/crew`, `platform/settings`, `platform/auth`, `platform/brand`, and `content/coverage` have `constants/query-keys.ts`. All data-fetching features should add query key factories. Prioritize features with complex cache invalidation: `inquiries`, `projects`, `estimates`, `quotes`, `films`.
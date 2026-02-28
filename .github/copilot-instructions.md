# ProjectFlo Copilot Instructions

## Quick operating rules (Do/Don’t)
- Do use existing layers: frontend `api.ts`/hooks and backend `module -> controller -> service -> prisma`.
- Do keep brand context explicit end-to-end (`BrandProvider` -> `X-Brand-Context`/`brandId` -> controller parsing -> service filter).
- Do check `SCENE_SAVE_DATA_FLOW.md` before touching timeline save logic.
- Don’t add ad-hoc `fetch` calls in UI when typed API methods/hooks already exist.
- Don’t bypass `PrismaService` with direct DB access outside backend services.
- Don’t auto-start/stop long-running dev servers as an agent; ask user to run `pnpm dev`.

## Fast task map (read this first)
- Auth/session bugs: `packages/frontend/src/app/providers/AuthProvider.tsx` + `packages/backend/src/core/auth/*`.
- Brand scoping bugs: `packages/frontend/src/app/providers/BrandProvider.tsx`, `packages/frontend/src/lib/api.ts`, `packages/backend/src/projects/projects.controller.ts`.
- API request shape/type issues: `packages/frontend/src/lib/api.ts` and `packages/frontend/src/lib/types/*`.
- ContentBuilder component work: `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md` and `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/**`.
- Timeline save/moment persistence bugs: `SCENE_SAVE_DATA_FLOW.md` first, then ContentBuilder save hooks.
- Data model/migration changes: `packages/backend/prisma/schema.prisma` + `npx prisma generate`.

## Big picture architecture
- Monorepo with pnpm workspaces: `packages/backend` (NestJS + Prisma + PostgreSQL) and `packages/frontend` (Next.js 14 + React Query + MUI).
- Backend feature modules are domain-oriented and wired in `packages/backend/src/app.module.ts` (core/auth/users, business, content, projects, sales).
- Shared DB access uses `PrismaService` (`packages/backend/src/prisma/prisma.service.ts`) injected into services; avoid direct DB access outside services.
- Frontend API integration is centralized in `packages/frontend/src/lib/api.ts` (typed domain methods, auth token handling, brand-context injection).
- ContentBuilder is a major subsystem under `packages/frontend/src/app/(studio)/designer/components/ContentBuilder` with a domain-based component layout documented in `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md`.

## Critical workflows
- Use root workspace commands from repo root:
  - `pnpm dev` (both apps), `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`.
- Backend local DB workflow (from `packages/backend`):
  - `npx prisma generate`, `npx prisma db push`, `npx prisma db seed`, `npx prisma migrate dev`.
- Narrow debug loop for backend changes: run from `packages/backend` with `npm test` or targeted scripts before workspace-wide commands.
- Auth token tooling lives in `tools/auth` (`tools/auth/get-auth-token.js`, `tools/auth/get-dev-token.js`), with tokens stored under `.auth/tokens`.
- For API debugging, this repo commonly tests endpoints with curl + auth headers (see `tools/auth/README.md` and `v1.instructions.md`).
- Agent operating rule for this repo: do not start/stop long-running dev servers automatically; ask user to run `pnpm dev` in a dedicated terminal.

## Project-specific conventions
- Multi-tenant brand scoping is first-class:
  - Frontend sets brand context via `BrandProvider` (`packages/frontend/src/app/providers/BrandProvider.tsx`) and injects `X-Brand-Context` + `brandId` in API utilities (`packages/frontend/src/lib/api.ts`, `packages/frontend/src/hooks/utils/api.ts`).
  - Backend controllers frequently read `@Headers('x-brand-context')` and/or `brandId` query params (e.g., `packages/backend/src/projects/projects.controller.ts`, `packages/backend/src/core/users/contributors/contributors.controller.ts`).
- Auth is JWT-based with refresh flow:
  - Backend: `packages/backend/src/core/auth/auth.service.ts`, `jwt.strategy.ts`, `auth.module.ts`.
  - Frontend: `packages/frontend/src/app/providers/AuthProvider.tsx` + `authService` in `packages/frontend/src/lib/api.ts`.
- Content timeline persistence has non-trivial save semantics (scene IDs remap from client IDs to DB IDs, moments saved separately, order preserved); see `SCENE_SAVE_DATA_FLOW.md` before changing save logic.
- In ContentBuilder, follow symmetric naming and domain folders (file name = component name = export name), and use barrel exports (`index.ts`) as described in `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md`.

## Brand safety checklist (before merging)
- Frontend request includes `Authorization` and `X-Brand-Context` (or explicit `brandId`).
- Endpoint URL does not accidentally drop brand query when required.
- Backend controller parses header/query brand ID consistently.
- Backend service query applies brand filter where data is tenant-scoped.
- Query cache invalidation considers brand-switch behavior (`BrandProvider` + React Query keys).

## Integration points and safe change strategy
- When adding backend features, implement the Nest pattern: `module -> controller -> service -> prisma`, with DTO validation at controller boundaries.
- When adding frontend data features, prefer existing typed API clients/hooks instead of ad-hoc `fetch` calls in UI components.
- Keep brand-awareness explicit end-to-end (provider -> headers/query -> controller parsing -> service filtering), or behavior will silently leak cross-brand data.
- Verify changes with narrow tests first (package-level scripts) before workspace-wide runs.
- High-risk files (change carefully):
  - `packages/frontend/src/lib/api.ts`
  - `packages/frontend/src/app/providers/BrandProvider.tsx`
  - `packages/frontend/src/app/providers/AuthProvider.tsx`
  - `SCENE_SAVE_DATA_FLOW.md` (behavior contract for timeline persistence)
  - `packages/backend/prisma/schema.prisma`
- Key reference files for onboarding and intent:
  - `README.md`
  - `packages/backend/prisma/schema.prisma`
  - `.github/refactor-films/00_ARCHITECTURE_OVERVIEW.md`
  - `packages/frontend/CONTENTBUILDER_COMPONENT_GUIDE.md`
  - `SCENE_SAVE_DATA_FLOW.md`
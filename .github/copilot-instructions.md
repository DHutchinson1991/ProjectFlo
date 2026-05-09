# ProjectFlo Copilot Instructions

## Core rules
- Read the relevant repo instruction file before acting. Do not ask the user questions the instructions already answer.
- Log systemic mistakes in `.github/error-ledger.md`.
- For refactors, follow `refactoring-safety.instructions.md`.
- Update the feature `README.md` in the same change when key files, business rules, hooks, or cross-module links change.

## Architecture guardrails
- Frontend domain code belongs in `features/<bucket>/<feature>/`; route shells stay in `app/`; `shared/` is for cross-bucket primitives only.
- Backend feature code belongs under exactly one bucket: `platform`, `catalog`, `workflow`, `content`, or `finance`.
- Use typed feature APIs and hooks; do not add ad-hoc `fetch()` calls.
- Do not add new code to `src/lib/types/` or `src/types/`.
- Keep brand context explicit end-to-end: `BrandProvider` → `X-Brand-Context` → controller → service.
- Use `PrismaService` for backend DB access.

## Process hygiene
- Max 3 terminal commands per task; never run terminal commands in parallel.
- Prefer zero-process tools first: `get_errors`, `read_file`, `grep_search`, `file_search`, `semantic_search`.
- Use the terminal only for actions that truly require it: installs, requested test runs, and `pnpm db:*`.
- Do not start dev servers as an agent; ask the user to run `pnpm dev`.
- Ignore unrelated transient errors from other agents unless they directly affect the task.

## Fast checks
- Use `get_errors` before build or typecheck commands.
- High-risk files: `packages/frontend/src/app/providers/AuthProvider.tsx`, `packages/frontend/src/app/providers/BrandProvider.tsx`, and `packages/backend/prisma/schema.prisma`.

## Browser verification
- After frontend UI changes, verify in `playwright2` when possible.
- Default app URL: `http://localhost:3001`; default brand: Moonrise.
- Prefer browser console messages over network request dumps.
- Use low-quality JPEG screenshots to keep payloads small.
- If login is required, bootstrap auth first: run `pnpm auth:inject`, evaluate the printed snippet in the active browser session, then continue on protected pages.
- Source credentials from local `.env`: `ADMIN_EMAIL` and `ADMIN_PASSWORD` (preferred) or `ADMIN_SEED_PASSWORD` (fallback). Do not hardcode credentials in source files.

## Key references
- `Commands.instructions.md` for command usage
- `frontend-architecture.instructions.md` and `backend-architecture.instructions.md` for placement
- `feature-readmes.instructions.md` for README updates

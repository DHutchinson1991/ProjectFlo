# Seed Data System

> **Keep this file up to date.** When adding, removing, or changing any seed file, update this README in the same commit.

## Overview

All seed files live in `packages/backend/prisma/seeds/`. The root orchestrator (`index.ts`) runs system seeds, then brand orchestrators, then final metrics. Moonrise owns the brand-scoped content seeds, including the subject and scene templates.

Run: `cd packages/backend && npx prisma db seed`

## Execution order

Within each orchestrator, order matters — later seeds may depend on entities created by earlier ones.

### Layer 1 — System (global, no brand)

| Step | File | What it creates |
|------|------|-----------------|
| 1 | `admin-system-seed.ts` | Global admin role, admin user (Daniel), system infrastructure |
| 2 | `system-infrastructure-seed.ts` | Timeline layers (Video, Audio, Music, Graphics) |
| 3 | `global-job-roles.ts` | Job roles (Director, DP, Colorist, Editor, etc.) |
| 3.5 | `system-payment-brackets.seed.ts` | Payment rate tiers per job role |
| 4 | `system-montage.seed.ts` | Montage presets and film structure templates |

### Layer 2 — Moonrise brand setup + content

**Moonrise Films** (via `moonrise-complete-setup.ts`):

| Step | File | What it creates |
|------|------|-----------------|
| 1 | `moonrise-brand-setup.ts` | Brand entity, settings, payment schedule templates |
| 2 | `moonrise-team-setup.ts` | Roles, contacts, contributors |
| 3 | `moonrise-subject-templates.seed.ts` | Brand-scoped subject templates |
| 4 | `moonrise-scene-templates.seed.ts` | Brand-scoped scene templates |
| 4b | `moonrise-02-*` through `moonrise-05-*` | Demo data (conditional: `SEED_DEMO_DATA=true`) |
| 5 | `moonrise-06-wedding-subjects.seed.ts` | Wedding subject roles |
| 6 | `moonrise-07-event-day-templates.seed.ts` | Event day templates for schedule system |
| 7 | `moonrise-07a-activity-presets.seed.ts` | Activity presets |
| 8 | `moonrise-08-activity-moments.seed.ts` | Default moments per activity |
| 9 | `moonrise-11-event-types.seed.ts` | Event type definitions |
| 10 | `moonrise-09-wedding-types.seed.ts` | Wedding type presets with activity links |
| 11 | `moonrise-10-sample-packages.seed.ts` | Sample packages from wedding types |
| 12 | `moonrise-task-library.ts` | Task templates with subtask definitions |
| 13 | `moonrise-projects-setup.ts` | Sample projects |
| 14 | `moonrise-locations-library.ts` | Location library |
| 15 | `moonrise-equipment-setup.ts` | Equipment inventory |

### Layer 3 — Layer5 brand setup

**Layer5** (via `layer5-complete-setup.ts`):

| Step | File | What it creates |
|------|------|-----------------|
| 1 | `layer5-brand-setup.ts` | Brand entity, settings |
| 2 | `layer5-team-setup.ts` | Roles, contacts, contributors |
| 3 | `layer5-clients-setup.ts` | Client contacts |

## File inventory (orchestrated files)

| File | Layer | Brand |
|------|-------|-------|
| `index.ts` | Orchestrator | — |
| `admin-system-seed.ts` | System | Global |
| `system-infrastructure-seed.ts` | System | Global |
| `global-job-roles.ts` | System | Global |
| `system-payment-brackets.seed.ts` | System | Global |
| `system-montage.seed.ts` | System | Global |
| `moonrise-complete-setup.ts` | Brand orchestrator | Moonrise |
| `moonrise-brand-setup.ts` | Brand setup | Moonrise |
| `moonrise-team-setup.ts` | Brand setup | Moonrise |
| `moonrise-task-library.ts` | Brand setup | Moonrise |
| `moonrise-equipment-setup.ts` | Brand setup | Moonrise |
| `moonrise-locations-library.ts` | Brand setup | Moonrise |
| `moonrise-projects-setup.ts` | Brand setup | Moonrise |
| `moonrise-subject-templates.seed.ts` | Content | Moonrise |
| `moonrise-scene-templates.seed.ts` | Content | Moonrise |
| `moonrise-02-demo-film-structure.seed.ts` | Demo | Moonrise |
| `moonrise-03-demo-subjects.seed.ts` | Demo | Moonrise |
| `moonrise-04-demo-recording-setups.seed.ts` | Demo | Moonrise |
| `moonrise-05-demo-music.seed.ts` | Demo | Moonrise |
| `moonrise-06-wedding-subjects.seed.ts` | Content | Moonrise |
| `moonrise-07-event-day-templates.seed.ts` | Content | Moonrise |
| `moonrise-07a-activity-presets.seed.ts` | Content | Moonrise |
| `moonrise-08-activity-moments.seed.ts` | Content | Moonrise |
| `moonrise-09-wedding-types.seed.ts` | Content | Moonrise |
| `moonrise-10-sample-packages.seed.ts` | Content | Moonrise |
| `moonrise-11-event-types.seed.ts` | Content | Moonrise |
| `layer5-complete-setup.ts` | Brand orchestrator | Layer5 |
| `layer5-brand-setup.ts` | Brand setup | Layer5 |
| `layer5-team-setup.ts` | Brand setup | Layer5 |
| `layer5-clients-setup.ts` | Brand setup | Layer5 |

Legacy standalone scripts from the old seed layout have been retired. Keep new seed logic in this folder so the orchestrator stays the single source of truth.

## Adding a new seed

1. **Pick the right layer.** System/global → add to `index.ts`. Brand-specific → add to the brand's `*-complete-setup.ts`.
2. **Name it correctly.** System: `system-<name>.ts` or `global-<name>.ts`. Brand content: prefer descriptive filenames like `<brand>-subject-templates.seed.ts` or `<brand>-scene-templates.seed.ts`; only use numeric prefixes when you are extending an existing ordered family. Brand setup: `<brand>-<area>-setup.ts`.
3. **Export `default` returning `SeedSummary`.** `{ created, updated, skipped, total }`.
4. **Make it idempotent.** Use `upsert()` or `findFirst` → conditional create.
5. **Register it** in the correct orchestrator at the right position.
6. **Update this README** — add to execution order table and file inventory.

## Environment variables

| Variable | Default | Effect |
|----------|---------|--------|
| `SEED_DEMO_DATA` | `undefined` | Set to `true` to include demo films, subjects, recording setups, music |
| `SEED_LOG_LEVEL` | `normal` | `quiet` / `normal` / `verbose` — controls SeedLogger verbosity |
| `NO_COLOR` | `undefined` | Set to `true` to disable ANSI colour output |

## Utilities

Shared utilities live in `prisma/utils/`:

- **`seed-logger.ts`** — `SeedLogger` singleton with `createSeedLogger(SeedType)`, coloured output, timers. See `prisma/utils/README.md` for full API.
- **`final-metrics.ts`** — `getGlobalCounts()`, `getBrandCounts()`, `printFinalMetrics()` for delta reporting.

## Related modules

- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Backfill scripts**: `packages/backend/scripts/` (one-off data fixes, not part of seed orchestration)
- **Instruction file**: `.github/instructions/seed-data.instructions.md`

# Seed Data System

> **Keep this file up to date.** When adding, removing, or changing any seed file, update this README in the same commit.

## Overview

All seed files live in `packages/backend/prisma/seeds/`. **`index.ts` is the single orchestrator** — it runs all system seeds then all brand seeds directly. There are no intermediate orchestrator files.

Filenames use **domain prefixes** (`platform`, `catalog`, `content`, `workflow`, `finance`) matching the backend module buckets.

Run: `cd packages/backend && npx prisma db seed`

## Execution order

The root orchestrator in `index.ts` runs these 7 steps in order. Later steps depend on earlier ones.

### Layer 1 — System (global, no brand)

| Step | File | What it creates |
|------|------|-----------------|
| 1 | `system-admin.seed.ts` | Global admin, timeline layers, and core system setup |
| 2 | `system-platform.seed.ts` | Job roles, skill-role mappings, skill-tier mappings |
| 3 | `system-finance.seed.ts` | Payment brackets and contract clauses |
| 4 | `system-content.seed.ts` | Montage presets and film structure templates |
| 5 | `system-catalog.seed.ts` | Equipment owners and camera limits |

### Layer 2 — Moonrise Films

| Step | File | What it creates |
|------|------|-----------------|
| 6 | `moonrise-platform.seed.ts` | Brand entity, settings, payment schedules, team, and crew role assignments |
| 6a | `moonrise-content.seed.ts` | People-only subject templates for the editor |
| 6b | `moonrise-catalog-event-templates.seed.ts` | Event templates, activity presets, and moments |
| 6c | `moonrise-catalog-services.seed.ts` | Service templates and event type provisioning |
| 6d | `moonrise-catalog-packages.seed.ts` | Packages, included films, and package crew |
| 6e | `moonrise-workflow.seed.ts` | Task library, pipeline skill backfill, crew assignments, and skill rates |
| 6f | `moonrise-catalog-locations-library.seed.ts` | Location library |
| 6g | `moonrise-catalog-equipment-library.seed.ts` | Equipment inventory |

### Layer 3 — Layer5

| Step | File | What it creates |
|------|------|-----------------|
| 7 | `layer5-platform.seed.ts` | Brand entity, settings, and admin link |

## File inventory

| File | Domain | Brand |
|------|--------|-------|
| `index.ts` | Orchestrator | — |
| `system-admin.seed.ts` | Platform | Global |
| `system-platform.seed.ts` | Platform | Global |
| `system-finance.seed.ts` | Finance | Global |
| `system-content.seed.ts` | Content | Global |
| `system-catalog.seed.ts` | Catalog | Global |
| `moonrise-platform.seed.ts` | Platform | Moonrise |
| `moonrise-content.seed.ts` | Content | Moonrise |
| `moonrise-catalog-event-templates.seed.ts` | Catalog | Moonrise |
| `moonrise-catalog-services.seed.ts` | Catalog | Moonrise |
| `moonrise-catalog-packages.seed.ts` | Catalog | Moonrise |
| `moonrise-workflow.seed.ts` | Workflow | Moonrise |
| `moonrise-catalog-locations-library.seed.ts` | Catalog | Moonrise |
| `moonrise-catalog-equipment-library.seed.ts` | Catalog | Moonrise |
| `layer5-platform.seed.ts` | Platform | Layer5 |

## Adding a new seed

1. **Pick the right layer.** System/global → add to `index.ts` system section. Brand-specific → add to `index.ts` inside `seedMoonrise()` or `seedLayer5()` in bucket order.
2. **Name it correctly.** Prefer bucketed execution-unit filenames such as `system-platform.seed.ts`, `moonrise-workflow.seed.ts`, or `layer5-platform.seed.ts`.
3. **Export `default` returning `SeedSummary`** for standalone system seeds, or named helpers returning `SeedSummary` when a brand seed is composed inside `index.ts`.
4. **Make it idempotent.** Use `upsert()` or `findFirst` → conditional create.
5. **Register it** in `index.ts` at the right position.
6. **Update this README** — add to execution order table and file inventory.

## Environment variables

| Variable | Default | Effect |
|----------|---------|--------|
| `SEED_LOG_LEVEL` | `normal` | `quiet` / `normal` / `verbose` — controls SeedLogger verbosity |
| `NO_COLOR` | `undefined` | Set to `true` to disable ANSI colour output |

## Utilities

Shared utilities live in `prisma/utils/`:

- **`seed-logger.ts`** — `SeedLogger` singleton with `createSeedLogger(SeedType)`, coloured output, timers. See `prisma/utils/README.md` for full API.
- **`seed-metrics.ts`** — `getGlobalCounts()`, `getBrandCounts()`, `printFinalMetrics()` for delta reporting.

## Current schema naming

- Seed code must use the current Prisma crew names: `contacts.crew`, `BrandMember.crew_id`, `CrewJobRole.crew_id`, and `task_library.default_crew_id`.
- Use the current task trigger enum value `per_crew` in seed data and task-library bindings.

## Related modules

- **Schema**: `prisma/schema.prisma`
- **Migrations**: `prisma/migrations/`
- **Backfill scripts**: `packages/backend/scripts/` (one-off data fixes, not part of seed orchestration)
- **Instruction file**: `.github/instructions/seed-data.instructions.md`

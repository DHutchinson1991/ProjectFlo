# Seeding Utils – Authoring Guide for Agentic AI

This document is a compact, operational guide for adding or updating seed logic in `packages/backend/prisma/seeds`. It encodes our conventions so an automated agent can implement new seeds safely, idempotently, and with excellent output quality.

## Core Principles

- Idempotent by design: re-runs must not duplicate data or destroy unrelated data.
- One logger to rule them all: use our shared Seed Logger for uniform, readable output.
- Always return a SeedSummary: enables accurate run totals and final metrics.
- Show your work: log each created/skipped at item level (created = blue, skipped = yellow).
- Final metrics are canonical: do not print your own “global” summaries; the orchestrator prints a single authoritative block at the end.

## Key Building Blocks

- Logger: `createSeedLogger(SeedType.X)` from `prisma/utils/seed-logger.ts`
  - Section headers: `logger.sectionHeader('Title')`, `logger.sectionDivider('Step')`
  - Item logs: `logger.created(name, details?)` [blue], `logger.skipped(name, reason?)` [yellow]
  - Summaries: `logger.summary('X', { created, skipped, updated, total })`
  - Info/Success/Warning/Error with spacing before text to avoid icon blending
- Summary contract: `SeedSummary { created, updated, skipped, total }`
  - Helpers: `sumSummaries(...parts)` to aggregate across sub-seeds
- Final metrics: `printFinalMetrics()` in `prisma/utils/final-metrics.ts`
  - Displays per-item deltas as `(skipped +Y - created +X)` with yellow/blue color coding
  - Includes brand splits (Moonrise, Layer5) and overall run summary

## File Layout & Naming

- System seeds: `system-*.seed.ts` / `system-*.ts`
- Brand modules: `<brand>-<area>-setup.ts` or `<brand>-*.seed.ts`
- Brand orchestrators: `<brand>-complete-setup.ts`
- Root orchestrator: `index.ts` (calls system → brand orchestrators → final metrics)

## Minimal Seed Template

```ts
import { PrismaClient } from '@prisma/client';
import { createSeedLogger, SeedType, type SeedSummary } from './seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.MOONRISE); // pick the right SeedType

export default async function seed(): Promise<SeedSummary> {
  logger.sectionHeader('My New Seed');

  let created = 0;
  let skipped = 0;

  // 1) Gather prerequisites (e.g., brand)
  const brand = await prisma.brands.findFirst({ where: { name: 'Moonrise Films' } });
  if (!brand) throw new Error('Brand not found');

  // 2) Author idempotent operations
  const items = [ /* your data */ ];
  for (const item of items) {
    const existing = await prisma.my_table.findFirst({ where: { unique_field: item.unique_field, brand_id: brand.id } });
    if (existing) {
      skipped++;
      logger.skipped(`Item exists: ${item.unique_field}`);
    } else {
      await prisma.my_table.create({ data: { ...item, brand_id: brand.id } });
      created++;
      logger.created(`Item: ${item.unique_field}`);
    }
  }

  // 3) Print a standardized summary
  const summary: SeedSummary = { created, updated: 0, skipped, total: created + skipped };
  logger.summary('My New Seed', summary);
  return summary;
}
```

## Adding a New Step to an Orchestrator

- In a brand orchestrator (e.g., `moonrise-complete-setup.ts`):
  - Call your seed function in the correct step order
  - Aggregate its `SeedSummary` via `sumSummaries`
- In the root orchestrator (`index.ts`):
  - You typically don’t add individual steps here unless it’s a global seed; let brand orchestrators manage brand-specific modules
  - The root orchestrator already captures before-snapshots for final metrics and prints them at the end

## Final Metrics Expectations

- You do NOT need to print large global summaries in your seed files.
- At run end, `printFinalMetrics()` renders:
  - Brands & Teams
  - Run Summary (created this run, skipped this run)
  - Per-brand sections (Moonrise, Layer5) with `(skipped +Y - created +X)`
  - Projects
- If your seed returns a `SeedSummary`, the root and/or brand orchestrators will roll it up so totals are accurate.

## Color & Formatting Conventions

- Created is blue; Skipped is yellow
- Prefer `logger.created()` / `logger.skipped()` for every item
- Use `logger.sectionHeader()` to delineate major phases and `logger.sectionDivider('STEP X: ...')` within a file
- The logger prints a space between icon and text to keep lines readable

## Idempotency Guidelines

- Prefer `findFirst` + `create` or `upsert` with a truly unique constraint
- Avoid destructive deletes; only clear-and-rebuild where the domain requires it (be careful with assignments)
- Never rely on incremental numeric IDs; use content-based uniqueness where possible

## Verification & Running

- From backend directory:

```bash
cd packages/backend
npx prisma db seed
```

- For schema changes:
  - Stop server(s)
  - Edit `prisma/schema.prisma`
  - `npx prisma migrate dev --name "describe-change"`
  - `npx prisma generate`
  - Re-run seeds

## Common Pitfalls

- Forgetting to return a `SeedSummary`: final metrics may be incomplete
- Printing your own large, global summaries: creates duplication—leave it to Final Metrics
- Non-idempotent create loops: will duplicate rows on re-run
- Using global Prisma CLI instead of `npx prisma` (use `npx prisma`)

## Extending Per-Brand Run Details (Optional)

- `final-metrics` supports an optional `perBrandRun` map keyed by brand name, with per-entity `SeedSummary`s (films, scenes, tasks, etc.).
- To surface precise per-item “skipped this run” (instead of computed fallback), have brand orchestrators collect and pass these entity-level summaries when invoking `printFinalMetrics()`.

---

When in doubt, follow an existing seed module that matches your use case (e.g., tasks, coverage, projects). Keep logs itemized, deterministic, and readable. The final metrics will do the rest.

---
description: "Use when editing prisma/schema.prisma, adding or removing relations or indexes, writing Prisma queries in backend services, changing transactional write flows, or reviewing database access patterns."
---

# ProjectFlo — Database Design Rules

## Scope

This file governs database design and Prisma access policy.

- Use this before changing `prisma/schema.prisma`.
- Use this before adding Prisma queries to backend services.
- Use `migrations.instructions.md` for migration execution.
- Use `seed-data.instructions.md` for seed authoring.

## Source of truth

- `packages/backend/prisma/schema.prisma` is the only schema source of truth.
- Persistent schema changes must end in a committed Prisma migration.
- `npx prisma db push` is local-only tooling for disposable development states. It is never the final repo state for a real schema change.
- After schema changes, run `npx prisma generate` before validating callers.

## Schema design

- Model real relationships explicitly. Do not use `Json` to avoid creating a table or relation that the app actually queries relationally.
- Use enums for bounded workflow states and categories. Do not introduce freeform status strings when the state space is known.
- Use `Decimal` for money, rates, taxes, percentages, and other values where precision matters. Do not use float for financial data.
- Nullable fields must have a real business meaning. Do not make fields optional just to get a migration through.
- Add unique constraints only for real business uniqueness. If uniqueness is tenant-local, include `brand_id` in the unique constraint.
- Every foreign key must have intentional delete behavior. Choose `Cascade`, `Restrict`, or nullable relations deliberately — never by accident.

## Indexing

- Review indexes every time a new query path is introduced.
- Add an index for common filter and sort paths, especially:
  - `brand_id`
  - foreign keys used in list queries
  - status plus time-based ordering columns
  - compound filters used by dashboards, queues, and timeline views
- If a service adds a new `where` + `orderBy` pattern on a large table, review whether an `@@index` is required in the same change.
- Do not assume Prisma-generated indexes from uniques are enough for list queries.

## Brand-scoped data

- If data is tenant-scoped, ownership must be explicit in the schema and enforced in every service query.
- If a table is intentionally global, document that choice in the owning module `README.md`.
- Tenant-local uniqueness must be scoped by `brand_id`.
- Relation traversal must not bypass tenant boundaries accidentally. Validate nested reads and writes, not just the top-level record.

## Query design

- Prefer `select` over broad `include` by default.
- Fetch only the fields needed for the response, validation, or decision being made.
- Do not return raw Prisma relation graphs directly from services. Map them to deliberate response shapes.
- Avoid unbounded nested `include` trees. If a query needs deep relations, justify them in the mapper or module README.
- Unbounded list endpoints require pagination or a clearly constrained dataset.
- Avoid N+1 patterns such as per-row lookups inside loops when the data can be fetched in one query or transaction.

## Transactions

- Use `prisma.$transaction()` when multiple writes must succeed or fail together.
- Throw inside the transaction to trigger rollback; do not swallow transaction errors.
- Validate prerequisites before opening expensive write transactions when possible.
- Do not mix external side effects with in-transaction writes unless the failure strategy is explicit.

## Schema change preflight

Before creating a migration, stop the running backend server if one is active, then answer all of these:

- What table ownership model applies: global or brand-scoped?
- What new indexes or compound uniques are required?
- Which backend services, DTOs, mappers, and frontend types depend on this shape?
- Does this require a backfill, seed update, or data cleanup script?
- Which feature `README.md` must be updated to document the new source of truth?

If any answer is unknown, keep investigating before editing the schema.

## Verification checklist

- Update `prisma/schema.prisma`.
- Create the migration.
- Run `npx prisma generate`.
- Update backend callers, DTOs, mappers, and frontend contract code in the same change.
- Review indexes and uniques.
- Review seed and backfill impact.
- Update the owning feature or module `README.md`.
- Run build and relevant tests.

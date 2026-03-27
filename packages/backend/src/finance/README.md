# Finance Module

## Purpose

Owns all financial lifecycle concerns for inquiries and projects: estimates, quotes, contracts, invoices, payment schedules, payment brackets, and crew payment templates.

## Sub-modules

| Module | Route prefix | Description |
|--------|-------------|-------------|
| `estimates` | `api/inquiries/:inquiryId/estimates` | Line-item cost estimates with versioning, staleness detection, and auto-generation |
| `quotes` | `api/inquiries/:inquiryId/quotes` | Client-facing quotes with is_primary exclusivity |
| `contracts` | `api/inquiries/:inquiryId/contracts` | HTML contracts composed from clause templates; signing flow |
| `invoices` | `api/inquiries/:inquiryId/invoices` | Invoices tied to an inquiry |
| `payment-schedules` | `api/brands/:brandId/payment-schedules`, `api/estimates`, `api/quotes` | Schedule templates and milestone application |
| `payment-brackets` | `api/payment-brackets` | Crew pay rate brackets per job role |
| `crew-payment-templates` | `api/brands/:brandId/crew-payment-templates` | Brand-level crew payment rule sets |

## Key dependencies

- `PrismaService` — all DB access goes through `prisma.service`
- `finance/shared/pricing.utils.ts` — backend pricing wrapper that re-exports `@projectflo/shared` totals helpers and adds Decimal-safe persistence math
- `workflow/tasks` — used by `estimates` and `contracts` to auto-complete pipeline tasks
- `workflow/projects` — used by `estimates` auto-generation (snapshot service)
- `workflow/task-library` — used by `estimates` auto-generation for cost preview

## Cross-references

- See `PRICING_TOTALS_REFERENCE.md` for pricing, totals, and tax rate conventions
- See individual sub-module READMEs for business rules

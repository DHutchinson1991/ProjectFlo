# Contracts Module

## What this module does

CRUD for contracts, contract templates, and contract clauses. Contracts are generated from templates with variable interpolation, can be sent to clients for electronic signing, and trigger task completion on signature. Also manages reusable clause libraries with country-specific defaults.

## Key files

| File | Purpose |
|------|---------|
| `contracts.service.ts` | CRUD + compose/sync from template, mark sent/signed |
| `services/contract-signing.service.ts` | Send contract, signer token lookup, signature submission |
| `contract-templates.service.ts` | Template CRUD + seed defaults |
| `services/contract-template-variables.service.ts` | Variable resolution, interpolation, preview |
| `constants/available-variables.constants.ts` | Static catalog of template variable categories |
| `contract-clauses.service.ts` | Clause & category CRUD, reorder, seed defaults |
| `constants/default-clauses.constants.ts` | Country-specific default clause data (GB/US) |
| `contracts.controller.ts` | Routes for contract CRUD + send + signing |
| `contract-templates.controller.ts` | Routes for template CRUD + variables + preview |
| `contract-clauses.controller.ts` | Routes for clause/category CRUD |

## Business rules / invariants

- Template variables are resolved at compose/preview time from inquiry + contact + brand data.
- `escapeHtml` sanitizes user-supplied text before interpolation into HTML content.
- Contract signing uses a unique `signer_token` for unauthenticated access.
- Submitting a signature auto-completes the "Send Contract" inquiry task and generates a deposit invoice.
- Default clauses are seeded per country code (common + GB/US overrides + Talent/Location Release).

## Related modules

- **Backend**: `../invoices` — deposit invoice auto-generated on signature
- **Backend**: `../../workflow/tasks` — auto-completes inquiry tasks on send/sign
- **Frontend**: `features/finance/contracts` — contract management UI
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (root)

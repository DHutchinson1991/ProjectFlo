---
description: "Use when creating new backend modules, frontend features, or when asked to add or update a feature README."
---

# Feature README Convention

Every backend module folder and frontend feature folder must contain a `README.md` that serves as the single source of domain knowledge for that feature.

## Required sections

```markdown
# Feature Name

## What this module does
One-paragraph summary.

## Key files
| File | Purpose |
|------|---------|
| `feature.service.ts` | Core business logic |

## Business rules / invariants
Bullet list of non-negotiable rules an agent must respect.

## Related modules
- **Backend**: `../other-module` — what it provides
- **Frontend**: `features/domain/feature` — where it's consumed
- **Reference docs**: `PRICING_TOTALS_REFERENCE.md` (if applicable)
```

## Rules

- Keep READMEs under 80 lines. Link to reference docs for deep detail.
- Update the README in the same PR as any code change that alters business rules, key files, or cross-module relationships.
- Update the README when API routes, transport policy, or the canonical feature API files change. The README must match the real frontend binding shape after migrations.
- **Do not duplicate structural rules from `.instructions.md` files.** READMEs own: what's here (file inventory), business invariants, and related modules. Instructions own: placement rules, naming conventions, and hard constraints.
- If a README needs to reference a rule, add a one-line pointer: `"Rules in <file>.instructions.md § <section>"`.
- Do not duplicate content that belongs in a root-level reference doc. Point to it instead.
- Backend READMEs cross-reference the frontend feature that consumes the API.
- Frontend READMEs cross-reference the backend module that provides the API.

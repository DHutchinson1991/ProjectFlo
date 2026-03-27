# Finance Shared

## What this module does
Reusable UI primitives and constants shared across finance features (estimates, quotes, invoices). Prevents duplication of layout, color, and summary logic.

## Key files
| File | Purpose |
|------|---------|
| `components/FinanceSummarySidebar.tsx` | Right-side summary panel with tax, payment method, milestones; parameterized by `accentColor` |
| `components/CategoryBreakdownBar.tsx` | Collapsed horizontal color bar + legend grouped by item category |
| `components/ExpandedCategoryItems.tsx` | Expanded grouped item list with subtotal/tax/total footer; accepts `children` slot |
| `components/PaymentScheduleRows.tsx` | Milestone rows with template preview and status chips |
| `constants/categoryColors.ts` | `CATEGORY_COLORS` map and `getCategoryColor()` helper (normalizes "Post-Production:*") |
| `types/index.ts` | `FinanceMilestone` shared type |
| `index.ts` | Barrel exports for all shared primitives |

## Business rules / invariants
- This folder is bucket-scoped (`features/finance/shared/`), not promoted to top-level `shared/`.
- Components are presentation-only — no API calls, no React Query hooks, no mutations.
- `accentColor` drives per-feature visual distinction (green for estimates, red for quotes).
- `getCategoryColor()` normalizes sub-categories (e.g. "Post-Production: Color" → "Post-Production").

## Related modules
- **Consumers**: `features/finance/estimates`, `features/finance/quotes`, `features/finance/invoices` (planned)
- **Shared utils**: `shared/utils/pricing.ts`, `shared/utils/formatUtils.ts`

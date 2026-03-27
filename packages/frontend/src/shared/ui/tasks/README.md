# Shared Task Display Primitives

## What this module does
Reusable UI primitives and constants shared across task-related features (`catalog/task-library` and `workflow/tasks`). Ensures visual alignment between the Task Library and Active Tasks views.

## Key files
| File | Purpose |
|------|---------|
| `phaseConfig.ts` | `PHASE_CONFIG` map, `PHASE_ORDER`, `getPhaseConfig()`, `hexToRgba()` — canonical phase colors, labels, icons, and color utilities |
| `TaskGroupHeader.tsx` | Collapsible group header with left border accent, chevron, count badge, progress bar, hours |
| `TaskColumnHeaders.tsx` | Configurable grid column header row |
| `TaskSummaryStrip.tsx` | Horizontal stats strip (colored dots + label + value) |
| `index.ts` | Barrel exports |

## Business rules / invariants
- Components are presentation-only — no API calls, no domain hooks, no mutations.
- Phase colors in `PHASE_CONFIG` are the single source of truth; feature-level constants should derive from here.
- Lives in `shared/ui/tasks/` because it serves ≥2 unrelated buckets (`catalog` + `workflow`).

## Related modules
- **Consumers**: `features/catalog/task-library`, `features/workflow/tasks`

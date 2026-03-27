---
description: "Use when building new frontend UI, choosing component styles, adding status badges, empty states, dialogs, page headers, or applying glass/card effects."
applyTo: "packages/frontend/src/**"
---

# ProjectFlo — Frontend Design System

## Design tokens

All shared colours, surfaces, and sx helpers live in `packages/frontend/src/lib/theme/tokens.ts`.

| Export | Purpose |
|--------|---------|
| `colors` | Core palette: accent, semantic colours, neutrals, surfaces |
| `gradients` | Named gradient tuples |
| `glassSx` | Glass-morphism card `sx` spread |
| `fieldSx` | Glass-style TextField `sx` spread |
| `statusColors` | Status string → colour map |

Import from `@/lib/theme/tokens` — never duplicate colour hex values inline.

## MUI theme variants

The theme (`ThemeProvider.tsx`) registers custom variants:

| Component | Variant | Effect |
|-----------|---------|--------|
| `Card` | `glass` | Glass-morphism surface (blur, transparency, border) |
| `Chip` | `status` | Compact 20px badge with tight label padding |

Use `<Card variant="glass">` and `<Chip variant="status">` instead of copy-pasting `sx`.

## Shared UI components

Before building new UI, check existing shared components in `packages/frontend/src/shared/ui/` (barrel export: `@/shared/ui`):

| Component | Import | Use for |
|-----------|--------|--------|
| `StatusChip` | `@/shared/ui` | Status badges — auto-resolves colour from `statusColors` |
| `EmptyState` | `@/shared/ui` | "Nothing here yet" placeholder with icon + CTA |
| `FormDialog` | `@/shared/ui` | Standard create/edit dialog shell (title, body, save/cancel) |
| `PageHeader` | `@/shared/ui` | Page title + subtitle + action buttons row |
| `Loading` | `@/shared/ui` | Spinner / skeleton / dots variants |
| `ErrorBoundary` | `@/shared/ui` | React error boundary with fallback UI |
| `VenueMap` | `@/shared/ui` | Interactive map for location/venue display |
| `AddressAutocomplete` | `@/shared/ui` | Address search input with Nominatim autocomplete |

```ts
// Example import
import { StatusChip, EmptyState, FormDialog } from '@/shared/ui';
```

> **Legacy path**: Some older code imports from `@/app/components`. This is the old location — new code must import from `@/shared/ui` instead.

## Before building new UI

1. **Check shared components** — does a component in `ui/` already solve this?
2. **Check tokens** — is the colour/surface already in `tokens.ts`?
3. **Ask the user**: "Should this look like [existing pattern] or do you want a different style?"
4. If the component will be reused across 2+ unrelated features, build it in `ui/` from the start.
5. If it's feature-specific today, keep it in the feature folder — extract to `ui/` when a second feature needs it.

## Rules

- Never hard-code hex colours that already exist in `tokens.ts`.
- Never copy-paste `glassSx` or `fieldSx` — import from tokens.
- Use `StatusChip` for any status badge — don't create inline Chip + alpha styling.
- Use `EmptyState` for any list-empty placeholder — don't recreate the dashed-border pattern.
- Use `FormDialog` for any create/edit dialog — don't recreate Dialog + DialogActions + spinner.
- Use `ErrorBoundary` for feature-level error catching — don't build custom try/catch wrappers in components.
- When adding a new status value, add its colour to `statusColors` in `tokens.ts`.
- Always import shared UI from `@/shared/ui` — never from `@/app/components` or `@/app/components/ui/`.

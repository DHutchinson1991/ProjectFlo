# Shared Theme

Design system: color palette, gradients, glassmorphism helpers, MUI theme, global CSS.

## Key files
| File | Purpose |
|------|---------|
| `tokens.ts` | `colors`, `gradients`, `glassSx`, `fieldSx`, `statusColors` constants |
| `ThemeProvider.tsx` | MUI theme setup (light/dark mode), component overrides, `useTheme()` hook |
| `globals.css` | CSS resets and base styles |
| `mui-augmentation.d.ts` | TypeScript module augmentation for custom MUI variant props |

## Business rules
- Use `colors.*` and `gradients.*` from `tokens.ts` — never hardcode hex values.
- Glass card effects use `glassSx` helper.
- Custom MUI variants must be declared in `mui-augmentation.d.ts`.

## Related modules
- `app/providers.tsx` — mounts `<ThemeProvider>` globally
- `frontend-design-system.instructions.md` — full design system rules

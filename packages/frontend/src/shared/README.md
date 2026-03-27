# Shared

Cross-domain primitives consumed by multiple unrelated feature buckets.

## Subfolders
| Folder | Purpose |
|--------|--------|
| `api/client/` | HTTP client, auth headers, brand context injection |
| `theme/` | Design tokens, MUI ThemeProvider, global CSS |
| `types/` | Ambient type declarations consumed by shared internals |
| `ui/` | Reusable UI components used across ≥2 unrelated feature buckets |

All structural rules (import direction, promotion threshold, naming conventions) live in `frontend-architecture.instructions.md` § "Shared layer rules".

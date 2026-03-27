# platform/studio-layout

Application shell layout — header bar and sidebar navigation for the studio workspace.

## Key files

| File | Purpose |
|------|---------|
| `components/StudioHeader.tsx` | AppBar with logo, notifications bell, user menu, logout |
| `components/StudioSidebar.tsx` | Navigation sidebar with links to all studio sections |

## Current status

**Presentation-only.** No backend API, no data fetching. The layout renders static navigation and user context from `useAuth()`.

No api/, hooks/, or types/ needed unless the layout gains data-fetching responsibilities (e.g., unread notification counts, dynamic menu items).

## Related modules

- `platform/auth` — `useAuth()` for user context and logout
- `platform/brand` — `useBrand()` for brand display in header

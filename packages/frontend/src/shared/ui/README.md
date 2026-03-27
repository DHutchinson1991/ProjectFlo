# Shared UI

Reusable UI primitives. Structural rules and naming conventions in `frontend-architecture.instructions.md` § "Shared layer rules".

## Components
| Component | Purpose | Consumers |
|-----------|---------|-----------|
| `AddressAutocomplete/` | Location search with Nominatim autocomplete | workflow, content, portal |
| `EmptyState/` | Centered placeholder card with icon + CTA | content, workflow |
| `ErrorBoundary/` | React error boundary + `useErrorHandler()` + fallback | app (global) |
| `FormDialog/` | Modal wrapper for forms | content, workflow |
| `Loading/` | Spinner loading indicator | platform/auth, workflow |
| `PageHeader/` | Page title + breadcrumb wrapper | multiple screens |
| `StatusChip/` | Status badge auto-colored from `statusColors` | content, workflow |
| `VenueMap/` | Map display component | workflow/locations |

All components re-exported from `index.ts`. Import as `import { ComponentName } from '@/shared/ui'`.

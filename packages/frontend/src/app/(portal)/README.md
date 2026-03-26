# Client Portal Feature

## What this module does
Owns the public client-facing portal, proposal review, contract signing, and portal-specific shared UI components.

## Key files
| File | Purpose |
|------|---------|
| `portal/[token]/page.tsx` | Main client portal route |
| `proposals/[token]/page.tsx` | Proposal review route |
| `sign/[token]/page.tsx` | Contract signing route |
| `_components/ProposalRenderer.tsx` | Shared proposal rendering UI |
| `_components/ProposalAcceptanceBar.tsx` | Shared proposal response actions |

## Business rules / invariants
- Portal, proposal review, and contract signing are one client-facing experience and should not drift into inconsistent data shapes or theme systems.
- Token-based client access must stay scoped to inquiry-owned public data only.
- Needs assessment pages under `(portal)` are separate from the portal/proposal merge work and keep their own protected flow rules.

## Active design notes
- The long-term direction is a unified portal experience where proposal review and contract signing are embedded or clearly aligned with the portal flow instead of behaving like isolated products.

## Related modules
- **Backend**: `packages/backend/src/inquiries/README.md` — client portal service and public portal controller
- **Reference docs**: `packages/frontend/src/app/(studio)/designer/components/ContentBuilder/README.md`
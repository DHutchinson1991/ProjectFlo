# workflow/resources

Navigation hub linking to Crew, Locations, and Equipment management screens.

## Key files

| File | Purpose |
|------|---------|
| `screens/ResourcesHubScreen.tsx` | Hub UI with cards routing to sub-features |

## Current status

**Navigation-only.** No backend API, no data fetching. This is a pure routing hub that aggregates links to:

- `/manager/crew` → `workflow/crew`
- `/resources/locations` → locations management
- `/equipment` → equipment management

No api/, hooks/, or types/ needed unless the hub gains data-fetching responsibilities (e.g., resource summary counts).

## Related modules

- `workflow/crew` — crew management
- `workflow/staffing` — staff assignment
- Equipment and locations features

# Content Audit

## What this module does
Tracks version history and change logs for film/content entities. Creates version snapshots when content is modified and records detailed change entries for audit trail. No HTTP endpoints — purely a provider module consumed by other modules.

## Key files
| File | Purpose |
|------|---------|  
| `audit.service.ts` | Version creation, history retrieval, change log, stats |
| `audit.module.ts` | Exports `AuditService` for injection by other modules |

## Business rules / invariants
- Version numbers are string-based, auto-incremented from the latest version.
- Each version stores a full JSON snapshot of the film content.
- Change log entries store `old_value` and `new_value` as JSON.

## Data model notes
- **filmVersion** — version snapshots of `filmLibrary` records.
- **filmChangeLog** — detailed change entries with before/after values.

## Related modules
- **Backend**: `../films` — primary consumer of audit service
- **Frontend**: `features/content/films` — version history UI
- **Bucket**: `src/content/` — creative/film structure domain

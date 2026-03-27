# Montage Presets

## What this module does
Manages brand-scoped and system-seeded presets that define valid duration ranges for montage-style scenes. Presets carry a `min_duration_seconds` and `max_duration_seconds` that constrain timeline editing. System-seeded presets are read-only; brand-specific presets support full CRUD.

## Key files
| File | Purpose |
|------|---------|
| `montage-presets.controller.ts` | REST endpoints under `api/montage-presets` |
| `montage-presets.service.ts` | CRUD logic including duration validation and brand/system merge |
| `dto/create-montage-preset.dto.ts` | Create payload |
| `dto/update-montage-preset.dto.ts` | Update payload |

## Business rules / invariants
- `min_duration_seconds` must be ≤ `max_duration_seconds` (enforced on both create and update).
- System-seeded presets (`is_system_seeded = true`) cannot be modified or deleted.
- `findAll`: when `brandId` is provided, returns brand-specific presets AND system defaults (`brand_id = null`). When no `brandId` is passed, returns all active presets regardless of brand.
- `is_active` soft-filter: `findAll` only returns active records.
- All routes are JWT-protected via `AuthGuard('jwt')`.

## Data model notes
- Prisma model: `MontagePreset`
- Flat record — no nested relations.
- Brand isolation via `brand_id` nullable FK.

## Related modules
- **Frontend**: `lib/api.ts` — `montagePresets` methods

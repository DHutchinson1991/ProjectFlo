# catalog/crew-presets

Reusable crew presets — brand-scoped named bundles of job-role slots with optional default crew assignments. Used by the package creation wizard to instantly fill in `roleSlots` + `crewAssignments` (Step 7, `CrewStep`).

## Key files

| File | Purpose |
|------|---------|
| `crew-presets.controller.ts` | REST controller at `/api/crew-presets` — brand-scoped CRUD |
| `crew-presets.service.ts` | Service: creates/updates preset + slots in a transaction; enforces `is_default` uniqueness per brand |
| `dto/crew-preset.dto.ts` | `CreateCrewPresetDto`, `UpdateCrewPresetDto`, `CrewPresetSlotDto` |
| `crew-presets.module.ts` | NestJS module registration |

## Business rules

- Presets are brand-scoped via the `X-Brand-Context` header (resolved by `@BrandId()`).
- A preset must have at least one slot on create (`ArrayMinSize(1)`).
- Setting `is_default: true` on a preset clears `is_default` on all other presets for the same brand (single default per brand).
- Slots are replaced wholesale on update — if `slots` is provided, old slots are deleted and new ones created.
- `crew_id` on a slot is optional: `null` means the preset defines only the role, not a specific crew member.
- `order_index` preserves slot ordering so multi-position roles expand predictably when the preset is applied.
- Moonrise seed data creates a default `Core Production Team` preset for the package creation wizard.

## Data model

- `CrewPreset` — `brand_id`, `name` (unique per brand), `is_default`, timestamps
- `CrewPresetSlot` — `preset_id`, `job_role_id`, `crew_id?`, `order_index`

## Related modules

- `workflow/crew` — crew roster and job role assignments (frontend preset API binding lives under `features/workflow/crew/api/`)
- `catalog/packages` — consumer of preset-derived `roleSlots` + `crewAssignments` during package creation

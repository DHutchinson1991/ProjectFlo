# Equipment Feature

**Bucket:** `workflow`

Manages the studio's physical equipment inventory, including tracking condition, availability, rentals, and maintenance logging.

## Folder structure

```
equipment/
  api/              ← createEquipmentApi(client) factory + equipmentApi singleton
  components/       ← EquipmentListHeader, CategoryCardsGrid, EquipmentFilterToolbar,
                       EquipmentTable, EquipmentDetailPanel, EquipmentTableRowActions,
                       EquipmentQuickAddRow, DeleteConfirmDialog, EquipmentSnackbar
  constants/        ← Category config (icons, colors) via categoryConfig.ts
  hooks/            ← useEquipmentList, useEquipmentDetail (React Query)
  screens/          ← EquipmentListScreen, EquipmentDetailScreen
  types/            ← All equipment domain types and enums
  index.ts          ← Barrel export
```

## Key concepts

- **Categories** — Equipment is grouped by `EquipmentCategory` enum (CAMERA, LENS, AUDIO, LIGHTING, GRIP, POWER, STORAGE, STREAMING, BACKGROUNDS, ACCESSORIES).
- **Availability** — Each item has an `EquipmentAvailability` status (AVAILABLE, RENTED, MAINTENANCE, RETIRED).
- **Rentals** — Equipment can be rented out; tracked via `EquipmentRental` records with start/end dates and deposit tracking.
- **Maintenance** — Maintenance logs track routine and ad-hoc service events via `EquipmentMaintenance` records.
- **Crew ownership** — Equipment items have an optional `owner_id` linking to a brand crew record.

## List screen architecture

`EquipmentListScreen` uses a split-view layout:

1. **`EquipmentListHeader`** — icon-box title + **Add Equipment** button only. No search.
2. **`CategoryCardsGrid`** — full-width row of gradient category filter cards (one per category + "All"). Each card shows category label, item count, and total purchase value chip. Clicking filters the table.
3. **`EquipmentFilterToolbar`** — toolbar Paper with Status `Select`, Condition `Select`, Search `TextField` (with clear button), and filtered/total count.
4. **`EquipmentTable`** — `StudioTable<Equipment>` with `onRowHover` + `onRowClick`. Columns: Equipment (name + brand/model subtitle), Category, Status (chip), Condition (chip), Daily Rate, Actions. No navigation — clicks open the detail panel. Inline-edit logic renders `TextField`/`Select` within column `render()` closures.
5. **`EquipmentDetailPanel`** — sticky right-side panel (360px). Appears on hover; stays pinned on click (toggle). Shows grouped sections: Pricing, Details, Physical, Maintenance, Location, Description. Close `X` clears both hover and selected state.

### Detail panel logic (in `EquipmentListScreen`)

```
detailEquipment = selectedEquipment ?? hoveredEquipment
```

- **Hover** → `hoveredEquipment` local state (ephemeral, not in hook)
- **Click** → `selectedEquipment` from hook (toggles: click same row to deselect)
- Selected row takes priority; closing panel clears both states

### Filter state (in `useEquipmentList`)

| State | Default | Effect |
|---|---|---|
| `searchTerm` | `""` | Filters by `item_name`, `model`, `brand_name`, `description` |
| `categoryFilter` | `"all"` | Filters by `category` enum value (driven by CategoryCardsGrid) |
| `statusFilter` | `"all"` | Filters by `availability_status` enum value |
| `conditionFilter` | `"all"` | Filters by `condition` enum value |
| `selectedEquipment` | `null` | Pinned detail panel item (also in hook for cross-component access) |

`flatEquipment` = all equipment merged across categories. `filteredEquipment` = `flatEquipment` filtered by all four filters above.


## API

All HTTP calls go through `equipmentApi` (singleton from `api/index.ts`) which is instantiated from `createEquipmentApi(client: ApiClient)`.

```typescript
import { equipmentApi } from '@/features/workflow/equipment';

equipmentApi.getAll({ category: 'CAMERA' });
equipmentApi.getById(id);
equipmentApi.create(data);
equipmentApi.update(id, data);
equipmentApi.delete(id);
equipmentApi.getGroupedByCategory();
equipmentApi.getCrew();   // current method name, returns crew for owner dropdowns
equipmentApi.rentals.getAll(equipmentId);
equipmentApi.maintenance.getAll(equipmentId);
```

## Backend endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/equipment` | List with optional filters |
| GET    | `/equipment/grouped` | Grouped by category |
| GET    | `/equipment/stats` | Aggregate stats |
| GET    | `/equipment/:id` | Single item (includes rentals + maintenance) |
| POST   | `/equipment` | Create |
| PATCH  | `/equipment/:id` | Update |
| DELETE | `/equipment/:id` | Delete |
| GET    | `/equipment/rentals` | All rentals |
| POST   | `/equipment/rentals` | Create rental |
| PATCH  | `/equipment/rentals/:id` | Update rental |
| PATCH  | `/equipment/rentals/:id/return` | Mark as returned |
| GET    | `/equipment/maintenance` | All maintenance records |
| POST   | `/equipment/maintenance` | Create maintenance record |
| PATCH  | `/equipment/maintenance/:id/complete` | Mark maintenance complete |

# Equipment Feature

**Bucket:** `workflow`

Manages the studio's physical equipment inventory, including tracking condition, availability, rentals, and maintenance logging.

## Folder structure

```
equipment/
  api/              ← createEquipmentApi(client) factory + equipmentApi singleton
  components/       ← UI components (accordion list, table, cards, dialogs)
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
- **Contributors** — Equipment items have an optional `owner_id` linking to a brand contributor (crew member).

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
equipmentApi.getContributors();   // for owner dropdowns
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

# Equipment Feature — Backend

## Overview
This module manages all equipment-related functionality for ProjectFlo, organized under the `workflow` bucket.

## Structure

```
workflow/equipment/
├── dto/
│   ├── create-equipment.dto.ts              — Create equipment payload
│   ├── update-equipment.dto.ts              — Partial update (extends create DTO)
│   ├── create-equipment-availability.dto.ts — Create a new availability slot
│   ├── update-equipment-availability.dto.ts — Update an existing availability slot
│   └── equipment-availability-query.dto.ts  — Query params for availability lookups
├── equipment.service.ts                     — Core equipment CRUD + grouping + unmanned
├── equipment-availability.service.ts        — Availability calendar slot management
├── equipment.controller.ts                  — REST routes for /equipment
├── equipment-templates.service.ts           — Equipment template set management
├── equipment-templates.controller.ts        — REST routes for /equipment/templates
├── equipment.module.ts                      — NestJS module registration
└── README.md                                — This file
```

## Service split

### EquipmentService
Handles core equipment lifecycle:
- `create` / `findAll` / `findOne` / `update` / `remove`
- `findByCategory` / `findAvailable` / `updateAvailability`
- `findGroupedByCategory` — used by the UI list page
- `findUnmannedEquipment` / `setUnmannedStatus` — operator scheduling integration

### EquipmentAvailabilityService
Handles the availability calendar:
- `getEquipmentAvailability(equipmentId, query)` — slots for a single item
- `createAvailabilitySlot` / `updateAvailabilitySlot` / `removeAvailabilitySlot`
- `getAvailabilityCalendar(query)` — multi-item calendar view

## API Routes

| Method | Path                                   | Service                      |
|--------|----------------------------------------|------------------------------|
| POST   | /equipment                             | EquipmentService.create      |
| GET    | /equipment                             | EquipmentService.findAll     |
| GET    | /equipment/grouped                     | EquipmentService.findGroupedByCategory |
| GET    | /equipment/available                   | EquipmentService.findAvailable |
| GET    | /equipment/category/:category          | EquipmentService.findByCategory |
| GET    | /equipment/availability/calendar       | EquipmentAvailabilityService.getAvailabilityCalendar |
| GET    | /equipment/unmanned/:brandId           | EquipmentService.findUnmannedEquipment |
| GET    | /equipment/:id                         | EquipmentService.findOne     |
| PATCH  | /equipment/:id                         | EquipmentService.update      |
| PATCH  | /equipment/:id/availability            | EquipmentService.updateAvailability |
| PATCH  | /equipment/:id/unmanned                | EquipmentService.setUnmannedStatus |
| DELETE | /equipment/:id                         | EquipmentService.remove      |
| GET    | /equipment/:id/availability            | EquipmentAvailabilityService.getEquipmentAvailability |
| POST   | /equipment/:id/availability            | EquipmentAvailabilityService.createAvailabilitySlot |
| PATCH  | /equipment/availability/:availabilityId | EquipmentAvailabilityService.updateAvailabilitySlot |
| DELETE | /equipment/availability/:availabilityId | EquipmentAvailabilityService.removeAvailabilitySlot |

## Prisma models used
- `equipment` — main inventory item
- `equipment_rentals` — rental bookings for items
- `equipment_availability` — calendar availability slots
- `EquipmentTemplate` / `EquipmentTemplateItem` — equipment pack templates

# brands

## What this module does
Core multi-tenancy module. Manages brands (tenants), user-brand associations, brand settings (key-value config), meeting/discovery call settings, welcome/inquiry page settings, and brand context switching. Handles service type provisioning — when a brand enables a service type (Wedding/Birthday/Engagement), auto-provisions event types, categories, and package sets.

## Key files
| File | Purpose |
|------|---------|
| `brands.service.ts` | Thin orchestration layer for brand CRUD and delegated concerns |
| `services/brand-memberships.service.ts` | User-brand membership and brand context switching |
| `services/brand-settings.service.ts` | Brand settings, meeting settings, and welcome settings |
| `brand-provisioning.service.ts` | Idempotent provisioning orchestrator for service types |
| `provisioning/*.ts` | Service-type-specific provisioning data and write flows |
| `brands.controller.ts` | REST endpoints (brand CRUD, users, settings, meeting/welcome, context) |
| `dto/` | Create/Update brand, user-brand, settings DTOs |

## Business rules / invariants
- `findOne` self-heals: derives `service_types[]` from existing event types.
- `update` with `service_types` triggers `BrandProvisioningService.provision()`.
- Provisioning is idempotent — existing event types just ensure category + set exist.
- Global Admin users see all brands; regular users see only their associated brands.
- Global-admin checks resolve through `crew.contact.user_account.system_role`, not directly from `Crew`.
- Settings stored as key-value pairs with categories (meetings, welcome).
- Welcome `social_proof_count` = manual start number + count of `Delivery`-phase projects.
- Delete is soft-delete (`is_active: false`).

## Data model notes
- **brands** — tenant entity with business info, timezone, currency.
- **user_brands** — junction with role (Owner/Admin/Manager/Member).
- **brand_settings** — key-value pairs with `data_type` and `category`.
- Provisioning writes to tables owned by `event-types`, `service-package-categories`, `package-sets`.

## Related modules
- **Backend**: `../../catalog/event-types` — provisioning creates event types
- **Backend**: `../../catalog/service-package-categories` — provisioning creates categories
- **Backend**: `../../catalog/package-sets` — provisioning creates package sets
- **Frontend**: `features/platform/brands`

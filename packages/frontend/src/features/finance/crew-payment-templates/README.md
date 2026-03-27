# finance / crew-payment-templates

Manages reusable crew payment schedule templates per brand. Each template defines ordered payment rules (e.g., "50% on booking, 50% after delivery") scoped by role type (on-site vs off-site).

## Responsibilities
- CRUD for crew payment templates per brand
- Payment rule definitions with trigger types, amounts (% or fixed), and frequencies
- Single default per role_type per brand (backend enforces via transaction)
- Consumed by PaymentScheduleSettings (admin UI) and AvailabilityCard (crew email drafts)

## Folder Shape
```
api/         — Typed API bindings (crew-payment-templates endpoints)
hooks/       — React Query hooks (queries + mutations) and query key factory
types/       — TypeScript interfaces and DTOs
```

## Hooks
| Hook | Purpose |
|------|---------|
| `useCrewPaymentTemplates()` | Fetch all templates for current brand |
| `useCrewPaymentTemplate(id)` | Fetch single template by ID |
| `useCreateCrewPaymentTemplate()` | Create mutation with auto-invalidation |
| `useUpdateCrewPaymentTemplate()` | Update mutation with auto-invalidation |
| `useDeleteCrewPaymentTemplate()` | Delete (soft) mutation with auto-invalidation |

## Key Routes
- `GET /api/brands/:brandId/crew-payment-templates`
- `GET /api/brands/:brandId/crew-payment-templates/:id`
- `POST /api/brands/:brandId/crew-payment-templates`
- `PATCH /api/brands/:brandId/crew-payment-templates/:id`
- `DELETE /api/brands/:brandId/crew-payment-templates/:id`

## Related modules
- **Backend**: `packages/backend/src/finance/crew-payment-templates`
- **Settings UI**: `features/platform/settings/components/PaymentScheduleSettings.tsx`
- **Inquiry crew emails**: `features/workflow/inquiries/components/AvailabilityCard.tsx`

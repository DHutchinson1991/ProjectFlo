# Crew Payment Templates Module

## What this module does

CRUD for crew payment templates — reusable payment schedule definitions scoped to a brand and crew role type. Each template has ordered rules that define payment milestones (percent or fixed amount) triggered by booking, event, or task completion dates.

## Key files

| File | Purpose |
|------|---------|
| `crew-payment-templates.service.ts` | Template + rules CRUD, default management |
| `crew-payment-templates.controller.ts` | `GET/POST/PATCH/DELETE /api/crew-payment-templates` |
| `dto/crew-payment-template.dto.ts` | Validation for templates and nested rules |

## Business rules / invariants

- Only one template per `(brand_id, role_type)` can be `is_default = true` at a time.
- Setting a new default unsets the previous default within the same brand + role_type scope.
- Delete is a soft delete (`is_active = false`); `findAll` filters to active only.
- Rules support `amount_type` of `PERCENT` or `FIXED`, and triggers: `AFTER_BOOKING`, `BEFORE_EVENT`, `AFTER_EVENT`.
- Rules can optionally reference a `task_library_id` and `frequency`.

## Related modules

- **Backend**: `../payment-brackets` — defines crew rate tiers consumed alongside these templates
- **Frontend**: `features/finance/crew-payment-templates` — template management UI

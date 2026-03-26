# finance / crew-payment-templates

Manages reusable crew payment rate templates that can be applied to inquiries and quotes.

## Responsibilities
- CRUD for crew payment templates per brand
- Rate definitions (day rate, half day, travel, etc.)
- Applied during quote/estimate generation for crew cost calculation

## Folder Shape
```
api/    — Typed API bindings (crew-payment-templates endpoints)
hooks/  — useCrewPaymentTemplatesApi
```

## Key Routes
- `GET /api/brands/:brandId/crew-payment-templates`
- `POST /api/brands/:brandId/crew-payment-templates`
- `PATCH /api/brands/:brandId/crew-payment-templates/:id`
- `DELETE /api/brands/:brandId/crew-payment-templates/:id`

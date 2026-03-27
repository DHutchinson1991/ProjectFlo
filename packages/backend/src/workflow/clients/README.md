# Clients Module

**Bucket**: workflow  
**Owner domain**: client/contact relationship management

## Responsibility

Manages the `Client` record — the person (or organization) who commissions work. Clients are scoped to a brand and typically created during the inquiry intake flow.

## Exposed Surface

| Symbol | Description |
|---|---|
| `ClientsModule` | NestJS module — import to use clients functionality |
| `ClientsService` | CRUD operations for client records |
| `ClientsController` | REST controller — `/clients` |

## Key Concepts

- A client belongs to a single brand (`brand_id`).
- Clients are linked to inquiries and projects as the primary contact.
- No authentication ownership at the client level — brand-scoped access only.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/clients` | List clients for brand |
| GET | `/clients/:id` | Get single client |
| POST | `/clients` | Create a client |
| PATCH | `/clients/:id` | Update a client |
| DELETE | `/clients/:id` | Delete a client |

## Files

```
clients/
  clients.module.ts
  clients.service.ts       ≤250 lines — CRUD only
  clients.controller.ts    ≤200 lines
  dto/
    clients.dto.ts
```

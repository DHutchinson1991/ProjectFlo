# Proposals Module

**Bucket**: workflow  
**Owner domain**: proposal generation, sharing, and response lifecycle

## Responsibility

Manages `Proposal` records attached to inquiries. Handles AI-assisted content generation, share-token email delivery, client response tracking (accept/decline), and section-level engagement telemetry.

## Exposed Surface

| Symbol | Description |
|---|---|
| `ProposalsModule` | NestJS module — import to use proposals functionality |
| `ProposalsService` | Proposal CRUD |
| `ProposalContentGeneratorService` | AI/template-driven title and section generation |
| `ProposalLifecycleService` | Sharing, token resolution, and client response |
| `ProposalsController` | REST controller — `/proposals` |
| `PublicProposalsController` | Unauthenticated routes — `/public/proposals` (share-token flow) |

## Key Concepts

- A proposal belongs to an inquiry and is scoped to a brand.
- Content (hero title, intro, sections) is generated from package templates with AI overrides.
- Sharing creates a signed JWT share token embedded in the email link.
- Clients can accept or decline via the public share-token endpoint (no login required).
- Public share flow tracks section-level views, dwell-time duration, and per-section notes.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/proposals?inquiryId=` | JWT | List proposals for inquiry |
| GET | `/proposals/:id` | JWT | Get single proposal |
| POST | `/proposals` | JWT | Create proposal |
| PATCH | `/proposals/:id` | JWT | Update proposal |
| DELETE | `/proposals/:id` | JWT | Delete proposal |
| POST | `/proposals/:id/send` | JWT | Send proposal email |
| GET | `/api/proposals/share/:token` | None | Fetch proposal by share token |
| POST | `/api/proposals/share/:token/respond` | None | Accept/decline proposal |
| POST | `/api/proposals/share/:token/section-view` | None | Track section view + optional `duration_seconds` increment |
| POST | `/api/proposals/share/:token/section-note` | None | Upsert section note for a proposal section |

## Files

```
proposals/
  proposals.module.ts
  proposals.controller.ts          ≤200 lines
  public-proposals.controller.ts   ≤200 lines  
  dto/
    proposals.dto.ts
  services/
    proposals-crud.service.ts      ≤250 lines — findAll, findOne, create, update, remove
    proposal-content-generator.service.ts  ≤250 lines — AI/template section generation
    proposal-lifecycle.service.ts  ≤250 lines — send, share token, respond
```

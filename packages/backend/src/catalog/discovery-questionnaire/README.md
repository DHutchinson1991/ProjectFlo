# Discovery Questionnaire

## What this module does
Provides configurable discovery-call questionnaire templates and captures per-inquiry submission responses. Templates contain ordered questions with script hints, field types, and visibility controls. Submissions store call responses, notes, transcripts, and sentiment.

## Key files
| File | Purpose |
|------|---------|
| `discovery-questionnaire.service.ts` | Template CRUD + auto-creation of default template |
| `services/discovery-questionnaire-submissions.service.ts` | Submission CRUD + auto-complete of Discovery Call task |
| `constants/default-template-questions.ts` | 32 default questions seeded into new templates |
| `discovery-questionnaire.controller.ts` | REST endpoints for templates + submissions |
| `dto/*.dto.ts` | Split DTO files for question, template, and submission payloads |

## Business rules / invariants
- Each brand gets one default template auto-created on first access (`getActiveTemplate`).
- Questions have `visibility`: `both` (shared with client), `internal` (producer-only).
- Submissions are linked to an inquiry; creating a submission auto-completes the "Discovery Call" pipeline task (best-effort).
- Templates are brand-scoped via `brand_id`.
- Controllers resolve brand scope through the shared `X-Brand-Context` header decorator.
- Default questions are defined in `constants/` — not hardcoded in service logic.

## Related modules
- **Backend**: `../../workflow/tasks` — `InquiryTasksService.autoCompleteByName` for task completion
- **Frontend**: `features/catalog/discovery-questionnaire` — questionnaire builder + call UI

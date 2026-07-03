# Inquiry Wizard Module

Backend module for managing inquiry wizard templates, questions, and submissions.

The Inquiry Wizard is a single unified system covering two distinct moments in the lead lifecycle, discriminated by `stage` (`InquiryWizardStage`: `INTAKE` | `DISCOVERY_CALL`) on `inquiry_wizard_templates`:

- **`INTAKE`** — the original "Needs Assessment" client-facing intake form (public share link, converts to an inquiry).
- **`DISCOVERY_CALL`** — the former standalone "Discovery Questionnaire": an internal script/checklist used during the sales discovery call, capturing `call_notes`, `transcript`, `sentiment`, and `call_duration_seconds` on the submission, plus `section`/`script_hint`/`visibility` on questions for structuring the call script.

Both stages share one set of tables (`inquiry_wizard_templates` / `_questions` / `_submissions`), one backend module, and one frontend feature — they were previously two separate systems (`needs-assessments` and `discovery-questionnaire`) that have been merged.

## Service architecture

The module is split by concern across 6 services:

| Service | Responsibility |
|---------|---------------|
| `InquiryWizardTemplateService` | Template CRUD, share token, default template per stage (`getActiveTemplate`, `resetActiveTemplate`) |
| `InquiryWizardSubmissionService` | Submission CRUD, review, public submit, response/discovery-field updates, stage-aware task auto-complete |
| `InquiryWizardLinkService` | Link/create inquiries from wizard responses |
| `InquiryWizardEstimateService` | Auto-create draft estimates from inquiry snapshots |
| `InquiryWizardPrefillService` | Pre-fill location slots + subject names |
| `InquiryWizardConflictService` | Date + crew conflict detection |

Pure helper functions shared across estimate logic live in `services/estimate-helpers.ts`. Default question sets per stage live in `constants/default-template.ts` (`INTAKE`) and `constants/default-discovery-call-template.ts` (`DISCOVERY_CALL`).

## DTO files

| File | Contents |
|------|----------|
| `dto/inquiry-wizard-question.dto.ts` | `InquiryWizardQuestionDto` (incl. `section`, `script_hint`, `visibility`) |
| `dto/create-inquiry-wizard-template.dto.ts` | `CreateInquiryWizardTemplateDto` (incl. optional `stage`) |
| `dto/update-inquiry-wizard-template.dto.ts` | `UpdateInquiryWizardTemplateDto` (incl. optional `stage`) |
| `dto/create-inquiry-wizard-submission.dto.ts` | `CreateInquiryWizardSubmissionDto` (incl. discovery-call fields) |
| `dto/update-inquiry-wizard-submission.dto.ts` | `UpdateInquiryWizardSubmissionDto` — patch discovery-call fields on an existing submission |
| `dto/inquiry-wizard-submission-contact.dto.ts` | `InquiryWizardSubmissionContactDto` |
| `dto/inquiry-wizard-submission-inquiry.dto.ts` | `InquiryWizardSubmissionInquiryDto` |
| `dto/list-iw-submissions-query.dto.ts` | `ListIwSubmissionsQueryDto` (incl. optional `stage` filter) |
| `dto/review-iw-submission.dto.ts` | `ReviewIwSubmissionDto` |
| `dto/public-submission.dto.ts` | `PublicSubmissionDto` |
| `dto/update-submission-responses.dto.ts` | `UpdateSubmissionResponsesDto` |

## Endpoints

All authenticated routes accept an optional `?stage=INTAKE|DISCOVERY_CALL` query param where applicable; templates default to `INTAKE`, `resetActiveTemplate` defaults to `DISCOVERY_CALL`.

### Authenticated (`/api/inquiry-wizard/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates` | List all templates for brand (optionally filtered by `stage`) |
| GET | `/templates/active` | Get the active template for brand + stage |
| POST | `/templates/reset` | Reset the active template to stage defaults |
| GET | `/templates/:id` | Get template with questions |
| POST | `/templates` | Create template |
| PUT | `/templates/:id` | Update template |
| POST | `/templates/:id/share-token` | Generate a public share token for a template |
| GET | `/submissions` | List submissions for brand (optionally filtered by `inquiryId`/`stage`) |
| GET | `/submissions/by-inquiry/:inquiryId` | Get a submission for an inquiry (optionally filtered by `stage`) |
| GET | `/submissions/:id` | Get a submission by id |
| POST | `/submissions` | Create a submission (branches to intake or discovery-call flow based on template stage) |
| PATCH | `/submissions/:id` | Patch discovery-call fields (`call_notes`, `transcript`, `sentiment`, `call_duration_seconds`, `responses`) on a submission |
| POST | `/submissions/:id/convert` | Convert submission to inquiry |
| PATCH | `/submissions/:id/review` | Review a submission |
| GET | `/submissions/:id/conflict-check` | Check date conflicts |
| GET | `/submissions/:id/crew-conflict-check` | Check crew conflicts |

### Public (`/api/inquiry-wizard/share/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:token` | Get active template by share token |
| POST | `/:token/submit` | Submit completed wizard (creates/links inquiry) |
| PATCH | `/submission/:submissionId/responses` | Update submission responses |

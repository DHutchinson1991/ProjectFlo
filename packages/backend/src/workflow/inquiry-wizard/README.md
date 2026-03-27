# Inquiry Wizard Module

Backend module for managing inquiry wizard templates, questions, and submissions.

Renamed from `needs-assessments` — DB tables unchanged via `@@map`.

## Service architecture

The module is split by concern across 6 services:

| Service | Responsibility | Lines |
|---------|---------------|-------|
| `InquiryWizardTemplateService` | Template CRUD, share token, default template | 210 |
| `InquiryWizardSubmissionService` | Submission CRUD, review, public submit, response updates | 167 |
| `InquiryWizardLinkService` | Link/create inquiries from wizard responses | 182 |
| `InquiryWizardEstimateService` | Auto-create draft estimates from inquiry snapshots | 241 |
| `InquiryWizardPrefillService` | Pre-fill location slots + subject names | 146 |
| `InquiryWizardConflictService` | Date + crew conflict detection | 130 |

Pure helper functions shared across estimate logic live in `services/estimate-helpers.ts`.

## DTO files

| File | Contents |
|------|----------|
| `dto/inquiry-wizard-template.dto.ts` | `InquiryWizardQuestionDto`, `CreateInquiryWizardTemplateDto`, `UpdateInquiryWizardTemplateDto` |
| `dto/inquiry-wizard-submission.dto.ts` | `InquiryWizardSubmissionContactDto`, `InquiryWizardSubmissionInquiryDto`, `CreateInquiryWizardSubmissionDto` |
| `dto/review-iw-submission.dto.ts` | `ReviewIwSubmissionDto` |

## Endpoints

### Authenticated (`/api/inquiry-wizard/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/templates` | List all templates for brand |
| GET | `/templates/:id` | Get template with questions |
| POST | `/templates` | Create template |
| PUT | `/templates/:id` | Update template |
| POST | `/templates/:id/questions` | Add question |
| PUT | `/questions/:id` | Update question |
| DELETE | `/questions/:id` | Delete question |
| PUT | `/questions/reorder` | Reorder questions |
| GET | `/submissions` | List submissions for brand |
| GET | `/submissions/inquiry/:id` | Get submissions for an inquiry |
| POST | `/submissions/:id/convert` | Convert submission to inquiry |
| PUT | `/submissions/:id/review` | Review a submission |
| GET | `/conflict/dates` | Check date conflicts |
| GET | `/conflict/crew` | Check crew conflicts |

### Public (`/api/public/inquiry-wizard/`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/template` | Get active template by brand slug |
| GET | `/template/token/:token` | Get template by share token |
| POST | `/submissions` | Submit completed wizard (creates/links inquiry) |
| PATCH | `/submissions/:id/responses` | Update submission responses |

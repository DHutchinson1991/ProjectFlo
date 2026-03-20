# Inquiry Pipeline Analysis: Review Inquiry → Qualify & Respond → Discovery

## What This Document Covers

A full audit of the **Inquiry and Discovery stages** of the pipeline — everything between receiving an inquiry and being ready for a Proposal. Each task and subtask is listed with what it does today, what works, and any known issues.

---

## Pipeline Overview

```
INQUIRY STAGE
├── Review Inquiry (7 subtasks)
│   ├── ✅ Verify Submission Data         (auto)
│   ├── ✅ Confirm Package Selection       (auto)
│   ├── ✅ Check Crew Availability         (auto)
│   ├── ✅ Check Equipment Availability    (auto)
│   ├── ✅ Resolve Availability Conflicts  (auto)
│   ├── ✅ Send Availability Requests      (auto)
│   └── ✅ Reserve Equipment               (auto)
├── Qualify & Respond (3 subtasks)
│   ├── 🔧 Schedule Discovery Call         (auto when DISCOVERY_CALL calendar event created)
│   ├── 🔧 Qualify Inquiry                 (manual — gated: requires discovery call scheduled)
│   └── 🔧 Send Welcome Response           (manual)
├── Estimate Preparation                   (auto — creates draft estimate)
└── Review Estimate                        (manual — review & send estimate)

DISCOVERY STAGE
└── Discovery Call                         (manual — auto-completes when questionnaire is submitted)
```

---

## Task 1: Review Inquiry

**Purpose:** Verify everything about the inquiry is in order before responding.

### Subtask 1.1 — Verify Submission Data (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when the inquiry has an email, phone number, event date, and event type |
| **Where it runs** | Backend: `inquiry-tasks.service.ts` → `syncReviewInquiryAutoSubtasks()` |
| **Status** | ✅ Working |

### Subtask 1.2 — Confirm Package Selection (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when a package is selected (`inquiry.selected_package_id` is set) |
| **Where it runs** | Backend: `inquiry-tasks.service.ts` → `syncReviewInquiryAutoSubtasks()` |
| **Status** | ✅ Working |

### Subtask 1.3 — Check Crew Availability (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when no on-site crew members have scheduling conflicts |
| **Where it runs** | Backend: `inquiry-availability.service.ts` |
| **Status** | ✅ Working |

### Subtask 1.4 — Check Equipment Availability (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when no equipment has scheduling conflicts |
| **Where it runs** | Backend: `inquiry-availability.service.ts` |
| **Status** | ✅ Working |

### Subtask 1.5 — Resolve Availability Conflicts (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when crew conflicts + equipment conflicts = 0. Reverts to incomplete if new conflicts appear |
| **Where it runs** | Backend: `inquiry-availability.service.ts` → `syncAutoSubtask('resolve_availability_conflicts', allResolved)` |
| **Status** | ✅ Working |

### Subtask 1.6 — Send Availability Requests (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when all assigned crew members have at least one non-cancelled availability request |
| **Where it runs** | Backend: `inquiry-availability.service.ts` → `syncRequestSubtasks()` |
| **Status** | ✅ Working |

### Subtask 1.7 — Reserve Equipment (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when all equipment slots have a reservation |
| **Where it runs** | Backend: `inquiry-availability.service.ts` → `syncEquipmentReservationSubtask()` |
| **Status** | ✅ Working |

### Review Inquiry — Parent Task Completion

All 7 subtasks are auto-completing. Parent auto-completes when all 7 are done via `syncTaskStatusFromSubtasks()`.

---

## Task 2: Qualify & Respond

**Purpose:** Schedule the discovery call, then confirm the inquiry is worth pursuing and make first contact with the client.

The QualifyCard appears in the UI **below the Discovery Call Scheduling card** (CallsCard). The Qualify Inquiry button is gated — disabled until a discovery call is confirmed as scheduled.

### Subtask 2.1 — Schedule Discovery Call (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Tracks whether the discovery call has been booked |
| **Where in UI** | QualifyCard — status row showing "Not scheduled / Scheduled" |
| **Auto-complete** | `calendar.service.ts` calls `setAutoSubtaskStatus(inquiryId, 'schedule_discovery_call', true)` when a `DISCOVERY_CALL` calendar event is created |
| **Status** | ✅ Working |

### Subtask 2.2 — Qualify Inquiry (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Marks the inquiry status as "Qualified" |
| **Where in UI** | QualifyCard → "Qualify Inquiry" button |
| **Gate** | Button is disabled if no discovery call has been scheduled (`GET /api/inquiries/:id/discovery-call` returns null) |
| **Status** | ✅ Working |

### Subtask 2.3 — Send Welcome Response (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Indicates the user has sent an initial response to the client |
| **Where in UI** | QualifyCard → "Send Welcome" button → opens WelcomeEmailDialog → builds a draft email → opens `mailto:` link |
| **Status** | ✅ Functional (intent-based — no delivery confirmation) |
| **Known limitation** | `mailto:` link is unreliable if no email client is configured. Future: in-app email sending with delivery tracking. |

---

## Task 3: Estimate Preparation (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-creates a draft estimate from the selected package when the Needs Assessment is submitted |
| **Where it runs** | Backend: `needs-assessments.service.ts` → `autoCreateDraftEstimate()` |
| **Status** | ✅ Working |

---

## Task 4: Review Estimate (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Prompts the user to review the auto-generated estimate, adjust line items if needed, and send to the client |
| **Where in UI** | EstimatesCard → expand estimate → edit line items → click Send button |
| **How it completes** | Auto-completes when estimate status changes to "Sent" |
| **Staleness detection** | Detects changes to crew roles/hours/equipment in the package clone |
| **Status** | ✅ Working |

---

## Discovery Stage — Discovery Call (MANUAL / AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Conduct the call, then save post-call notes or transcript via the Discovery Questionnaire |
| **Where in UI** | The task appears in the pipeline; notes are saved via DiscoveryQuestionnaireCard |
| **Auto-complete** | `discovery-questionnaire.service.ts` calls `autoCompleteByName(inquiryId, 'Discovery Call')` when a questionnaire submission is linked to the inquiry |
| **Status** | ✅ Working |

---

## UI Card Layout (Middle Column — Inquiry Detail Page)

```
1. CallsCard                    (#calls-section — Discovery Call booking)
2. QualifyCard                  (#qualify-section — Qualify & Respond)
3. DiscoveryQuestionnaireCard   (#discovery-questionnaire-section)
4. ProposalsCard
5. ProposalReviewCard
6. QuotesCard
```

---

## Known Issues

None outstanding. Previous issues have been resolved:
- **Resolve Conflicts auto-complete** — ✅ Fixed. Now an auto subtask driven by `inquiry-availability.service.ts`.
- **Qualify & Respond premature parent completion** — ✅ Fixed. `autoCompleteByName` trigger removed; parent completes only when all subtasks done.

---

## How the Full Flow Works

1. **Inquiry comes in** → Tasks auto-generate → Verify Submission Data auto-completes if contact info is complete
2. **Package selected** (via Needs Assessment) → Confirm Package auto-completes → Estimate Preparation auto-completes (draft estimate created)
3. **Availability checked** → crew/equipment conflicts auto-subtasks complete when resolved; zero conflicts = auto-complete
4. **Availability requests sent** → Send Availability Requests auto-completes when all crew have requests
5. **Equipment reserved** → Reserve Equipment auto-completes → Review Inquiry parent completes
6. **User schedules discovery call** (CallsCard) → DISCOVERY_CALL calendar event created → `schedule_discovery_call` subtask on Q&R auto-completes
7. **User conducts call, fills questionnaire** → `Discovery Call` pipeline task auto-completes (questionnaire submitted)
8. **User clicks "Qualify Inquiry"** (gated until `schedule_discovery_call` subtask complete) → subtask completes, inquiry status → Qualified
9. **User clicks "Send Welcome"** → email drafted, mailto opened → subtask completes → all 3 subtasks done → Qualify & Respond parent auto-completes
10. **User reviews estimate** → adjusts if needed → sends → Review Estimate auto-completes
11. **Inquiry and Discovery stages complete** → Proposal stage tasks become ready

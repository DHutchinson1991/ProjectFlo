# Inquiry Pipeline Analysis: Review Inquiry → Qualify & Respond

## What This Document Covers

A full audit of the **Inquiry stage** pipeline — everything between receiving an inquiry and being ready for a Discovery Call. Each task and subtask is listed with what it does today, what works, what's broken or missing, and what to fix.

---

## Pipeline Overview (Inquiry Stage)

```
INQUIRY STAGE
├── Review Inquiry (7 subtasks)
│   ├── ✅ Verify Submission Data         (auto)
│   ├── ✅ Confirm Package Selection       (auto)
│   ├── ✅ Check Crew Availability         (auto)
│   ├── ✅ Check Equipment Availability    (auto)
│   ├── 🔧 Resolve Availability Conflicts (manual)
│   ├── ✅ Send Availability Requests      (auto)
│   └── ✅ Reserve Equipment               (auto)
├── Qualify & Respond (2 subtasks)
│   ├── 🔧 Qualify Inquiry                (manual)
│   └── 🔧 Send Welcome Response          (manual)
├── Estimate Preparation                   (auto — creates draft estimate)
└── Review Estimate                        (manual — review & send estimate)
```

---

## Task 1: Review Inquiry

**Purpose:** Verify everything about the inquiry is in order before you respond.

### Subtask 1.1 — Verify Submission Data (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when the inquiry has an email, phone number, event date, and event type |
| **Where it runs** | Backend: `inquiry-tasks.service.ts` → `syncReviewInquiryAutoSubtasks()` |
| **Status** | ✅ Working |
| **Notes** | Fires when tasks are first generated and re-syncs on inquiry updates |

### Subtask 1.2 — Confirm Package Selection (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when a package is selected (`inquiry.selected_package_id` is set) |
| **Where it runs** | Backend: `inquiry-tasks.service.ts` → `syncReviewInquiryAutoSubtasks()` |
| **Status** | ✅ Working |
| **Notes** | Triggers when package selection happens via Needs Assessment or manual selection |

### Subtask 1.3 — Check Crew Availability (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when no on-site crew members have scheduling conflicts |
| **Where it runs** | Backend: `inquiry-availability.service.ts` → calls `setAutoSubtaskStatus('check_crew_availability')` |
| **Status** | ✅ Working |
| **Issue** | Only checks *on-site* crew. If you have a planning/post-production crew member with a conflict, this subtask won't catch it. Probably fine — you'd only be checking day-of availability at this stage. |

### Subtask 1.4 — Check Equipment Availability (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when no equipment has scheduling conflicts |
| **Where it runs** | Backend: `inquiry-availability.service.ts` |
| **Status** | ✅ Working |
| **Notes** | Equipment conflicts are shown per-owner group in the AvailabilityCard |

### Subtask 1.5 — Resolve Availability Conflicts (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Requires the user to manually resolve any crew or equipment conflicts |
| **Where in UI** | AvailabilityCard → yellow "Conflict" badges on crew/equipment rows → "Reassign" button to swap |
| **Status** | ⚠️ Partially working — see issues below |

**Issues:**

1. **No auto-complete when conflicts are resolved.** If you reassign a conflicting crew member and conflicts drop to zero, this subtask stays incomplete. The user has to manually check it off in the GlobalTaskDrawer. It should auto-complete (like the other availability subtasks) when `crewConflicts + equipmentConflicts === 0`.

2. **No "nothing to resolve" handling.** If there are zero conflicts from the start, this subtask sits there as a manual To Do that the user has to check off for no reason. It should auto-complete immediately if there are no conflicts.

**Recommendation:** Convert this to an auto subtask that completes when conflict count = 0, and reverts to incomplete if new conflicts appear (same pattern as `check_crew_availability`).

### Subtask 1.6 — Send Availability Requests (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when all assigned crew members have at least one non-cancelled availability request |
| **Where it runs** | Backend: `inquiry-availability.service.ts` → `syncRequestSubtasks()` |
| **Where in UI** | AvailabilityCard → "Request" buttons per crew member → CrewAvailabilityRequestDialog |
| **Status** | ✅ Working |
| **Notes** | Tracks sent, pending, confirmed, declined, cancelled states per crew member |

### Subtask 1.7 — Reserve Equipment (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-completes when all equipment slots have a reservation |
| **Where it runs** | Backend: `inquiry-availability.service.ts` → `syncEquipmentReservationSubtask()` |
| **Where in UI** | AvailabilityCard → "Reserve" buttons per equipment owner → EquipmentReservationDialog |
| **Status** | ✅ Working |

### Review Inquiry — Parent Task Completion

| Item | Detail |
|------|--------|
| **How it completes** | Automatically when all 7 subtasks are completed |
| **Mechanism** | `syncTaskStatusFromSubtasks()` recalculates parent status after every subtask change |
| **Blocker** | Subtask 1.5 (Resolve Conflicts) is manual — even if all other 6 auto-subtasks complete, the parent task stays "In Progress" until the user manually checks off conflict resolution |

---

## Task 2: Qualify & Respond

**Purpose:** Confirm the inquiry is worth pursuing and make first contact with the client.

### Subtask 2.1 — Qualify Inquiry (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Marks the inquiry status as "Qualified" |
| **Where in UI** | QualifyCard → "Qualify Inquiry" button |
| **Side effects** | Updates `inquiry.status` to `Qualified`, which also triggers `autoCompleteByName('Qualify & Respond')` on the parent task |
| **Status** | ✅ Working |
| **Issue** | The side-effect chain is redundant: clicking "Qualify" marks the subtask done AND auto-completes the parent. But the parent has 2 subtasks. If you qualify before sending the welcome, the parent auto-completes prematurely via the status-change trigger — even though `send_welcome_response` is still incomplete. |

**Recommendation:** The `autoCompleteByName('Qualify & Respond')` triggered by status→Qualified should be removed. Let the parent complete naturally through the subtask mechanism (all subtasks done → parent done). Right now qualifying before sending the welcome email marks the whole task as Done, which is wrong.

### Subtask 2.2 — Send Welcome Response (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Indicates the user has sent an initial response to the client |
| **Where in UI** | QualifyCard → "Send Welcome" button → opens WelcomeEmailDialog → builds a draft email → opens `mailto:` link |
| **Status** | ⚠️ Functional but fragile — see issues below |

**Issues:**

1. **mailto: link is unreliable.** The email opens in the user's default email client via a `mailto:` link. If the user has no email client configured, or closes the dialog without sending, the subtask still gets marked as complete. There's no actual confirmation that an email was sent.

2. **No tracking.** The backend creates a `communications_log` entry, but there's no way to see this in the UI or verify the email was actually delivered.

**Recommendation:** For now, this is acceptable — you're tracking intent, not delivery. A future improvement would be an in-app email sender or integration (e.g. SendGrid/Resend) with actual delivery confirmation. Low priority.

---

## Task 3: Estimate Preparation (AUTO)

| Item | Detail |
|------|--------|
| **What it does** | Auto-creates a draft estimate from the selected package when the Needs Assessment is submitted |
| **Where it runs** | Backend: `needs-assessments.service.ts` → `autoCreateDraftEstimate()` |
| **Status** | ✅ Working |
| **Notes** | This is an auto-only task — the user never sees or interacts with it directly. It fires and completes automatically. |

---

## Task 4: Review Estimate (MANUAL)

| Item | Detail |
|------|--------|
| **What it does** | Prompts the user to review the auto-generated estimate, adjust line items if needed, and send it to the client |
| **Where in UI** | EstimatesCard → expand estimate → edit line items → click Send button |
| **How it completes** | Auto-completes when estimate status changes to "Sent" (via `send()` or `update()`) |
| **Status** | ✅ Recently fixed (force=true bypasses subtask guard, try/catch prevents send failure) |
| **Staleness** | ✅ Recently fixed — now detects changes to crew roles/hours/equipment in the package clone, not just inquiry record changes |

---

## Summary of Issues Found

| # | Issue | Severity | Task/Subtask |
|---|-------|----------|--------------|
| 1 | **Resolve Conflicts never auto-completes** — user must manually toggle even when conflicts are zero | Medium | Review Inquiry → Resolve Availability Conflicts |
| 2 | **Qualify & Respond auto-completes prematurely** — status→Qualified trigger bypasses subtask completion, marking parent Done before welcome email is sent | High | Qualify & Respond (parent) |
| 3 | **mailto: sends without confirmation** — subtask marked complete even if user doesn't actually send the email | Low | Qualify & Respond → Send Welcome Response |

---

## Recommended Fixes (Priority Order)

### Fix 1 — Qualify & Respond premature completion (HIGH)

**Problem in plain terms:** When you click "Qualify Inquiry", two things happen at once — the subtask completes AND the inquiry status changes to Qualified. The status change separately triggers an auto-complete on the "Qualify & Respond" parent task. So the whole task shows as "Done" even if you haven't sent the welcome email yet.

**Fix:** Remove the `autoCompleteByName('Qualify & Respond')` call from the status-change handler in `inquiries.service.ts`. The parent task should only complete when BOTH subtasks (qualify + send welcome) are done — which already works via the subtask sync mechanism.

**Where:** `packages/backend/src/inquiries/inquiries.service.ts` — the `Qualified` status handler.

### Fix 2 — Make Resolve Conflicts auto-completing (MEDIUM)

**Problem in plain terms:** Even if there are zero conflicts (all crew and equipment are available), the "Resolve Availability Conflicts" subtask stays as a manual to-do. The user has to check it off themselves. And if conflicts get resolved by reassigning crew, it still doesn't auto-complete.

**Fix:** Convert `resolve_availability_conflicts` to an auto subtask. After every crew/equipment availability check, if `crewConflicts === 0 && equipmentConflicts === 0`, mark it complete. If new conflicts appear, revert it to incomplete. Same pattern as the other availability subtasks.

**Where:** `packages/backend/src/inquiries/inquiry-availability.service.ts` — add `setAutoSubtaskStatus('resolve_availability_conflicts', conflictCount === 0)` alongside the existing availability checks.

### Fix 3 — Welcome email confirmation (LOW / FUTURE)

**Problem in plain terms:** When you click "Send Welcome", it opens your email app with a pre-written email. But there's no way to know if you actually sent it. The subtask gets marked done regardless.

**Fix (future):** Integrate an email sending service so emails go from within the app, with delivery tracking. For now, the current approach (trust the user's intent) is fine for an MVP.

---

## How the Full Flow Should Work (After Fixes)

1. **Inquiry comes in** → Tasks auto-generate → Verify Submission Data auto-completes if contact info is complete
2. **Package is selected** (via Needs Assessment) → Confirm Package auto-completes → Estimate Preparation auto-completes (draft estimate created)
3. **User opens Availability section** → crew/equipment conflicts are checked automatically → Check Crew/Equipment auto-complete if no conflicts → **Resolve Conflicts auto-completes if zero conflicts** (Fix 2)
4. **User sends availability requests** → Send Availability Requests auto-completes when all crew have requests
5. **User reserves equipment** → Reserve Equipment auto-completes when all equipment is reserved
6. **All 7 Review Inquiry subtasks done** → Review Inquiry parent auto-completes → Inquiry stage progresses
7. **User clicks "Qualify Inquiry"** → Subtask completes, inquiry status → Qualified. **Parent does NOT auto-complete yet** (Fix 1)
8. **User clicks "Send Welcome"** → Builds email, opens mailto → Subtask completes → Now both subtasks done → Qualify & Respond parent auto-completes
9. **User reviews estimate in EstimatesCard** → Adjusts line items if needed → Clicks Send → Review Estimate auto-completes
10. **Inquiry stage is fully complete** → Discovery stage tasks become ready

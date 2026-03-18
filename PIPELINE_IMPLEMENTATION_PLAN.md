# Pipeline Implementation Plan

> **📋 AGENT INSTRUCTIONS — READ THIS FIRST:**
> As you complete each step in this plan, immediately mark it done:
> - Change `## STEP N —` to `## ~~STEP N~~ ✅ COMPLETE —` in the header
> - Add `> **STATUS: COMPLETE ✅**` as the first line under the header
> - Do this BEFORE moving to the next step — do not batch completions
> - For partial work, use `> **STATUS: PARTIAL ⚠️** — [what still needs doing]`
> - Steps marked ✅ COMPLETE can be skipped when resuming from a checkpoint

> **Source of truth:** `INQUIRY_PIPELINE_REVIEW_DECISIONS.md` (same repo root)
> **Approach:** Step-by-step, one priority at a time. Verify each step before moving on.
> **Rule:** Do NOT skip ahead. Complete each step, test it, then proceed.

---

## How to Use This Prompt

Start a new conversation and paste the following instruction block. The agent will work through each step sequentially, stopping at designated checkpoints for your input.

If a session runs out of context, start a new conversation and say:
> "Continue the pipeline implementation. Read `PIPELINE_IMPLEMENTATION_PROMPT.md` and `INQUIRY_PIPELINE_REVIEW_DECISIONS.md` from the project root. Pick up from Step [X]."

---

## Master Instruction Block

```
You are implementing the inquiry/booking pipeline for ProjectFlo.

READ THESE FILES FIRST — they are your source of truth:
1. `INQUIRY_PIPELINE_REVIEW_DECISIONS.md` — all decisions, specs, gap analysis, and implementation plan
2. `PIPELINE_IMPLEMENTATION_PROMPT.md` — this step-by-step guide

RULES:
- Work through the steps below IN ORDER. Do not skip ahead.
- After each step, verify the change works (compile check, read the code back, or run a test).
- At every 🛑 STOP checkpoint, pause and ask me the question(s) listed. Wait for my answer before continuing.
- At every ✅ VERIFY checkpoint, confirm the change is correct before moving on.
- If something doesn't compile or breaks, fix it before moving to the next step.
- Reference the Gap Analysis section of the decisions doc for exactly what exists vs what's missing.
- Do NOT start/stop dev servers. I have `pnpm dev` running in a separate terminal.
```

---

## ~~STEP 1~~ ✅ COMPLETE — Bug Fixes (Priority 1A, 1D + Discovery fix)

> **STATUS: COMPLETE ✅**

Three quick fixes to broken behaviour in the current codebase. No new features.

### 1.1 — Fix Discovery Call double auto-complete

**File:** `packages/backend/src/calendar/calendar.service.ts`
**What's wrong:** When a `DISCOVERY_CALL` calendar event is created, the hook auto-completes BOTH "Discovery Call Scheduling" AND "Discovery Call". The second should only complete from the questionnaire.
**Fix:** Remove `'Discovery Call'` from the `name: { in: [...] }` array. Keep only `'Discovery Call Scheduling'`.

✅ VERIFY: Read the edited code back. Only `'Discovery Call Scheduling'` should be in the array.

### 1.2 — Fix Discovery Questionnaire dead task name

**File:** `packages/backend/src/discovery-questionnaire/discovery-questionnaire.service.ts`
**What's wrong:** `createSubmission()` calls `autoCompleteByName(inquiryId, 'Requirements Discovery')` — but no task by that name exists in the seed. It's always been a silent no-op.
**Fix:** Change `'Requirements Discovery'` → `'Discovery Call'`.

✅ VERIFY: Read the edited code back. The string should be `'Discovery Call'`.

### 1.3 — Fix portal journey casing bug

**File:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx`
**What's wrong:** Around line 565, the journey tracker checks `client_response === "accepted"` (lowercase), but `respondToProposal()` stores `"Accepted"` (capitalised). The "Proposal Accepted" dot never turns green.
**Fix:** Change `"accepted"` → `"Accepted"`.

✅ VERIFY: Read the edited code back. The comparison should use `"Accepted"`.

### 🛑 STOP — Checkpoint 1

Ask me:
> "All 3 bug fixes applied. Want me to proceed to Step 2 (Task Library Seed Rebuild), or do you want to test these first?"

---

## ~~STEP 2~~ ✅ COMPLETE — Task Library Seed Rebuild (Priority 2)

> **STATUS: COMPLETE ✅**

This MUST come before wiring any auto-complete hooks, because `autoCompleteByName()` needs tasks with the correct names to exist.

### 2.1 — Read the current seed file

**File:** `packages/backend/prisma/seeds/moonrise-task-library.ts`
Read the entire file to understand the current `PIPELINE_STAGES` structure and the `createMoonriseTaskLibrary()` function.

### 🛑 STOP — Checkpoint 2A

Ask me:
> "I've read the current seed. It has [X] stages and [Y] tasks. I'm about to rewrite it to 4 stages with 16 tasks per the decisions doc. A few questions:
>
> 1. **Stage colours** — The current stages have hex colours. Should I keep the same colour palette or use new ones for the 4 new stages?
> 2. **`trigger_type`** — The current seed uses `trigger_type` on some tasks (e.g. `'per_crew_member'`). For the new auto-only tasks (Estimate Preparation, Contract Sent, Contract Signed, Raise Deposit Invoice, Block Wedding Date), should I set `trigger_type: 'auto'` to distinguish them? Or add a separate `is_auto_only` field?
> 3. **`due_date_offset_days`** — Current tasks have offset values. Should I preserve similar offsets for the new tasks, or should I propose new ones based on the pipeline flow?
> 4. **Existing inquiries** — Should this seed only affect NEW inquiries going forward (just update `task_library`)? Or should I also write a migration script that updates `inquiry_tasks` for existing inquiries to match the new structure?"

Wait for my answers to all 4 before proceeding.

### 2.2 — Rewrite PIPELINE_STAGES

Using my answers from 2A, rewrite the `PIPELINE_STAGES` constant with:

**Inquiry stage (4 tasks):**
- Send Needs Assessment (0.15h)
- Review Needs Assessment (0.25h)
- Qualify & Respond (0.25h)
- Estimate Preparation (0h, auto-only)

**Discovery stage (2 tasks):**
- Discovery Call Scheduling (0.15h)
- Discovery Call (0.25h)

**Proposal stage (5 tasks):**
- Generate Quote (0.75h)
- Prepare Contract (0.5h)
- Create & Review Proposal (1.0h)
- Send Proposal (0.15h)
- Contract Sent (0h, auto-only)

**Booking stage (5 tasks):**
- Contract Signed (0h, auto-only)
- Raise Deposit Invoice (0h, auto-only)
- Block Wedding Date (0h, auto-only)
- Confirm Booking (0.15h)
- Send Welcome Pack (0.15h)

Reference the full task tables in the decisions doc (Priority 2C) for descriptions, trigger types, and default job roles.

### 2.3 — Verify seed compiles

Run `npx prisma generate` from packages/backend (or just check for TypeScript errors). The seed file should have no type errors.

### 🛑 STOP — Checkpoint 2B

Ask me:
> "Seed rewritten. [Show summary of changes]. Do you want me to:
> A) Run the seed now to update the task_library table, or
> B) Continue to Step 3 first and seed later when all code changes are done?"

---

## ~~STEP 3~~ ✅ COMPLETE — Wire Auto-Complete Hooks (Priority 1B partial + multiple priorities)

> **STATUS: COMPLETE ✅** — All 8 hooks wired (3.1–3.8).

Now that the task library has correct names, wire `autoCompleteByName()` calls into existing service methods.

### 3.1 — Wire I1: Send Needs Assessment

**File:** `packages/backend/src/needs-assessments/needs-assessments.service.ts`
**Method:** `createSubmission()` — after the submission is created and inquiry fields are populated
**Add:** `await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Send Needs Assessment');`

🛑 STOP — Quick question:
> "NeedsAssessmentsService currently doesn't inject `InquiryTasksService`. I need to:
> 1. Add `InquiryTasksModule` to `NeedsAssessmentsModule` imports
> 2. Inject `InquiryTasksService` into `NeedsAssessmentsService` constructor
> Proceeding with this — correct?"

### 3.2 — Wire P1: Generate Quote

**File:** `packages/backend/src/quotes/quotes.service.ts`
**Method:** `create()` — after quote is created
**Add:** `await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Generate Quote');`
**DI:** Same pattern — add `InquiryTasksModule` to `QuotesModule` imports, inject service.

### 3.3 — Wire P2: Prepare Contract

**File:** `packages/backend/src/contracts/contracts.service.ts`
**Method:** `composeFromTemplate()` or `create()` — after contract is created in Draft status
**Add:** `await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Prepare Contract');`
**DI:** Add `InquiryTasksModule` to `ContractsModule` imports (we'll also need this for B1).

### 3.4 — Wire P3: Create & Review Proposal

**File:** `packages/backend/src/proposals/proposals.service.ts`
**Method:** `create()` — after proposal is created
**Add:** `await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Create & Review Proposal');`
**DI:** Add `InquiryTasksModule` to `ProposalsModule` imports (we'll also need ContractsModule for P5).

### 3.5 — Wire P4: Send Proposal

**File:** `packages/backend/src/proposals/proposals.service.ts`
**Method:** `sendProposal()` — after status is set to Sent
**Add:** `await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Send Proposal');`

### 3.6 — Wire P5: Contract Sent (auto-chain on proposal acceptance)

**File:** `packages/backend/src/proposals/proposals.service.ts`
**Method:** `respondToProposal()` — inside the `if (response === 'Accepted')` block
**Add:**
1. Find draft contract: `const contract = await this.contractsService.findDraftByInquiry(inquiryId);`
2. If found, send it: `await this.contractsService.sendContract(contract.id, ...);`
3. Auto-complete: `await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Contract Sent');`
**DI:** `ProposalsModule` must import `ContractsModule`. Inject `ContractsService`.

🛑 STOP — Checkpoint 3A:
> "P5 requires `ProposalsService` to call `ContractsService.sendContract()`. I need to check:
> 1. Does `sendContract()` require signer details (name, email, role)? If so, where do we get them for auto-sending? Options:
>    a) Pull from inquiry contact (auto-fill client as sole signer)
>    b) Require signers to be set up during P2 (Prepare Contract) — so they're already on the contract
>    c) Skip auto-send if no signers are configured (fail gracefully)
> Which approach?"

Wait for answer, then implement accordingly.

### 3.7 — Wire B1: Contract Signed

**File:** `packages/backend/src/contracts/contracts.service.ts`
**Method:** `submitSignature()` — inside the `if (allSigned)` block, after contract status is set to SIGNED
**Add:** `await this.inquiryTasksService.autoCompleteByName(contract.inquiry_id, 'Contract Signed');`

### 3.8 — Wire B1→B2 chain: Auto-generate deposit invoice

**File:** `packages/backend/src/contracts/contracts.service.ts` (or `invoices.service.ts`)
**Method:** After contract signed (same `if (allSigned)` block as B1), also trigger deposit invoice creation.

🛑 STOP — Checkpoint 3B:
> "For auto-generating the deposit invoice when the contract is signed, I need to:
> 1. Find the primary estimate for the inquiry
> 2. Read `deposit_required` amount
> 3. Create an invoice with that amount
> 4. Mark it as Sent
> 5. Auto-complete 'Raise Deposit Invoice'
>
> Questions:
> 1. Should I create this logic in `InvoicesService` as a new method (e.g. `autoGenerateDepositInvoice(inquiryId)`), or inline it in `ContractsService.submitSignature()`?
> 2. What if there's no estimate or `deposit_required` is null/0? Skip silently?
> 3. Should the invoice due date be a fixed offset from signing date (e.g. 7 days)? Or immediate?"

Wait for answers, then implement.

✅ VERIFY after all hooks: Run a compile check. No TypeScript errors across all modified files.

### 🛑 STOP — Checkpoint 3C

Ask me:
> "All auto-complete hooks are wired. Here's a summary: [list all hooks wired, grouped by file]. Ready for Step 4 (Status-Change Hooks)?"

---

## ~~STEP 4~~ ✅ COMPLETE — Inquiry Status-Change Hooks

> **STATUS: COMPLETE ✅** — I3, B3, B4 status-transition hooks wired in `inquiries.service.ts`.

Three tasks auto-complete based on inquiry status transitions: I3, B3, B4.

### 4.1 — Identify where inquiry status is updated

**Read:** `packages/backend/src/inquiries/inquiries.service.ts` — find the `update()` method.
Determine: does it receive the old status and new status? Or just the new data?

### 4.2 — Add status-transition hook

In the `update()` method (or a dedicated `changeStatus()` method), after the status is saved:

```
if (oldStatus !== newStatus) {
  if (newStatus === 'Contacted' && oldStatus === 'New') {
    await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Qualify & Respond');
  }
  if (newStatus === 'Booked') {
    // Auto-create wedding day calendar block
    await this.calendarService.createEvent({
      inquiry_id: inquiryId,
      event_type: 'WEDDING_DAY',
      title: 'Wedding Day',
      start_time: inquiry.wedding_date,
      end_time: inquiry.wedding_date,
      is_all_day: true,
    });
    await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Block Wedding Date');
    await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Confirm Booking');
  }
}
```

🛑 STOP — Checkpoint 4:
> "I need to inject `CalendarService` and `InquiryTasksService` into `InquiriesService`. Also:
> 1. The `WEDDING_DAY` calendar event needs a `contributor_id` — should I use a default (e.g. the inquiry's assigned operator), or is it okay to leave it null if the schema allows?
> 2. For the Booked status hook — should it also check that the contract is signed first (defensive), or trust that the studio won't change status prematurely?
> 3. Are there other status transitions we should hook into now while we're here? (e.g. `Won`, `Lost`, `Archived`)"

Wait for answers, then implement.

✅ VERIFY: Compile check passes.

---

## ~~STEP 5~~ ✅ COMPLETE — Frontend Constants Rewrite (Priority 1B, 1C, 1E)

> **STATUS: COMPLETE ✅** — `TASK_META`, `TASK_AUTO_COMPLETE`, and `WORKFLOW_PHASES` rewritten in constants.ts.

Update the frontend pipeline rendering to match the new 4-stage / 16-task structure.

### 5.1 — Read current constants

**File:** `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_lib/constants.ts`
Read the full file — understand `WORKFLOW_PHASES`, `TASK_META`, `TASK_AUTO_COMPLETE`, `buildPipelineTasks()`, `buildPipelineTasksFromInquiry()`.

### 5.2 — Rewrite TASK_META

Replace the current ~19-entry map with entries for all 16 new task names. Each entry needs: icon, sectionId. Reference the decisions doc for the task list.

### 5.3 — Rewrite TASK_AUTO_COMPLETE

Replace the current map with correct frontend auto-complete checks for the new task names. Reference the decisions doc Gap Analysis for the exact triggers.

Key entries:
- `'Estimate Preparation'` → estimate exists with status `Sent` or `Accepted` (already correct — keep)
- `'Generate Quote'` → quote exists for inquiry
- `'Prepare Contract'` → contract exists in Draft+ status
- `'Create & Review Proposal'` → proposal exists in any status
- `'Send Proposal'` → proposal status is Sent+
- `'Contract Sent'` → contract status is Sent or Signed
- `'Contract Signed'` → contract status is Signed
- Remove: `Budget Alignment`, `Contract Negotiation`, `Proposal Creation`, `Proposal Delivery`, `Contract Preparation` (old names)

### 5.4 — Update or remove WORKFLOW_PHASES

If `WORKFLOW_PHASES` is used by `buildPipelineTasks()`, update it to match the new 4-stage names and section IDs. If it's unused, remove it.

### 🛑 STOP — Checkpoint 5

Ask me:
> "Frontend constants rewritten. The pipeline UI should now render 4 stages with 16 tasks. Do you want to check the UI in the browser before I continue to Step 6?"

---

## ~~STEP 6~~ ✅ COMPLETE — DB Migrations (Priority 3A, 5F)

> **STATUS: COMPLETE ✅** — `review_notes`, `reviewed_at`, `review_checklist_state` added to `needs_assessment_submissions`; `welcome_sent_at` added to `inquiries`. Migration ran successfully.

Two small schema additions.

### 6.1 — Add NA review fields

**File:** `packages/backend/prisma/schema.prisma`
Add to `needs_assessment_submissions`:
```prisma
review_notes           String?
reviewed_at            DateTime?
review_checklist_state Json?
```

### 6.2 — Add welcome_sent_at

**File:** `packages/backend/prisma/schema.prisma`
Add to `inquiries`:
```prisma
welcome_sent_at  DateTime?
```

### 6.3 — Generate migration

⚠️ Make sure the backend server is stopped before running migrations.

```bash
cd packages/backend
npx prisma migrate dev --name add-na-review-fields-and-welcome-sent-at
npx prisma generate
```

✅ VERIFY: Migration runs cleanly. `npx prisma generate` completes without errors.

### 🛑 STOP — Checkpoint 6

Ask me:
> "DB migrations applied. Ready for Step 7 (NA Review Panel feature build)?"

---

## ~~STEP 7~~ ✅ COMPLETE — NA Review Panel (Priority 3)

> **STATUS: COMPLETE ✅** — 3 backend endpoints built, `NeedsAssessmentDialog` Review Panel component built with smart checklist, notes field, and "Complete Review" button.

New feature. This is the largest piece of work.

### 7.1 — Backend: New endpoints

Create 3 new endpoints in the needs-assessments module:

1. `GET /api/needs-assessments/submissions/:id/conflict-check`
   - Query other inquiries/projects with the same `wedding_date`
   - Return list of conflicts (inquiry name, status, date)

2. `GET /api/needs-assessments/submissions/:id/crew-conflict-check`
   - Query `ProjectDayOperator` for contributors assigned on that date
   - Return conflicting contributor names/roles

3. `PATCH /api/needs-assessments/submissions/:id/review`
   - Body: `{ review_notes: string, review_checklist_state: object }`
   - Saves fields + sets `reviewed_at = now()`
   - Calls `autoCompleteByName('Review Needs Assessment')`

🛑 STOP — Checkpoint 7A:
> "Before building the frontend Review Panel, I have questions about the smart checklist:
> 1. For date conflict check — should I check against inquiries only, or also projects (once converted)?
> 2. For crew conflict check — which contributor role types should I check? All, or only operators/videographers?
> 3. The manual checklist items (venue feasibility, coverage scope, budget) — should these be hardcoded, or configurable per brand?"

Wait for answers, then proceed.

### 7.2 — Frontend: Review Panel component

Add a review panel section inside `NeedsAssessmentDialog.tsx`:
- Smart checklist (auto items: date clash, crew clash)
- Manual tick items (venue, scope, budget)
- Checklist state persists to `review_checklist_state` — reopening restores previous ticks
- Notes field (saves to `review_notes`)
- "Complete Review" button → calls PATCH endpoint

✅ VERIFY: Open the NA dialog on an inquiry with a submission. The review panel should render with the checklist and notes field.

### 🛑 STOP — Checkpoint 7B

Ask me:
> "NA Review Panel is built and working. Ready for Step 8 (Welcome Pack)?"

---

## ~~STEP 8~~ ✅ COMPLETE — Welcome Pack Feature (Priority 5E, 5F)

> **STATUS: COMPLETE ✅** — All pieces in place: `welcome_sent_at` DB field, `POST /api/inquiries/:id/send-welcome-pack` endpoint, `sendWelcomePack()` service method (sets field + auto-completes task), `welcome_pack` section in portal with `ExpandableCard`, studio "Send Welcome Pack" button in `CommandCenterHeader.tsx` (visible when inquiry is Booked), `api.inquiries.sendWelcomePack()` in api.ts.

### 8.1 — Backend: Add welcome_pack section to portal

**File:** `packages/backend/src/inquiries/client-portal.service.ts`
In `getPortalByToken()`, add a new `welcome_pack` section to the response:
- Gated on `inquiry.welcome_sent_at` being set
- Returns: welcome message (brand default or custom), key contacts, important dates

### 8.2 — Backend: Endpoint to send welcome pack

Add to inquiries controller:
- `POST /api/inquiries/:id/send-welcome-pack`
- Sets `welcome_sent_at = now()` on inquiry
- Calls `autoCompleteByName('Send Welcome Pack')`

### 8.3 — Frontend: Portal welcome pack section

**File:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx`
- Add `welcome_pack` to `PortalData` interface
- New `ExpandableCard` section, visible only when data is present
- Contents: welcome message, key contacts, important dates

### 8.4 — Frontend: "Send Welcome Pack" button on inquiry detail

Add a button to the inquiry detail page (likely near the other action cards) that calls the endpoint from 8.2.

🛑 STOP — Checkpoint 8:
> "Welcome Pack feature is built:
> - Portal section renders when `welcome_sent_at` is set
> - Studio button triggers the send
> - Task auto-completes
>
> Do you want to test the full flow in the browser?"

---

## ~~STEP 9~~ ✅ COMPLETE — Auto-Generate Deposit Invoice (Priority 5B partial)

> **STATUS: COMPLETE ✅** — `autoGenerateDepositInvoice()` method created in `invoices.service.ts`; wired into `contracts.service.ts` `submitSignature()` on `allSigned`.

### 9.1 — Create new method in InvoicesService

**File:** `packages/backend/src/invoices/invoices.service.ts`
New method: `autoGenerateDepositInvoice(inquiryId: number)`
- Find primary estimate for inquiry
- Read `deposit_required`
- If > 0: create invoice with single line item (deposit amount)
- Set status to Sent
- Call `autoCompleteByName('Raise Deposit Invoice')`

### 9.2 — Wire into contract signing

**File:** `packages/backend/src/contracts/contracts.service.ts`
In the `submitSignature()` method, inside the `if (allSigned)` block, after completing "Contract Signed":
- Call `this.invoicesService.autoGenerateDepositInvoice(contract.inquiry_id)`

DI: `ContractsModule` must import `InvoicesModule`.

✅ VERIFY: Compile check passes.

---

## ~~STEP 10~~ ✅ COMPLETE — Update Portal Journey Tracker (Priority 5D)

> **STATUS: COMPLETE ✅** — Journey tracker has all 7 steps: Inquiry Submitted → Estimate Sent → Proposal Sent → Proposal Accepted → Contract Signed → Booking Confirmed → Welcome Pack. Each step has correct done condition, colour, and icon. Casing bug fixed ("Accepted").

### 10.1 — Update journey steps

**File:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx`
Update the journey tracker steps to match the new pipeline flow:
1. Inquiry Submitted
2. Estimate Sent
3. Proposal Sent
4. Proposal Accepted
5. Contract Signed
6. Booking Confirmed
7. Welcome Pack

Each step's green dot logic should check the corresponding section data.

✅ VERIFY: Open the portal for an inquiry. Journey tracker should reflect the new steps.

---

## ~~STEP 11~~ ✅ COMPLETE — Final Verification & Seed Run

> **STATUS: COMPLETE ✅** — DB has 4 stages + 16 tasks with correct names. Both packages compile clean (only pre-existing test errors in backend spec file and intentional stub in `MomentsManagement.tsx`). 5 stale "Requirements Discovery" tasks deleted from existing inquiries. All 16 pipeline tasks confirmed present in inquiry 7 (Emily Thompson).

### 11.1 — Run the task library seed

⚠️ Make sure the backend server is stopped.

```bash
cd packages/backend
npx prisma db seed
```

### 11.2 — Full compile check

```bash
cd packages/backend && npm run build
cd ../frontend && npm run build
```

### 11.3 — Restart and test

Start `pnpm dev` and test the full pipeline on Inquiry 7 (Emily Thompson):

1. Check pipeline renders 4 stages, 16 tasks
2. Check NA dialog has review panel
3. Verify auto-complete hooks fire:
   - Create a calendar DISCOVERY_CALL event → only "Discovery Call Scheduling" completes (not "Discovery Call")
   - Save a discovery questionnaire submission → "Discovery Call" completes
   - Create a quote → "Generate Quote" completes
   - Create a contract from template → "Prepare Contract" completes
   - Create a proposal → "Create & Review Proposal" completes
   - Send proposal → "Send Proposal" completes
4. Check portal renders correctly with journey tracker

### 🛑 STOP — Final Checkpoint

Ask me:
> "Implementation complete. Here's the full status of every task:
> [Table showing each of the 16 tasks and whether its auto-complete is verified working]
>
> What shall we tackle next?"

---

## Reference: File Change Log

Track all files modified during implementation:

| Step | File | Change | Status |
|---|---|---|---|
| 1.1 | `calendar.service.ts` | Remove 'Discovery Call' from double auto-complete | ✅ Done |
| 1.2 | `discovery-questionnaire.service.ts` | Fix task name 'Requirements Discovery' → 'Discovery Call' | ✅ Done |
| 1.3 | `portal/[token]/page.tsx` | Fix casing 'accepted' → 'Accepted' | ✅ Done |
| 2.2 | `moonrise-task-library.ts` | Full rewrite — 4 stages, 16 tasks | ✅ Done |
| 3.1 | `needs-assessments.service.ts` + module | Wire I1 auto-complete | ✅ Done |
| 3.2 | `quotes.service.ts` + module | Wire P1 auto-complete | ✅ Done |
| 3.3 | `contracts.service.ts` + module | Wire P2 + B1 auto-complete | ✅ Done |
| 3.4 | `proposals.service.ts` + module | Wire P3 + P4 + P5 auto-complete | ✅ Done |
| 3.8 | `invoices.service.ts` / `contracts.service.ts` | Wire B2 deposit invoice | ✅ Done |
| 4.2 | `inquiries.service.ts` + module | Wire I3, B3, B4 status hooks | ✅ Done |
| 5.2–5.4 | `constants.ts` | Rewrite TASK_META, TASK_AUTO_COMPLETE, WORKFLOW_PHASES | ✅ Done |
| 6.1–6.2 | `schema.prisma` | Add review fields + welcome_sent_at | ✅ Done |
| 7.1 | `needs-assessments` controller/service | 3 new endpoints | ✅ Done |
| 7.2 | `NeedsAssessmentDialog.tsx` | Review Panel component | ✅ Done |
| 8.1 | `client-portal.service.ts` | Add welcome_pack section | ✅ Done |
| 8.2 | Inquiries controller | Send welcome pack endpoint | ✅ Done |
| 8.3 | `portal/[token]/page.tsx` | Welcome pack ExpandableCard | ✅ Done |
| 8.4 | `CommandCenterHeader.tsx` | Send Welcome Pack button | ✅ Done |
| 9.1 | `invoices.service.ts` | `autoGenerateDepositInvoice()` method | ✅ Done |
| 9.2 | `contracts.service.ts` | Wire deposit invoice into signing flow | ✅ Done |
| 10.1 | `portal/[token]/page.tsx` | Update journey tracker steps | ✅ Done |

---

## Additional Work Completed (Not in Original Plan)

These items were built during implementation sessions and are tracked here for completeness.

| Item | Files Changed | Status |
|---|---|---|
| **NA Package Preview UI** — `PackageScopeCard` in NA wizard shows selected package details | `NeedsAssessmentDialog.tsx` or similar | ✅ Done |
| **Discovery Call Transcript Field** — Expanded `DiscoveryQuestionnaireCard` with transcript paste field | `DiscoveryQuestionnaireCard.tsx`, `DiscoveryQuestionnaireFormDialog.tsx` | ✅ Done |
| **Priority 7A — `inquiry_task_events` DB table** | `schema.prisma` (migration `20260317231053_add_inquiry_task_events`) | ✅ Done |
| **Priority 7B — Emit events from `autoCompleteByName()`** | `inquiry-tasks.service.ts` (uses `$transaction` to atomically update + create event) | ✅ Done |
| **Priority 7 — `getTaskEvents()` service method + `GET :taskId/events` route** | `inquiry-tasks.service.ts`, `inquiry-tasks.controller.ts` | ✅ Done |
| **Priority 7 — `InquiryTaskEvent` type** | `packages/frontend/src/lib/types/domains/sales.ts` | ✅ Done |
| **Priority 7 — `api.inquiryTasks.getEvents()`** | `packages/frontend/src/lib/api.ts` | ✅ Done |
| **Priority 7C — Event history in `GlobalTaskDrawer`** — Collapsible ⚡ bolt panel per task row, lazy-fetches on first expand | `GlobalTaskDrawer.tsx` | ✅ Done |

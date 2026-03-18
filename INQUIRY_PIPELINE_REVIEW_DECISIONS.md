# Inquiry Pipeline Task Review — Decisions Document
> Test case: Inquiry 7 — Emily Thompson | Mar 17 2026
> Status: COMPLETE — all 17 tasks reviewed, implementation plan compiled below

---

## Cross-Cutting UI Feature: Automatic Step Visibility in Pipeline

**Concept:** Many pipeline actions are now fully automated (estimate generation, task auto-completes, status triggers). These should be visible in the pipeline task view so you can see what happened and when — but hidden by default to avoid noise.

**Proposed behaviour:**
- Each pipeline task can have one or more **"automatic steps"** shown beneath it as a collapsible sub-list
- Default state: collapsed (just the task name and status visible)
- Expand toggle: reveals the automatic steps with timestamps and what triggered them
- Visual distinction: automatic steps shown with a different style (e.g. grey, a small lightning bolt icon, "auto" label) vs manual steps
- Examples:
  - "Send Needs Assessment" task → auto step: `✓ Submission received — Mar 8 2026 14:32`
  - "Estimate Preparation" → auto steps: `✓ Auto-generated from Package A selection`, `✓ Sent to client via portal`
  - "Discovery Call Scheduling" → auto step: `✓ Calendar event created — Mar 12 2026, 10:00am`
  - "Proposal Creation" → auto step: `✓ Proposal auto-generated from inquiry data`

**Implementation note:** Automatic steps stored as structured metadata on the task (e.g. a `task_events` JSON field or a related `inquiry_task_events` table with `event_type`, `triggered_by`, `triggered_at`, `description`).

---

## Revised Needs Assessment Stage (was 5 tasks → now 3)

| New # | Task Name | Old Tasks | Hours | Auto-Complete Trigger | Feature Status |
|---|---|---|---|---|---|
| 1 | Send Needs Assessment | was Task 3 | 0.15h | NA submission received (row created in `needs_assessment_submissions` linked to inquiry) | Partially exists — portal link in NeedsAssessmentDialog; needs auto-complete hook |
| 2 | Review Needs Assessment | was Task 4 | 0.25h | "Complete Review" button clicked in NA Review Panel | New feature needed (see spec below) |
| 3 | Qualify & Respond | Tasks 1 + 2 + 5 merged | 0.25h | Inquiry status changes `New` → `Contacted` | Future: email template system with portfolio link picker |

### Removed tasks
- **Initial Inquiry Response** (Task 1) — merged into "Qualify & Respond"
- **Date Availability Check** (Task 2) — merged into "Qualify & Respond" (availability now handled by NA Review Panel checklist)
- **Portfolio Presentation** (Task 5) — merged into "Qualify & Respond" (portfolio links included in the same response email)

---

## Feature Spec: NA Review Panel

**What:** A structured review section inside `NeedsAssessmentDialog` on the inquiry detail page, shown once a submission is linked to the inquiry. Backs the "Review Needs Assessment" task.

**Smart Checklist** (items appear/hide based on what the client submitted in their NA):

| Item | Appears when | Behaviour |
|---|---|---|
| Date availability | `wedding_date` present | AUTO — queries existing inquiries + projects for same `wedding_date`. Shows ✓ (clear) or ⚠ conflict with booking name |
| Venue feasibility | `venue_name` or `venue_lat` present | Manual tick (future: show travel distance from brand home base) |
| Crew availability | `operator_count` or `camera_count` present | AUTO — queries `ProjectDayOperator` for contributors already assigned on that date. Shows conflicts by name |
| Coverage scope achievable | `builder_activities` or `selected_package` present | Manual tick |
| Budget realistic | `budget_range` present | Manual tick (future: compare against estimate when one exists) |

**Notes field:** Freetext — saved as `review_notes` on the `needs_assessment_submissions` record. Scoped to the NA review (not the global inquiry activity log). Visible again later when prepping for discovery call.

**"Complete Review" button:** Saves notes + checklist state, sets `reviewed_at` timestamp on submission, fires `autoCompleteByName('Review Needs Assessment')`.

### New DB fields on `needs_assessment_submissions`
```prisma
review_notes           String?
reviewed_at            DateTime?
review_checklist_state Json?      // persists manual tick state: { venue_feasible: true, scope_ok: false, ... }
```

### New backend endpoints needed
- `GET /api/needs-assessments/submissions/:id/conflict-check` — checks `wedding_date` from submission responses against all existing inquiries + projects (returns any conflicts)
- `GET /api/needs-assessments/submissions/:id/crew-conflict-check` — checks `ProjectDayOperator` for contributors assigned on that date (returns conflicting names/roles)
- `PATCH /api/needs-assessments/submissions/:id/review` — saves `review_notes` + `reviewed_at`, calls `autoCompleteByName`

---

## Feature Spec: Qualify & Respond (email template — future)

**What:** An email template composer on the inquiry page. Pre-fills with client's name, confirms availability, and lets you pick portfolio links to include. Sending the email auto-completes the "Qualify & Respond" task and transitions inquiry status to `Contacted`.

**Trigger for task auto-complete:** Inquiry status transitions `New` → `Contacted` (whether done via email tool or manually).

---

## Estimates Stage → ABSORBED into Needs Assessment Stage

The "Estimates" pipeline stage is removed as a standalone stage. Estimate generation moves into the NA wizard flow.

### Task 6 — Estimate Preparation → AUTO-GENERATED, moves to Needs Assessment stage

- **Decision:** Not a manual task anymore — estimate is auto-generated on NA wizard completion
- **Trigger:** NA wizard `Summary` screen completes (client submits, or studio submits on their behalf)
- **What gets created:** A full `EstimatesCard`-format estimate (line items, tax, payment schedule) auto-populated from:
  - Selected package pricing (if `selected_package` chosen in wizard)
  - Custom builder selections (activity/film pricing — pricing per activity/film to be wired in later)
- **Sent automatically:** Yes — estimate is created AND sent to client immediately on wizard completion, no manual checkpoint
- **Task auto-complete trigger:** Estimate record created and linked to inquiry (status `Sent`)
- **Hours:** 0h — fully automated, no manual work
- **Pipeline stage change:** Moves into Needs Assessment stage as automatic step 4 (after "Qualify & Respond")

### Task 7 — Budget Alignment → REMOVED
- **Decision: REMOVE** — redundant once estimate is auto-sent and call booking is the implicit acceptance signal
- Booking a discovery call (in wizard or manually) already proves the client has seen the estimate and wants to proceed

### New requirement: Package & activity pricing
- Packages need a `price` field (or line-item breakdown) so the wizard can auto-populate the estimate
- Custom builder activities need per-activity pricing so the builder path can also auto-generate an estimate
- This is a **future wiring task** — flag for implementation plan

---

## Discovery Call Stage (renamed to singular "Discovery Call")

### Task 8 — Discovery Call Scheduling → KEEP, existing integration is correct
- **Decision: KEEP** — 0.15h
- **Auto-complete trigger:** `DISCOVERY_CALL` calendar event created (existing behaviour — keep as-is)
- **Note:** Call is typically scheduled at end of NA wizard. If client skips, studio books manually via CallsCard
- **Stage name change:** "Discovery Calls" → "Discovery Call" (singular)

### Task 9 — Discovery Call → KEEP, trigger needs rebuilding
- **Decision: KEEP** — hours reduced from 0.75h → **0.25h** (~20 min call)
- **Auto-complete trigger CHANGED:** Must NOT complete on call scheduling. Completes only when admin adds post-call notes or transcript in the Discovery Questionnaire section
- **Current wrong behaviour:** Completes simultaneously with scheduling via same calendar event trigger
- **Required behaviour:** Completes when a discovery questionnaire submission is saved for this inquiry with notes/transcript content
- **Feature needed — expand existing `DiscoveryQuestionnaireCard`** into a proper post-call notes section:
  - Transcript field (paste text; future: upload)
  - Freeform notes field
  - Save/Submit → auto-completes "Discovery Call" task
  - Supersedes current "Requirements Discovery" auto-complete

---

## Proposal Review Stage → REMOVED ENTIRELY

### Tasks 12 & 13 — Consultation Scheduling + Consultation Meeting → REMOVED
- **Decision: REMOVE BOTH** — client accepts or requests changes directly from the proposal portal viewer; no scheduled consultation call needed
- **Proposal Review stage eliminated** — the `client_response` on the proposal (Accepted / ChangesRequested) is the only signal needed
- `ProposalReviewCard` (calendar event scheduler for PROPOSAL_REVIEW meeting type) can be retired or repurposed

---

## Quotes Stage → KEPT, repositioned BEFORE Proposals

**Stage order change:** Discovery Call → **Quotes** → **Proposals** → Contracts → Booking

The quote must exist before the proposal is created, because the proposal embeds the quote in its pricing section.

### Task 14 — Quote Generation → KEEP as "Generate Quote", own stage
- **Decision: KEEP** — own visible task in the Quotes stage
- **Why it needs to be manual/own step:** Package selections may need adjusting based on discovery call findings before a quote can be accurately generated (e.g. scope changes, upgrade/downgrade). Studio reviews and tweaks the selected package first, then generates the quote.
- **Flow:** Review package selections (on inquiry page) → adjust if needed → create Quote (imported from updated estimate) → quote auto-completes task
- **Auto-complete trigger:** Quote record created and linked to inquiry (any status)
- **Hours:** 0.75h (reviewing, adjusting package, building quote)
- **Auto step shown in pipeline:** `✓ Quote generated from estimate — [timestamp]`

---

## Proposals Stage (revised — quote now feeds into proposal)

### Task 10 — "Create & Review Proposal" (updated spec)
- **Decision: KEEP, RENAME** — "Create & Review Proposal"
- **Hours:** 1.0h
- **Trigger:** Manual — studio clicks "Generate Proposal" when ready (after quote exists)
- **Auto-complete trigger:** Proposal exists in `Draft` status
- **Pre-send review checklist** (new feature — shown inside proposal studio page):
  - ☐ Timeline complete (event days, activities, moments)
  - ☐ Subjects named correctly (bride/groom/wedding party)
  - ☐ Venues/locations attached
  - ☐ Package correct and reflects discovery call findings
  - ☐ Films configured
  - ☐ Quote attached and pricing accurate
  - ☐ Personal message written (hero title stays auto-generated; personal message section is tweaked per client)
  - ☐ Expiration date set
- **Auto step shown in pipeline:** `✓ Proposal auto-generated from inquiry data — [timestamp]`

### Task 11 — "Send Proposal" (updated spec)
- **Decision: KEEP, RENAME**
- **Hours:** 0.15h
- **Auto-complete trigger:** Proposal status → `Sent`
- **What happens:** Proposal (with embedded quote) becomes visible in client portal; client can Accept or Request Changes
- **Auto step shown in pipeline:** `✓ Proposal sent to client — [timestamp]`, `✓ Client response received — [timestamp]` (when client_response set)

---

## Contracts Stage → RESTRUCTURED (kept as own stage, but work moves into Proposals prep)

### Task 15 — Contract Preparation → moves into Proposals stage prep
- **Decision: KEEP but REPOSITION** — contract is prepared during the Proposals stage (before sending), not after
- **Name:** "Prepare Contract"
- **Hours:** 0.5h (auto-generated from template, but clauses may be customised per client — needs to be wired up)
- **Auto-complete trigger:** Contract exists in `Draft` status linked to this inquiry
- **Position:** Step 2 inside the Proposals stage, after Generate Quote, before Create & Review Proposal
- **Feature needed:** Auto-generate contract from template using quote values (service already supports template composition + variable resolution; needs wiring from quote → contract variables)
- **Clause customisation:** Studio can review and edit clauses before sending

### Task 16 — Contract Negotiation → REMOVED, replaced by "Contract Sent" + "Contract Signed"
- **Decision: REMOVE** — negotiation rarely happens; replaced by two cleaner tracking tasks

### New Contracts split across stages

**Contract sent** → part of the **Proposal stage** (auto-sent when client accepts proposal)
**Contract signed** → part of the **Booking stage** (client signs in portal after accepting)

| Task | Stage | Trigger | Hours |
|---|---|---|---|
| **Contract Sent** | Proposal | Auto — when client accepts proposal (`client_response = 'Accepted'`), system auto-sends the pre-prepared contract | 0h — automatic |
| **Contract Signed** | Booking | Auto — when all signers have signed in portal (`status = 'Signed'`) | 0h — automatic |

- **Feature needed:** Hook in `respondToProposal()` (in `proposals.service.ts`) — when `response === 'Accepted'` → find prepared contract (Draft) linked to inquiry → call `ContractsService.sendContract()` → auto-completes "Contract Sent" task
- **Cross-module dependency:** `ProposalsModule` must import `ContractsModule` and inject `ContractsService` (currently no dependency exists)
- **Contract Signed hook:** In `contracts.service.ts` → `submitSignature()` — when `allSigned === true` and contract status becomes `SIGNED`, call `autoCompleteByName('Contract Signed')` (requires injecting `InquiryTasksService`)
- **Portal flow:** Client views proposal → Accepts → System auto-sends contract → Portal advances to signing → Client signs → Booking stage begins
- **Auto steps shown in pipeline:** `✓ Contract sent after proposal acceptance — [timestamp]`, `✓ Contract signed by client — [timestamp]`

---

## FINAL PIPELINE STAGE STRUCTURE

**4 stages, replacing the original 8:**

| # | Stage Name | Was | Phase |
|---|---|---|---|
| 1 | **Inquiry** | Needs Assessment | Inquiry |
| 2 | **Discovery** | Discovery Calls | Inquiry |
| 3 | **Proposal** | Proposals + Quotes + Proposal Review + Contracts (prep only) | Booking |
| 4 | **Booking** | Booking + Contracts (signing) | Booking |

**Removed stages:** Estimates (absorbed into Inquiry/auto), Proposal Review (removed entirely), Contracts (split — prep moves to Proposal stage, signing moves to Booking stage)

---

## Booking Stage — Full Task Breakdown

5 tasks in the Booking stage. One moved from Contracts restructure (Contract Signed), and four cover the original "Booking Confirmation" work.

| # | Task | Hours | Auto-Complete Trigger | Notes |
|---|---|---|---|---|
| B1 | **Contract Signed** | 0h — auto | All signers signed (`status = 'Signed'`). Hook: `contracts.service.ts` → `submitSignature()` | Moved from Contracts restructure |
| B2 | **Raise Deposit Invoice** | 0h — auto | Auto-generated from estimate deposit amount when contract is signed; task completes when invoice `status = 'Sent'` | Through ProjectFlo invoices module |
| B3 | **Block Wedding Date** | 0h — auto | `WEDDING_DAY` calendar event exists for this inquiry | Backend: auto-created when inquiry status → `Booked` |
| B4 | **Confirm Booking** | 0.15h | Inquiry status → `Booked` | Studio changes status; triggers B3 calendar block creation automatically |
| B5 | **Send Welcome Pack** | 0.15h | `welcome_sent_at` set on inquiry | New portal section — spec below |

### Task 17 — Booking Confirmation → SPLIT into B2 + B3 + B4 + B5 (all in Booking stage)
- **Decision: SPLIT** — original 1.5h vague task replaced by 4 focused tasks, all within the Booking stage
- Original task removed; its work is distributed across B2, B3, B4, B5
- B2 (deposit invoice) is fully automatic — auto-generated from estimate deposit data when contract is signed
- B3 (date block) is fully automatic — calendar event auto-created when status → Booked

### Auto-flow when studio clicks "Confirm Booking" (sets status → `Booked`):
1. Backend hook creates `WEDDING_DAY` calendar event for inquiry's `wedding_date`
2. "Block Wedding Date" (B3) auto-completes
3. "Confirm Booking" (B4) auto-completes (status = `Booked`)
4. Studio then manually sends Welcome Pack (B5)

### Feature Spec: Welcome Pack (B5 — new portal feature)

**What:** A dedicated section inside the client portal (`/(portal)/portal/[token]/page.tsx`) that becomes visible/accessible to the client once booking is confirmed.

**Contents (MVP):**
- Welcome message (studio-customisable per inquiry, or uses a brand-level default)
- What to expect next (timeline / steps)
- Key contacts (lead operator, coordinator)
- Important dates (wedding day, any pre-shoots)
- Any documents or links the studio wants to pin here

**Trigger for B4 task auto-complete:** Studio clicks "Send Welcome Pack" button (or a toggle to unlock the section), which sets a `welcome_sent_at` timestamp on the inquiry (or a new `portal_sections` enabled flag). Task auto-completes.

**New field needed on `inquiries`:**
```prisma
welcome_sent_at  DateTime?
```

**Auto step shown in pipeline:** `✓ Welcome pack sent to client — [timestamp]`

---

## IMPLEMENTATION PLAN

> All 17 tasks reviewed. Below is the prioritised build plan — ordered by dependency and impact.
> Revised after codebase critique: corrected priority ordering, fixed hook locations, added missing files.

---

### Priority 1 — Fix Broken Auto-Complete Logic (quick wins, no new features)

These are bugs in the current system. They affect every new inquiry right now.

#### 1A. Fix Discovery Call double auto-complete (backend)
- **File:** `packages/backend/src/calendar/calendar.service.ts`
- **Problem:** Both "Discovery Call Scheduling" and "Discovery Call" complete when a `DISCOVERY_CALL` event is created (line ~85: `name: { in: ['Discovery Call Scheduling', 'Discovery Call'] }`)
- **Fix:** Remove `'Discovery Call'` from the `in` array. Only `'Discovery Call Scheduling'` should auto-complete on calendar event creation. "Discovery Call" will complete from the questionnaire hook (Priority 3).

#### 1B. Fix `TASK_AUTO_COMPLETE` map — wrong triggers (frontend)
- **File:** `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_lib/constants.ts`
- **Fixes needed:**
  - Contract Preparation + Contract Negotiation currently share the same presence check (`contracts.length > 0`) — need split triggers:
    - `Contract Preparation` → `contract.status === 'Draft'` (or any contract exists)
    - `Contract Negotiation` → remove entirely (task being deleted)
  - Add new entries for renamed/new tasks:
    - `Contract Sent` → `contract.status === 'Sent' || contract.status === 'Signed'`
    - `Contract Signed` → `contract.status === 'Signed'`
  - `Proposal Creation` → rename to `Create & Review Proposal`, trigger: proposal exists in any status
  - `Proposal Delivery` → rename to `Send Proposal`, trigger: `proposal.status === 'Sent'` (not just existence)
  - Remove `Budget Alignment` entry (task deleted)
- **Note:** The existing `Estimate Preparation` check is already correct (`status === 'Sent' || status === 'Accepted'`) — no change needed there.

#### 1C. Fix task hours + metadata in `TASK_META` map
- Same file as 1B
- Discovery Call: hours `0.75h` → `0.25h`
- Add entries for new task names: `Qualify & Respond`, `Generate Quote`, `Prepare Contract`, `Create & Review Proposal`, `Send Proposal`, `Contract Sent`, `Contract Signed`, `Raise Deposit Invoice`, `Block Wedding Date`, `Confirm Booking`, `Send Welcome Pack`
- Remove entries for deleted tasks: `Initial Inquiry Response`, `Date Availability Check`, `Portfolio Presentation`, `Budget Alignment`, `Consultation Scheduling`, `Consultation Meeting`, `Contract Negotiation`, `Booking Confirmation`, `Proposal Review Scheduling`, `Proposal Review Call`

#### 1D. Fix portal journey casing bug
- **File:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx` (line ~565)
- **Bug:** `sections.proposal?.data?.client_response === "accepted"` — lowercase `"accepted"`
- **Fix:** Change to `"Accepted"` — the API returns uppercase (`respondToProposal()` stores `"Accepted"`)
- **Impact:** The "Proposal Accepted" journey dot never turns green currently

#### 1E. Update `WORKFLOW_PHASES` legacy constant
- Same file as 1B (`constants.ts`)
- This constant still references old stage names and section IDs: `needs-assessment-section`, `estimates-section`, `proposal-review-section`, `contracts-section`
- Used as fallback in `buildPipelineTasks()` — after stage renames, tasks silently route to wrong sections
- Update to match new 4-stage structure, or remove if truly unused

---

### Priority 2 — Task Library Seed Rebuild

**Must come before Priorities 3 & 4** — the `autoCompleteByName()` calls in those priorities require tasks with the new names to exist in `inquiry_tasks`. Without this seed rebuild, all new hooks silently no-op.

Replaces `moonrise-task-library.ts` PIPELINE_STAGES with the new 4-stage structure.

#### 2A. Stage renames
| Old name | New name |
|---|---|
| Needs Assessment | Inquiry |
| Discovery Calls | Discovery |
| Proposals | Proposal |
| Booking | Booking (unchanged) |
| Estimates | *(removed)* |
| Proposal Review | *(removed)* |
| Contracts | *(split — tasks redistributed)* |
| Quotes | *(absorbed into Proposal stage)* |

#### 2B. Tasks removed from seed
- Initial Inquiry Response
- Date Availability Check
- Portfolio Presentation
- Budget Alignment
- Consultation Scheduling
- Consultation Meeting
- Contract Negotiation
- Booking Confirmation

#### 2C. Tasks added / renamed in seed

**Inquiry stage:**
| Task | Hours | Auto-Complete | Auto-only? |
|---|---|---|---|
| Send Needs Assessment | 0.15h | NA submission received (`needs_assessment_submissions` row created) | No |
| Review Needs Assessment | 0.25h | `reviewed_at` set on submission (via Review Panel) | No |
| Qualify & Respond | 0.25h | Inquiry status `New` → `Contacted` | No |
| *(auto)* Estimate Preparation | 0h | Estimate created + sent on NA wizard completion | **Yes — not manually toggleable** |

**Discovery stage:**
| Task | Hours | Auto-Complete | Auto-only? |
|---|---|---|---|
| Discovery Call Scheduling | 0.15h | `DISCOVERY_CALL` calendar event created | No |
| Discovery Call | 0.25h | Discovery questionnaire saved with notes/transcript | No |

**Proposal stage:**
| Task | Hours | Auto-Complete | Auto-only? |
|---|---|---|---|
| Generate Quote | 0.75h | Quote record created and linked to inquiry | No |
| Prepare Contract | 0.5h | Contract exists in `Draft` status | No |
| Create & Review Proposal | 1.0h | Proposal exists in `Draft` status | No |
| Send Proposal | 0.15h | Proposal status → `Sent` | No |
| *(auto)* Contract Sent | 0h | Client accepts proposal → contract auto-sent (`respondToProposal()` hook) | **Yes — not manually toggleable** |

**Booking stage:**
| Task | Hours | Auto-Complete | Auto-only? |
|---|---|---|---|
| Contract Signed | 0h — auto | All signers signed → contract `status = 'Signed'` (`submitSignature()` hook) | **Yes** |
| Raise Deposit Invoice | 0h — auto | Auto-generated from estimate deposit when contract signed; completes when invoice `status = 'Sent'` | **Yes** |
| Block Wedding Date | 0h — auto | `WEDDING_DAY` calendar event created (auto-generated when status → `Booked`) | **Yes** |
| Confirm Booking | 0.15h | Inquiry status → `Booked` | No |
| Send Welcome Pack | 0.15h | `welcome_sent_at` set on inquiry | No |

#### 2D. Auto-only tasks: UI guard
- Tasks marked "auto-only" should not be manually toggleable in the pipeline UI
- Use `trigger_type` on `task_library` (existing field) to distinguish, or add `is_auto_only Boolean @default(false)` to task_library entries
- Frontend: when rendering a task where `is_auto_only = true` (or equivalent), hide the toggle/checkbox button

#### 2E. Re-run seed / migration script
- Update `moonrise-task-library.ts` with new structure
- Create a migration script to update existing task library records (don't just re-seed, preserve any assigned tasks in live inquiries)
- Add new task_library entries for net-new tasks (Qualify & Respond, Contract Sent, Contract Signed, Raise Deposit Invoice, Block Wedding Date, Confirm Booking, Send Welcome Pack)

---

### Priority 3 — NA Review Panel (new feature, high value, pure backend+modal)

Unlocks the "Review Needs Assessment" task auto-complete and makes the NA genuinely useful.
**Depends on:** Priority 2 (task with name "Review Needs Assessment" must exist in inquiry_tasks).

#### 3A. DB migration — new fields on `needs_assessment_submissions`
```prisma
review_notes           String?
reviewed_at            DateTime?
review_checklist_state Json?      // persists manual tick state: { venue_feasible: true, scope_ok: false, ... }
```
Run: `npx prisma migrate dev --name add-na-review-fields`

#### 3B. New backend endpoints
- `GET /needs-assessments/submissions/:id/conflict-check` — returns date conflicts from existing inquiries/projects
- `GET /needs-assessments/submissions/:id/crew-conflict-check` — returns contributor conflicts for the wedding date
- `PATCH /needs-assessments/submissions/:id/review` — saves `review_notes` + `review_checklist_state` + `reviewed_at`, calls `autoCompleteByName('Review Needs Assessment')`

#### 3C. Frontend — NA Review Panel inside `NeedsAssessmentDialog`
- Smart checklist (auto items: date clash, crew clash; manual: venue, scope, budget)
- Checklist state persisted to `review_checklist_state` — reopening the panel restores previous ticks
- Notes field (saves to `review_notes`)
- "Complete Review" button → calls `PATCH /review` endpoint

---

### Priority 4 — Discovery Call Questionnaire Expansion

Makes the "Discovery Call" task actually completable, and expands the post-call record.
**Depends on:** Priority 2 (task with name "Discovery Call" must exist — it does already, but the seed update ensures naming consistency).

#### 4A. Expand `DiscoveryQuestionnaireCard` (frontend)
- Add transcript field (paste text)
- Add freeform post-call notes field
- Save/Submit → calls backend hook to complete "Discovery Call" task

#### 4B. Update `discovery-questionnaire.service.ts` (backend)
- **Current code** calls `autoCompleteByName(inquiryId, 'Requirements Discovery')` — this is a dead no-op because no task named "Requirements Discovery" exists in the seed (task library has "Discovery Call" instead). It has never worked.
- **Fix:** Replace `'Requirements Discovery'` with `'Discovery Call'` in `createSubmission()`.
- Wire the new post-call notes save to also call `autoCompleteByName('Discovery Call')`.

---

### Priority 5 — Portal Flow: Proposal → Contract → Welcome Pack

Wires the client portal journey to match the new stage structure.

#### 5A. Wire proposal acceptance → auto-send contract (backend)
- **File:** `packages/backend/src/proposals/proposals.service.ts` → `respondToProposal()`
- When `response === 'Accepted'` → find prepared contract (`Draft` status) linked to inquiry → call `ContractsService.sendContract()` → marks "Contract Sent" task complete via `autoCompleteByName('Contract Sent')`
- **Cross-module dependency:** `ProposalsModule` must import `ContractsModule` and `InquiryTasksModule`. Inject `ContractsService` + `InquiryTasksService` into `ProposalsService`. Update `proposals.module.ts` imports array.

#### 5B. Wire contract signing → auto-complete "Contract Signed" + auto-generate deposit invoice (backend)
- **File:** `packages/backend/src/contracts/contracts.service.ts` → `submitSignature()`
- When `allSigned === true` (existing check at ~line 322), after setting contract status to `SIGNED`:
  - Call `autoCompleteByName('Contract Signed')` (requires injecting `InquiryTasksService`)
  - Auto-generate deposit invoice from estimate's `deposit_required` amount → set to `Sent` → call `autoCompleteByName('Raise Deposit Invoice')`
- **Cross-module dependency:** `ContractsModule` must import `InquiryTasksModule` (and `InvoicesModule` if invoice auto-generation is wired here)

#### 5C. Wire "Confirm Booking" status change → auto-create calendar block (backend)
- **Hook location:** Wherever inquiry status changes to `Booked` (likely `inquiries.service.ts` or `inquiries.controller.ts`)
- When status → `Booked`:
  - Auto-create `WEDDING_DAY` calendar event for the inquiry's `wedding_date`
  - Call `autoCompleteByName('Block Wedding Date')`
  - Call `autoCompleteByName('Confirm Booking')`

#### 5D. Ensure portal journey tracker steps match new flow
- **File:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx` (~line 562)
- Current journey steps: Inquiry Submitted → Estimate → Proposal → Contract → Booked
- Updated journey: Inquiry Submitted → Estimate → Proposal Sent → Proposal Accepted → Contract Signed → Booking Confirmed → Welcome Pack
- Each step unlocks the next sequentially (existing sequential tracker via `SectionStatus`, just update step definitions)
- **Fix casing bug** at same time: `client_response === "accepted"` → `"Accepted"` (captured in Priority 1D but lives in same file)

#### 5E. Welcome Pack portal section
- **Backend:** Add `welcome_pack` section to `client-portal.service.ts` → `getPortalByToken()` response `sections` object
  - Gated on `inquiry.welcome_sent_at` being set
  - Returns welcome message, key contacts, important dates (from inquiry data)
- **Frontend:** New `ExpandableCard` in portal viewer, hidden until section data is present
  - Contents: welcome message, key contacts, important dates, any pinned links/documents
- **Studio side:** "Send Welcome Pack" button on inquiry detail page → sets `welcome_sent_at` → auto-completes "Send Welcome Pack" task

#### 5F. New `welcome_sent_at` field on inquiries (DB migration)
```prisma
welcome_sent_at  DateTime?
```
Run: `npx prisma migrate dev --name add-welcome-sent-at`

---

### Priority 6 — Auto-Generate Estimate in NA Wizard

Removes the manual estimate step entirely. **Dependent on pricing fields existing first (6A).**

#### 6A. Prerequisite: Add pricing to packages and activities (DB + UI)
- Packages need a `price` or line-item breakdown field
- Custom builder activities need per-activity pricing
- This likely requires schema changes + package management UI update

#### 6B. Wire estimate auto-generation on NA wizard completion (backend)
- On `needs_assessment_submissions` creation → check if `selected_package` or builder activities present → auto-create estimate from pricing → set estimate `status = 'Sent'` → `autoCompleteByName('Estimate Preparation')`

#### 6C. Auto-complete hook for "Estimate Preparation" task
- Add to `needs-assessments.service.ts` post-create hook

---

### Priority 7 — Automatic Step Visibility (task event log UI)

Makes all the automation visible in the pipeline task view.

#### 7A. New DB table: `inquiry_task_events`
```prisma
model inquiry_task_events {
  id           Int      @id @default(autoincrement())
  task_id      Int
  event_type   String   // e.g. AUTO_COMPLETE, STATUS_CHANGE, NOTE_ADDED
  triggered_by String?  // e.g. CALENDAR_EVENT, PORTAL_SIGNATURE, MANUAL
  description  String
  occurred_at  DateTime @default(now())
  inquiry_task inquiry_tasks @relation(fields: [task_id], references: [id])
}
```

#### 7B. Emit events from all auto-complete hooks (backend)
- Each `autoCompleteByName()` call also inserts an `inquiry_task_events` record

#### 7C. Frontend — collapsible auto-step list on each pipeline task card
- Collapsed by default, expand toggle
- Shows event type, description, timestamp
- Visual style: grey/muted, lightning bolt icon for automated steps

---

### Priority 8 — Email Template System for "Qualify & Respond" (future)

Low urgency — task currently works via manual status change.

#### 8A. Email template composer on inquiry detail page
- Pre-fills name, confirms availability, portfolio link picker
- Send → sets inquiry status `New` → `Contacted` → auto-completes "Qualify & Respond"

---

## Summary: Tasks Removed (8 total)
1. Initial Inquiry Response → merged into "Qualify & Respond"
2. Date Availability Check → merged into "Qualify & Respond" (NA Review Panel handles conflict check)
3. Portfolio Presentation → merged into "Qualify & Respond"
4. Budget Alignment → removed (estimate send + call booking replaces it)
5. Consultation Scheduling → removed (Proposal Review stage eliminated)
6. Consultation Meeting → removed (Proposal Review stage eliminated)
7. Contract Negotiation → removed (replaced by automated tracking tasks)
8. Booking Confirmation → split into B1–B5 (individual Booking stage tasks)

## Summary: Tasks Added (6 total)
1. Qualify & Respond (merges 3 removed tasks)
2. Contract Sent (auto-task, Proposal stage)
3. Contract Signed (auto-task, Booking stage — moved from restructured Contracts)
4. Raise Deposit Invoice (auto-task, Booking stage)
5. Block Wedding Date (auto-task, Booking stage)
6. Send Welcome Pack (Booking stage)

---

## CODEBASE GAP ANALYSIS — Per-Task Readiness

> Audited against the live codebase. For each task: what exists, what's missing, and what blocks it.

### Inquiry Stage

#### I1 — Send Needs Assessment (0.15h, manual)
| Requirement | Status | Detail |
|---|---|---|
| NA template system | **HAVE** | `NeedsAssessmentsService` — templates CRUD, active template per brand |
| NA submission creation | **HAVE** | `createSubmission()` populates inquiry fields from responses |
| Portal NA section | **HAVE** | Client can fill out NA via portal token |
| Portal link copy button | **HAVE** | `NeedsAssessmentDialog` has copy link button |
| Auto-complete hook on submission | **MISSING** | `createSubmission()` doesn't call `autoCompleteByName('Send Needs Assessment')` |
| Email to client with portal link | **MISSING** | No email infrastructure at all |
| **Verdict** | **1 hook to wire** | Works without email — studio copies portal link and sends manually |

#### I2 — Review Needs Assessment (0.25h, manual)
| Requirement | Status | Detail |
|---|---|---|
| NA submission viewer | **HAVE** | `NeedsAssessmentDialog` — categorised 2×2 grid |
| `review_notes` field | **MISSING** | Not in `needs_assessment_submissions` schema |
| `reviewed_at` timestamp | **MISSING** | Not in schema |
| `review_checklist_state` JSON | **MISSING** | Not in schema |
| Smart checklist: date conflicts | **MISSING** | No conflict-check endpoint |
| Smart checklist: crew conflicts | **MISSING** | No crew-conflict-check endpoint |
| Smart checklist: manual ticks | **MISSING** | No venue/scope/budget tick UI |
| `PATCH /review` endpoint | **MISSING** | No review endpoint |
| Auto-complete on review | **MISSING** | No hook |
| **Verdict** | **New feature build** | DB migration + 3 new endpoints + new frontend Review Panel component |

#### I3 — Qualify & Respond (0.25h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Inquiry status field | **HAVE** | `status` on inquiries |
| Status change UI | **HAVE** | Can update inquiry status on detail page |
| Auto-complete on `New` → `Contacted` | **MISSING** | No status-change hook in backend |
| Email template composer | **MISSING** | No email system — future (Priority 8) |
| Portfolio link picker | **MISSING** | No portfolio management |
| **Verdict** | **1 backend hook** | Works via manual status change. Email composer is future nicety, not blocking |

#### I4 — Estimate Preparation (0h, auto-only)
| Requirement | Status | Detail |
|---|---|---|
| Estimate CRUD | **HAVE** | Full create/send/items/milestones |
| Auto-generate estimate from package | **MISSING** | No `autoGenerateFromPackage()` method |
| Package pricing fields | **PARTIAL** | Packages exist but no unit price on activities |
| Auto-send on NA completion | **MISSING** | No hook in NA submission flow |
| `is_auto_only` flag for UI | **MISSING** | Task library has no auto-only concept |
| **Verdict** | **Deferred (Priority 6)** | Depends on package pricing. Manual estimate creation works fine for now |

---

### Discovery Stage

#### D1 — Discovery Call Scheduling (0.15h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Calendar event creation | **HAVE** | `CalendarService.createEvent()` |
| `DISCOVERY_CALL` event type | **HAVE** | Enum value exists |
| CallsCard scheduler UI | **HAVE** | Date/time picker, attendees, meeting link |
| Auto-complete on event creation | **HAVE** | Wired in `calendar.service.ts` |
| **BUG:** Also completes D2 | **BUG** | Same hook marks both "Discovery Call Scheduling" AND "Discovery Call" complete |
| **Verdict** | **1-line bug fix** | Remove `'Discovery Call'` from the `in` array in `createEvent()` |

#### D2 — Discovery Call (0.25h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Discovery questionnaire template | **HAVE** | Templates CRUD |
| Submission with `call_notes` | **HAVE** | `call_notes` field exists on discovery questionnaire submissions |
| Transcript field | **PARTIAL** | No dedicated field — could use `call_notes` or `responses` JSON |
| Post-call notes save | **HAVE** | `createSubmission()` saves call_notes |
| Auto-complete on submission | **BROKEN** | Calls `autoCompleteByName('Requirements Discovery')` — task doesn't exist by that name |
| **Verdict** | **1-line fix** | Change `'Requirements Discovery'` → `'Discovery Call'` in `createSubmission()` |

---

### Proposal Stage

#### P1 — Generate Quote (0.75h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Quotes CRUD | **HAVE** | Full create/edit/items/milestones |
| Import from estimate | **HAVE** | QuotesCard has "Import from Estimate" dropdown |
| Consultation notes field | **HAVE** | On quotes table |
| Auto-complete on quote creation | **MISSING** | `QuotesService.create()` doesn't call `autoCompleteByName` |
| **Verdict** | **1 hook to wire** | Add `autoCompleteByName('Generate Quote')` to `QuotesService.create()` |

#### P2 — Prepare Contract (0.5h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Contract template system | **HAVE** | `contract_templates` + clause categories + variable resolution |
| "Create from Template" button | **HAVE** | `ContractsCard` has it, auto-finds PSA template |
| Template composition | **HAVE** | `composeFromTemplate()` in `ContractsService` |
| Clause customisation UI | **MISSING** | Contract is read-only after compose (stretch goal) |
| Auto-complete on contract Draft | **MISSING** | No hook in `composeFromTemplate()` |
| **Verdict** | **1 hook to wire** | Add `autoCompleteByName('Prepare Contract')` when contract created |

#### P3 — Create & Review Proposal (1.0h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Proposal auto-generation | **HAVE** | `ProposalsService.create()` auto-fills from inquiry + brand |
| "Generate Proposal" button | **HAVE** | `ProposalsCard` has it |
| Proposal editor/preview | **PARTIAL** | Preview via share token link; no in-app editor |
| Pre-send review checklist | **MISSING** | No checklist UI (stretch goal) |
| Auto-complete on proposal Draft | **MISSING** | No hook in `create()` |
| **Verdict** | **1 hook to wire** | Add `autoCompleteByName('Create & Review Proposal')` to `ProposalsService.create()` |

#### P4 — Send Proposal (0.15h, manual)
| Requirement | Status | Detail |
|---|---|---|
| `sendProposal()` method | **HAVE** | Sets status=Sent, sent_at timestamp |
| Client sees proposal in portal | **HAVE** | Portal filters `status IN ['Sent', 'Accepted', 'ChangesRequested']` |
| Email notification to client | **MISSING** | No email — studio shares portal link manually |
| Auto-complete on Sent status | **MISSING** | No hook in `sendProposal()` |
| **Verdict** | **1 hook to wire** | Add `autoCompleteByName('Send Proposal')` to `sendProposal()` |

#### P5 — Contract Sent (0h, auto-only)
| Requirement | Status | Detail |
|---|---|---|
| `respondToProposal()` handler | **HAVE** | Handles Accepted / ChangesRequested |
| Find draft contract for inquiry | **HAVE** | Can query contracts by inquiry_id + status=Draft |
| Auto-send contract on acceptance | **MISSING** | `respondToProposal()` has no contract-sending logic |
| Cross-module DI (Proposals → Contracts) | **MISSING** | `ProposalsModule` doesn't import `ContractsModule` |
| Auto-complete "Contract Sent" | **MISSING** | No hook |
| **Verdict** | **New wiring** | Inject `ContractsService` + `InquiryTasksService` into `ProposalsService`. On acceptance: find Draft contract → `sendContract()` → `autoCompleteByName('Contract Sent')`. Module imports needed. |

---

### Booking Stage

#### B1 — Contract Signed (0h, auto-only)
| Requirement | Status | Detail |
|---|---|---|
| Signing flow | **HAVE** | `submitSignature()` with signer tokens, allSigned check |
| Contract status → SIGNED | **HAVE** | Already sets status when allSigned |
| Auto-complete "Contract Signed" | **MISSING** | No `autoCompleteByName('Contract Signed')` after allSigned block |
| Cross-module DI (Contracts → InquiryTasks) | **MISSING** | Not imported |
| **Verdict** | **1 hook + DI wiring** | Inject `InquiryTasksService`, add call after allSigned check |

#### B2 — Raise Deposit Invoice (0h, auto-only)
| Requirement | Status | Detail |
|---|---|---|
| Invoice CRUD | **HAVE** | Full create/items |
| Estimate `deposit_required` field | **HAVE** | Exists on estimates table |
| Auto-generate deposit invoice from estimate | **MISSING** | No `autoGenerateDepositInvoice()` method |
| Auto-set invoice to Sent | **MISSING** | Need create + mark Sent in one flow |
| Auto-complete task on invoice Sent | **MISSING** | No hook |
| Email invoice to client | **MISSING** | No email — client sees invoice in portal |
| **Verdict** | **New method + hook** | Create `autoGenerateDepositInvoice(inquiryId)` that reads estimate deposit → creates invoice → marks Sent → completes task |

#### B3 — Block Wedding Date (0h, auto-only)
| Requirement | Status | Detail |
|---|---|---|
| `WEDDING_DAY` event type | **HAVE** | Calendar enum has it |
| Auto-create event on status → Booked | **MISSING** | No status-change hook |
| Auto-complete task on event creation | **MISSING** | Calendar hook only handles DISCOVERY_CALL |
| **Verdict** | **New hook** | When inquiry status → Booked, auto-create `WEDDING_DAY` calendar event + `autoCompleteByName('Block Wedding Date')` |

#### B4 — Confirm Booking (0.15h, manual)
| Requirement | Status | Detail |
|---|---|---|
| Inquiry status change to Booked | **HAVE** | Status field exists, can be updated |
| Status change UI | **HAVE** | Can change status on inquiry detail page |
| Auto-complete on status Booked | **MISSING** | No hook |
| **Verdict** | **1 hook** | When status → Booked, call `autoCompleteByName('Confirm Booking')` |

#### B5 — Send Welcome Pack (0.15h, manual)
| Requirement | Status | Detail |
|---|---|---|
| `welcome_sent_at` field | **MISSING** | Not in inquiries schema |
| "Send Welcome Pack" button (studio) | **MISSING** | No UI |
| Welcome Pack portal section | **MISSING** | Portal has no welcome_pack section in `getPortalByToken()` |
| Welcome message content management | **MISSING** | No editor for welcome content |
| Auto-complete on `welcome_sent_at` set | **MISSING** | No hook |
| Email to client | **MISSING** | No email |
| **Verdict** | **Full feature build** | DB migration + backend portal section + frontend portal card + studio button + auto-complete hook |

---

## INFRASTRUCTURE GAPS

### Email System — NOT A BLOCKER

| Finding | Detail |
|---|---|
| **Status** | No email infrastructure exists — no nodemailer, no SendGrid, no SES, no SMTP config, no email templates |
| **Impact** | Every "send" action (NA link, proposal, contract, invoice, welcome pack) has no automated delivery |
| **Current workaround** | All "send" methods already update status + timestamps correctly. Studio copies the portal link and sends it manually via WhatsApp / their own email client. Client portal renders everything. |
| **Recommendation** | Email is a separate initiative. Not required for any pipeline task to function. |

### Status-Change Hook System — NEEDED

| Finding | Detail |
|---|---|
| **Status** | No backend event listener for inquiry status transitions |
| **Impact** | Blocks I3 (Qualify & Respond), B3 (Block Wedding Date), B4 (Confirm Booking) auto-completes |
| **Scope** | Small-medium: add a status-change handler in `InquiriesService.update()` that checks old→new status and fires appropriate hooks |

### Cross-Module DI — NEEDED

| Finding | Detail |
|---|---|
| **Status** | Services are siloed — no cross-module injection for pipeline hooks |
| **Impact** | Blocks P5 (`ProposalsService` needs `ContractsService` + `InquiryTasksService`) and B1 (`ContractsService` needs `InquiryTasksService`) |
| **Scope** | Small: add module imports + constructor injection in 2–3 modules |

### `is_auto_only` Task Flag — NICE TO HAVE

| Finding | Detail |
|---|---|
| **Status** | No concept of auto-only tasks in `task_library` schema |
| **Impact** | Auto-only tasks (I4, P5, B1, B2, B3) show unnecessary manual toggle buttons in pipeline UI |
| **Scope** | Small: add `is_auto_only Boolean @default(false)` to task_library, set on auto tasks, frontend hides toggle |

### `inquiry_task_events` Table — NICE TO HAVE

| Finding | Detail |
|---|---|
| **Status** | No event logging for auto-completes or status changes |
| **Impact** | No audit trail for automated pipeline actions |
| **Scope** | Medium: new table + emit events from every `autoCompleteByName()` call + frontend collapsible log |

---

## WORK BREAKDOWN — What Can Be Built Now vs Later

### Buildable NOW (no new infrastructure needed)

| Category | Items | Tasks unblocked |
|---|---|---|
| **Bug fixes (3)** | Calendar double-complete, discovery questionnaire task name, portal casing bug | D1, D2, portal journey |
| **Auto-complete hooks (~8)** | Add `autoCompleteByName()` calls to existing service methods that already do the work | I1, P1, P2, P3, P4, B1, B4 |
| **Cross-module wiring (2)** | ProposalsModule imports ContractsModule; ContractsModule imports InquiryTasksModule | P5, B1 |
| **Status-change hook (1)** | Listener in `InquiriesService.update()` for old→new status | I3, B3, B4 |
| **Task library seed rebuild (1)** | Rewrite `moonrise-task-library.ts` → 4 stages, 16 tasks | All (correct names needed for hooks to work) |
| **DB migrations (2 small)** | `review_notes` + `reviewed_at` + `review_checklist_state` on NA submissions; `welcome_sent_at` on inquiries | I2, B5 |
| **Frontend constants rewrite (1)** | `TASK_META` + `TASK_AUTO_COMPLETE` + `WORKFLOW_PHASES` in constants.ts | All (correct UI rendering) |

### New Feature Builds (medium effort)

| Feature | Effort | Tasks enabled |
|---|---|---|
| NA Review Panel (endpoints + frontend component) | Medium | I2 |
| Auto-generate deposit invoice method | Small | B2 |
| Welcome Pack (DB + portal section + studio button) | Medium | B5 |

### Future / Nice-to-Have (not needed for pipeline to work)

| Feature | Why it can wait |
|---|---|
| Email integration | Portal link sharing works as workaround |
| Auto-generate estimate from package (I4) | Manual estimate creation works |
| Pre-send proposal review checklist (P3) | Studio reviews manually |
| Contract clause editor (P2) | Template composition works |
| Email template composer (I3) | Manual email/WhatsApp works |
| Task event logging (inquiry_task_events) | Pipeline functions without audit trail |
| `is_auto_only` UI flag | Auto-only tasks still complete correctly, just have extra toggle button |

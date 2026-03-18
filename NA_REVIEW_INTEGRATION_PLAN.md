# Needs Assessment → Inquiry Detail Page Integration Plan

## Problem Statement

The Needs Assessment (NA) review currently lives in two redundant places:
1. **A separate page** (`/inquiries/[id]/needs-assessment`) — broken field mappings, renders raw `venue_lat`, `venue_lng`, empty "Project Scope" section, underscore-separated labels in a catch-all dump.
2. **A fullscreen dialog** (`NeedsAssessmentDialog`) — works correctly with `groupNaResponses()`, but duplicates data that's already visible on the existing cards (event date, venue, package, contact info).

Neither approach connects the NA data to **actionable tasks** on the inquiry page. The reviewer sees data, but can't act on it in context.

## Goal

Eliminate the separate page and dialog. Instead, surface **each piece of NA data directly on the card where it's actionable**. Distribute review checklist items into the cards they relate to, and keep review notes in their own section.

---

## Current Inquiry Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  CommandCenterHeader (contact info, KPIs, "Open Assessment")│
│  PhaseOverview (pipeline task bar)                          │
├──────────────────┬─────────────────────┬────────────────────┤
│ LEFT (md=5)      │ MIDDLE (md=4)       │ RIGHT (md=3)       │
│                  │                     │                     │
│ EventDetailsCard │ CallsCard           │ ContractsCard       │
│ PackageScopeCard │ DiscoveryQuest.Card │ ClientApprovalCard  │
│ EstimatesCard    │ ProposalsCard       │ ActivityLogCard     │
│                  │ ProposalReviewCard  │ ClientUpdatesCard   │
│                  │ QuotesCard          │                     │
└──────────────────┴─────────────────────┴────────────────────┘
```

## NEW Layout After Changes

```
┌─────────────────────────────────────────────────────────────┐
│  CommandCenterHeader (contact, KPIs, special requests strip)│
│  PhaseOverview (pipeline task bar)                          │
├──────────────────┬─────────────────────┬────────────────────┤
│ LEFT (md=5)      │ MIDDLE (md=4)       │ RIGHT (md=3)       │
│                  │                     │                     │
│ EventDetailsCard │ CallsCard           │ ContractsCard       │
│ (+ event_type)   │ (+ call prefs)      │ ClientApprovalCard  │
│                  │                     │                     │
│ ┌──────┬───────┐ │ DiscoveryQuest.Card │ ReviewNotesCard     │
│ │Client│Package│ │ ProposalsCard       │ ActivityLogCard      │
│ │Info  │Scope  │ │ ProposalReviewCard  │ ClientUpdatesCard    │
│ │Card  │Card   │ │ QuotesCard          │                     │
│ └──────┴───────┘ │                     │                     │
│                  │                     │                     │
│ EstimatesCard    │                     │                     │
└──────────────────┴─────────────────────┴────────────────────┘
```

## What the NA Form Actually Captures (response keys)

| Group | Keys |
|-------|------|
| **Contact** | `contact_first_name`, `contact_last_name`, `contact_email`, `contact_phone` |
| **Event** | `event_type`, `wedding_date`, `wedding_date_approx`, `guest_count`, `partner_name` |
| **Venue** | `venue_name`, `venue_details`, `venue_address`, `venue_lat`, `venue_lng` |
| **Package** | `package_path` (pick/build), `selected_package`, `budget_range` |
| **Builder** | `builder_activities`, `builder_films`, `builder_step`, `operator_count`, `camera_count` |
| **Source** | `lead_source`, `lead_source_details` |
| **Special** | `special_requests` |
| **Discovery Call** | `discovery_call_interest`, `discovery_call_date`, `discovery_call_time`, `discovery_call_method` |
| **Internal** | `_builder_initialized` (hidden — never shown) |

---

## Step-by-Step Plan

### Step 1: Enrich Existing Cards with NA Data + New Client Info Card

Each card already receives the `submission` prop. We map the correct NA response keys into each card where they're actionable, and add one new compact card for client/event persona info.

#### 1a. New `ClientInfoCard` + Split Layout
**What:** A new compact card showing the **client & event persona** data — the stuff that doesn't belong on any existing card.
**Position:** Left column, side-by-side with PackageScopeCard in a 2-column sub-grid.
**Contents:**
- `partner_name` (for weddings)
- `guest_count` range
- `special_requests` (free-text, truncated with expand)

> **Note:** `lead_source` stays in the CommandCenterHeader mission control area (top-right KPI strip) where it already lives. Not duplicated here.

**Layout change in the left column:**
```
Left column (md=5):
  EventDetailsCard          ← full width (event_type added here)
  ┌──────────┬──────────┐
  │ClientInfo│PackageScope│  ← 50/50 sub-grid (Grid within Grid)
  │Card      │Card        │
  └──────────┴──────────┘
  EstimatesCard             ← full width
```

**Files:** New `components/ClientInfoCard.tsx`, edit `page.tsx` layout.

#### 1b. EventDetailsCard
**Already has:** Event date, venue with map, ceremony location, inline editing.
**Add:**
- Show `event_type` as a prominent chip/badge at the top of the card (e.g. "🎬 Weddings").
- Show `wedding_date_approx` if no exact `wedding_date` is set (e.g. "Spring 2027").
- Ensure venue reads from `venue_name` + `venue_address` (NA keys), not just `inquiry.venue_details`.
- Add subtle **"Inquiry Source"** label next to fields populated from the submission vs. manually edited.
- **Date conflicts check + calendar lock** — on load, check the calendar for conflicting dates:
  - ✅ **No conflicts:** Show green "No conflicts" badge AND **tentatively lock the date in the calendar** (create a tentative/hold calendar event for this inquiry's event date). Show "Date held ✓".
  - ⚠️ **Conflicts found:** Show warning with conflicting event names. Do NOT auto-lock. Reviewer must manually resolve (reschedule or override). Show "Review needed" action prompt.
  - Uses existing `api.needsAssessmentSubmissions.checkDateConflicts()` for conflict data, plus a new tentative calendar hold via the calendar API.
- **Manual check: "Venue feasibility checked"** — small checkbox at the bottom of the card, persisted via the review API.

**Files:** `components/EventDetailsCard.tsx`

#### 1c. PackageScopeCard
**Already has:** Selected package, tier, crew/equipment cost, task preview.
**Add:**
- Show `package_path` label ("Picked a package" vs "Built custom").
- Show `budget_range` from the NA as context (e.g. "Client budget: £2,000–£3,000").
- If builder path: show summary of `builder_activities` count, `builder_films` types, `operator_count`, `camera_count`.
- **Crew availability check** — show inline: ✅ No crew conflicts / ⚠️ X unavailable. (Moved from old review panel.)
- **Manual checks** at the bottom of the card:
  - ☐ Coverage scope verified
  - ☐ Budget alignment confirmed

**Files:** `components/PackageScopeCard.tsx`

#### 1d. CallsCard
**Already has:** Discovery call scheduling via MeetingScheduler.
**Add:**
- If NA has `discovery_call_interest === 'yes'`:
  - Show an action banner: "Client requested a discovery call" with their preferred method (`discovery_call_method`), date, and time.
  - If no meeting exists yet, highlight this as a **task to do**: "Schedule the discovery call — client wants [Video Call] on [Mar 31, 2026] at [17:30]".
  - If a meeting already exists matching the NA preference, show a green check: "Discovery call scheduled ✓".
- If `discovery_call_interest === 'no'`, show muted note: "Client declined a discovery call".

**Files:** `_detail/_components/CallsCard.tsx`

---

### Step 2: Review Notes Card (Right Column)

Instead of a full "Assessment Review" card, we distribute the smart checks and manual checklist into EventDetailsCard and PackageScopeCard (where they're actionable — see 1b and 1c above). What remains is **review notes** — the free-text area for reviewer commentary.

#### New: `ReviewNotesCard`
**Position:** Right column, inserted above ActivityLogCard.
**Contents:**
- **Status banner:** "Inquiry Received" (green) with submitted date, or "Awaiting Response" (amber) if no submission yet.
- **Review notes:** Textarea for free-form notes about the inquiry.
- **"Complete Review" button** — calls existing `api.needsAssessmentSubmissions.review()` to save notes + mark reviewed.
- **Portal link:** Small "Copy client portal link" button.
- **Expandable raw data:** Collapsible "View all responses" accordion for reference (uses `groupNaResponses` + `fmtVal`).

This is deliberately slim — the bulk of the review actions (conflict checks, manual checklists) now live on EventDetailsCard and PackageScopeCard where they have context.

**Files:** New file `_detail/_components/ReviewNotesCard.tsx`

---

### Step 3: Update Page Layout

#### 3a. Left column sub-grid for ClientInfoCard + PackageScopeCard

```tsx
{/* LEFT COLUMN */}
<Grid item xs={12} md={5}>
    <Stack spacing={3}>
        <EventDetailsCard ... />

        {/* Two-column sub-grid: Client Info | Package Scope */}
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <ClientInfoCard
                    inquiry={inquiry}
                    submission={needsAssessmentSubmission}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <PackageScopeCard ... />
            </Grid>
        </Grid>

        <EstimatesCard ... />
    </Stack>
</Grid>
```

#### 3b. Right column with ReviewNotesCard

```tsx
{/* RIGHT COLUMN */}
<Grid item xs={12} md={3}>
    <Stack spacing={3}>
        <ContractsCard ... />
        <ClientApprovalCard ... />
        <ReviewNotesCard
            inquiry={inquiry}
            submission={needsAssessmentSubmission}
            onRefresh={handleRefresh}
        />
        <ActivityLogCard ... />
        <ClientUpdatesCard ... />
    </Stack>
</Grid>
```

#### 3c. Remove NeedsAssessmentDialog usage
- Remove `naDialogOpen` state and `NeedsAssessmentDialog` component from `page.tsx`.
- Remove `onOpenAssessment` prop from `CommandCenterHeader`.
- Remove the "Open Assessment" button from `CommandCenterHeader`.

#### 3d. CommandCenterHeader cleanup
- Remove "Open Assessment" button.
- Keep lead_source display as-is (it already works).
- Special requests strip removed from header (it's now on ClientInfoCard).

**Files:** `page.tsx`, `CommandCenterHeader.tsx`

---

### Step 4: Update NA_CATEGORIES for Accurate Grouping

Fix the `NA_CATEGORIES` constant so the "View all responses" accordion in `ReviewNotesCard` groups fields correctly.

```ts
export const NA_CATEGORIES: NaCategory[] = [
    {
        label: 'Contact',
        keys: ['contact_first_name', 'contact_last_name', 'contact_email', 'contact_phone'],
    },
    {
        label: 'Event',
        keys: ['event_type', 'wedding_date', 'wedding_date_approx', 'guest_count', 'partner_name',
               'is_birthday_person', 'birthday_person_name', 'birthday_relation'],
    },
    {
        label: 'Venue',
        keys: ['venue_name', 'venue_details', 'venue_address'],
    },
    {
        label: 'Package',
        keys: ['package_path', 'selected_package', 'budget_range',
               'builder_activities', 'builder_films', 'operator_count', 'camera_count'],
    },
    {
        label: 'Discovery Call',
        keys: ['discovery_call_interest', 'discovery_call_date', 'discovery_call_time', 'discovery_call_method'],
    },
    {
        label: 'Source',
        keys: ['lead_source', 'lead_source_details'],
    },
    {
        label: 'Notes',
        keys: ['special_requests', 'notes', 'additional_notes'],
    },
];
```

**Hidden keys** (never displayed in "Other"): `venue_lat`, `venue_lng`, `_builder_initialized`, `builder_step`.

**Files:** `_detail/_lib/constants.ts`

---

### Step 5: Clean Up Dead Code

1. **Delete** `inquiries/[id]/needs-assessment/page.tsx` — the separate route page with broken field mappings.
2. **Delete** `_detail/_components/NeedsAssessmentDialog.tsx` — replaced by distributed card integration + ReviewNotesCard.
3. **Remove** `NeedsAssessmentDialog` from `_detail/_components/index.ts` barrel export.
4. **Remove** `NeedsAssessmentDialog` import and usage from `page.tsx`.

**Files:** Multiple cleanup targets.

---

## Where Each Review Action Now Lives

| Review Action | Old Location | New Location | Why |
|--------------|-------------|-------------|-----|
| Date conflicts check | NeedsAssessmentDialog | **EventDetailsCard** (inline under date) | Date conflicts are about the event date — that's this card |
| Crew availability check | NeedsAssessmentDialog | **PackageScopeCard** (inline under crew/package) | Crew conflicts relate to the team assigned to the package |
| ☐ Venue feasibility | NeedsAssessmentDialog | **EventDetailsCard** (bottom checkbox) | Venue is on this card |
| ☐ Coverage scope verified | NeedsAssessmentDialog | **PackageScopeCard** (bottom checkbox) | Scope is on this card |
| ☐ Budget alignment | NeedsAssessmentDialog | **PackageScopeCard** (bottom checkbox) | Budget is on this card |
| Review notes textarea | NeedsAssessmentDialog | **ReviewNotesCard** (right column) | Notes are standalone — no specific card context |
| "Complete Review" button | NeedsAssessmentDialog | **ReviewNotesCard** | Saves checklist state + notes together |
| Portal link copy | NeedsAssessmentDialog | **ReviewNotesCard** | Utility action, not card-specific |
| Full response data view | NeedsAssessmentDialog | **ReviewNotesCard** (collapsible accordion) | Reference only — not primary interface |

---

## Summary of Changes by File

| File | Action | What Changes |
|------|--------|-------------|
| `ClientInfoCard.tsx` | **Create** | New card: partner name, guest count, special requests, lead source. |
| `EventDetailsCard.tsx` | **Edit** | Add event_type badge, wedding_date_approx, "Inquiry Source" labels, date conflicts inline, venue feasibility checkbox. |
| `PackageScopeCard.tsx` | **Edit** | Add package_path, budget_range, builder summary, crew conflicts inline, coverage scope + budget alignment checkboxes. |
| `CallsCard.tsx` | **Edit** | Add discovery call preference banner with actionable scheduling prompt. |
| `ReviewNotesCard.tsx` | **Create** | New card: "Inquiry Received" status, review notes, complete review button, portal link, collapsible raw data. |
| `CommandCenterHeader.tsx` | **Edit** | Remove "Open Assessment" button. |
| `_detail/_components/index.ts` | **Edit** | Export ReviewNotesCard, remove NeedsAssessmentDialog. |
| `_detail/_lib/constants.ts` | **Edit** | Fix NA_CATEGORIES to match actual form keys + add hidden keys list. |
| `page.tsx` | **Edit** | Add ClientInfoCard + sub-grid layout, add ReviewNotesCard to right column, remove dialog. |
| `NeedsAssessmentDialog.tsx` | **Delete** | Replaced by distributed card integration. |
| `needs-assessment/page.tsx` | **Delete** | Separate route eliminated. |

---

## Implementation Order

1. **Step 4** first — fix `NA_CATEGORIES` (quick, unblocks correct grouping).
2. **Step 1a** — create `ClientInfoCard` (new, self-contained).
3. **Step 2** — create `ReviewNotesCard` (new, self-contained).
4. **Step 1b** — enrich `EventDetailsCard` (event_type, date conflicts, venue check).
5. **Step 1c** — enrich `PackageScopeCard` (budget, builder, crew conflicts, checkboxes).
6. **Step 1d** — enrich `CallsCard` (discovery call preferences).
7. **Step 3** — wire everything into `page.tsx` (layout changes, remove dialog).
8. **Step 5** — delete dead code last (safe to do after everything works).

---

## UX Principles

- **Data goes where it's actionable.** Venue on the map card. Package on the scope card. Call scheduling on the calls card.
- **No duplicate displays.** Each piece of NA data appears in exactly one place.
- **"Inquiry Source" distinction.** Subtle source labels let the reviewer know which fields came from the client's form vs. manual entry. We call it "Inquiry Source" — not "NA source."
- **Review checks live on their target card.** Venue feasibility checkbox is on the venue card. Budget alignment is on the package card. You check the box right where you can see the data.
- **Notes stay separate.** Free-text review commentary has its own slim card since it doesn't belong to any specific data domain.
- **Raw data is available on demand.** A collapsible accordion in ReviewNotesCard lets you see everything if needed, but it's not the primary interface.

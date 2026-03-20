# Proposal ↔ Client Portal Merge Plan

## Problem Statement

Clients currently experience **three disconnected pages** when interacting with their project:

| Page | Route | Token | Purpose |
|------|-------|-------|---------|
| Client Portal | `/portal/[token]` | `portal_token` (on `inquiries`) | Dashboard: questionnaire, package, estimate, proposal (summary card only), contract (summary), invoices, welcome pack |
| Proposal Viewer | `/proposals/[token]` | `share_token` (on `proposals`) | Full immersive proposal viewing + accept/reject |
| Contract Signing | `/sign/[token]` | `signing_token` (on `contracts`) | eSigning flow |

**Issues:**
1. **Fractured UX** — Client clicks portal link, sees a summary card, then gets redirected to a *different* page (`/proposals/[token]`) to view the actual proposal. Then gets sent to yet another page (`/sign/[token]`) to sign a contract.
2. **Two token systems** — `portal_token` for the dashboard, `share_token` for proposals. Admin must manage both; links are confusing.
3. **Massive code duplication** — Theme system (`getThemeColors()`), keyframe animations (7 animations), `useReveal()` hook, date/currency formatting, and type definitions are independently reimplemented in each page file.
4. **Inconsistent data fetching** — Portal endpoint returns minimal proposal summary; proposal endpoint returns full inquiry/schedule data. Similar data, different shapes.
5. **Settings fragmentation** — Portal settings have their own tab, proposal settings have their own sub-tab, but they should be one unified experience.

---

## Goal

**One portal, one token, one experience.** The client portal becomes the single destination. Proposal viewing and contract signing are embedded *inside* the portal as expandable sections or in-page views — no more redirects to separate pages.

---

## Architecture Overview (Target State)

```
Client receives ONE link: /portal/{portal_token}
                │
                ▼
┌──────────────────────────────────────────────────┐
│            Unified Client Portal                  │
│  /portal/[token]                                  │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────────────┐  Phase-gated sections:    │
│  │ 1. Questionnaire    │  ✅ Existing (keep as-is) │
│  ├─────────────────────┤                           │
│  │ 2. Package Selection│  ✅ Existing (keep as-is) │
│  ├─────────────────────┤                           │
│  │ 3. Estimate Review  │  ✅ Existing (keep as-is) │
│  ├─────────────────────┤                           │
│  │ 4. PROPOSAL         │  🔀 MERGED: Full proposal │
│  │    (full render)     │  rendered inline with     │
│  │    Accept / Request  │  accept/reject buttons    │
│  │    Changes buttons   │  (was separate page)      │
│  ├─────────────────────┤                           │
│  │ 5. CONTRACT SIGNING │  🔀 MERGED: Inline signing│
│  │    (embedded)        │  experience (was separate  │
│  │                      │  /sign/[token] page)      │
│  ├─────────────────────┤                           │
│  │ 6. Invoices         │  ✅ Existing (keep as-is) │
│  ├─────────────────────┤                           │
│  │ 7. Welcome Pack     │  ✅ Existing (keep as-is) │
│  └─────────────────────┘                           │
└──────────────────────────────────────────────────┘
```

---

## 🚫 Exclusion Zone — Needs Assessment / Inquiry Wizard

**The Needs Assessment Wizard is OFF-LIMITS for this merge.** It has its own independent design system and must not be touched.

The wizard shares animation *names* (`fadeInUp`, `fadeIn`, `scaleIn`, `shimmer`, `float`, etc.) and patterns (`useReveal()`, `formatDate()`) with the portal/proposal pages, but they are **completely independent copies** — no imports are shared between them. The wizard's visual design is finalized and loved. Do not refactor it to use the new shared portal utilities.

### Protected files (DO NOT MODIFY):

| File | Why |
|------|-----|
| `(studio)/sales/needs-assessment/page.tsx` | The 18-screen studio wizard — the crown jewel |
| `(studio)/sales/needs-assessment/animations.ts` | Wizard's own animation definitions (14 keyframes) |
| `(studio)/sales/needs-assessment/constants.ts` | Color palette, glass-morphism configs |
| `(studio)/sales/needs-assessment/types.ts` | Wizard-specific types (`ScreenId`, `EventTypeConfig`, etc.) |
| `(studio)/sales/needs-assessment/utils.ts` | Screen computation helpers, currency utils |
| `(studio)/sales/needs-assessment/_components/Shared.tsx` | Reusable wizard sub-components |
| `(studio)/sales/needs-assessment/_components/screens/*.tsx` | All 18 screen components |
| `(portal)/needs-assessment/[token]/page.tsx` | Public client-facing questionnaire form |
| `(portal)/needs-assessment/preview/` | Staff preview of public form |
| `(studio)/sales/inquiries/[id]/needs-assessment/page.tsx` | Staff review of submitted assessment |
| `(studio)/sales/inquiries/[id]/_detail/_components/NeedsAssessmentDialog.tsx` | Assessment management dialog |
| `src/lib/types/domains/needs-assessment.ts` | Wizard domain types |

### Rules for all phases:

1. **Never import from `src/lib/portal/`** in any needs-assessment file — the wizard keeps its own animations, constants, and formatting.
2. **Never modify** the wizard's local `animations.ts`, `constants.ts`, `types.ts`, `utils.ts`, or `Shared.tsx`.
3. **If a shared util has the same name** as a wizard local (e.g., both define `fadeInUp`), they remain independent — the wizard's version may have different timing curves, easing, or duration values.
4. **The public needs-assessment page** (`(portal)/needs-assessment/[token]/page.tsx`) keeps its own inline `useReveal()` and animations. It is not part of the portal merge.
5. **Portal page's questionnaire section** (the `ExpandableCard` for "Your Questionnaire") continues to link out to the needs-assessment page — do NOT embed the wizard inside the portal.

---

## Phases

### Phase 1 — Extract Shared Portal Utilities

**Goal:** Eliminate code duplication by extracting shared code into reusable modules. This is foundational work that every subsequent phase depends on.

> ⚠️ **Scope: portal + proposal pages ONLY.** Do not touch needs-assessment files. See Exclusion Zone above.

#### 1.1 Create shared theme module
- **New file:** `packages/frontend/src/lib/portal/themes.ts`
- Extract `getThemeColors(themeName)` into a single source of truth
- Merge the two existing implementations (portal page + proposal page) — they're functionally identical
- Export the `PortalThemeColors` type

#### 1.2 Create shared animations module
- **New file:** `packages/frontend/src/lib/portal/animations.ts`
- Extract all 7 keyframe animations: `fadeInUp`, `fadeIn`, `scaleIn`, `shimmer`, `float`, `pulseGlow`, `gradientShift`
- Extract `useReveal()` hook (scroll-based reveal)
- Export as named constants + hook

#### 1.3 Create shared formatting utilities
- **New file:** `packages/frontend/src/lib/portal/formatting.ts`
- Extract `formatDate(dateStr, opts?)` and `formatCurrency(amount, currency?)`
- Both pages have identical implementations — deduplicate

#### 1.4 Consolidate portal types
- **New file:** `packages/frontend/src/lib/types/domains/portal.ts`
- Unify duplicated types: `PublicBrand`/`PortalBrand` → `PortalBrand`
- Unify `PublicEstimate`/`EstimateData` → `PortalEstimate`
- Unify `PublicProposal` → fold into existing `Proposal` domain type
- Keep domain-specific types (`PortalSection`, `PortalData`) in this file

#### 1.5 Create barrel export
- **New file:** `packages/frontend/src/lib/portal/index.ts`
- Re-export themes, animations, formatting for clean imports

**Files modified (ONLY these 2 pages — nothing else):**
- `packages/frontend/src/app/(portal)/portal/[token]/page.tsx` — replace inline utils with imports
- `packages/frontend/src/app/(portal)/proposals/[token]/page.tsx` — replace inline utils with imports

**Files NOT modified (Inquiry Wizard exclusion):**
- ❌ `packages/frontend/src/app/(portal)/needs-assessment/[token]/page.tsx` — keeps its own inline animations/hooks
- ❌ `packages/frontend/src/app/(studio)/sales/needs-assessment/*` — keeps its dedicated design system

**Verification:** Both portal/proposal pages render identically after refactor. Needs-assessment wizard renders identically with zero changes (sanity check).

---

### Phase 2 — Extract Proposal Section Renderer Component

**Goal:** Turn the full proposal rendering logic (currently hardcoded in the standalone proposal page) into a reusable component that can be embedded in the portal.

#### 2.1 Create ProposalRenderer component
- **New file:** `packages/frontend/src/app/(portal)/_components/ProposalRenderer.tsx`
- Extract from `proposals/[token]/page.tsx`:
  - The section-by-section rendering logic (hero, text, pricing, event-details, package-details, schedule, subjects, locations, films, crew, equipment, media, terms)
  - The section layout container (scroll snapping, reveal animations)
- **Props interface:**
  ```typescript
  interface ProposalRendererProps {
    proposal: ProposalContent;
    inquiry: PortalInquiry;
    brand: PortalBrand;
    estimate?: PortalEstimate;
    colors: PortalThemeColors;
    onAccept?: () => void;
    onRequestChanges?: (message: string) => void;
    clientResponse?: string | null;
    clientResponseAt?: string | null;
    clientResponseMessage?: string | null;
  }
  ```

#### 2.2 Create ProposalAcceptanceBar component
- **New file:** `packages/frontend/src/app/(portal)/_components/ProposalAcceptanceBar.tsx`
- Extract the accept/request-changes modal + buttons from the proposal page
- Sticky bottom bar with "Accept Proposal" and "Request Changes" CTAs
- Handles the response modal (text input for changes)
- Calls `onAccept` / `onRequestChanges` callbacks

#### 2.3 Refactor standalone proposal page to use components
- **Modify:** `packages/frontend/src/app/(portal)/proposals/[token]/page.tsx`
- Replace inline rendering with `<ProposalRenderer />` + `<ProposalAcceptanceBar />`
- Page becomes a thin data-fetching wrapper
- **Standalone page still works** (backward compatible — existing share links don't break)

**Verification:** Standalone proposal page renders identically after refactor.

---

### Phase 3 — Enrich Portal Backend to Include Full Proposal Data

**Goal:** The portal endpoint currently returns only a summary (`proposal_status`, `share_token`, `client_response`). It needs to return the full proposal content + related inquiry data so the portal can render the proposal inline.

#### 3.1 Expand ClientPortalService.getPortalByToken()
- **Modify:** `packages/backend/src/inquiries/client-portal.service.ts`
- When a proposal exists and is in `Sent` or `Accepted` status, include:
  - `proposal.content` (the full JSON sections)
  - `proposal.title`
  - `proposal.client_response`, `client_response_at`, `client_response_message`
  - Related schedule data: `inquiry.schedule_event_days` (with activities, moments, subjects, location_slots)
  - Related films: `inquiry.schedule_films`
  - Selected package details (already partially included)
- Shape the response under `sections.proposal.data` so the frontend can pass it directly to `<ProposalRenderer />`

#### 3.2 Update proposal section gating
- **Modify:** `packages/backend/src/inquiries/client-portal.service.ts`
- Current gating: proposal section status is `'available'` when a sent proposal exists
- Add new status: `'review_pending'` (sent but not responded), `'accepted'`, `'changes_requested'`
- This gives the frontend enough info to show the right UI state

#### 3.3 Add proposal response endpoint to portal controller
- **Modify:** `packages/backend/src/inquiries/public-client-portal.controller.ts`
- Add: `POST /api/client-portal/:token/proposal-respond`
- Body: `{ response: 'Accepted' | 'ChangesRequested', message?: string }`
- Internally calls existing `ProposalsService.respondToProposal()` — reuse, don't duplicate
- This lets the portal page handle proposal acceptance without needing the proposal's `share_token`

#### 3.4 Wire ProposalsService into inquiries module
- **Modify:** `packages/backend/src/inquiries/inquiries.module.ts`
- Import `ProposalsModule` (or just `ProposalsService`) so the portal controller can delegate to it

**Verification:** `GET /api/client-portal/:token` returns full proposal content when available. `POST /api/client-portal/:token/proposal-respond` works correctly.

---

### Phase 4 — Embed Full Proposal in Portal Page

**Goal:** Replace the proposal summary card with an expandable full proposal view using the `<ProposalRenderer />` component from Phase 2.

#### 4.1 Update portal frontend types
- **Modify:** `packages/frontend/src/lib/types/domains/portal.ts` (from Phase 1)
- Add the enriched proposal section type matching Phase 3's backend response
- Include `ProposalContent`, schedule, films in the portal data type

#### 4.2 Add portal proposal response API method
- **Modify:** `packages/frontend/src/lib/api.ts`
- Add to `clientPortal`:
  ```typescript
  respondToProposal(token: string, response: string, message?: string)
  // POST /api/client-portal/:token/proposal-respond
  ```

#### 4.3 Replace proposal ExpandableCard with inline renderer
- **Modify:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx`
- Replace the current proposal `<ExpandableCard>` (which just links out) with:
  - When collapsed: Status summary card with "View Proposal" expand button
  - When expanded: Full `<ProposalRenderer>` + `<ProposalAcceptanceBar>` embedded inline
- Remove the `ActionLink` to `/proposals/[share_token]` — the proposal is now visible right here
- Wire accept/reject to `api.clientPortal.respondToProposal(token, ...)`
- On successful response, refresh portal data to update status chips and unlock contract section

#### 4.4 Auto-scroll to proposal section
- When client arrives at portal and proposal is in `review_pending` status, auto-scroll to the proposal section with a subtle highlight animation

**Verification:** Full proposal renders inside portal. Accept/reject flow works end-to-end. Portal data refreshes after response. Contract section unlocks after acceptance.

---

### Phase 5 — Embed Contract Signing in Portal (Optional Enhancement)

**Goal:** Remove the redirect to `/sign/[token]` by embedding the contract signing experience inside the portal. This phase is optional but completes the "one portal" vision.

#### 5.1 Evaluate contract signing complexity
- Read `packages/frontend/src/app/(portal)/sign/[token]/page.tsx`
- Determine if the signing flow (signature capture, field completion) can be extracted into a component
- If the signing page uses third-party iframe embeds (e.g., DocuSign, HelloSign), embedding may not be possible — in that case, keep the redirect but style the signing page to match the portal theme

#### 5.2 Create ContractSigningRenderer component (if feasible)
- **New file:** `packages/frontend/src/app/(portal)/_components/ContractSigningRenderer.tsx`
- Extract signing UI from the sign page
- Embed in portal's contract section

#### 5.3 Expand portal backend for contract data
- **Modify:** `packages/backend/src/inquiries/client-portal.service.ts`
- Include full contract content (clauses, fields, signing status) in `sections.contract.data`

#### 5.4 Update portal page contract section
- **Modify:** `packages/frontend/src/app/(portal)/portal/[token]/page.tsx`
- Replace contract summary card with embedded signing experience

**Verification:** Contract viewing and signing works without leaving the portal.

---

### Phase 6 — Deprecate Standalone Pages & Cleanup

**Goal:** Sunset the standalone proposal page and (optionally) the standalone sign page once the portal handles everything.

#### 6.1 Add redirect from standalone to portal
- **Modify:** `packages/frontend/src/app/(portal)/proposals/[token]/page.tsx`
- Keep the page functional (backward compatibility for existing links)
- Add a banner: "This proposal is also available in your Client Portal" with link
- OR: configure Next.js redirect from `/proposals/[token]` → `/portal/[portal_token]#proposal`
  - This requires a backend lookup: share_token → inquiry → portal_token
  - Add: `GET /api/proposals/share/:token/portal-redirect` that returns the portal URL

#### 6.2 Remove proposal share_token generation from admin flow
- **Modify:** `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_components/ProposalsCard.tsx`
- Change "Preview" button to open the portal with `#proposal` anchor instead of generating a separate share link
- Portal token is the canonical link — no more share_token generation needed for new proposals

#### 6.3 Unify admin UI
- **Modify:** `packages/frontend/src/app/(studio)/settings/_components/ClientPortalSettings.tsx`
- Merge proposal settings into the portal design tab (since proposal rendering now lives inside the portal)
- Portal theme = proposal theme (one theme, not two)

#### 6.4 Clean up dead code
- Remove inline theme/animation/formatting code from both pages (replaced by shared modules in Phase 1)
- Remove redundant type definitions
- Remove `publicProposals.getByShareToken()` API method if standalone page is fully redirected
- Update API exports (`proposalsService`, `publicProposalsService`)

#### 6.5 Update documentation
- Update `PRICING_TOTALS_REFERENCE.md` portal/proposal references
- Update `README.md` portal routes
- Update copilot instructions to reflect merged architecture

---

## Migration Safety

### Backward Compatibility
- **Existing share links (`/proposals/[token]`)** continue to work throughout all phases. Phase 6 adds an optional redirect but doesn't break them.
- **Existing portal links (`/portal/[token]`)** work at every phase — the portal only gains features, never loses them.
- **Contract signing links (`/sign/[token]`)** are unchanged until Phase 5 (optional).

### Database Changes
- **No schema migration required** for Phases 1–4. The `portal_token` and `share_token` fields both remain.
- Phase 6 may eventually deprecate `share_token` generation for *new* proposals but the column stays for existing records.

### Rollback Strategy
- Each phase is independently deployable and reversible.
- Phase 1 (shared utils) has zero behavior change.
- Phase 2 (component extraction) has zero behavior change.
- Phase 3 (backend enrichment) only adds data to existing response — non-breaking.
- Phase 4 (portal embedding) can be feature-flagged via portal section settings.

---

## File Impact Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `packages/frontend/src/lib/portal/themes.ts` | 1 | Shared theme colors |
| `packages/frontend/src/lib/portal/animations.ts` | 1 | Shared animations + useReveal |
| `packages/frontend/src/lib/portal/formatting.ts` | 1 | Shared date/currency formatting |
| `packages/frontend/src/lib/portal/index.ts` | 1 | Barrel export |
| `packages/frontend/src/lib/types/domains/portal.ts` | 1 | Consolidated portal types |
| `packages/frontend/src/app/(portal)/_components/ProposalRenderer.tsx` | 2 | Reusable proposal section renderer |
| `packages/frontend/src/app/(portal)/_components/ProposalAcceptanceBar.tsx` | 2 | Accept/reject CTA component |
| `packages/frontend/src/app/(portal)/_components/ContractSigningRenderer.tsx` | 5 | Embedded contract signing (optional) |

### Modified Files

| File | Phase | Change |
|------|-------|--------|
| `packages/frontend/src/app/(portal)/portal/[token]/page.tsx` | 1, 4 | Import shared utils → embed proposal renderer |
| `packages/frontend/src/app/(portal)/proposals/[token]/page.tsx` | 1, 2, 6 | Import shared utils → use extracted components → add redirect |
| `packages/backend/src/inquiries/client-portal.service.ts` | 3 | Return full proposal content + schedule data |
| `packages/backend/src/inquiries/public-client-portal.controller.ts` | 3 | Add proposal-respond endpoint |
| `packages/backend/src/inquiries/inquiries.module.ts` | 3 | Import ProposalsModule |
| `packages/frontend/src/lib/api.ts` | 4 | Add `clientPortal.respondToProposal()` |
| `packages/frontend/src/app/(studio)/sales/inquiries/[id]/_detail/_components/ProposalsCard.tsx` | 6 | Use portal link instead of share link |
| `packages/frontend/src/app/(studio)/settings/_components/ClientPortalSettings.tsx` | 6 | Merge proposal settings into portal |

---

## Execution Order & Dependencies

```
Phase 1 (shared utils)  ─────────► Phase 2 (extract components)
                                         │
                                         ▼
Phase 3 (backend enrichment) ────► Phase 4 (embed in portal)
                                         │
                                         ▼
                                   Phase 5 (embed contract — optional)
                                         │
                                         ▼
                                   Phase 6 (deprecate & cleanup)
```

- **Phases 1 and 3 can run in parallel** (frontend shared utils + backend enrichment are independent).
- **Phase 2 depends on Phase 1** (components use shared utils).
- **Phase 4 depends on Phases 2 + 3** (needs both the component and the enriched data).
- **Phase 5 depends on Phase 4** (contract embedding is an extension of the portal work).
- **Phase 6 depends on Phase 4** (can't deprecate standalone until portal handles everything).

---

## Success Criteria

1. Client receives **one link** (`/portal/[token]`) that provides the complete experience
2. **Full proposal** renders inline in the portal with accept/reject — no redirect
3. **Zero code duplication** for themes, animations, formatting between portal + proposal pages
4. **All existing links** continue to work (backward compatible)
5. **Portal section gating** still enforced — proposal only visible when status ≥ Sent
6. **Accept → auto-contract flow** works end-to-end within the portal
7. **Admin sends one link** from the inquiry detail page (portal link, not share link)
8. **Needs Assessment Wizard is pixel-perfect unchanged** — no files modified, no imports changed, no visual regressions

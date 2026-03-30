# inquiry-wizard

## What this module does

Manages the full inquiry wizard flow for ProjectFlo. Provides three surfaces that share the same step components:
- **Public wizard** — client-facing, token-authenticated form at `/inquiry-wizard/[token]`. Uses the studio `WizardLayout` chrome (bokeh orbs, progress bar, animated ambience) and all 18 studio step components, fed by `usePublicWizardData`. Contact screen is moved earlier (before package selection) to capture leads.
- **Studio wizard** — internal staff view at `/sales/inquiry-wizard/` for running the wizard on behalf of a client.
- **Review screen** — internal review UI at `/sales/inquiries/[id]/inquiry-wizard/review` for conflict checking and sign-off.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | All endpoint bindings — templates, submissions, conflicts, public wizard, pricing |
| `types/index.ts` | All domain types: `NACtx`, `ScreenId`, `InquiryWizardTemplate`, `AnyRecord`, etc. |
| `constants/wizard-config.ts` | Event configs, colour palette, screen ambience, budget ranges, deliverable options |
| `constants/animations.ts` | MUI keyframe animations shared across wizard steps |
| `selectors/wizard-navigation.ts` | `computeScreens()` — studio screen order; `computePublicScreens()` — same but no welcome, contact earlier; venue search via Photon API |
| `formatters/payment-terms.ts` | Currency formatting and payment schedule label helpers |
| `hooks/usePublicWizardData.ts` | Fetches public wizard template by token (unauthenticated); adapts `PublicPackageSetData` → `PackageSet`-compatible shape for `useWizardComputed` |
| `hooks/useWizardComputed.ts` | Derives `eventConfig`, `filteredPackages`, `slotLabels`, `budgetLabels` from responses |
| `hooks/useWizardStudioData.ts` | Loads brand/package/event-type data needed for the studio wizard |
| `hooks/useBuilderPackage.ts` | Builder path: creates/resolves custom package from crew+camera selections |
| `hooks/useWizardPaymentSchedules.ts` | Fetches payment schedule templates for the PaymentTermsStep |
| `screens/PublicInquiryWizardScreen.tsx` | Public wizard entry point — uses studio `WizardLayout` chrome + all 18 studio step components |
| `screens/InquiryWizardStudioScreen.tsx` | Studio wizard entry point — shares all step components |
| `screens/InquiryWizardReviewScreen.tsx` | Conflict checking + checklist review for internal staff |
| `components/steps/` | 18 studio step components (used by both public and studio surfaces) |
| `components/layout/` | `WizardLayout` — full-page wizard chrome with bokeh, progress bar, animated ambience |

## Business rules / invariants

- `computeScreens()` (studio) and `computePublicScreens()` (public) in `selectors/wizard-navigation.ts` are the single sources of truth for screen order — never hardcode screen sequences elsewhere. Public variant: no welcome screen, contact before fork.
- All wizard responses are typed `Record<string, unknown>` (`AnyRecord`). Narrow with field key checks before accessing values.
- Public wizard uses `publicGet`/`publicPost` methods (no auth token). Studio wizard uses authenticated `ApiClient`.
- Submissions are created via `publicInquiryWizardApi.submit()` — do not call the authenticated submissions endpoint from the public surface.
- Builder path (`r.package_path === 'build'`) creates a custom `ServicePackage` via `useBuilderPackage` before submission. The resolved `packageId` is included in the submission payload.
- Venue search in `selectors/wizard-navigation.ts` calls Photon (komoot) external API directly — intentional third-party boundary, not a rule violation.

## Related modules

- **Backend**: `packages/backend/src/workflow/inquiry-wizard/` — templates, submissions, conflict checks, public wizard endpoint
- **Frontend types**: `@/lib/types` — `Brand`, `ServicePackage`; `@/features/platform/brand/types` — `WelcomeSettings`
- **Catalog**: `features/catalog/event-types/` — `EventType`; `features/catalog/packages/` — `PackageSet`

## Ownership
- **Backend module:** `packages/backend/src/workflow/inquiry-wizard/`
- **Frontend feature:** `packages/frontend/src/features/workflow/inquiry-wizard/`
- **Routes:**
  - Studio: `/sales/inquiry-wizard/` (settings), `/sales/inquiries/[id]/inquiry-wizard/` (review)
  - Portal: `/inquiry-wizard/[token]` (client-facing form), `/inquiry-wizard/preview` (studio preview)

## Key files
| Layer | Path | Purpose |
|-------|------|---------|
| API factory | `api/index.ts` | Typed fetch wrappers for templates, submissions, sharing, and studio bootstrap data |
| Types | `types/index.ts` | `InquiryWizardTemplate`, `InquiryWizardQuestion`, `InquiryWizardSubmission` |
| Backend services | `services/inquiry-wizard-template.service.ts` | Template CRUD |
| | `services/inquiry-wizard-submission.service.ts` | Submission CRUD |
| | `services/inquiry-wizard-link.service.ts` | Share-link generation and token handling |
| | `services/inquiry-wizard-estimate.service.ts` | Auto-estimate generation |
| | `services/inquiry-wizard-prefill.service.ts` | Pre-fill from inquiry data |
| | `services/inquiry-wizard-conflict.service.ts` | Date/crew conflict checks |
| Backend controller | `inquiry-wizard.controller.ts` | Authenticated endpoints (`/api/inquiry-wizard/*`) |
| Public controller | `public-inquiry-wizard.controller.ts` | Token-based endpoints (`/api/public/inquiry-wizard/*`) |

## Data model
- `InquiryWizardTemplate` — per-brand questionnaire definition (versioned)
- `InquiryWizardQuestion` — individual questions within a template
- `InquiryWizardSubmission` — client responses tied to an inquiry

## API notes
- Studio bootstrap requests in `api/index.ts` rely on the shared authenticated client for tenant scope.
- Inquiry-wizard API factories and hooks no longer accept `brandId` arguments; they resolve tenant scope from the shared brand context.
- Catalog package-set lookups now call `/api/package-sets` without embedding `brandId` in the URL; brand flows through `X-Brand-Context`.

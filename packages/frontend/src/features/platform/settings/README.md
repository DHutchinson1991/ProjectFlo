# platform/settings

Brand settings management — generic key-value settings, meeting/discovery call configuration, and welcome page settings.

## Key files

| File | Purpose |
|------|---------|
| `api/index.ts` | `settingsApi` endpoint bindings (generic CRUD, meeting, welcome) |
| `hooks/useSettings.ts` | Query hooks: `useSettings`, `useSetting`, `useMeetingSettings`, `useWelcomeSettings` |
| `hooks/useSettingsMutations.ts` | Mutation hooks: create/update/delete settings, save meeting/welcome settings |
| `constants/query-keys.ts` | `settingsKeys` factory — brand-scoped |
| `screens/SettingsScreen.tsx` | Main settings screen with tabbed navigation |
| `components/` | Individual tab components (Company, Meetings, Profile, Roles, Users, etc.) |

## Types

Settings types (`BrandSetting`, `MeetingSettings`, `WelcomeSettings`) live in `features/platform/brand/types/` since they are brand-scoped entities shared with the brand provider.

## Business rules

- Settings are brand-scoped key-value pairs stored in `brand_settings` table.
- Meeting settings control discovery call availability (days, hours, duration, Google Meet link).
- Welcome settings control the client-facing welcome/landing page (headline, social links, testimonials).
- All settings endpoints use `skipBrandContext: true` and pass `brandId` as a URL param instead.
- Settings screen has 15 tabs; 6 are placeholders (Notifications, Appearance, Integrations, Security, Billing, Workflow).

## Backend

- Controller: `packages/backend/src/platform/brands/brands.controller.ts` (settings endpoints nested under `/api/brands/:brandId/`)
- Service: `packages/backend/src/platform/brands/services/brand-settings.service.ts`

## Related modules

- `platform/brand` — brand entity and types, `BrandProvider`
- `finance/contracts` — contract settings tab is rendered from `features/finance/contracts`

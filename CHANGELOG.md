# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

---

## [1.0.0] — 2026-07-28

Initial release of AGAP — the first merge of the `dev` branch into `main`.

### Added

- **Adaptive Evacuation Autopilot** — automatically navigates citizens to the nearest
  evacuation center with live route updates and a searchable list of areas
- **Operator Login Page UI redesign** — improved visual consistency and usability
- **Photo capture** in community incident reports — citizens can attach images
- **Report selector modal** with bulk actions (select, delete, export) on the history log
- **Filipino (Tagalog) i18n** via `vue-i18n` with persisted language toggle;
  Filipino is the default locale
- **Multi-scenario Aegis advisory** — 5 disaster scenarios (Flood, Earthquake,
  Typhoon, Fire, Landslide) with tailored Gemini prompts and scenario badges
- **Weather adaptive hero card** — 7 dynamic weather theme states with
  plain-language citizen safety guidance
- **Emergency guides** — industrial chemical, volcanic ashfall, Laguna de Bay coastal
- **Hotspot map** — individual incident markers (SOS at exact GPS, reports at
  barangay centers) with corrected PhilAtlas barangay coordinates
- **Live SOS feed polling fallback** — 10-second polling + manual refresh
  supplementing Supabase Realtime
- **Changelog badge** in README, SSL plugin for dev, seed data JSON files

### Changed

- **Route bundling** — admin views and layout are now lazy-loaded; client PWA no
  longer fetches admin-side code, reducing initial bundle size
- **UI redesign** — scaling fixes across devices, reduced redundant text, updated
  Santa Rosa emergency guides, Material 3 expressive theming throughout
- **GPS acquisition** — two-phase accuracy (high → low), threshold validation,
  fresh location fetch on SOS dispatch instead of stale cached data
- **Barangay lookup** — all hardcoded `'Tagapo'` fallbacks replaced with
  `findNearestBarangay()` GPS-based computation across the SOS dispatch chain
- **SOS dispatch** — hold-to-dispatch mechanic (2-second press) replaces one-tap,
  with keyboard/pointer accessibility
- **Aegis advisory edge function** — multi-model Gemini fallback
  (gemini-1.5-flash → 2.0-flash), 5 scenario-specific prompt builders, robust
  JSON extraction (direct → markdown → brace match), structured fallback on failure
- **Report classification edge function** — multi-model Gemini fallback
  (gemini-2.5-flash → 2.0-flash → 1.5-flash), validation of all AI response
  fields against enums
- **Dependencies upgraded** — Vite 5→8, `@vitejs/plugin-vue` 5→6,
  `vite-plugin-pwa` 0.20→1.30
- **Tailwind config** — expanded for Material 3 expressive design tokens
- **Login page** — admin sidebar and connectivity banner hidden via route-based
  conditional rendering
- **Community reports** — RLS policies allow anonymous insert, authenticated
  select/update; `image_url` column for photo storage
- **Locales** — `en.json` and `fil.json` with `localeStore` for persistent
  language switching

### Fixed

- Admin nav pill hover overlap with the top bar
- Gray fill-in issue for map boundaries
- Gemini token consumption (model reorder, output caps, fast-fail on 429 errors)
- Modal `<div>` nesting causing Vite build failure
- Vue 3 `Set` reactivity crash in report selection
- 17 bugs in multi-scenario Aegis advisory:
  - edge function returning raw error instead of structured fallback
  - duplicate `buildPrompt()` definition
  - try-scoped variable leaks in fallback paths
  - missing `scenario_type` in client-side fallback
  - `setInterval` leak on HMR, unbounded fetch, stale reactive references
  - null guard gaps in sorting and dashboard
  - missing DB indexes on `aegis_suggestions`
- Inaccurate SOS coordinates via stale cached GPS data
- Hardcoded `'Op-01'` operator fallback in SOS dispatch
- Seed data polluting hotspot incident rankings
- `fetchActiveReports()` not clearing stale data on empty Supabase results
- Auto-dismiss Aegis recommendation panel after outcome submit
- Active client navigation highlight in `CitizenLayout.vue`
- Locale store default dead ternary (`'fil' : 'fil'` no-op — corrected to `'fil' : 'en'`)
- Removed dangling `test:smoke` script referencing nonexistent file
- Redundant `ENABLE ROW LEVEL SECURITY` in migration 2 (no-op)

[1.0.0]: https://github.com/zzleep/AGAP/releases/tag/v1.0.0

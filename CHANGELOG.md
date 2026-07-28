# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/zzleep/AGAP/compare/v1.0.3...v1.1.0) (2026-07-28)

### Added

- **Hotspot map density circles** — circles now dynamically size to encompass all incident markers (SOS GPS + report barangay centers) and are capped at 90% of the nearest-neighbor gap to prevent overlap
- **Incident centroid anchoring** — density circles re-center at the actual incident coordinates instead of the administrative barangay center
- **SOS marker clustering by GPS** — alerts at distinct locations stay separate; only exact-coordinate duplicates cluster into a grouped marker with count badge
- **Community report marker clustering by barangay** — reports from the same barangay now cluster into a single marker with count tooltip, matching the SOS pattern
- **Populated popup list items** — clustered SOS alerts show relative time (e.g. "5m ago") and GPS coordinates; clustered reports show priority + short description snippet
- **Navigation redirects** — clicking any clustered list item navigates to the respective admin page; SOS items filter by ID, community report items filter by barangay
- **Query param filtering** — `CommunityReportsView` now reads `?barangay=X` and `?report_id=X` from the URL to pre-filter the view when arriving from the hotspot map
- **SOS feed pagination** — live SOS entries display 10 per page with readable date formatting
- **Home page CSS styling** — visual polish applied to the client-side home view

### Changed

- **Popups revert to cleaner layout** — map popups returned to the original simple card design after a redesign cycle, with improved list-item content replacing technical IDs with human-readable info
- **SOS feed row headers** — clustered and single popups now show the barangay name in the header for immediate geographic context
- **Community report redirect links** — changed from `?report_id=X` to `?barangay=X` so cluster navigation shows all reports from that barangay

### Fixed

- **Mobile GPS inaccuracies** — resolved location drift on mobile devices with improved GPS acquisition
- **Map stretching & fullscreen button** — layout no longer breaks when toggling fullscreen
- **Bottom nav text wrapping** — navigation labels no longer overflow on narrow screens
- **Map card overlay overlap** — incident markers no longer clip behind control panels
- **Resolved alerts excluded** — terminal-status SOS and reports are filtered out of markers and density calculations
- **SOS feed row header** — barangay name displayed correctly in grouped alert popups

## [1.0.3](https://github.com/zzleep/AGAP/compare/v1.0.2...v1.0.3) (2026-07-28)


### Bug Fixes

* zip dist/ before upload to handle nested directories ([4bfc8b0](https://github.com/zzleep/AGAP/commit/4bfc8b062ba384319b06d2515636b034eb4cf7c0))

## [1.0.2](https://github.com/zzleep/AGAP/compare/v1.0.1...v1.0.2) (2026-07-28)


### Bug Fixes

* glob dist/* instead of dist/ for release upload ([6c0198d](https://github.com/zzleep/AGAP/commit/6c0198d056ee0eded03fcd75f5e437eb4e62a7d4))

## [1.0.1](https://github.com/zzleep/AGAP/compare/v1.0.0...v1.0.1) (2026-07-28)


### Bug Fixes

* Fixed the blank Evac page map ([597fd13](https://github.com/zzleep/AGAP/commit/597fd13a752053bd0d67c9438611f34015945ae9))
* use RELEASE_PLEASE_TOKEN secret for release-please action ([7a2c4ea](https://github.com/zzleep/AGAP/commit/7a2c4eac7a284071f82d5bfcf8721c23db65c85d))

---

## [1.0.1] — 2026-07-28

### Fixed

- **Blank Evac page map** — resolved by integrating the MapboxGL CSP Worker
  for strict CSP environments, adding an OSM raster tile style as failover
  when Mapbox vector tiles are unreachable, and guarding all map operations
  against style load state. GPS acquisition is deferred to avoid blocking
  initial map render, and `map.resize()` calls are consolidated through
  `handleViewportResize()` for reliable layout recalculation.

### CI

- **release-please workflow** — automated changelog generation and GitHub
  Releases on push to `main`, with build artifact attachment and README
  documentation of the release process.

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

[1.0.1]: https://github.com/zzleep/AGAP/releases/tag/v1.0.1
[1.0.0]: https://github.com/zzleep/AGAP/releases/tag/v1.0.0

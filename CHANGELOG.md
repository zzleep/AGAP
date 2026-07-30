# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2](https://github.com/zzleep/AGAP/compare/v2.2.1...v2.2.2) (2026-07-30)


### Bug Fixes

* restore rAF deferral in renderRiskZones without console.warn ([9161de8](https://github.com/zzleep/AGAP/commit/9161de8c334c3534b2f06e5c978d2986782d7105))

## [2.2.1](https://github.com/zzleep/AGAP/compare/v2.2.0...v2.2.1) (2026-07-30)


### Bug Fixes

* replace rAF polling with map.once('style.load') in renderRiskZones ([03a2752](https://github.com/zzleep/AGAP/commit/03a275230ebd0a5d43fcf366528446be77d44726))

## [2.2.0](https://github.com/zzleep/AGAP/compare/v2.1.0...v2.2.0) (2026-07-30)


### Features

* **citizen:** overhaul GPS location permissions & phone input validation ([6589193](https://github.com/zzleep/AGAP/commit/6589193476c213a50aff2630d723c91c8545b7e0))
* **map:** add flood zone toggle button and gap-fill base layer ([c41c833](https://github.com/zzleep/AGAP/commit/c41c83390f4a77d97da2431d9f64478b5f5ed0b6))
* **map:** add flood zone toggle button with gap-fill base layer ([0257cbd](https://github.com/zzleep/AGAP/commit/0257cbd1c0851388d5fa9a13c3c41f30d45c9005))


### Bug Fixes

* address code review comments ([300bf8b](https://github.com/zzleep/AGAP/commit/300bf8b09685bbf23928971e51b04ffb7631a5f2))

## [2.1.0](https://github.com/zzleep/AGAP/compare/v2.0.1...v2.1.0) (2026-07-30)


### Features

* add interactive GPS dropdown with Google Maps and copy actions to SOS Feed ([d3504cf](https://github.com/zzleep/AGAP/commit/d3504cf1f8296369f40e9180fa6d9105d7f113d1))
* **connectivity:** optimize connection ([3862c17](https://github.com/zzleep/AGAP/commit/3862c17d3a59560246420520bcb93c0f4c82dda9))


### Bug Fixes

* **guides:** replace non-existent Barangay Poblacion with actual barangay names ([0fe1901](https://github.com/zzleep/AGAP/commit/0fe1901d4f536e1eb27ad00868db06600d81d4f4))
* **review:** wire fetchWithRetry to central config, dynamic realtime subscriptions, clarify threshold intent ([39da9bb](https://github.com/zzleep/AGAP/commit/39da9bbf4e99127a187685a16cd4ffb788fcbe9c))


### Performance Improvements

* **slow-network:** optimize app-side for 3G/slow 4G reliability ([f72c5e8](https://github.com/zzleep/AGAP/commit/f72c5e8dfaab925a73eb8a44ff21efea41f0f1fe))

## [2.0.1](https://github.com/zzleep/AGAP/compare/v2.0.0...v2.0.1) (2026-07-29)


### Bug Fixes

* fixed PWA icons and configs ([45375b5](https://github.com/zzleep/AGAP/commit/45375b5f1149f8945442bfaa06cde6b6e8bd2250))


### Bug Fixes

- **PWA icons** — added new app icon set (`agap_pwa_icon.png`, `apple-touch-icon-180.png`, `apple-touch-icon-precomposed.png`, `apple-touch-icon.png`) with proper paths in `index.html`
- **UI inconsistencies** — resolved visual alignment issues across citizen and admin layouts
- **PWA config** — corrected Vite PWA plugin configuration for proper asset resolution and caching
- **Router guard** — added route-level check to prevent unnecessary re-initialization on navigation
- **CSS refinements** — applied `overscroll-behavior: contain` and `scrollbar-gutter: stable` to prevent layout shift

---

## [2.0.0](https://github.com/zzleep/AGAP/compare/v1.1.0...v2.0.0) (2026-07-29)


### ⚠️ Breaking Changes

* **Onboarding & SOS callback module** — header language toggle replaced with Settings gear icon; citizen pages redirect new users through onboarding flow; IndexedDB schema upgraded from v1 to v2 with new `user_profile` store ([e13d09f](https://github.com/zzleep/AGAP/commit/e13d09f941addb18691094f3fdad6ca7eba51fc4))


### Features

* **Onboarding, SOS Callback Module, Device tagging, and Spam Suppression** — 2-screen citizen onboarding, dedicated Settings page, callback number capture with Philippine mobile normalization, persistent SOS device hashing via IndexedDB, contact number column with tel: links in dispatch feed, contextual dropdown dispatch actions, spam/prank flagging with confirmation modal, `/admin/flagged-sos` review page, and automatic spam suppression in the main feed ([e13d09f](https://github.com/zzleep/AGAP/commit/e13d09f941addb18691094f3fdad6ca7eba51fc4))


### Bug Fixes

* **debugging tools removed** — stripped extraneous debug UI elements from Settings page; added onboarding background ([756000b](https://github.com/zzleep/AGAP/commit/756000b1dc499142a4ad878292af111b4ea2f66b))

---

## [2.0.0] — 2026-07-29

### Added

- **Citizen onboarding flow** — 2-screen setup (`OnboardingView.vue`) guiding GPS permission grant and optional callback number capture on first launch; auto-redirects new users and skips if already completed
- **Settings page** (`SettingsView.vue`) — dedicated screen for language selection, emergency callback number editing, and SOS device hash inspection
- **Callback number utility** (`callbackNumber.js`) — Philippine mobile number normalizer (`+639` / `639` → `09XXXXXXXXX`) with validation
- **IndexedDB v2 upgrade** — `user_profile` object store caching `callback_number` and `sos_device_hash` with lazy init and in-memory caching
- **SOS device tagging** — every SOS dispatch includes a persistent `sos_device_hash` (UUID) across all paths (REST, Supabase SDK, IndexedDB offline) enabling device-level tracking without compromising emergency reporting
- **SOS callback number capture** — `callback_number` appended to all SOS payloads wherever a saved number exists; fully optional and never gates emergency dispatch
- **Contact Number column** — in `LiveSOSFeed.vue` with `tel:` protocol links and copy-to-clipboard for dispatchers
- **Dispatch action dropdown menu** — contextual multi-action dropdown replacing single-action buttons with "Claim & Dispatch", "Mark Resolved", and "Mark as Spam/Prank" options
- **Spam/ Pranks confirmation modal** — optional reason logging when flagging SOS as spam, recorded to the `flagged_devices` table
- **Flagged SOS admin page** — `/admin/flagged-sos` route and `FlaggedSOSView.vue` with device unhashing, flagged report review, and device un-flagging
- **Flagged SOS nav tab** — "Flagged SOS" entry added to the admin navigation rail with flag icon
- **Spam suppression engine** — main dispatch feed auto-filters SOS from actively flagged device hashes while preserving all null-hash reports (legacy devices) to guarantee no legitimate report is ever suppressed
- **Santa Rosa Arch watermark** — SVG landmark silhouette embedded in the home hero card with per-theme dynamic tinting

### ⚠️ Breaking Changes

- **Header language toggle removed** — the inline globe icon + FIL/EN label in the citizen header has been replaced with a Settings gear icon. Users must now navigate to `/app/settings` to switch languages. This affects all existing PWA clients until they re-cache the updated app shell.
- **IndexedDB schema v1→v2** — the persistent GPS database upgraded from schema v1 to v2, adding a `user_profile` object store. The `upgrade()` callback handles migration transparently on first load, but downgrading to v1 of the app will cause IndexedDB open failures. This is a forward-only schema bump.
- **Onboarding redirect** — users without `agap_onboarding_done` in localStorage are redirected from `/app/*` routes to `/app/setup`. Returning users with the flag set are unaffected, but clearing localStorage or installing fresh will trigger the onboarding flow before any other citizen page loads.

### Changed

- **Header language toggle replaced** — globe icon with language label removed from `CitizenLayout.vue` header; language switching moved to the new Settings page
- **CitizenLayout bottom nav** — hidden during onboarding flow (`/app/setup`) so the setup screen is presented without navigation chrome
- **Main content padding** — adjusted bottom padding from `pb-28` to `pb-6` on the setup route for a cleaner first-run layout
- **IndexedDB schema v1→v2** — non-breaking migration; existing `locations` store preserved, `user_profile` store added alongside
- **SOS payload expansion** — `callback_number` and `sos_device_hash` fields added to REST API and Supabase SDK paths; both default to `null` / generated UUID when absent

### Fixed

- **Debugging visuals removed** — extraneous debug UI elements stripped from Settings page
- **Onboarding background display** — corrected background context so the onboarding view renders consistently with the app theme

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

[2.0.0]: https://github.com/zzleep/AGAP/releases/tag/v2.0.0
[1.0.1]: https://github.com/zzleep/AGAP/releases/tag/v1.0.1
[1.0.0]: https://github.com/zzleep/AGAP/releases/tag/v1.0.0

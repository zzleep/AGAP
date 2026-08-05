# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0](https://github.com/zzleep/AGAP/compare/v2.3.3...v2.4.0) (2026-08-05)


### Features

* feat:  ([8b45122](https://github.com/zzleep/AGAP/commit/8b45122e686e83f687899c8a2a108ee3e8c4fc5e))
* **citizen:** photo home tiles, time-of-day greeting, guide & evac-map polish ([17f69cb](https://github.com/zzleep/AGAP/commit/17f69cb2f37a8f4294411e0d4e4653168d91a865))
* **home:** photo action tiles, time-of-day greeting, tighter spacing ([e744029](https://github.com/zzleep/AGAP/commit/e7440295db52c77e364ed313115ba0c04b9ae191))
* revamp home action tiles and active SOS ([62f6f3a](https://github.com/zzleep/AGAP/commit/62f6f3afe5eb5745420811ee3375e84743806a06))
* **sos:** honest victim SOS flow with status ladder, updates, and rescue confirm ([67e85c2](https://github.com/zzleep/AGAP/commit/67e85c2fe3df8c38c96ec56794cad51fbe53142e))


### Bug Fixes

* **evacmap:** address review — i18n pill text, SSR-safe flood zone toggle, cleanup resets expansion state ([e68d49b](https://github.com/zzleep/AGAP/commit/e68d49bb1f80533746f4b340e4ec6eb4147dd49a))
* **gps/sos:** honest location, graceful accuracy degradation, stale-flag reconciliation; refactor EvacMap ([d9a3931](https://github.com/zzleep/AGAP/commit/d9a3931ccc7f2306c70138c1bea0a37569b78e04))
* **gps:** reconcile stale permission pref, degrade accuracy gracefully, never fabricate locations ([132aaaf](https://github.com/zzleep/AGAP/commit/132aaafb2e7ca64e44551e85bb7a8d74158eb8e9))
* **reports:** drop latitude/longitude from community_reports select ([f1246bf](https://github.com/zzleep/AGAP/commit/f1246bf68b49086878bf762f8677a3286dcf2ac5))
* **sos:** deliver queued SOS on mount, quiet offline updates, gate panel while undelivered ([be604bf](https://github.com/zzleep/AGAP/commit/be604bfa56dee36510d6edd8d650e34c927d2db7))

## [2.4.0](https://github.com/zzleep/AGAP/compare/v2.3.3...v2.4.0) (2026-08-05)

### Features

* **sos:** honest victim SOS flow with status ladder, live updates, and rescue confirmation ([67e85c2](https://github.com/zzleep/AGAP/commit/67e85c2fe3df8c38c96ec56794cad51fbe53142e))
* **home:** photo action tiles, time-of-day greeting, and tighter spacing ([e744029](https://github.com/zzleep/AGAP/commit/e7440295db52c77e364ed313115ba0c04b9ae191))
* revamp home action tiles and active SOS emergency interface ([62f6f3a](https://github.com/zzleep/AGAP/commit/62f6f3afe5eb5745420811ee3375e84743806a06))
* **evacmap:** evac and incident markers as icons, community reports date/time format, and safe-route rerouting away from incidents ([8b45122](https://github.com/zzleep/AGAP/commit/8b45122e686e83f687899c8a2a108ee3e8c4fc5e))

### Bug Fixes

* **gps:** reconcile stale permission preference, degrade accuracy gracefully, never fabricate locations ([132aaaf](https://github.com/zzleep/AGAP/commit/132aaafb2e7ca64e44551e85bb7a8d74158eb8e9))
* **evacmap:** address review — i18n pill text, SSR-safe flood zone toggle, cleanup resets expansion state ([e68d49b](https://github.com/zzleep/AGAP/commit/e68d49bb1f80533746f4b340e4ec6eb4147dd49a))
* **sos:** deliver queued SOS on mount, quiet offline updates, gate panel while undelivered ([be604bf](https://github.com/zzleep/AGAP/commit/be604bfa56dee36510d6edd8d650e34c927d2db7))
* **reports:** drop latitude/longitude from community_reports select ([f1246bf](https://github.com/zzleep/AGAP/commit/f1246bf68b49086878bf762f8677a3286dcf2ac5))

### Refactoring

* **evacmap:** modularize 1252-line view into composables, utils, and header card ([0f2fed8](https://github.com/zzleep/AGAP/commit/0f2fed87be1b63d8f7a886867c4328dd36ab4b57))
* **home:** reactive clock, extract shared action tile ([37b4696](https://github.com/zzleep/AGAP/commit/37b46965da76cfc289ef85b04938249e64cac40a))

### Other

* **citizen:** guide content rewrites, evac-map labels, report form tweaks ([584dcc3](https://github.com/zzleep/AGAP/commit/584dcc35c0c3ff39f88745754725641159fb5b73))

## [2.3.3](https://github.com/zzleep/AGAP/compare/v2.3.2...v2.3.3) (2026-07-30)

### Fixed

* restore full-width app shell and citizen header layout for improved mobile rendering and safe-area behavior

## [2.3.2](https://github.com/zzleep/AGAP/compare/v2.3.1...v2.3.2) (2026-07-30)


### Bug Fixes

* address code review comments on useUpdatePrompt singleton lifecycle ([a732129](https://github.com/zzleep/AGAP/commit/a7321294c910fb2c70a78a81048a5a5cf9e9bf34))
* address code review comments on useUpdatePrompt singleton lifecycle ([96605db](https://github.com/zzleep/AGAP/commit/96605db960c9de85d9804d91ebadf438ce6faa0e))

## [2.3.1](https://github.com/zzleep/AGAP/compare/v2.3.0...v2.3.1) (2026-07-30)


### Bug Fixes

* improve update banner speed and UI/UX redesign ([20e19f1](https://github.com/zzleep/AGAP/commit/20e19f15068a149b2b4aa2f500ecea8a10caf506))
* improve update banner speed and UI/UX redesign ([e72861f](https://github.com/zzleep/AGAP/commit/e72861f26c8ba74476623ec62f127f3f810c2cc2))
* use workbox-window Workbox for reliable SW update detection ([9a71ca4](https://github.com/zzleep/AGAP/commit/9a71ca49232e2d078b7b955890709edb1dc6ab84))

## [2.3.1](https://github.com/zzleep/AGAP/compare/v2.3.0...v2.3.1) (2026-07-30)


### Bug Fixes

* **update-banner:** add proactive wb.update() polling for faster update detection and redesign UI/UX ([e72861f](https://github.com/zzleep/AGAP/commit/e72861f20e416fdf2f5a9a432e3ec9d3413081d9))


## [2.3.0](https://github.com/zzleep/AGAP/compare/v2.2.4...v2.3.0) (2026-07-30)


### Features

* add new version update notification banner with PWA prompt flow ([b0a9c6c](https://github.com/zzleep/AGAP/commit/b0a9c6cc95a925220c17df6e980940e8325a603e))
* new version update notification banner ([eef41ab](https://github.com/zzleep/AGAP/commit/eef41ab4b5d0dcea05a1733b83047ed262943724))


### Bug Fixes

* **UpdateBanner:** add type='button' to prevent form submission ([f2971e5](https://github.com/zzleep/AGAP/commit/f2971e5ede5318916837baa0e19a5dd4c2e9473d))

## [2.2.4](https://github.com/zzleep/AGAP/compare/v2.2.3...v2.2.4) (2026-07-30)


### Bug Fixes

* address code review comments on SOS flag, auth timeout, localStorage guard, unmount guard ([f1e676b](https://github.com/zzleep/AGAP/commit/f1e676bc30ab98c417bf17e3c99ca537c6e41e78))
* **EvacMap:** persist flood zone toggle state across page refreshes ([1daab67](https://github.com/zzleep/AGAP/commit/1daab67e8f8910990e60d1a7b54b95f80d9e7f41))
* **EvacMap:** persist flood zone toggle state across page refreshes ([b2238a6](https://github.com/zzleep/AGAP/commit/b2238a6cb41c71b078a204b255e89a812de1c17c))
* route optimization ([5fa3fee](https://github.com/zzleep/AGAP/commit/5fa3feea16249afd0849abb911bcfae01b7c5af4))

## [2.2.3](https://github.com/zzleep/AGAP/compare/v2.2.2...v2.2.3) (2026-07-30)


### Bug Fixes

* resolve silent SOS dispatch failures on iOS Safari / PWA ([b1c3b2c](https://github.com/zzleep/AGAP/commit/b1c3b2c08c93cb8db0d21f62810aa4002b2920cd))

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

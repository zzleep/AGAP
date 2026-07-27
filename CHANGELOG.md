# Changelog

## Filipino (Tagalog) i18n Support (2026-07-27)

### Problem
The AGAP citizen-facing UI was English-only. Filipino-speaking users — the primary target demographic in Santa Rosa, Laguna — had to navigate disaster response tools (SOS, evacuation maps, community reporting) in a language they may not be fully comfortable with, especially under high-stress emergency situations.

### Changes Made

#### New file: `src/locales/en.json`
- Full English locale with 140+ translation keys covering all citizen-facing views: navigation, SOS, home, evacuation map, flow engine, guides, community reporting, connectivity banner, GPS status, and common terms

#### New file: `src/locales/fil.json`
- Complete Filipino (Tagalog) translation mirroring every key in `en.json` with culturally appropriate disaster-response terminology

#### `src/main.js`
- Added `vue-i18n` plugin initialization with `createI18n()`
- Configured with `legacy: false` (Composition API mode), fallback locale `'en'`, and persisted locale from `localStorage`
- Imports both locale files as message bundles

#### New file: `src/stores/localeStore.js`
- Pinia store encapsulating locale state management
- `setLocale(loc)` — switches locale and persists choice to `localStorage`
- `initLocale()` — restores saved locale on app init, defaults to Filipino

#### `src/layouts/CitizenLayout.vue`
- Replaced all hardcoded English text with `$t()` calls referencing locale keys (navigation bar, header subtitle, operator portal link)
- Added language toggle button in the bottom nav bar showing `FIL`/`EN` badge
- `toggleLanguage()` cycles between `'fil'` and `'en'`
- Calls `localeStore.initLocale()` on mount

#### `src/views/citizen/*.vue` (7 views)
- `HomeView.vue` — all UI strings (weather, location, emergency assistance, evacuation routes) migrated to `$t('home.*')`
- `SOSView.vue` — SOS dispatch UI, GPS signal status, and button text migrated to `$t('sos.*')`
- `EvacMap.vue` — evacuation map labels, risk filters, route descriptions migrated to `$t('evacMap.*')`
- `FlowEngine.vue` — rainfall thresholds, risk levels, and demo controls migrated to `$t('flowEngine.*')`
- `GuideList.vue` and `GuideDetail.vue` — guide listing and detail view text migrated to `$t('guideList.*')` / `$t('guideDetail.*')`
- `CommunityReportForm.vue` — full form labels, anonymity notice, captcha, AI triage display, and nag dialog migrated to `$t('communityReport.*')`

#### `src/composables/useGPS.js`
- Hardcoded toast notification strings replaced with i18n-aware `gps.locationSaved`, `gps.locationRefreshed`, `gps.gpsLockFailed` fallback keys

### Verification
- Filipino is the default locale on first launch (matching primary user base)
- Language toggle in bottom nav instantly switches between FIL/EN without page reload
- Locale choice persists across sessions via `localStorage`
- English fallback ensures untranslated keys never display raw keys to the user
- All 7 citizen views render correctly in both locales

---

## GPS Accuracy Fix (2026-07-27)

### Problem
SOS signals were sending inaccurate GPS coordinates, placing the user far from their actual location (appearing "near the ocean" / Laguna de Bay instead of their real position).

### Root Causes

#### 1. GPS timeout too short (`src/composables/useGPS.js`)
Both `initGPS()` and `refreshLocation()` used a 5-second timeout with `enableHighAccuracy: true`. GPS cold starts typically take 15-30+ seconds on mobile devices, so the timeout almost always fired before acquiring a fix, causing fallback to hardcoded default coordinates (14.3123, 121.1114).

#### 2. No low-accuracy fallback (`src/composables/useGPS.js`)
When high-accuracy GPS failed, the code immediately fell back to a hardcoded position instead of retrying with `enableHighAccuracy: false` (which uses WiFi/cell tower positioning and is much faster).

#### 3. No accuracy validation (`src/composables/useGPS.js`)
Even when GPS succeeded, `pos.coords.accuracy` was never checked. A fix with 1km+ inaccuracy would be accepted and sent as the SOS location.

#### 4. SOS used stale cached location (`src/views/citizen/SOSView.vue`)
`handleSOSDispatch()` read `cachedLocation.value` directly without attempting a fresh GPS fix. If the app loaded 10+ minutes ago, the cached position could be stale by kilometers.

### Changes Made

#### `src/composables/useGPS.js`

- **Added `acquirePosition()` helper** (line 75): Two-phase GPS acquisition strategy:
  - **Phase 1**: High accuracy (`enableHighAccuracy: true`) with 20s timeout
  - **Phase 2** (if Phase 1 fails or accuracy > 100m): Low accuracy (`enableHighAccuracy: false`) with 10s timeout — uses WiFi/cell positioning, much faster
- **Updated `initGPS()`**: Uses `acquirePosition(20000, 10000)` instead of single `getCurrentPosition` with 5s timeout
- **Updated `refreshLocation()`**: Uses `acquirePosition(20000, 10000)` instead of single `getCurrentPosition` with 5s timeout
- **Accuracy threshold**: Phase 1 fixes with accuracy ≤ 100m are accepted immediately; otherwise Phase 2 is attempted as a fallback

#### `src/views/citizen/SOSView.vue`

- **`handleSOSDispatch()`** (line 85): Now always calls `refreshLocation(true)` to get a fresh GPS fix before dispatching SOS, instead of using the stale `cachedLocation` value

### Verification
- GPS cold start now gets up to 30 seconds total (20s high-accuracy + 10s low-accuracy fallback) before falling back to cached/hardcoded position
- SOS dispatch always triggers a fresh location acquisition
- Desktop browsers without GPS hardware fall through to low-accuracy (WiFi-based) positioning before using hardcoded defaults

---

## Hotspot Map Fix (2026-07-27)

### Problem
The hotspot density map in the operator/admin view (`/admin/hotspot-map`) only showed **aggregate density circles at hardcoded barangay center points**. Individual SOS/report locations were never plotted on the map, making it impossible for operators to see where incidents actually occurred. Additionally, the hardcoded barangay center coordinates were inaccurate, placing density circles at wrong locations.

### Changes Made

#### `src/components/HotspotMap.vue`

- **Added `incidentMarkerGroup`** — a new Leaflet layer for plotting individual incident markers

- **Added `renderIncidentMarkers()`** — plots each active SOS at its actual GPS coordinates (`latitude`/`longitude` from the SOS record) as red circle markers, and each active community report at its barangay center as amber circle markers. Each marker has a popup with full incident details (barangay, coordinates, status, description, etc.)

- **Fixed all 18 barangay center coordinates** — updated from approximate/wrong values to authoritative PhilAtlas data (sources verified at philatlas.com):
  - `Aplaya`: 14.3265→14.3151, 121.1215→121.1219
  - `Balibago`: 14.2938→14.2946, 121.1095→121.1054
  - `Caingins`: 14.3210→14.2985, 121.1120→121.1270
  - `Dila`: 14.3005→14.2902, 121.1040→121.1095
  - `Dita`: 14.2830→14.2818, 121.1080→121.1115
  - `Don Jose`: 14.2485→14.2564, 121.0580→121.0664
  - `Ibaba`: 14.3160→14.3146, 121.1110→121.1184
  - `Kanluran (Poblacion Ward 1)`: 14.3140→14.3127, 121.1080→121.1103
  - `Labas`: 14.3080→14.3070, 121.1060→121.1104
  - `Macabling`: 14.3150→14.2986, 121.0970→121.0972
  - `Malitlit`: 14.2750→14.2691, 121.0820→121.1111
  - `Malusak (Poblacion Ward 2)`: 14.3145→14.3116, 121.1105→121.1138
  - `Market Area (Poblacion Ward 8)`: 14.3130→14.3167, 121.1130→121.1156
  - `Pooc`: 14.3010→14.3000, 121.0920→121.1117
  - `Pulong Santa Cruz`: 14.2880→14.2766, 121.0850→121.0831
  - `Santo Domingo`: 14.2580→14.2284, 121.0690→121.0479
  - `Sinalhan`: 14.3310→14.3297, 121.1160→121.1113
  - `Tagapo`: 14.3185→14.3185, 121.1025→121.1028

- **Updated map center** from `[14.3123, 121.1114]` to official city center `[14.3157, 121.1122]` (per PhilAtlas)

- **Updated legend** to include individual incident marker types (red dot = SOS at exact GPS, amber dot = Community Report)

- **Added `map.invalidateSize()` call** after initialization to ensure proper map rendering in the flex layout

### Verification
- Operators can now see individual SOS markers plotted at exact GPS coordinates on the map
- Density circles now use corrected barangay center coordinates from authoritative source
- Layer toggles (SOS Alerts / Community Reports / City Boundary) control both density circles and individual markers

---

## Seed Data & Barangay Lookup Fix (2026-07-27)

### Problem
1. **Seed data polluted hotspot rankings** — Hardcoded mock SOS and community report entries in `sosStore.js` and `reportStore.js` inflated incident counts, causing phantom hotspots (e.g., Aplaya appearing as #1 when no real data existed there).
2. **Barangay always hardcoded to 'Tagapo'** — The `barangay` field on every GPS location was hardcoded to `'Tagapo'` regardless of the user's actual coordinates. SOS payloads always reported `barangay: 'Tagapo'`, making the hotspot map group all incidents under Tagapo.
3. **`fetchActiveReports()` only replaced data on non-empty results** — If Supabase returned an empty array, the seed data persisted because of the `data.length > 0` guard.

### Changes Made

#### New file: `src/data/barangay_coords.js`
- Single source of truth for all 18 barangay coordinates (PhilAtlas-corrected)
- Exports `BARANGAY_COORDS`, `BARANGAY_LIST`, and `findNearestBarangay(lat, lng)` — a centroid-based nearest-neighbor lookup that determines the barangay from GPS coordinates

#### `src/composables/useGPS.js`
- Imports `findNearestBarangay` from the shared module
- In both `initGPS()` and `refreshLocation()`, replaces `barangay: 'Tagapo'` with `barangay: findNearestBarangay(latitude, longitude)` — the SOS payload now correctly reflects the user's actual barangay

#### `src/stores/sosStore.js`
- **Removed** the two hardcoded seed SOS records from `activeReports` (Tagapo + Balibago)
- Changed `fetchActiveReports()` condition from `data.length > 0` to just `data` — empty Supabase results now correctly clear the array

#### `src/stores/reportStore.js`
- **Removed** the two hardcoded seed community reports from `reports` (Tagapo + Balibago)
- Changed `fetchReports()` condition from `data.length > 0` to just `data`

#### `src/components/HotspotMap.vue`
- Replaced inline `SANTA_ROSA_BARANGAY_COORDS` with import from `@/data/barangay_coords.js`

#### `src/composables/useCommunityReport.js`
- Replaced inline `SANTA_ROSA_BARANGAYS` array with import of `BARANGAY_LIST` from the shared module

### Verification
- No hardcoded incident data — only real Supabase records appear in hotspot rankings
- SOS barangay is now derived from actual GPS coordinates via nearest-centroid lookup
- Empty Supabase results correctly show zero incidents instead of stale seed data

---

## Hardcoded Barangay Fallback Elimination (2026-07-27)

### Problem
Despite the earlier `findNearestBarangay()` addition to `useGPS.js`, **six hardcoded `'Tagapo'` string fallbacks** remained scattered across the SOS dispatch chain. When GPS acquisition failed (e.g., on desktop browsers, poor signal, or timeout), every fallback path cascaded to `barangay: 'Tagapo'`, causing every SOS that lacked a real GPS fix to appear as Tagapo in the operator feed and hotspot map.

### Changes Made

#### `src/composables/useGPS.js`
- **Both `initGPS()` fallback blocks** — replaced `barangay: 'Tagapo'` with `barangay: findNearestBarangay(fallbackLat, fallbackLng)`. The fallback coordinates `(14.3123, 121.1114)` are nearest to **Kanluran** (not Tagapo), so the barangay is now computed correctly from the actual fallback position.

#### `src/views/citizen/SOSView.vue`
- **`handleSOSDispatch()` fallback** (line 89) — replaced `barangay: 'Tagapo'` with `barangay: findNearestBarangay(fallbackLat, fallbackLng)`. The SOS is immediately sent from the citizen page, so this is the most commonly hit fallback.

#### `src/composables/useSOS.js`
- **`dispatchSOS()`** (line 39) — replaced `coords.barangay || 'Tagapo'` with `coords.barangay || findNearestBarangay(coords.latitude, coords.longitude)` to guard against a missing barangay even when coordinates are present.

#### `src/stores/sosStore.js`
- **`submitSOS()`** (line 144) — replaced `payload.barangay || 'Tagapo'` with `payload.barangay || findNearestBarangay(payload.latitude, payload.longitude)` for the same guard.

#### `src/views/admin/LiveSOSFeed.vue`
- **`claimAlert()` operator ID** (line 207) — removed `|| 'Op-01'` fallback so a missing operator identity doesn't assign a fake operator.
- **SOS card display** (line 127) — replaced `'Op-01'` display fallback with `'Unclaimed'` for clarity when no operator has claimed an alert.

### Verification
- Every SOS record now carries a barangay derived from its actual coordinates, even when GPS falls back to default coords
- No hardcoded `'Tagapo'` string remains in any SOS payload path
- Hotspot map density clustering and rankings reflect correct barangay distribution
- Operator feed no longer shows fake `'Op-01'` assignments

---

## Live SOS Feed Polling Fallback (2026-07-27)

### Problem
The operator Live SOS Feed (`/admin/sos-feed`) only fetched SOS records **once on mount** and relied entirely on Supabase Realtime for updates. If the Realtime subscription dropped or the `sos_reports` table wasn't configured for Realtime publication, new SOS dispatches from citizens would never appear on the operator side. There was no polling fallback, no manual refresh button, and HTTP errors during SOS submission were swallowed silently.

### Changes Made

#### `src/views/admin/LiveSOSFeed.vue`
- **Added polling interval** — auto-refetches `fetchActiveReports()` every 10 seconds as a fallback to Realtime
- **Added ↻ Refresh button** — manual trigger to immediately re-fetch all SOS records from Supabase
- **Cleanup** — poll timer is cleared on unmount alongside the stale-claim timer

#### `src/composables/useSOS.js`
- **Added HTTP error logging** — when `POST /rest/v1/sos_reports` returns a non-OK status, logs `SOS POST failed: {status} {statusText}` to the browser console for debugging

### Verification
- Operator feed now has two update paths: Realtime (instant) + polling (every 10s)
- If Supabase Realtime is unavailable, SOS will appear within 10 seconds
- Console shows HTTP status when a SOS POST fails, helping diagnose RLS or schema issues

---

## Multi-Scenario Aegis Advisory + Bug Fixes (2026-07-27)

### Features

#### 5 Selectable Disaster Scenarios

The Aegis AI Command Panel previously had a single "Simulate Scenario" button that hardcoded one flood scenario (3 SOS, Tagapo, danger flood). Operators can now pick from 5 distinct disaster scenarios, each triggering a tailored AI advisory:

| Scenario | Icon | Preset | Aegis Advisory Mode |
|----------|------|--------|---------------------|
| Flood | 🌊 | 3 SOS, Tagapo, danger flood, 18.5mm/hr rain | Water rescue, boat deployment, evacuation centers |
| Earthquake | 🏚️ | 5 SOS, Malitlit, no flood, M5.2 aftershock | USAR, structural assessment, medical triage |
| Typhoon | 🌀 | 4 SOS, Dila, warning flood, Signal #3 120km/h | Pre-emptive evacuation, shelter management |
| Fire | 🔥 | 2 SOS, Market Area, no flood, structural fire | Fire suppression, perimeter evacuation, burn triage |
| Landslide | ⛰️ | 3 SOS, Sinalhan, watch flood, 48hr continuous rain | Geohazard assessment, route closure, slope monitoring |

**Files changed:**
- `src/views/admin/AegisPanel.vue` — replaced single simulate button with scenario selector dropdown (5-card grid), passes `scenario_type` to Edge Function, renders colored scenario badge in recommendation card
- `supabase/functions/aegis-advisor/index.ts` — added `scenario_type` input, 5 prompt builders dispatched via lookup table, console warning for unknown types, `scenario_type` in response/raw_inputs/fallback

#### `aegis_suggestions` Schema Extension

- `supabase/migrations/20260727000000_init_agap.sql` — Added `scenario_type TEXT` column, `CREATE INDEX` on `outcome`, `CREATE INDEX USING GIN` on `related_sos_ids` array

### Bug Fixes

#### High Severity

1. **Edge Function: `catch` returned raw `{error}` instead of structured `fallbackAdvisory`**
   - `rawInputs` was declared inside `try` — `catch` couldn't access it
   - `catch` returned `{ error: err.message }` with `status: 500` — the frontend expected `recommended_action`, `target_barangay`, `reasoning`, etc., causing a potential NPE in `AegisPanel.vue`
   - **Fix:** Moved `rawInputs`, `scenarioType`, `clusterBarangay` to outer scope; `catch` now calls `fallbackAdvisory()` returning a consistent structured response

2. **Edge Function: Duplicate `buildPrompt()` function**
   - Old `buildPrompt()` was not removed when the new one with `console.warn` was added
   - **Fix:** Removed the duplicate

3. **Edge Function: Variable references pointed to try-scoped destructured variables**
   - `cluster_barangay || ''` and `scenario_type || 'flood'` in fallback paths referenced `try`-block locals, not outer-scope variables
   - **Fix:** All references use outer-scope `clusterBarangay` and `scenarioType`

4. **`AegisPanel.vue`: Client-side fallback missing `scenario_type`**
   - When the Edge Function returned an HTTP error or threw an exception, the constructed fallback `activeRecommendation` object omitted `scenario_type` — the scenario badge would not render
   - **Fix:** Added `scenario_type: scenarioType` to both error and catch fallback objects, plus inside `raw_inputs`

5. **`AegisPanel.vue`: Dead code `lastRecommendationKey`**
   - Declared but never used (the actual double-submit guard was `outcomeSubmitting` ref)
   - **Fix:** Removed

6. **`sosStore.js`: `setInterval` leak on Vite HMR**
   - The 30-second clock polling interval was created at the top of the Pinia setup function with no cleanup. Under Vite HMR, each store re-init created a new interval without clearing the old one — orphaned intervals accumulated
   - **Fix:** Stored interval ID on `window._agapClockInterval`, cleared before creating a new one

7. **`sosStore.js`: `fetchActiveReports()` unbounded fetch**
   - No `.limit()` or time filter — fetched every SOS report ever created. As the table grows this would consume excessive memory and slow down `sortedQueue`/`activeClusters` computed properties
   - **Fix:** Added 48-hour `.gte('created_at', ...)` filter and `.limit(200)`

8. **`sosStore.js`: `activeClusters` stale references after Realtime UPDATE**
   - `activeReports.value[index] = payload.new` replaced the array element but did not trigger Vue reactivity for computed properties that already held shallow copies of the old objects via `groups[bgy].push(report)`
   - **Fix:** Added `activeReports.value = [...activeReports.value]` after index assignment to force computed re-evaluation

9. **`sosStore.js`: `sortedQueue` crashes on non-object elements**
   - `.sort()` callback accessed `.status`, `.barangay`, `.created_at` without guarding for `null`/`undefined` elements
   - **Fix:** Added `.filter(Boolean)` before the sort spread

10. **`InsightDashboard.vue`: Realtime SOS subscription never activated**
    - `sosStore.fetchActiveReports()` was called in `onMounted` but `sosStore.subscribeToRealtimeSOS()` was never called. SOS-derived metrics (total SOS, resolution rate) were frozen at initial fetch time
    - **Fix:** Added `sosStore.subscribeToRealtimeSOS()` in `onMounted`

11. **`InsightDashboard.vue`: Aegis suggestions fetched once, no refresh**
    - `fetchAegisSuggestions()` was called once in `onMounted`. Operator actions on AegisPanel never updated dashboard metrics
    - **Fix:** Added 60-second polling interval for `fetchAegisSuggestions` with `clearInterval` cleanup in `onUnmounted`

#### Medium Severity

12. **`flowStore.js`: `zoneSeverity` logic duplicated with `mappedRiskLevel`**
    - Two separate functions implemented the same rainfall threshold logic but with different label spaces (`low/moderate/high` vs `watch/warning/danger`) and subtly inconsistent branching — guaranteed to diverge over time
    - **Fix:** Derived `zoneSeverity` as a `computed` from `mappedRiskLevel` via `{ low: 'watch', moderate: 'warning', high: 'danger' }` mapping; removed duplicated threshold branching from `updateThresholds`

13. **Edge Function: Double-defaulting on weather alert string**
    - `weather_alert || 'No active alert'` was passed to `buildPrompt`, but each prompt builder also had its own `|| 'No active weather alert'` — the per-builder default never fired
    - **Fix:** Pass `weather_alert` without caller-side default; let prompt builders handle it (they already have `|| 'No active weather alert'`)

14. **Edge Function: Unknown `scenario_type` silently defaulted to flood**
    - A misspelled or unsupported `scenario_type` (e.g., `"chemical_spill"`) would silently produce flood-specific recommendations with no indication of the mismatch
    - **Fix:** Added `console.warn()` in `buildPrompt()` dispatch

15. **`InsightDashboard.vue`: Null `created_at` → `NaN` → silent exclusion in WoW trend**
    - `new Date(r.created_at).getTime()` returns `NaN` when `created_at` is null. `NaN - now` evaluates to `NaN`, and `NaN < oneWeek` is `false` — records with missing dates were silently dropped from week-over-week calculations
    - **Fix:** Added `Number.isFinite` guard with ternary `r.created_at ? ... : NaN` pattern in both `trendAlerts` and `computeWoWTrend`

16. **`sosStore.js`: Null `created_at` sorted as epoch (1970)**
    - `Date.parse('')` returns `NaN`, `Number.isFinite` guard caught it and fell back to `0` — records with unknown timestamps sorted to absolute bottom
    - **Fix:** Fall back to `Date.now()` so unknown-timing records float to top (most urgent)

17. **Migration: Missing indexes on `outcome` and `related_sos_ids`**
    - InsightDashboard filters suggestions by `outcome` client-side after fetching all rows (no index). Array queries on `related_sos_ids` required sequential scans
    - **Fix:** Added `CREATE INDEX ... outcome` and `CREATE INDEX ... USING GIN related_sos_ids`

### Verification
- Production build passes clean (121 modules, 0 errors)
- All 5 scenarios invoke Aegis with correct parameters and display scenario-tagged recommendations
- `scenario_type` flows end-to-end: frontend selector → Edge Function body → Gemini prompt → response JSON → recommendation card badge + raw_inputs audit log
- SOS store no longer leaks intervals on HMR, fecthes are bounded, computed properties have null guards
- Dashboard SOS metrics stay fresh via Realtime subscription; Aegis metrics refresh every 60s
- Migration appends all new schema changes without modifying existing SQL

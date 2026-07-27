# Changelog

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

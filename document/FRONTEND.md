# Frontend Documentation

## Tech Stack

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: TailwindCSS 3 + custom dark theme
- **Maps**: Leaflet 1.9 + OpenStreetMap tiles
- **PWA**: Vite Plugin PWA + Workbox
- **Offline Storage**: idb (IndexedDB wrapper)
- **Icons**: Lucide Vue Next

## Project Structure

```
src/
  main.js                  # App entry point (Vue, Pinia, Router init)
  App.vue                  # Root component (<router-view> shell)
  assets/
    main.css               # Tailwind imports + dark theme + Leaflet overrides
  components/
    common/
      ConnectivityBanner.vue  # Online/degraded/offline status bar
    HotspotMap.vue            # Reusable incident density map
  composables/
    useCommunityReport.js     # Report form logic, CAPTCHA, throttle
    useGPS.js                 # Geolocation + IndexedDB caching
    useSOS.js                 # SOS dispatch (fetch/beacon + BackgroundSync)
    useWeather.js             # Weather fetcher (cache -> Supabase -> OWM -> fallback)
  layouts/
    AdminLayout.vue           # Operator portal shell (sidebar + nav + connectivity)
    CitizenLayout.vue         # Citizen app shell (bottom nav + GPS init)
  lib/
    supabase.js               # Supabase client singleton
  router/
    index.js                  # Routes: /app/* (citizen), /admin/* (operator)
  stores/
    authStore.js              # Supabase auth + admin_users profile
    connectivityStore.js      # Online/offline/degraded detection
    flowStore.js              # Flow Engine state (rainfall, severity, risk)
    guidesStore.js            # Markdown guides loader (import.meta.glob)
    reportStore.js            # Community reports + CRUD + Realtime
    sosStore.js               # SOS reports + queue + clusters + claims
    weatherStore.js           # Weather state + risk computation
  views/
    citizen/
      HomeView.vue            # Dashboard (weather, GPS, quick SOS, feature grid)
      SOSView.vue             # SOS dispatch page
      EvacMap.vue             # Evacuation route map
      FlowEngine.vue          # Predictive routing + flood zones + demo controls
      GuideList.vue           # Disaster guides listing
      GuideDetail.vue         # Single guide view (markdown renderer)
      CommunityReportForm.vue # Anonymous incident report form
    admin/
      LoginView.vue           # Operator login
      LiveSOSFeed.vue         # Real-time SOS queue + claim/resolve
      CommunityReportsView.vue # Reports table + AI triage + filters
      HotspotMap.vue          # Wrapper for HotspotMap component
      AegisPanel.vue          # AI advisory panel + outcome logging
      InsightDashboard.vue    # Operational metrics + AI insights
```

## Routing

| Path | Layout | Auth | Description |
|------|--------|------|-------------|
| `/app` | CitizenLayout | No | Citizen dashboard |
| `/app/sos` | CitizenLayout | No | SOS dispatch |
| `/app/map` | CitizenLayout | No | Evacuation map |
| `/app/flow` | CitizenLayout | No | Flow Engine |
| `/app/guides` | CitizenLayout | No | Guides list |
| `/app/guides/:id` | CitizenLayout | No | Guide detail |
| `/app/report` | CitizenLayout | No | Community report form |
| `/admin/login` | AdminLayout | No | Operator login |
| `/admin/sos-feed` | AdminLayout | Yes | Live SOS queue |
| `/admin/community-reports` | AdminLayout | Yes | Reports management |
| `/admin/hotspot-map` | AdminLayout | Yes | Hotspot map |
| `/admin/aegis` | AdminLayout | Yes | Aegis advisory panel |
| `/admin/insights` | AdminLayout | Yes | Insight dashboard |

## Pinia Stores

### authStore
- Manages Supabase Auth session and `admin_users` profile
- `login()` / `logout()` / `fetchProfile()`
- Computed: `isAuthenticated`, `assignedArea`, `userRole`

### connectivityStore
- Detects `online` / `degraded_signal` / `offline` states
- Monitors `navigator.connection.effectiveType` and RTT
- Computed: `mode`, `bannerConfig`

### sosStore
- `activeReports` array with real-time subscription
- `deliveryState` tracking (sending/queued/sent/error)
- `sortedQueue` computed (pending -> area match -> oldest)
- `activeClusters` computed (3+ reports same barangay in 30 min)
- `claimReport()` / `resolveReport()` with atomic status guards
- `checkStaleClaims()` reverts claims > 10 min

### reportStore
- `reports` array with real-time subscription
- Multi-field filtering (category, priority, status, plausibility, barangay, search)
- `submitReport()` inserts + invokes `classify-report` Edge Function
- `fetchReports()` / `updateReportStatus()` / `updatePlausibility()`

### flowStore
- `rainfallRate`, `zoneSeverity`, `activeRoute`, `floodZones`
- `mappedRiskLevel` computed from rainfall thresholds
- `updateThresholds(rainfall)` updates severity and timestamp
- `secondsAgo` computed for live ticker

### weatherStore
- Wraps `useWeather` composable
- `riskCategory` computed (watch/warning/danger)
- `fetchWeather()` syncs rainfall to `flowStore.updateThresholds()`

### guidesStore
- Loads all `src/guides/*.md` via `import.meta.glob` (eager)
- Parses YAML frontmatter from each markdown file
- `guides`, `activeGuide`, `guidesByCategory`, `getGuideById()`

## Composables

### useGPS
- `initGPS()`: acquires GPS, falls back to Santa Rosa center [14.3123, 121.1114]
- `refreshLocation()`: manual GPS refresh
- `startBackgroundRefresh()`: 60-second polling interval
- Caches coordinates in IndexedDB via `idb`

### useSOS
- `warmConnection()`: pre-warms TLS to Supabase
- `dispatchSOS()`: sends via `fetch` (Android, Workbox intercept) or `navigator.sendBeacon` (iOS)

### useCommunityReport
- Form state, Math CAPTCHA, 30s soft throttle
- Calls `reportStore.submitReport()`
- Exports `SANTA_ROSA_BARANGAYS` (18 barangays)

### useWeather
- Multi-tier cache: localStorage -> Supabase `weather_cache` (15min TTL) -> OpenWeatherMap API -> hardcoded fallback
- Returns: temperature, condition, rainfall rate, humidity, wind speed

## Key Components

### ConnectivityBanner
- Global status banner shown in both layouts
- Color-coded: green (online), amber (degraded), rose (offline)
- Dismiss button when online

### HotspotMap
- Leaflet map with scaled circle markers per barangay
- Layer toggles: SOS, Reports, City Boundary
- Color-coded severity legend
- Top Barangay Hotspots ranking sidebar

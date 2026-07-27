# AGAP Architecture

## Overview

**AGAP (Advance Guidance & Assistance Platform)** is a Progressive Web Application (PWA) for citizen disaster reporting and CDRRMO (City Disaster Risk Reduction and Management Office) response coordination in Santa Rosa City, Philippines.

## System Architecture (3-Layer)

```
+------------------------------------------------------------------+
|                        CLIENT (PWA)                               |
|  Vue 3 + Pinia + Vue Router + Leaflet + TailwindCSS               |
|  Service Worker (Workbox) + IndexedDB (idb) + Cache API           |
+------------------------------------------------------------------+
        |             |              |               |
        v             v              v               v
+---------------+ +----------+ +----------+ +----------------+
| Supabase Auth | |Supabase  | |OpenStreet| | OpenWeatherMap |
| (Email/Pass)  | |PostgREST | |Map Tiles | | API            |
+---------------+ +----------+ +----------+ +----------------+
        |             |              |
        v             v              v
+------------------------------------------------------------------+
|                     SUPABASE BACKEND                               |
|  PostgreSQL (7 tables) + Row-Level Security + Realtime             |
|  Edge Functions (Deno): classify-report, aegis-advisor, generate-  |
|  insight (call Gemini 2.0 Flash)                                   |
+------------------------------------------------------------------+
```

## Data Flow

### Citizen SOS Flow
```
Citizen taps SOS -> GPS acquired (cached/IndexedDB) -> raw fetch POST
  -> Workbox BackgroundSync intercepts if offline (queues to sos-queue)
  -> Supabase sos_reports table -> Realtime pushes to Admin SOS Feed
```

### Community Report Flow
```
Citizen fills form -> reportStore.submitReport()
  -> Supabase community_reports INSERT
  -> DB trigger invokes classify-report Edge Function
  -> Gemini 2.0 Flash classifies (category, priority, department, plausibility)
  -> Row updated in-place -> Realtime pushes to Admin Reports view
```

### Aegis Advisory Flow
```
Operator triggers Aegis -> SOS cluster + flood zone + weather collected
  -> aegis-advisor Edge Function called
  -> Gemini 2.0 Flash returns recommendation
  -> Operator Approves/Modifies/Rejects -> outcome logged to aegis_suggestions table
```

### Weather Data Flow
```
useWeather composable:
  1. Check localStorage cache
  2. Check Supabase weather_cache table (15-min TTL)
  3. Fetch live OpenWeatherMap API
  4. Fallback to hardcoded default data
```

### Flow Engine (Predictive Routing)
```
weatherStore.fetchWeather() -> rainfallRate -> flowStore.updateThresholds()
  -> mappedRiskLevel (low/moderate/high) computed from rainfall thresholds
  -> EvacMap and FlowEngine views react to risk level changes
  -> Route overlays filtered by risk level
```

## Key Design Decisions

- **Advisory-only Aegis**: Aegis never auto-acts; it recommends. Operator always gates.
- **Atomic Claims Mechanism**:
  - **Single-Operator Concurrency Guard**: SOS claims execute an atomic SQL update guarded by status:
    `UPDATE sos_reports SET status = 'responding', assigned_operator_id = opId, claimed_at = NOW() WHERE id = reportId AND status = 'pending';`
  - **Zero-Conflict Guarantee**: If two operators attempt to claim the exact same report concurrently, row-level locking ensures only the first query updates 1 row; the second query matches 0 rows and returns an `already_claimed` warning to the client without throwing DB errors or duplicating dispatches.
- **Stale Claim Reversion Daemon**:
  - Claims older than 10 minutes (`r.status === 'responding' && claimed_at < 10 mins ago`) are automatically reverted by `sosStore.checkStaleClaims()` to `pending` with `assigned_operator_id = null`.
  - Re-surfaces abandoned/stuck emergency alerts as unclaimed back to the live dispatch queue.
- **Offline-first**: Bundled GeoJSON (flood zones, evac routes, boundaries) and markdown guides serve as fallback when Supabase is unreachable.
- **Anonymous Reports**: Community reports don't require authentication; SOS uses a user_hash (localStorage) for deduplication.
- **No AI on critical path**: SOS dispatch never depends on AI availability. AI is advisory-only.

# Backend Documentation

## Supabase PostgreSQL Database

### Tables (7 total)

#### admin_users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK, FK to auth.users) | Primary key |
| email | TEXT | Admin email |
| role | TEXT | `superadmin` or `operator` |
| assigned_area | TEXT | Barangay assignment |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### sos_reports
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| latitude | DOUBLE PRECISION | GPS latitude |
| longitude | DOUBLE PRECISION | GPS longitude |
| barangay | TEXT | Barangay name |
| user_hash | TEXT | Anonymous user identifier |
| mode | TEXT | `online` or `degraded_signal` |
| status | TEXT | `pending`, `responding`, or `resolved` |
| claimed_by | UUID (Nullable, FK) | Operator who claimed |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### community_reports
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| raw_description | TEXT | Citizen description |
| barangay | TEXT | Barangay name |
| ai_category | TEXT | `bullying`, `infrastructure`, `environment`, `mental_health` |
| ai_priority | TEXT | `low`, `medium`, `high`, `critical` |
| ai_department | TEXT | Assigned department |
| ai_reasoning | TEXT | AI classification reasoning |
| ai_plausibility | TEXT | `plausible`, `uncertain`, `implausible` |
| status | TEXT | `open`, `in_review`, `resolved`, `dismissed` |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### evac_routes
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| name | TEXT | Route name |
| barangay | TEXT | Barangay |
| geojson | JSONB | LineString geometry |
| risk_level | TEXT | `low`, `moderate`, or `high` |

#### flood_zones
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| zone_name | TEXT | Zone name |
| severity | TEXT | `watch`, `warning`, or `danger` |
| geojson | JSONB | Polygon geometry |

#### weather_cache
| Column | Type | Description |
|--------|------|-------------|
| location_key | TEXT (UNIQUE) | Location identifier |
| data | JSONB | Weather data payload |
| cached_at | TIMESTAMPTZ | Cache timestamp |

#### aegis_suggestions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| related_sos_ids | UUID[] | Related SOS report IDs |
| recommended_action | TEXT | Aegis recommendation |
| target_barangay | TEXT | Target barangay |
| reasoning | TEXT | Step-by-step reasoning |
| confidence | TEXT | `high`, `medium`, or `low` |
| raw_inputs | JSONB | Input data snapshot |
| outcome | TEXT (Nullable) | `approved`, `modified`, or `rejected` |
| operator_id | UUID (Nullable, FK) | Operator who acted |
| created_at | TIMESTAMPTZ | Creation timestamp |

### Row-Level Security

20 RLS policies across all tables enforcing:
- **Anonymous INSERT** on `sos_reports` and `community_reports`
- **Authenticated SELECT/UPDATE** for admin operations
- **Public read** on `evac_routes`, `flood_zones`, `weather_cache`

### Realtime Publication

Tables added to `supabase_realtime`:
- `sos_reports`
- `community_reports`
- `aegis_suggestions`

## Edge Functions (Deno/TypeScript)

### classify-report
- **Trigger**: Called by client after community report INSERT
- **Input**: `{ raw_description, barangay }`
- **Output**: `{ ai_category, ai_priority, ai_department, ai_reasoning, ai_plausibility }`
- **AI**: Gemini 2.0 Flash via server-to-server fetch
- **Fallback**: Default triage (`infrastructure`/`medium`) if Gemini unavailable
- **Action**: Updates `community_reports` row in-place via service role key

### aegis-advisor
- **Trigger**: Called by AegisPanel when operator requests advisory
- **Input**: SOS cluster data + flood zone severity + weather alert
- **Output**: `{ recommended_action, target_barangay, reasoning, confidence, raw_inputs }`
- **AI**: Gemini 2.0 Flash (system prompt: advisory-only, never auto-act)
- **Fallback**: Graceful error message when unconfigured

### generate-insight
- **Trigger**: Called by InsightDashboard for 30-day summary
- **Input**: `{ reports_summary }` (aggregated counts)
- **Output**: `{ summary, trends[], recommendations[] }`
- **AI**: Gemini 2.0 Flash
- **Fallback**: Hardcoded summary text when unavailable

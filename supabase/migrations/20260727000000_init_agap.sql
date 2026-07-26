-- Migration: 20260727000000_init_agap.sql
-- Description: AGAP Database Infrastructure Initial Schema (7 Tables + RLS Policies + Realtime)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Admin Users (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('superadmin', 'operator')),
  assigned_area   TEXT NOT NULL DEFAULT 'all'      -- barangay name or 'all'
);

-- 2. SOS Reports (Core Emergency Feed)
CREATE TABLE IF NOT EXISTS public.sos_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude              DECIMAL(10,8) NOT NULL,
  longitude             DECIMAL(11,8) NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responding', 'resolved')),
  mode                  TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online', 'degraded_signal')),
  user_hash             TEXT,
  barangay              TEXT,
  assigned_operator_id  UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  claimed_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Community Reports (Anonymous Submissions with AI Triage)
CREATE TABLE IF NOT EXISTS public.community_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_description TEXT NOT NULL,
  barangay        TEXT,
  ai_category     TEXT CHECK (ai_category IN ('bullying', 'infrastructure', 'environment', 'mental_health')),
  ai_priority     TEXT CHECK (ai_priority IN ('low', 'medium', 'high', 'critical')),
  ai_department   TEXT,
  ai_reasoning    TEXT,
  ai_plausibility TEXT CHECK (ai_plausibility IN ('plausible', 'uncertain', 'implausible')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Evacuation Routes (Pre-loaded GeoJSON)
CREATE TABLE IF NOT EXISTS public.evac_routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  barangay        TEXT NOT NULL,
  geojson         JSONB NOT NULL,
  risk_level      TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high'))
);

-- 5. Flood Zone Overlays (Flow Engine Demo)
CREATE TABLE IF NOT EXISTS public.flood_zones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name       TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'watch' CHECK (severity IN ('watch', 'warning', 'danger')),
  geojson         JSONB NOT NULL,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Weather Cache (OpenWeatherMap API Cache)
CREATE TABLE IF NOT EXISTS public.weather_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key    TEXT UNIQUE NOT NULL,
  data            JSONB NOT NULL,
  cached_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Aegis Suggestion Log (AI Advisory Outcomes)
CREATE TABLE IF NOT EXISTS public.aegis_suggestions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_sos_ids     UUID[] DEFAULT '{}',
  recommended_action  TEXT NOT NULL,
  target_barangay     TEXT,
  reasoning           TEXT NOT NULL,
  raw_inputs          JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome             TEXT CHECK (outcome IN ('approved', 'modified', 'rejected')),
  operator_id         UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

-- INDEXES for Query Optimization & Atomic Claim Performance
CREATE INDEX IF NOT EXISTS idx_sos_reports_status_created ON public.sos_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_reports_barangay ON public.sos_reports(barangay);
CREATE INDEX IF NOT EXISTS idx_community_reports_status_priority ON public.community_reports(status, ai_priority);
CREATE INDEX IF NOT EXISTS idx_aegis_suggestions_created ON public.aegis_suggestions(created_at DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all 7 tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evac_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aegis_suggestions ENABLE ROW LEVEL SECURITY;

-- 1. admin_users RLS
CREATE POLICY "Allow authenticated read admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow self insert admin_users"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow self update admin_users"
  ON public.admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. sos_reports RLS
CREATE POLICY "Allow anonymous insert sos_reports"
  ON public.sos_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select sos_reports"
  ON public.sos_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update sos_reports"
  ON public.sos_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. community_reports RLS
CREATE POLICY "Allow anonymous insert community_reports"
  ON public.community_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated select community_reports"
  ON public.community_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update community_reports"
  ON public.community_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. evac_routes RLS
CREATE POLICY "Allow public select evac_routes"
  ON public.evac_routes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated write evac_routes"
  ON public.evac_routes FOR ALL
  TO authenticated
  USING (true);

-- 5. flood_zones RLS
CREATE POLICY "Allow public select flood_zones"
  ON public.flood_zones FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated write flood_zones"
  ON public.flood_zones FOR ALL
  TO authenticated
  USING (true);

-- 6. weather_cache RLS
CREATE POLICY "Allow public select weather_cache"
  ON public.weather_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert weather_cache"
  ON public.weather_cache FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update weather_cache"
  ON public.weather_cache FOR UPDATE
  TO anon, authenticated
  USING (true);

-- 7. aegis_suggestions RLS
CREATE POLICY "Allow authenticated select aegis_suggestions"
  ON public.aegis_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert aegis_suggestions"
  ON public.aegis_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update aegis_suggestions"
  ON public.aegis_suggestions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SUPABASE REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.aegis_suggestions;
